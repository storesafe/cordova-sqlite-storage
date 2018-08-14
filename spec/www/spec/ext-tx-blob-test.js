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

    describe(scenarioList[i] + ': ext tx blob test(s)', function() {
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
            // explicit database location:
            location: 'default',
            androidDatabaseImplementation: 2,
            androidLockWorkaround: 1
          });
        }
        if (isWebSql) {
          return window.openDatabase(name, '1.0', 'Test', DEFAULT_SIZE);
        } else {
          // explicit database location:
          return window.sqlitePlugin.openDatabase({name: name, location: 'default'});
        }
      }

      describe(scenarioList[i] + ': Blob object test(s)', function() {

        // This test shows that the plugin does not throw an error when trying to serialize
        // a non-standard parameter type. Blob becomes an empty dictionary on iOS, for example,
        // and so this verifies the type is converted to a string and continues. Web SQL does
        // the same but on the JavaScript side and converts to a string like `[object Blob]`.
        it(suiteName + "INSERT Blob from ArrayBuffer (non-standard parameter type)", function(done) {
          if (/Android 4.[1-3]/.test(navigator.userAgent)) pending('SKIP for Android 4.1-4.3');

          // IMPORTANT:
          if (typeof Blob === "undefined") pending('Blob type does not exist');

          // SKIP this test if ArrayBuffer is undefined
          // TODO: consider trying this for multiple non-standard parameter types instead
          if (typeof ArrayBuffer === "undefined") pending('ArrayBuffer type does not exist');

          var db = openDatabase('Blob-object-from-ArrayBuffer-test.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            var buffer = new ArrayBuffer(5);
            var view   = new Uint8Array(buffer);
            view[0] = 'h'.charCodeAt();
            view[1] = 'e'.charCodeAt();
            view[2] = 'l'.charCodeAt();
            view[3] = 'l'.charCodeAt();
            view[4] = 'o'.charCodeAt();
            var blob = new Blob([view.buffer], { type:"application/octet-stream" });

            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (foo blob)');
            tx.executeSql('INSERT INTO test_table VALUES (?)', [blob], function(txIgnored, rs) {
              // EXPECTED RESULT:
              expect(rs).toBeDefined();
              done();
            }, function(tx, error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              expect(error.message).toBe('--');
              done();
            });
          }, function(err) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(err.message).toBe('--');
            done();
          });
        });

      });

    });
  }

}

if (window.hasBrowser) mytests();
else exports.defineAutoTests = mytests;

/* vim: set expandtab : */
