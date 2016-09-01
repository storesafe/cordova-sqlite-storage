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

var mytests = function() {

  for (var i=0; i<scenarioCount; ++i) {
    describe(scenarioList[i] + ': db tx sql features test(s)', function() {
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

}

if (window.hasBrowser) mytests();
else exports.defineAutoTests = mytests;

/* vim: set expandtab : */
