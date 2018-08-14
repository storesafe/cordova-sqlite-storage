/* 'use strict'; */

var MYTIMEOUT = 12000;

// NOTE: DEFAULT_SIZE wanted depends on type of browser

var isWindows = /MSAppHost/.test(navigator.userAgent);
var isAndroid = !isWindows && /Android/.test(navigator.userAgent);
var isFirefox = /Firefox/.test(navigator.userAgent);
var isWebKitBrowser = !isWindows && !isAndroid && /Safari/.test(navigator.userAgent);
var isBrowser = isWebKitBrowser || isFirefox;
var isEdgeBrowser = isBrowser && (/Edge/.test(navigator.userAgent));
var isChromeBrowser = isBrowser && !isEdgeBrowser && (/Chrome/.test(navigator.userAgent));
var isSafariBrowser = isWebKitBrowser && !isEdgeBrowser && !isChromeBrowser;

// should avoid popups (Safari seems to count 2x)
var DEFAULT_SIZE = isSafariBrowser ? 2000000 : 5000000;
// FUTURE TBD: 50MB should be OK on Chrome and some other test browsers.

// NOTE: While in certain version branches there is no difference between
// the default Android implementation and implementation #2,
// this test script will also apply the androidLockWorkaround: 1 option
// in case of implementation #2.
var scenarioList = [
  isAndroid ? 'Plugin-implementation-default' : 'Plugin',
  'HTML5',
  'Plugin-implementation-2'
];

var scenarioCount = (!!window.hasWebKitWebSQL) ? (isAndroid ? 3 : 2) : 1;

var mytests = function() {

  for (var i=0; i<scenarioCount; ++i) {
    // TBD skip plugin test on browser platform (not yet supported):
    if (isBrowser && (i === 0)) continue;

    // GENERAL: SKIP ALL on WP8 for now
    describe(scenarioList[i] + ': db tx error mapping test(s)' +
             (isWindows ?
              ' [Windows version with INCORRECT error code (0) & INCONSISTENT error message (missing actual error info)]' :
               ''), function() {
      var scenarioName = scenarioList[i];
      var suiteName = scenarioName + ': ';
      var isWebSql = (i === 1);
      var isImpl2 = (i === 2);
      // XXX TBD WORKAROUND SOLUTION for (WebKit) Web SQL on Safari browser (TEST DB NAME IGNORED):
      var recycleWebDatabase = null;

      // NOTE: MUST be defined in function scope, NOT outer scope:
      var openDatabase = function(name, ignored1, ignored2, ignored3) {
        if (isWebSql && isSafariBrowser && !!recycleWebDatabase)
          return recycleWebDatabase;
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
          return recycleWebDatabase =
            window.openDatabase(name, '1.0', 'Test', DEFAULT_SIZE);
        } else {
          return window.sqlitePlugin.openDatabase({name: name, location: 0});
        }
      }


        // ERROR MAPPING ISSUES/DEVIATIONS:
        //
        // - In case an executeSql error handler returns true (WebKit) Web SQL indicates
        //   error code 0 (SQLError.UNKNOWN_ERR) in the transaction error callback
        // - In certain database error cases (WebKit) Web SQL and plugin on Android
        //   (no androidDatabaseImplementation: 2 setting) & iOS report SQLError code 5
        //   (SQLError.SYNTAX_ERR) wile it should be 1 (SQLError.DATABASE_ERR)
        //   ("not covered by any other error code") ref:
        //   https://www.w3.org/TR/webdatabase/#dom-sqlerror-code-1
        // - Android plugin with androidDatabaseImplementation: 2 setting indicates SQLError code 0
        //   (SQLError.UNKNOWN_ERR) in cases other than a syntax error or constraint violation
        // - Windows plugin always reports error code 0 (SQLError.UNKNOWN_ERR) and
        //   INCONSISTENT messages (missing actual error info)

        // OTHER ERROR MAPPING NOTES:
        //
        // - (WebKit) Web SQL apparently includes 'prepare statement error' vs
        //   'execute statement error' info along with the sqlite error code
        // - Default Android implementation (Android-sqlite-connector) includes
        //   sqlite3_prepare_v2 vs sqlite3_step function call info indicating
        //   'prepare statement error' vs 'execute statement error'
        // - Android plugin with androidDatabaseImplementation: 2 setting includes the sqlite error code
        // - Windows plugin also includes info indicating 'prepare statement error' vs
        //   'execute statement error', along with sqlite error code in case of
        //   'execute statement error'

        // GENERAL NOTE: ERROR MESSAGES are subject to improvements and other possible changes.

        it(suiteName + 'syntax error: command with misspelling', function(done) {
          var db = openDatabase("Syntax-error-test.db", "1.0", "Demo", DEFAULT_SIZE);
          expect(db).toBeDefined();

          var sqlerror = null; // VERIFY this was received

          db.transaction(function(tx) {
            // This insertion has a SQL syntax error
            tx.executeSql('SLCT 1 ', [], function(tx) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              throw new Error('abort tx');

            }, function(tx, error) {
              sqlerror = error;
              expect(error).toBeDefined();
              expect(error.code).toBeDefined();
              expect(error.message).toBeDefined();

              // error.hasOwnProperty('message') apparently NOT WORKING on
              // WebKit Web SQL on Android 5.x/... or iOS 10.x/...:
              if (!isWebSql || isWindows || (isAndroid && (/Android 4/.test(navigator.userAgent))))
                expect(error.hasOwnProperty('message')).toBe(true);

              if (isWindows || (isAndroid && isImpl2))
                expect(error.code).toBe(0);
              else
                expect(error.code).toBe(5);

              if (isWebSql && !(/Android 4.[1-3]/.test(navigator.userAgent)))
                expect(error.message).toMatch(/could not prepare statement.*1 near \"SLCT\": syntax error/);
              else if (isWindows)
                expect(error.message).toMatch(/Error preparing an SQLite statement/);
              else if (!isWebSql && !isWindows && isAndroid && !isImpl2)
                expect(error.message).toMatch(/sqlite3_prepare_v2 failure:.*near \"SLCT\": syntax error/);
              else if (!isWebSql && !isWindows && isAndroid && isImpl2)
                expect(error.message).toMatch(/near \"SLCT\": syntax error.*code 1.*while compiling: SLCT 1/);
              else
                expect(error.message).toMatch(/near \"SLCT\": syntax error/);

              // FAIL transaction & check reported transaction error:
              return true;
            });
          }, function (error) {
            expect(!!sqlerror).toBe(true); // VERIFY the SQL error callback was triggered

            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.message).toBeDefined();

            // error.hasOwnProperty('message') apparently NOT WORKING on
            // WebKit Web SQL on Android 5.x/... or iOS 10.x/...:
            if (!isWebSql || isWindows || (isAndroid && (/Android 4/.test(navigator.userAgent))))
              expect(error.hasOwnProperty('message')).toBe(true);

            if (isWindows || isWebSql || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWebSql)
              expect(error.message).toMatch(/callback raised an exception.*or.*error callback did not return false/);
            else if (isWindows)
              expect(error.message).toMatch(/error callback did not return false.*Error preparing an SQLite statement/);
            else
              expect(error.message).toMatch(/error callback did not return false.*syntax error/);

            isWebSql ? done() : db.close(done, done);
          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            isWebSql ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'INSERT with VALUES in the wrong place (with a trailing space) [XXX TBD "incomplete input" vs "syntax error" message on (WebKit) Web SQL on Android 8.x/...]', function(done) {
          var db = openDatabase("INSERT-Syntax-error-test.db", "1.0", "Demo", DEFAULT_SIZE);
          expect(db).toBeDefined();

          var sqlerror = null; // VERIFY this was received

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (data unique)');

            // This insertion has a SQL syntax error
            tx.executeSql('INSERT INTO test_table (data) VALUES ', [123], function(tx) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              throw new Error('abort tx');

            }, function(tx, error) {
              sqlerror = error;
              expect(error).toBeDefined();
              expect(error.code).toBeDefined();
              expect(error.message).toBeDefined();

              // error.hasOwnProperty('message') apparently NOT WORKING on
              // WebKit Web SQL on Android 5.x/... or iOS 10.x/...:
              if (!isWebSql || isWindows || (isAndroid && (/Android 4/.test(navigator.userAgent))))
                expect(error.hasOwnProperty('message')).toBe(true);

              if (isWindows || (isAndroid && isImpl2))
                expect(error.code).toBe(0);
              else
                expect(error.code).toBe(5);

              if (isWebSql && (/Android [7-9]/.test(navigator.userAgent)))
                expect(error.message).toMatch(/could not prepare statement.*/); // XXX TBD incomplete input vs syntax error message on Android 8(+)
              else if (isWebSql && !isChromeBrowser && !(/Android 4.[1-3]/.test(navigator.userAgent)))
                expect(error.message).toMatch(/could not prepare statement.*1 near \"VALUES\": syntax error/);
              else if (isWebSql && isBrowser)
                expect(error.message).toMatch(/could not prepare statement.*1 incomplete input/);
              else if (isWebSql)
                expect(error.message).toMatch(/near \"VALUES\": syntax error/);
              else if (isWindows)
                expect(error.message).toMatch(/Error preparing an SQLite statement/);
              else if (isAndroid && !isImpl2)
                expect(error.message).toMatch(/sqlite3_prepare_v2 failure:.*incomplete input/);
              else if (isAndroid && isImpl2)
                expect(error.message).toMatch(/near \"VALUES\": syntax error.*code 1.*while compiling: INSERT INTO test_table/);
              else
                expect(error.message).toMatch(/incomplete input/);

              // FAIL transaction & check reported transaction error:
              return true;
            });
          }, function (error) {
            expect(!!sqlerror).toBe(true); // VERIFY the SQL error callback was triggered
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.message).toBeDefined();

            // error.hasOwnProperty('message') apparently NOT WORKING on
            // WebKit Web SQL on Android 5.x/... or iOS 10.x/...:
            if (!isWebSql || isWindows || (isAndroid && (/Android 4/.test(navigator.userAgent))))
              expect(error.hasOwnProperty('message')).toBe(true);

            if (isWindows || isWebSql || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWebSql)
              expect(error.message).toMatch(/callback raised an exception.*or.*error callback did not return false/);
            else if (isWindows)
              expect(error.message).toMatch(/error callback did not return false.*Error preparing an SQLite statement/);
            //* else //* XXX TBD
            //*   expect(error.message).toMatch(/error callback did not return false.*syntax error/);

            isWebSql ? done() : db.close(done, done);
          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            isWebSql ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'constraint violation', function(done) {
          var db = openDatabase("Constraint-violation-test.db", "1.0", "Demo", DEFAULT_SIZE);
          expect(db).toBeDefined();

          var sqlerror = null; // VERIFY this was received

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (data unique)');

            // First INSERT OK:
            tx.executeSql("INSERT INTO test_table (data) VALUES (?)", [123], null, function(tx, error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              expect(error.message).toBe('--');
            });

            // Second INSERT will violate the unique constraint:
            tx.executeSql('INSERT INTO test_table (data) VALUES (?)', [123], function(tx) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              throw new Error('abort tx');

            }, function(tx, error) {
              sqlerror = error;
              expect(error).toBeDefined();
              expect(error.code).toBeDefined();
              expect(error.message).toBeDefined();

              // error.hasOwnProperty('message') apparently NOT WORKING on
              // WebKit Web SQL on Android 5.x/... or iOS 10.x/...:
              if (!isWebSql || isWindows || (isAndroid && (/Android 4/.test(navigator.userAgent))))
                expect(error.hasOwnProperty('message')).toBe(true);

              if (isWebSql && (!isAndroid || /Android 4.[1-3]/.test(navigator.userAgent)))
                expect(true).toBe(true); // SKIP for iOS (WebKit) & Android 4.1-4.3 (WebKit) Web SQL
              else if (isWindows)
                expect(error.code).toBe(0);
              else
                expect(error.code).toBe(6);

              // (WebKit) Web SQL (Android/iOS) possibly with a missing 'r'
              if (isWebSql && /Android 4.[1-3]/.test(navigator.userAgent))
                expect(error.message).toMatch(/column data is not unique/);
              else if (isWebSql && isAndroid)
                expect(error.message).toMatch(/could not execute statement due to a constr?aint failure.*19.*constraint failed/);
              else if (isWebSql)
                expect(error.message).toMatch(/constr?aint fail/); // [possibly missing letter on iOS (WebKit) Web SQL]
              else if (isWindows)
                expect(error.message).toMatch(/SQLite3 step error result code: 1/);
              else if (isAndroid && !isImpl2)
                expect(error.message).toMatch(/sqlite3_step failure: UNIQUE constraint failed: test_table\.data/);
              else if (isAndroid && isImpl2)
                expect(error.message).toMatch(/constraint failure/);
              else
                expect(error.message).toMatch(/UNIQUE constraint failed: test_table\.data/);

              // FAIL transaction & check reported transaction error:
              return true;
            });
          }, function (error) {
            expect(!!sqlerror).toBe(true); // VERIFY the SQL error callback was triggered

            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.message).toBeDefined();

            // error.hasOwnProperty('message') apparently NOT WORKING on
            // WebKit Web SQL on Android 5.x/... or iOS 10.x/...:
            if (!isWebSql || isWindows || (isAndroid && (/Android 4/.test(navigator.userAgent))))
              expect(error.hasOwnProperty('message')).toBe(true);

            if (isWindows || isWebSql)
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(6);

            if (isWebSql)
              expect(error.message).toMatch(/callback raised an exception.*or.*error callback did not return false/);
            else if (isWindows)
              expect(error.message).toMatch(/error callback did not return false.*SQLite3 step error result code: 1/);
            else
              expect(error.message).toMatch(/error callback did not return false.*constraint fail/);

            isWebSql ? done() : db.close(done, done);
          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            isWebSql ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT uper("Test") (misspelled function name) [INCORRECT error code WebKit Web SQL & plugin]', function(done) {
          var db = openDatabase("Misspelled-function-name-error-test.db", "1.0", "Demo", DEFAULT_SIZE);
          expect(db).toBeDefined();

          var sqlerror = null; // VERIFY this was received

          db.transaction(function(tx) {
            // This insertion has a SQL syntax error
            tx.executeSql('SELECT uper("Test")', [], function(tx) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              throw new Error('abort tx');

            }, function(tx, error) {
              sqlerror = error;
              expect(error).toBeDefined();
              expect(error.code).toBeDefined();
              expect(error.message).toBeDefined();

              // error.hasOwnProperty('message') apparently NOT WORKING on
              // WebKit Web SQL on Android 5.x/... or iOS 10.x/...:
              if (!isWebSql || isWindows || (isAndroid && (/Android 4/.test(navigator.userAgent))))
                expect(error.hasOwnProperty('message')).toBe(true);

              if (isWindows || (isAndroid && isImpl2))
                expect(error.code).toBe(0);
              else
                expect(error.code).toBe(5);

              // ACTUAL WebKit Web SQL vs plugin error.message
              if (isWebSql && !(/Android 4.[1-3]/.test(navigator.userAgent)))
                expect(error.message).toMatch(/could not prepare statement.*1 no such function: uper/);
              else if (isWindows)
                expect(error.message).toMatch(/Error preparing an SQLite statement/);
              else if (!isWebSql && !isWindows && isAndroid && !isImpl2)
                expect(error.message).toMatch(/sqlite3_prepare_v2 failure:.*no such function: uper/);
              else if (!isWebSql && !isWindows && isAndroid && isImpl2)
                expect(error.message).toMatch(/no such function: uper.*code 1/);
              else
                expect(error.message).toMatch(/no such function: uper/);

              // FAIL transaction & check reported transaction error:
              return true;
            });
          }, function (error) {
            expect(!!sqlerror).toBe(true); // VERIFY the SQL error callback was triggered

            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.message).toBeDefined();

            // error.hasOwnProperty('message') apparently NOT WORKING on
            // WebKit Web SQL on Android 5.x/... or iOS 10.x/...:
            if (!isWebSql || isWindows || (isAndroid && (/Android 4/.test(navigator.userAgent))))
              expect(error.hasOwnProperty('message')).toBe(true);

            if (isWebSql || isWindows || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWebSql)
              expect(error.message).toMatch(/callback raised an exception.*or.*error callback did not return false/);
            else if (isWindows)
              expect(error.message).toMatch(/error callback did not return false.*Error preparing an SQLite statement/);
            else
              expect(error.message).toMatch(/error callback did not return false.*no such function: uper/);

            isWebSql ? done() : db.close(done, done);
          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            isWebSql ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT FROM bogus table (other database error) [INCORRECT error code WebKit Web SQL & plugin]', function(done) {
          var db = openDatabase("SELECT-FROM-bogus-table-error-test.db", "1.0", "Demo", DEFAULT_SIZE);
          expect(db).toBeDefined();

          var sqlerror = null; // VERIFY the SQL error callback was triggered

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS BogusTable');
            // Attempt to SELECT FROM a bogus table:
            tx.executeSql('SELECT * FROM BogusTable', [], function(ignored1, ignored2) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              throw new Error('abort tx');

            }, function(tx, error) {
              sqlerror = error;
              expect(error).toBeDefined();
              expect(error.code).toBeDefined();
              expect(error.message).toBeDefined();

              // error.hasOwnProperty('message') apparently NOT WORKING on
              // WebKit Web SQL on Android 5.x/... or iOS 10.x/...:
              if (!isWebSql || isWindows || (isAndroid && (/Android 4/.test(navigator.userAgent))))
                expect(error.hasOwnProperty('message')).toBe(true);

              if (isWindows || (isAndroid && isImpl2))
                expect(error.code).toBe(0);
              else
                expect(error.code).toBe(5);

              if (isWebSql && !(/Android 4.[1-3]/.test(navigator.userAgent)))
                expect(error.message).toMatch(/could not prepare statement.*1 no such table: BogusTable/);
              else if (isWindows)
                expect(error.message).toMatch(/Error preparing an SQLite statement/);
              else if (!isWebSql && !isWindows && isAndroid && !isImpl2)
                expect(error.message).toMatch(/sqlite3_prepare_v2 failure:.*no such table: BogusTable/);
              else if (!isWebSql && !isWindows && isAndroid && isImpl2)
                expect(error.message).toMatch(/no such table: BogusTable.*code 1/);
              else
                expect(error.message).toMatch(/no such table: BogusTable/);

              // FAIL transaction & check reported transaction error:
              return true;
            });
          }, function (error) {
            expect(!!sqlerror).toBe(true); // VERIFY the SQL error callback was triggered
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.message).toBeDefined();

            // error.hasOwnProperty('message') apparently NOT WORKING on
            // WebKit Web SQL on Android 5.x/... or iOS 10.x/...:
            if (!isWebSql || isWindows || (isAndroid && (/Android 4/.test(navigator.userAgent))))
              expect(error.hasOwnProperty('message')).toBe(true);

            if (isWebSql || isWindows || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWebSql)
              expect(error.message).toMatch(/callback raised an exception.*or.*error callback did not return false/);
            else if (isWindows)
              expect(error.message).toMatch(/error callback did not return false.*Error preparing an SQLite statement/);
            else
              expect(error.message).toMatch(/error callback did not return false.*no such table: BogusTable/);

            isWebSql ? done() : db.close(done, done);
          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            isWebSql ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'INSERT missing column [INCORRECT error code WebKit Web SQL & plugin]', function(done) {
          var db = openDatabase("INSERT-missing-column-test.db", "1.0", "Demo", DEFAULT_SIZE);
          expect(db).toBeDefined();

          var sqlerror = null; // VERIFY this was received

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (data1, data2)');

            tx.executeSql('INSERT INTO test_table VALUES (?)', ['abcdef'], function(tx) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              throw new Error('abort tx');

            }, function(tx, error) {
              sqlerror = error;
              expect(error).toBeDefined();
              expect(error.code).toBeDefined();
              expect(error.message).toBeDefined();

              // error.hasOwnProperty('message') apparently NOT WORKING on
              // WebKit Web SQL on Android 5.x/... or iOS 10.x/...:
              if (!isWebSql || isWindows || (isAndroid && (/Android 4/.test(navigator.userAgent))))
                expect(error.hasOwnProperty('message')).toBe(true);

              if (isWindows || (isAndroid && isImpl2))
                expect(error.code).toBe(0);
              else
                expect(error.code).toBe(5);

              if (isWebSql && !(/Android 4.[1-3]/.test(navigator.userAgent)))
                expect(error.message).toMatch(/could not prepare statement.*1 table test_table has 2 columns but 1 values were supplied/);
              else if (isWindows)
                expect(error.message).toMatch(/Error preparing an SQLite statement/);
              else if (!isWebSql && !isWindows && isAndroid && !isImpl2)
                expect(error.message).toMatch(/sqlite3_prepare_v2 failure:.*table test_table has 2 columns but 1 values were supplied/);
              else if (!isWebSql && !isWindows && isAndroid && isImpl2)
                expect(error.message).toMatch(/table test_table has 2 columns but 1 values were supplied.*code 1.*while compiling: INSERT INTO test_table/);
              else
                expect(error.message).toMatch(/table test_table has 2 columns but 1 values were supplied/);

              // FAIL transaction & check reported transaction error:
              return true;
            });
          }, function (error) {
            expect(!!sqlerror).toBe(true); // VERIFY the SQL error callback was triggered

            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.message).toBeDefined();

            // error.hasOwnProperty('message') apparently NOT WORKING on
            // WebKit Web SQL on Android 5.x/... or iOS 10.x/...:
            if (!isWebSql || isWindows || (isAndroid && (/Android 4/.test(navigator.userAgent))))
              expect(error.hasOwnProperty('message')).toBe(true);

            if (isWebSql || isWindows || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWebSql)
              expect(error.message).toMatch(/callback raised an exception.*or.*error callback did not return false/);
            else if (isWindows)
              expect(error.message).toMatch(/error callback did not return false.*Error preparing an SQLite statement/);
            else
              expect(error.message).toMatch(/error callback did not return false.*table test_table has 2 columns but 1 values were supplied/);

            isWebSql ? done() : db.close(done, done);
          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            isWebSql ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'INSERT wrong column name [INCORRECT error code WebKit Web SQL & plugin]', function(done) {
          var db = openDatabase("INSERT-wrong-column-name-test.db", "1.0", "Demo", DEFAULT_SIZE);
          expect(db).toBeDefined();

          var sqlerror = null; // VERIFY this was received

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (data1)');

            tx.executeSql('INSERT INTO test_table (wrong_column) VALUES (?)', ['abcdef'], function(tx) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              throw new Error('abort tx');

            }, function(tx, error) {
              sqlerror = error;
              expect(error).toBeDefined();
              expect(error.code).toBeDefined();
              expect(error.message).toBeDefined();

              // error.hasOwnProperty('message') apparently NOT WORKING on
              // WebKit Web SQL on Android 5.x/... or iOS 10.x/...:
              if (!isWebSql || isWindows || (isAndroid && (/Android 4/.test(navigator.userAgent))))
                expect(error.hasOwnProperty('message')).toBe(true);

              if (isWindows || (isAndroid && isImpl2))
                expect(error.code).toBe(0);
              else
                expect(error.code).toBe(5);

              if (isWebSql && !(/Android 4.[1-3]/.test(navigator.userAgent)))
                expect(error.message).toMatch(/could not prepare statement.*1 table test_table has no column named wrong_column/);
              else if (isWindows)
                expect(error.message).toMatch(/Error preparing an SQLite statement/);
              else if (!isWebSql && !isWindows && isAndroid && !isImpl2)
                expect(error.message).toMatch(/sqlite3_prepare_v2 failure:.*table test_table has no column named wrong_column/);
              else if (!isWebSql && !isWindows && isAndroid && isImpl2)
                expect(error.message).toMatch(/table test_table has no column named wrong_column.*code 1.*while compiling: INSERT INTO test_table/);
              else
                expect(error.message).toMatch(/table test_table has no column named wrong_column/);

              // FAIL transaction & check reported transaction error:
              return true;
            });
          }, function (error) {
            expect(!!sqlerror).toBe(true); // VERIFY the SQL error callback was triggered

            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.message).toBeDefined();

            // error.hasOwnProperty('message') apparently NOT WORKING on
            // WebKit Web SQL on Android 5.x/... or iOS 10.x/...:
            if (!isWebSql || isWindows || (isAndroid && (/Android 4/.test(navigator.userAgent))))
              expect(error.hasOwnProperty('message')).toBe(true);

            if (isWebSql || isWindows || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWebSql)
              expect(error.message).toMatch(/callback raised an exception.*or.*error callback did not return false/);
            else if (isWindows)
              expect(error.message).toMatch(/error callback did not return false.*Error preparing an SQLite statement/);
            else
              expect(error.message).toMatch(/error callback did not return false.*table test_table has no column named wrong_column/);

            isWebSql ? done() : db.close(done, done);
          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            isWebSql ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        // NOTE: For some reason the Android/iOS (WebKit) Web SQL implementation
        // claims to detect the error at the "prepare statement" stage while the
        // plugin detects the error at the "execute statement" stage.
        it(suiteName + 'CREATE VIRTUAL TABLE USING bogus module (other database error) [INCORRECT error code WebKit Web SQL & plugin]', function(done) {
          var db = openDatabase("create-virtual-table-using-bogus-module-error-test.db", "1.0", "Demo", DEFAULT_SIZE);
          expect(db).toBeDefined();

          var sqlerror = null; // VERIFY the SQL error callback was triggered

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            // Attempt to use a bogus module:
            tx.executeSql('CREATE VIRTUAL TABLE test_table USING bogus_module (data)', [], function(ignored1, ignored2) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              throw new Error('abort tx');

            }, function(tx, error) {
              sqlerror = error;
              expect(error).toBeDefined();
              expect(error.code).toBeDefined();
              expect(error.message).toBeDefined();

              // error.hasOwnProperty('message') apparently NOT WORKING on
              // WebKit Web SQL on Android 5.x/... or iOS 10.x/...:
              if (!isWebSql || isWindows || (isAndroid && (/Android 4/.test(navigator.userAgent))))
                expect(error.hasOwnProperty('message')).toBe(true);

              if (isWindows || (!isWebSql && isAndroid && isImpl2))
                expect(error.code).toBe(0);
              else
                expect(error.code).toBe(5);

              if (isWebSql && isAndroid && !(/Android 4.[1-3]/.test(navigator.userAgent)))
                expect(error.message).toMatch(/could not prepare statement.*not authorized/);
              else if (isWebSql && isAndroid)
                expect(error.message).toMatch(/not authorized/);
              else if (isWebSql && (isBrowser && (/Chrome/.test(navigator.userAgent))))
                expect(error.message).toMatch(/could not prepare statement.*23 not authorized/);
              else if (isWebSql) // [iOS (WebKit) Web SQL]
                expect(error.message).toMatch(/could not prepare statement.*1 not authorized/);
              else if (isWindows)
                expect(error.message).toMatch(/SQLite3 step error result code: 1/);
              else if (isAndroid && !isImpl2)
                expect(error.message).toMatch(/sqlite3_step failure: no such module: bogus/);
              else if (isAndroid && isImpl2)
                expect(error.message).toMatch(/no such module: bogus.*code 1/);
              else
                expect(error.message).toMatch(/no such module: bogus/);

              // FAIL transaction & check reported transaction error:
              return true;
            });
          }, function (error) {
            expect(!!sqlerror).toBe(true); // VERIFY the SQL error callback was triggered
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.message).toBeDefined();

            // error.hasOwnProperty('message') apparently NOT WORKING on
            // WebKit Web SQL on Android 5.x/... or iOS 10.x/...:
            if (!isWebSql || isWindows || (isAndroid && (/Android 4/.test(navigator.userAgent))))
              expect(error.hasOwnProperty('message')).toBe(true);

            if (isWebSql || isWindows || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWebSql)
              expect(error.message).toMatch(/callback raised an exception.*or.*error callback did not return false/);
            else if (isWindows)
              expect(error.message).toMatch(/error callback did not return false.*SQLite3 step error result code: 1/);
            else
              expect(error.message).toMatch(/error callback did not return false.*no such module: bogus/);

            isWebSql ? done() : db.close(done, done);
          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            isWebSql ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        // TESTS with no SQL error handler:

        it(suiteName + 'transaction.executeSql syntax error (command with misspelling) with no SQL error handler', function(done) {
          db = openDatabase('tx-sql-syntax-error-with-no-sql-error-handler-test.db');
          db.transaction(function(transaction) {
            transaction.executeSql('SLCT 1');
          }, function(error) {
            // EXPECTED RESULT:
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.message).toBeDefined();

            // error.hasOwnProperty('message') apparently NOT WORKING on
            // WebKit Web SQL on Android 5.x/... or iOS 10.x/...:
            if (!isWebSql || isWindows || (isAndroid && (/Android 4/.test(navigator.userAgent))))
              expect(error.hasOwnProperty('message')).toBe(true);

            if (isWindows || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWebSql && !(/Android 4.[1-3]/.test(navigator.userAgent)))
              expect(error.message).toMatch(/could not prepare statement.*1 near \"SLCT\": syntax error/);
            else if (isWindows)
              expect(error.message).toMatch(/a statement with no error handler failed: Error preparing an SQLite statement/);
            else if (!isWebSql && !isWindows && isAndroid && !isImpl2)
              expect(error.message).toMatch(/sqlite3_prepare_v2 failure:.*near \"SLCT\": syntax error/);
            else if (!isWebSql && !isWindows && isAndroid && isImpl2)
              expect(error.message).toMatch(/a statement with no error handler failed: near \"SLCT\": syntax error.*code 1.*while compiling: SLCT 1/);
            else if (!isWebSql) // [iOS/macOS plugin]
              expect(error.message).toMatch(/a statement with no error handler failed.*near \"SLCT\": syntax error/);
            else
              expect(error.message).toMatch(/near \"SLCT\": syntax error/);

            isWebSql ? done() : db.close(done, done);
          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            isWebSql ? done() : db.close(done, done);
          })
        }, MYTIMEOUT);

        it(suiteName + 'transaction.executeSql constraint violation with no SQL error handler', function(done) {
          var db = openDatabase("Constraint-violation-with-no-sql-error-handler.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (data unique)');

            // First INSERT OK:
            tx.executeSql('INSERT INTO test_table (data) VALUES (?)', [123]);
            // Second INSERT will violate the unique constraint:
            tx.executeSql('INSERT INTO test_table (data) VALUES (?)', [123]);
          }, function (error) {
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.message).toBeDefined();

            // error.hasOwnProperty('message') apparently NOT WORKING on
            // WebKit Web SQL on Android 5.x/... or iOS 10.x/...:
            if (!isWebSql || isWindows || (isAndroid && (/Android 4/.test(navigator.userAgent))))
              expect(error.hasOwnProperty('message')).toBe(true);

            if (isWebSql && (!isAndroid || /Android 4.[1-3]/.test(navigator.userAgent)))
              expect(true).toBe(true); // SKIP for iOS (WebKit) & Android 4.1-4.3 (WebKit) Web SQL
            else if (isWindows)
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(6);

            // (WebKit) Web SQL (Android/iOS) possibly with a missing 'r'
            if (isWebSql && /Android 4.[1-3]/.test(navigator.userAgent))
              expect(error.message).toMatch(/column data is not unique/);
            else if (isWebSql && isAndroid)
              expect(error.message).toMatch(/could not execute statement due to a constr?aint failure.*19.*constraint failed/);
            else if (isWebSql)
              expect(error.message).toMatch(/constr?aint fail/);
            else if (isWindows)
              expect(error.message).toMatch(/a statement with no error handler failed: SQLite3 step error result code: 1/);
            else if (isAndroid && !isImpl2)
              expect(error.message).toMatch(/a statement with no error handler failed: sqlite3_step failure: UNIQUE constraint failed: test_table\.data/);
            else if (isAndroid && isImpl2)
              expect(error.message).toMatch(/a statement with no error handler failed:.*constraint failure/);
            else
              expect(error.message).toMatch(/a statement with no error handler failed: UNIQUE constraint failed: test_table\.data/);

            isWebSql ? done() : db.close(done, done);
          }, function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            isWebSql ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);


    });
  }

}

if (window.hasBrowser) mytests();
else exports.defineAutoTests = mytests;

/* vim: set expandtab : */
