/* 'use strict'; */

var MYTIMEOUT = 30000;

var isWindows = /MSAppHost/.test(navigator.userAgent);
var isAndroid = !isWindows && /Android/.test(navigator.userAgent);
var isFirefox = /Firefox/.test(navigator.userAgent);
var isWebKitBrowser = !isWindows && !isAndroid && /Safari/.test(navigator.userAgent);
var isBrowser = isWebKitBrowser || isFirefox;
var isEdgeBrowser = isBrowser && (/Edge/.test(navigator.userAgent));
var isChromeBrowser = isBrowser && !isEdgeBrowser && (/Chrome/.test(navigator.userAgent));
var isMac = !isBrowser && /Macintosh/.test(navigator.userAgent);
var isAppleMobileOS = /iPhone/.test(navigator.userAgent) ||
      /iPad/.test(navigator.userAgent) || /iPod/.test(navigator.userAgent);
var hasMobileWKWebView = isAppleMobileOS && !!window.webkit && !!window.webkit.messageHandlers;

// NOTE: While in certain version branches there is no difference between
// the default Android implementation and implementation #2,
// this test script will also apply the androidLockWorkaround: 1 option
// in case of implementation #2.
var pluginScenarioList = [
  isAndroid ? 'Plugin-implementation-default' : 'Plugin',
  'Plugin-implementation-2'
];

var pluginScenarioCount = isAndroid ? 2 : 1;

var mytests = function() {

  for (var i=0; i<pluginScenarioCount; ++i) {

    describe(pluginScenarioList[i] + ': sql operations via plugin-specific db.executeSql test(s)', function() {
      // TBD skip plugin test on browser platform (not yet supported):
      if (isBrowser) return;

      var scenarioName = pluginScenarioList[i];
      var suiteName = scenarioName + ': ';
      var isImpl2 = (i === 1);

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
        } else {
          // explicit database location:
          return window.sqlitePlugin.openDatabase({name: name, location: 'default'});
        }
      }

      describe(pluginScenarioList[i] + ': db.executeSql SELECT result test(s)', function() {

        it(suiteName + 'db.executeSql string result test with null for parameter argument array', function(done) {
          var db = openDatabase('DB-sql-String-result-test-with-null-parameter-arg-array.db');
          expect(db).toBeDefined();

          db.executeSql("SELECT UPPER('first') AS uppertext", null, function(rs) {
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            expect(rs.rows.item(0).uppertext).toBe('FIRST');
            db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'Inline db.executeSql US-ASCII String manipulation test with empty ([]) parameter list', function(done) {
          var db = openDatabase('Inline-db-sql-US-ASCII-string-test-with-empty-parameter-list.db');
          expect(db).toBeDefined();

          db.executeSql("SELECT UPPER('Some US-ASCII text') AS uppertext", [], function(res) {
            expect(res.rows.item(0).uppertext).toBe("SOME US-ASCII TEXT");

            db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql string result test with undefined for parameter argument array', function(done) {
          var db = openDatabase('DB-sql-String-result-test-with-undefined-for-parameter-arg-array.db');
          expect(db).toBeDefined();

          db.executeSql("SELECT UPPER('first') AS uppertext", undefined, function(rs) {
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            expect(rs.rows.item(0).uppertext).toBe('FIRST');
            db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql check SELECT TYPEOF(?) with [101] for parameter argument array', function(done) {
          var db = openDatabase('DB-sql-SELECT-TYPEOF-101.db');
          expect(db).toBeDefined();

          db.executeSql('SELECT TYPEOF(?) AS myresult', [101], function(rs) {
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            if (isMac || hasMobileWKWebView)
              expect(rs.rows.item(0).myresult).toBe('real');
            else if (isAndroid && isImpl2)
              expect(rs.rows.item(0).myresult).toBe('text');
            else
              expect(rs.rows.item(0).myresult).toBe('integer');
            db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql check SELECT ? with [101] for parameter argument array', function(done) {
          var db = openDatabase('DB-sql-SELECT-101.db');
          expect(db).toBeDefined();

          db.executeSql('SELECT ? AS myresult', [101], function(rs) {
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            if (isAndroid && isImpl2)
              expect(rs.rows.item(0).myresult).toBe('101');
            else
              expect(rs.rows.item(0).myresult).toBe(101);
            db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql check SELECT TYPEOF(?) with [-101] for parameter argument array', function(done) {
          var db = openDatabase('DB-sql-SELECT-TYPEOF-minus-101.db');
          expect(db).toBeDefined();

          db.executeSql('SELECT TYPEOF(?) AS myresult', [-101], function(rs) {
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            if (isMac || hasMobileWKWebView)
              expect(rs.rows.item(0).myresult).toBe('real');
            else if (isAndroid && isImpl2)
              expect(rs.rows.item(0).myresult).toBe('text');
            else
              expect(rs.rows.item(0).myresult).toBe('integer');
            db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql check SELECT ? with [-101] for parameter argument array', function(done) {
          var db = openDatabase('DB-sql-SELECT-minus-101.db');
          expect(db).toBeDefined();

          db.executeSql('SELECT ? AS myresult', [-101], function(rs) {
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            if (isAndroid && isImpl2)
              expect(rs.rows.item(0).myresult).toBe('-101');
            else
              expect(rs.rows.item(0).myresult).toBe(-101);
            db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql check SELECT TYPEOF(?) with [123.456] for parameter argument array', function(done) {
          var db = openDatabase('DB-sql-SELECT-TYPEOF-123.456.db');
          expect(db).toBeDefined();

          db.executeSql('SELECT TYPEOF(?) AS myresult', [123.456], function(rs) {
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            if (isAndroid && isImpl2)
              expect(rs.rows.item(0).myresult).toBe('text');
            else
              expect(rs.rows.item(0).myresult).toBe('real');
            db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql check SELECT ? with [123.456] for parameter argument array', function(done) {
          var db = openDatabase('DB-sql-SELECT-123.456.db');
          expect(db).toBeDefined();

          db.executeSql('SELECT ? AS myresult', [123.456], function(rs) {
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            if (isAndroid && isImpl2)
              expect(rs.rows.item(0).myresult).toBe('123.456');
            else
              expect(rs.rows.item(0).myresult).toBe(123.456);
            db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql check SELECT TYPEOF(?) with [-123.456] for parameter argument array', function(done) {
          var db = openDatabase('DB-sql-SELECT-TYPEOF-minus-123.456.db');
          expect(db).toBeDefined();

          db.executeSql('SELECT TYPEOF(?) AS myresult', [-123.456], function(rs) {
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            if (isAndroid && isImpl2)
              expect(rs.rows.item(0).myresult).toBe('text');
            else
              expect(rs.rows.item(0).myresult).toBe('real');
            db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql check SELECT ? with [-123.456] for parameter argument array', function(done) {
          var db = openDatabase('DB-sql-SELECT-minus-123.456.db');
          expect(db).toBeDefined();

          db.executeSql('SELECT ? AS myresult', [-123.456], function(rs) {
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            if (isAndroid && isImpl2)
              expect(rs.rows.item(0).myresult).toBe('-123.456');
            else
              expect(rs.rows.item(0).myresult).toBe(-123.456);
            db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql check SELECT TYPEOF(?) with [0] for parameter argument array', function(done) {
          var db = openDatabase('DB-sql-SELECT-TYPEOF-0.db');
          expect(db).toBeDefined();

          db.executeSql('SELECT TYPEOF(?) AS myresult', [0], function(rs) {
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            if (isMac || hasMobileWKWebView)
              expect(rs.rows.item(0).myresult).toBe('real');
            else if (isAndroid && isImpl2)
              expect(rs.rows.item(0).myresult).toBe('text');
            else
              expect(rs.rows.item(0).myresult).toBe('integer');
            db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql check SELECT ? with [0] for parameter argument array', function(done) {
          var db = openDatabase('DB-sql-SELECT-TYPEOF-0.db');
          expect(db).toBeDefined();

          db.executeSql('SELECT ? AS myresult', [0], function(rs) {
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            if (isAndroid && isImpl2)
              expect(rs.rows.item(0).myresult).toBe('0');
            else
              expect(rs.rows.item(0).myresult).toBe(0);
            db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql check SELECT TYPEOF(?) with [null] for parameter argument array', function(done) {
          var db = openDatabase('DB-sql-SELECT-TYPEOF-null.db');
          expect(db).toBeDefined();

          db.executeSql('SELECT TYPEOF(?) AS myresult', [null], function(rs) {
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            if (isAndroid && isImpl2)
              expect(rs.rows.item(0).myresult).toBe('text');
            else
              expect(rs.rows.item(0).myresult).toBe('null');
            db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql check SELECT TYPEOF(?) with [undefined] for parameter argument array', function(done) {
          var db = openDatabase('DB-sql-SELECT-TYPEOF-undefined.db');
          expect(db).toBeDefined();

          db.executeSql('SELECT TYPEOF(?) AS myresult', [undefined], function(rs) {
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            if (isAndroid && isImpl2)
              expect(rs.rows.item(0).myresult).toBe('text');
            else
              expect(rs.rows.item(0).myresult).toBe('null');
            db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql check SELECT TYPEOF(?) with [Infinity] for parameter argument array [TBD Android/iOS/macOS plugin result]', function(done) {
          var db = openDatabase('DB-sql-SELECT-TYPEOF-infinity.db');
          expect(db).toBeDefined();

          db.executeSql('SELECT TYPEOF(?) AS myresult', [Infinity], function(rs) {
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            if (isAndroid && isImpl2)
              expect(rs.rows.item(0).myresult).toBe('text');
            else if (!isWindows && !isMac)
              expect(rs.rows.item(0).myresult).toBe('null');
            else
              expect(rs.rows.item(0).myresult).toBe('real');
            db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql check SELECT ? with [Infinity] for parameter argument array [TBD Android/iOS/macOS plugin result]', function(done) {
          if (isMac) pending('SKIP for macOS [CRASH]'); // FUTURE TBD

          var db = openDatabase('DB-sql-SELECT-infinity.db');
          expect(db).toBeDefined();

          db.executeSql('SELECT ? AS myresult', [Infinity], function(rs) {
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            if (isWindows)
              expect(rs.rows.item(0).myresult).toBe(Infinity);
            else if (isAndroid && isImpl2)
              expect(rs.rows.item(0).myresult).toBe('');
            else
              expect(rs.rows.item(0).myresult).toBe(null);
            db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql check SELECT TYPEOF(?) with [-Infinity] for parameter argument array [TBD Android/iOS/macOS plugin result]', function(done) {
          var db = openDatabase('DB-sql-SELECT-TYPEOF-minus-infinity.db');
          expect(db).toBeDefined();

          db.executeSql('SELECT TYPEOF(?) AS myresult', [-Infinity], function(rs) {
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            if (isAndroid && isImpl2)
              expect(rs.rows.item(0).myresult).toBe('text');
            else if (!isWindows && !isMac)
              expect(rs.rows.item(0).myresult).toBe('null');
            else
              expect(rs.rows.item(0).myresult).toBe('real');
            db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql check SELECT ? with [-Infinity] for parameter argument array [TBD Android/iOS/macOS plugin result]', function(done) {
          if (isMac) pending('SKIP for macOS [CRASH]'); // FUTURE TBD

          var db = openDatabase('DB-sql-SELECT-minus-infinity.db');
          expect(db).toBeDefined();

          db.executeSql('SELECT ? AS myresult', [-Infinity], function(rs) {
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            if (isWindows)
              expect(rs.rows.item(0).myresult).toBe(-Infinity);
            else if (isAndroid && isImpl2)
              expect(rs.rows.item(0).myresult).toBe('');
            else
              expect(rs.rows.item(0).myresult).toBe(null);
            db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql check SELECT TYPEOF(?) with [NaN] for parameter argument array [TBD Android/iOS/macOS plugin result]', function(done) {
          var db = openDatabase('DB-sql-SELECT-TYPEOF-nan.db');
          expect(db).toBeDefined();

          db.executeSql('SELECT TYPEOF(?) AS myresult', [NaN], function(rs) {
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            if (isAndroid && isImpl2)
              expect(rs.rows.item(0).myresult).toBe('text');
            else
              expect(rs.rows.item(0).myresult).toBe('null');
            db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

      });

      describe(pluginScenarioList[i] + ': db.executeSql value storage test(s)', function() {

        it(suiteName + 'db.executeSql store numeric values and check', function(done) {
          var db = openDatabase('DB-sql-store-numeric-values-and-check.db');
          expect(db).toBeDefined();
          db.executeSql('DROP TABLE IF EXISTS MyTable');
          db.executeSql('CREATE TABLE MyTable (data)');
          db.executeSql('INSERT INTO MyTable VALUES (?)', [101]);
          db.executeSql('INSERT INTO MyTable VALUES (?)', [-101]);
          db.executeSql('INSERT INTO MyTable VALUES (?)', [123.456]);
          db.executeSql('INSERT INTO MyTable VALUES (?)', [-123.456]);
          db.executeSql('INSERT INTO MyTable VALUES (?)', [1234567890123]);
          db.executeSql('INSERT INTO MyTable VALUES (?)', [-1234567890123]);
          db.executeSql('INSERT INTO MyTable VALUES (?)', [1234567890123.4]);
          db.executeSql('INSERT INTO MyTable VALUES (?)', [-1234567890123.4]);
          db.executeSql('INSERT INTO MyTable VALUES (?)', [0]);

          db.executeSql('SELECT data AS d1, TYPEOF(data) AS t1, ABS(data) AS a1, UPPER(data) as u1 FROM MyTable', [], function (rs) {
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(9);
            expect(rs.rows.item(0).d1).toBe(101);
            if (isMac || hasMobileWKWebView)
              expect(rs.rows.item(0).t1).toBe('real');
            else
              expect(rs.rows.item(0).t1).toBe('integer');
            expect(rs.rows.item(0).a1).toBe(101);
            if (isMac || hasMobileWKWebView)
              expect(rs.rows.item(0).u1).toBe('101.0');
            else
              expect(rs.rows.item(0).u1).toBe('101');
            expect(rs.rows.item(1).d1).toBe(-101);
            if (isMac || hasMobileWKWebView)
              expect(rs.rows.item(1).t1).toBe('real');
            else
              expect(rs.rows.item(1).t1).toBe('integer');
            expect(rs.rows.item(1).a1).toBe(101);
            if (isMac || hasMobileWKWebView)
              expect(rs.rows.item(1).u1).toBe('-101.0');
            else
              expect(rs.rows.item(1).u1).toBe('-101');
            expect(rs.rows.item(2).d1).toBe(123.456);
            expect(rs.rows.item(2).t1).toBe('real');
            expect(rs.rows.item(2).a1).toBe(123.456);
            expect(rs.rows.item(2).u1).toBe('123.456');
            expect(rs.rows.item(3).d1).toBe(-123.456);
            expect(rs.rows.item(3).t1).toBe('real');
            expect(rs.rows.item(3).a1).toBe(123.456);
            expect(rs.rows.item(3).u1).toBe('-123.456');
            expect(rs.rows.item(4).d1).toBe(1234567890123);
            if (isMac || hasMobileWKWebView)
              expect(rs.rows.item(4).t1).toBe('real');
            else
              expect(rs.rows.item(4).t1).toBe('integer');
            expect(rs.rows.item(4).a1).toBe(1234567890123);
            if (isMac || hasMobileWKWebView)
              expect(rs.rows.item(4).u1).toBe('1234567890123.0');
            else
              expect(rs.rows.item(4).u1).toBe('1234567890123');
            expect(rs.rows.item(5).d1).toBe(-1234567890123);
            if (isMac || hasMobileWKWebView)
              expect(rs.rows.item(5).t1).toBe('real');
            else
              expect(rs.rows.item(5).t1).toBe('integer');
            expect(rs.rows.item(5).a1).toBe(1234567890123);
            if (isMac || hasMobileWKWebView)
              expect(rs.rows.item(5).u1).toBe('-1234567890123.0');
            else
              expect(rs.rows.item(5).u1).toBe('-1234567890123');
            expect(rs.rows.item(6).d1).toBe(1234567890123.4);
            expect(rs.rows.item(6).t1).toBe('real');
            expect(rs.rows.item(6).a1).toBe(1234567890123.4);
            expect(rs.rows.item(6).u1).toBe('1234567890123.4');
            expect(rs.rows.item(7).d1).toBe(-1234567890123.4);
            expect(rs.rows.item(7).t1).toBe('real');
            expect(rs.rows.item(7).a1).toBe(1234567890123.4);
            expect(rs.rows.item(7).u1).toBe('-1234567890123.4');
            expect(rs.rows.item(8).d1).toBe(0);
            if (isMac || hasMobileWKWebView)
              expect(rs.rows.item(8).t1).toBe('real');
            else
              expect(rs.rows.item(8).t1).toBe('integer');
            expect(rs.rows.item(8).a1).toBe(0);
            if (isMac || hasMobileWKWebView)
              expect(rs.rows.item(8).u1).toBe('0.0');
            else
              expect(rs.rows.item(8).u1).toBe('0');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql store null/undefined values and check', function(done) {
          var db = openDatabase('DB-sql-store-null-undefined-values-and-check.db');
          expect(db).toBeDefined();

          db.executeSql('DROP TABLE IF EXISTS MyTable');
          db.executeSql('CREATE TABLE MyTable (data)');
          db.executeSql('INSERT INTO MyTable VALUES (?)', [null]);
          // NOTE: THIS WILL FAIL on Windows:
          db.executeSql('INSERT INTO MyTable VALUES (?)', [undefined]);

          db.executeSql('SELECT data AS d1, TYPEOF(data) AS t1, ABS(data) AS a1, UPPER(data) as u1 FROM MyTable', [], function (rs) {
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(2);
            expect(rs.rows.item(0).d1).toBe(null);
            expect(rs.rows.item(0).t1).toBe('null');
            expect(rs.rows.item(0).a1).toBe(null);
            expect(rs.rows.item(0).u1).toBe(null);
            expect(rs.rows.item(1).d1).toBe(null);
            expect(rs.rows.item(1).t1).toBe('null');
            expect(rs.rows.item(1).a1).toBe(null);
            expect(rs.rows.item(1).u1).toBe(null);
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql store Infinity/NaN values and check [TBD Android/iOS plugin result]', function(done) {
          if (isMac) pending('SKIP for macOS [CRASH]'); // FUTURE TBD

          var db = openDatabase('DB-sql-store-infinity-nan-values-and-check.db');
          expect(db).toBeDefined();
          db.executeSql('DROP TABLE IF EXISTS MyTable');
          db.executeSql('CREATE TABLE MyTable (data)');
          db.executeSql('INSERT INTO MyTable VALUES (?)', [Infinity]);
          db.executeSql('INSERT INTO MyTable VALUES (?)', [-Infinity]);
          db.executeSql('INSERT INTO MyTable VALUES (?)', [NaN]);

          db.executeSql('SELECT data AS d1, TYPEOF(data) AS t1, ABS(data) AS a1, UPPER(data) as u1 FROM MyTable', [], function (rs) {
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(3);
            if (isWindows) {
              expect(rs.rows.item(0).d1).toBe(Infinity);
              expect(rs.rows.item(0).t1).toBe('real');
              expect(rs.rows.item(0).a1).toBe(Infinity);
              expect(rs.rows.item(0).u1).toBe('INF');
              expect(rs.rows.item(1).d1).toBe(-Infinity);
              expect(rs.rows.item(1).t1).toBe('real');
              expect(rs.rows.item(1).a1).toBe(Infinity);
              expect(rs.rows.item(1).u1).toBe('-INF');
            } else {
              expect(rs.rows.item(0).d1).toBe(null);
              expect(rs.rows.item(0).t1).toBe('null');
              expect(rs.rows.item(0).a1).toBe(null);
              expect(rs.rows.item(0).u1).toBe(null);
              expect(rs.rows.item(1).d1).toBe(null);
              expect(rs.rows.item(1).t1).toBe('null');
              expect(rs.rows.item(1).a1).toBe(null);
              expect(rs.rows.item(1).u1).toBe(null);
            }
            expect(rs.rows.item(2).d1).toBe(null);
            expect(rs.rows.item(2).t1).toBe('null');
            expect(rs.rows.item(2).a1).toBe(null);
            expect(rs.rows.item(2).u1).toBe(null);
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql store true/false values and check [stored as strings]', function(done) {
          var db = openDatabase('DB-sql-store-true-false-values-and-check.db');

          db.executeSql('DROP TABLE IF EXISTS MyTable');
          db.executeSql('CREATE TABLE MyTable (data)');
          db.executeSql('INSERT INTO MyTable VALUES (?)', [true]);
          db.executeSql('INSERT INTO MyTable VALUES (?)', [false]);

          db.executeSql('SELECT data AS d1, TYPEOF(data) AS t1, ABS(data) AS a1, UPPER(data) as u1 FROM MyTable', [], function (rs) {
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(2);
            expect(rs.rows.item(0).d1).toBe('true');
            expect(rs.rows.item(0).t1).toBe('text');
            expect(rs.rows.item(0).a1).toBe(0);
            expect(rs.rows.item(0).u1).toBe('TRUE');
            expect(rs.rows.item(1).d1).toBe('false');
            expect(rs.rows.item(1).t1).toBe('text');
            expect(rs.rows.item(1).a1).toBe(0);
            expect(rs.rows.item(1).u1).toBe('FALSE');
            db.close(done, done);
          });
        }, MYTIMEOUT);

      });

      describe(pluginScenarioList[i] + ': db.executeSql numbered parameters storage test(s)', function() {

        it(suiteName + 'db.executeSql store numbered parameters (reversed) and check', function(done) {
          var db = openDatabase('DB-executeSql-store-numbered-parameters-reversed-and-check.db');

          db.executeSql('DROP TABLE IF EXISTS MyTable');
          db.executeSql('CREATE TABLE MyTable (x,y)');
          db.executeSql('INSERT INTO MyTable VALUES (?2,?1)', ['a',1]);

          db.executeSql('SELECT * FROM MyTable', [], function (resultSet) {
            // EXPECTED: CORRECT RESULT:
            expect(resultSet).toBeDefined();
            expect(resultSet.rows).toBeDefined();
            expect(resultSet.rows.length).toBe(1);

            var resultRow = resultSet.rows.item(0);
            expect(resultRow).toBeDefined();
            expect(resultRow.x).toBe(1);
            expect(resultRow.y).toBe('a');
            db.close(done, done);
          });
        }, MYTIMEOUT);

      });

      describe(pluginScenarioList[i] + ': more db.executeSql SELECT result test(s)', function() {

        it(suiteName + 'db.executeSql string result test with new String for SQL', function(done) {
          var db = openDatabase('DB-sql-new-String-test.db');
          expect(db).toBeDefined();

          db.executeSql(new String("SELECT UPPER('first') AS uppertext"), null, function(rs) {
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            expect(rs.rows.item(0).uppertext).toBe('FIRST');
            db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT UPPER(?) AS upper1, UPPER(?) AS upper2 with "naive" Array subclass (constructor NOT explicitly set to subclasss) as value arguments array', function(done) {
          var db = openDatabase('DB-SQL-SELECT-multi-upper-on-array-subclass.db');
          expect(db).toBeDefined();

          // Variation on the "naive approach" described in
          // http://perfectionkills.com/how-ecmascript-5-still-does-not-allow-to-subclass-an-array/
          function F() {}
          F.prototype = Array.prototype;
          function MyArraySubclass() {}
          MyArraySubclass.prototype = new F();
          myObject = new MyArraySubclass();
          myObject.push('s1', 's2');

          expect(myObject.length).toBe(2);
          expect(myObject[0]).toBe('s1');
          expect(myObject[1]).toBe('s2');

          expect(myObject.constructor).toBe(Array);

          db.executeSql('SELECT UPPER(?) AS upper1, UPPER(?) AS upper2', myObject, function(rs) {
            // EXPECTED RESULT:
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            expect(rs.rows.item(0).upper1).toBe('S1');
            expect(rs.rows.item(0).upper2).toBe('S2');
            db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT UPPER(?) AS upper1, UPPER(?) AS upper2 with "naive" Array subclass (constructor explicitly set to subclasss) as value arguments array', function(done) {
          var db = openDatabase('DB-SQL-SELECT-multi-upper-on-array-subclass-explicit-constructor.db');
          expect(db).toBeDefined();

          // Variation on the "naive approach" described in
          // http://perfectionkills.com/how-ecmascript-5-still-does-not-allow-to-subclass-an-array/
          function F() {}
          F.prototype = Array.prototype;
          function MyArraySubclass() {}
          MyArraySubclass.prototype = new F();
          myObject = new MyArraySubclass();
          myObject.push('s1', 's2');

          expect(myObject.length).toBe(2);
          expect(myObject[0]).toBe('s1');
          expect(myObject[1]).toBe('s2');

          expect(myObject.constructor).toBe(Array);
          myObject.constructor = MyArraySubclass;
          expect(myObject.constructor).toBe(MyArraySubclass);

          db.executeSql('SELECT UPPER(?) AS upper1, UPPER(?) AS upper2', myObject, function(rs) {
            // EXPECTED RESULT:
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            expect(rs.rows.item(0).upper1).toBeNull();
            expect(rs.rows.item(0).upper2).toBeNull();
            db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql string result test with dynamic object for SQL [INCONSISTENT BEHAVIOR]', function(done) {
          // MyDynamicObject "class":
          function MyDynamicObject() { this.name = 'Alice'; };
          MyDynamicObject.prototype.toString = function() {return "SELECT UPPER('" + this.name + "') as uppertext";}

          var myObject = new MyDynamicObject();
          // Check myObject:
          expect(myObject.toString()).toBe("SELECT UPPER('Alice') as uppertext");

          // NOTE: this test checks that for db.executeSql(), the result callback is
          // called exactly once, with the proper result:
          var db = openDatabase('DB-sql-string-result-test-with-dynamic-object-for-sql.db');
          expect(db).toBeDefined();

          myObject.name = 'Betty';
          db.executeSql(myObject, null, function(rs) {
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            // CORRECT [CONSISTENT with normal Web SQL API]:
            //expect(rs.rows.item(0).uppertext).toBe('BETTY');
            // ACTUAL:
            expect(rs.rows.item(0).uppertext).toBe('CAROL');
            db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
          myObject.name = 'Carol';
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql string result test with dynamic object for parameter arg [INCONSISTENT BEHAVIOR]', function(done) {
          // MyDynamicParameterObject "class":
          function MyDynamicParameterObject() {this.name='Alice';};
          MyDynamicParameterObject.prototype.toString = function() {return this.name;};

          var myObject = new MyDynamicParameterObject();
          // Check myObject:
          expect(myObject.toString()).toBe('Alice');

          // NOTE: this test checks that for db.executeSql(), the result callback is
          // called exactly once, with the proper result:
          var db = openDatabase('DB-sql-string-result-test-with-dynamic-object-for-parameter-arg.db');
          expect(db).toBeDefined();

          myObject.name = 'Betty';
          db.executeSql("SELECT UPPER(?) as uppertext", [myObject], function(rs) {
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            // CORRECT [CONSISTENT with normal Web SQL API]:
            //expect(rs.rows.item(0).uppertext).toBe('BETTY');
            // ACTUAL:
            expect(rs.rows.item(0).uppertext).toBe('CAROL');
            db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
          myObject.name = 'Carol';
        }, MYTIMEOUT);

        it(suiteName + 'Multi-row INSERT with parameters in db.executeSql test', function(done) {
          var db = openDatabase('Multi-row-INSERT-with-parameters-in-db-sql-test.db');

          db.executeSql('DROP TABLE IF EXISTS TestTable;');
          db.executeSql('CREATE TABLE TestTable (x,y)');

          var check1 = false;
          db.executeSql('INSERT INTO TestTable VALUES (?,?),(?,?)', ['a',1,'b',2], function(rs) {
            expect(rs).toBeDefined();
            expect(rs.insertId).toBeDefined();
            expect(rs.insertId).toBe(2);
            if (!(isAndroid && isImpl2))
              expect(rs.rowsAffected).toBe(2);

            check1 = true;
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // NOTE: let the next db.executeSql call determine when to finish this test.
          });

          db.executeSql('SELECT * FROM TestTable', [], function(rs2) {
            // EXPECTED SELECT RESULT:
            expect(rs2).toBeDefined();
            expect(rs2.rows.length).toBe(2);
            expect(rs2.rows.item(0).x).toBe('a');
            expect(rs2.rows.item(0).y).toBe(1);
            expect(rs2.rows.item(1).x).toBe('b');
            expect(rs2.rows.item(1).y).toBe(2);
            expect(check1).toBe(true);
            db.close(done, done);
          }, function(error) {
            // NOT EXPECTED (SELECT):
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'Multiple db.executeSql string result test', function(done) {
          // NOTE: this test checks that for db.executeSql(), the result callback is
          // called exactly once, with the proper result:
          var db = openDatabase('Multiple-DB-sql-String-result-test.db');

          expect(db).toBeDefined();

          var expectedText = [ 'FIRST', 'SECOND' ];
          var i=0;

          var okcb = function(resultSet) {
            expect(resultSet).toBeDefined();

            // ignore the rest of this callback (and do not count)
            // in case resultSet data is not present:
            if (!resultSet) return;

            expect(resultSet.rows).toBeDefined();
            expect(resultSet.rows.length).toBe(1);

            var resultRow = resultSet.rows.item(0);
            expect(resultRow).toBeDefined();

            expect(i < 2).toBe(true);

            expect(resultRow.upperText).toBe(expectedText[i]);

            ++i;

            // wait for second callback:
            if (i === 2) db.close(done, done);
          };

          db.executeSql("SELECT UPPER('first') as upperText", [], okcb);
          db.executeSql("SELECT UPPER('second') as upperText", [], okcb);
        }, MYTIMEOUT);

      });

      describe(pluginScenarioList[i] + ': db.executeSql error test(s)', function() {

        it(suiteName + 'db.executeSql() with no arguments and then inline string test', function(done) {
          var db = openDatabase('DB-execute-sql-with-no-arguments.db');
          expect(db).toBeDefined();

          var check1 = true;
          try {
            // DOES NOT THROW:
            db.executeSql();

            check1 = true;
          } catch (ex) {
            expect('Plugin behavior changed please update this test').toBe('--');
            expect(ex).toBeDefined();
            expect(ex.code).toBeDefined();
            expect(ex.message).toBeDefined();
          }

          db.executeSql("SELECT UPPER('first') AS uppertext", null, function(rs) {
            expect(check1).toBe(true);
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            expect(rs.rows.item(0).uppertext).toBe('FIRST');
            db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql error test with null for SQL statement', function(done) {
          var db = openDatabase('DB-execute-sql-error-test-with-null-for-sql.db');
          expect(db).toBeDefined();

          var check1 = false;
          db.executeSql(null, null, function(ignored) {
            // NOT EXPECTED
            expect(false).toBe(null);
            db.close(done, done);
          }, function(error) {
            expect('Behavior changed please update this test').toBe('--');
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.message).toBeDefined();
            check1 = true;

            if (isWindows)
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWindows)
              expect(error.message).toMatch(/Error preparing an SQLite statement/);
            else
              expect(error.message).toMatch(/near \"SLCT\": syntax error/);
          });

          db.executeSql('SELECT 1', null, function(rs) {
            //expect(check1).toBe(true);
            expect(rs).toBeDefined();
            db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql error test with undefined for SQL statement', function(done) {
          var db = openDatabase('DB-execute-sql-error-test-with-undefined-for-sql.db');
          expect(db).toBeDefined();

          var check1 = false;
          db.executeSql(undefined, null, function(ignored) {
            // NOT EXPECTED
            expect(false).toBe(null);
            db.close(done, done);
          }, function(error) {
            expect('Behavior changed please update this test').toBe('--');
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.message).toBeDefined();
            check1 = true;

            if (isWindows)
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWindows)
              expect(error.message).toMatch(/Error preparing an SQLite statement/);
            else
              expect(error.message).toMatch(/near \"SLCT\": syntax error/);
          });

          db.executeSql('SELECT 1', null, function(rs) {
            //expect(check1).toBe(true);
            expect(rs).toBeDefined();
            db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql error test with true for SQL statement', function(done) {
          var db = openDatabase('DB-execute-sql-error-test-with-true-for-sql.db');
          expect(db).toBeDefined();

          db.executeSql(true, null, function(ignored) {
            // NOT EXPECTED
            expect(false).toBe(null);
            db.close(done, done);
          }, function(error) {
            // EXPECTED RESULT:
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.message).toBeDefined();

            if (isWindows || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWindows)
              expect(error.message).toMatch(/Error preparing an SQLite statement/);
            else
              expect(error.message).toMatch(/near \"true\": syntax error/);

            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql error test with false for SQL statement', function(done) {
          var db = openDatabase('DB-execute-sql-error-test-with-false-for-sql.db');
          expect(db).toBeDefined();

          db.executeSql(false, null, function(ignored) {
            // NOT EXPECTED
            expect(false).toBe(null);
            db.close(done, done);
          }, function(error) {
            // EXPECTED RESULT:
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.message).toBeDefined();

            if (isWindows || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWindows)
              expect(error.message).toMatch(/Error preparing an SQLite statement/);
            else
              expect(error.message).toMatch(/near \"false\": syntax error/);

            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql error test with Infinity for SQL statement', function(done) {
          var db = openDatabase('DB-execute-sql-error-test-with-infinity-for-sql.db');
          expect(db).toBeDefined();

          db.executeSql(Infinity, null, function(ignored) {
            // NOT EXPECTED
            expect(false).toBe(null);
            db.close(done, done);
          }, function(error) {
            // EXPECTED RESULT:
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.message).toBeDefined();

            if (isWindows || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWindows)
              expect(error.message).toMatch(/Error preparing an SQLite statement/);
            else
              expect(error.message).toMatch(/near \"Infinity\": syntax error/);

            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql error test with -Infinity for SQL statement', function(done) {
          var db = openDatabase('DB-execute-sql-error-test-with-infinity-for-sql.db');
          expect(db).toBeDefined();

          db.executeSql(-Infinity, null, function(ignored) {
            // NOT EXPECTED
            expect(false).toBe(null);
            db.close(done, done);
          }, function(error) {
            // EXPECTED RESULT:
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.message).toBeDefined();

            if (isWindows || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWindows)
              expect(error.message).toMatch(/Error preparing an SQLite statement/);
            else
              expect(error.message).toMatch(/near \"-\": syntax error/);

            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql error test with NaN for SQL statement', function(done) {
          var db = openDatabase('DB-execute-sql-error-test-with-nan-for-sql.db');
          expect(db).toBeDefined();

          db.executeSql(NaN, null, function(ignored) {
            // NOT EXPECTED
            expect(false).toBe(null);
            db.close(done, done);
          }, function(error) {
            // EXPECTED RESULT:
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.message).toBeDefined();

            if (isWindows || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWindows)
              expect(error.message).toMatch(/Error preparing an SQLite statement/);
            else
              expect(error.message).toMatch(/near \"NaN\": syntax error/);

            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql error test with null for parameter argument array', function(done) {
          var db = openDatabase('DB-execute-sql-error-test-with-null-for-parameter-arg-array.db');
          expect(db).toBeDefined();

          db.executeSql('SLCT 1', null, function(ignored) {
            // NOT EXPECTED
            expect(false).toBe(null);
            db.close(done, done);
          }, function(error) {
            // EXPECTED RESULT
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.message).toBeDefined();

            if (isWindows || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWindows)
              expect(error.message).toMatch(/Error preparing an SQLite statement/);
            else
              expect(error.message).toMatch(/near \"SLCT\": syntax error/);

            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql error test with undefined for parameter argument array', function(done) {
          var db = openDatabase('DB-execute-sql-error-test-with-undefined-for-parameter-arg-array.db');
          expect(db).toBeDefined();

          db.executeSql('SLCT 1', undefined, function(ignored) {
            // NOT EXPECTED
            expect(false).toBe(null);
            db.close(done, done);
          }, function(error) {
            // EXPECTED RESULT
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.message).toBeDefined();

            if (isWindows || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWindows)
              expect(error.message).toMatch(/Error preparing an SQLite statement/);
            else
              expect(error.message).toMatch(/near \"SLCT\": syntax error/);

            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql error test with "string-value" for parameter argument array', function(done) {
          var db = openDatabase('DB-execute-sql-error-test-with-string-value-for-parameter-arg-array.db');
          expect(db).toBeDefined();

          try {
            db.executeSql('SLCT 1', "string-value", function(ignored) {
              // NOT EXPECTED
              expect(false).toBe(true);
              db.close(done, done);
            }, function(error) {
              // EXPECTED RESULT
              expect(error).toBeDefined();
              expect(error.code).toBeDefined();
              expect(error.message).toBeDefined();
              db.close(done, done);
            });
          } catch(ex) {
            expect('Plugin behavior changed please update this test').toBe('--');
            db.close(done, done);
          }
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql error test with false for parameter argument array', function(done) {
          var db = openDatabase('DB-execute-sql-error-test-with-false-for-parameter-arg-array.db');
          expect(db).toBeDefined();

          try {
            db.executeSql('SLCT 1', false, function(ignored) {
              // NOT EXPECTED
              expect(false).toBe(true);
              db.close(done, done);
            }, function(error) {
              // EXPECTED RESULT
              expect(error).toBeDefined();
              expect(error.code).toBeDefined();
              expect(error.message).toBeDefined();
              db.close(done, done);
            });
          } catch(ex) {
            expect('Plugin behavior changed please update this test').toBe('--');
            db.close(done, done);
          }
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql() with valid SQL, null arguments, false for success cb then inline string test', function(done) {
          var db = openDatabase('DB-execute-sql-with-false-for-success-cb.db');
          expect(db).toBeDefined();

          var check1 = false;
          try {
            // DOES NOT THROW:
            db.executeSql('SELECT 1', null, false, function(error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              expect(error.message).toBe('--');
            });
            check1 = true;
          } catch (ex) {
            expect('Plugin behavior changed please update this test').toBe('--');
            expect(ex).toBeDefined();
            expect(ex.code).toBeDefined();
            expect(ex.message).toBeDefined();
          }

          db.executeSql("SELECT UPPER('first') AS uppertext", null, function(rs) {
            expect(check1).toBe(true);
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            expect(rs.rows.item(0).uppertext).toBe('FIRST');
            db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql() with valid SQL, null arguments, "string-value" for success cb then inline string test', function(done) {
          var db = openDatabase('DB-execute-sql-with-string-value-for-success-cb.db');
          expect(db).toBeDefined();

          var check1 = false;
          try {
            // DOES NOT THROW:
            db.executeSql('SELECT 1', null, 'string-value', function(error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              expect(error.message).toBe('--');
            });
            check1 = true;
          } catch (ex) {
            expect('Plugin behavior changed please update this test').toBe('--');
            expect(ex).toBeDefined();
            expect(ex.code).toBeDefined();
            expect(ex.message).toBeDefined();
          }

          db.executeSql("SELECT UPPER('first') AS uppertext", null, function(rs) {
            expect(check1).toBe(true);
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            expect(rs.rows.item(0).uppertext).toBe('FIRST');
            db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql() error test with false for success callback', function(done) {
          var db = openDatabase('DB-execute-sql-error-with-false-for-success-cb.db');
          expect(db).toBeDefined();

          try {
            // DOES NOT THROW:
            db.executeSql('SLCT 1', null, false, function(error) {
              expect(error).toBeDefined();
              db.close(done, done);
            });
          } catch(ex) {
            expect('Plugin behavior changed please update this test').toBe('--');
            expect(ex).toBeDefined();
            expect(ex.code).toBeDefined();
            expect(ex.message).toBeDefined();
            db.close(done, done);
          }
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql() error test with "string-value" for success callback', function(done) {
          var db = openDatabase('DB-execute-sql-error-with-string-value-for-success-cb.db');
          expect(db).toBeDefined();

          var check1 = true;
          try {
            // DOES NOT THROW:
            db.executeSql('SLCT 1', null, 'string-value', function(error) {
              expect(error).toBeDefined();
              db.close(done, done);
            });
          } catch(ex) {
            expect('Plugin behavior changed please update this test').toBe('--');
            expect(ex).toBeDefined();
            expect(ex.code).toBeDefined();
            expect(ex.message).toBeDefined();
            db.close(done, done);
          }
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql() error test with false for error callback and then inline string test', function(done) {
          var db = openDatabase('DB-execute-sql-with-false-for-error-cb.db');
          expect(db).toBeDefined();

          var check1 = true;
          try {
            // DOES NOT THROW:
            db.executeSql('SLCT 1', null, null, false);

            check1 = true;
          } catch(ex) {
            expect('Plugin behavior changed please update this test').toBe('--');
            expect(ex).toBeDefined();
            expect(ex.code).toBeDefined();
            expect(ex.message).toBeDefined();
          }

          db.executeSql("SELECT UPPER('first') AS uppertext", null, function(rs) {
            expect(check1).toBe(true);
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            expect(rs.rows.item(0).uppertext).toBe('FIRST');
            db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql() error test with "string-value" for error callback and then inline string test', function(done) {
          var db = openDatabase('DB-execute-sql-with-string-value-for-error-cb.db');
          expect(db).toBeDefined();

          var check1 = true;
          try {
            // DOES NOT THROW:
            db.executeSql('SLCT 1', null, null, 'string-value');

            check1 = true;
          } catch(ex) {
            expect('Plugin behavior changed please update this test').toBe('--');
            expect(ex).toBeDefined();
            expect(ex.code).toBeDefined();
            expect(ex.message).toBeDefined();
          }

          db.executeSql("SELECT UPPER('first') AS uppertext", null, function(rs) {
            expect(check1).toBe(true);
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            expect(rs.rows.item(0).uppertext).toBe('FIRST');
            db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + "Multiple db.executeSql error result test", function(done) {
          // NOTE: this test checks that for db.executeSql(), the error result
          // callback is called exactly once, with the proper result:
          var db = openDatabase('Multiple-DB-sql-error-result-test.db');

          var error_result_count = 0;

          // First: syntax error
          db.executeSql("SELCT upper('first') AS uppertext", [], function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
          }, function(error) {
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.message).toBeDefined();

            if (isWindows || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWindows)
              expect(error.message).toMatch(/Error preparing an SQLite statement/);
            else
              expect(error.message).toMatch(/near \"SELCT\": syntax error/);

            // CHECK that this was not called before
            expect(error_result_count).toBe(0);
            ++error_result_count;
          });

          // Second: SELECT misspelled function name
          db.executeSql("SELECT uper('second') as uppertext", [], function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
          }, function(error) {
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.message).toBeDefined();

            if (isWindows || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWindows)
              expect(error.message).toMatch(/Error preparing an SQLite statement/);
            else
              expect(error.message).toMatch(/no such function: uper/);

            expect(error_result_count).toBe(1);
            ++error_result_count;

            // and finish this test:
            db.close(done, done);
          });
        });

      });

      describe(pluginScenarioList[i] + ': additional db.executeSql test(s)', function() {

        it(suiteName + 'PRAGMA & multiple database transaction combination test', function(done) {
          var db = openDatabase('DB1');

          var db2 = openDatabase('DB2');

          // Replacement for QUnit stop()/start() functions:
          var checkCount = 0;
          var expectedCheckCount = 2;

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id INTEGER PRIMARY KEY, data TEXT, data_num INTEGER)');

            ++expectedCheckCount;

            db.executeSql('PRAGMA table_info (test_table);', [], function(resultSet) {
              ++checkCount;

              expect(resultSet).toBeDefined();
              expect(resultSet.rows).toBeDefined();
              expect(resultSet.rows.length).toBe(3);

              var resultRow1 = resultSet.rows.item(0);
              expect(resultRow1).toBeDefined();
              expect(resultRow1.name).toBe('id');

              var resultRow2 = resultSet.rows.item(1);
              expect(resultRow2).toBeDefined();
              expect(resultRow2.name).toBe('data');

              var resultRow3 = resultSet.rows.item(2);
              expect(resultRow3).toBeDefined();
              expect(resultRow3.name).toBe('data_num');
            });
          });

          db2.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS tt2');
            tx.executeSql('CREATE TABLE IF NOT EXISTS tt2 (id2 INTEGER PRIMARY KEY, data2 TEXT, data_num2 INTEGER)');

            db.executeSql('PRAGMA table_info (test_table);', [], function(resultSet) {
              ++checkCount;

              expect(resultSet).toBeDefined();
              expect(resultSet.rows).toBeDefined();

              expect(resultSet.rows.length).toBe(3);

              var resultRow1 = resultSet.rows.item(0);
              expect(resultRow1).toBeDefined();
              expect(resultRow1.name).toBe('id');

              var resultRow2 = resultSet.rows.item(1);
              expect(resultRow2).toBeDefined();
              expect(resultRow2.name).toBe('data');

              var resultRow3 = resultSet.rows.item(2);
              expect(resultRow3).toBeDefined();
              expect(resultRow3.name).toBe('data_num');

              if (checkCount === expectedCheckCount) db.close(done, done);
            });

            db2.executeSql("PRAGMA table_info (tt2);", [], function(resultSet) {
              ++checkCount;

              expect(resultSet).toBeDefined();
              expect(resultSet.rows).toBeDefined();

              expect(resultSet.rows.length).toBe(3);

              var resultRow1 = resultSet.rows.item(0);
              expect(resultRow1).toBeDefined();
              expect(resultRow1.name).toBe('id2');

              var resultRow2 = resultSet.rows.item(1);
              expect(resultRow2).toBeDefined();
              expect(resultRow2.name).toBe('data2');

              var resultRow3 = resultSet.rows.item(2);
              expect(resultRow3).toBeDefined();
              expect(resultRow3.name).toBe('data_num2');

              if (checkCount === expectedCheckCount) db.close(done, done);
            });
          });
        });

      });

    });

  }

}

if (window.hasBrowser) mytests();
else exports.defineAutoTests = mytests;

/* vim: set expandtab : */
