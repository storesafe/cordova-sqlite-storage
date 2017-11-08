/* 'use strict'; */

var MYTIMEOUT = 20000;

var DEFAULT_SIZE = 5000000; // max to avoid popup in safari/ios

var isWP8 = /IEMobile/.test(navigator.userAgent); // Matches WP(7/8/8.1)
var isWindows = /Windows /.test(navigator.userAgent); // Windows
var isAndroid = !isWindows && /Android/.test(navigator.userAgent);

// NOTE: While in certain version branches there is no difference between
// the default Android implementation and implementation #2,
// this test script will also apply the androidLockWorkaround: 1 option
// in case of implementation #2.
var scenarioList = [
  isAndroid ? 'Plugin-implementation-default' : 'Plugin',
  'HTML5',
  'Plugin-implementation-2'
];

var scenarioCount = (!!window.hasWebKitBrowser) ? (isAndroid ? 3 : 2) : 1;

var mytests = function() {

  for (var i=0; i<scenarioCount; ++i) {

    describe(scenarioList[i] + ': detailed tx error handling test(s)', function() {
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

      describe(scenarioList[i] + ': tx error semantics test(s)', function() {

        /* found due to investigation of litehelpers/Cordova-sqlite-storage#226: */
        it(suiteName + 'SKIP SQL CALLBACKS after syntax error with no handler', function(done) {
          var db = openDatabase('first-syntax-error-with-no-handler.db', '1.0', 'Test', DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();
            tx.executeSql('DROP TABLE IF EXISTS tt');
            tx.executeSql('CREATE TABLE IF NOT EXISTS tt (data unique)');

            // This insertion has a SQL syntax error which is not handled:
            tx.executeSql('INSERT INTO tt (data) VALUES ', [123]);

            // SECOND SQL - SKIPPED by Web SQL and this plugin:
            tx.executeSql('SELECT 1', [], function(tx, res) {
              // NOT EXPECTED:
              expect(false).toBe(true);
            }, function(ignored, error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              expect(error.message).toBe('--');
              // DO NOT RECOVER:
              return true;
            });

          }, function(error) {
            // EXPECTED RESULT:
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.message).toBeDefined();

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else if (isWebSql && isAndroid)
              expect(true).toBe(true); // SKIP for now
            else
              expect(error.code).toBe(5);

            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);

          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        /* found due to investigation of litehelpers/Cordova-sqlite-storage#226: */
        it(suiteName + 'SKIP SQL CALLBACKS after syntax error handler returns true', function(done) {
          var db = openDatabase('first-syntax-error-handler-returns-true.db', '1.0', 'Test', DEFAULT_SIZE);
          expect(db).toBeDefined();

          var isFirstErrorHandlerCalled = false; // poor man's spy

          db.transaction(function(tx) {
            expect(tx).toBeDefined();
            tx.executeSql('DROP TABLE IF EXISTS tt');
            tx.executeSql('CREATE TABLE IF NOT EXISTS tt (data unique)');

            // FIRST SQL syntax error with handler that returns true (should completely stop transaction):
            tx.executeSql('INSERT INTO tt (data) VALUES ', [456], function(ignored1, ignored2) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              expect(error.message).toBe('--');
            }, function(ignored, error) {
              // EXPECTED RESULT:
              expect(error).toBeDefined();
              expect(error.code).toBeDefined();
              expect(error.message).toBeDefined();
              isFirstErrorHandlerCalled = true;
              // [SHOULD] completely stop transaction:
              return true;
            });

            // SECOND SQL - SKIPPED by Web SQL and this plugin:
            tx.executeSql('SELECT 1', [], function(ignored1, ignored2) {
              // NOT EXPECTED:
              expect(false).toBe(true);
            }, function(ignored, error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              expect(error.message).toBe('--');
              // DO NOT RECOVER:
              return true;
            });

          }, function(error) {
            // EXPECTED RESULT:
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.message).toBeDefined();
            expect(isFirstErrorHandlerCalled).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);

          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(isFirstErrorHandlerCalled).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        // ref: litehelpers/Cordova-sqlite-storage#232
        // according to the spec at http://www.w3.org/TR/webdatabase/ the transaction should be
        // recovered *only* if the sql error handler returns false.
        it(suiteName + 'Recover transaction with callbacks after syntax error handler returns false', function(done) {
          var db = openDatabase('recover-if-syntax-error-handler-returns-false.db', '1.0', 'Test', DEFAULT_SIZE);
          expect(db).toBeDefined();

          var isFirstErrorHandlerCalled = false; // poor man's spy
          var isSecondSuccessHandlerCalled = false; // expected ok

          db.transaction(function(tx) {
            expect(tx).toBeDefined();
            tx.executeSql('DROP TABLE IF EXISTS tt');
            tx.executeSql('CREATE TABLE IF NOT EXISTS tt (data unique)');

            // FIRST SQL syntax error with handler that returns false:
            tx.executeSql('insert into tt (data) VALUES ', [456], function(ignored1, ignored2) {
              // NOT EXPECTED:
              expect(false).toBe(true);
            }, function(ignored, error) {
              // EXPECTED RESULT:
              expect(error).toBeDefined();
              expect(error.code).toBeDefined();
              expect(error.message).toBeDefined();
              isFirstErrorHandlerCalled = true;
              // [SHOULD] recover this transaction:
              return false;
            });

            // SECOND SQL OK [NOT SKIPPED by Web SQL or plugin]:
            tx.executeSql('SELECT 1', [], function(ignored, rs) {
              // EXPECTED RESULT:
              isSecondSuccessHandlerCalled = true;
              expect(rs).toBeDefined();
            }, function(ignored, error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              expect(error.message).toBe('--');
              return false;
            });

          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            expect(isFirstErrorHandlerCalled).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);

          }, function() {
            // EXPECTED RESULT:
            expect(isFirstErrorHandlerCalled).toBe(true);
            expect(isSecondSuccessHandlerCalled).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        // NOTE: as discussed in litehelpers/Cordova-sqlite-storage#232 this plugin is correct
        // according to the spec at http://www.w3.org/TR/webdatabase/
        it(suiteName + 'syntax error handler returns undefined' +
           (isWebSql ? ' (DEVIATION in WebKit Web SQL implementation)' : ' (Plugin COMPLIANT)'), function(done) {
          var dbname = 'syntax-error-handler-returns-undefined.db';

          var db = openDatabase(dbname, '1.0', 'Test', DEFAULT_SIZE);
          expect(db).toBeDefined();

          var isFirstErrorHandlerCalled = false; // poor man's spy
          var isSecondSuccessHandlerCalled = false; // expected ok

          db.transaction(function(tx) {
            expect(tx).toBeDefined();
            tx.executeSql('DROP TABLE IF EXISTS tt');
            tx.executeSql('CREATE TABLE IF NOT EXISTS tt (data unique)');

            // FIRST SQL syntax error with handler that returns undefined [nothing]:
            tx.executeSql('INSERT INTO tt (data) VALUES ', [456], function(ignored1, ignored2) {
              // NOT EXPECTED:
              expect(false).toBe(true);
            }, function(ignored, error) {
              // EXPECTED RESULT:
              expect(error).toBeDefined();
              expect(error.code).toBeDefined();
              expect(error.message).toBeDefined();
              isFirstErrorHandlerCalled = true;
              // Should NOT recover this transaction according to Web SQL spec:
              return undefined;
            });

            // SECOND SQL - Web SQL ONLY [DEVIATION]:
            tx.executeSql('SELECT 1', [], function(ignored, rs) {
              // EXPECTED RESULT: OK for WebKit Web SQL implementation ONLY:
              if (!isWebSql)
                expect(false).toBe(true);
              isSecondSuccessHandlerCalled = true;
              expect(rs).toBeDefined();
            }, function(ignored, error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              expect(error.message).toBe('--');
              return false;
            });

          }, function(error) {
            // EXPECTED RESULT: TRANSACTION FAILURE [Plugin ONLY]
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.message).toBeDefined();
            if (isWebSql)
              expect('WebKit Web SQL behavior changed, please update this test').toBe('--');
            expect(isFirstErrorHandlerCalled).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);

          }, function() {
            // EXPECTED RESULT: OK for WebKit Web SQL implementation ONLY:
            if (!isWebSql)
              expect(false).toBe(true);
            expect(isFirstErrorHandlerCalled).toBe(true);
            if (isWebSql && !isSecondSuccessHandlerCalled)
              expect('WebKit Web SQL behavior changed, please update this test').toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'STOP nested transaction if syntax error handler returns true', function(done) {
          var db = openDatabase('stop-nested-tx-if-syntax-error-handler-returns-true.db', '1.0', 'Test', DEFAULT_SIZE);
          expect(db).toBeDefined();

          // poor man's spy:
          var isFirstSuccessHandlerCalled = false;
          var isFirstErrorHandlerCalled = false;
          var isFirstNestedErrorHandlerCalled = false;

          db.transaction(function(tx) {
            tx.executeSql('SELECT 1', [], function(ignored, rs) {
              // EXPECTED RESULT:
              expect(rs).toBeDefined();
              isFirstSuccessHandlerCalled = true;

              // NESTED:
              tx.executeSql('SELCT 1', [], function(ignored1, ignored2) {
                // NOT EXPECTED:
                expect(false).toBe(true);
              }, function(ignored, error) {
                // NOT EXPECTED:
                expect(false).toBe(true);
                expect(error.message).toBe('--');
                // DO NOT RECOVER:
                return true;
              });

            }, function(error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              expect(error.message).toBe('--');
              return true;
            });

            // FIRST SQL syntax error with handler that returns true (STOP the transaction):
            tx.executeSql('SELCT 1', [], function(ignored1, ignored2) {
              // NOT EXPECTED:
              expect(false).toBe(true);
            }, function(ignored, error) {
              // EXPECTED RESULT:
              expect(error).toBeDefined();
              expect(error.code).toBeDefined();
              expect(error.message).toBeDefined();
              isFirstErrorHandlerCalled = true;
              // STOP the transaction:
              return true;
            });

            // SECOND SQL - SKIPPED by Web SQL and this plugin:
            tx.executeSql('SELECT 1', [], function(ignored1, ignored2) {
              // NOT EXPECTED:
              expect(false).toBe(true);
            }, function(ignored, error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              expect(error.message).toBe('--');
              // DO NOT RECOVER
              return true;
            });

          }, function(error) {
            // EXPECTED RESULT:
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.message).toBeDefined();
            expect(isFirstErrorHandlerCalled).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);

          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(isFirstErrorHandlerCalled).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'transaction ends with error if success callback throws [TBD (WebKit) Web SQL vs plugin error message]', function(done) {
          var db = openDatabase('transaction-error-if-success-cb-throws.db')
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            //var check1 = false;
            tx.executeSql('SELECT 1', null, function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              //check1 = true;
              throw new Error('Boom');
            });

            tx.executeSql('SELECT 1', null, function(ignored1, ignored2) {
              // NOT EXPECTED:
              expect(false).toBe(true);

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            }, function(ignored1, ignored2) {
              // NOT EXPECTED:
              expect(false).toBe(true);
            });
          }, function(error) {
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.message).toBeDefined();
            expect(error.code).toBe(0);
            // TBD (WebKit) Web SQL vs plugin:
            if (isWebSql)
              expect(error.message).toMatch(/callback raised an exception.*or.*error callback did not return false/);
            else
              expect(error.message).toBe('Boom');

            // VERIFY we can still continue:
            var gotStringLength = false; // poor man's spy
            db.transaction(function (tx) {
              tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (txIgnored, rs) {
                expect(rs).toBeDefined();
                expect(rs.rows).toBeDefined();
                expect(rs.rows.length).toBe(1);
                expect(rs.rows.item(0).stringlength).toBe(10);
                gotStringLength = true;
              });

            }, function (error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              expect(error.message).toBe('--');
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);

            }, function () {
              // EXPECTED RESULT (transaction finished OK):
              expect(true).toBe(true);
              expect(gotStringLength).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          });
        }, MYTIMEOUT);

        it(suiteName + 'readTransaction ends with error if success callback throws [TBD (WebKit) Web SQL vs plugin error message]', function(done) {
          var db = openDatabase('readTransaction-error-if-success-cb-throws.db')
          expect(db).toBeDefined();

          db.readTransaction(function(tx) {
            expect(tx).toBeDefined();

            //var check1 = false;
            tx.executeSql('SELECT 1', null, function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              //check1 = true;
              throw new Error('Boom');
            });

            tx.executeSql('SELECT 1', null, function(ignored1, ignored2) {
              // NOT EXPECTED:
              expect(false).toBe(true);

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            }, function(ignored1, ignored2) {
              // NOT EXPECTED:
              expect(false).toBe(true);
            });
          }, function(error) {
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.message).toBeDefined();
            expect(error.code).toBe(0);
            // TBD (WebKit) Web SQL vs plugin:
            if (isWebSql)
              expect(error.message).toMatch(/callback raised an exception.*or.*error callback did not return false/);
            else
              expect(error.message).toBe('Boom');

            // VERIFY we can still continue:
            var gotStringLength = false; // poor man's spy
            db.readTransaction(function (tx) {
              tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (txIgnored, rs) {
                expect(rs).toBeDefined();
                expect(rs.rows).toBeDefined();
                expect(rs.rows.length).toBe(1);
                expect(rs.rows.item(0).stringlength).toBe(10);
                gotStringLength = true;
              });

            }, function (error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              expect(error.message).toBe('--');
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);

            }, function () {
              // EXPECTED RESULT (transaction finished OK):
              expect(true).toBe(true);
              expect(gotStringLength).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          });
        }, MYTIMEOUT);

      });

      describe(scenarioList[i] + ': other tx error handling test(s)', function() {

        // FUTURE TODO ref: litehelpers/Cordova-sqlite-storage#232
        // test case of sql error handler returning values such as "true" (string), 1, 0, null

        it(suiteName + 'empty transaction (no callback argument) in try-catch block [BOGUS] and then SELECT transaction', function (done) {

          var db = openDatabase("tx-with-no-argment", "1.0", "Demo", DEFAULT_SIZE);

          try {
            // SYNCHRONOUS ERROR EXPECTED:
            db.transaction();

            // NOT EXPECTED to get here:
            expect(false).toBe(true);
          } catch (ex) {
            // EXPECTED RESULT:
            expect(ex).toBeDefined();

            // TBD WebKit Web SQL vs plugin according to spec?
            if (isWebSql)
              expect(ex.code).not.toBeDefined();
            else
              expect(ex.code).toBeDefined();
            expect(ex.message).toBeDefined();

            if (!isWebSql)
              expect(ex.code).toBe(0); // (SQLite.UNKNOWN_ERR)

            if (!isWebSql)
              expect(ex.message).toMatch(/transaction expected a function/);
            else if (isAndroid)
              expect(true).toBe(true); // SKIP (for now)
            else
              expect(ex.message).toMatch(/Not enough arguments/);
          }

          // VERIFY we can still continue:
          var gotStringLength = false; // poor man's spy
          db.transaction(function (tx) {
            tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (tx, res) {
              expect(res.rows.item(0).stringlength).toBe(10);
              gotStringLength = true;
            });

          }, function (error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);

          }, function () {
            // EXPECTED RESULT (transaction finished OK):
            expect(true).toBe(true);
            expect(gotStringLength).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'empty readTransaction (no callback argument) in try-catch block [BOGUS] and then SELECT transaction', function (done) {

          var db = openDatabase("read-tx-with-no-argment", "1.0", "Demo", DEFAULT_SIZE);

          try {
            // SYNCHRONOUS ERROR EXPECTED:
            db.readTransaction();

            // NOT EXPECTED to get here:
            expect(false).toBe(true);
          } catch (ex) {
            // EXPECTED RESULT:
            expect(ex).toBeDefined();

            // TBD WebKit Web SQL vs plugin according to spec?
            if (isWebSql)
              expect(ex.code).not.toBeDefined();
            else
              expect(ex.code).toBeDefined();
            expect(ex.message).toBeDefined();

            if (!isWebSql)
              expect(ex.code).toBe(0); // (SQLite.UNKNOWN_ERR)

            if (!isWebSql)
              expect(ex.message).toMatch(/transaction expected a function/);
            else if (isAndroid)
              expect(true).toBe(true); // SKIP (for now)
            else
              expect(ex.message).toMatch(/Not enough arguments/);
          }

          // VERIFY we can still continue:
          var gotStringLength = false; // poor man's spy
          db.readTransaction(function (tx) {
            tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (tx, res) {
              expect(res.rows.item(0).stringlength).toBe(10);
              gotStringLength = true;
            });

          }, function (error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);

          }, function () {
            // EXPECTED RESULT (transaction finished OK):
            expect(true).toBe(true);
            expect(gotStringLength).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.transaction(null) in try-catch block and then SELECT transaction', function (done) {
          var db = openDatabase("tx-with-null-argment.db", "1.0", "Demo", DEFAULT_SIZE);

          try {
            // SYNCHRONOUS ERROR EXPECTED:
            db.transaction(null);

            // NOT EXPECTED to get here:
            expect(false).toBe(true);
          } catch (ex) {
            // EXPECTED RESULT:
            expect(ex).toBeDefined();

            // TBD WebKit Web SQL vs plugin according to spec?
            if (isWebSql)
              expect(ex.code).not.toBeDefined();
            else
              expect(ex.code).toBeDefined();
            expect(ex.message).toBeDefined();

            if (!isWebSql)
              expect(ex.code).toBe(0); // (SQLite.UNKNOWN_ERR)

            if (!isWebSql)
              expect(ex.message).toMatch(/transaction expected a function/);
            else if (isAndroid)
              expect(true).toBe(true); // SKIP for now
            else
              expect(ex.message).toMatch(/Argument 1 \('callback'\) to Database\.transaction must be a function/);
          }

          // VERIFY it is possible to continue:
          db.transaction(function (tx) {
            tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).stringlength).toBe(10);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function (error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.readTransaction(null) in try-catch block and then SELECT transaction', function (done) {
          var db = openDatabase("read-tx-with-null-argment.db", "1.0", "Demo", DEFAULT_SIZE);

          try {
            // SYNCHRONOUS ERROR EXPECTED:
            db.readTransaction(null);

            // NOT EXPECTED to get here:
            expect(false).toBe(true);
          } catch (ex) {
            // EXPECTED RESULT:
            expect(ex).toBeDefined();

            // TBD WebKit Web SQL vs plugin according to spec?
            if (isWebSql)
              expect(ex.code).not.toBeDefined();
            else
              expect(ex.code).toBeDefined();
            expect(ex.message).toBeDefined();

            if (!isWebSql)
              expect(ex.code).toBe(0); // (SQLite.UNKNOWN_ERR)

            if (!isWebSql)
              expect(ex.message).toMatch(/transaction expected a function/);
            else if (isAndroid)
              expect(true).toBe(true); // SKIP for now
            else
              expect(ex.message).toMatch(/Argument 1 \('callback'\) to Database\.readTransaction must be a function/);
          }

          // VERIFY it is possible to continue:
          db.transaction(function (tx) {
            tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).stringlength).toBe(10);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function (error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + "db.transaction('bogus') in try-catch block and then SELECT transaction", function (done) {
          var db = openDatabase("tx-with-bogus-string-argment.db", "1.0", "Demo", DEFAULT_SIZE);

          try {
            // SYNCHRONOUS ERROR EXPECTED:
            db.transaction('bogus');

            // NOT EXPECTED to get here:
            expect(false).toBe(true);
          } catch (ex) {
            // EXPECTED RESULT:
            expect(ex).toBeDefined();

            // TBD WebKit Web SQL vs plugin according to spec?
            if (isWebSql)
              expect(ex.code).not.toBeDefined();
            else
              expect(ex.code).toBeDefined();
            expect(ex.message).toBeDefined();

            if (!isWebSql)
              expect(ex.code).toBe(0); // (SQLite.UNKNOWN_ERR)

            if (!isWebSql)
              expect(ex.message).toMatch(/transaction expected a function/);
            else if (isAndroid)
              expect(true).toBe(true); // SKIP for now
            else
              expect(ex.message).toMatch(/Argument 1 \('callback'\) to Database\.transaction must be a function/);
          }

          // VERIFY it is possible to continue:
          db.transaction(function (tx) {
            tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).stringlength).toBe(10);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function (error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + "db.readTransaction('bogus') in try-catch block and then SELECT transaction", function (done) {
          var db = openDatabase("read-tx-with-bogus-string-argment.db", "1.0", "Demo", DEFAULT_SIZE);

          try {
            // SYNCHRONOUS ERROR EXPECTED:
            db.readTransaction('bogus');

            // NOT EXPECTED to get here:
            expect(false).toBe(true);
          } catch (ex) {
            // EXPECTED RESULT:
            expect(ex).toBeDefined();

            // TBD WebKit Web SQL vs plugin according to spec?
            if (isWebSql)
              expect(ex.code).not.toBeDefined();
            else
              expect(ex.code).toBeDefined();
            expect(ex.message).toBeDefined();

            if (!isWebSql)
              expect(ex.code).toBe(0); // (SQLite.UNKNOWN_ERR)

            if (!isWebSql)
              expect(ex.message).toMatch(/transaction expected a function/);
            else if (isAndroid)
              expect(true).toBe(true); // SKIP for now
            else
              expect(ex.message).toMatch(/Argument 1 \('callback'\) to Database\.readTransaction must be a function/);
          }

          // VERIFY it is possible to continue:
          db.transaction(function (tx) {
            tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).stringlength).toBe(10);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function (error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + "db.transaction('') in try-catch block and then SELECT transaction", function (done) {
          var db = openDatabase("tx-with-bogus-empty-string-argment.db", "1.0", "Demo", DEFAULT_SIZE);

          try {
            // SYNCHRONOUS ERROR EXPECTED:
            db.transaction('');

            // NOT EXPECTED to get here:
            expect(false).toBe(true);
          } catch (ex) {
            // EXPECTED RESULT:
            expect(ex).toBeDefined();

            // TBD WebKit Web SQL vs plugin according to spec?
            if (isWebSql)
              expect(ex.code).not.toBeDefined();
            else
              expect(ex.code).toBeDefined();
            expect(ex.message).toBeDefined();

            if (!isWebSql)
              expect(ex.code).toBe(0); // (SQLite.UNKNOWN_ERR)

            if (!isWebSql)
              expect(ex.message).toMatch(/transaction expected a function/);
            else if (isAndroid)
              expect(true).toBe(true); // SKIP for now
            else
              expect(ex.message).toMatch(/Argument 1 \('callback'\) to Database\.transaction must be a function/);
          }

          // VERIFY it is possible to continue:
          db.transaction(function (tx) {
            tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).stringlength).toBe(10);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function (error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + "db.readTransaction('') in try-catch block and then SELECT transaction", function (done) {
          var db = openDatabase("read-tx-with-bogus-empty-string-argment.db", "1.0", "Demo", DEFAULT_SIZE);

          try {
            // SYNCHRONOUS ERROR EXPECTED:
            db.readTransaction('');

            // NOT EXPECTED to get here:
            expect(false).toBe(true);
          } catch (ex) {
            // EXPECTED RESULT:
            expect(ex).toBeDefined();

            // TBD WebKit Web SQL vs plugin according to spec?
            if (isWebSql)
              expect(ex.code).not.toBeDefined();
            else
              expect(ex.code).toBeDefined();
            expect(ex.message).toBeDefined();

            if (!isWebSql)
              expect(ex.code).toBe(0); // (SQLite.UNKNOWN_ERR)

            if (!isWebSql)
              expect(ex.message).toMatch(/transaction expected a function/);
            else if (isAndroid)
              expect(true).toBe(true); // SKIP for now
            else
              expect(ex.message).toMatch(/Argument 1 \('callback'\) to Database\.readTransaction must be a function/);
          }

          // VERIFY it is possible to continue:
          db.transaction(function (tx) {
            tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).stringlength).toBe(10);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function (error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.transaction(true) in try-catch block and then SELECT transaction', function (done) {
          var db = openDatabase("tx-with-true-argment.db", "1.0", "Demo", DEFAULT_SIZE);

          try {
            // SYNCHRONOUS ERROR EXPECTED:
            db.transaction(true);

            // NOT EXPECTED to get here:
            expect(false).toBe(true);
          } catch (ex) {
            // EXPECTED RESULT:
            expect(ex).toBeDefined();

            // TBD WebKit Web SQL vs plugin according to spec?
            if (isWebSql)
              expect(ex.code).not.toBeDefined();
            else
              expect(ex.code).toBeDefined();
            expect(ex.message).toBeDefined();

            if (!isWebSql)
              expect(ex.code).toBe(0); // (SQLite.UNKNOWN_ERR)

            if (!isWebSql)
              expect(ex.message).toMatch(/transaction expected a function/);
            else if (isAndroid)
              expect(true).toBe(true); // SKIP for now
            else
              expect(ex.message).toMatch(/Argument 1 \('callback'\) to Database\.transaction must be a function/);
          }

          // VERIFY it is possible to continue:
          db.transaction(function (tx) {
            tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).stringlength).toBe(10);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function (error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.readTransaction(true) in try-catch block and then SELECT transaction', function (done) {
          var db = openDatabase("read-tx-with-true-argment.db", "1.0", "Demo", DEFAULT_SIZE);

          try {
            // SYNCHRONOUS ERROR EXPECTED:
            db.readTransaction(true);

            // NOT EXPECTED to get here:
            expect(false).toBe(true);
          } catch (ex) {
            // EXPECTED RESULT:
            expect(ex).toBeDefined();

            // TBD WebKit Web SQL vs plugin according to spec?
            if (isWebSql)
              expect(ex.code).not.toBeDefined();
            else
              expect(ex.code).toBeDefined();
            expect(ex.message).toBeDefined();

            if (!isWebSql)
              expect(ex.code).toBe(0); // (SQLite.UNKNOWN_ERR)

            if (!isWebSql)
              expect(ex.message).toMatch(/transaction expected a function/);
            else if (isAndroid)
              expect(true).toBe(true); // SKIP for now
            else
              expect(ex.message).toMatch(/Argument 1 \('callback'\) to Database\.readTransaction must be a function/);
          }

          // VERIFY it is possible to continue:
          db.transaction(function (tx) {
            tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).stringlength).toBe(10);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function (error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.transaction(false) in try-catch block and then SELECT transaction', function (done) {
          var db = openDatabase("tx-with-false-argment.db", "1.0", "Demo", DEFAULT_SIZE);

          try {
            // SYNCHRONOUS ERROR EXPECTED:
            db.transaction(false);

            // NOT EXPECTED to get here:
            expect(false).toBe(true);
          } catch (ex) {
            // EXPECTED RESULT:
            expect(ex).toBeDefined();

            // TBD WebKit Web SQL vs plugin according to spec?
            if (isWebSql)
              expect(ex.code).not.toBeDefined();
            else
              expect(ex.code).toBeDefined();
            expect(ex.message).toBeDefined();

            if (!isWebSql)
              expect(ex.code).toBe(0); // (SQLError.UNKNOWN_ERR)

            if (!isWebSql)
              expect(ex.message).toMatch(/transaction expected a function/);
            else if (isAndroid)
              expect(true).toBe(true); // SKIP for now
            else
              expect(ex.message).toMatch(/Argument 1 \('callback'\) to Database\.transaction must be a function/);
          }

          // VERIFY it is possible to continue:
          db.transaction(function (tx) {
            tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).stringlength).toBe(10);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function (error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.readTransaction(false) in try-catch block and then SELECT transaction', function (done) {
          var db = openDatabase("read-tx-with-false-argment.db", "1.0", "Demo", DEFAULT_SIZE);

          try {
            // SYNCHRONOUS ERROR EXPECTED:
            db.readTransaction(false);

            // NOT EXPECTED to get here:
            expect(false).toBe(true);
          } catch (ex) {
            // EXPECTED RESULT:
            expect(ex).toBeDefined();

            // TBD WebKit Web SQL vs plugin according to spec?
            if (isWebSql)
              expect(ex.code).not.toBeDefined();
            else
              expect(ex.code).toBeDefined();
            expect(ex.message).toBeDefined();

            if (!isWebSql)
              expect(ex.code).toBe(0); // (SQLite.UNKNOWN_ERR)

            if (!isWebSql)
              expect(ex.message).toMatch(/transaction expected a function/);
            else if (isAndroid)
              expect(true).toBe(true); // SKIP for now
            else
              expect(ex.message).toMatch(/Argument 1 \('callback'\) to Database\.readTransaction must be a function/);
          }

          // VERIFY it is possible to continue:
          db.transaction(function (tx) {
            tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).stringlength).toBe(10);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function (error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.transaction(undefined) in try-catch block and then SELECT transaction', function (done) {
          var db = openDatabase("tx-with-undefined-argment.db", "1.0", "Demo", DEFAULT_SIZE);

          try {
            // SYNCHRONOUS ERROR EXPECTED:
            db.transaction(undefined);

            // NOT EXPECTED to get here:
            expect(false).toBe(true);
          } catch (ex) {
            // EXPECTED RESULT:
            expect(ex).toBeDefined();

            // TBD WebKit Web SQL vs plugin according to spec?
            if (isWebSql)
              expect(ex.code).not.toBeDefined();
            else
              expect(ex.code).toBeDefined();
            expect(ex.message).toBeDefined();

            if (!isWebSql)
              expect(ex.code).toBe(0); // (SQLite.UNKNOWN_ERR)

            if (!isWebSql)
              expect(ex.message).toMatch(/transaction expected a function/);
            else if (isAndroid)
              expect(true).toBe(true); // SKIP for now
            else
              expect(ex.message).toMatch(/Argument 1 \('callback'\) to Database\.transaction must be a function/);
          }

          // VERIFY it is possible to continue:
          db.transaction(function (tx) {
            tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).stringlength).toBe(10);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function (error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.readTransaction(undefined) in try-catch block and then SELECT transaction', function (done) {
          var db = openDatabase("read-tx-with-undefined-argment.db", "1.0", "Demo", DEFAULT_SIZE);

          try {
            // SYNCHRONOUS ERROR EXPECTED:
            db.readTransaction(undefined);

            // NOT EXPECTED to get here:
            expect(false).toBe(true);
          } catch (ex) {
            // EXPECTED RESULT:
            expect(ex).toBeDefined();

            // TBD WebKit Web SQL vs plugin according to spec?
            if (isWebSql)
              expect(ex.code).not.toBeDefined();
            else
              expect(ex.code).toBeDefined();
            expect(ex.message).toBeDefined();

            if (!isWebSql)
              expect(ex.code).toBe(0); // (SQLite.UNKNOWN_ERR)

            if (!isWebSql)
              expect(ex.message).toMatch(/transaction expected a function/);
            else if (isAndroid)
              expect(true).toBe(true); // SKIP for now
            else
              expect(ex.message).toMatch(/Argument 1 \('callback'\) to Database\.readTransaction must be a function/);
          }

          // VERIFY it is possible to continue:
          db.transaction(function (tx) {
            tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).stringlength).toBe(10);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function (error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + "transaction with 'SELECT 1' and BOGUS string success callback [tx in a try-catch block]", function (done) {
          var db = openDatabase("tx-with-bogus-string-success-cb.db", "1.0", "Demo", DEFAULT_SIZE);

          try {
            // SYNCHRONOUS ERROR EXPECTED:
            db.transaction(function(tx) {
              tx.executeSql('SELECT 1');
            }, null, 'bogus');

            // NOT EXPECTED for (WebKit) Web SQL:
            if (isWebSql) expect('Call expected to THROW in (WebKit) Web SQL').toBe('--');
          } catch (ex) {
            // EXPECTED RESULT for (WebKit) Web SQL:
            if (!isWebSql) expect('Plugin behavior changed please update this test').toBe('');
            expect(ex).toBeDefined();

            expect(ex.code).not.toBeDefined();
            expect(ex.message).toBeDefined();

            if (isAndroid)
              expect(true).toBe(true); // SKIP for now
            else
              expect(ex.message).toMatch(/Argument 3 \('successCallback'\) to Database\.transaction must be a function/);
          }

          // VERIFY it is possible to continue:
          db.transaction(function (tx) {
            tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).stringlength).toBe(10);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function (error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + "readTransaction with 'SELECT 1' and BOGUS string success callback [tx in a try-catch block]", function (done) {
          var db = openDatabase("read-tx-with-bogus-string-success-cb.db", "1.0", "Demo", DEFAULT_SIZE);

          try {
            // SYNCHRONOUS ERROR EXPECTED:
            db.readTransaction(function(tx) {
              tx.executeSql('SELECT 1');
            }, null, 'bogus');

            // NOT EXPECTED for (WebKit) Web SQL:
            if (isWebSql) expect('Call expected to THROW in (WebKit) Web SQL').toBe('--');
          } catch (ex) {
            // EXPECTED RESULT for (WebKit) Web SQL:
            if (!isWebSql) expect('Plugin behavior changed please update this test').toBe('');
            expect(ex).toBeDefined();

            // TBD WebKit Web SQL vs plugin according to spec?
            if (isWebSql)
              expect(ex.code).not.toBeDefined();
            else
              expect(ex.code).toBeDefined();
            expect(ex.message).toBeDefined();

            if (isAndroid)
              expect(true).toBe(true); // SKIP for now
            else
              expect(ex.message).toMatch(/Argument 3 \('successCallback'\) to Database\.readTransaction must be a function/);
          }

          // VERIFY it is possible to continue:
          db.transaction(function (tx) {
            tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).stringlength).toBe(10);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function (error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + "transaction with 'SELECT 1' and BOGUS string error callback [tx in a try-catch block]", function (done) {
          var db = openDatabase("tx-with-bogus-string-error-cb.db", "1.0", "Demo", DEFAULT_SIZE);

          try {
            // SYNCHRONOUS ERROR EXPECTED:
            db.transaction(function(tx) {
              tx.executeSql('SELECT 1');
            }, 'bogus');

            // NOT EXPECTED for (WebKit) Web SQL:
            if (isWebSql) expect('Call expected to THROW in (WebKit) Web SQL').toBe('--');
          } catch (ex) {
            // EXPECTED RESULT for (WebKit) Web SQL:
            if (!isWebSql) expect('Plugin behavior changed please update this test').toBe('');
            expect(ex).toBeDefined();

            expect(ex.code).not.toBeDefined();
            expect(ex.message).toBeDefined();

            if (isAndroid)
              expect(true).toBe(true); // SKIP for now
            else
              expect(ex.message).toMatch(/Argument 2 \('errorCallback'\) to Database\.transaction must be a function/);
          }

          // VERIFY it is possible to continue:
          db.transaction(function (tx) {
            tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).stringlength).toBe(10);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function (error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + "readTransaction with 'SELECT 1' and BOGUS string error callback [tx in a try-catch block]", function (done) {
          var db = openDatabase("read-tx-with-bogus-string-error-cb.db", "1.0", "Demo", DEFAULT_SIZE);

          try {
            // SYNCHRONOUS ERROR EXPECTED:
            db.readTransaction(function(tx) {
              tx.executeSql('SELECT 1');
            }, 'bogus');

            // NOT EXPECTED for (WebKit) Web SQL:
            if (isWebSql) expect('Call expected to THROW in (WebKit) Web SQL').toBe('--');
          } catch (ex) {
            // EXPECTED RESULT for (WebKit) Web SQL:
            if (!isWebSql) expect('Plugin behavior changed please update this test').toBe('');
            expect(ex).toBeDefined();

            expect(ex.code).not.toBeDefined();
            expect(ex.message).toBeDefined();

            if (isAndroid)
              expect(true).toBe(true); // SKIP for now
            else
              expect(ex.message).toMatch(/Argument 2 \('errorCallback'\) to Database\.readTransaction must be a function/);
          }

          // VERIFY it is possible to continue:
          db.transaction(function (tx) {
            tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).stringlength).toBe(10);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function (error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + "transaction with 'SLCT 1' and BOGUS string success callback [tx in a try-catch block]", function (done) {
          var db = openDatabase("tx-error-with-bogus-string-success-cb.db", "1.0", "Demo", DEFAULT_SIZE);

          try {
            // SYNCHRONOUS ERROR EXPECTED:
            db.transaction(function(tx) {
              tx.executeSql('SLCT 1');
            }, null, 'bogus');

            // NOT EXPECTED for (WebKit) Web SQL:
            if (isWebSql) expect('Call expected to THROW in (WebKit) Web SQL').toBe('--');
          } catch (ex) {
            // EXPECTED RESULT for (WebKit) Web SQL:
            if (!isWebSql) expect('Plugin behavior changed please update this test').toBe('');
            expect(ex).toBeDefined();

            expect(ex.code).not.toBeDefined();
            expect(ex.message).toBeDefined();

            if (isAndroid)
              expect(true).toBe(true); // SKIP for now
            else
              expect(ex.message).toMatch(/Argument 3 \('successCallback'\) to Database\.transaction must be a function/);
          }

          // VERIFY it is possible to continue:
          db.transaction(function (tx) {
            tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).stringlength).toBe(10);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function (error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + "readTransaction with 'SLCT 1' and BOGUS string success callback [tx in a try-catch block]", function (done) {
          var db = openDatabase("read-tx-error-with-bogus-string-success-cb.db", "1.0", "Demo", DEFAULT_SIZE);

          try {
            // SYNCHRONOUS ERROR EXPECTED:
            db.readTransaction(function(tx) {
              tx.executeSql('SLCT 1');
            }, null, 'bogus');

            // NOT EXPECTED for (WebKit) Web SQL:
            if (isWebSql) expect('Call expected to THROW in (WebKit) Web SQL').toBe('--');
          } catch (ex) {
            // EXPECTED RESULT for (WebKit) Web SQL:
            if (!isWebSql) expect('Plugin behavior changed please update this test').toBe('');
            expect(ex).toBeDefined();

            expect(ex.code).not.toBeDefined();
            expect(ex.message).toBeDefined();

            if (isAndroid)
              expect(true).toBe(true); // SKIP for now
            else
              expect(ex.message).toMatch(/Argument 3 \('successCallback'\) to Database\.readTransaction must be a function/);
          }

          // VERIFY it is possible to continue:
          db.transaction(function (tx) {
            tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).stringlength).toBe(10);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function (error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + "transaction with 'SLCT 1' and BOGUS string error callback [tx in a try-catch block]", function (done) {
          var db = openDatabase("tx-error-with-bogus-string-error-cb.db", "1.0", "Demo", DEFAULT_SIZE);

          try {
            // SYNCHRONOUS ERROR EXPECTED:
            db.transaction(function(tx) {
              tx.executeSql('SLCT 1');
            }, 'bogus');

            // NOT EXPECTED for (WebKit) Web SQL:
            if (isWebSql) expect('Call expected to THROW in (WebKit) Web SQL').toBe('--');
          } catch (ex) {
            // EXPECTED RESULT for (WebKit) Web SQL:
            if (!isWebSql) expect('Plugin behavior changed please update this test').toBe('');
            expect(ex).toBeDefined();

            expect(ex.code).not.toBeDefined();
            expect(ex.message).toBeDefined();

            if (isAndroid)
              expect(true).toBe(true); // SKIP for now
            else
              expect(ex.message).toMatch(/Argument 2 \('errorCallback'\) to Database\.transaction must be a function/);
          }

          // VERIFY it is possible to continue:
          db.transaction(function (tx) {
            tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).stringlength).toBe(10);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function (error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + "readTransaction with 'SLCT 1' and BOGUS string error callback [tx in a try-catch block]", function (done) {
          var db = openDatabase("read-tx-error-with-bogus-string-error-cb.db", "1.0", "Demo", DEFAULT_SIZE);

          try {
            // SYNCHRONOUS ERROR EXPECTED:
            db.readTransaction(function(tx) {
              tx.executeSql('SLCT 1');
            }, 'bogus');

            // NOT EXPECTED for (WebKit) Web SQL:
            if (isWebSql) expect('Call expected to THROW in (WebKit) Web SQL').toBe('--');
          } catch (ex) {
            // EXPECTED RESULT for (WebKit) Web SQL:
            if (!isWebSql) expect('Plugin behavior changed please update this test').toBe('');
            expect(ex).toBeDefined();

            expect(ex.code).not.toBeDefined();
            expect(ex.message).toBeDefined();

            if (isAndroid)
              expect(true).toBe(true); // SKIP for now
            else
              expect(ex.message).toMatch(/Argument 2 \('errorCallback'\) to Database\.readTransaction must be a function/);
          }

          // VERIFY it is possible to continue:
          db.transaction(function (tx) {
            tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).stringlength).toBe(10);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function (error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'empty transaction (no sql statements) and then SELECT transaction', function (done) {
          var db = openDatabase("empty-tx", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {
            expect(tx).toBeDefined();
          }, function(err) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);

          }, function() {
            // EXPECTED RESULT:
            expect(true).toBe(true);

            // VERIFY we can still continue:
            var gotStringLength = false; // poor man's spy
            db.transaction(function (tx) {
              tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (tx, res) {
                expect(res.rows.item(0).stringlength).toBe(10);
                gotStringLength = true;
              });

            }, function (error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              expect(error.message).toBe('--');
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);

            }, function () {
              // EXPECTED RESULT (transaction finished OK):
              expect(true).toBe(true);
              expect(gotStringLength).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          });

        }, MYTIMEOUT);

        // Check fix for litehelpers/Cordova-sqlite-storage#409:
        it(suiteName + 'empty readTransaction (no sql statements) and then SELECT transaction', function (done) {
          var db = openDatabase("empty-read-tx", "1.0", "Demo", DEFAULT_SIZE);

          db.readTransaction(function(tx) {
            expect(tx).toBeDefined();
          }, function(err) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);

          }, function() {
            // EXPECTED RESULT:
            expect(true).toBe(true);

            // VERIFY we can still continue:
            var gotStringLength = false; // poor man's spy
            db.transaction(function (tx) {
              tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (tx, res) {
                expect(res.rows.item(0).stringlength).toBe(10);
                gotStringLength = true;
              });

            }, function (error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);

            }, function () {
              // EXPECTED RESULT (transaction finished OK):
              expect(true).toBe(true);
              expect(gotStringLength).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          });

        }, MYTIMEOUT);

        it(suiteName + 'transaction.executeSql() with no executeSql arguments WITHOUT try-catch block (BOGUS)', function (done) {
          var db = openDatabase("tx-with-no-executeSql-argument.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(transaction) {
            transaction.executeSql();

            // NOT EXPECTED to get here:
            expect(false).toBe(true);

          }, function(error) {
            // EXPECTED RESULT:
            expect(error).toBeDefined();
            expect(error.code).toBeDefined()
            expect(error.message).toBeDefined();
            expect(error.code).toBe(0);

            if (isWindows)
              expect(error.message).toMatch(/Unable to get property 'toString' of undefined or null reference/);
            else if (isWebSql)
              expect(error.message).toMatch(/the SQLTransactionCallback was null or threw an exception/);
            else if (isAndroid)
              expect(error.message).toMatch(/Cannot .* 'toString' of undefined/);
            else
              expect(error.message).toMatch(/undefined is not an object \(evaluating 'sql\.toString'\)/);

            // VERIFY we can still continue:
            var gotStringLength = false; // poor man's spy
            db.transaction(function (tx2) {
              tx2.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (ignored, res) {
                expect(res.rows.item(0).stringlength).toBe(10);
                gotStringLength = true;
              });
            }, function (error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);

            }, function () {
              // EXPECTED RESULT (transaction finished OK):
              expect(true).toBe(true);
              expect(gotStringLength).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });

        }, MYTIMEOUT);

        it(suiteName + "transaction.executeSql on BOGUS empty SQL string ('')", function (done) {
          var db = openDatabase("tx-empty-sql-string.db", "1.0", "Demo", DEFAULT_SIZE);

          var check1 = false;
          db.transaction(function(transaction) {
            // NOT expected to throw:
            transaction.executeSql('');
            check1 = true;

          }, function(error) {
            // EXPECTED RESULT:
            expect(check1).toBe(true);
            expect(error).toBeDefined();
            expect(error.code).toBeDefined()
            expect(error.message).toBeDefined();

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (!isWebSql)
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(1);

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
              expect(error.message).toMatch(/a statement with no error handler failed: SQLite3 step error result code: 21/);
            else if (isAndroid && isImpl2)
              expect(error.message).toMatch(/a statement with no error handler failed: query not found/);
            else if (!isWebSql)
              expect(error.message).toMatch(/a statement with no error handler failed:.*not an error/);
            else
              expect(error.message).toMatch(/could not execute statement \(0 not an error\)/);

            // VERIFY we can still continue:
            var gotStringLength = false; // poor man's spy
            db.transaction(function (tx2) {
              tx2.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (ignored, res) {
                expect(res.rows.item(0).stringlength).toBe(10);
                gotStringLength = true;
              });
            }, function (error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);

            }, function () {
              // EXPECTED RESULT (transaction finished OK):
              expect(true).toBe(true);
              expect(gotStringLength).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });

        }, MYTIMEOUT);

        it(suiteName + "readTransaction.executeSql on BOGUS empty SQL string ('')", function (done) {
          var db = openDatabase("read-tx-empty-sql-string.db", "1.0", "Demo", DEFAULT_SIZE);

          var check1 = false;
          db.readTransaction(function(readTransaction) {
            // NOT expected to throw:
            readTransaction.executeSql('');
            check1 = true;

          }, function(error) {
            // EXPECTED RESULT:
            expect(check1).toBe(true);
            expect(error).toBeDefined();
            expect(error.code).toBeDefined()
            expect(error.message).toBeDefined();

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (!isWebSql)
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(1);

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
              expect(error.message).toMatch(/a statement with no error handler failed: SQLite3 step error result code: 21/);
            else if (isAndroid && isImpl2)
              expect(error.message).toMatch(/a statement with no error handler failed: query not found/);
            else if (!isWebSql)
              expect(error.message).toMatch(/a statement with no error handler failed:.*not an error/);
            else
              expect(error.message).toMatch(/could not execute statement \(0 not an error\)/);

            // VERIFY we can still continue:
            var gotStringLength = false; // poor man's spy
            db.transaction(function (tx2) {
              tx2.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (ignored, res) {
                expect(res.rows.item(0).stringlength).toBe(10);
                gotStringLength = true;
              });
            }, function (error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);

            }, function () {
              // EXPECTED RESULT (transaction finished OK):
              expect(true).toBe(true);
              expect(gotStringLength).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });

        }, MYTIMEOUT);

        it(suiteName + "transaction.executeSql on BOGUS ';' SQL statement", function (done) {
          var db = openDatabase("tx-semicolon-sql-statement.db", "1.0", "Demo", DEFAULT_SIZE);

          var check1 = false;
          db.transaction(function(transaction) {
            // NOT expected to throw:
            transaction.executeSql(';');
            check1 = true;

          }, function(error) {
            // EXPECTED RESULT:
            expect(check1).toBe(true);
            expect(error).toBeDefined();
            expect(error.code).toBeDefined()
            expect(error.message).toBeDefined();

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (!isWebSql)
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(1);

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
              expect(error.message).toMatch(/a statement with no error handler failed: SQLite3 step error result code: 21/);
            else if (isAndroid && isImpl2)
              expect(error.message).toMatch(/a statement with no error handler failed: query not found/);
            else if (!isWebSql)
              expect(error.message).toMatch(/a statement with no error handler failed:.*not an error/);
            else
              expect(error.message).toMatch(/could not execute statement \(0 not an error\)/);

            // VERIFY we can still continue:
            var gotStringLength = false; // poor man's spy
            db.transaction(function (tx2) {
              tx2.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (ignored, res) {
                expect(res.rows.item(0).stringlength).toBe(10);
                gotStringLength = true;
              });

            }, function (error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);

            }, function () {
              // EXPECTED RESULT (transaction finished OK):
              expect(true).toBe(true);
              expect(gotStringLength).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });

        }, MYTIMEOUT);

        it(suiteName + "readTransaction.executeSql on BOGUS ';' SQL statement", function (done) {
          var db = openDatabase("read-tx-semicolon-sql-statement.db", "1.0", "Demo", DEFAULT_SIZE);

          var check1 = false;
          db.readTransaction(function(readTransaction) {
            // NOT expected to throw:
            readTransaction.executeSql(';');
            check1 = true;

          }, function(error) {
            // EXPECTED RESULT:
            expect(check1).toBe(true);
            expect(error).toBeDefined();
            expect(error.code).toBeDefined()
            expect(error.message).toBeDefined();

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (!isWebSql)
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(1);

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
              expect(error.message).toMatch(/a statement with no error handler failed: SQLite3 step error result code: 21/);
            else if (isAndroid && isImpl2)
              expect(error.message).toMatch(/a statement with no error handler failed: query not found/);
            else if (!isWebSql)
              expect(error.message).toMatch(/a statement with no error handler failed:.*not an error/);
            else
              expect(error.message).toMatch(/could not execute statement \(0 not an error\)/);

            // VERIFY we can still continue:
            var gotStringLength = false; // poor man's spy
            db.transaction(function (tx2) {
              tx2.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (ignored, res) {
                expect(res.rows.item(0).stringlength).toBe(10);
                gotStringLength = true;
              });

            }, function (error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);

            }, function () {
              // EXPECTED RESULT (transaction finished OK):
              expect(true).toBe(true);
              expect(gotStringLength).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });

        }, MYTIMEOUT);

        it(suiteName + 'transaction.executeSql on BOGUS object', function (done) {
          var db = openDatabase("tx-with-object-for-sql-statement.db", "1.0", "Demo", DEFAULT_SIZE);

          var check1 = false;
          db.transaction(function(transaction) {
            // NOT expected to throw:
            transaction.executeSql({key1:'value1', key2:2});
            check1 = true;

          }, function(error) {
            // EXPECTED RESULT:
            expect(check1).toBe(true);
            expect(error).toBeDefined();
            expect(error.code).toBeDefined()
            expect(error.message).toBeDefined();

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
              expect(error.message).toMatch(/a statement with no error handler failed: Error preparing an SQLite statement/);
            else if (!isWebSql)
              expect(error.message).toMatch(/a statement with no error handler failed:.*near \"\[object Object\]\": syntax error/);
            else
              expect(error.message).toMatch(/could not prepare statement \(1 near \"\[object Object\]\": syntax error\)/);

            // VERIFY we can still continue:
            var gotStringLength = false; // poor man's spy
            db.transaction(function (tx2) {
              tx2.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (ignored, res) {
                expect(res.rows.item(0).stringlength).toBe(10);
                gotStringLength = true;
              });

            }, function (error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);

            }, function () {
              // EXPECTED RESULT (transaction finished OK):
              expect(true).toBe(true);
              expect(gotStringLength).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function() {
            // NOT EXPECTED by Web SQL, Android, or iOS:
            if (isWindows)
              expect(true).toBe(true);
            else
              expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });

        }, MYTIMEOUT);

        it(suiteName + 'readTransaction.executeSql on BOGUS object', function (done) {
          var db = openDatabase("read-tx-with-object-for-sql-statement.db", "1.0", "Demo", DEFAULT_SIZE);

          var check1 = false;
          db.readTransaction(function(readTransaction) {
            // NOT expected to throw:
            readTransaction.executeSql({key1:'value1', key2:2});
            check1 = true;

          }, function(error) {
            // EXPECTED RESULT:
            expect(check1).toBe(true);
            expect(error).toBeDefined();
            expect(error.code).toBeDefined()
            expect(error.message).toBeDefined();

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
              expect(error.message).toMatch(/a statement with no error handler failed: Error preparing an SQLite statement/);
            else if (!isWebSql)
              expect(error.message).toMatch(/a statement with no error handler failed:.*near \"\[object Object\]\": syntax error/);
            else
              expect(error.message).toMatch(/could not prepare statement \(1 near \"\[object Object\]\": syntax error\)/);

            // VERIFY we can still continue:
            var gotStringLength = false; // poor man's spy
            db.transaction(function (tx2) {
              tx2.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (ignored, res) {
                expect(res.rows.item(0).stringlength).toBe(10);
                gotStringLength = true;
              });

            }, function (error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);

            }, function () {
              // EXPECTED RESULT (transaction finished OK):
              expect(true).toBe(true);
              expect(gotStringLength).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function() {
            // NOT EXPECTED by Web SQL, Android, or iOS:
            if (isWindows)
              expect(true).toBe(true);
            else
              expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });

        }, MYTIMEOUT);

        it(suiteName + 'transaction.executeSql with BOGUS array', function (done) {
          var db = openDatabase("tx-with-array-for-sql-statement.db", "1.0", "Demo", DEFAULT_SIZE);

          var check1 = false;
          db.transaction(function(transaction) {
            // NOT expected to throw:
            transaction.executeSql(['first', 2]);
            check1 = true;

          }, function(error) {
            // EXPECTED RESULT:
            expect(check1).toBe(true);
            expect(error).toBeDefined();
            expect(error.code).toBeDefined()
            expect(error.message).toBeDefined();

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
              expect(error.message).toMatch(/a statement with no error handler failed: Error preparing an SQLite statement/);
            else if (!isWebSql)
              expect(error.message).toMatch(/a statement with no error handler failed:.*near \"first\": syntax error/);
            else
              expect(error.message).toMatch(/could not prepare statement \(1 near \"first\": syntax error\)/);

            // VERIFY we can still continue:
            var gotStringLength = false; // poor man's spy
            db.transaction(function (tx) {
              tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (tx, res) {
                expect(res.rows.item(0).stringlength).toBe(10);
                gotStringLength = true;
              });
            }, function (error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);

            }, function () {
              // EXPECTED RESULT (transaction finished OK):
              expect(true).toBe(true);
              expect(gotStringLength).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });

        }, MYTIMEOUT);

        it(suiteName + 'transaction.executeSql on BOGUS number 101', function (done) {
          var db = openDatabase("tx-with-number-101-for-sql-statement.db", "1.0", "Demo", DEFAULT_SIZE);

          var check1 = false;
          db.transaction(function(transaction) {
            // NOT expected to throw:
            transaction.executeSql(101);
            check1 = true;

          }, function(error) {
            // EXPECTED RESULT:
            expect(check1).toBe(true);
            expect(error).toBeDefined();
            expect(error.code).toBeDefined()
            expect(error.message).toBeDefined();

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
              expect(error.message).toMatch(/a statement with no error handler failed: Error preparing an SQLite statement/);
            else if (!isWebSql)
              expect(error.message).toMatch(/a statement with no error handler failed:.*near \"101\": syntax error/);
            else
              expect(error.message).toMatch(/could not prepare statement \(1 near \"101\": syntax error\)/);

            // VERIFY we can still continue:
            var gotStringLength = false; // poor man's spy
            db.transaction(function (tx) {
              tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (tx, res) {
                expect(res.rows.item(0).stringlength).toBe(10);
                gotStringLength = true;
              });

            }, function (error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);

            }, function () {
              // EXPECTED RESULT (transaction finished OK):
              expect(true).toBe(true);
              expect(gotStringLength).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });

        }, MYTIMEOUT);

        it(suiteName + 'transaction.executeSql on BOGUS number 0', function (done) {
          var db = openDatabase("tx-with-number-101-for-sql-statement.db", "1.0", "Demo", DEFAULT_SIZE);

          var check1 = false;
          db.transaction(function(transaction) {
            // NOT expected to throw:
            transaction.executeSql(0);
            check1 = true;

          }, function(error) {
            // EXPECTED RESULT:
            expect(check1).toBe(true);
            expect(error).toBeDefined();
            expect(error.code).toBeDefined()
            expect(error.message).toBeDefined();

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
              expect(error.message).toMatch(/a statement with no error handler failed: Error preparing an SQLite statement/);
            else if (!isWebSql)
              expect(error.message).toMatch(/a statement with no error handler failed:.*near \"0\": syntax error/);
            else
              expect(error.message).toMatch(/could not prepare statement \(1 near \"0\": syntax error\)/);

            // VERIFY we can still continue:
            var gotStringLength = false; // poor man's spy
            db.transaction(function (tx) {
              tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (tx, res) {
                expect(res.rows.item(0).stringlength).toBe(10);
                gotStringLength = true;
              });

            }, function (error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);

            }, function () {
              // EXPECTED RESULT (transaction finished OK):
              expect(true).toBe(true);
              expect(gotStringLength).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });

        }, MYTIMEOUT);

        it(suiteName + 'transaction.executeSql with undefined for SQL statement (BOGUS)', function (done) {
          var db = openDatabase('tx-with-undefined-for-sql-statement.db');

          var check1 = false;
          db.transaction(function(transaction) {
            // NOT expected to throw in case of Web SQL:
            transaction.executeSql(undefined);

            if (!isWebSql) expect('Plugin behavior changed please update this test').toBe('--');
            check1 = true;

          }, function(error) {
            // EXPECTED RESULT:
            if (isWebSql)
              expect(check1).toBe(true);
            expect(error).toBeDefined();
            expect(error.code).toBeDefined()
            expect(error.message).toBeDefined();

            if (!isWebSql)
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWebSql)
              expect(error.message).toMatch(/could not prepare statement \(1 near \"undefined\": syntax error\)/);
            else if (isWindows)
              expect(error.message).toMatch(/Unable to get property 'toString' of undefined or null reference/);
            else if (isAndroid)
              expect(error.message).toMatch(/Cannot .* 'toString' of undefined/);
            else
              expect(error.message).toMatch(/undefined is not an object \(evaluating 'sql\.toString'\)/);

            // Verify we can still continue:
            var gotStringLength = false; // poor man's spy
            db.transaction(function (tx) {
              tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (tx, res) {
                expect(res.rows.item(0).stringlength).toBe(10);
                gotStringLength = true;
              });
            }, function (error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);

            }, function () {
              // EXPECTED RESULT (transaction finished OK):
              expect(true).toBe(true);
              expect(gotStringLength).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });

        }, MYTIMEOUT);

        it(suiteName + 'transaction.executeSql with null for SQL statement (BOGUS)', function (done) {
          var db = openDatabase("tx-with-null-for-sql-statement.db", "1.0", "Demo", DEFAULT_SIZE);

          var check1 = false;
          db.transaction(function(transaction) {
            // NOT expected to throw in case of Web SQL:
            transaction.executeSql(null);

            if (!isWebSql) expect('Plugin behavior changed please update this test').toBe('--');
            check1 = true;

          }, function(error) {
            // EXPECTED RESULT:
            if (isWebSql)
              expect(check1).toBe(true);
            expect(error).toBeDefined();
            expect(error.code).toBeDefined()
            expect(error.message).toBeDefined();

            if (!isWebSql)
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWebSql)
              expect(error.message).toMatch(/could not prepare statement \(1 near \"null\": syntax error\)/);
            else if (isWindows)
              expect(error.message).toMatch(/Unable to get property 'toString' of undefined or null reference/);
            else if (isAndroid)
              expect(error.message).toMatch(/Cannot .* 'toString' of null/);
            else
              expect(error.message).toMatch(/null is not an object \(evaluating 'sql\.toString'\)/);

            // Verify we can still continue:
            var gotStringLength = false; // poor man's spy
            db.transaction(function (tx) {
              tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (tx, res) {
                expect(res.rows.item(0).stringlength).toBe(10);
                gotStringLength = true;
              });
            }, function (error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);

            }, function () {
              // EXPECTED RESULT (transaction finished OK):
              expect(true).toBe(true);
              expect(gotStringLength).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });

        }, MYTIMEOUT);

        it(suiteName + 'transaction.executeSql with true for SQL statement (BOGUS)', function (done) {
          var db = openDatabase("tx-with-true-for-sql-statement.db", "1.0", "Demo", DEFAULT_SIZE);

          var check1 = false;
          db.transaction(function(transaction) {
            // NOT expected to throw:
            transaction.executeSql(true);
            check1 = true;

          }, function(error) {
            // EXPECTED RESULT:
            expect(check1).toBe(true);
            expect(error).toBeDefined();
            expect(error.code).toBeDefined()
            expect(error.message).toBeDefined();

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
              expect(error.message).toMatch(/a statement with no error handler failed: Error preparing an SQLite statement/);
            else if (!isWebSql)
              expect(error.message).toMatch(/a statement with no error handler failed:.*near \"true\": syntax error/);
            else
              expect(error.message).toMatch(/could not prepare statement \(1 near \"true\": syntax error\)/);

            // Verify we can still continue:
            var gotStringLength = false; // poor man's spy
            db.transaction(function (tx) {
              tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (tx, res) {
                expect(res.rows.item(0).stringlength).toBe(10);
                gotStringLength = true;
              });
            }, function (error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);

            }, function () {
              // EXPECTED RESULT (transaction finished OK):
              expect(true).toBe(true);
              expect(gotStringLength).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });

        }, MYTIMEOUT);

        it(suiteName + 'transaction.executeSql with false for SQL statement (BOGUS)', function (done) {
          var db = openDatabase("tx-with-false-for-sql-statement.db", "1.0", "Demo", DEFAULT_SIZE);

          var check1 = false;
          db.transaction(function(transaction) {
            // NOT expected to throw:
            transaction.executeSql(false);
            check1 = true;

          }, function(error) {
            // EXPECTED RESULT:
            expect(check1).toBe(true);
            expect(error).toBeDefined();
            expect(error.code).toBeDefined()
            expect(error.message).toBeDefined();

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
              expect(error.message).toMatch(/a statement with no error handler failed: Error preparing an SQLite statement/);
            else if (!isWebSql)
              expect(error.message).toMatch(/a statement with no error handler failed:.*near \"false\": syntax error/);
            else
              expect(error.message).toMatch(/could not prepare statement \(1 near \"false\": syntax error\)/);

            // Verify we can still continue:
            var gotStringLength = false; // poor man's spy
            db.transaction(function (tx) {
              tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (tx, res) {
                expect(res.rows.item(0).stringlength).toBe(10);
                gotStringLength = true;
              });
            }, function (error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);

            }, function () {
              // EXPECTED RESULT (transaction finished OK):
              expect(true).toBe(true);
              expect(gotStringLength).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });

        }, MYTIMEOUT);

        it(suiteName + 'transaction.executeSql with Infinity for SQL statement (BOGUS)', function (done) {
          var db = openDatabase("tx-with-infinity-for-sql-statement.db", "1.0", "Demo", DEFAULT_SIZE);

          var check1 = false;
          db.transaction(function(transaction) {
            // NOT expected to throw:
            transaction.executeSql(Infinity);
            check1 = true;

          }, function(error) {
            // EXPECTED RESULT:
            expect(check1).toBe(true);
            expect(error).toBeDefined();
            expect(error.code).toBeDefined()
            expect(error.message).toBeDefined();

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
              expect(error.message).toMatch(/a statement with no error handler failed: Error preparing an SQLite statement/);
            else if (!isWebSql)
              expect(error.message).toMatch(/a statement with no error handler failed:.*near \"Infinity\": syntax error/);
            else
              expect(error.message).toMatch(/could not prepare statement \(1 near \"Infinity\": syntax error\)/);

            // Verify we can still continue:
            var gotStringLength = false; // poor man's spy
            db.transaction(function (tx) {
              tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (tx, res) {
                expect(res.rows.item(0).stringlength).toBe(10);
                gotStringLength = true;
              });
            }, function (error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);

            }, function () {
              // EXPECTED RESULT (transaction finished OK):
              expect(true).toBe(true);
              expect(gotStringLength).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'readTransaction.executeSql with -Infinity for SQL statement (BOGUS)', function (done) {
          var db = openDatabase("read-tx-with-minus-infinity-for-sql-statement.db", "1.0", "Demo", DEFAULT_SIZE);

          var check1 = false;
          db.readTransaction(function(readTransaction) {
            // NOT expected to throw:
            readTransaction.executeSql(-Infinity);
            check1 = true;

          }, function(error) {
            // EXPECTED RESULT:
            expect(check1).toBe(true);
            expect(error).toBeDefined();
            expect(error.code).toBeDefined()
            expect(error.message).toBeDefined();

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
              expect(error.message).toMatch(/a statement with no error handler failed: Error preparing an SQLite statement/);
            else if (!isWebSql)
              expect(error.message).toMatch(/a statement with no error handler failed:.*near \"-\": syntax error/);
            else
              expect(error.message).toMatch(/could not prepare statement \(1 near \"-\": syntax error\)/);

            // Verify we can still continue:
            var gotStringLength = false; // poor man's spy
            db.transaction(function (tx) {
              tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (tx, res) {
                expect(res.rows.item(0).stringlength).toBe(10);
                gotStringLength = true;
              });
            }, function (error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);

            }, function () {
              // EXPECTED RESULT (transaction finished OK):
              expect(true).toBe(true);
              expect(gotStringLength).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'transaction.executeSql with NaN for SQL statement (BOGUS)', function (done) {
          var db = openDatabase("tx-with-NaN-for-sql-statement.db", "1.0", "Demo", DEFAULT_SIZE);

          var check1 = false;
          db.transaction(function(transaction) {
            // NOT expected to throw:
            transaction.executeSql(NaN);
            check1 = true;

          }, function(error) {
            // EXPECTED RESULT:
            expect(check1).toBe(true);
            expect(error).toBeDefined();
            expect(error.code).toBeDefined()
            expect(error.message).toBeDefined();

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
              expect(error.message).toMatch(/a statement with no error handler failed: Error preparing an SQLite statement/);
            else if (!isWebSql)
              expect(error.message).toMatch(/a statement with no error handler failed:.*near \"NaN\": syntax error/);
            else
              expect(error.message).toMatch(/could not prepare statement \(1 near \"NaN\": syntax error\)/);

            // Verify we can still continue:
            var gotStringLength = false; // poor man's spy
            db.transaction(function (tx) {
              tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (tx, res) {
                expect(res.rows.item(0).stringlength).toBe(10);
                gotStringLength = true;
              });
            }, function (error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);

            }, function () {
              // EXPECTED RESULT (transaction finished OK):
              expect(true).toBe(true);
              expect(gotStringLength).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'readTransaction.executeSql with NaN for SQL statement (BOGUS)', function (done) {
          var db = openDatabase("read-tx-with-NaN-for-sql-statement.db", "1.0", "Demo", DEFAULT_SIZE);

          var check1 = false;
          db.readTransaction(function(readTransaction) {
            // NOT expected to throw:
            readTransaction.executeSql(NaN);
            check1 = true;

          }, function(error) {
            // EXPECTED RESULT:
            expect(check1).toBe(true);
            expect(error).toBeDefined();
            expect(error.code).toBeDefined()
            expect(error.message).toBeDefined();

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
              expect(error.message).toMatch(/a statement with no error handler failed: Error preparing an SQLite statement/);
            else if (!isWebSql)
              expect(error.message).toMatch(/a statement with no error handler failed:.*near \"NaN\": syntax error/);
            else
              expect(error.message).toMatch(/could not prepare statement \(1 near \"NaN\": syntax error\)/);

            // Verify we can still continue:
            var gotStringLength = false; // poor man's spy
            db.transaction(function (tx) {
              tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (tx, res) {
                expect(res.rows.item(0).stringlength).toBe(10);
                gotStringLength = true;
              });
            }, function (error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);

            }, function () {
              // EXPECTED RESULT (transaction finished OK):
              expect(true).toBe(true);
              expect(gotStringLength).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'transaction.executeSql with undefined executeSql argument (BOGUS)', function (done) {
          var db = openDatabase("tx-with-undefined-executeSql-argument.db", "1.0", "Demo", DEFAULT_SIZE);

          var check1 = false;
          db.transaction(function(transaction) {
            // NOT expected to throw in case of Web SQL:
            transaction.executeSql(undefined);

            if (!isWebSql) expect('Plugin behavior changed please update this test').toBe('--');
            check1 = true;

          }, function(error) {
            // EXPECTED RESULT:
            if (isWebSql)
              expect(check1).toBe(true);
            expect(error).toBeDefined();
            expect(error.code).toBeDefined()
            expect(error.message).toBeDefined();

            if (!isWebSql)
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWebSql)
              expect(error.message).toMatch(/could not prepare statement \(1 near \"undefined\": syntax error\)/);
            else if (isWindows)
              expect(error.message).toMatch(/Unable to get property 'toString' of undefined or null reference/);
            else if (isAndroid)
              expect(error.message).toMatch(/Cannot .* 'toString' of undefined/);
            else
              expect(error.message).toMatch(/undefined is not an object \(evaluating 'sql\.toString'\)/);

            // Verify we can still continue:
            var gotStringLength = false; // poor man's spy
            db.transaction(function (tx) {
              tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (tx, res) {
                expect(res.rows.item(0).stringlength).toBe(10);
                gotStringLength = true;
              });
            }, function (error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);

            }, function () {
              // EXPECTED RESULT (transaction finished OK):
              expect(true).toBe(true);
              expect(gotStringLength).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'transaction.executeSql with no SQL statement in a try-catch block (BOGUS)', function (done) {
          var db = openDatabase("tx-with-missing-sql-statement-try-catch.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(transaction) {
            try {
              transaction.executeSql();

              // NOT expected to get here:
              expect(false).toBe(true);

            } catch (ex) {
              expect(ex).toBeDefined();
              if (!isWebSql)
                expect(ex.code).not.toBeDefined()
              else if (!isAndroid)
                expect(ex.code).toBeDefined()
              expect(ex.message).toBeDefined();

              if (isWebSql && !isAndroid)
                expect(ex.code).toBe(12);

              if (isWP8)
                expect(true).toBe(true); // SKIP for now
              else if (isWindows)
                expect(ex.message).toMatch(/Unable to get property 'toString' of undefined or null reference/);
              else if (!isWebSql && isAndroid)
                expect(ex.message).toMatch(/Cannot .* 'toString' of undefined/);
              else if (!isWebSql)
                expect(ex.message).toMatch(/undefined is not an object \(evaluating 'sql\.toString'\)/);

              throw(ex);
            }

          }, function(error) {
            // EXPECTED RESULT:
            expect(error).toBeDefined();
            expect(error.code).toBeDefined()
            expect(error.message).toBeDefined();

            expect(error.code).toBe(0);

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
              expect(error.message).toMatch(/Unable to get property 'toString' of undefined or null reference/);
            else if (!isWebSql && isAndroid)
              expect(error.message).toMatch(/Cannot .* 'toString' of undefined/);
            else if (!isWebSql)
              expect(error.message).toMatch(/undefined is not an object \(evaluating 'sql\.toString'\)/);
            else
              expect(error.message).toMatch(/the SQLTransactionCallback was null or threw an exception/);

            // VERIFY we can still continue:
            var gotStringLength = false; // poor man's spy
            db.transaction(function (tx) {
              tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (tx, res) {
                expect(res.rows.item(0).stringlength).toBe(10);
                gotStringLength = true;
              });
            }, function (error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);

            }, function () {
              // EXPECTED RESULT (transaction finished OK):
              expect(true).toBe(true);
              expect(gotStringLength).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'readTransaction.executeSql with no SQL statement in a try-catch block (BOGUS)', function (done) {
          var db = openDatabase("read-tx-with-missing-sql-statement-try-catch.db", "1.0", "Demo", DEFAULT_SIZE);

          db.readTransaction(function(readTransaction) {
            try {
              readTransaction.executeSql();

              // NOT expected to get here:
              expect(false).toBe(true);

            } catch (ex) {
              expect(ex).toBeDefined();
              if (!isWebSql)
                expect(ex.code).not.toBeDefined()
              else if (!isAndroid)
                expect(ex.code).toBeDefined()
              expect(ex.message).toBeDefined();

              if (isWebSql && !isAndroid)
                expect(ex.code).toBe(12);

              if (isWP8)
                expect(true).toBe(true); // SKIP for now
              else if (isWindows)
                expect(ex.message).toMatch(/Unable to get property 'toString' of undefined or null reference/);
              else if (!isWebSql && isAndroid)
                expect(ex.message).toMatch(/Cannot .* 'toString' of undefined/);
              else if (!isWebSql)
                expect(ex.message).toMatch(/undefined is not an object \(evaluating 'sql\.toString'\)/);

              throw(ex);
            }

          }, function(error) {
            // EXPECTED RESULT:
            expect(error).toBeDefined();
            expect(error.code).toBeDefined()
            expect(error.message).toBeDefined();

            expect(error.code).toBe(0);

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
              expect(error.message).toMatch(/Unable to get property 'toString' of undefined or null reference/);
            else if (!isWebSql && isAndroid)
              expect(error.message).toMatch(/Cannot .* 'toString' of undefined/);
            else if (!isWebSql)
              expect(error.message).toMatch(/undefined is not an object \(evaluating 'sql\.toString'\)/);
            else
              expect(error.message).toMatch(/the SQLTransactionCallback was null or threw an exception/);

            // VERIFY we can still continue:
            var gotStringLength = false; // poor man's spy
            db.transaction(function (tx) {
              tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (tx, res) {
                expect(res.rows.item(0).stringlength).toBe(10);
                gotStringLength = true;
              });
            }, function (error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);

            }, function () {
              // EXPECTED RESULT (transaction finished OK):
              expect(true).toBe(true);
              expect(gotStringLength).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'Inline US-ASCII String manipulation test with arguments array="string-value" (BOGUS) in a try-catch block', function(done) {
          var db = openDatabase("Inline-US-ASCII-string-test-with-arguments-array-equals-string-value.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {
            try {
              tx.executeSql("SELECT UPPER('Some US-ASCII text') AS uppertext", "string-value", function(ignored, res) {
                // ACTUAL BEHAVIOR for plugin (Android/iOS/Windows):
                if (isWebSql) expect('RESULT NOT EXPECTED for Web SQL').toBe('--');

                expect(res.rows.item(0).uppertext).toBe("SOME US-ASCII TEXT");

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              }, function(ignored, error) {
                // NOT EXPECTED:
                expect(false).toBe(true);
                expect(error.message).toBe('--');
                return true;
              });
            } catch(ex) {
              if (!isWebSql) expect('Plugin behavior changed please update this test').toBe('--');
              expect(ex).toBeDefined();
              if (!isAndroid)
                expect(ex.code).toBeDefined()
              expect(ex.message).toBeDefined();
              if (!isAndroid)
                expect(ex.code).toBe(17);
              throw(ex);
            }

          }, function(error) {
            // EXPECTED RESULT for [WebKit] Web SQL:
            if (!isWebSql) expect('Plugin BEHAVIOR CHANGED, please update this test').toBe('--');
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.message).toBeDefined();
            expect(error.code).toBe(0);
            expect(error.message).toMatch(/the SQLTransactionCallback was null or threw an exception/);

            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'Inline US-ASCII String manipulation test with arguments array="string-value" (BOGUS) in a try-catch block read tx', function(done) {
          var db = openDatabase("Inline-US-ASCII-string-test-with-arguments-array-equals-string-value-read-tx.db", "1.0", "Demo", DEFAULT_SIZE);

          db.readTransaction(function(tx) {
            try {
              tx.executeSql("SELECT UPPER('Some US-ASCII text') AS uppertext", "string-value", function(ignored, res) {
                // ACTUAL BEHAVIOR for plugin (Android/iOS/Windows):
                if (isWebSql) expect('RESULT NOT EXPECTED for Web SQL').toBe('--');

                expect(res.rows.item(0).uppertext).toBe("SOME US-ASCII TEXT");

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              }, function(ignored, error) {
                // NOT EXPECTED:
                expect(false).toBe(true);
                expect(error.message).toBe('--');
                return true;
              });
            } catch(ex) {
              if (!isWebSql) expect('Plugin behavior changed please update this test').toBe('--');
              expect(ex).toBeDefined();
              if (!isAndroid)
                expect(ex.code).toBeDefined()
              expect(ex.message).toBeDefined();
              if (!isAndroid)
                expect(ex.code).toBe(17);
              throw(ex);
            }

          }, function(error) {
            // EXPECTED RESULT for [WebKit] Web SQL:
            if (!isWebSql) expect('Plugin BEHAVIOR CHANGED, please update this test').toBe('--');
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.message).toBeDefined();
            expect(error.code).toBe(0);
            expect(error.message).toMatch(/the SQLTransactionCallback was null or threw an exception/);

            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'Inline US-ASCII String manipulation test with arguments array=false (BOGUS) in a try-catch block', function(done) {
          var db = openDatabase("Inline-US-ASCII-string-test-with-arguments-array-equals-false.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {
            try {
              tx.executeSql("SELECT UPPER('Some US-ASCII text') AS uppertext", false, function(ignored, res) {
                // ACTUAL BEHAVIOR for plugin (Android/iOS/Windows):
                if (isWebSql) expect('RESULT NOT EXPECTED for Web SQL').toBe('--');

                expect(res.rows.item(0).uppertext).toBe("SOME US-ASCII TEXT");

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              }, function(ignored, error) {
                // NOT EXPECTED:
                expect(false).toBe(true);
                expect(error.message).toBe('--');
                return true;
              });
            } catch(ex) {
              if (!isWebSql) expect('Plugin behavior changed please update this test').toBe('--');
              expect(ex).toBeDefined();
              if (!isAndroid)
                expect(ex.code).toBeDefined()
              expect(ex.message).toBeDefined();
              if (!isAndroid)
                expect(ex.code).toBe(17);
              throw(ex);
            }

          }, function(error) {
            // EXPECTED RESULT for [WebKit] Web SQL:
            if (!isWebSql) expect('Plugin BEHAVIOR CHANGED, please update this test').toBe('--');
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.message).toBeDefined();
            expect(error.code).toBe(0);
            expect(error.message).toMatch(/the SQLTransactionCallback was null or threw an exception/);

            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'Inline US-ASCII String manipulation test with arguments array=false (BOGUS) in a try-catch block read tx', function(done) {
          var db = openDatabase("Inline-US-ASCII-string-test-with-arguments-array-equals-false-read-tx.db", "1.0", "Demo", DEFAULT_SIZE);

          db.readTransaction(function(tx) {
            try {
              tx.executeSql("SELECT UPPER('Some US-ASCII text') AS uppertext", false, function(ignored, res) {
                // ACTUAL BEHAVIOR for plugin (Android/iOS/Windows):
                if (isWebSql) expect('RESULT NOT EXPECTED for Web SQL').toBe('--');

                expect(res.rows.item(0).uppertext).toBe("SOME US-ASCII TEXT");

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              }, function(ignored, error) {
                // NOT EXPECTED:
                expect(false).toBe(true);
                expect(error.message).toBe('--');
                return true;
              });
            } catch(ex) {
              if (!isWebSql) expect('Plugin behavior changed please update this test').toBe('--');
              expect(ex).toBeDefined();
              if (!isAndroid)
                expect(ex.code).toBeDefined()
              expect(ex.message).toBeDefined();
              if (!isAndroid)
                expect(ex.code).toBe(17);
              throw(ex);
            }

          }, function(error) {
            // EXPECTED RESULT for [WebKit] Web SQL:
            if (!isWebSql) expect('Plugin BEHAVIOR CHANGED, please update this test').toBe('--');
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.message).toBeDefined();
            expect(error.code).toBe(0);
            expect(error.message).toMatch(/the SQLTransactionCallback was null or threw an exception/);

            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'Inline US-ASCII blank string test with arguments array=function (BOGUS) in a try-catch block [TBD (WebKit) Web SQL vs plugin]', function(done) {
          var db = openDatabase("Inline-US-ASCII-string-test-with-arguments-array-equals-function.db", "1.0", "Demo", DEFAULT_SIZE);

          var check1 = false;
          db.transaction(function(transaction) {
            try {
              transaction.executeSql("SELECT ''", function(ignored1, ignored2) {
                // function in place of arguments array - CALL NOT EXPECTED
                expect(false).toBe(true);
              }, function(ignored, rs) {
                // SUCCESS CALLBACK - EXPECTED for plugin ONLY:
                if (isWebSql) expect('WebKit Web SQL behavior changed').toBe('--');
                expect(rs).toBeDefined();
                expect(rs.rows).toBeDefined();
              }, function(ignored, error) {
                // ERROR CALLBACK - EXPECTED for (WebKit) Web SQL ONLY:
                if (!isWebSql) expect('Plugin BEHAVIOR CHANGED, please update this test').toBe('--');
                expect(error.message).toMatch(/number of '\?'s in statement string does not match argument count/);
                // DO NOT RECOVER TRANSACTION:
                return true;
              });
            } catch(ex) {
              // EXPECTED RESULT for (WebKit) Web SQL ONLY:
              if (!isWebSql) expect('Plugin BEHAVIOR CHANGED, please update this test').toBe('--');
              if (isWebSql && !isAndroid) expect('iOS WebKit Web SQL behavior changed').toBe('--');
              check1 = true;
              expect(ex).toBeDefined();
              // expect(ex.code).toBeDefined();
              expect(ex.message).toBeDefined();
              throw ex;
            }

          }, function(error) {
            // EXPECTED RESULT for (WebKit) Web SQL ONLY:
            if (!isWebSql) expect('Plugin BEHAVIOR CHANGED, please update this test').toBe('--');
            if (isWebSql && isAndroid && !(/Android [1-4]/.test(navigator.userAgent)))
              expect(check1).toBe(true);
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.message).toBeDefined();
            expect(error.code).toBe(0);
            // TBD ???:
            // expect(error.message).toMatch(/callback raised an exception.*or.*error callback did not return false/);

            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          }, function() {
            // EXPECTED RESULT for plugin ONLY:
            if (isWebSql) expect('WebKit Web SQL behavior changed').toBe('--');

            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'Inline US-ASCII blank string test with arguments array=function (BOGUS) in a try-catch block read tx [TBD (WebKit) Web SQL vs plugin]', function(done) {
          var db = openDatabase("Inline-US-ASCII-string-test-with-arguments-array-equals-function-read-tx.db", "1.0", "Demo", DEFAULT_SIZE);

          var check1 = false;
          db.readTransaction(function(readTransaction) {
            try {
              readTransaction.executeSql("SELECT ''", function(ignored1, ignored2) {
                // function in place of arguments array - CALL NOT EXPECTED
                expect(false).toBe(true);
              }, function(ignored, rs) {
                // SUCCESS CALLBACK - EXPECTED for plugin ONLY:
                if (isWebSql) expect('WebKit Web SQL behavior changed').toBe('--');
                expect(rs).toBeDefined();
                expect(rs.rows).toBeDefined();
              }, function(ignored, error) {
                // ERROR CALLBACK - EXPECTED for (WebKit) Web SQL ONLY:
                if (!isWebSql) expect('Plugin BEHAVIOR CHANGED, please update this test').toBe('--');
                expect(error.message).toMatch(/number of '\?'s in statement string does not match argument count/);
                // DO NOT RECOVER TRANSACTION:
                return true;
              });
            } catch(ex) {
              // EXPECTED RESULT for (WebKit) Web SQL ONLY:
              if (!isWebSql) expect('Plugin BEHAVIOR CHANGED, please update this test').toBe('--');
              if (isWebSql && !isAndroid) expect('iOS WebKit Web SQL behavior changed').toBe('--');
              check1 = true;
              expect(ex).toBeDefined();
              // expect(ex.code).toBeDefined();
              expect(ex.message).toBeDefined();
              throw ex;
            }

          }, function(error) {
            // EXPECTED RESULT for (WebKit) Web SQL ONLY:
            if (!isWebSql) expect('Plugin BEHAVIOR CHANGED, please update this test').toBe('--');
            if (isWebSql && isAndroid && !(/Android [1-4]/.test(navigator.userAgent)))
              expect(check1).toBe(true);
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.message).toBeDefined();
            expect(error.code).toBe(0);
            // TBD ???:
            // expect(error.message).toMatch(/callback raised an exception.*or.*error callback did not return false/);

            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          }, function() {
            // EXPECTED RESULT for plugin ONLY:
            if (isWebSql) expect('WebKit Web SQL behavior changed').toBe('--');

            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT ? test with arguments array=function (BOGUS) in a try-catch block [TBD (WebKit) Web SQL vs plugin]', function(done) {
          var db = openDatabase("SELECT-parameter-with-arguments-array-equals-function.db", "1.0", "Demo", DEFAULT_SIZE);

          var check1 = false;
          db.transaction(function(transaction) {
            try {
              transaction.executeSql("SELECT ?", function(ignored1, ignored2) {
                // function in place of arguments array - CALL NOT EXPECTED
                expect(false).toBe(true);
              }, function(ignored, rs) {
                // SUCCESS CALLBACK - EXPECTED for plugin ONLY:
                if (isWebSql) expect('WebKit Web SQL behavior changed').toBe('--');
                expect(rs).toBeDefined();
                expect(rs.rows).toBeDefined();
              }, function(ignored, error) {
                // ERROR CALLBACK - EXPECTED for (WebKit) Web SQL ONLY:
                if (!isWebSql) expect('Plugin BEHAVIOR CHANGED, please update this test').toBe('--');
                expect(error.message).toMatch(/number of '\?'s in statement string does not match argument count/);
                // DO NOT RECOVER TRANSACTION:
                return true;
              });
            } catch(ex) {
              // EXPECTED RESULT for (WebKit) Web SQL ONLY:
              if (!isWebSql) expect('Plugin BEHAVIOR CHANGED, please update this test').toBe('--');
              if (isWebSql && !isAndroid) expect('iOS WebKit Web SQL behavior changed').toBe('--');
              check1 = true;
              expect(ex).toBeDefined();
              // expect(ex.code).toBeDefined();
              expect(ex.message).toBeDefined();
              throw ex;
            }

          }, function(error) {
            // EXPECTED RESULT for (WebKit) Web SQL ONLY:
            if (!isWebSql) expect('Plugin BEHAVIOR CHANGED, please update this test').toBe('--');
            if (isWebSql && isAndroid && !(/Android [1-4]/.test(navigator.userAgent)))
              expect(check1).toBe(true);
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.message).toBeDefined();
            expect(error.code).toBe(0);
            // TBD ???:
            // expect(error.message).toMatch(/callback raised an exception.*or.*error callback did not return false/);

            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          }, function() {
            // EXPECTED RESULT for plugin ONLY:
            if (isWebSql) expect('WebKit Web SQL behavior changed').toBe('--');

            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT ? test with arguments array=function (BOGUS) in a try-catch block read tx [TBD (WebKit) Web SQL vs plugin]', function(done) {
          var db = openDatabase("SELECT-parameter-with-arguments-array-equals-function-read-tx.db", "1.0", "Demo", DEFAULT_SIZE);

          var check1 = false;
          db.readTransaction(function(transaction) {
            try {
              transaction.executeSql("SELECT ?", function(ignored1, ignored2) {
                // function in place of arguments array - CALL NOT EXPECTED
                expect(false).toBe(true);
              }, function(ignored, rs) {
                // SUCCESS CALLBACK - EXPECTED for plugin ONLY:
                if (isWebSql) expect('WebKit Web SQL behavior changed').toBe('--');
                expect(rs).toBeDefined();
                expect(rs.rows).toBeDefined();
              }, function(ignored, error) {
                // ERROR CALLBACK - EXPECTED for (WebKit) Web SQL ONLY:
                if (!isWebSql) expect('Plugin BEHAVIOR CHANGED, please update this test').toBe('--');
                expect(error.message).toMatch(/number of '\?'s in statement string does not match argument count/);
                // DO NOT RECOVER TRANSACTION:
                return true;
              });
            } catch(ex) {
              // EXPECTED RESULT for (WebKit) Web SQL ONLY:
              if (!isWebSql) expect('Plugin BEHAVIOR CHANGED, please update this test').toBe('--');
              if (isWebSql && !isAndroid) expect('iOS WebKit Web SQL behavior changed').toBe('--');
              check1 = true;
              expect(ex).toBeDefined();
              // expect(ex.code).toBeDefined();
              expect(ex.message).toBeDefined();
              throw ex;
            }

          }, function(error) {
            // EXPECTED RESULT for (WebKit) Web SQL ONLY:
            if (!isWebSql) expect('Plugin BEHAVIOR CHANGED, please update this test').toBe('--');
            if (isWebSql && isAndroid && !(/Android [1-4]/.test(navigator.userAgent)))
              expect(check1).toBe(true);
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.message).toBeDefined();
            expect(error.code).toBe(0);
            // TBD ???:
            // expect(error.message).toMatch(/callback raised an exception.*or.*error callback did not return false/);

            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          }, function() {
            // EXPECTED RESULT for plugin ONLY:
            if (isWebSql) expect('WebKit Web SQL behavior changed').toBe('--');

            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + "transaction.executeSql('SELECT 1') with string for success callback in a try-catch block (BOGUS)", function (done) {
          var db = openDatabase("tx-sql-with-string-for-success-cb.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(transaction) {
            try {
              transaction.executeSql('SELECT 1', [], 'bogus');

              if (isWebSql) expect('WebKit Web SQL behavior changed').toBe('--');
            } catch(ex) {
              if (!isWebSql) expect('Plugin behavior changed please update this test').toBe('--');
              expect(ex).toBeDefined();
              if (!isAndroid)
                expect(ex.code).toBeDefined()
              expect(ex.message).toBeDefined();
              if (!isAndroid)
                expect(ex.code).toBe(17);
              throw(ex);
            }

          }, function(error) {
            // EXPECTED RESULT:
            expect(error).toBeDefined();
            expect(error.code).toBeDefined()
            expect(error.message).toBeDefined();

            expect(error.code).toBe(0);

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
              expect(error.message).toMatch(/Function expected/);
            else if (!isWebSql)
              expect(error.message).toMatch(/is not a function/);
            else
              expect(error.message).toMatch(/the SQLTransactionCallback was null or threw an exception/);

            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);

          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + "readTransaction.executeSql('SELECT 1') with string for success callback in a try-catch block (BOGUS)", function (done) {
          var db = openDatabase("read-tx-sql-with-string-for-success-cb.db", "1.0", "Demo", DEFAULT_SIZE);

          db.readTransaction(function(readTransaction) {
            try {
              readTransaction.executeSql('SELECT 1', [], 'bogus');

              if (isWebSql) expect('WebKit Web SQL behavior changed').toBe('--');
            } catch(ex) {
              if (!isWebSql) expect('Plugin behavior changed please update this test').toBe('--');
              expect(ex).toBeDefined();
              if (!isAndroid)
                expect(ex.code).toBeDefined()
              expect(ex.message).toBeDefined();
              if (!isAndroid)
                expect(ex.code).toBe(17);
              throw(ex);
            }

          }, function(error) {
            // EXPECTED RESULT:
            expect(error).toBeDefined();
            expect(error.code).toBeDefined()
            expect(error.message).toBeDefined();

            expect(error.code).toBe(0);

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
              expect(error.message).toMatch(/Function expected/);
            else if (!isWebSql)
              expect(error.message).toMatch(/is not a function/);
            else
              expect(error.message).toMatch(/the SQLTransactionCallback was null or threw an exception/);

            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);

          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + "transaction.executeSql('SLCT 1') with string for success callback in a try-catch block (BOGUS)", function (done) {
          var db = openDatabase("tx-sql-misspelling-with-string-for-success-cb.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(transaction) {
            try {
              transaction.executeSql('SLCT 1', [], 'bogus');

              if (isWebSql) expect('WebKit Web SQL behavior changed').toBe('--');
            } catch(ex) {
              if (!isWebSql) expect('Plugin behavior changed please update this test').toBe('--');
              expect(ex).toBeDefined();
              if (!isAndroid)
                expect(ex.code).toBeDefined()
              expect(ex.message).toBeDefined();
              if (!isAndroid)
                expect(ex.code).toBe(17);
              throw(ex);
            }

          }, function(error) {
            // EXPECTED RESULT:
            expect(error).toBeDefined();
            expect(error.code).toBeDefined()
            expect(error.message).toBeDefined();

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (!isWebSql && !isWindows && !(isAndroid && isImpl2))
              expect(error.code).toBe(5);
            else
              expect(error.code).toBe(0);

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
              expect(error.message).toMatch(/a statement with no error handler failed: Error preparing an SQLite statement/);
            else if (!isWebSql)
              expect(error.message).toMatch(/a statement with no error handler failed.*near \"SLCT\": syntax error/);
            else
              expect(error.message).toMatch(/the SQLTransactionCallback was null or threw an exception/);

            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);

          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + "readTransaction.executeSql('SLCT 1') with string for success callback in a try-catch block (BOGUS)", function (done) {
          var db = openDatabase("read-tx-sql-misspelling-with-string-for-success-cb.db", "1.0", "Demo", DEFAULT_SIZE);

          db.readTransaction(function(readTransaction) {
            try {
              readTransaction.executeSql('SLCT 1', [], 'bogus');

              if (isWebSql) expect('WebKit Web SQL behavior changed').toBe('--');
            } catch(ex) {
              if (!isWebSql) expect('Plugin behavior changed please update this test').toBe('--');
              expect(ex).toBeDefined();
              if (!isAndroid)
                expect(ex.code).toBeDefined()
              expect(ex.message).toBeDefined();
              if (!isAndroid)
                expect(ex.code).toBe(17);
              throw(ex);
            }

          }, function(error) {
            // EXPECTED RESULT:
            expect(error).toBeDefined();
            expect(error.code).toBeDefined()
            expect(error.message).toBeDefined();

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (!isWebSql && !isWindows && !(isAndroid && isImpl2))
              expect(error.code).toBe(5);
            else
              expect(error.code).toBe(0);

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
              expect(error.message).toMatch(/a statement with no error handler failed: Error preparing an SQLite statement/);
            else if (!isWebSql)
              expect(error.message).toMatch(/a statement with no error handler failed.*near \"SLCT\": syntax error/);
            else
              expect(error.message).toMatch(/the SQLTransactionCallback was null or threw an exception/);

            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);

          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + "transaction.executeSql('SELECT 1') with string for error callback in a try-catch block (BOGUS)", function (done) {
          var db = openDatabase("tx-sql-with-string-for-error-cb.db", "1.0", "Demo", DEFAULT_SIZE);

          var check1 = false;
          db.transaction(function(transaction) {
            try {
              transaction.executeSql('SELECT 1', [], null, 'bogus');

              if (isWebSql) expect('WebKit Web SQL behavior changed').toBe('--');
              check1 = true;
            } catch(ex) {
              if (!isWebSql) expect('Plugin behavior changed please update this test').toBe('--');
              expect(ex).toBeDefined();
              if (!isAndroid)
                expect(ex.code).toBeDefined()
              expect(ex.message).toBeDefined();
              if (!isAndroid)
                expect(ex.code).toBe(17);
              throw(ex);
            }

          }, function(error) {
            // EXPECTED RESULT [(WebKit) Web SQL]:
            expect(error).toBeDefined();
            expect(error.code).toBeDefined()
            expect(error.message).toBeDefined();

            expect(error.code).toBe(0);

            if (!isWebSql)
              expect(error.message).toMatch(/is not a function/);
            else
              expect(error.message).toMatch(/the SQLTransactionCallback was null or threw an exception/);

            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);

          }, function() {
            if (isWebSql) expect('WebKit Web SQL behavior changed').toBe('--');
            expect(check1).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + "readTransaction.executeSql('SELECT 1') with string for error callback in a try-catch block (BOGUS)", function (done) {
          var db = openDatabase("read-tx-sql-with-string-for-error-cb.db", "1.0", "Demo", DEFAULT_SIZE);

          var check1 = false;
          db.readTransaction(function(readTransaction) {
            try {
              readTransaction.executeSql('SELECT 1', [], null, 'bogus');

              if (isWebSql) expect('WebKit Web SQL behavior changed').toBe('--');
              check1 = true;
            } catch(ex) {
              if (!isWebSql) expect('Plugin behavior changed please update this test').toBe('--');
              expect(ex).toBeDefined();
              if (!isAndroid)
                expect(ex.code).toBeDefined()
              expect(ex.message).toBeDefined();
              if (!isAndroid)
                expect(ex.code).toBe(17);
              throw(ex);
            }

          }, function(error) {
            // EXPECTED RESULT [(WebKit) Web SQL]:
            expect(error).toBeDefined();
            expect(error.code).toBeDefined()
            expect(error.message).toBeDefined();

            expect(error.code).toBe(0);

            if (!isWebSql)
              expect(error.message).toMatch(/is not a function/);
            else
              expect(error.message).toMatch(/the SQLTransactionCallback was null or threw an exception/);

            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);

          }, function() {
            if (isWebSql) expect('WebKit Web SQL behavior changed').toBe('--');
            expect(check1).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + "transaction.executeSql('SLCT 1') with string for error callback in a try-catch block (BOGUS)", function (done) {
          var db = openDatabase("tx-sql-misspelling-with-string-for-error-cb.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(transaction) {
            try {
              transaction.executeSql('SLCT 1', [], null, 'bogus');

              if (isWebSql) expect('WebKit Web SQL behavior changed').toBe('--');
            } catch(ex) {
              if (!isWebSql) expect('Plugin behavior changed please update this test').toBe('--');
              expect(ex).toBeDefined();
              if (!isAndroid)
                expect(ex.code).toBeDefined()
              expect(ex.message).toBeDefined();
              if (!isAndroid)
                expect(ex.code).toBe(17);
              throw(ex);
            }

          }, function(error) {
            // EXPECTED RESULT [(WebKit) Web SQL]:
            expect(error).toBeDefined();
            expect(error.code).toBeDefined()
            expect(error.message).toBeDefined();

            expect(error.code).toBe(0);

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
              expect(error.message).toMatch(/Function expected/);
            else if (!isWebSql)
              expect(error.message).toMatch(/is not a function/);
            else
              expect(error.message).toMatch(/the SQLTransactionCallback was null or threw an exception/);

            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);

          }, function() {
            if (isWebSql) expect('WebKit Web SQL behavior changed').toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + "readTransaction.executeSql('SLCT 1') with string for error callback in a try-catch block (BOGUS)", function (done) {
          var db = openDatabase("read-tx-sql-misspelling-with-string-for-error-cb.db", "1.0", "Demo", DEFAULT_SIZE);

          db.readTransaction(function(readTransaction) {
            try {
              readTransaction.executeSql('SLCT 1', [], null, 'bogus');

              if (isWebSql) expect('WebKit Web SQL behavior changed').toBe('--');
            } catch(ex) {
              if (!isWebSql) expect('Plugin behavior changed please update this test').toBe('--');
              expect(ex).toBeDefined();
              if (!isAndroid)
                expect(ex.code).toBeDefined()
              expect(ex.message).toBeDefined();
              if (!isAndroid)
                expect(ex.code).toBe(17);
              throw(ex);
            }

          }, function(error) {
            // EXPECTED RESULT [(WebKit) Web SQL]:
            expect(error).toBeDefined();
            expect(error.code).toBeDefined()
            expect(error.message).toBeDefined();

            expect(error.code).toBe(0);

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
              expect(error.message).toMatch(/Function expected/);
            else if (!isWebSql)
              expect(error.message).toMatch(/is not a function/);
            else
              expect(error.message).toMatch(/the SQLTransactionCallback was null or threw an exception/);

            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);

          }, function() {
            if (isWebSql) expect('WebKit Web SQL behavior changed').toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'Error recovery for transaction with object for SQL statement', function (done) {
          var db = openDatabase("tx-with-object-for-sql-recovery.db", "1.0", "Demo", DEFAULT_SIZE);

          var firstError = null;
          var selectResultSet = null;

          db.transaction(function(tx) {
            tx.executeSql({key1:'value1', key2:2}, [], function(tx_ignored, rs_ignored) {
              // NOT EXPECTED:
              expect(false).toBe(true);
            }, function(tx_ignored, error) {
              // EXPECTED RESULT:
              expect(true).toBe(true);
              firstError = error;
              return false; // RECOVER TRANSACTION
            });

            tx.executeSql('SELECT 1', [], function(tx_ignored, resultSet) {
              // EXPECTED RESULT:
              expect(true).toBe(true);
              selectResultSet = resultSet;
            }, function(tx_ignored, error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              return false; // RECOVER TRANSACTION
            });

          }, function(err) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);

          }, function() {
            // EXPECTED RESULT:
            expect(true).toBe(true);
            expect(firstError).toBeDefined();
            expect(firstError).not.toBeNull();
            expect(selectResultSet).toBeDefined();
            expect(selectResultSet).not.toBeNull();

            // Verify we can still continue:
            var gotStringLength = false; // poor man's spy
            db.transaction(function (tx) {
              tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (tx, res) {
                expect(res.rows.item(0).stringlength).toBe(10);
                gotStringLength = true;
              });
            }, function (error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            }, function () {
              // EXPECTED RESULT (transaction finished OK):
              expect(true).toBe(true);
              expect(gotStringLength).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          });

        }, MYTIMEOUT);

        it(suiteName + 'Error recovery for transaction with array for SQL statement', function (done) {
          var db = openDatabase("tx-with-array-for-sql-recovery.db", "1.0", "Demo", DEFAULT_SIZE);

          var firstError = null;
          var selectResultSet = null;

          db.transaction(function(tx) {
            tx.executeSql(['first', 2], [], function(tx_ignored, rs_ignored) {
              // NOT EXPECTED:
              expect(false).toBe(true);
            }, function(tx_ignored, error) {
              // EXPECTED RESULT:
              expect(true).toBe(true);
              firstError = error;
              return false; // RECOVER TRANSACTION
            });

            tx.executeSql('SELECT 1', [], function(tx_ignored, resultSet) {
              // EXPECTED RESULT:
              expect(true).toBe(true);
              selectResultSet = resultSet;
            }, function(tx_ignored, error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              return false; // RECOVER TRANSACTION
            });

          }, function(err) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);

          }, function() {
            // EXPECTED RESULT:
            expect(true).toBe(true);
            expect(firstError).toBeDefined();
            expect(firstError).not.toBeNull();
            expect(selectResultSet).toBeDefined();
            expect(selectResultSet).not.toBeNull();

            // Verify we can still continue:
            var gotStringLength = false; // poor man's spy
            db.transaction(function (tx) {
              tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (tx, res) {
                expect(res.rows.item(0).stringlength).toBe(10);
                gotStringLength = true;
              });
            }, function (error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            }, function () {
              // EXPECTED RESULT (transaction finished OK):
              expect(true).toBe(true);
              expect(gotStringLength).toBe(true);
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          });

        }, MYTIMEOUT);

      });

    });

  }

}

if (window.hasBrowser) mytests();
else exports.defineAutoTests = mytests;

/* vim: set expandtab : */
