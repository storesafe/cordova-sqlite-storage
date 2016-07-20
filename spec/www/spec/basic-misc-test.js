/* 'use strict'; */

var MYTIMEOUT = 20000;

var DEFAULT_SIZE = 5000000; // max to avoid popup in safari/ios

var isWP8 = /IEMobile/.test(navigator.userAgent); // Matches WP(7/8/8.1)
var isWindows = /Windows /.test(navigator.userAgent); // Windows
var isAndroid = !isWindows && /Android/.test(navigator.userAgent);

// NOTE: In the common storage-master branch there is no difference between the
// default implementation and implementation #2. But the test will also apply
// the androidLockWorkaround: 1 option in the case of implementation #2.
var scenarioList = [
  isAndroid ? 'Plugin-implementation-default' : 'Plugin',
  'HTML5',
  'Plugin-implementation-2'
];

var scenarioCount = (!!window.hasWebKitBrowser) ? (isAndroid ? 3 : 2) : 1;

// XXX FUTURE TBD: split this into db feature & tx error handling test scripts

var mytests = function() {

  // sql feature test(s)
  for (var i=0; i<scenarioCount; ++i) {
    describe(scenarioList[i] + ': basic/misc. db tx/sql feature test(s)', function() {
      var scenarioName = scenarioList[i];
      var suiteName = scenarioName + ': ';
      var isWebSql = (i === 1);
      var isImpl2 = (i === 2);

      // NOTE: MUST be defined in proper describe function scope, NOT outer scope:
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

        // Known to work with:
        // - iOS 9 Web SQL
        // - Android (default Android-sqlite-connector implementation)
        // - iOS & Windows (with newer sqlite3 build)
        it(suiteName + 'db readTransaction with a WITH clause', function(done) {
          if (isWP8) pending('NOT IMPLEMENTED for WP(8)');
          if (isWebSql) pending('SKIP for Web SQL'); // NOT WORKING on all versions (Android/iOS)
          if (isAndroid && isImpl2) pending('SKIP for android.database implementation'); // NOT WORKING on all versions

          var db = openDatabase('tx-with-a-with-clause-test.db', '1.0', 'Test', DEFAULT_SIZE);

          db.readTransaction(function(tx) {
            tx.executeSql('WITH one(x) AS (SELECT 1) SELECT x FROM one;');

          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(JSON.stringify(error)).toBe('---');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);

          }, function() {
            // EXPECTED RESULT:
            expect(true).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });

        }, MYTIMEOUT);

        /* THANKS to @calebeaires: */
        it(suiteName + 'create virtual table using FTS3', function(done) {
          if (isWP8) pending('NOT IMPLEMENTED for WP(8)'); // NOT IMPLEMENTED in CSharp-SQLite
          if (isAndroid && isWebSql) pending('SKIP for Android Web SQL');

          var db = openDatabase('virtual-table-using-fts3.db', '1.0', 'Test', DEFAULT_SIZE);

          expect(db).toBeDefined();

          var isCreateOK = false;
          var createError = null;

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            //tx.executeSql('CREATE INDEX liv_index ON book (liv, cap);');
            tx.executeSql('DROP TABLE IF EXISTS virtual_book');
            tx.executeSql('CREATE VIRTUAL TABLE IF NOT EXISTS virtual_book USING FTS3 (liv, cap, ver, tex, tes);', [], function(tx_ignored, rs_ignored) {
              // CREATE OK:
              expect(true).toBe(true);
              isCreateOK = true;
            }, function(tx_ignored, error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              expect(JSON.stringify(error)).toBe('---');
              createError = error;
              return true; // report error for both Web SQL & plugin
            });

          }, function(err) {
            // NOTE: CREATE ERROR should have already been reported above.
            expect(createError).toBeDefined();
            expect(createError).not.toBeNull();
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);

          }, function() {
            // EXPECTED RESULT (verify CREATE was ok):
            expect(isCreateOK).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        // NOTE: looking at sqlite3.c (newer versions), if FTS3 is enabled,
        // FTS4 seems to be working as well!
        // (thanks again to @calebeaires for this scenario)
        it(suiteName + 'create virtual table using FTS4', function(done) {
          if (isWP8) pending('NOT IMPLEMENTED for WP(8)'); // NOT IMPLEMENTED in CSharp-SQLite
          if (isWebSql) pending('SKIP for Web SQL');

          var db = openDatabase('virtual-table-using-fts4.db', '1.0', 'Test', DEFAULT_SIZE);

          expect(db).toBeDefined();

          var isCreateOK = false;
          var createError = null;

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            //tx.executeSql('CREATE INDEX liv_index ON book (liv, cap);');
            tx.executeSql('DROP TABLE IF EXISTS virtual_book');
            tx.executeSql('CREATE VIRTUAL TABLE IF NOT EXISTS virtual_book USING FTS4 (liv, cap, ver, tex, tes);', [], function(tx_ignored, rs_ignored) {
              // CREATE OK:
              expect(true).toBe(true);
              isCreateOK = true;
            }, function(tx_ignored, error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              expect(JSON.stringify(error)).toBe('---');
              createError = error;
              return true; // report error for both Web SQL & plugin
            });

          }, function(err) {
            // NOTE: CREATE ERROR should have already been reported above.
            expect(createError).toBeDefined();
            expect(createError).not.toBeNull();
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);

          }, function() {
            // EXPECTED RESULT (verify CREATE was ok):
            expect(isCreateOK).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        // Test for Cordova-sqlcipher-adapter version (SQLCipher 3.4.0 based on SQLite 3.11.0)
        it(suiteName + 'Basic JSON1 json test', function(done) {
          //if (isWebSql) pending('SKIP for Web SQL (not implemented)');
          pending('SKIP: NOT IMPLEMENTED for this version');

          var db = openDatabase('basic-json1-json-test.db', '1.0', 'Test', DEFAULT_SIZE);

          expect(db).toBeDefined();

          db.transaction(function(tx) {

            expect(tx).toBeDefined();

            // Derived from sample in: https://www.sqlite.org/json1.html
            tx.executeSql("SELECT json(?) AS my_json;", [' { "this" : "is", "a": [ "test" ] } '], function(tx, res) {
              expect(res.rows.item(0).my_json).toEqual('{"this":"is","a":["test"]}');
              //done();
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            }, function(tx, e) {
              // NOT EXPECTED (went wrong):
              expect(false).toBe(true);
              expect(JSON.stringify(e)).toBe('--');
              //done();
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

        // Test for Cordova-sqlcipher-adapter version (SQLCipher 3.4.0 based on SQLite 3.11.0)
        it(suiteName + 'JSON1 json_object test', function(done) {
          //if (isWebSql) pending('SKIP for Web SQL (not implemented)');
          pending('SKIP: NOT IMPLEMENTED for this version');

          var db = openDatabase('json1-json-object-test.db', '1.0', 'Test', DEFAULT_SIZE);

          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            // Derived from sample in: https://www.sqlite.org/json1.html
            tx.executeSql("SELECT json_object(?,?) AS my_object;", ['ex','[52,3.14159]'], function(tx, res) {
              // EXPECTED RESULT:
              expect(res.rows.item(0).my_object).toEqual('{"ex":"[52,3.14159]"}');
              //done();
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);

            }, function(tx, e) {
              // NOT EXPECTED (went wrong):
              expect(false).toBe(true);
              expect(JSON.stringify(e)).toBe('--');
              //done();
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

        // Test for Cordova-sqlcipher-adapter version (SQLCipher 3.4.0 based on SQLite 3.11.0)
        it(suiteName + 'create virtual table using FTS5', function(done) {
          //if (isWebSql) pending('SKIP for Web SQL (not implemented)');
          pending('SKIP: NOT IMPLEMENTED for this version');

          var db = openDatabase('virtual-table-using-fts5.db', '1.0', 'Test', DEFAULT_SIZE);

          expect(db).toBeDefined();

          var isCreateOK = false;
          var createError = null;

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            //tx.executeSql('CREATE INDEX liv_index ON book (liv, cap);');
            tx.executeSql('DROP TABLE IF EXISTS virtual_book');
            tx.executeSql('CREATE VIRTUAL TABLE IF NOT EXISTS virtual_book USING FTS5 (liv, cap, ver, tex, tes);', [], function(tx, res) {
              // EXPECTED RESULT:
              expect(true).toBe(true);
              isCreateOK = true;
            }, function(tx, error) {
              // NOT EXPECTED (went wrong):
              expect(false).toBe(true);
              expect(JSON.stringify(error)).toBe('---');
              createError = error;
              return true; // report error for both Web SQL & plugin
            });

          }, function(err) {
            // NOTE: CREATE ERROR should have already been reported above.
            expect(createError).toBeDefined();
            expect(createError).not.toBeNull();
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);

          }, function() {
            // EXPECTED RESULT (verify CREATE was ok):
            expect(isCreateOK).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'create virtual table using R-Tree', function(done) {
          if (isWebSql) pending('SKIP for Web SQL');
          if (isWP8) pending('NOT IMPLEMENTED for WP(8)'); // NOT IMPLEMENTED in CSharp-SQLite
          if (isAndroid && isImpl2) pending('NOT IMPLEMENTED for all versions of android.database'); // NOT IMPLEMENTED for all versions of Android database (failed in Circle CI)

          var db = openDatabase('virtual-table-using-r-tree.db', '1.0', 'Test', DEFAULT_SIZE);

          expect(db).toBeDefined();

          var isCreateOK = false;
          var createError = null;

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('DROP TABLE IF EXISTS demo_index');
            // from https://www.sqlite.org/rtree.html
            tx.executeSql('CREATE VIRTUAL TABLE IF NOT EXISTS demo_index USING rtree (id, minX, maxX, minY, maxY);', [], function(tx, res) {
              // EXPECTED RESULT:
              expect(true).toBe(true);
              isCreateOK = true;
            }, function(err) {
              // NOT EXPECTED (went wrong):
              expect(false).toBe(true);
              expect(JSON.stringify(e)).toBe('--');
              createError = error;
            });

          }, function(err) {
            // NOTE: CREATE ERROR should have already been reported above.
            expect(createError).toBeDefined();
            expect(createError).not.toBeNull();
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);

          }, function() {
            // EXPECTED RESULT (verify CREATE was ok):
            expect(isCreateOK).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        // NOTE: NOT supported by SQLite amalgamation.
        // SQLite amalgamation must be rebuilt with
        // SQLITE_ENABLE_UPDATE_DELETE_LIMIT defined
        // for this feature to work.
        xit(suiteName + 'DELETE LIMIT', function(done) {
          if (isWP8) pending('NOT IMPLEMENTED for WP(8)');
          if (isWebSql) pending('SKIP for Web SQL (NOT IMPLEMENTED)');
          if (isWindows) pending('NOT IMPLEMENTED for Windows');
          if (isAndroid && !isWebSql) pending('SKIP for Android plugin'); // FUTURE TBD test with newer versions (android.database)
          if (!(isAndroid || isWindows || isWP8)) pending('SKIP for iOS'); // NOT WORKING on any versions of iOS (plugin or Web SQL)

          var db = openDatabase('delete-limit-test.db', '1.0', 'Test', DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('CREATE TABLE TT(C);');
            tx.executeSql('INSERT INTO TT VALUES (?),(?),(?),(?),(?);', [1,2,3,4,5]);
            tx.executeSql('DELETE FROM TT LIMIT 3;', [], function(tx, res) {
              tx.executeSql('SELECT * FROM TT;', [], function(tx, res) {
                // EXPECTED RESULT:
                expect(true).toBe(true);
                expect(res.rows.length).toBe(2);
                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });

            }, function(tx, err) {
              // NOT EXPECTED (went wrong):
              expect(false).toBe(true);
              expect(JSON.stringify(err)).toBe('--');
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

    });

  }

  // tx error handling test(s)
  for (var i=0; i<scenarioCount; ++i) {

    describe(scenarioList[i] + ': basic/misc tx error handling test(s)', function() {
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

      describe(scenarioList[i] + ': basic tx error semantics test(s)', function() {

        /* found due to investigation of litehelpers/Cordova-sqlite-storage#226: */
        it(suiteName + 'SKIP SQL CALLBACKS after syntax error with no handler', function(done) {
          var db = openDatabase('first-syntax-error-with-no-handler.db', '1.0', 'Test', DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();
            tx.executeSql('DROP TABLE IF EXISTS tt');
            tx.executeSql('CREATE TABLE IF NOT EXISTS tt (data unique)');

            // This insertion has a sql syntax error-which is not handled:
            tx.executeSql('insert into tt (data) VALUES ', [123]);

            // SKIPPED by Web SQL and this plugin:
            // SECOND insertion with syntax error in transaction
            tx.executeSql('insert into tt (data) VALUES ', [456], function(tx, res) {
              // NOT EXPECTED:
              expect(false).toBe(true);
            }, function(err) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              // TRY to RECOVER:
              return false;
            });

          }, function(err) {
            // EXPECTED RESULT:
            expect(true).toBe(true);
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
            tx.executeSql('insert into tt (data) VALUES ', [456], function(tx, res) {
              // NOT EXPECTED:
              expect(false).toBe(true);
            }, function(err) {
              // EXPECTED RESULT:
              expect(true).toBe(true);
              isFirstErrorHandlerCalled = true;
              // (should) completely stop transaction:
              return true;
            });

            // SKIPPED by Web SQL and this plugin:
            // SECOND insertion with syntax error with handler that signals explicit recovery
            tx.executeSql('insert into tt (data) VALUES ', [456], function(tx, res) {
              // NOT EXPECTED:
              expect(false).toBe(true);
            }, function(err) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              // explicit recovery:
              return false;
            });

          }, function(err) {
            // EXPECTED RESULT:
            expect(true).toBe(true);
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
          //var isFirstSuccessHandlerCalled = false; // (not expected)
          var isSecondSuccessHandlerCalled = false; // expected ok
          //var isSecondErrorHandlerCalled = false; // (not expected)

          db.transaction(function(tx) {
            expect(tx).toBeDefined();
            tx.executeSql('DROP TABLE IF EXISTS tt');
            tx.executeSql('CREATE TABLE IF NOT EXISTS tt (data unique)');

            // FIRST SQL syntax error with handler that returns undefined [nothing]:
            tx.executeSql('insert into tt (data) VALUES ', [456], function(tx, res) {
              // NOT EXPECTED:
              expect(false).toBe(true);
            }, function(err) {
              // EXPECTED RESULT:
              expect(true).toBe(true);
              isFirstErrorHandlerCalled = true;
              // [should] recover this transaction:
              return false;
            });

            // SECOND SQL OK [NOT SKIPPED by Web SQL]:
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
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(isFirstErrorHandlerCalled).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);

          }, function() {
            // EXPECTED RESULT:
            expect(true).toBe(true);
            expect(isFirstErrorHandlerCalled).toBe(true);
            expect(isSecondSuccessHandlerCalled).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        // NOTE: as discussed in litehelpers/Cordova-sqlite-storage#232 this plugin is correct
        // according to the spec at http://www.w3.org/TR/webdatabase/
        it(suiteName + 'syntax error handler returns undefined (deviation in WebKit Web SQL implementation)', function(done) {
          var db = openDatabase('syntax-error-handler-returns-undefined.db', '1.0', 'Test', DEFAULT_SIZE);
          expect(db).toBeDefined();

          var isFirstErrorHandlerCalled = false; // poor man's spy

          db.transaction(function(tx) {
            expect(tx).toBeDefined();
            tx.executeSql('DROP TABLE IF EXISTS tt');
            tx.executeSql('CREATE TABLE IF NOT EXISTS tt (data unique)');

            // FIRST SQL syntax error with handler that returns undefined [nothing]:
            tx.executeSql('insert into tt (data) VALUES ', [456], function(tx, res) {
              // NOT EXPECTED:
              expect(false).toBe(true);
            }, function(err) {
              // expected ok:
              expect(true).toBe(true);
              isFirstErrorHandlerCalled = true;
              // (should) recover this transaction according to Web SQL spec:
              return undefined;
            });

            // SKIP SECOND SQL [not relevant for this test, difference plugin vs. Web SQL]:

          }, function(err) {
            // TRANSACTION FAILURE EXPECTED (Plugin ONLY):
            expect(true).toBe(true);
            expect(isFirstErrorHandlerCalled).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);

          }, function() {
            // EXPECTED OK for WebKit Web SQL implementation ONLY:
            if (isWebSql)
              expect(true).toBe(true);
            else
              expect(false).toBe(true);
            expect(isFirstErrorHandlerCalled).toBe(true);
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
            tx.executeSql('SELECT 1', [], function(tx, res) {
              // EXPECTED RESULT:
              expect(true).toBe(true);
              isFirstSuccessHandlerCalled = true;

              // NESTED:
              tx.executeSql('SELCT 1', [], function(tx, res) {
                // NOT EXPECTED:
                expect(false).toBe(true);
              }, function(err) {
                // NOT EXPECTED:
                expect(false).toBe(true);
                // TRY to RECOVER in NESTED:
                return true;
              });

            }, function(err) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              return true;
            });

            // FIRST SQL syntax error with handler that returns true (STOP the transaction):
            tx.executeSql('SELCT 1', [], function(tx, res) {
              // NOT EXPECTED:
              expect(false).toBe(true);
            }, function(err) {
              // EXPECTED RESULT:
              expect(true).toBe(true);
              isFirstErrorHandlerCalled = true;
              // STOP the transaction:
              return true;
            });

            // SKIPPED by Web SQL and this plugin:
            tx.executeSql('SELECT 1', [], function(tx, res) {
              // NOT EXPECTED:
              expect(false).toBe(true);
            }, function(err) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              return true;
            });

          }, function(err) {
            // EXPECTED RESULT:
            expect(true).toBe(true);
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

      });

      describe(scenarioList[i] + ': other tx error handling test(s)', function() {

        // FUTURE TODO ref: litehelpers/Cordova-sqlite-storage#232
        // test case of sql error handler returning values such as "true" (string), 1, 0, null

        it(suiteName + 'empty transaction (no callback argument) and then SELECT transaction', function (done) {

          var db = openDatabase("tx-with-no-argment", "1.0", "Demo", DEFAULT_SIZE);

          try {
            // SYNCHRONOUS ERROR EXPECTED:
            db.transaction();

            // NOT EXPECTED to get here:
            expect(false).toBe(true);
          } catch (err) {
            // EXPECTED RESULT:
            expect(true).toBe(true);
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

        it(suiteName + 'empty readTransaction (no callback argument) and then SELECT transaction', function (done) {

          var db = openDatabase("read-tx-with-no-argment", "1.0", "Demo", DEFAULT_SIZE);

          try {
            // SYNCHRONOUS ERROR EXPECTED:
            db.readTransaction();

            // NOT EXPECTED to get here:
            expect(false).toBe(true);
          } catch (err) {
            // EXPECTED RESULT:
            expect(true).toBe(true);
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

        it(suiteName + 'empty transaction (no sql statements) and then SELECT transaction', function (done) {

          var db = openDatabase("empty-tx", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {
            expect(true).toBe(true);
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

        // Check fix for litehelpers/Cordova-sqlite-storage#409:
        it(suiteName + 'empty readTransaction (no sql statements) and then SELECT transaction', function (done) {

          var db = openDatabase("empty-read-tx", "1.0", "Demo", DEFAULT_SIZE);

          db.readTransaction(function(tx) {
            expect(true).toBe(true);
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

        it(suiteName + "transaction.executeSql on BOGUS empty SQL string ('')", function (done) {

          var db = openDatabase("tx-empty-sql-string.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {
            transaction.executeSql('');

          }, function(err) {
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

        it(suiteName + "transaction.executeSql on BOGUS ';' SQL statement", function (done) {

          var db = openDatabase("tx-semicolon-sql-statement.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {
            transaction.executeSql(';');

          }, function(err) {
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

        it(suiteName + 'transaction.executeSql on BOGUS object', function (done) {
          var db = openDatabase("tx-with-object-for-sql-statement.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {
            transaction.executeSql({key1:'value1', key2:2});

          }, function(err) {
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

          db.transaction(function(tx) {
            transaction.executeSql(['first', 2]);

          }, function(err) {
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

          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });

        }, MYTIMEOUT);

        it(suiteName + 'transaction.executeSql on BOGUS number', function (done) {
          var db = openDatabase("tx-with-number-for-sql-statement.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {
            transaction.executeSql(101);

          }, function(err) {
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

          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });

        }, MYTIMEOUT);

        it(suiteName + 'transaction.executeSql with null for SQL statement (BOGUS)', function (done) {
          var db = openDatabase("tx-with-number-for-sql-statement.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {
            transaction.executeSql(null);

          }, function(err) {
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

          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });

        }, MYTIMEOUT);

        it(suiteName + 'transaction.executeSql with true for SQL statement (BOGUS)', function (done) {
          var db = openDatabase("tx-with-true-for-sql-statement.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {
            transaction.executeSql(true);

          }, function(err) {
            // EXPECTED RESULT:
            expect(true).toBe(true);

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

          db.transaction(function(tx) {
            transaction.executeSql(false);

          }, function(err) {
            // EXPECTED RESULT:
            expect(true).toBe(true);

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

          db.transaction(function(tx) {
            transaction.executeSql(undefined);

          }, function(err) {
            // EXPECTED RESULT:
            expect(true).toBe(true);

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

        it(suiteName + 'transaction.executeSql with no executeSql argument (BOGUS)', function (done) {
          var db = openDatabase("tx-with-no-executeSql-argument.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {
            tx.executeSql();

          }, function(err) {
            // EXPECTED RESULT:
            expect(true).toBe(true);

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
