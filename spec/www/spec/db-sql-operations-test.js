/* 'use strict'; */

var MYTIMEOUT = 12000;

var DEFAULT_SIZE = 5000000; // max to avoid popup in safari/ios

// FUTURE TODO replace in test(s):
function ok(test, desc) { expect(test).toBe(true); }
function equal(a, b, desc) { expect(a).toEqual(b); } // '=='

// XXX TODO REFACTOR OUT OF OLD TESTS:
var wait = 0;
var test_it_done = null;
function xtest_it(desc, fun) { xit(desc, fun); }
function test_it(desc, fun) {
  wait = 0;
  it(desc, function(done) {
    test_it_done = done;
    fun();
  }, MYTIMEOUT);
}
function stop(n) {
  if (!!n) wait += n
  else ++wait;
}
function start(n) {
  if (!!n) wait -= n;
  else --wait;
  if (wait == 0) test_it_done();
}

var isWP8 = /IEMobile/.test(navigator.userAgent); // Matches WP(7/8/8.1)
var isWindows = /Windows /.test(navigator.userAgent); // Windows
var isAndroid = !isWindows && /Android/.test(navigator.userAgent);
var isMac = /Macintosh/.test(navigator.userAgent);
var isWKWebView = !isWindows && !isAndroid && !isWP8 && !isMac && !!window.webkit && !!window.webkit.messageHandlers;

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

  describe('Plugin: plugin-specific sql test(s)', function() {

    var pluginScenarioList = [
      isAndroid ? 'Plugin-implementation-default' : 'Plugin',
      'Plugin-implementation-2'
    ];

    var pluginScenarioCount = isAndroid ? 2 : 1;

    for (var i=0; i<pluginScenarioCount; ++i) {

      describe(pluginScenarioList[i] + ': db.executeSql test(s)', function() {
        var scenarioName = pluginScenarioList[i];
        var suiteName = scenarioName + ': ';
        var isImpl2 = (i === 1);

        // NOTE: MUST be defined in function scope, NOT outer scope:
        var openDatabase = function(first, second, third, fourth, fifth, sixth) {
          //if (!isImpl2) {
          //  return window.sqlitePlugin.openDatabase(first, second, third, fourth, fifth, sixth);
          //}

          var dbname, okcb, errorcb;

          if (first.constructor === String ) {
            dbname = first;
            okcb = fifth;
            errorcb = sixth;
          } else {
            dbname = first.name;
            okcb = second;
            errorcb = third;
          }

          if (!isImpl2) {
            return window.sqlitePlugin.openDatabase({name: dbname, location: 0}, okcb, errorcb);
          }

          var dbopts = {
            name: 'i2-'+dbname,
            androidDatabaseImplementation: 2,
            androidLockWorkaround: 1,
            location: 1
          };

          return window.sqlitePlugin.openDatabase(dbopts, okcb, errorcb);
        }

        it(suiteName + 'db.executeSql string result test with null for parameter argument array', function(done) {
          var db = openDatabase("DB-sql-String-result-test-with-null-parameter-arg-array.db", "1.0", "Demo", DEFAULT_SIZE);
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
          var db = openDatabase("Inline-db-sql-US-ASCII-string-test-with-empty-parameter-list.db", "1.0", "Demo", DEFAULT_SIZE);
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
          var db = openDatabase("DB-sql-String-result-test-with-undefined-for-parameter-arg-array.db", "1.0", "Demo", DEFAULT_SIZE);
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
          var db = openDatabase("DB-sql-SELECT-TYPEOF-101.db", "1.0", "Demo", DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.executeSql('SELECT TYPEOF(?) AS myresult', [101], function(rs) {
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            if (isMac || isWKWebView)
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
          var db = openDatabase("DB-sql-SELECT-101.db", "1.0", "Demo", DEFAULT_SIZE);
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
          var db = openDatabase("DB-sql-SELECT-TYPEOF-minus-101.db", "1.0", "Demo", DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.executeSql('SELECT TYPEOF(?) AS myresult', [-101], function(rs) {
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            if (isMac || isWKWebView)
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
          var db = openDatabase("DB-sql-SELECT-minus-101.db", "1.0", "Demo", DEFAULT_SIZE);
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
          var db = openDatabase("DB-sql-SELECT-TYPEOF-123.456.db", "1.0", "Demo", DEFAULT_SIZE);
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
          var db = openDatabase("DB-sql-SELECT-123.456.db", "1.0", "Demo", DEFAULT_SIZE);
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
          var db = openDatabase("DB-sql-SELECT-TYPEOF-minus-123.456.db", "1.0", "Demo", DEFAULT_SIZE);
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
          var db = openDatabase("DB-sql-SELECT-minus-123.456.db", "1.0", "Demo", DEFAULT_SIZE);
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
          var db = openDatabase("DB-sql-SELECT-TYPEOF-0.db", "1.0", "Demo", DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.executeSql('SELECT TYPEOF(?) AS myresult', [0], function(rs) {
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            if (isMac || isWKWebView)
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
          var db = openDatabase("DB-sql-SELECT-TYPEOF-0.db", "1.0", "Demo", DEFAULT_SIZE);
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
          var db = openDatabase("DB-sql-SELECT-TYPEOF-null.db", "1.0", "Demo", DEFAULT_SIZE);
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

        it(suiteName + 'db.executeSql check SELECT TYPEOF(?) with [undefined] for parameter argument array [BROKEN on Windows]', function(done) {
          if (isWP8) pending('SKIP for WP8'); // SKIP for now

          var db = openDatabase("DB-sql-SELECT-TYPEOF-undefined.db", "1.0", "Demo", DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.executeSql('SELECT TYPEOF(?) AS myresult', [undefined], function(rs) {
            if (isWindows) expect('Windows plugin version FIXED please update this test').toBe('--');
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            if (isAndroid && isImpl2)
              expect(rs.rows.item(0).myresult).toBe('text');
            else
              expect(rs.rows.item(0).myresult).toBe('null');
            db.close(done, done);
          }, function(error) {
            // ERROR in case of Windows:
            if (isWindows) {
              expect(error).toBeDefined();
              expect(error.code).toBeDefined();
              expect(error.message).toBeDefined();
              expect(error.code).toBe(0);
              expect(error.message).toMatch(/Unsupported argument type: undefined/);
              return done();
            }

            // OTHERWISE
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql check SELECT TYPEOF(?) with [Infinity] for parameter argument array [TBD Android/iOS/macOS plugin result]', function(done) {
          if (isWP8) pending('SKIP for WP8'); // SKIP for now

          var db = openDatabase("DB-sql-SELECT-TYPEOF-infinity.db", "1.0", "Demo", DEFAULT_SIZE);
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
          if (isWP8) pending('SKIP for WP8'); // SKIP for now
          if (isMac) pending('SKIP for macOS [CRASH]'); // FUTURE TBD

          var db = openDatabase("DB-sql-SELECT-infinity.db", "1.0", "Demo", DEFAULT_SIZE);
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
          if (isWP8) pending('SKIP for WP8'); // SKIP for now

          var db = openDatabase("DB-sql-SELECT-TYPEOF-minus-infinity.db", "1.0", "Demo", DEFAULT_SIZE);
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
          if (isWP8) pending('SKIP for WP8'); // SKIP for now
          if (isMac) pending('SKIP for macOS [CRASH]'); // FUTURE TBD

          var db = openDatabase("DB-sql-SELECT-minus-infinity.db", "1.0", "Demo", DEFAULT_SIZE);
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
          var db = openDatabase("DB-sql-SELECT-TYPEOF-nan.db", "1.0", "Demo", DEFAULT_SIZE);
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

        it(suiteName + 'db.executeSql store numeric values and check', function(done) {
          var db = openDatabase("DB-sql-store-numeric-values-and-check.db", "1.0", "Demo", DEFAULT_SIZE);
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
            if (isMac || isWKWebView)
              expect(rs.rows.item(0).t1).toBe('real');
            else
              expect(rs.rows.item(0).t1).toBe('integer');
            expect(rs.rows.item(0).a1).toBe(101);
            if (isMac || isWKWebView)
              expect(rs.rows.item(0).u1).toBe('101.0');
            else
              expect(rs.rows.item(0).u1).toBe('101');
            expect(rs.rows.item(1).d1).toBe(-101);
            if (isMac || isWKWebView)
              expect(rs.rows.item(1).t1).toBe('real');
            else
              expect(rs.rows.item(1).t1).toBe('integer');
            expect(rs.rows.item(1).a1).toBe(101);
            if (isMac || isWKWebView)
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
            if (isMac || isWKWebView)
              expect(rs.rows.item(4).t1).toBe('real');
            else
              expect(rs.rows.item(4).t1).toBe('integer');
            expect(rs.rows.item(4).a1).toBe(1234567890123);
            if (isMac || isWKWebView)
              expect(rs.rows.item(4).u1).toBe('1234567890123.0');
            else
              expect(rs.rows.item(4).u1).toBe('1234567890123');
            expect(rs.rows.item(5).d1).toBe(-1234567890123);
            if (isMac || isWKWebView)
              expect(rs.rows.item(5).t1).toBe('real');
            else
              expect(rs.rows.item(5).t1).toBe('integer');
            expect(rs.rows.item(5).a1).toBe(1234567890123);
            if (isMac || isWKWebView)
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
            if (isMac || isWKWebView)
              expect(rs.rows.item(8).t1).toBe('real');
            else
              expect(rs.rows.item(8).t1).toBe('integer');
            expect(rs.rows.item(8).a1).toBe(0);
            if (isMac || isWKWebView)
              expect(rs.rows.item(8).u1).toBe('0.0');
            else
              expect(rs.rows.item(8).u1).toBe('0');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql store null/undefined values and check [store undefined value BROKEN on Windows]', function(done) {
          if (isWP8) pending('SKIP for WP8'); // SKIP for now

          var db = openDatabase("DB-sql-store-null-undefined-values-and-check.db", "1.0", "Demo", DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.executeSql('DROP TABLE IF EXISTS MyTable');
          db.executeSql('CREATE TABLE MyTable (data)');
          db.executeSql('INSERT INTO MyTable VALUES (?)', [null]);
          // NOTE: THIS WILL FAIL on Windows:
          db.executeSql('INSERT INTO MyTable VALUES (?)', [undefined]);

          db.executeSql('SELECT data AS d1, TYPEOF(data) AS t1, ABS(data) AS a1, UPPER(data) as u1 FROM MyTable', [], function (rs) {
            expect(rs.rows).toBeDefined();
            if (isWindows) // [FUTURE TBD]
              expect(rs.rows.length).toBe(1);
            else
              expect(rs.rows.length).toBe(2);
            expect(rs.rows.item(0).d1).toBe(null);
            expect(rs.rows.item(0).t1).toBe('null');
            expect(rs.rows.item(0).a1).toBe(null);
            expect(rs.rows.item(0).u1).toBe(null);
            if (isWindows) return done(); // [FUTURE TBD]
            expect(rs.rows.item(1).d1).toBe(null);
            expect(rs.rows.item(1).t1).toBe('null');
            expect(rs.rows.item(1).a1).toBe(null);
            expect(rs.rows.item(1).u1).toBe(null);
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql store Infinity/NaN values and check [TBD Android/iOS plugin result]', function(done) {
          if (isWP8) pending('SKIP for WP8'); // SKIP for now
          if (isMac) pending('SKIP for macOS [CRASH]'); // FUTURE TBD

          var db = openDatabase("DB-sql-store-infinity-nan-values-and-check.db", "1.0", "Demo", DEFAULT_SIZE);
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
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql string result test with new String for SQL', function(done) {
          var db = openDatabase("DB-sql-new-String-test.db", "1.0", "Demo", DEFAULT_SIZE);
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
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            expect(rs.rows.item(0).upper1).toBe('S1');
            expect(rs.rows.item(0).upper2).toBe('S2');
            done();
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
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
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            expect(rs.rows.item(0).upper1).toBeNull();
            expect(rs.rows.item(0).upper2).toBeNull();
            done();
          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
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
          var db = openDatabase("DB-sql-string-result-test-with-dynamic-object-for-sql.db", "1.0", "Demo", DEFAULT_SIZE);
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
          var db = openDatabase("DB-sql-string-result-test-with-dynamic-object-for-parameter-arg.db", "1.0", "Demo", DEFAULT_SIZE);
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
          if (isWP8) pending('SKIP: NOT SUPPORTED for WP8');

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
            done();
          }, function(error) {
            // NOT EXPECTED (SELECT):
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        test_it(suiteName + "Multiple db.executeSql string result test", function() {
          // NOTE: this test checks that for db.executeSql(), the result callback is
          // called exactly once, with the proper result:
          var db = openDatabase("Multiple-DB-sql-String-result-test.db", "1.0", "Demo", DEFAULT_SIZE);

          var expected = [ 'FIRST', 'SECOND' ];
          var i=0;

          ok(!!db, 'valid db object');

          stop(2);

          var okcb = function(result) {
            if (i > 1) {
              ok(false, "unexpected result: " + JSON.stringify(result));
              console.log("discarding unexpected result: " + JSON.stringify(result))
              return;
            }

            ok(!!result, "valid result object");

            // ignore cb (and do not count) if result is undefined:
            if (!!result) {
              console.log("result.rows.item(0).uppertext: " + result.rows.item(0).uppertext);
              equal(result.rows.item(0).uppertext, expected[i], "Check result " + i);
              i++;
              start(1);
            }
          };

          db.executeSql("select upper('first') as uppertext", [], okcb);
          db.executeSql("select upper('second') as uppertext", [], okcb);
        }, MYTIMEOUT);

      });
    }

  });

  describe('Plugin: plugin-specific error test(s)', function() {

    var pluginScenarioList = [
      isAndroid ? 'Plugin-implementation-default' : 'Plugin',
      'Plugin-implementation-2'
    ];

    var pluginScenarioCount = isAndroid ? 2 : 1;

    for (var i=0; i<pluginScenarioCount; ++i) {

      describe(pluginScenarioList[i] + ': db.executeSql error test(s)', function() {
        var scenarioName = pluginScenarioList[i];
        var suiteName = scenarioName + ': ';
        var isImpl2 = (i === 1);

        // NOTE: MUST be defined in function scope, NOT outer scope:
        var openDatabase = function(first, second, third, fourth, fifth, sixth) {
          //if (!isImpl2) {
          //  return window.sqlitePlugin.openDatabase(first, second, third, fourth, fifth, sixth);
          //}

          var dbname, okcb, errorcb;

          if (first.constructor === String ) {
            dbname = first;
            okcb = fifth;
            errorcb = sixth;
          } else {
            dbname = first.name;
            okcb = second;
            errorcb = third;
          }

          if (!isImpl2) {
            return window.sqlitePlugin.openDatabase({name: dbname, location: 0}, okcb, errorcb);
          }

          var dbopts = {
            name: 'i2-'+dbname,
            androidDatabaseImplementation: 2,
            androidLockWorkaround: 1,
            location: 1
          };

          return window.sqlitePlugin.openDatabase(dbopts, okcb, errorcb);
        }

        it(suiteName + 'db.executeSql() with no arguments and then inline string test', function(done) {
          var db = openDatabase("DB-execute-sql-with-no-arguments.db", "1.0", "Demo", DEFAULT_SIZE);
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
          var db = openDatabase("DB-execute-sql-error-test-with-null-for-sql.db", "1.0", "Demo", DEFAULT_SIZE);
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

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
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
          var db = openDatabase("DB-execute-sql-error-test-with-undefined-for-sql.db", "1.0", "Demo", DEFAULT_SIZE);
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

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
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
          var db = openDatabase("DB-execute-sql-error-test-with-true-for-sql.db", "1.0", "Demo", DEFAULT_SIZE);
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

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
              expect(error.message).toMatch(/Error preparing an SQLite statement/);
            else
              expect(error.message).toMatch(/near \"true\": syntax error/);

            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql error test with false for SQL statement', function(done) {
          var db = openDatabase("DB-execute-sql-error-test-with-false-for-sql.db", "1.0", "Demo", DEFAULT_SIZE);
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

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
              expect(error.message).toMatch(/Error preparing an SQLite statement/);
            else
              expect(error.message).toMatch(/near \"false\": syntax error/);

            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql error test with Infinity for SQL statement', function(done) {
          var db = openDatabase("DB-execute-sql-error-test-with-infinity-for-sql.db", "1.0", "Demo", DEFAULT_SIZE);
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

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
              expect(error.message).toMatch(/Error preparing an SQLite statement/);
            else
              expect(error.message).toMatch(/near \"Infinity\": syntax error/);

            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql error test with -Infinity for SQL statement', function(done) {
          var db = openDatabase("DB-execute-sql-error-test-with-infinity-for-sql.db", "1.0", "Demo", DEFAULT_SIZE);
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

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
              expect(error.message).toMatch(/Error preparing an SQLite statement/);
            else
              expect(error.message).toMatch(/near \"-\": syntax error/);

            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql error test with NaN for SQL statement', function(done) {
          var db = openDatabase("DB-execute-sql-error-test-with-nan-for-sql.db", "1.0", "Demo", DEFAULT_SIZE);
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

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
              expect(error.message).toMatch(/Error preparing an SQLite statement/);
            else
              expect(error.message).toMatch(/near \"NaN\": syntax error/);

            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql error test with null for parameter argument array', function(done) {
          var db = openDatabase("DB-execute-sql-error-test-with-null-for-parameter-arg-array.db", "1.0", "Demo", DEFAULT_SIZE);
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

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
              expect(error.message).toMatch(/Error preparing an SQLite statement/);
            else
              expect(error.message).toMatch(/near \"SLCT\": syntax error/);

            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql error test with undefined for parameter argument array', function(done) {
          var db = openDatabase("DB-execute-sql-error-test-with-undefined-for-parameter-arg-array.db", "1.0", "Demo", DEFAULT_SIZE);
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

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
              expect(error.message).toMatch(/Error preparing an SQLite statement/);
            else
              expect(error.message).toMatch(/near \"SLCT\": syntax error/);

            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'db.executeSql error test with "string-value" for parameter argument array', function(done) {
          var db = openDatabase("DB-execute-sql-error-test-with-string-value-for-parameter-arg-array.db", "1.0", "Demo", DEFAULT_SIZE);
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
          var db = openDatabase("DB-execute-sql-error-test-with-false-for-parameter-arg-array.db", "1.0", "Demo", DEFAULT_SIZE);
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

        it(suiteName + 'db.executeSql() error test with "string-value" for success callback', function(done) {
          var db = openDatabase("DB-execute-sql-with-string-value-for-success-cb.db", "1.0", "Demo", DEFAULT_SIZE);
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

        it(suiteName + 'db.executeSql() error test with "string-value" for error callback and then inline string test', function(done) {
          var db = openDatabase("DB-execute-sql-with-string-value-for-error-cb.db", "1.0", "Demo", DEFAULT_SIZE);
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
          var db = openDatabase("Multiple-DB-sql-error-result-test.db", "1.0", "Demo", DEFAULT_SIZE);

          var error_result_count = 0;

          // First: syntax error
          db.executeSql("SELCT upper('first') AS uppertext", [], function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
          }, function(error) {
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
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

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
              expect(error.message).toMatch(/Error preparing an SQLite statement/);
            else
              expect(error.message).toMatch(/no such function: uper/);

            expect(error_result_count).toBe(1);
            ++error_result_count;

            // and finish this test:
            done();
          });
        });

      });
    }

  });

  describe('Plugin: more plugin-specific test(s)', function() {

    var pluginScenarioList = [
      isAndroid ? 'Plugin-implementation-default' : 'Plugin',
      'Plugin-implementation-2'
    ];

    var pluginScenarioCount = isAndroid ? 2 : 1;

    for (var i=0; i<pluginScenarioCount; ++i) {

      describe(pluginScenarioList[i] + ': more db.executeSql test(s)', function() {
        var scenarioName = pluginScenarioList[i];
        var suiteName = scenarioName + ': ';
        var isImpl2 = (i === 1);

        // NOTE: MUST be defined in function scope, NOT outer scope:
        var openDatabase = function(first, second, third, fourth, fifth, sixth) {
          //if (!isImpl2) {
          //  return window.sqlitePlugin.openDatabase(first, second, third, fourth, fifth, sixth);
          //}

          var dbname, okcb, errorcb;

          if (first.constructor === String ) {
            dbname = first;
            okcb = fifth;
            errorcb = sixth;
          } else {
            dbname = first.name;
            okcb = second;
            errorcb = third;
          }

          if (!isImpl2) {
            return window.sqlitePlugin.openDatabase({name: dbname, location: 0}, okcb, errorcb);
          }

          var dbopts = {
            name: 'i2-'+dbname,
            androidDatabaseImplementation: 2,
            androidLockWorkaround: 1,
            location: 1
          };

          return window.sqlitePlugin.openDatabase(dbopts, okcb, errorcb);
        }

        test_it(suiteName + "PRAGMAs & multiple database transactions mixed together", function() {
          var db = openDatabase("DB1", "1.0", "Demo", DEFAULT_SIZE);

          var db2 = openDatabase("DB2", "1.0", "Demo", DEFAULT_SIZE);

          stop(2);

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)', [], function() {
              console.log("test_table created");
            });

            stop();
            db.executeSql("pragma table_info (test_table);", [], function(res) {
              start();
              console.log("PRAGMA res: " + JSON.stringify(res));
              equal(res.rows.item(2).name, "data_num", "DB1 table number field name");
            });
          });

          db2.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS tt2');
            tx.executeSql('CREATE TABLE IF NOT EXISTS tt2 (id2 integer primary key, data2 text, data_num2 integer)', [], function() {
              console.log("tt2 created");
            });

            db.executeSql("pragma table_info (test_table);", [], function(res) {
              console.log("PRAGMA (db) res: " + JSON.stringify(res));
              equal(res.rows.item(0).name, "id", "DB1 table key field name");
              equal(res.rows.item(1).name, "data", "DB1 table text field name");
              equal(res.rows.item(2).name, "data_num", "DB1 table number field name");

              start();
            });

            db2.executeSql("pragma table_info (tt2);", [], function(res) {
              console.log("PRAGMA (tt2) res: " + JSON.stringify(res));
              equal(res.rows.item(0).name, "id2", "DB2 table key field name");
              equal(res.rows.item(1).name, "data2", "DB2 table text field name");
              equal(res.rows.item(2).name, "data_num2", "DB2 table number field name");

              start();
            });
          });
        });

      });
    }

  });

}

if (window.hasBrowser) mytests();
else exports.defineAutoTests = mytests;

/* vim: set expandtab : */
