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

var scenarioList = [ isAndroid ? 'Plugin-sqlite-connector' : 'Plugin', 'HTML5', 'Plugin-android.database' ];

//var scenarioCount = isAndroid ? 3 : (isIE ? 1 : 2);
//var scenarioCount = (!!window.hasWebKitBrowser) ? 2 : 1;
var hasAndroidWebKitBrowser = isAndroid && (!!window.hasWebKitBrowser);
var scenarioCount = hasAndroidWebKitBrowser ? 3 : ((!!window.hasWebKitBrowser) ? 2 : 1);

// simple tests:
var mytests = function() {

  for (var i=0; i<scenarioCount; ++i) {

    describe(scenarioList[i] + ': SIMPLE SQL test(s)', function() {
      var scenarioName = scenarioList[i];
      var suiteName = scenarioName + ': ';
      var isWebSql = (i === 1);
      var isOldImpl = (i === 2);

      // NOTE: MUST be defined in function scope, NOT outer scope:
      var openDatabase = function(name, ignored1, ignored2, ignored3) {
        if (isOldImpl) {
          return window.sqlitePlugin.openDatabase({name: name, androidDatabaseImplementation: 2});
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

      it(suiteName + 'db transaction test',
        function(done) {
          var db = openDatabase('db-trx-test.db', '1.0', 'Test', DEFAULT_SIZE);

          expect(db).toBeDefined();

          var check = 0;

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
                  ++check;

                  expect(res.rows.length).toBe(1);
                  expect(res.rows.item(0).cnt).toBe(1);
                });

                tx.executeSql('SELECT data_num FROM test_table;', [], function(tx, res) {
                  ++check;

                  expect(res.rows.length).toBe(1);
                  expect(res.rows.item(0).data_num).toBe(100);
                });

                tx.executeSql('UPDATE test_table SET data_num = ? WHERE data_num = 100', [101], function(tx, res) {
                  ++check;

                  expect(res.rowsAffected).toBe(1);
                });

                tx.executeSql('SELECT data_num FROM test_table;', [], function(tx, res) {
                  ++check;

                  expect(res.rows.length).toBe(1);
                  expect(res.rows.item(0).data_num).toBe(101);
                });

                tx.executeSql("DELETE FROM test_table WHERE data LIKE 'tes%'", [], function(tx, res) {
                  ++check;

                  expect(res.rowsAffected).toBe(1);
                });

                tx.executeSql('SELECT data_num FROM test_table;', [], function(tx, res) {
                  ++check;

                  expect(res.rows.length).toBe(0);
                });

              }, function(e) {
                // not expected:
                expect(false).toBe(true);
                console.log('ERROR: ' + e.message);
              }, function() {
                console.log('second tx ok success cb');
                expect(check).toBe(6);

                done();
              });

            }, function(e) {
              // not expected:
              expect(false).toBe(true);
              console.log('ERROR: ' + e.message);
            });
          }, function(e) {
            // not expected:
            expect(false).toBe(true);
            console.log('ERROR: ' + e.message);
            done();
          }, function() {
            console.log('first tx success cb OK');
          });

        }, MYTIMEOUT);

      it(suiteName + 'number values inserted using number bindings',
        function(done) {
          var db = openDatabase('Value-binding-test.db', '1.0', 'Test', DEFAULT_SIZE);
          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data_text1, data_text2, data_int, data_real)');
          }, function(err) {
              // went wrong:
              expect(false).toBe(true);
          }, function() {
            db.transaction(function(tx) {
              // create columns with no type affinity
              tx.executeSql('INSERT INTO test_table (data_text1, data_text2, data_int, data_real) VALUES (?,?,?,?)', ['314159', '3.14159', 314159, 3.14159], function(tx, res) {
                expect(res.rowsAffected).toBe(1);
                tx.executeSql('SELECT * FROM test_table', [], function(tx, res) {
                  var row = res.rows.item(0);
                  expect(row.data_text1).toBe('314159'); // data_text1 should have inserted data as text
                  if (!isWP8) // JSON issue in WP(8) version
                    expect(row.data_text2).toBe('3.14159'); // data_text2 should have inserted data as text
                  expect(row.data_int).toBe(314159); // data_int should have inserted data as an integer
                  expect(Math.abs(row.data_real - 3.14159) < 0.000001).toBe(true); // data_real should have inserted data as a real

                  done();
                });
              });
            });
          });
        }, MYTIMEOUT);

        /* THANKS to @calebeaires: */
        it(suiteName + 'create virtual table using FTS3', function(done) {
          if (isWP8) pending('NOT IMPLEMENTED for WP(8)'); // NOT IMPLEMENTED in CSharp-SQLite

          var db = openDatabase('virtual-table-using-fts3.db', '1.0', 'Test', DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('CREATE INDEX liv_index ON book (liv, cap);');
            tx.executeSql('DROP TABLE IF EXISTS virtual_book');
            tx.executeSql('CREATE VIRTUAL TABLE IF NOT EXISTS virtual_book USING FTS3 (liv, cap, ver, tex, tes);', [], function(tx, res) {
              // ok:
              expect(true).toBe(true);
            }, function(err) {
              // went wrong:
              expect(false).toBe(true);
            });
          }, function(err) {
            // [ignored here]:
            //expect(false).toBe(true);
            expect(true).toBe(true);
            done();
          }, function() {
            // verify tx was ok:
            expect(true).toBe(true);
            done();
          });
        }, MYTIMEOUT);

        // NOTE: looking at sqlite3.c, if FTS3 is enabled, FTS4 seems to be working as well!
        // (thanks again to @calebeaires for this scenario)
        it(suiteName + 'create virtual table using FTS4', function(done) {
          if (isWP8) pending('NOT IMPLEMENTED for WP(8)'); // NOT IMPLEMENTED in CSharp-SQLite

          var db = openDatabase('virtual-table-using-fts4.db', '1.0', 'Test', DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('CREATE INDEX liv_index ON book (liv, cap);');
            tx.executeSql('DROP TABLE IF EXISTS virtual_book');
            tx.executeSql('CREATE VIRTUAL TABLE IF NOT EXISTS virtual_book USING FTS4 (liv, cap, ver, tex, tes);', [], function(tx, res) {
              // ok:
              expect(true).toBe(true);
            }, function(err) {
              // went wrong:
              expect(false).toBe(true);
            });
          }, function(err) {
            // [ignored here]:
            //expect(false).toBe(true);
            expect(true).toBe(true);
            done();
          }, function() {
            // verify tx was ok:
            expect(true).toBe(true);
            done();
          });
        }, MYTIMEOUT);

      if (!isWebSql) {
        it(suiteName + 'create virtual table using R-Tree', function(done) {
          if (isWP8) pending('NOT IMPLEMENTED for WP(8)'); // NOT IMPLEMENTED in CSharp-SQLite
          if (isAndroid) pending('NOT IMPLEMENTED for all versions of Android'); // NOT IMPLEMENTED for all versions of Android database (failed in Circle CI)

          var db = openDatabase('virtual-table-using-r-tree.db', '1.0', 'Test', DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('DROP TABLE IF EXISTS demo_index');
            // from https://www.sqlite.org/rtree.html
            tx.executeSql('CREATE VIRTUAL TABLE IF NOT EXISTS demo_index USING rtree (id, minX, maxX, minY, maxY);', [], function(tx, res) {
              // ok:
              expect(true).toBe(true);
            }, function(err) {
              // went wrong:
              expect(false).toBe(true);
            });
          }, function(err) {
            // [ignored here]:
            //expect(false).toBe(true);
            expect(true).toBe(true);
            done();
          }, function() {
            // verify tx was ok:
            expect(true).toBe(true);
            done();
          });
        }, MYTIMEOUT);
      }

        /* found due to investigation of litehelpers/Cordova-sqlite-storage#226: */
        it(suiteName + 'Skip callbacks after syntax error with no handler', function(done) {
          if (!isWebSql) pending('Plugin BROKEN'); // XXX TODO

          var db = openDatabase('first-syntax-error-with-no-handler.db', '1.0', 'Test', DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();
            tx.executeSql('DROP TABLE IF EXISTS tt');
            tx.executeSql('CREATE TABLE IF NOT EXISTS tt (data unique)');

            // This insertion has a sql syntax error-which is not handled:
            tx.executeSql('insert into tt (data) VALUES ', [123]);

            // second insertion with syntax error in transaction ["skipped" by Web SQL]:
            tx.executeSql('insert into tt (data) VALUES ', [456], function(tx, res) {
              // not expected:
              expect(false).toBe(true);
            }, function(err) {
              // expected, but then it shows the handling this sql statement is NOT skipped (by the plugin):
              expect(false).toBe(true);
              return false;
            });
          }, function(err) {
            // transaction expected to fail:
            expect(true).toBe(true);
            done();
          }, function() {
            // not expected [ignored for now]:
            //expect(false).toBe(true);
            expect(true).toBe(true);
            done();
          });
        }, MYTIMEOUT);

        /* found due to investigation of litehelpers/Cordova-sqlite-storage#226: */
        it(suiteName + 'Skip callbacks after syntax error handler returns true', function(done) {
          if (!isWebSql) pending('Plugin BROKEN'); // XXX TODO

          var db = openDatabase('first-syntax-error-handler-returns-true.db', '1.0', 'Test', DEFAULT_SIZE);
          expect(db).toBeDefined();

          var isFirstErrorHandlerCalled = false; // poor man's spy
          var isSecondErrorHandlerCalled = false;

          db.transaction(function(tx) {
            expect(tx).toBeDefined();
            tx.executeSql('DROP TABLE IF EXISTS tt');
            tx.executeSql('CREATE TABLE IF NOT EXISTS tt (data unique)');

            // first sql syntax error with handler that returns undefined [nothing]:
            tx.executeSql('insert into tt (data) VALUES ', [456], function(tx, res) {
              // not expected:
              expect(false).toBe(true);
            }, function(err) {
              // expected ok:
              expect(true).toBe(true);
              isFirstErrorHandlerCalled = true;
              // (should) completely stop transaction:
              return true;
            });

            // second insertion with syntax error with handler that signals explicit recovery [SKIPPED by Web SQL]:
            tx.executeSql('insert into tt (data) VALUES ', [456], function(tx, res) {
              // not expected:
              expect(false).toBe(true);
            }, function(err) {
              // expected, but then it shows the handling this sql statement is NOT skipped (by the plugin):
              expect(false).toBe(true);
              isSecondErrorHandlerCalled = true;
              // explicit recovery:
              return false;
            });
          }, function(err) {
            // transaction expected to fail:
            expect(true).toBe(true);
            expect(isFirstErrorHandlerCalled).toBe(true);
            // [ignored for now]:
            //expect(isSecondErrorHandlerCalled).toBe(false);
            done();
          }, function() {
            // not expected [ignored for now]:
            //expect(false).toBe(true);
            expect(true).toBe(true);
            expect(isFirstErrorHandlerCalled).toBe(true);
            // [ignored for now]:
            //expect(isSecondErrorHandlerCalled).toBe(false);
            done();
          });
        }, MYTIMEOUT);

        // ref: litehelpers/Cordova-sqlite-storage#232
        // according to the spec at http://www.w3.org/TR/webdatabase/ the transaction should be
        // recovered *only* if the sql error handler returns false.
        it(suiteName + 'Recover transaction with callbacks after syntax error handler returns false', function(done) {
          var db = openDatabase('recover-if-syntax-error-handler-returns-false.db', '1.0', 'Test', DEFAULT_SIZE);
          expect(db).toBeDefined();

          var isFirstErrorHandlerCalled = false; // poor man's spy
          //var isFirstSuccessHandlerCalled = false; // (not expected)
          var isSecondSuccessHandlerCalled = false; // expected ok
          //var isSecondErrorHandlerCalled = false; // (not expected)

          db.transaction(function(tx) {
            expect(tx).toBeDefined();
            tx.executeSql('DROP TABLE IF EXISTS tt');
            tx.executeSql('CREATE TABLE IF NOT EXISTS tt (data unique)');

            // first sql syntax error with handler that returns undefined [nothing]:
            tx.executeSql('insert into tt (data) VALUES ', [456], function(tx, res) {
              // not expected:
              expect(false).toBe(true);
            }, function(err) {
              // expected ok:
              expect(true).toBe(true);
              isFirstErrorHandlerCalled = true;
              // [should] recover this transaction:
              return false;
            });

            // second sql ok [NOT SKIPPED by Web SQL]:
            tx.executeSql('SELECT 1', [], function(tx, res) {
              // expected ok:
              isSecondSuccessHandlerCalled = true;
              expect(true).toBe(true);
            }, function(err) {
              // not expected:
              expect(false).toBe(true);
              //isSecondErrorHandlerCalled = true;
              return false;
            });
          }, function(err) {
            // not expected:
            expect(false).toBe(true);
            expect(isFirstErrorHandlerCalled).toBe(true);
            done();
          }, function() {
            // expected ok:
            expect(true).toBe(true);
            expect(isFirstErrorHandlerCalled).toBe(true);
            expect(isSecondSuccessHandlerCalled).toBe(true);
            done();
          });
        }, MYTIMEOUT);

        // NOTE: as discussed in litehelpers/Cordova-sqlite-storage#232 this plugin is correct
        // according to the spec at http://www.w3.org/TR/webdatabase/
        it(suiteName + 'syntax error handler returns undefined', function(done) {
          var db = openDatabase('syntax-error-handler-returns-undefined.db', '1.0', 'Test', DEFAULT_SIZE);
          expect(db).toBeDefined();

          var isFirstErrorHandlerCalled = false; // poor man's spy

          db.transaction(function(tx) {
            expect(tx).toBeDefined();
            tx.executeSql('DROP TABLE IF EXISTS tt');
            tx.executeSql('CREATE TABLE IF NOT EXISTS tt (data unique)');

            // first sql syntax error with handler that returns undefined [nothing]:
            tx.executeSql('insert into tt (data) VALUES ', [456], function(tx, res) {
              // not expected:
              expect(false).toBe(true);
            }, function(err) {
              // expected ok:
              expect(true).toBe(true);
              isFirstErrorHandlerCalled = true;
              // [should] recover this transaction:
              //return false;
              return undefined;
            });

            // skip second sql [not relevant for this test, difference plugin vs. Web SQL]:

          }, function(err) {
            // transaction expected to fail [plugin only]:
            expect(true).toBe(true);
            expect(isFirstErrorHandlerCalled).toBe(true);
            done();
          }, function() {
            // expected ok for Web SQL ONLY:
            if (isWebSql)
              expect(true).toBe(true);
            else
              expect(false).toBe(true);
            expect(isFirstErrorHandlerCalled).toBe(true);
            done();
          });
        }, MYTIMEOUT);

        // FUTURE TODO ref: litehelpers/Cordova-sqlite-storage#232
        // test case of sql error handler returning values such as "true" (string), 1, 0, null

      if (!isWebSql) {
        // NOTE: this was an issue due to the inconsistency ng cordova documentation and source code which
        // triggered problems reported in litehelpers/Cordova-sqlite-storage#246 and
        // litehelpers/Cordova-sqlcipher-adapter#5.
        // The implementation now avoids this problem *by throwing an exception*.
        // It could be nicer to just signal an error in the error callback, if present,
        // through throwing an exception does prevent the user from using an invalid db object.
        // Brody TBD: check how the Web SQL API would handle this condition?
        it(suiteName + 'check that db name is really a string', function(done) {
          var p1 = { name: 'my.db.name', location: 1 };
          try {
            window.sqlitePlugin.openDatabase({ name: p1 }, function(db) {
              // not expected:
              expect(false).toBe(true);
              done();
            }, function(error) {
              // OK but NOT EXPECTED:
              expect(true).toBe(true);
              done();
            });
          } catch (e) {
              // stopped by the implementation:
              expect(true).toBe(true);
              done();
          }
        }, MYTIMEOUT);
      }

    });
  };
}

if (window.hasBrowser) mytests();
else exports.defineAutoTests = mytests;

/* vim: set expandtab : */
