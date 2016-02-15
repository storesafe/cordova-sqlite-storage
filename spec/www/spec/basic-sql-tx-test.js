/* 'use strict'; */

var MYTIMEOUT = 12000;

var DEFAULT_SIZE = 5000000; // max to avoid popup in safari/ios

var isAndroid = /Android/.test(navigator.userAgent);
var isWP8 = /IEMobile/.test(navigator.userAgent); // Matches WP(7/8/8.1)
//var isWindows = /Windows NT/.test(navigator.userAgent); // Windows [NT] (8.1)
var isWindows = /Windows /.test(navigator.userAgent); // Windows (8.1)
//var isWindowsPC = /Windows NT/.test(navigator.userAgent); // Windows [NT] (8.1)
//var isWindowsPhone_8_1 = /Windows Phone 8.1/.test(navigator.userAgent); // Windows Phone 8.1
//var isIE = isWindows || isWP8 || isWindowsPhone_8_1;
var isIE = isWindows || isWP8;
var isWebKit = !isIE; // TBD [Android or iOS]

// NOTE: In the core-master branch there is no difference between the default
// implementation and implementation #2. But the test will also apply
// the androidLockWorkaround: 1 option in the case of implementation #2.
var scenarioList = [
  isAndroid ? 'Plugin-implementation-default' : 'Plugin',
  'HTML5',
  'Plugin-implementation-2'
];

var scenarioCount = (!!window.hasWebKitBrowser) ? (isAndroid ? 3 : 2) : 1;

// simple tests:
var mytests = function() {

  for (var i=0; i<scenarioCount; ++i) {

    describe(scenarioList[i] + ': Basic sql tx test(s)', function() {
      var scenarioName = scenarioList[i];
      var suiteName = scenarioName + ': ';
      var isWebSql = (i === 1);
      var isOldImpl = (i === 2);

      // NOTE: MUST be defined in function scope, NOT outer scope:
      var openDatabase = function(name, ignored1, ignored2, ignored3) {
        if (isOldImpl) {
          return window.sqlitePlugin.openDatabase({
            // prevent reuse of database from default db implementation:
            name: 'i2-'+name,
            androidDatabaseImplementation: 2,
            androidLockWorkaround: 1
          });
        }
        if (isWebSql) {
          return window.openDatabase(name, '1.0', 'Test', DEFAULT_SIZE);
        } else {
          return window.sqlitePlugin.openDatabase(name, '1.0', 'Test', DEFAULT_SIZE);
        }
      }

      it(suiteName + 'US-ASCII String manipulation test',
        function(done) {
          var db = openDatabase('ASCII-string-test.db', '1.0', 'Test', DEFAULT_SIZE);

          expect(db).toBeDefined();

          db.transaction(function(tx) {

            expect(tx).toBeDefined();

            tx.executeSql("SELECT UPPER('Some US-ASCII text') AS uppertext", [], function(tx, res) {
              console.log('res.rows.item(0).uppertext: ' + res.rows.item(0).uppertext);
              expect(res.rows.item(0).uppertext).toEqual('SOME US-ASCII TEXT');

              done();
            });
          });
        }, MYTIMEOUT);

      // Only test ICU-UNICODE with Android 5.0(+) (Web SQL):
      if (isWebSql && /Android [5-9]/.test(navigator.userAgent))
        it(suiteName + 'ICU-UNICODE string manipulation test', function(done) {
          if ((!isWebSql) && isAndroid) pending('BROKEN for Android version of plugin [with sqlite-connector]');

          var db = openDatabase('UNICODE-string-test.db', '1.0', 'Test', DEFAULT_SIZE);

          expect(db).toBeDefined();

          db.transaction(function(tx) {

            expect(tx).toBeDefined();

            // 'Some Cyrillic text'
            tx.executeSql("SELECT UPPER('Какой-то кириллический текст') AS uppertext", [], function (tx, res) {
              console.log('res.rows.item(0).uppertext: ' + res.rows.item(0).uppertext);
              expect(res.rows.item(0).uppertext).toEqual('КАКОЙ-ТО КИРИЛЛИЧЕСКИЙ ТЕКСТ');

              done();
            });
          });
        });

        it(suiteName + 'Simple INSERT test: check insertId & rowsAffected in result', function(done) {

          var db = openDatabase('INSERT-test.db', '1.0', 'Test', DEFAULT_SIZE);

          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)');

            tx.executeSql('INSERT INTO test_table (data, data_num) VALUES (?,?)', ['test', 100], function(tx, res) {
              expect(res).toBeDefined();
              expect(res.insertId).toBeDefined();
              expect(res.rowsAffected).toBe(1);

              done();
            });

          });
        }, MYTIMEOUT);

      it(suiteName + 'basic db transaction test',
        function(done) {
          var db = openDatabase('basic-db-tx-test.db', '1.0', 'Test', DEFAULT_SIZE);

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
                expect(JSON.stringify(e).toBe('---'));
                done();
              }, function() {
                console.log('second tx ok success cb');
                expect(check_count).toBe(7);

                done();
              });

            }, function(e) {
              // not expected:
              expect(false).toBe(true);
              expect(JSON.stringify(e).toBe('---'));
              done();
            });
          }, function(e) {
            // not expected:
            expect(false).toBe(true);
            expect(JSON.stringify(e).toBe('---'));
            done();
          // not check_counted:
          //}, function() {
          //  console.log('first tx success cb OK');
          });

        }, MYTIMEOUT);

      it(suiteName + 'db transaction result object lifetime',
        function(done) {
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
                  // changes to temp2 should NOT change temp1:
                  var temp2 = res.rows.item(0);

                  expect(temp1.data).toBe('test');
                  expect(temp2.data).toBe('test');

                  temp1.data = 'another';

                  if (isWebSql) {
                    // apparently this is a native object that does NOT keep the change:
                    expect(temp1.data).toBe('test');
                    // correct:
                    expect(temp2.data).toBe('test');
                  } else {
                    // [plugin] temp1 is just like any other Javascript object:
                    expect(temp1.data).toBe('another');

                    // correct:
                    //expect(temp2.data).toBe('test');
                    // actual:
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
                expect(JSON.stringify(e).toBe('---'));
                done();
              }, function() {
                console.log('second tx ok success cb');
                expect(check_count).toBe(10);

                expect(store_rows.item(0).data).toBe('test');

                expect(store_data_text).toBe('test');
                expect(store_row_item.data).toBe('test');

                done();
              });

            }, function(e) {
              // not expected:
              expect(false).toBe(true);
              expect(JSON.stringify(e).toBe('---'));
              done();
            });
          }, function(e) {
            // not expected:
            expect(false).toBe(true);
            expect(JSON.stringify(e).toBe('---'));
            done();
          // not check_counted:
          //}, function() {
          //  console.log('first tx success cb OK');
          });

        }, MYTIMEOUT);

    });

  }

}

if (window.hasBrowser) mytests();
else exports.defineAutoTests = mytests;

/* vim: set expandtab : */
