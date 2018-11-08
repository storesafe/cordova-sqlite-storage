/* 'use strict'; */

var MYTIMEOUT = 12000;

// NOTE: DEFAULT_SIZE wanted depends on type of browser

var isWindows = /MSAppHost/.test(navigator.userAgent);
var isAndroid = !isWindows && /Android/.test(navigator.userAgent);
var isFirefox = /Firefox/.test(navigator.userAgent);
var isWebKitBrowser = !isWindows && !isAndroid && /Safari/.test(navigator.userAgent);
var isBrowser = isWebKitBrowser || isFirefox;
var isEdgeBrowser = isBrowser && (/Edge/.test(navigator.userAgent));
var isSafariBrowser = isWebKitBrowser && !isEdgeBrowser && !isChromeBrowser;
var isMac = !isBrowser && /Macintosh/.test(navigator.userAgent);
var isAppleMobileOS = /iPhone/.test(navigator.userAgent) ||
      /iPad/.test(navigator.userAgent) || /iPod/.test(navigator.userAgent);
var hasMobileWKWebView = isAppleMobileOS && !!window.webkit && !!window.webkit.messageHandlers;

// should avoid popups (Safari seems to count 2x)
var DEFAULT_SIZE = isSafariBrowser ? 2000000 : 5000000;
// FUTURE TBD: 50MB should be OK on Chrome and some other test browsers.

// The following openDatabase settings are used for Plugin-implementation-2
// on Android:
// - androidDatabaseImplementation: 2
// - androidLockWorkaround: 1
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

    describe(scenarioList[i] + ': tx sql select value results test(s)', function() {
      var scenarioName = scenarioList[i];
      var suiteName = scenarioName + ': ';
      var isWebSql = (i === 1);
      var isImpl2 = (i === 2);
      // TBD WORKAROUND SOLUTION for (WebKit) Web SQL on Safari browser:
      var recycleWebDatabase = null;

      // NOTE 1: MUST be defined in proper describe function scope, NOT outer scope.
      // NOTE 2: Using same database name in this script to avoid issue with
      //         "Too many open files" on iOS with WKWebView engine plugin.
      //         (FUTURE TBD NEEDS INVESTIGATION)
      var openDatabase = function(name_ignored, ignored1, ignored2, ignored3) {
        var name = 'select-value-test.db';
        if (isWebSql && isSafariBrowser && !!recycleWebDatabase)
          return recycleWebDatabase;
        if (isImpl2) {
          return window.sqlitePlugin.openDatabase({
            // prevent reuse of database from default db implementation:
            name: 'i2-'+name,
            androidDatabaseImplementation: 2,
            androidLockWorkaround: 1,
            location: 'default'
          });
        }
        if (isWebSql) {
          return recycleWebDatabase =
            window.openDatabase(name, '1.0', 'Test', DEFAULT_SIZE);
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
          if (isWebSql && /Android 4.[1-3]/.test(navigator.userAgent)) pending('SKIP for (WebKit) Web SQL on Android 4.1-4.3'); // XXX TBD
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

        // Truthy string
        // ref: https://developer.mozilla.org/en-US/docs/Glossary/Truthy
        it(suiteName + "SELECT TYPEOF(?) with ['abc'] parameter argument", function(done) {
          var db = openDatabase('SELECT-TYPEOF-with-abc-TEXT-string-argument.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT TYPEOF(?) as myresult', ['abc'], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBe('text');
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        // Falsy string
        // ref: https://developer.mozilla.org/en-US/docs/Glossary/Falsy

        it(suiteName + "SELECT TYPEOF('') (INLINE empty string) parameter argument", function(done) {
          var db = openDatabase('SELECT-TYPEOF-with-inline-empty-TEXT-string-argument.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql("SELECT TYPEOF('') as myresult", null, function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBe('text');
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + "SELECT UPPER('') (INLINE empty string) parameter argument", function(done) {
          var db = openDatabase('SELECT-UPPER-with-inline-empty-TEXT-string-argument.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql("SELECT UPPER('') as myresult", null, function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBe('');
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + "SELECT '' (INLINE empty string) parameter argument", function(done) {
          var db = openDatabase('SELECT-UPPER-with-inline-empty-TEXT-string-argument.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql("SELECT '' as myresult", null, function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBe('');
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        // TBD for some reason on Android plugin with androidDatabaseImplementation:2 setting
        // TYPEOF returns text

        it(suiteName + 'SELECT TYPEOF(?) with [null] parameter argument [returns text in case of androidDatabaseImplementation: 2]', function(done) {
          var db = openDatabase('SELECT-TYPEOF-with-null-argument.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT TYPEOF(?) as myresult', [null], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (!isWebSql && isAndroid && isImpl2)
                expect(rs.rows.item(0).myresult).toBe('text');
              else
                expect(rs.rows.item(0).myresult).toBe('null');
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT ? with [null] parameter argument [returns text in case of androidDatabaseImplementation: 2]', function(done) {
          var db = openDatabase('SELECT-with-null-argument.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT ? as myresult', [null], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (!isWebSql && isAndroid && isImpl2)
                expect(rs.rows.item(0).myresult).toBe('');
              else
                expect(rs.rows.item(0).myresult).toBe(null);
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT TYPEOF(?) with [undefined] parameter argument [returns text in case of Android (WebKit) Web SQL or androidDatabaseImplementation: 2]', function(done) {
          var db = openDatabase('SELECT-TYPEOF-with-undefined-argument.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT TYPEOF(?) as myresult', [undefined], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if ((isWebSql && (isAndroid || isChromeBrowser)) ||
                  (!isWebSql && isAndroid && isImpl2))
                expect(rs.rows.item(0).myresult).toBe('text');
              else
                expect(rs.rows.item(0).myresult).toBe('null');
              done();
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT ? with [undefined] parameter argument [returns text in case of androidDatabaseImplementation: 2]', function(done) {
          var db = openDatabase('SELECT-with-undefined-argument.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT ? as myresult', [undefined], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (isWebSql && (isAndroid || isChromeBrowser))
                expect(rs.rows.item(0).myresult).toBe('undefined');
              else if (!isWebSql && isAndroid && isImpl2)
                expect(rs.rows.item(0).myresult).toBe('');
              else
                expect(rs.rows.item(0).myresult).toBe(null);
              done();
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        // Truthy number values
        // ref: https://developer.mozilla.org/en-US/docs/Glossary/Truthy

        // TBD for some reason Android/iOS WebKit Web SQL implementation returns
        // TYPEOF(?) with integer parameter arg value as 'real'
        // though it DOES apparently handle integer parameter arg value as
        // an integer.

        it(suiteName + 'SELECT TYPEOF(101) INLINE', function(done) {
          var db = openDatabase('SELECT-TYPEOF-101-inline.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT TYPEOF(101) as myresult', [], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBe('integer');
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT ABS(101) INLINE', function(done) {
          var db = openDatabase('SELECT-ABS-101-inline.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT ABS(101) as myresult', [], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBe(101);
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT 101 INLINE', function(done) {
          var db = openDatabase('SELECT-minus-101-inline.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT 101 as myresult', [], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBe(101);
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT TYPEOF(-101) INLINE', function(done) {
          var db = openDatabase('SELECT-TYPEOF-minus-101-inline.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT TYPEOF(-101) as myresult', [], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBe('integer');
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT ABS(-101) INLINE', function(done) {
          var db = openDatabase('SELECT-ABS-minus-101-inline.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT ABS(-101) as myresult', [], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBe(101);
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT -101 INLINE', function(done) {
          var db = openDatabase('SELECT-minus-101-inline.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT -101 as myresult', [], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBe(-101);
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT TYPEOF(?) with [101] parameter argument [returns text in case of androidDatabaseImplementation: 2]', function(done) {
          var db = openDatabase('SELECT-TYPEOF-with-101-argument.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT TYPEOF(?) as myresult', [101], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (isWebSql || isMac || hasMobileWKWebView)
                expect(rs.rows.item(0).myresult).toBe('real');
              else if (!isWebSql && isAndroid && isImpl2)
                expect(rs.rows.item(0).myresult).toBe('text');
              else
                expect(rs.rows.item(0).myresult).toBe('integer');
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT ABS(?) with [101] parameter argument [returns text in case of androidDatabaseImplementation: 2]', function(done) {
          var db = openDatabase('SELECT-ABS-with-101-argument.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT ABS(?) as myresult', [101], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBe(101);
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT ? with [101] parameter argument [returns text in case of androidDatabaseImplementation: 2]', function(done) {
          var db = openDatabase('SELECT-with-101-argument.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT ? as myresult', [101], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (!isWebSql && isAndroid && isImpl2)
                expect(rs.rows.item(0).myresult).toBe('101');
              else
                expect(rs.rows.item(0).myresult).toBe(101);
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT TYPEOF(?) with [-101] parameter argument [returns text in case of androidDatabaseImplementation: 2]', function(done) {
          var db = openDatabase('SELECT-TYPEOF-with-minus-101-argument.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT TYPEOF(?) as myresult', [-101], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (isWebSql || isMac || hasMobileWKWebView)
                expect(rs.rows.item(0).myresult).toBe('real');
              else if (!isWebSql && isAndroid && isImpl2)
                expect(rs.rows.item(0).myresult).toBe('text');
              else
                expect(rs.rows.item(0).myresult).toBe('integer');
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT ABS(?) with [-101] parameter argument [returns text in case of androidDatabaseImplementation: 2]', function(done) {
          var db = openDatabase('SELECT-ABS-with-minus-101-argument.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT ABS(?) as myresult', [-101], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBe(101);
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT ? with [-101] parameter argument [returns text in case of androidDatabaseImplementation: 2]', function(done) {
          var db = openDatabase('SELECT-with-minus-101-argument.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT ? as myresult', [-101], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (!isWebSql && isAndroid && isImpl2)
                expect(rs.rows.item(0).myresult).toBe('-101');
              else
                expect(rs.rows.item(0).myresult).toBe(-101);
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT TYPEOF(?) with [123.456] parameter argument [returns text in case of androidDatabaseImplementation: 2]', function(done) {
          var db = openDatabase('SELECT-TYPEOF-123.456.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT TYPEOF(?) as myresult', [123.456], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (!isWebSql && isAndroid && isImpl2)
                expect(rs.rows.item(0).myresult).toBe('text');
              else
                expect(rs.rows.item(0).myresult).toBe('real');
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT ABS(?) with [123.456] parameter argument', function(done) {
          var db = openDatabase('SELECT-ABS-123.456.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT ABS(?) as myresult', [123.456], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBe(123.456);
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT ? with [123.456] parameter argument [returns text in case of androidDatabaseImplementation: 2]', function(done) {
          var db = openDatabase('SELECT-123.456.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT ? as myresult', [123.456], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (!isWebSql && isAndroid && isImpl2)
                expect(rs.rows.item(0).myresult).toBe('123.456');
              else
                expect(rs.rows.item(0).myresult).toBe(123.456);
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT TYPEOF(?) with [-123.456] parameter argument [returns text in case of androidDatabaseImplementation: 2]', function(done) {
          var db = openDatabase('SELECT-TYPEOF-minus-123.456.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT TYPEOF(?) as myresult', [-123.456], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (!isWebSql && isAndroid && isImpl2)
                expect(rs.rows.item(0).myresult).toBe('text');
              else
                expect(rs.rows.item(0).myresult).toBe('real');
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT ABS(?) with [-123.456] parameter argument', function(done) {
          var db = openDatabase('SELECT-ABS-minus-123.456.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT ABS(?) as myresult', [-123.456], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBe(123.456);
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT ? with [-123.456] parameter argument [returns text in case of androidDatabaseImplementation: 2]', function(done) {
          var db = openDatabase('SELECT-minus-123.456.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT ? as myresult', [-123.456], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (!isWebSql && isAndroid && isImpl2)
                expect(rs.rows.item(0).myresult).toBe('-123.456');
              else
                expect(rs.rows.item(0).myresult).toBe(-123.456);
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT TYPEOF(?) with [1234567890123] (BIG INTEGER) parameter argument [returns text in case of androidDatabaseImplementation: 2]', function(done) {
          var db = openDatabase('SELECT-TYPEOF-1234567890123.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT TYPEOF(?) as myresult', [1234567890123], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (isWebSql || isBrowser || isMac || hasMobileWKWebView)
                expect(rs.rows.item(0).myresult).toBe('real');
              else if (!isWebSql && isAndroid && isImpl2)
                expect(rs.rows.item(0).myresult).toBe('text');
              else
                expect(rs.rows.item(0).myresult).toBe('integer');
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT ABS(?) with [1234567890123] (BIG INTEGER) parameter argument', function(done) {
          var db = openDatabase('SELECT-ABS-with-1234567890123-argument.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT ABS(?) as myresult', [1234567890123], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBe(1234567890123);
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT ? with [1234567890123] (BIG INTEGER) parameter argument [returns text in case of androidDatabaseImplementation: 2]', function(done) {
          var db = openDatabase('SELECT-with-1234567890123-argument.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT ? as myresult', [1234567890123], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (!isWebSql && isAndroid && isImpl2)
                expect(rs.rows.item(0).myresult).toBe('1234567890123');
              else
                expect(rs.rows.item(0).myresult).toBe(1234567890123);
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT TYPEOF(?) with [-1234567890123] (BIG INTEGER) parameter argument [returns text in case of androidDatabaseImplementation: 2]', function(done) {
          var db = openDatabase('SELECT-TYPEOF-minus-1234567890123.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT TYPEOF(?) as myresult', [-1234567890123], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (isWebSql || isBrowser || isMac || hasMobileWKWebView)
                expect(rs.rows.item(0).myresult).toBe('real');
              else if (!isWebSql && isAndroid && isImpl2)
                expect(rs.rows.item(0).myresult).toBe('text');
              else
                expect(rs.rows.item(0).myresult).toBe('integer');
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT ABS(?) with [-1234567890123] (BIG INTEGER) parameter argument', function(done) {
          var db = openDatabase('SELECT-ABS-with-minus-1234567890123-argument.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT ABS(?) as myresult', [-1234567890123], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBe(1234567890123);
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT ? with [-1234567890123] (BIG INTEGER) parameter argument [returns text in case of androidDatabaseImplementation: 2]', function(done) {
          var db = openDatabase('SELECT-with-minus-1234567890123-argument.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT ? as myresult', [-1234567890123], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (!isWebSql && isAndroid && isImpl2)
                expect(rs.rows.item(0).myresult).toBe('-1234567890123');
              else
                expect(rs.rows.item(0).myresult).toBe(-1234567890123);
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT TYPEOF(?) with [1234567890123.4] (BIG REAL) parameter argument [returns text in case of androidDatabaseImplementation: 2]', function(done) {
          var db = openDatabase('SELECT-TYPEOF-1234567890123.4.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT TYPEOF(?) as myresult', [1234567890123.4], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (!isWebSql && isAndroid && isImpl2)
                expect(rs.rows.item(0).myresult).toBe('text');
              else
                expect(rs.rows.item(0).myresult).toBe('real');
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT ABS(?) with [1234567890123.4] (BIG REAL) parameter argument', function(done) {
          var db = openDatabase('SELECT-ABS-1234567890123.4.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT ABS(?) as myresult', [1234567890123.4], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBe(1234567890123.4);
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT ? with [1234567890123.4] (BIG REAL) parameter argument [returns text in case of androidDatabaseImplementation: 2]', function(done) {
          var db = openDatabase('SELECT-TYPEOF-1234567890123.4.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT ? as myresult', [1234567890123.4], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (!isWebSql && isAndroid && isImpl2)
                expect(rs.rows.item(0).myresult).toBe('1.2345678901234E12');
              else
                expect(rs.rows.item(0).myresult).toBe(1234567890123.4);
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT TYPEOF(?) with [-1234567890123.4] (BIG REAL) parameter argument [returns text in case of androidDatabaseImplementation: 2]', function(done) {
          var db = openDatabase('SELECT-TYPEOF-minus-1234567890123.4.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT TYPEOF(?) as myresult', [-1234567890123.4], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (!isWebSql && isAndroid && isImpl2)
                expect(rs.rows.item(0).myresult).toBe('text');
              else
                expect(rs.rows.item(0).myresult).toBe('real');
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT ABS(?) with [-1234567890123.4] (BIG REAL) parameter argument', function(done) {
          var db = openDatabase('SELECT-ABS-minus-1234567890123.4.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT ABS(?) as myresult', [-1234567890123.4], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBe(1234567890123.4);
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT ? with [-1234567890123.4] (BIG REAL) parameter argument [returns text in case of androidDatabaseImplementation: 2]', function(done) {
          var db = openDatabase('SELECT-TYPEOF-minus-1234567890123.4.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT ? as myresult', [-1234567890123.4], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (!isWebSql && isAndroid && isImpl2)
                expect(rs.rows.item(0).myresult).toBe('-1.2345678901234E12');
              else
                expect(rs.rows.item(0).myresult).toBe(-1234567890123.4);
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        // Falsy number value
        // ref: https://developer.mozilla.org/en-US/docs/Glossary/Falsy

        it(suiteName + 'SELECT TYPEOF(?) with [0] parameter argument [returns text in case of androidDatabaseImplementation: 2]', function(done) {
          var db = openDatabase('SELECT-TYPEOF-with-0-argument.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT TYPEOF(?) as myresult', [0], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (isWebSql || isMac || hasMobileWKWebView)
                expect(rs.rows.item(0).myresult).toBe('real');
              else if (!isWebSql && isAndroid && isImpl2)
                expect(rs.rows.item(0).myresult).toBe('text');
              else
                expect(rs.rows.item(0).myresult).toBe('integer');
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT ABS(?) with [0] parameter argument', function(done) {
          var db = openDatabase('SELECT-ABS-with-0-argument.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT ABS(?) as myresult', [0], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBe(0);
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT ? with [0] parameter argument', function(done) {
          var db = openDatabase('SELECT-with-0-argument.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT ? as myresult', [0], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (!isWebSql && isAndroid && isImpl2)
                expect(rs.rows.item(0).myresult).toBe('0');
              else
                expect(rs.rows.item(0).myresult).toBe(0);
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT TYPEOF(?) with [0.0] parameter argument [returns text in case of androidDatabaseImplementation: 2]', function(done) {
          var db = openDatabase('SELECT-TYPEOF-0.0.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT TYPEOF(?) as myresult', [0.0], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (isWebSql || isMac || hasMobileWKWebView)
                expect(rs.rows.item(0).myresult).toBe('real');
              else if (!isWebSql && isAndroid && isImpl2)
                expect(rs.rows.item(0).myresult).toBe('text');
              else
                expect(rs.rows.item(0).myresult).toBe('integer');
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT ABS(?) with [0.0] parameter argument', function(done) {
          var db = openDatabase('SELECT-ABS-0.0.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT ABS(?) as myresult', [0.0], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBe(0);
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT ? with [0.0] parameter argument', function(done) {
          var db = openDatabase('SELECT-0.0.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT ? as myresult', [0.0], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (!isWebSql && isAndroid && isImpl2)
                expect(rs.rows.item(0).myresult).toBe('0');
              else
                expect(rs.rows.item(0).myresult).toBe(0);
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

      describe(suiteName + 'Infinity/NaN value test(s)', function() {

        // Android/iOS plugin BROKEN:
        // - CRASH on iOS as reported in litehelpers/Cordova-sqlite-storage#405
        // - Android version returns result with missing row
        it(suiteName + "SELECT ABS(?) with '9e999' (Infinity) parameter argument" +
           ((!isWebSql && isAndroid) ? ' [Android PLUGIN BROKEN: result with missing row]' : ''), function(done) {
          if (!isWebSql && (isAppleMobileOS || isMac)) pending('KNOWN CRASH on iOS/macOS'); // XXX (litehelpers/Cordova-sqlite-storage#405)

          var db = openDatabase('SELECT-ABS-Infinite-parameter-results-test.db', '1.0', 'Test', DEFAULT_SIZE);

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT ABS(?) AS myresult', ['9e999'], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();

              if (!isWebSql && !isWindows && isAndroid)
                expect(rs.rows.length).toBe(0);
              else
                expect(rs.rows.length).toBe(1);

              if (isWebSql || isWindows || isMac)
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

        it(suiteName + "SELECT -ABS(?) with '9e999' (Infinity) parameter argument" +
           ((!isWebSql && isAndroid) ? ' [Android PLUGIN BROKEN: missing result]' : ''), function(done) {
          if (!isWebSql && (isAppleMobileOS || isMac)) pending('KNOWN CRASH on iOS/macOS'); // XXX (litehelpers/Cordova-sqlite-storage#405)

          var db = openDatabase('SELECT-ABS-minus-Infinite-parameter-results-test.db', '1.0', 'Test', DEFAULT_SIZE);

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT -ABS(?) AS myresult', ['9e999'], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();

              if (!isWebSql && !isWindows && isAndroid)
                expect(rs.rows.length).toBe(0);
              else
                expect(rs.rows.length).toBe(1);

              if (isWebSql || isWindows || isMac)
                expect(rs.rows.item(0).myresult).toBe(-Infinity);

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

        it(suiteName + "SELECT UPPER(ABS(?)) with ['9e999'] (Infinity) parameter argument (reference test)", function(done) {
          var db = openDatabase('SELECT-UPPER-ABS-Infinite-parameter-results-test.db', '1.0', 'Test', DEFAULT_SIZE);

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT UPPER(ABS(?)) AS myresult', ['9e999'], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBeDefined();
              expect(rs.rows.item(0).myresult).toBe('INF');

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

        it(suiteName + "SELECT LOWER(-ABS(?)) with ['9e999'] (Infinity) parameter argument (reference test)", function(done) {
          var db = openDatabase('SELECT-LOWER-minus-ABS-Infinite-parameter-results-test.db', '1.0', 'Test', DEFAULT_SIZE);

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT LOWER(-ABS(?)) AS myresult', ['9e999'], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBeDefined();
              expect(rs.rows.item(0).myresult).toBe('-inf');

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

        it(suiteName + 'SELECT LOWER(?) with [Infinity] parameter argument [Android/iOS Plugin BROKEN: result with null value]', function(done) {
          var db = openDatabase('SELECT-LOWER-Infinite-parameter-results-test.db', '1.0', 'Test', DEFAULT_SIZE);

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT LOWER(?) AS myresult', [Infinity], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBeDefined();

              // Android/iOS plugin issue
              if (!isWebSql && isAndroid && isImpl2)
                expect(rs.rows.item(0).myresult).toBe('');
              else if (!isWebSql && (isAndroid || isAppleMobileOS))
                expect(rs.rows.item(0).myresult).toBe(null);
              else
                expect(rs.rows.item(0).myresult).toBe('inf');

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

        it(suiteName + 'SELECT UPPER(?) with [-Infinity] parameter argument [Android/iOS Plugin BROKEN: result with null value]', function(done) {
          var db = openDatabase('SELECT-UPPER-minus-Infinite-parameter-results-test.db', '1.0', 'Test', DEFAULT_SIZE);

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT UPPER(?) AS myresult', [-Infinity], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBeDefined();

              // Android/iOS plugin issue
              if (!isWebSql && isAndroid && isImpl2)
                expect(rs.rows.item(0).myresult).toBe('');
              else if (!isWebSql && (isAndroid || isAppleMobileOS))
                expect(rs.rows.item(0).myresult).toBe(null);
              else
                expect(rs.rows.item(0).myresult).toBe('-INF');

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

        it(suiteName + 'SELECT TYPEOF(?) with [Infinity] parameter argument [Android/iOS Plugin BROKEN: reports null type]', function(done) {
          var db = openDatabase('SELECT-TYPEOF-Infinite-parameter-results-test.db', '1.0', 'Test', DEFAULT_SIZE);

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT TYPEOF(?) AS myresult', [Infinity], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBeDefined();

              // Android/iOS plugin issue
              if (!isWebSql && isAndroid && isImpl2)
                expect(rs.rows.item(0).myresult).toBe('text');
              else if (!isWebSql && (isAndroid || isAppleMobileOS))
                expect(rs.rows.item(0).myresult).toBe('null');
              else
                expect(rs.rows.item(0).myresult).toBe('real');

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

        it(suiteName + 'SELECT TYPEOF(?) with -Infinity parameter argument [Android/iOS Plugin BROKEN: reports null type]', function(done) {
          var db = openDatabase('SELECT-TYPEOF-minus-Infinite-parameter-results-test.db', '1.0', 'Test', DEFAULT_SIZE);

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT TYPEOF(?) AS myresult', [-Infinity], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBeDefined();

              // Android/iOS plugin issue
              if (!isWebSql && isAndroid && isImpl2)
                expect(rs.rows.item(0).myresult).toBe('text');
              else if (!isWebSql && (isAndroid || isAppleMobileOS))
                expect(rs.rows.item(0).myresult).toBe('null');
              else
                expect(rs.rows.item(0).myresult).toBe('real');

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

        it(suiteName + 'SELECT (?) with Infinity parameter argument [Android/iOS Plugin BROKEN: result with null value; CRASH on macOS]', function(done) {
          if (isMac) pending('SKIP for macOS [CRASH]'); // FUTURE TBD

          var db = openDatabase('SELECT-Infinite-parameter-results-test.db', '1.0', 'Test', DEFAULT_SIZE);

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT (?) AS myresult', [Infinity], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);

              // Android/iOS plugin issue
              if (!isWebSql && isAndroid && isImpl2)
                expect(rs.rows.item(0).myresult).toBe('');
              else if (!isWebSql && (isAndroid || isAppleMobileOS || isMac))
                expect(rs.rows.item(0).myresult).toBe(null);
              else
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

        it(suiteName + 'SELECT (?) with -Infinity parameter argument [Android/iOS Plugin BROKEN: result with null value; CRASH on macOS]', function(done) {
          if (isMac) pending('SKIP for macOS [CRASH]'); // FUTURE TBD

          var db = openDatabase('SELECT-minus-Infinite-parameter-results-test.db', '1.0', 'Test', DEFAULT_SIZE);

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT (?) AS myresult', [-Infinity], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);

              // Android/iOS/macOS plugin issue
              if (!isWebSql && isAndroid && isImpl2)
                expect(rs.rows.item(0).myresult).toBe('');
              else if (!isWebSql && (isAndroid || isAppleMobileOS || isMac))
                expect(rs.rows.item(0).myresult).toBe(null);
              else
                expect(rs.rows.item(0).myresult).toBe(-Infinity);

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

        // General ref: http://sqlite.1065341.n5.nabble.com/NaN-in-0-0-out-td19086.html

        it(suiteName + "Infinity/NaN reference test: SELECT ABS(?)-ABS(?) with '9e999' (Infinity) parameter argument values", function(done) {
          var db = openDatabase('SELECT-ABS-minus-ABS-with-Infinite-parameter-values-test.db', '1.0', 'Test', DEFAULT_SIZE);

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT ABS(?)-ABS(?) AS myresult', ['9e999', '9e999'], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBeDefined();

              expect(rs.rows.item(0).myresult).toBe(null);

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

        it(suiteName + 'Infinity/NaN test: SELECT (?-?) with Infinity parameter argument values [Infinity/NaN ISSUE with androidDatabaseImplementation: 2]', function(done) {
          var db = openDatabase('SELECT-minus-with-Infinite-parameter-values-test.db', '1.0', 'Test', DEFAULT_SIZE);

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT (?-?) AS myresult', [Infinity, Infinity], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBeDefined();

              // Android/iOS plugin issue
              if (!isWebSql && isAndroid && isImpl2)
                expect(rs.rows.item(0).myresult).toBe(0);
              else
                expect(rs.rows.item(0).myresult).toBe(null);

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

        it(suiteName + 'Infinity/NaN test: SELECT (?+?) with [Infinity, -Infinity] parameter argument values [Infinity/NaN ISSUE with androidDatabaseImplementation: 2]', function(done) {
          var db = openDatabase('SELECT-sum-with-Infinite-and-minus-Infinity-parameter-values-test.db', '1.0', 'Test', DEFAULT_SIZE);

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT (?+?) AS myresult', [Infinity, -Infinity], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBeDefined();

              // Android/iOS plugin issue
              if (!isWebSql && isAndroid && isImpl2)
                expect(rs.rows.item(0).myresult).toBe(0);
              else
                expect(rs.rows.item(0).myresult).toBe(null);

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

        it(suiteName + "NaN reference test: SELECT (1/0)", function(done) {
          var db = openDatabase('SELECT-1-div-0-test.db', '1.0', 'Test', DEFAULT_SIZE);

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT (1/0) AS myresult', [], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBeDefined();
              expect(rs.rows.item(0).myresult).toBe(null);

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

        it(suiteName + 'SELECT UPPER(?) with NaN parameter argument value [Infinity/NaN ISSUE with androidDatabaseImplementation: 2]', function(done) {
          var db = openDatabase('SELECT-UPPER-with-NaN-parameter-results-test.db', '1.0', 'Test', DEFAULT_SIZE);

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT UPPER(?) AS myresult', [NaN], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBeDefined();

              // Android/iOS plugin issue
              if (!isWebSql && isAndroid && isImpl2)
                expect(rs.rows.item(0).myresult).toBe('');
              else
                expect(rs.rows.item(0).myresult).toBe(null);

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

        it(suiteName + 'SELECT TYPEOF(?) with NaN parameter argument value [Infinity/NaN ISSUE with androidDatabaseImplementation: 2]', function(done) {
          var db = openDatabase('SELECT-TYPEOF-with-NaN-parameter-results-test.db', '1.0', 'Test', DEFAULT_SIZE);

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT TYPEOF(?) AS myresult', [NaN], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBeDefined();

              // Android/iOS plugin issue
              if (!isWebSql && isAndroid && isImpl2)
                expect(rs.rows.item(0).myresult).toBe('text');
              else
                expect(rs.rows.item(0).myresult).toBe('null');

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

        it(suiteName + 'SELECT (?) with NaN parameter argument value [Infinity/NaN ISSUE with androidDatabaseImplementation: 2]', function(done) {
          var db = openDatabase('SELECT-NaN-parameter-results-test.db', '1.0', 'Test', DEFAULT_SIZE);

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT (?) AS myresult', [NaN], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBeDefined();

              // Android/iOS plugin issue
              if (!isWebSql && isAndroid && isImpl2)
                expect(rs.rows.item(0).myresult).toBe('');
              else
                expect(rs.rows.item(0).myresult).toBe(null);

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

      describe(suiteName + 'true/false parameter argument value test(s)', function() {

        it(suiteName + 'SELECT TYPEOF(?) with [true] parameter argument value', function(done) {
          var db = openDatabase('SELECT-TYPEOF-with-true-argument-value.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT TYPEOF(?) as myresult', [true], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBe('text');
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT UPPER(?) with [true] parameter argument', function(done) {
          var db = openDatabase('SELECT-UPPER-with-true-argument-value.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT UPPER(?) as myresult', [true], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBe('TRUE');
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT ABS(?) with [true] parameter argument', function(done) {
          var db = openDatabase('SELECT-ABS-with-true-argument-value.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT ABS(?) as myresult', [true], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBe(0);
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT ? with [true] parameter argument', function(done) {
          var db = openDatabase('SELECT-with-true-argument-value.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT ? as myresult', [true], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBe('true');
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT TYPEOF(?) with [false] parameter argument value', function(done) {
          var db = openDatabase('SELECT-TYPEOF-with-false-argument-value.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT TYPEOF(?) as myresult', [false], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBe('text');
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT UPPER(?) with [false] parameter argument', function(done) {
          var db = openDatabase('SELECT-UPPER-with-false-argument-value.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT UPPER(?) as myresult', [false], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBe('FALSE');
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT ABS(?) with [false] parameter argument', function(done) {
          var db = openDatabase('SELECT-ABS-with-false-argument-value.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT ABS(?) as myresult', [false], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBe(0);
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT ? with [false] parameter argument', function(done) {
          var db = openDatabase('SELECT-with-false-argument-value.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            tx.executeSql('SELECT ? as myresult', [false], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBe('false');
              done();
            });
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

      });

        it(suiteName + 'String test with array parameter value including undefined/Infinity/NaN values', function(done) {
          var db = openDatabase("String-test-with-array-parameter-value.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {

            tx.executeSql('SELECT UPPER(?) AS upper_result', [['a',undefined,'b',Infinity,'c',-Infinity,'d',NaN,'e']], function(ignored, rs) {
              expect(rs.rows.item(0).upper_result).toBe('A,,B,INFINITY,C,-INFINITY,D,NAN,E');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

      describe(suiteName + 'Inline BLOB value SELECT result tests', function() {

        it(suiteName + "SELECT LOWER(X'40414243') [follows default sqlite encoding: UTF-16le on Android 4.1-4.4 (WebKit) Web SQL, UTF-8 otherwise]", function(done) {
          var db = openDatabase('INLINE-BLOB-SELECT-LOWER-40414243-test.db');

          db.transaction(function(tx) {
            tx.executeSql("SELECT LOWER(X'40414243') AS myresult", [], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (isWindows || (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent)))
                expect(rs.rows.item(0).myresult).toBe('䅀䍂');
              else
                expect(rs.rows.item(0).myresult).toBe('@abc');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(error.message).toBe('---');
            done.fail();
          });
        }, MYTIMEOUT);

        it(suiteName + "SELECT X'40414243' [ERROR REPRODUCED on androidDatabaseProvider: 'system' & Windows; follows default sqlite encoding: UTF-16le on Android 4.1-4.4 (WebKit) Web SQL, UTF-8 otherwise]", function(done) {
          var db = openDatabase('INLINE-BLOB-SELECT-40414243-test.db');

          db.transaction(function(tx) {
            tx.executeSql("SELECT X'40414243' AS myresult", [], function(ignored, rs) {
              if (!isWebSql && isAndroid && isImpl2) expect("BEHAVIOR CHANGED on Android with androidDatabaseProvider: 'system' PLEASE UPDATE THIS TEST").toBe('--');
              if (isWindows) expect('BEHAVIOR CHANGED on Windows PLEASE UPDATE THIS TEST').toBe('--');
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent))
                expect(rs.rows.item(0).myresult).toBe('䅀䍂');
              else
                expect(rs.rows.item(0).myresult).toBe('@ABC');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            }, function(ignored, error) {
              if (isWindows || (!isWebSql && isAndroid && isImpl2)) {
                // ERROR EXPECTED on androidDatabaseProvider: 'system' & Windows only:
                expect(error).toBeDefined();
                expect(error.code).toBeDefined();
                expect(error.message).toBeDefined();

                // TBD non-standard error code
                expect(error.code).toBe(0);
                // FUTURE TBD error message
              } else {
                // NOT EXPECTED on (WebKit) Web SQL or plugin on other platforms:
                expect(error.message).toBe('---');
                done.fail();
              }

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

        it(suiteName + "SELECT X'FFD1FFD2' [ERROR REPRODUCED on androidDatabaseImplementation: 2 & Windows; MISSING result data column on iOS/macOS; actual result value is IGNORED on (WebKit) Web SQL & plugin on other platforms]", function(done) {
          if (!isWebSql && !isWindows && isAndroid && !isImpl2) pending('BROKEN: CRASH on Android 5.x (default sqlite-connector version)');

          var db = openDatabase("Inline-SELECT-BLOB-FFD1FFD2-result-test.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {

            tx.executeSql("SELECT X'FFD1FFD2' AS myresult", [], function(ignored, rs) {
              if (isWindows || (!isWebSql && isAndroid && isImpl2)) expect('Behavior changed please update this test').toBe('--');
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (!isWebSql && (isAppleMobileOS || isMac))
                expect(rs.rows.item(0).myresult).not.toBeDefined(); // not defined iOS/macOS plugin
              else
                expect(rs.rows.item(0).myresult).toBeDefined();

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            }, function(ignored, error) {
              if (isWindows || (!isWebSql && isAndroid && isImpl2)) {
                expect(error).toBeDefined();
                expect(error.code).toBeDefined();
                expect(error.message).toBeDefined();

                // TBD wrong error code
                expect(error.code).toBe(0);
                // FUTURE TBD check error message
                done();
              } else {
                // NOT EXPECTED:
                expect(error.message).toBe('---');
                done.fail();
              }
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
