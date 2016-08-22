/* 'use strict'; */

var MYTIMEOUT = 12000;

var DEFAULT_SIZE = 5000000; // max to avoid popup in safari/ios

var isWP8 = /IEMobile/.test(navigator.userAgent); // Matches WP(7/8/8.1)
var isWindows = /Windows /.test(navigator.userAgent); // Windows
var isAndroid = !isWindows && /Android/.test(navigator.userAgent);

// NOTE: In the core-master branch there is no difference between the default
// implementation and implementation #2. But the test will also apply
// the androidLockWorkaround: 1 option in the case of implementation #2.
var scenarioList = [
  isAndroid ? 'Plugin-implementation-default' : 'Plugin',
  'HTML5',
  'Plugin-implementation-2'
];

var scenarioCount = (!!window.hasWebKitBrowser) ? (isAndroid ? 3 : 2) : 1;

var mytests = function() {

  for (var i=0; i<scenarioCount; ++i) {

    describe(scenarioList[i] + ': tx sql results test(s)', function() {
      var scenarioName = scenarioList[i];
      var suiteName = scenarioName + ': ';
      var isWebSql = (i === 1);
      var isImpl2 = (i === 2);

      // NOTE: MUST be defined in function scope, NOT outer scope:
      var openDatabase = function(name, ignored1, ignored2, ignored3) {
        if (isImpl2) {
          return window.sqlitePlugin.openDatabase({
            // prevent reuse of database from default db implementation:
            name: 'i2-'+name,
            androidDatabaseImplementation: 2,
            androidLockWorkaround: 1,
            location: 1
          });
        }
        if (isWebSql) {
          return window.openDatabase(name, '1.0', 'Test', DEFAULT_SIZE);
        } else {
          return window.sqlitePlugin.openDatabase({name: name, location: 0});
        }
      }

      it(suiteName + 'US-ASCII String manipulation results test',
        function(done) {
          var db = openDatabase('ASCII-string-results-test.db', '1.0', 'Test', DEFAULT_SIZE);

          expect(db).toBeDefined();

          db.transaction(function(tx) {

            expect(tx).toBeDefined();

            tx.executeSql("SELECT UPPER('Some US-ASCII text') AS uppertext", [], function(tx, res) {
              console.log('res.rows.item(0).uppertext: ' + res.rows.item(0).uppertext);
              expect(res.rows.item(0).uppertext).toEqual('SOME US-ASCII TEXT');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

      // NOTE: This test is ONLY for the following Android scenarios:
      // 1. Web SQL test (Android 5.x/+)
      // 2. Cordova-sqlcipher-adapter version of this plugin
      if (isAndroid)
        it(suiteName + 'Android ICU-UNICODE string manipulation test', function(done) {
          if (isWebSql && /Android [1-4]/.test(navigator.userAgent)) pending('SKIP for Android versions 1.x-4.x Web SQL');
          if (!isWebSql) pending('SKIP for plugin');

          var db = openDatabase('ICU-UNICODE-string-manipulation-results-test.db', '1.0', 'Test', DEFAULT_SIZE);

          expect(db).toBeDefined();

          db.transaction(function(tx) {

            expect(tx).toBeDefined();

            // 'Some Cyrillic text'
            tx.executeSql("SELECT UPPER('Какой-то кириллический текст') AS uppertext", [], function (tx, res) {
              console.log('res.rows.item(0).uppertext: ' + res.rows.item(0).uppertext);
              expect(res.rows.item(0).uppertext).toEqual('КАКОЙ-ТО КИРИЛЛИЧЕСКИЙ ТЕКСТ');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        });

        it(suiteName + 'Simple INSERT results test: check insertId & rowsAffected in result', function(done) {

          var db = openDatabase('INSERT-results-test.db', '1.0', 'Test', DEFAULT_SIZE);

          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)');

            tx.executeSql('INSERT INTO test_table (data, data_num) VALUES (?,?)', ['test', 100], function(tx, res) {
              expect(res).toBeDefined();
              expect(res.insertId).toBeDefined();
              expect(res.rowsAffected).toBe(1);

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          });
        }, MYTIMEOUT);

        it(suiteName + 'basic db sql transaction results test', function(done) {

          var db = openDatabase('basic-db-sql-tx-results-test.db', '1.0', 'Test', DEFAULT_SIZE);

          expect(db).toBeDefined();

          var check_count = 0;

          db.transaction(function(tx) {
            // first tx object:
            expect(tx).toBeDefined();

            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)');

            tx.executeSql('INSERT INTO test_table (data, data_num) VALUES (?,?)', ['test', 100], function(tx, res) {
              // check tx & res object parameters:
              expect(tx).toBeDefined();
              expect(res).toBeDefined();

              expect(res.insertId).toBeDefined();
              expect(res.rowsAffected).toBe(1);

              db.transaction(function(tx) {
                // second tx object:
                expect(tx).toBeDefined();

                tx.executeSql('SELECT COUNT(id) AS cnt FROM test_table;', [], function(tx, res) {
                  ++check_count;

                  expect(res.rows.length).toBe(1);
                  expect(res.rows.item(0).cnt).toBe(1);
                });

                tx.executeSql('SELECT data_num FROM test_table;', [], function(tx, res) {
                  ++check_count;

                  expect(res.rows.length).toBe(1);
                  expect(res.rows.item(0).data_num).toBe(100);
                });

                tx.executeSql('SELECT data FROM test_table;', [], function(tx, res) {
                  ++check_count;

                  expect(res.rows.length).toBe(1);
                  expect(res.rows.item(0).data).toBe('test');
                });

                tx.executeSql('UPDATE test_table SET data_num = ? WHERE data_num = 100', [101], function(tx, res) {
                  ++check_count;

                  expect(res.rowsAffected).toBe(1);
                });

                tx.executeSql('SELECT data_num FROM test_table;', [], function(tx, res) {
                  ++check_count;

                  expect(res.rows.length).toBe(1);
                  expect(res.rows.item(0).data_num).toBe(101);
                });

                tx.executeSql("DELETE FROM test_table WHERE data LIKE 'tes%'", [], function(tx, res) {
                  ++check_count;

                  expect(res.rowsAffected).toBe(1);
                });

                tx.executeSql('SELECT data_num FROM test_table;', [], function(tx, res) {
                  ++check_count;

                  expect(res.rows.length).toBe(0);
                });

              }, function(e) {
                // not expected:
                expect(false).toBe(true);
                expect(JSON.stringify(e)).toBe('---');
                done();
              }, function() {
                console.log('second tx ok success cb');
                expect(check_count).toBe(7);

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });

            }, function(e) {
              // not expected:
              expect(false).toBe(true);
              expect(JSON.stringify(e)).toBe('---');
              done();
            });
          }, function(e) {
            // not expected:
            expect(false).toBe(true);
            expect(JSON.stringify(e)).toBe('---');
            done();
          });

        }, MYTIMEOUT);

        it(suiteName + 'db transaction result object lifetime', function(done) {
          var db = openDatabase('db-tx-result-lifetime-test.db', '1.0', 'Test', DEFAULT_SIZE);

          expect(db).toBeDefined();

          var check_count = 0;

          var store_data_text = null;
          var store_rows = null;
          var store_row_item = null;

          db.transaction(function(tx) {
            // first tx object:
            expect(tx).toBeDefined();

            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)');

            tx.executeSql('INSERT INTO test_table (data, data_num) VALUES (?,?)', ['test', 100], function(tx, res) {
              // check tx & res object parameters:
              expect(tx).toBeDefined();
              expect(res).toBeDefined();

              expect(res.insertId).toBeDefined();
              expect(res.rowsAffected).toBe(1);

              db.transaction(function(tx) {
                // second tx object:
                expect(tx).toBeDefined();

                tx.executeSql('SELECT COUNT(id) AS cnt FROM test_table;', [], function(tx, res) {
                  ++check_count;

                  expect(res.rows.length).toBe(1);
                  expect(res.rows.item(0).cnt).toBe(1);
                });

                tx.executeSql('SELECT data_num FROM test_table;', [], function(tx, res) {
                  ++check_count;

                  expect(res.rows.length).toBe(1);
                  expect(res.rows.item(0).data_num).toBe(100);
                });

                tx.executeSql('SELECT data FROM test_table;', [], function(tx, res) {
                  ++check_count;

                  expect(res.rows.length).toBe(1);
                  expect(res.rows.item(0).data).toBe('test');
                  store_data_text = res.rows.item(0).data;
                  expect(store_data_text).toBe('test');
                });

                tx.executeSql('UPDATE test_table SET data_num = ? WHERE data_num = 100', [101], function(tx, res) {
                  ++check_count;

                  expect(res.rowsAffected).toBe(1);
                });

                tx.executeSql('SELECT data_num FROM test_table;', [], function(tx, res) {
                  ++check_count;

                  expect(res.rows.length).toBe(1);
                  expect(res.rows.item(0).data_num).toBe(101);
                });

                tx.executeSql('SELECT * FROM test_table;', [], function(tx, res) {
                  ++check_count;

                  expect(res.rows.length).toBe(1);
                  expect(res.rows.item(0).data_num).toBe(101);
                  expect(res.rows.item(0).data).toBe('test');

                  store_rows = res.rows;
                  expect(store_rows.item(0).data_num).toBe(101);
                  expect(store_rows.item(0).data).toBe('test');
                });

                tx.executeSql('SELECT * FROM test_table;', [], function(tx, res) {
                  ++check_count;

                  expect(store_rows.item(0).data_num).toBe(101);
                  expect(store_rows.item(0).data).toBe('test');

                  expect(res.rows.length).toBe(1);
                  expect(res.rows.item(0).data_num).toBe(101);
                  expect(res.rows.item(0).data).toBe('test');

                  store_row_item = res.rows.item(0);
                  expect(store_row_item.data_num).toBe(101);
                  expect(store_row_item.data).toBe('test');
                });

                tx.executeSql('SELECT * FROM test_table;', [], function(tx, res) {
                  ++check_count;

                  expect(res.rows.length).toBe(1);

                  expect(res.rows.item(0).data_num).toBe(101);
                  expect(res.rows.item(0).data).toBe('test');

                  var temp1 = res.rows.item(0);
                  var temp2 = res.rows.item(0);

                  expect(temp1.data).toBe('test');
                  expect(temp2.data).toBe('test');

                  // Object from rows.item is immutable in Web SQL but NOT in this plugin:
                  temp1.data = 'another';

                  if (isWebSql) {
                    // Web SQL STANDARD:
                    // 1. this is a native object that is NOT affected by the change:
                    expect(temp1.data).toBe('test');
                    // 2. object returned by second resultSet.rows.item call not affected:
                    expect(temp2.data).toBe('test');
                  } else {
                    // PLUGIN:
                    // 1. DEVIATION - temp1 is just like any other Javascript object:
                    expect(temp1.data).toBe('another');
                    // 2. DEVIATION - same object is returned by second resultSet.rows.item IS affected:
                    expect(temp2.data).toBe('another');
                  }
                });

                tx.executeSql("DELETE FROM test_table WHERE data LIKE 'tes%'", [], function(tx, res) {
                  ++check_count;

                  expect(res.rowsAffected).toBe(1);
                });

                tx.executeSql('SELECT data_num FROM test_table;', [], function(tx, res) {
                  ++check_count;

                  expect(res.rows.length).toBe(0);
                });

              }, function(e) {
                // not expected:
                expect(false).toBe(true);
                expect(JSON.stringify(e)).toBe('---');
                done();
              }, function() {
                console.log('second tx ok success cb');
                expect(check_count).toBe(10);

                expect(store_rows.item(0).data).toBe('test');

                expect(store_data_text).toBe('test');
                expect(store_row_item.data).toBe('test');

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });

            }, function(e) {
              // not expected:
              expect(false).toBe(true);
              expect(JSON.stringify(e)).toBe('---');
              done();
            });
          }, function(e) {
            // not expected:
            expect(false).toBe(true);
            expect(JSON.stringify(e)).toBe('---');
            done();
          // not check_counted:
          //}, function() {
          //  console.log('first tx success cb OK');
          });

        }, MYTIMEOUT);

        it(suiteName + 'tx sql starting with extra space results test', function(done) {
          if (isWP8) pending('BROKEN for WP8');

          var db = openDatabase('tx-sql-starting-with-extra-space-results-test.db', '1.0', 'Test', DEFAULT_SIZE);

          expect(db).toBeDefined();

          var check_count = 0;

          db.transaction(function(tx) {
            // first tx object:
            expect(tx).toBeDefined();

            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)');

            tx.executeSql(' INSERT INTO test_table (data, data_num) VALUES (?,?)', ['test', 100], function(tx, res) {
              // check tx & res object parameters:
              expect(tx).toBeDefined();
              expect(res).toBeDefined();

              expect(res.insertId).toBeDefined();
              expect(res.rowsAffected).toBe(1);

              db.transaction(function(tx) {
                // second tx object:
                expect(tx).toBeDefined();

                tx.executeSql(' SELECT COUNT(id) AS cnt FROM test_table;', [], function(tx, res) {
                  ++check_count;

                  expect(res.rows.length).toBe(1);
                  expect(res.rows.item(0).cnt).toBe(1);
                });

                tx.executeSql('  SELECT data_num FROM test_table;', [], function(tx, res) {
                  ++check_count;

                  expect(res.rows.length).toBe(1);
                  expect(res.rows.item(0).data_num).toBe(100);
                });

                tx.executeSql('   SELECT data FROM test_table;', [], function(tx, res) {
                  ++check_count;

                  expect(res.rows.length).toBe(1);
                  expect(res.rows.item(0).data).toBe('test');
                });

                tx.executeSql('  UPDATE test_table SET data_num = ? WHERE data_num = 100', [101], function(tx, res) {
                  ++check_count;

                  expect(res.rowsAffected).toBe(1);
                });

                tx.executeSql('   SELECT data_num FROM test_table;', [], function(tx, res) {
                  ++check_count;

                  expect(res.rows.length).toBe(1);
                  expect(res.rows.item(0).data_num).toBe(101);
                });

                tx.executeSql(" DELETE FROM test_table WHERE data LIKE 'tes%'", [], function(tx, res) {
                  ++check_count;

                  expect(res.rowsAffected).toBe(1);
                });

                tx.executeSql('  SELECT data_num FROM test_table;', [], function(tx, res) {
                  ++check_count;

                  expect(res.rows.length).toBe(0);
                });

              }, function(e) {
                // not expected:
                expect(false).toBe(true);
                expect(JSON.stringify(e)).toBe('---');
                done();
              }, function() {
                console.log('second tx ok success cb');
                expect(check_count).toBe(7);

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });

            }, function(e) {
              // not expected:
              expect(false).toBe(true);
              expect(JSON.stringify(e)).toBe('---');
              done();
            });
          }, function(e) {
            // not expected:
            expect(false).toBe(true);
            expect(JSON.stringify(e)).toBe('---');
            done();
          });

        }, MYTIMEOUT);

        it(suiteName + 'tx sql starting with extra semicolon results test', function(done) {
          // XXX [BUG #458] BROKEN for android.database & WP8
          if (isWP8) pending('BROKEN for WP8');
          if (isAndroid && isImpl2) pending('BROKEN for android.database implementation');

          var db = openDatabase('tx-sql-starting-with-extra-semicolon-results-test.db', '1.0', 'Test', DEFAULT_SIZE);

          expect(db).toBeDefined();

          var check_count = 0;

          db.transaction(function(tx) {
            // first tx object:
            expect(tx).toBeDefined();

            tx.executeSql(';DROP TABLE IF EXISTS test_table');
            tx.executeSql('; CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)');

            tx.executeSql(';INSERT INTO test_table (data, data_num) VALUES (?,?)', ['test', 100], function(tx, res) {
              // check tx & res object parameters:
              expect(tx).toBeDefined();
              expect(res).toBeDefined();

              expect(res.insertId).toBeDefined();
              expect(res.rowsAffected).toBe(1);

              db.transaction(function(tx) {
                // second tx object:
                expect(tx).toBeDefined();

                tx.executeSql(';SELECT COUNT(id) AS cnt FROM test_table;', [], function(tx, res) {
                  ++check_count;

                  expect(res.rows.length).toBe(1);
                  expect(res.rows.item(0).cnt).toBe(1);
                });

                tx.executeSql('; SELECT data_num FROM test_table;', [], function(tx, res) {
                  ++check_count;

                  expect(res.rows.length).toBe(1);
                  expect(res.rows.item(0).data_num).toBe(100);
                });

                tx.executeSql(';; SELECT data FROM test_table;', [], function(tx, res) {
                  ++check_count;

                  expect(res.rows.length).toBe(1);
                  expect(res.rows.item(0).data).toBe('test');
                });

                tx.executeSql('; ;UPDATE test_table SET data_num = ? WHERE data_num = 100', [101], function(tx, res) {
                  ++check_count;

                  expect(res.rowsAffected).toBe(1);
                });

                tx.executeSql(' ; SELECT data_num FROM test_table;', [], function(tx, res) {
                  ++check_count;

                  expect(res.rows.length).toBe(1);
                  expect(res.rows.item(0).data_num).toBe(101);
                });

                tx.executeSql(";DELETE FROM test_table WHERE data LIKE 'tes%'", [], function(tx, res) {
                  ++check_count;

                  expect(res.rowsAffected).toBe(1);
                });

                tx.executeSql('; SELECT data_num FROM test_table;', [], function(tx, res) {
                  ++check_count;

                  expect(res.rows.length).toBe(0);
                });

              }, function(e) {
                // not expected:
                expect(false).toBe(true);
                expect(JSON.stringify(e)).toBe('---');
                done();
              }, function() {
                console.log('second tx ok success cb');
                expect(check_count).toBe(7);

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });

            }, function(e) {
              // not expected:
              expect(false).toBe(true);
              expect(JSON.stringify(e)).toBe('---');
              done();
            });
          }, function(e) {
            // not expected:
            expect(false).toBe(true);
            expect(JSON.stringify(e)).toBe('---');
            done();
          });

        }, MYTIMEOUT);

      if (!isWebSql) // NOT supported by Web SQL:
        it(suiteName + 'Multi-row INSERT with parameters - NOT supported by Web SQL', function(done) {
          if (isWP8) pending('NOT SUPPORTED for WP8');

          var db = openDatabase('Multi-row-INSERT-with-parameters-test.db', '1.0', 'Test', DEFAULT_SIZE);

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS TestTable;');
            tx.executeSql('CREATE TABLE TestTable (x,y);');

            tx.executeSql('INSERT INTO TestTable VALUES (?,?),(?,?)', ['a',1,'b',2], function(ignored1, ignored2) {
              tx.executeSql('SELECT * FROM TestTable', [], function(ignored, resultSet) {
                // EXPECTED: CORRECT RESULT:
                expect(resultSet.rows.length).toBe(2);
                expect(resultSet.rows.item(0).x).toBe('a');
                expect(resultSet.rows.item(0).y).toBe(1);
                expect(resultSet.rows.item(1).x).toBe('b');
                expect(resultSet.rows.item(1).y).toBe(2);

                // Close (plugin only - always the case in this test) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });
            });
          }, function(e) {
            // ERROR RESULT (NOT EXPECTED):
            expect(false).toBe(true);
            expect(e).toBeDefined();

            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

      if (!isWebSql) // NOT covered by Web SQL standard:
        it(suiteName + 'INSERT statement list (NOT covered by Web SQL standard) - Plugin BROKEN', function(done) {
          var db = openDatabase('INSERT-statement-list-test.db', '1.0', 'Test', DEFAULT_SIZE);

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS TestList;');
            tx.executeSql('CREATE TABLE TestList (data);');

            // NOT supported by Web SQL, plugin BROKEN:
            tx.executeSql('INSERT INTO TestList VALUES (1); INSERT INTO TestList VALUES(2);');
          }, function(e) {
            // ERROR RESULT (expected for Web SQL):
            if (!isWebSql)
              expect('Plugin behavior changed').toBe('--');
            expect(e).toBeDefined();

            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          }, function() {
            if (isWebSql)
              expect('Unexpected result for Web SQL').toBe('--');

            db.transaction(function(tx2) {
              tx2.executeSql('SELECT * FROM TestList', [], function(ignored, resultSet) {
                // CORRECT RESULT for plugin:
                //expect(resultSet.rows.length).toBe(2);
                // ACTUAL RESULT for plugin:
                expect(resultSet.rows.length).toBe(1);

                // FIRST ROW CORRECT:
                expect(resultSet.rows.item(0).data).toBe(1);
                // SECOND ROW MISSING:
                //expect(resultSet.rows.item(1).data).toBe(2);

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });
            });
          });
        }, MYTIMEOUT);

      if (!isWebSql) // NOT covered by Web SQL standard:
        it(suiteName + 'First result from SELECT statement list - NOT covered by Web SQL standard', function(done) {
          var db = openDatabase('First-result-from-SELECT-statement-list-test.db', '1.0', 'Test', DEFAULT_SIZE);

          db.transaction(function(tx) {
            // NOT supported by Web SQL:
            tx.executeSql('SELECT UPPER (?) AS upper1; SELECT 1', ['Test string'], function(ignored, resultSet) {
              if (isWebSql)
                expect('Unexpected result for Web SQL').toBe('--');

              expect(resultSet.rows.length).toBe(1); // ACTUAL RESULT for plugin
              expect(resultSet.rows.item(0).upper1).toBe('TEST STRING');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            }, function(ignored, e) {
              // ERROR RESULT (expected for Web SQL):
              if (!isWebSql)
                expect('Plugin behavior changed').toBe('--');

              expect(e).toBeDefined();

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

        it(suiteName + 'BLOB inserted as a literal', function(done) {
          var db = openDatabase('Literal-BLOB-INSERT-test.db', '1.0', 'Test', DEFAULT_SIZE);

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS TestTable;');
            tx.executeSql('CREATE TABLE TestTable (x);');

            tx.executeSql("INSERT INTO TestTable VALUES (X'010203')", [], function(ignored1, ignored2) {
              tx.executeSql('SELECT HEX(x) AS hex_value FROM TestTable', [], function(ignored, resultSet) {
                // EXPECTED: CORRECT RESULT:
                expect(resultSet).toBeDefined();
                expect(resultSet.rows).toBeDefined();
                expect(resultSet.rows.length).toBe(1);
                expect(resultSet.rows.item(0).hex_value).toBe('010203');

                // Close (plugin only - always the case in this test) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });
            });
          }, function(e) {
            // ERROR RESULT (NOT EXPECTED):
            expect(false).toBe(true);
            expect(e).toBeDefined();

            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'INSERT with SELECT', function(done) {
          if (isAndroid && isImpl2) pending('BUG with android.database implementation');

          var db = openDatabase('INSERT-with-SELECT-test.db', '1.0', 'Test', DEFAULT_SIZE);

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS tt1;');
            tx.executeSql('DROP TABLE IF EXISTS tt2;');

            tx.executeSql('CREATE TABLE tt1 (data);');
            tx.executeSql('CREATE TABLE tt2 (data);');

            tx.executeSql('INSERT INTO tt1 VALUES (?)', ['test-value-1']);
            tx.executeSql('INSERT INTO tt1 VALUES (?)', ['test-value-2']);

            // THANKS for GUIDANCE: http://www.tutorialspoint.com/sqlite/sqlite_insert_query.htm
            tx.executeSql('INSERT INTO tt2 SELECT data FROM tt1;', [], function(ignored1, rs1) {
              // EXPECTED: CORRECT RESULT:
              expect(rs1).toBeDefined();
              expect(rs1.insertId).toBeDefined();
              expect(rs1.rowsAffected).toBeDefined();
              if (!(isAndroid && isImpl2))
                expect(rs1.rowsAffected).toBe(2);

              tx.executeSql('SELECT * FROM tt2', [], function(ignored, rs2) {
                // EXPECTED: CORRECT RESULT:
                expect(rs2).toBeDefined();
                expect(rs2.rows).toBeDefined();
                expect(rs2.rows.length).toBe(2);
                expect(rs2.rows.item(0).data).toBe('test-value-1');
                expect(rs2.rows.item(1).data).toBe('test-value-2');

                // Close (plugin only - always the case in this test) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });
            });
          }, function(e) {
            // ERROR RESULT (NOT EXPECTED):
            expect(false).toBe(true);
            expect(e).toBeDefined();

            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'INSERT with TRIGGER', function(done) {
          if (isAndroid && isImpl2) pending('BUG with android.database implementation');
          if (isWP8) pending('SKIP (NOT SUPPORTED) for WP8'); // NOT SUPPORTED for WP8

          var db = openDatabase('INSERT-with-TRIGGER-test.db', '1.0', 'Test', DEFAULT_SIZE);

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS tt1;');
            tx.executeSql('DROP TABLE IF EXISTS tt2;');

            tx.executeSql('CREATE TABLE tt1 (data);');
            tx.executeSql('CREATE TABLE tt2 (data);');

            // THANKS for GUIDANCE: http://www.tutorialspoint.com/sqlite/sqlite_triggers.htm
            tx.executeSql("CREATE TRIGGER t1 AFTER INSERT ON tt1 BEGIN INSERT INTO tt2 VALUES(datetime('now')); END;");

            tx.executeSql('INSERT INTO tt1 VALUES (?)', ['test-value'], function(ignored1, rs1) {
              // EXPECTED: CORRECT RESULT:
              expect(rs1).toBeDefined();
              expect(rs1.insertId).toBeDefined();
              expect(rs1.rowsAffected).toBeDefined();
              if (!(isAndroid && isImpl2))
                expect(rs1.rowsAffected).toBe(2);

              tx.executeSql('SELECT count(*) AS cnt FROM tt2', [], function(ignored, rs2) {
                // EXPECTED: CORRECT RESULT:
                expect(rs2).toBeDefined();
                expect(rs2.rows).toBeDefined();
                expect(rs2.rows.length).toBe(1);
                expect(rs2.rows.item(0).cnt).toBeDefined();
                expect(rs2.rows.item(0).cnt).toBe(1);

                // Close (plugin only - always the case in this test) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });
            });
          }, function(e) {
            // ERROR RESULT (NOT EXPECTED):
            expect(false).toBe(true);
            expect(e).toBeDefined();

            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'ALTER TABLE ADD COLUMN test', function(done) {
          var dbname = 'ALTER-TABLE-ADD-COLUMN-test.db';
          var createdb = openDatabase(dbname, '1.0', 'Test', DEFAULT_SIZE);

          createdb.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS TestTable;');
            tx.executeSql('CREATE TABLE TestTable (data1);');

            tx.executeSql('INSERT INTO TestTable VALUES (?)', ['test-value-1']);
          }, function(e) {
            // ERROR RESULT (NOT EXPECTED):
            expect(false).toBe(true);
            expect(e).toBeDefined();

            // Close (plugin only) & finish:
            (isWebSql) ? done() : createdb.close(done, done);
          }, function() {
            if (isWebSql) {
              addColumnTest();
            } else {
              createdb.close(addColumnTest, function(e) {
                // ERROR RESULT (NOT EXPECTED):
                expect(false).toBe(true);
                expect(e).toBeDefined();
              });
            }
          });

          function addColumnTest() {
            var db = openDatabase(dbname, '1.0', 'Test', DEFAULT_SIZE);

            db.transaction(function(tx) {
              tx.executeSql('ALTER TABLE TestTable ADD COLUMN data2;');
              tx.executeSql('UPDATE TestTable SET data2=?;', ['test-value-2']);

              tx.executeSql('SELECT * FROM TestTable', [], function(ignored, resultSet) {
                // EXPECTED: CORRECT RESULT:
                expect(resultSet).toBeDefined();
                expect(resultSet.rows).toBeDefined();
                expect(resultSet.rows.length).toBe(1);
                expect(resultSet.rows.item(0).data1).toBe('test-value-1');
                expect(resultSet.rows.item(0).data2).toBe('test-value-2');

                // Close (plugin only - always the case in this test) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });
            }, function(e) {
              // ERROR RESULT (NOT EXPECTED):
              expect(false).toBe(true);
              expect(e).toBeDefined();

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          }
        }, MYTIMEOUT);

        it(suiteName + 'ALTER TABLE RENAME test', function(done) {
          var dbname = 'ALTER-TABLE-RENAME-test.db';
          var createdb = openDatabase(dbname, '1.0', 'Test', DEFAULT_SIZE);

          createdb.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS TestTable;');
            tx.executeSql('DROP TABLE IF EXISTS tt2;');
            tx.executeSql('CREATE TABLE TestTable (data1);');

            tx.executeSql('INSERT INTO TestTable VALUES (?)', ['test-value-1']);
          }, function(e) {
            // ERROR RESULT (NOT EXPECTED):
            expect(false).toBe(true);
            expect(e).toBeDefined();

            // Close (plugin only) & finish:
            (isWebSql) ? done() : createdb.close(done, done);
          }, function() {
            if (isWebSql) {
              tableRenameTest();
            } else {
              createdb.close(tableRenameTest, function(e) {
                // ERROR RESULT (NOT EXPECTED):
                expect(false).toBe(true);
                expect(e).toBeDefined();
              });
            }
          });

          function tableRenameTest() {
            var db = openDatabase(dbname, '1.0', 'Test', DEFAULT_SIZE);

            db.transaction(function(tx) {
              tx.executeSql('ALTER TABLE TestTable RENAME TO tt2;');

              tx.executeSql('SELECT * FROM tt2', [], function(ignored, resultSet) {
                // EXPECTED: CORRECT RESULT:
                expect(resultSet).toBeDefined();
                expect(resultSet.rows).toBeDefined();
                expect(resultSet.rows.length).toBe(1);
                expect(resultSet.rows.item(0).data1).toBe('test-value-1');

                // Close (plugin only - always the case in this test) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });
            }, function(e) {
              // ERROR RESULT (NOT EXPECTED):
              expect(false).toBe(true);
              expect(e).toBeDefined();

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          }
        }, MYTIMEOUT);

        // FUTURE TODO more +/- INFINITY, NAN tests

        it(suiteName + "SELECT abs('9e999') (Infinity) result test", function(done) {
          if (isWP8) pending('SKIP for WP(8)');
          if (isAndroid && !isWebSql) pending('SKIP for Android plugin');
          if (!isWP8 && !isWindows && !isAndroid && !isWebSql) pending('SKIP for iOS plugin');

          var db = openDatabase('Infinite-results-test.db', '1.0', 'Test', DEFAULT_SIZE);

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT abs(?) AS absResult', ['9e999'], function(tx, res) {
              expect(res).toBeDefined();
              expect(res.rows).toBeDefined();
              expect(res.rows.length).toBe(1);
              expect(res.rows.item(0).absResult).toBeDefined();
              expect(res.rows.item(0).absResult).toBe(Infinity);

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          });
        }, MYTIMEOUT);

    });

  }

}

if (window.hasBrowser) mytests();
else exports.defineAutoTests = mytests;

/* vim: set expandtab : */
