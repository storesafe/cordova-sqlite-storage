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

    describe(scenarioList[i] + ': tx sql select value results test(s)', function() {
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

      describe(suiteName + 'Infinity value manipulation results', function() {

        // Android/iOS plugin BROKEN:
        // - CRASH on iOS as reported in litehelpers/Cordova-sqlite-storage#405
        // - Android version returns result with missing row
        it(suiteName + "SELECT ABS(?) with '9e999' (Infinity) parameter argument" +
           ((!isWebSql && isAndroid) ? ' [Android PLUGIN BROKEN: result with missing row]' : ''), function(done) {
          if (isWP8) pending('SKIP for WP8'); // (no callback received)
          if (!isWebSql && !isAndroid && !isWindows && !isWP8) pending('SKIP for iOS plugin due to CRASH');

          var db = openDatabase('Infinite-results-test.db', '1.0', 'Test', DEFAULT_SIZE);

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT ABS(?) AS myresult', ['9e999'], function(tx, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();

              if (!isWebSql && !isWindows && isAndroid)
                expect(rs.rows.length).toBe(0);
              else
                expect(rs.rows.length).toBe(1);

              if (isWebSql || isWindows)
                expect(rs.rows.item(0).myresult).toBe(Infinity);

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('---');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

      });

      describe(suiteName + 'Inline BLOB value SELECT result tests', function() {

        it(suiteName + "SELECT LOWER(X'40414243')", function(done) {
          if (isWindows) pending('SKIP: BROKEN for Windows');

          var db = openDatabase("Inline-BLOB-lower-result-test.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {

            tx.executeSql("SELECT LOWER(X'40414243') AS myresult", [], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBe('@abc');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('---');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + "SELECT X'40414243'", function(done) {
          if (isWP8) pending('SKIP for WP8'); // [BROKEN: CRASH with uncaught exception]
          if (!isWebSql && isAndroid && isImpl2) pending('SKIP: BROKEN for androidDatabaseImplementation: 2');
          if (isWindows) pending('SKIP: BROKEN for Windows');

          var db = openDatabase("Inline-BLOB-SELECT-result-test.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {

            tx.executeSql("SELECT X'40414243' AS myresult", [], function(ignored, rs) {
              if (!isWebSql && isAndroid && isImpl2) expect('Behavior changed please update this test').toBe('--');
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBe('@ABC');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            }, function(ignored, error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              expect(error.message).toBe('---');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function(error) {
            if (!isWebSql && isAndroid && isImpl2) {
              expect(error).toBeDefined();
              expect(error.code).toBeDefined();
              expect(error.message).toBeDefined();

              // TBD wrong error code
              expect(error.code).toBe(0);
              expect(error.message).toMatch(/error callback did not return false: unknown error.*code 0.*Unable to convert BLOB to string/);
            } else {
              // NOT EXPECTED:
              expect(false).toBe(true);
              expect(error.message).toBe('---');
            }

            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

      });

    });

  }

}

if (window.hasBrowser) mytests();
else exports.defineAutoTests = mytests;

/* vim: set expandtab : */
