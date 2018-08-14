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
var isMac = !isBrowser && /Macintosh/.test(navigator.userAgent);
var isAppleMobileOS = /iPhone/.test(navigator.userAgent) ||
      /iPad/.test(navigator.userAgent) || /iPod/.test(navigator.userAgent);
var hasMobileWKWebView = isAppleMobileOS && !!window.webkit && !!window.webkit.messageHandlers;

// should avoid popups (Safari seems to count 2x)
var DEFAULT_SIZE = isSafariBrowser ? 2000000 : 5000000;
// FUTURE TBD: 50MB should be OK on Chrome and some other test browsers.

// NOTE: While in certain version branches there is no difference between
// the default Android implementation and implementation #2,
// this test script will also apply the androidLockWorkaround: 1 option
// in case of implementation #2.
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

    describe(scenarioList[i] + ': tx value bindings (stored value bindings) test(s)', function() {
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

      describe(suiteName + 'transaction column value insertion test(s)', function() {

        it(suiteName + 'INSERT US-ASCII TEXT string ("Test 123"), SELECT the data, check, and check HEX value [default sqlite HEX encoding: UTF-6le on Windows & Android 4.1-4.3 (WebKit) Web SQL, UTF-8 otherwise]', function(done) {
          var db = openDatabase('INSERT-ascii-text-string-and-check.db', '1.0', 'Demo', DEFAULT_SIZE);

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (data)', [], function(ignored1, ignored2) {

              tx.executeSql('INSERT INTO test_table VALUES (?)', ['Test 123'], function(tx_ignored, rs1) {
                expect(rs1).toBeDefined();
                expect(rs1.rowsAffected).toBe(1);

                tx.executeSql('SELECT * FROM test_table', [], function(tx_ignored, rs2) {
                  expect(rs2).toBeDefined();
                  expect(rs2.rows).toBeDefined();
                  expect(rs2.rows.length).toBe(1);

                  var row = rs2.rows.item(0);
                  expect(row.data).toBe('Test 123');

                  tx.executeSql('SELECT HEX(data) AS hexvalue FROM test_table', [], function(tx_ignored, rs3) {
                    expect(rs3).toBeDefined();
                    expect(rs3.rows).toBeDefined();
                    expect(rs3.rows.length).toBe(1);

                    var hexvalue = rs3.rows.item(0).hexvalue;
                    if (isWindows || (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent)))
                      expect(hexvalue).toBe('54006500730074002000310032003300'); // (UTF-16le)
                    else
                      expect(hexvalue).toBe('5465737420313233'); // (UTF-8)

                    // Close (plugin only) & finish:
                    (isWebSql) ? done() : db.close(done, done);
                  });

                });
              });
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('---');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'INSERT TEXT string with é (UTF-8 2 octets), SELECT the data, check, and check HEX value [default sqlite HEX encoding: UTF-6le on Windows & Android 4.1-4.3 (WebKit) Web SQL, UTF-8 otherwise]', function(done) {
          var db = openDatabase('INSERT-UTF8-2-octets-and-check.db', '1.0', 'Demo', DEFAULT_SIZE);

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (data)', [], function(ignored1, ignored2) {

              tx.executeSql('INSERT INTO test_table VALUES (?)', ['é'], function(tx, res) {

                expect(res).toBeDefined();
                expect(res.rowsAffected).toBe(1);

                tx.executeSql('SELECT * FROM test_table', [], function(tx, res) {
                  var row = res.rows.item(0);

                  expect(row.data).toBe('é');

                  tx.executeSql('SELECT HEX(data) AS hexvalue FROM test_table', [], function(tx, res) {
                    if (isWindows || (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent)))
                      expect(res.rows.item(0).hexvalue).toBe('E900'); // (UTF-16le)
                    else
                      expect(res.rows.item(0).hexvalue).toBe('C3A9'); // (UTF-8)

                    // Close (plugin only) & finish:
                    (isWebSql) ? done() : db.close(done, done);
                  });

                });
              });
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('---');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'INSERT TEXT string with € (UTF-8 3 octets), SELECT the data, check, and check HEX value [default sqlite HEX encoding: UTF-6le on Windows & Android 4.1-4.3 (WebKit) Web SQL, UTF-8 otherwise]', function(done) {
          var db = openDatabase('INSERT-UTF8-3-octets-and-check.db', '1.0', 'Demo', DEFAULT_SIZE);

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (data)', [], function(ignored1, ignored2) {

              tx.executeSql('INSERT INTO test_table VALUES (?)', ['€'], function(tx, res) {

                expect(res).toBeDefined();
                expect(res.rowsAffected).toBe(1);

                tx.executeSql('SELECT * FROM test_table', [], function(tx, res) {
                  var row = res.rows.item(0);

                  expect(row.data).toBe('€');

                  tx.executeSql('SELECT HEX(data) AS hexvalue FROM test_table', [], function(tx, res) {
                    if (isWindows || (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent)))
                      expect(res.rows.item(0).hexvalue).toBe('AC20');
                    else
                      expect(res.rows.item(0).hexvalue).toBe('E282AC');

                    // Close (plugin only) & finish:
                    (isWebSql) ? done() : db.close(done, done);
                  });

                });
              });
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('---');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'INSERT with null parameter argument value and check stored data', function(done) {
          var db = openDatabase('INSERT-null-arg-value-and-check.db', '1.0', 'Demo', DEFAULT_SIZE);

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (data1, data2)', [], function(ignored1, ignored2) {

              tx.executeSql('INSERT INTO test_table VALUES (?,?)', [null, 'test-string'], function(ignored, rs1) {

                expect(rs1).toBeDefined();
                expect(rs1.rowsAffected).toBe(1);

                tx.executeSql('SELECT * FROM test_table', [], function(ignored, rs2) {
                  var row = rs2.rows.item(0);

                  expect(row.data1).toBeNull();
                  expect(row.data2).toBe('test-string');

                  tx.executeSql('SELECT TYPEOF(data1) AS t1, TYPEOF(data2) AS t2 FROM test_table', null, function(ignored, rs3) {
                    expect(rs3).toBeDefined();
                    expect(rs3.rows).toBeDefined();
                    expect(rs3.rows.length).toBe(1);
                    expect(rs3.rows.item(0).t1).toBe('null');
                    expect(rs3.rows.item(0).t2).toBe('text');

                    // Close (plugin only) & finish:
                    (isWebSql) ? done() : db.close(done, done);
                  });

                });
              });
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('---');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'INSERT with undefined parameter argument value (inserted as null) and check stored data [returns text in case of Android (WebKit) Web SQL]', function(done) {
          var db = openDatabase('INSERT-undefined-arg-value-and-check.db', '1.0', 'Demo', DEFAULT_SIZE);

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (data1, data2)', [], function(ignored1, ignored2) {

              tx.executeSql('INSERT INTO test_table VALUES (?,?)', [undefined, 'test-string'], function(ignored, rs1) {
                expect(rs1).toBeDefined();
                expect(rs1.rowsAffected).toBe(1);

                tx.executeSql('SELECT * FROM test_table', [], function(ignored, rs2) {
                  var row = rs2.rows.item(0);

                  if (isWebSql && (isAndroid || isChromeBrowser))
                    expect(row.data1).toBe('undefined');
                  else
                    expect(row.data1).toBeNull();
                  expect(row.data2).toBe('test-string');

                  tx.executeSql('SELECT TYPEOF(data1) AS t1, TYPEOF(data2) AS t2 FROM test_table', null, function(ignored, rs3) {
                    expect(rs3).toBeDefined();
                    expect(rs3.rows).toBeDefined();
                    expect(rs3.rows.length).toBe(1);
                    if (isWebSql && (isAndroid || isChromeBrowser))
                      expect(rs3.rows.item(0).t1).toBe('text');
                    else
                      expect(rs3.rows.item(0).t1).toBe('null');
                    expect(rs3.rows.item(0).t2).toBe('text');

                    // Close (plugin only) & finish:
                    (isWebSql) ? done() : db.close(done, done);
                  });

                });
              });
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('---');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + "all columns should be included in result set including id integer primary key & 'null' columns", function(done) {

          var db = openDatabase('all-result-columns-including-null-columns.db', '1.0', 'Demo', DEFAULT_SIZE);

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)');

          }, function(err) {
            expect(false).toBe(true);
            expect(err.message).toBe('---');

          }, function() {
            db.transaction(function(tx) {
              tx.executeSql("insert into test_table (data, data_num) VALUES (?,?)", ["test", null], function(tx, res) {

                expect(res).toBeDefined();
                expect(res.rowsAffected).toEqual(1);

                tx.executeSql("select * from test_table", [], function(tx, res) {
                  var row = res.rows.item(0);

                  //deepEqual(row, { id: 1, data: "test", data_num: null }, "all columns should be included in result set.");
                  expect(row.id).toBe(1);
                  expect(row.data).toEqual('test');
                  expect(row.data_num).toBeDefined();
                  expect(row.data_num).toBeNull();

                  // Close (plugin only) & finish:
                  (isWebSql) ? done() : db.close(done, done);
                });
              });
            });
          });
        });

        it(suiteName + 'INSERT integer value (42) with no/INTEGER/NUMERIC/REAL/TEXT affinity & check stored data [TBD Plugin vs (WebKit) Web SQL]', function(done) {
          var db = openDatabase("INTEGER-INSERT-value-bindings.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS tt');
            tx.executeSql('CREATE TABLE IF NOT EXISTS tt (data1, data2 INTEGER, data3 NUMERIC, data4 REAL, data5 TEXT)', null, function(ignored1, ignored2) {
              tx.executeSql('INSERT INTO tt VALUES (?,?,?,?,?)',
                  [42, 42, 42, 42, 42], function(ignored, rs1) {
                expect(rs1).toBeDefined();
                expect(rs1.rowsAffected).toBe(1);
                expect(rs1.insertId).toBe(1);

                tx.executeSql('SELECT * FROM tt', [], function(ignored, rs2) {
                  // CHECK BIG INTEGER number was inserted properly:
                  expect(rs2).toBeDefined();
                  expect(rs2.rows).toBeDefined();
                  expect(rs2.rows.length).toBe(1);

                  var row = rs2.rows.item(0);
                  expect(row.data1).toBe(42);
                  expect(row.data2).toBe(42);
                  expect(row.data3).toBe(42);
                  expect(row.data4).toBe(42);

                  if (isWebSql || isMac || hasMobileWKWebView)
                    expect(row.data5).toBe('42.0');
                  else
                    expect(row.data5).toBe('42');

                  tx.executeSql('SELECT TYPEOF(data1) AS t1, TYPEOF(data2) AS t2, TYPEOF(data3) AS t3, TYPEOF(data4) AS t4, TYPEOF(data5) AS t5 FROM tt', [], function(ignored, rs3) {
                    expect(rs3).toBeDefined();
                    expect(rs3.rows).toBeDefined();
                    expect(rs3.rows.length).toBe(1);

                    var row = rs3.rows.item(0);
                    if (isWebSql || isMac || hasMobileWKWebView)
                      expect(row.t1).toBe('real');
                    else
                      expect(row.t1).toBe('integer');
                    expect(row.t2).toBe('integer');
                    expect(row.t3).toBe('integer');
                    expect(row.t4).toBe('real');
                    expect(row.t5).toBe('text');

                    // Close (plugin only) & finish:
                    (isWebSql) ? done() : db.close(done, done);
                  });

                });
              });
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('---');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'INSERT Infinity with no/NUMERIC/REAL/INTEGER/TEXT type affinity and check stored data [Android/iOS Plugin BROKEN: stored with null value]', function(done) {
          if (isMac) pending('SKIP for macOS [CRASH]'); // FUTURE TBD

          var db = openDatabase('INSERT-Infinity-and-check.db', '1.0', 'Demo', DEFAULT_SIZE);

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE test_table (data, data_num NUMERIC, data_real REAL, data_int INTEGER, data_text TEXT)', [], function(ignored1, ignored2) {

              tx.executeSql('INSERT INTO test_table VALUES (?,?,?,?,?)', [Infinity, Infinity, Infinity, Infinity, Infinity], function(ignored, res) {

                expect(res).toBeDefined();
                expect(res.rowsAffected).toBe(1);

                tx.executeSql('SELECT * FROM test_table', [], function(tx, rs) {
                  expect(rs).toBeDefined();
                  expect(rs.rows).toBeDefined();
                  expect(rs.rows.length).toBeDefined();

                  var row = rs.rows.item(0);
                  expect(row).toBeDefined();

                  if (!isWebSql && !isBrowser && !isWindows) {
                    // Android/iOS plugin issue
                    expect(row.data).toBe(null);
                    expect(row.data_num).toBe(null);
                    expect(row.data_real).toBe(null);
                    expect(row.data_int).toBe(null);
                    expect(row.data_text).toBe(null);
                  } else {
                    expect(row.data).toBe(Infinity);
                    expect(row.data_num).toBe(Infinity);
                    expect(row.data_real).toBe(Infinity);
                    expect(row.data_int).toBe(Infinity);
                    expect(row.data_text).toBe('Inf');
                  }

                  // Close (plugin only) & finish:
                  (isWebSql) ? done() : db.close(done, done);
                });

              });

            });

          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('---');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'INSERT -Infinity with no/NUMERIC/REAL/INTEGER/TEXT type affinity and check stored data [Android/iOS Plugin BROKEN: stored with null value]', function(done) {
          if (isMac) pending('SKIP for macOS [CRASH]'); // FUTURE TBD

          var db = openDatabase('INSERT-minus-Infinity-and-check.db', '1.0', 'Demo', DEFAULT_SIZE);

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE test_table (data, data_num NUMERIC, data_real REAL, data_int INTEGER, data_text TEXT)', [], function(ignored1, ignored2) {

              tx.executeSql('INSERT INTO test_table VALUES (?,?,?,?,?)', [-Infinity, -Infinity, -Infinity, -Infinity, -Infinity], function(ignored, res) {

                expect(res).toBeDefined();
                expect(res.rowsAffected).toBe(1);

                tx.executeSql('SELECT * FROM test_table', [], function(tx, rs) {
                  expect(rs).toBeDefined();
                  expect(rs.rows).toBeDefined();
                  expect(rs.rows.length).toBeDefined();

                  var row = rs.rows.item(0);
                  expect(row).toBeDefined();

                  if (!isWebSql && !isBrowser && !isWindows) {
                    // Android/iOS plugin issue
                    expect(row.data).toBe(null);
                    expect(row.data_num).toBe(null);
                    expect(row.data_real).toBe(null);
                    expect(row.data_int).toBe(null);
                    expect(row.data_text).toBe(null);
                  } else {
                    expect(row.data).toBe(-Infinity);
                    expect(row.data_num).toBe(-Infinity);
                    expect(row.data_real).toBe(-Infinity);
                    expect(row.data_int).toBe(-Infinity);
                    expect(row.data_text).toBe('-Inf');
                  }

                  // Close (plugin only) & finish:
                  (isWebSql) ? done() : db.close(done, done);
                });

              });

            });

          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('---');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'INSERT NaN with no/NUMERIC/REAL/INTEGER/TEXT type affinity and check stored data', function(done) {

          var db = openDatabase('INSERT-minus-Infinity-and-check.db', '1.0', 'Demo', DEFAULT_SIZE);

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE test_table (data, data_num NUMERIC, data_real REAL, data_int INTEGER, data_text TEXT)', [], function(ignored1, ignored2) {

              tx.executeSql('INSERT INTO test_table VALUES (?,?,?,?,?)', [NaN, NaN, NaN, NaN, NaN], function(ignored, res) {

                expect(res).toBeDefined();
                expect(res.rowsAffected).toBe(1);

                tx.executeSql('SELECT * FROM test_table', [], function(tx, rs) {
                  expect(rs).toBeDefined();
                  expect(rs.rows).toBeDefined();
                  expect(rs.rows.length).toBeDefined();

                  var row = rs.rows.item(0);
                  expect(row).toBeDefined();
                  expect(row.data).toBe(null);
                  expect(row.data_num).toBe(null);
                  expect(row.data_real).toBe(null);
                  expect(row.data_int).toBe(null);
                  expect(row.data_text).toBe(null);

                  // Close (plugin only) & finish:
                  (isWebSql) ? done() : db.close(done, done);
                });

              });

            });

          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('---');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        // NOTE: emojis and other 4-octet UTF-8 characters are evidently
        // not stored properly by Android-sqlite-connector
        // ref: litehelpers/Cordova-sqlite-storage#564
        it(suiteName + 'INSERT TEXT string with emoji [\\u1F603 SMILING FACE (MOUTH OPEN)], SELECT the data, check, and check HEX [XXX HEX encoding BUG IGNORED on default Android NDK access implementation (Android-sqlite-connector with Android-sqlite-native-driver), TBD TRUNCATION BUG REPRODUCED on Windows; default sqlite HEX encoding: UTF-6le on Windows & Android 4.1-4.3 (WebKit) Web SQL, UTF-8 otherwise]' , function(done) {
          var db = openDatabase('INSERT-emoji-and-check.db', '1.0', 'Demo', DEFAULT_SIZE);

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (data)', [], function(ignored1, ignored2) {

              tx.executeSql('INSERT INTO test_table VALUES (?)', ['@\uD83D\uDE03!'], function(tx_ignored, rs1) {
                expect(rs1).toBeDefined();
                expect(rs1.rowsAffected).toBe(1);

                tx.executeSql('SELECT * FROM test_table', [], function(tx_ignored, rs2) {
                  expect(rs2).toBeDefined();
                  expect(rs2.rows).toBeDefined();
                  expect(rs2.rows.length).toBe(1);

                  var row = rs2.rows.item(0);
                  // Full object check:
                  expect(row).toEqual({data: '@\uD83D\uDE03!'});
                  // Check individual members:
                  expect(row.data).toBe('@\uD83D\uDE03!');

                  tx.executeSql('SELECT HEX(data) AS hexvalue FROM test_table', [], function(tx_ignored, rs3) {
                    expect(rs3).toBeDefined();
                    expect(rs3.rows).toBeDefined();
                    expect(rs3.rows.length).toBe(1);

                    // XXX TBD HEX encoding BUG IGNORED on default Android NDK access implementation
                    // STOP HERE [HEX encoding BUG] for Android-sqlite-connector:
                    if (!isWebSql && !isWindows && isAndroid && !isImpl2) return done();

                    if (isWindows || (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent)))
                      expect(rs3.rows.item(0).hexvalue).toBe('40003DD803DE2100'); // (UTF-16le)
                    /* XXX TBD HEX encoding BUG IGNORED on default Android NDK access implementation (...)
                    else if (!isWebSql && isAndroid && !isImpl2)
                      expect(rs3.rows.item(0).hexvalue).toBe('--'); // (...) */
                    else
                      expect(rs3.rows.item(0).hexvalue).toBe('40F09F988321'); // (UTF-8)

                    // Close (plugin only) & finish:
                    (isWebSql) ? done() : db.close(done, done);
                  });

                });
              });
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('---');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + "number values inserted using number bindings", function(done) {

          var db = openDatabase("Value-binding-test.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            // create columns with no type affinity
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data_text1, data_text2, data_int, data_real)');
          }, function(err) {
            expect(false).toBe(true);
            expect(err.message).toBe('---');

          }, function() {
            db.transaction(function(tx) {

              tx.executeSql("insert into test_table (data_text1, data_text2, data_int, data_real) VALUES (?,?,?,?)", ["314159", "3.14159", 314159, 3.14159], function(tx, res) {

                expect(res).toBeDefined();
                expect(res.rowsAffected).toBe(1);

                tx.executeSql("select * from test_table", [], function(tx, res) {
                  var row = res.rows.item(0);

                  expect(row.id).toBe(1);
                  expect(row.data_text1).toBe("314159"); // (data_text1 should have inserted data as text)
                  expect(row.data_text2).toBe("3.14159"); // (data_text2 should have inserted data as text)
                  expect(row.data_int).toBe(314159); // (data_int should have inserted data as an integer)
                  expect(Math.abs(row.data_real - 3.14159) < 0.000001).toBe(true); // (data_real should have inserted data as a real)

                  // Close (plugin only) & finish:
                  (isWebSql) ? done() : db.close(done, done);

                  tx.executeSql('SELECT TYPEOF(data_text1) AS t1, TYPEOF(data_text2) AS t2, data_int AS t3, data_real AS t4', null, function(ignored, rs3) {
                    expect(rs3).toBeDefined();
                    expect(rs3.rows).toBeDefined();
                    expect(rs3.rows.length).toBe(1);
                    expect(rs3.rows.item(0).t1).toBe('text');
                    expect(rs3.rows.item(0).t2).toBe('text');
                    expect(rs3.rows.item(0).t2).toBe('integer');
                    expect(rs3.rows.item(0).t2).toBe('real');

                    // Close (plugin only) & finish:
                    (isWebSql) ? done() : db.close(done, done);
                  });

                });
              });
            });
          });
        });

        it(suiteName + 'BIG INTEGER INSERT value bindings', function(done) {
          var db = openDatabase("BIG-INTEGER-INSERT-value-bindings.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS tt');
            // NOTE: DATETIME is same as NUMERIC ref:
            // https://www.sqlite.org/datatype3.html#affinity_name_examples
            tx.executeSql('CREATE TABLE IF NOT EXISTS tt (data1, test_int INTEGER, test_num NUMERIC, test_date DATETIME, test_text TEXT)', null, function(ignored1, ignored2) {
              tx.executeSql('INSERT INTO tt VALUES (?,?,?,?,?)',
                  [1424174959894, 1424174959894, 1424174959894, 1424174959894, 1424174959894], function(ignored, rs1) {
                expect(rs1).toBeDefined();
                expect(rs1.rowsAffected).toBe(1);
                expect(rs1.insertId).toBe(1);

                tx.executeSql('SELECT * FROM tt', [], function(ignored, rs2) {
                  // CHECK BIG INTEGER number was inserted properly:
                  expect(rs2).toBeDefined();
                  expect(rs2.rows).toBeDefined();
                  expect(rs2.rows.length).toBe(1);

                  var row = rs2.rows.item(0);
                  expect(row.data1).toBe(1424174959894);
                  expect(row.test_int).toBe(1424174959894);
                  expect(row.test_num).toBe(1424174959894);
                  expect(row.test_date).toBe(1424174959894);

                  // NOTE: big number stored in field with TEXT affinity with different conversion
                  // in case of plugin (certain platforms) vs. Android/iOS WebKit Web SQL
                  if (isWebSql || isBrowser || isMac || hasMobileWKWebView)
                    expect(row.test_text).toBe("1424174959894.0"); // ([Big] number inserted as string ok)
                  else
                    expect(row.test_text).toBe("1424174959894"); // (Big integer number inserted as string ok)

                  tx.executeSql('SELECT TYPEOF(data1) AS t1, TYPEOF(test_int) AS t2, TYPEOF(test_num) AS t3, TYPEOF(test_date) AS t4, TYPEOF(test_text) AS t5 FROM tt', [], function(ignored, rs3) {
                    expect(rs3).toBeDefined();
                    expect(rs3.rows).toBeDefined();
                    expect(rs3.rows.length).toBe(1);

                    var row = rs3.rows.item(0);
                    if (isWebSql || isBrowser || isMac || hasMobileWKWebView)
                      expect(row.t1).toBe('real');
                    else
                      expect(row.t1).toBe('integer');
                    expect(row.t2).toBe('integer');
                    expect(row.t3).toBe('integer');
                    expect(row.t4).toBe('integer');
                    expect(row.t5).toBe('text');

                    // Close (plugin only) & finish:
                    (isWebSql) ? done() : db.close(done, done);
                  });

                });
              });
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('---');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + "Double precision decimal number insertion", function(done) {
          var db = openDatabase("Double-precision-number-insertion.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS tt');
            tx.executeSql('CREATE TABLE IF NOT EXISTS tt (tr REAL)', null, function(ignored1, ignored2) {
              tx.executeSql("INSERT INTO tt (tr) VALUES (?)", [123456.789], function(tx, res) {
                expect(res).toBeDefined();
                expect(res.rowsAffected).toBe(1);

                tx.executeSql("SELECT * FROM tt", [], function(tx, res) {
                  var row = res.rows.item(0);
                  expect(row.tr).toBe(123456.789); // (Decimal number inserted properly)

                  // Close (plugin only) & finish:
                  (isWebSql) ? done() : db.close(done, done);
                });
              });
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('---');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'BIG REAL INSERT value bindings', function(done) {
          var db = openDatabase("BIG-REAL-INSERT-value-bindings.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS tt');
            tx.executeSql('CREATE TABLE IF NOT EXISTS tt (data1 REAL, data2 NUMERIC, data3 INTEGER, data4 TEXT)', null, function(ignored1, ignored2) {
              tx.executeSql('INSERT INTO tt VALUES (?,?,?,?)',
                  [1234567890123.4, 1234567890123.4, 1234567890123.4, 1234567890123.4], function(tx, rs1) {
                expect(rs1).toBeDefined();
                expect(rs1.rowsAffected).toBe(1);
                expect(rs1.insertId).toBe(1);

                tx.executeSql('SELECT * FROM tt', [], function(tx, rs2) {
                  // CHECK BIG INTEGER number was inserted properly:
                  expect(rs2).toBeDefined();
                  expect(rs2.rows).toBeDefined();
                  expect(rs2.rows.length).toBe(1);

                  var row = rs2.rows.item(0);
                  expect(row.data1).toBe(1234567890123.4);
                  expect(row.data2).toBe(1234567890123.4);
                  expect(row.data3).toBe(1234567890123.4);
                  expect(row.data4).toBe('1234567890123.4');

                  tx.executeSql('SELECT TYPEOF(data1) AS t1, TYPEOF(data2) AS t2, TYPEOF(data3) AS t3, TYPEOF(data4) AS t4 FROM tt', [], function(tx, rs3) {
                    expect(rs3).toBeDefined();
                    expect(rs3.rows).toBeDefined();
                    expect(rs3.rows.length).toBe(1);

                    var row = rs3.rows.item(0);
                    expect(row.t1).toBe('real');
                    expect(row.t2).toBe('real');
                    expect(row.t3).toBe('real');
                    expect(row.t4).toBe('text');

                    // Close (plugin only) & finish:
                    (isWebSql) ? done() : db.close(done, done);
                  });

                });
              });
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('---');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + "'012012012' string INSERT value bindings", function(done) {
          // Verified working as expected
          // ref: litehelpers/Cordova-sqlite-storage#791
          var db = openDatabase('012012012-string-INSERT-value-bindings-test.db');

          var myValue = '012012012';
          var myValueAsWholeNumber = 12012012;

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS tt');
            tx.executeSql('CREATE TABLE IF NOT EXISTS tt (data1, data2 TEXT, data3 NUMERIC, data4 INTEGER, data5 REAL)', null, function(ignored1, ignored2) {
              tx.executeSql('INSERT INTO tt VALUES (?,?,?,?,?)',
                  [myValue, myValue, myValue, myValue, myValue], function(ignored, rs1) {
                expect(rs1).toBeDefined();
                expect(rs1.rowsAffected).toBe(1);
                expect(rs1.insertId).toBe(1);

                tx.executeSql('SELECT * FROM tt', [], function(ignored, rs2) {
                  expect(rs2).toBeDefined();
                  expect(rs2.rows).toBeDefined();
                  expect(rs2.rows.length).toBe(1);

                  var resultRow2 = rs2.rows.item(0);
                  expect(resultRow2.data1).toBe(myValue);
                  expect(resultRow2.data2).toBe(myValue);
                  expect(resultRow2.data3).toBe(myValueAsWholeNumber);
                  expect(resultRow2.data4).toBe(myValueAsWholeNumber);
                  expect(resultRow2.data5).toBe(myValueAsWholeNumber);

                  tx.executeSql('SELECT TYPEOF(data1) AS t1, TYPEOF(data2) AS t2, TYPEOF(data3) AS t3, TYPEOF(data4) AS t4, TYPEOF(data5) AS t5 FROM tt', [], function(ignored, rs3) {
                    expect(rs3).toBeDefined();
                    expect(rs3.rows).toBeDefined();
                    expect(rs3.rows.length).toBe(1);

                    var resultRow3 = rs3.rows.item(0);
                    expect(resultRow3.t1).toBe('text');
                    expect(resultRow3.t2).toBe('text');
                    expect(resultRow3.t3).toBe('integer');
                    expect(resultRow3.t4).toBe('integer');
                    expect(resultRow3.t5).toBe('real');

                    // Close (plugin only) & finish:
                    (isWebSql) ? done() : db.close(done, done);
                  });

                });
              });
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('---');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + "'012012.012' string INSERT value bindings", function(done) {
          // Additional test ref: litehelpers/Cordova-sqlite-storage#791
          var db = openDatabase('012012.012-string-INSERT-value-bindings-test.db');

          var myValue = '012012.012';
          var myValueAsRealNumber = 12012.012;

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS tt');
            tx.executeSql('CREATE TABLE IF NOT EXISTS tt (data1, data2 TEXT, data3 NUMERIC, data4 INTEGER, data5 REAL)', null, function(ignored1, ignored2) {
              tx.executeSql('INSERT INTO tt VALUES (?,?,?,?,?)',
                  [myValue, myValue, myValue, myValue, myValue], function(ignored, rs1) {
                expect(rs1).toBeDefined();
                expect(rs1.rowsAffected).toBe(1);
                expect(rs1.insertId).toBe(1);

                tx.executeSql('SELECT * FROM tt', [], function(ignored, rs2) {
                  expect(rs2).toBeDefined();
                  expect(rs2.rows).toBeDefined();
                  expect(rs2.rows.length).toBe(1);

                  var resultRow2 = rs2.rows.item(0);
                  expect(resultRow2.data1).toBe(myValue);
                  expect(resultRow2.data2).toBe(myValue);
                  expect(resultRow2.data3).toBe(myValueAsRealNumber);
                  expect(resultRow2.data4).toBe(myValueAsRealNumber);
                  expect(resultRow2.data5).toBe(myValueAsRealNumber);

                  tx.executeSql('SELECT TYPEOF(data1) AS t1, TYPEOF(data2) AS t2, TYPEOF(data3) AS t3, TYPEOF(data4) AS t4, TYPEOF(data5) AS t5 FROM tt', [], function(ignored, rs3) {
                    expect(rs3).toBeDefined();
                    expect(rs3.rows).toBeDefined();
                    expect(rs3.rows.length).toBe(1);

                    var resultRow3 = rs3.rows.item(0);
                    expect(resultRow3.t1).toBe('text');
                    expect(resultRow3.t2).toBe('text');
                    expect(resultRow3.t3).toBe('real');
                    expect(resultRow3.t4).toBe('real');
                    expect(resultRow3.t5).toBe('real');

                    // Close (plugin only) & finish:
                    (isWebSql) ? done() : db.close(done, done);
                  });

                });
              });
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('---');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + "executeSql parameter as array", function(done) {
          var db = openDatabase("array-parameter.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            // CREATE columns with no type affinity
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data1, data2)', null, function(ignored1, ignored2) {
              tx.executeSql("INSERT INTO test_table (data1, data2) VALUES (?,?)", ['abc', [1,2,3]], function(tx_ignored, rs1) {
                expect(rs1).toBeDefined();
                expect(rs1.rowsAffected).toBe(1);

                tx.executeSql("SELECT * FROM test_table", [], function(tx_ignored, rs2) {
                  expect(rs2).toBeDefined();
                  expect(rs2.rows).toBeDefined();
                  expect(rs2.rows.length).toBe(1);

                  var row = rs2.rows.item(0);
                  expect(row.data1).toBe('abc');
                  expect(row.data2).toBe('1,2,3');

                  // Close (plugin only) & finish:
                  (isWebSql) ? done() : db.close(done, done);
                });
              });
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('---');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + "INSERT with as 'boolean' true/false argument values [evidently stringified]", function(done) {
          var db = openDatabase('INSERT-true-false-parameter-value-bindings-test.db');

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            // create columns with no type affinity
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data1, data2)', null, function(ignored1, ignored2) {

              tx.executeSql("INSERT INTO test_table (data1, data2) VALUES (?,?)", [true, false], function(tx, rs1) {
                expect(rs1).toBeDefined();
                expect(rs1.rowsAffected).toBe(1);

                tx.executeSql("SELECT * FROM test_table", [], function(tx_ignored, rs2) {
                  expect(rs2.rows.length).toBe(1);
                  expect(rs2.rows.item(0).id).toBe(1);
                  expect(rs2.rows.item(0).data1).toBe('true');
                  expect(rs2.rows.item(0).data2).toBe('false');

                  // Close (plugin only) & finish:
                  (isWebSql) ? done() : db.close(done, done);
                });
              });
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

      describe(suiteName + 'numbered argument parameters storage tests', function() {

        it(suiteName + 'INSERT with numbered argument parameters', function(done) {
          var db = openDatabase('INSERT-with-numbered-argument-parameters-test.db');

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS MyTable');
            // create columns with no type affinity
            tx.executeSql('CREATE TABLE IF NOT EXISTS MyTable (id integer primary key, data1, data2)', null, function(ignored1, ignored2) {

              tx.executeSql("INSERT INTO MyTable (data1, data2) VALUES (?1,?2)", ['a', 1], function(tx, rs1) {
                expect(rs1).toBeDefined();
                expect(rs1.rowsAffected).toBe(1);

                tx.executeSql("SELECT * FROM MyTable", [], function(tx_ignored, rs2) {
                  expect(rs2).toBeDefined();
                  expect(rs2.rows).toBeDefined();
                  expect(rs2.rows.length).toBe(1);

                  var resultRow2 = rs2.rows.item(0);
                  expect(resultRow2).toBeDefined();
                  expect(resultRow2.id).toBe(1);
                  expect(resultRow2.data1).toBe('a');
                  expect(resultRow2.data2).toBe(1);

                  // Close (plugin only) & finish:
                  (isWebSql) ? done() : db.close(done, done);
                });
              });
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('---');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'INSERT with numbered argument parameters reversed', function(done) {
          var db = openDatabase('INSERT-with-numbered-argument-parameters-reversed-test.db');

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS MyTable');
            // create columns with no type affinity
            tx.executeSql('CREATE TABLE IF NOT EXISTS MyTable (id integer primary key, data1, data2)', null, function(ignored1, ignored2) {

              tx.executeSql("INSERT INTO MyTable (data1, data2) VALUES (?2,?1)", ['a', 1], function(tx, rs1) {
                expect(rs1).toBeDefined();
                expect(rs1.rowsAffected).toBe(1);

                tx.executeSql("SELECT * FROM MyTable", [], function(tx_ignored, rs2) {
                  expect(rs2).toBeDefined();
                  expect(rs2.rows).toBeDefined();
                  expect(rs2.rows.length).toBe(1);

                  var resultRow2 = rs2.rows.item(0);
                  expect(resultRow2).toBeDefined();
                  expect(resultRow2.id).toBe(1);
                  expect(resultRow2.data1).toBe(1);
                  expect(resultRow2.data2).toBe('a');

                  // Close (plugin only) & finish:
                  (isWebSql) ? done() : db.close(done, done);
                });
              });
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

      describe(suiteName + 'INLINE BLOB value storage tests', function() {

        it(suiteName + "INSERT inline BLOB value (X'40414243') and check stored data [TBD SELECT BLOB value ERROR EXPECTED on Windows and Android with androidDatabaseImplementation: 2 setting; with default sqlite HEX encoding: UTF-6le on Android 4.1-4.3 (WebKit) Web SQL, UTF-8 otherwise]", function(done) {
          var db = openDatabase('INSERT-inline-BLOB-value-40414243-and-check-stored-data.db');

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (data)', [], function(ignored1, ignored2) {

              tx.executeSql("INSERT INTO test_table VALUES (X'40414243')", [], function(ignored, rs1) {

                expect(rs1).toBeDefined();
                expect(rs1.rowsAffected).toBe(1);

                tx.executeSql('SELECT HEX(data) AS hexValue FROM test_table', [], function(ignored, rs2) {
                  expect(rs2).toBeDefined();
                  expect(rs2.rows).toBeDefined();
                  expect(rs2.rows.length).toBeDefined();

                  var item = rs2.rows.item(0);
                  expect(item).toBeDefined();
                  expect(item.hexValue).toBe('40414243');

                  tx.executeSql('SELECT * FROM test_table', [], function(ignored, rs3) {
                    if (!isWebSql && isWindows) expect('PLUGIN BEHAVIOR CHANGED for Windows').toBe('--');
                    if (!isWebSql && !isWindows && isAndroid && isImpl2) expect('PLUGIN BEHAVIOR CHANGED for android.database implementation').toBe('--');
                    expect(rs3).toBeDefined();
                    expect(rs3.rows).toBeDefined();
                    expect(rs3.rows.length).toBeDefined();

                    var item = rs3.rows.item(0);
                    expect(item).toBeDefined();
                    if (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent))
                      expect(item.data).toBe('䅀䍂'); // (UTF-16le)
                    else if (!isWebSql && isBrowser)
                      expect(item.data).toBeDefined(); // XXX
                    else
                      expect(item.data).toBe('@ABC'); // (UTF-8)

                    // Close (plugin only) & finish:
                    (isWebSql) ? done() : db.close(done, done);
                  }, function(ignored, error) {
                    if (!isWebSql && (isWindows || (isAndroid && isImpl2))) {
                      expect(error).toBeDefined();
                      expect(error.code).toBeDefined();
                      expect(error.message).toBeDefined();

                      expect(error.code).toBe(0);

                      if (isWindows)
                        expect(error.message).toMatch(/Unsupported column type in column 0/);
                      else
                        expect(error.message).toMatch(/unknown error.*code 0.*Unable to convert BLOB to string/);
                    } else {
                      // NOT EXPECTED:
                      expect(false).toBe(true);
                      expect(error.message).toBe('---');
                    }

                    // Close (plugin only) & finish:
                    (isWebSql) ? done() : db.close(done, done);
                  });

                });

              });

            });
          });
        }, MYTIMEOUT);

        it(suiteName + "INSERT inline BLOB value (X'FFD1FFD2') and check stored data [XXX SKIP FINAL CHECK on default Android NDK access implementation due to CRASH ISSUE; OTHER PLUGIN ISSUES REPRODUCED: missing result column data; SELECT BLOB VALUE ERROR on Android & Windows; missing result column data on iOS/macOS]", function(done) {
          var db = openDatabase('INSERT-inline-BLOB-value-FFD1FFD2-and-check-stored-data.db', '1.0', 'Demo', DEFAULT_SIZE);

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (data)', [], function(ignored1, ignored2) {

              tx.executeSql("INSERT INTO test_table VALUES (X'FFD1FFD2')", [], function(ignored, rs1) {

                expect(rs1).toBeDefined();
                expect(rs1.rowsAffected).toBe(1);

                tx.executeSql('SELECT HEX(data) AS hexValue FROM test_table', [], function(ignored, rs2) {
                  expect(rs2).toBeDefined();
                  expect(rs2.rows).toBeDefined();
                  expect(rs2.rows.length).toBeDefined();

                  var item = rs2.rows.item(0);
                  expect(item).toBeDefined();
                  expect(item.hexValue).toBe('FFD1FFD2');

                  // STOP HERE to avoid CRASH on default Android NDK access implementation:
                  if (!isWebSql && !isWindows && isAndroid && !isImpl2) return done();

                  tx.executeSql('SELECT * FROM test_table', [], function(ignored, rs3) {
                    if (!isWebSql && isWindows) expect('PLUGIN BEHAVIOR CHANGED: UNEXPECTED SUCCESS on Windows').toBe('--');
                    if (!isWebSql && isAndroid && isImpl2) expect('PLUGIN BEHAVIOR CHANGED: UNEXPECTED SUCCESS on Android with androidDatabaseImplementation: 2 setting').toBe('--');
                    expect(rs3).toBeDefined();
                    expect(rs3.rows).toBeDefined();
                    expect(rs3.rows.length).toBeDefined();

                    var item = rs3.rows.item(0);
                    expect(item).toBeDefined();

                    var mydata = item.data;

                    if (!isWebSql && isBrowser) {
                      // XXX TBD
                      // PLUGIN - browser:
                      expect(mydata).toBeDefined();
                      return done();
                    } else if (!isWebSql) {
                      // PLUGIN (iOS/macOS):
                      expect(mydata).not.toBeDefined();
                      return done();
                    } else {
                      expect(mydata).toBeDefined();
                      expect(mydata.length).toBeDefined();
                      if (!(/Android 4.[1-3]/.test(navigator.userAgent)))
                        expect(mydata.length).toBe(4);
                    }

                    // Close (plugin only) & finish:
                    (isWebSql) ? done() : db.close(done, done);
                  }, function(ignored, error) {
                    if (isWebSql) expect('UNEXPECTED ERROR ON (WebKit) Web SQL PLEASE UPDATE THIS TEST').toBe('--');
                    if (!isWebSql && !(isWindows || (isAndroid && isImpl2)))
                      expect('PLUGIN ERROR NOT EXPECTED ON THIS PLATFORM: ' + error.message).toBe('--');
                    expect(error).toBeDefined();
                    expect(error.code).toBeDefined();
                    expect(error.message).toBeDefined();

                    expect(error.code).toBe(0);

                    if (isWindows)
                      expect(error.message).toMatch(/Unsupported column type in column 0/);
                    else
                      expect(error.message).toMatch(/unknown error.*code 0.*Unable to convert BLOB to string/);

                    // Close (plugin only) & finish:
                    (isWebSql) ? done() : db.close(done, done);
                  });

                });

              });

            });
          });
        }, MYTIMEOUT);

      });

      describe(suiteName + 'parameter count mismatch tests', function() {

        it(suiteName + 'executeSql with not enough parameters (Plugin DEVIATION: does not reject such SQL statements)', function(done) {
          var db = openDatabase("not-enough-parameters.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            // CREATE columns with no type affinity
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (data1, data2)', [], function(ignored1, ignored2) {
              tx.executeSql("INSERT INTO test_table VALUES (?,?)", ['first'], function(tx, rs1) {
                // ACTUAL BEHAVIOR for plugin (Android/iOS/Windows):
                if (isWebSql) expect('RESULT NOT EXPECTED for Web SQL').toBe('--');
                expect(rs1).toBeDefined();
                expect(rs1.rowsAffected).toBe(1);

                tx.executeSql('SELECT * FROM test_table', [], function(tx, rs2) {
                  expect(rs2.rows.length).toBe(1);
                  expect(rs2.rows.item(0).data1).toBe('first');
                  expect(rs2.rows.item(0).data2).toBeNull();

                  // Close (plugin only) & finish:
                  (isWebSql) ? done() : db.close(done, done);
                });

              }, function(ignored, error) {
                // CORRECT (Web SQL):
                if (!isWebSql) expect('Plugin behavior changed, please update this test').toBe('--');

                expect(error).toBeDefined();
                expect(error.code).toBeDefined();
                expect(error.message).toBeDefined();

                // WebKit Web SQL reports correct error code (5 - SYNTAX_ERR) in this case.
                expect(error.code).toBe(5);

                // WebKit Web SQL error message (Android/iOS):
                expect(error.message).toMatch(/number of '\?'s in statement string does not match argument count/);

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });
            });
          });
        }, MYTIMEOUT);

        it(suiteName + 'executeSql with too many parameters [extra TEXT string]', function(done) {
          var db = openDatabase("too-many-parameters-extra-text-string.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            // CREATE columns with no type affinity
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data1, data2)');

          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('---');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);

          }, function() {
            db.transaction(function(tx) {
              tx.executeSql("INSERT INTO test_table (data1, data2) VALUES (?,?)", ['first', 'second', 'third'], function(ignored1, ignored2) {
                // NOT EXPECTED:
                expect(false).toBe(true);
                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);

              }, function(ignored, error) {
                // EXPECTED RESULT:
                expect(error).toBeDefined();
                expect(error.code).toBeDefined();
                expect(error.message).toBeDefined();

                // PLUGIN BROKEN: reports INCORRECT error code: 0 (SQLite.UNKNOWN_ERR)
                // WebKit Web SQL reports correct error code: 5 (SQLite.SYNTAX_ERR) in this case.
                // ref: https://www.w3.org/TR/webdatabase/#dom-sqlexception-code-syntax
                if (isWebSql)
                  expect(error.code).toBe(5);
                else
                  expect(error.code).toBe(0);

                // WebKit Web SQL vs plugin error message
                // FUTURE TBD plugin error message subject to change
                if (isWebSql)
                  expect(error.message).toMatch(/number of '\?'s in statement string does not match argument count/);
                else if (isWindows)
                  expect(error.message).toMatch(/Error 25 when binding argument to SQL query/);
                else
                  expect(error.message).toMatch(/index.*out of range/);

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });
            });
          });
        }, MYTIMEOUT);

        it(suiteName + 'executeSql with too many parameters [extra REAL value]', function(done) {
          var db = openDatabase("too-many-parameters-extra-real-value.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            // CREATE columns with no type affinity
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data1, data2)');

          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('---');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);

          }, function() {
            db.transaction(function(tx) {
              tx.executeSql("INSERT INTO test_table (data1, data2) VALUES (?,?)", ['first', 'second', 123.456], function(ignored1, ignored2) {
                // NOT EXPECTED:
                expect(false).toBe(true);
                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);

              }, function(ignored, error) {
                // EXPECTED RESULT:
                expect(error).toBeDefined();
                expect(error.code).toBeDefined();
                expect(error.message).toBeDefined();

                // PLUGIN BROKEN: reports INCORRECT error code: 0 (SQLite.UNKNOWN_ERR)
                // WebKit Web SQL reports correct error code: 5 (SQLite.SYNTAX_ERR) in this case.
                // ref: https://www.w3.org/TR/webdatabase/#dom-sqlexception-code-syntax
                if (isWebSql)
                  expect(error.code).toBe(5);
                else
                  expect(error.code).toBe(0);

                // WebKit Web SQL vs plugin error message
                // FUTURE TBD plugin error message subject to change
                if (isWebSql)
                  expect(error.message).toMatch(/number of '\?'s in statement string does not match argument count/);
                else if (isWindows)
                  expect(error.message).toMatch(/Error 25 when binding argument to SQL query/);
                else
                  expect(error.message).toMatch(/index.*out of range/);

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });
            });
          });
        }, MYTIMEOUT);

        it(suiteName + 'executeSql with too many parameters [extra INTEGER value]', function(done) {
          var db = openDatabase("too-many-parameters-extra-integer-value.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            // CREATE columns with no type affinity
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data1, data2)');

          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('---');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);

          }, function() {
            db.transaction(function(tx) {
              tx.executeSql("INSERT INTO test_table (data1, data2) VALUES (?,?)", ['first', 'second', 789], function(ignored1, ignored2) {
                // NOT EXPECTED:
                expect(false).toBe(true);
                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);

              }, function(ignored, error) {
                // EXPECTED RESULT:
                expect(error).toBeDefined();
                expect(error.code).toBeDefined();
                expect(error.message).toBeDefined();

                // PLUGIN BROKEN: reports INCORRECT error code: 0 (SQLite.UNKNOWN_ERR)
                // WebKit Web SQL reports correct error code: 5 (SQLite.SYNTAX_ERR) in this case.
                // ref: https://www.w3.org/TR/webdatabase/#dom-sqlexception-code-syntax
                if (isWebSql)
                  expect(error.code).toBe(5);
                else
                  expect(error.code).toBe(0);

                // WebKit Web SQL vs plugin error message
                // FUTURE TBD plugin error message subject to change
                if (isWebSql)
                  expect(error.message).toMatch(/number of '\?'s in statement string does not match argument count/);
                else if (isWindows)
                  expect(error.message).toMatch(/Error 25 when binding argument to SQL query/);
                else
                  expect(error.message).toMatch(/index.*out of range/);

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });
            });
          });
        }, MYTIMEOUT);

        it(suiteName + 'executeSql with too many parameters [extra NULL value]', function(done) {
          var db = openDatabase("too-many-parameters-extra-null-value.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            // CREATE columns with no type affinity
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data1, data2)');

          }, function(error) {
            expect(false).toBe(true);
            expect(error.message).toBe('---');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);

          }, function() {
            db.transaction(function(tx) {
              tx.executeSql("INSERT INTO test_table (data1, data2) VALUES (?,?)", ['first', 'second', null], function(ignored1, ignored2) {
                // NOT EXPECTED:
                expect(false).toBe(true);
                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);

              }, function(ignored, error) {
                // EXPECTED RESULT:
                expect(error).toBeDefined();
                expect(error.code).toBeDefined();
                expect(error.message).toBeDefined();

                // PLUGIN BROKEN: reports INCORRECT error code: 0 (SQLite.UNKNOWN_ERR)
                // WebKit Web SQL reports correct error code: 5 (SQLite.SYNTAX_ERR) in this case.
                // ref: https://www.w3.org/TR/webdatabase/#dom-sqlexception-code-syntax
                if (isWebSql)
                  expect(error.code).toBe(5);
                else
                  expect(error.code).toBe(0);

                // WebKit Web SQL vs plugin error message
                // FUTURE TBD plugin error message subject to change
                if (isWebSql)
                  expect(error.message).toMatch(/number of '\?'s in statement string does not match argument count/);
                else if (isWindows)
                  expect(error.message).toMatch(/Error 25 when binding argument to SQL query/);
                else
                  expect(error.message).toMatch(/index.*out of range/);

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });
            });
          });
        }, MYTIMEOUT);

      });

      describe(scenarioList[i] + ': special UNICODE column value binding test(s)', function() {

        it(suiteName + 'store multiple strings with U+0000 (same as \\0) and check ordering [default sqlite HEX encoding: UTF-6le on Windows plugin (TBD currently not tested here) & Android 4.1-4.3 (WebKit) Web SQL; UTF-8 otherwise]', function (done) {
          if (isWindows) pending('SKIP on Windows (nonsense ordering due to known truncation issue)');
          if (!isWebSql && isAndroid && !isImpl2) pending('SKIP on default Android (NDK) implementation (nonsense ordering due to known truncation issue)');

          var db = openDatabase('Store-multiple-U+0000-strings-and-check-ordering.db');

          db.transaction(function (tx) {
            tx.executeSql('DROP TABLE IF EXISTS test', [], function () {
              tx.executeSql('CREATE TABLE test (name, id)', [], function() {
                tx.executeSql('INSERT INTO test VALUES (?, "id1")', ['a\u0000cd'], function () {
                  tx.executeSql('SELECT hex(name) AS hexValue FROM test', [], function (tx_ignored, rs1) {
                    // select hex() because even the native database doesn't
                    // give the full string. it's a bug in WebKit apparently
                    var hexValue = rs1.rows.item(0).hexValue;

                    // NOTE: WebKit Web SQL on recent versions of Android & iOS
                    // seems to use follow UTF-8 encoding/decoding rules
                    // (tested elsewhere).
                    if (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent))
                      expect(hexValue.length).toBe(16);
                    else
                      expect(hexValue.length).toBe(8);

                    if (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent))
                      expect(hexValue).toBe('6100000063006400'); // (UTF-16le)
                    else
                      expect(hexValue).toBe('61006364'); // (UTF-8)

                    // Check correct ordering:
                    var least = "54key3\u0000\u0000";
                    var most = "54key3\u00006\u0000\u0000";
                    // INSERT names in reverse order:
                    var name1 = "54key3\u00004baz\u000031\u0000\u0000";
                    var name2 = "54key3\u00004bar\u000031\u0000\u0000";

                    tx.executeSql('INSERT INTO test VALUES (?, "id2")', [name1], function () {
                      tx.executeSql('INSERT INTO test VALUES (?, "id3")', [name2], function () {
                        var sql = 'SELECT id FROM test WHERE name > ? AND name < ? ORDER BY name';
                        tx.executeSql(sql, [least, most], function (tx_ignored, rs2) {
                          expect(rs2.rows.length).toBe(2);
                          expect(rs2.rows.item(0).id).toBe('id3');
                          expect(rs2.rows.item(1).id).toBe('id2');

                          // Close (plugin only) & finish:
                          (isWebSql) ? done() : db.close(done, done);
                        });
                      });
                    });

                  });
                });
              });
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('---');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'store and retrieve string with U+0000 (same as \\0) correctly [XXX HEX ENCODING ISSUE REPRODUCED on default Android NDK access implementation (Android-sqlite-connector with Android-sqlite-native-driver); TRUNCATION ISSUE REPRODUCED on iOS (WebKit) Web SQL, older versions of Android (WebKit) Web SQL, and Windows plugin; default sqlite HEX encoding: UTF-6le on Windows & Android 4.1-4.3 (WebKit) Web SQL, UTF-8 otherwise]', function (done) {
          var db = openDatabase('Store-and-retrieve-U+0000-string-test.db');

          db.transaction(function (tx) {
            tx.executeSql('DROP TABLE IF EXISTS test');
            tx.executeSql('CREATE TABLE test (name, id)', [], function() {
              tx.executeSql('INSERT INTO test VALUES (?, "id1")', ['a\u0000cd'], function () {
                tx.executeSql('SELECT HEX(name) AS hexValue FROM test', [], function (tx_ignored, rs1) {
                  var hexValue = rs1.rows.item(0).hexValue;

                  if (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent))
                    expect(hexValue).toBe('6100000063006400'); // (UTF-16le)
                  else if (isWindows)
                    expect(hexValue).toBe('6100'); // (UTF-16le with ENCODING ISSUE REPRODUCED)
                  else if (!isWebSql && isAndroid && !isImpl2)
                    expect(hexValue).toBe('61C0806364'); // XXX ENCODING ISSUE REPRODUCED on default Android NDK implementation
                  else
                    expect(hexValue).toBe('61006364'); // (UTF-8)

                  tx.executeSql('SELECT name FROM test', [], function (tx_ignored, rs) {
                    var name = rs.rows.item(0).name;

                    // TRUNCATION BUG
                    //
                    // BUG on (WebKit) Web SQL:
                    //
                    // There is a bug in WebKit and Chromium where strings are created
                    // using methods that rely on '\0' for termination instead of
                    // the specified byte length.
                    //
                    // https://bugs.webkit.org/show_bug.cgi?id=137637
                    //
                    // For now we expect this test to fail there, but when it is fixed
                    // we would like to know, so the test is coded to fail if it starts
                    // working there.
                    //
                    // UPDATE: SEEMS TO BE FIXED on newer versions of Android
                    //
                    // BUG on this plugin:
                    //
                    // TRUNCATION BUG REPRODUCED on Windows

                    if ((isWebSql && isAndroid &&
                         ((/Android 4/.test(navigator.userAgent)) ||
                          (/Android 5.0/.test(navigator.userAgent)) ||
                          (/Android 5.1/.test(navigator.userAgent) && !(/Chrome.6/.test(navigator.userAgent))) ||
                          (/Android 6/.test(navigator.userAgent) && (/Chrome.[3-4]/.test(navigator.userAgent))))) ||
                        (isWebSql && !isAndroid && !isChromeBrowser) ||
                        (!isWebSql && isBrowser) ||
                        (!isWebSql && isWindows)) {
                      expect(name.length).toBe(1);
                      expect(name).toBe('a');
                    } else {
                      expect(name.length).toBe(4);
                      expect(name).toBe('a\u0000cd');
                    }

                    // Close (plugin only) & finish:
                    (isWebSql) ? done() : db.close(done, done);
                  })
                });
              });
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('---');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        // Issue with iOS/macOS/Android
        // For reference:
        // - litehelpers/Cordova-sqlite-storage#147
        // - Apache Cordova CB-9435 (issue with cordova-ios, also affects macOS)
        // - cordova/cordova-discuss#57 (issue with cordova-android)
        it(suiteName +
            ' handles UNICODE \\u2028 line separator correctly in database', function (done) {
          if (!isWebSql && !isWindows && isAndroid) pending('SKIP for Android plugin (cordova-android 6.x BUG: cordova/cordova-discuss#57)');
          if (!isWebSql && !isWindows && !isAndroid) pending('SKIP for iOS/macOS plugin (Cordova BUG: CB-9435)');

          var db = openDatabase('UNICODE-line-separator-INSERT-test.db');

          var check1 = false;

          db.transaction(function (tx) {
            tx.executeSql('DROP TABLE IF EXISTS test', [], function () {
              tx.executeSql('CREATE TABLE test (name, id)', [], function() {
                tx.executeSql('INSERT INTO test VALUES (?, "id1")', ['hello\u2028world'], function () {
                  tx.executeSql('SELECT name FROM test', [], function (tx_ignored, rs) {
                    var name = rs.rows.item(0).name;

                    expect(name.length).toBe(11);
                    expect(name).toBe('hello\u2028world');

                    check1 = true;
                  });
                });
              });
            });

          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('---');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);

          }, function() {
            expect(check1).toBe(true);
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
