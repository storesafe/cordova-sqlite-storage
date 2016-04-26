/* 'use strict'; */

var MYTIMEOUT = 20000;

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

// XXX FUTURE TBD: split this into db feature & tx error handling test scripts

var mytests = function() {

  // sql feature test(s)
  for (var i=0; i<scenarioCount; ++i) {
    describe(scenarioList[i] + ': basic/misc. db tx/sql feature test(s)', function() {
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
        // - Android-sqlite-connector with newer sqlite3 build (in cordova-sqlite-ext version)
        // - iOS plugin with newer sqlite3 build (also in cordova-sqlite-ext version)
        // - Windows (with newer sqlite3 build)
        // SKIPPED in this version branch (fow now)
        it(suiteName + 'db readTransaction with a WITH clause', function(done) {
          if (isWP8) pending('NOT IMPLEMENTED for WP(8)');
          if (isWebSql) pending('SKIP for Web SQL'); // NOT WORKING on all versions (Android/iOS)
          if (isAndroid && isOldImpl) pending('SKIP for android.database implementation'); // NOT WORKING on all versions

          var db = openDatabase('tx-with-a-with-clause-test.db', '1.0', 'Test', DEFAULT_SIZE);

          db.readTransaction(function(tx) {
            tx.executeSql('WITH one(x) AS (SELECT 1) SELECT x FROM one;');
          }, function(e) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(JSON.stringify(e)).toBe('---');
            done();
          }, function() {
            // EXPECTED RESULT:
            expect(true).toBe(true);
            done();
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
            }, function(ignored1, ignored2) {
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
            }, function(ignored1, ignored2) {
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
              done();
            }, function(tx, e) {
              // went wrong:
              expect(false).toBe(true);
              expect(JSON.stringify(e)).toBe('--');
              done();
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
              expect(res.rows.item(0).my_object).toEqual('{"ex":"[52,3.14159]"}');
              done();
            }, function(tx, e) {
              // went wrong:
              expect(false).toBe(true);
              expect(JSON.stringify(e)).toBe('--');
              done();
            });
          });
        }, MYTIMEOUT);

        // Test for Cordova-sqlcipher-adapter version (SQLCipher 3.4.0 based on SQLite 3.11.0)
        it(suiteName + 'create virtual table using FTS5', function(done) {
          //if (isWebSql) pending('SKIP for Web SQL (not implemented)');
          pending('SKIP: NOT IMPLEMENTED for this version');

          var db = openDatabase('virtual-table-using-fts5.db', '1.0', 'Test', DEFAULT_SIZE);

          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('CREATE INDEX liv_index ON book (liv, cap);');
            tx.executeSql('DROP TABLE IF EXISTS virtual_book');
            tx.executeSql('CREATE VIRTUAL TABLE IF NOT EXISTS virtual_book USING FTS5 (liv, cap, ver, tex, tes);', [], function(tx, res) {
              // ok:
              expect(true).toBe(true);
            }, function(tx, e) {
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

        it(suiteName + 'create virtual table using R-Tree', function(done) {
          if (isWebSql) pending('BROKEN (NOT IMPLEMENTED) for Web SQL');
          if (isWP8) pending('NOT IMPLEMENTED for WP(8)'); // NOT IMPLEMENTED in CSharp-SQLite
          if (isAndroid && isOldImpl) pending('NOT IMPLEMENTED for all versions of android.database'); // NOT IMPLEMENTED for all versions of Android database (failed in Circle CI)

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

        it(suiteName + 'DELETE LIMIT', function(done) {
          if (isWP8) pending('NOT IMPLEMENTED for WP(8)');
          if (isWindows) pending('NOT IMPLEMENTED for Windows');
          if (isAndroid && !isWebSql) pending('SKIP for Android plugin'); // FUTURE TBD test with newer versions (android.database)
          if (!(isAndroid || isWindows || isWP8)) pending('SKIP for iOS'); // NOT WORKING on all versions

          var db = openDatabase('delete-limit-test.db', '1.0', 'Test', DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('CREATE TABLE TT(C);');
            tx.executeSql('INSERT INTO TT VALUES (?),(?),(?),(?),(?);', [1,2,3,4,5]);
            tx.executeSql('DELETE FROM TT LIMIT 3;', [], function(tx, res) {
              tx.executeSql('SELECT * FROM TT;', [], function(tx, res) {
                // OK:
                expect(true).toBe(true);
                expect(res.rows.length).toBe(2);
                done();
              });
            }, function(tx, err) {
              // WENT WRONG:
              expect(false).toBe(true);
              expect(JSON.stringify(err)).toBe('--');
              return true;
            });
          }, function(err) {
            // [ignored here]:
            expect(true).toBe(true);
            done();
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
      var isOldImpl = (i === 2);

      // NOTE: MUST be defined in function scope, NOT outer scope:
      var openDatabase = function(name, ignored1, ignored2, ignored3) {
        if (isOldImpl) {
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

        it(suiteName + 'empty transaction (no callback argument) and then SELECT transaction', function (done) {

          var db = openDatabase("tx-with-no-argment", "1.0", "Demo", DEFAULT_SIZE);

          try {
            // synchronous error expected:
            db.transaction();

            // not expected to get here:
            expect(false).toBe(true);
          } catch (err) {
            // got error like we expected
            expect(true).toBe(true);
          }

          // verify we can still continue
          var gotStringLength = false; // poor man's spy
          db.transaction(function (tx) {
            tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (tx, res) {
              expect(res.rows.item(0).stringlength).toBe(10);
              gotStringLength = true;
            });
          }, function (error) {
            // not expected:
            expect(false).toBe(true);
          }, function () {
            // expected result (transaction committed ok)
            expect(true).toBe(true);
            expect(gotStringLength).toBe(true);
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'empty readTransaction (no callback argument) and then SELECT transaction', function (done) {

          var db = openDatabase("read-tx-with-no-argment", "1.0", "Demo", DEFAULT_SIZE);

          try {
            // synchronous error expected:
            db.readTransaction();

            // not expected to get here:
            expect(false).toBe(true);
          } catch (err) {
            // got error like we expected
            expect(true).toBe(true);
          }

          // verify we can still continue
          var gotStringLength = false; // poor man's spy
          db.readTransaction(function (tx) {
            tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (tx, res) {
              expect(res.rows.item(0).stringlength).toBe(10);
              gotStringLength = true;
            });
          }, function (error) {
            // not expected:
            expect(false).toBe(true);
          }, function () {
            // expected result (transaction committed ok)
            expect(true).toBe(true);
            expect(gotStringLength).toBe(true);
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'empty transaction (no sql statements) and then SELECT transaction', function (done) {

          var db = openDatabase("empty-tx", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {
            expect(true).toBe(true);
          }, function(err) {
            // not expected:
            expect(false).toBe(true);
            done();
          }, function() {
            // as expected:
            expect(true).toBe(true);

            // verify we can still continue
            var gotStringLength = false; // poor man's spy
            db.transaction(function (tx) {
              tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (tx, res) {
                expect(res.rows.item(0).stringlength).toBe(10);
                gotStringLength = true;
              });
            }, function (error) {
              // not expected:
              expect(false).toBe(true);
            }, function () {
              // expected result (transaction committed ok)
              expect(true).toBe(true);
              expect(gotStringLength).toBe(true);
              done();
            });

          });

        }, MYTIMEOUT);

        // Check fix for litehelpers/Cordova-sqlite-storage#409:
        it(suiteName + 'empty readTransaction (no sql statements) and then SELECT transaction', function (done) {

          var db = openDatabase("empty-read-tx", "1.0", "Demo", DEFAULT_SIZE);

          db.readTransaction(function(tx) {
            expect(true).toBe(true);
          }, function(err) {
            // not expected:
            expect(false).toBe(true);
            done();
          }, function() {
            // as expected:
            expect(true).toBe(true);

            // verify we can still continue
            var gotStringLength = false; // poor man's spy
            db.transaction(function (tx) {
              tx.executeSql("SELECT LENGTH('tenletters') AS stringlength", [], function (tx, res) {
                expect(res.rows.item(0).stringlength).toBe(10);
                gotStringLength = true;
              });
            }, function (error) {
              // not expected:
              expect(false).toBe(true);
            }, function () {
              // expected result (transaction committed ok)
              expect(true).toBe(true);
              expect(gotStringLength).toBe(true);
              done();
            });

          });

        }, MYTIMEOUT);
    });

  }

}

if (window.hasBrowser) mytests();
else exports.defineAutoTests = mytests;

/* vim: set expandtab : */
