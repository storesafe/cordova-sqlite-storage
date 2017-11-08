/* 'use strict'; */

var MYTIMEOUT = 12000;

var DEFAULT_SIZE = 5000000; // max to avoid popup in safari/ios

var isWP8 = /IEMobile/.test(navigator.userAgent); // Matches WP(7/8/8.1)
var isWindows = /Windows /.test(navigator.userAgent); // Windows 8.1/Windows Phone 8.1/Windows 10
var isAndroid = !isWindows && /Android/.test(navigator.userAgent);
var isMac = /Macintosh/.test(navigator.userAgent);
var isWKWebView = !isWindows && !isAndroid && !isWP8 && !isMac && !!window.webkit && !!window.webkit.messageHandlers;

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

var scenarioCount = (!!window.hasWebKitBrowser) ? (isAndroid ? 3 : 2) : 1;

var mytests = function() {

  for (var i=0; i<scenarioCount; ++i) {

    describe(scenarioList[i] + ': tx stored value bindings test(s)', function() {
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

        it(suiteName + 'INSERT US-ASCII TEXT string ("Test 123"), SELECT the data, check, and check HEX value', function(done) {
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
                    if (isWindows)
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

        it(suiteName + 'INSERT TEXT string with é (UTF-8 2 octets), SELECT the data, check, and check HEX value [UTF-16le on Windows]', function(done) {
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
                    if (isWindows)
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

        it(suiteName + 'INSERT TEXT string with € (UTF-8 3 octets), SELECT the data, check, and check HEX value [UTF-16le on Windows]', function(done) {
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
                    if (isWindows)
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

                  if (isWebSql && isAndroid)
                    expect(row.data1).toBe('undefined');
                  else
                    expect(row.data1).toBeNull();
                  expect(row.data2).toBe('test-string');

                  tx.executeSql('SELECT TYPEOF(data1) AS t1, TYPEOF(data2) AS t2 FROM test_table', null, function(ignored, rs3) {
                    expect(rs3).toBeDefined();
                    expect(rs3.rows).toBeDefined();
                    expect(rs3.rows.length).toBe(1);
                    if (isWebSql && isAndroid)
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

                  if (isWebSql || isMac || isWKWebView)
                    expect(row.data5).toBe('42.0');
                  else
                    expect(row.data5).toBe('42');

                  tx.executeSql('SELECT TYPEOF(data1) AS t1, TYPEOF(data2) AS t2, TYPEOF(data3) AS t3, TYPEOF(data4) AS t4, TYPEOF(data5) AS t5 FROM tt', [], function(ignored, rs3) {
                    expect(rs3).toBeDefined();
                    expect(rs3.rows).toBeDefined();
                    expect(rs3.rows.length).toBe(1);

                    var row = rs3.rows.item(0);
                    if (isWebSql || isMac || isWKWebView)
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
          if (isWP8) pending('SKIP for WP8'); // SKIP for now
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

                  if (!isWebSql && !isWindows) {
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
          if (isWP8) pending('SKIP for WP8'); // SKIP for now
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

                  if (!isWebSql && !isWindows) {
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

        // NOTE: emojis and other 4-octet UTF-8 characters apparently not stored
        // properly by Android-sqlite-connector ref: litehelpers/Cordova-sqlite-storage#564
        it(suiteName + 'INSERT TEXT string with emoji [\\u1F603 SMILING FACE (MOUTH OPEN)], SELECT the data, check, and check HEX [UTF-16le on Windows; HEX encoding BUG on Android-sqlite-connector]' , function(done) {
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

                    // STOP HERE [HEX encoding BUG] for Android-sqlite-connector:
                    if (!isWebSql && !isWindows && isAndroid && !isImpl2) return done();

                    if (isWindows)
                      expect(rs3.rows.item(0).hexvalue).toBe('40003DD803DE2100'); // (UTF-16le)
                    else if (!isWebSql && isAndroid && !isImpl2)
                      expect(rs3.rows.item(0).hexvalue).toBe('--'); // (UTF-8)
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

                  if (!isWP8) // JSON issue in WP(8) version
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
                  if (isWebSql || isMac || isWKWebView)
                    expect(row.test_text).toBe("1424174959894.0"); // ([Big] number inserted as string ok)
                  else
                    expect(row.test_text).toBe("1424174959894"); // (Big integer number inserted as string ok)

                  tx.executeSql('SELECT TYPEOF(data1) AS t1, TYPEOF(test_int) AS t2, TYPEOF(test_num) AS t3, TYPEOF(test_date) AS t4, TYPEOF(test_text) AS t5 FROM tt', [], function(ignored, rs3) {
                    expect(rs3).toBeDefined();
                    expect(rs3.rows).toBeDefined();
                    expect(rs3.rows.length).toBe(1);

                    var row = rs3.rows.item(0);
                    if (isWebSql || isMac || isWKWebView)
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

        it(suiteName + "executeSql parameter as 'boolean' true/false values (apparently stringified)", function(done) {
          var db = openDatabase("array-parameter.db", "1.0", "Demo", DEFAULT_SIZE);

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

        it(suiteName + "INSERT inline BLOB value (X'40414243') and check stored data [SELECT BLOB value ISSUE with androidDatabaseImplementation: 2 & Windows/WP8]", function(done) {
          var db = openDatabase('INSERT-inline-BLOB-value-and-check-stored-data.db', '1.0', 'Demo', DEFAULT_SIZE);

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
                    if (!isWebSql && isAndroid && isImpl2) expect('Behavior changed please update this test').toBe('--');
                    expect(rs3).toBeDefined();
                    expect(rs3.rows).toBeDefined();
                    expect(rs3.rows.length).toBeDefined();

                    var item = rs3.rows.item(0);
                    expect(item).toBeDefined();
                    expect(item.data).toBe('@ABC');

                    // Close (plugin only) & finish:
                    (isWebSql) ? done() : db.close(done, done);
                  }, function(ignored, error) {
                    if (!isWebSql && (isWindows || isWP8 || (isAndroid && isImpl2))) {
                      expect(error).toBeDefined();
                      expect(error.code).toBeDefined();
                      expect(error.message).toBeDefined();

                      expect(error.code).toBe(0);

                      if (isWP8)
                        expect(true).toBe(true); // SKIP for now
                      else if (isWindows)
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

        it(suiteName + "INSERT inline BLOB value (X'FFD1FFD2') and check stored data [Plugin BROKEN: missing result column data; SELECT BLOB value ISSUE with Android/Windows/WP8]", function(done) {
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

                  // STOP here in case of Android:
                  if (!isWindows && isAndroid) return done();

                  tx.executeSql('SELECT * FROM test_table', [], function(ignored, rs3) {
                    if (!isWebSql && isAndroid && isImpl2) expect('Behavior changed please update this test').toBe('--');
                    expect(rs3).toBeDefined();
                    expect(rs3.rows).toBeDefined();
                    expect(rs3.rows.length).toBeDefined();

                    var item = rs3.rows.item(0);
                    expect(item).toBeDefined();

                    var mydata = item.data;

                    if (!isWebSql) {
                      // PLUGIN (iOS/macOS):
                      expect(mydata).not.toBeDefined();
                      return done();
                    } else {
                      expect(mydata).toBeDefined();
                      expect(mydata.length).toBe(4);
                    }

                    // Close (plugin only) & finish:
                    (isWebSql) ? done() : db.close(done, done);
                  }, function(ignored, error) {
                    if (!isWebSql && (isWindows || isWP8 || (isAndroid && isImpl2))) {
                      expect(error).toBeDefined();
                      expect(error.code).toBeDefined();
                      expect(error.message).toBeDefined();

                      expect(error.code).toBe(0);

                      if (isWP8)
                        expect(true).toBe(true); // SKIP for now
                      else if (isWindows)
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
                else if (isWP8)
                  expect(true).toBe(true); // SKIP for now
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
                else if (isWP8)
                  expect(true).toBe(true); // SKIP for now
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
                else if (isWP8)
                  expect(true).toBe(true); // SKIP for now
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
          if (isWP8) pending('SKIP for WP8'); // TBD BROKEN on WP8

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

        it(suiteName + ' stores [Unicode] string with \\u0000 (same as \\0) correctly [HEX encoding check BROKEN for Android-sqlite-connector]', function (done) {
          if (isWP8) pending('BROKEN on WP(8)'); // [BUG #202] UNICODE characters not working with WP(8)
          if (isWindows) pending('BROKEN on Windows'); // TBD (truncates on Windows)
          // XXX TBD ???:
          if (!isWebSql && !isWindows && isAndroid && !isImpl2) pending('BROKEN on Android-sqlite-connector implementation)');

          var db = openDatabase('UNICODE-store-u0000-test.db');

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
                    expect(hexValue.length).toBe(8);
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

        it(suiteName + ' returns [Unicode] string with \\u0000 (same as \\0) correctly [BROKEN: TRUNCATES on Windows]', function (done) {
          if (isWP8) pending('BROKEN on WP(8)'); // [BUG #202] UNICODE characters not working with WP(8)
          if (isWindows) pending('BROKEN on Windows'); // XXX
          // if (isWebSql && isAndroid) pending('SKIP on Android Web SQL'); // XXX TBD INCONSISTENT RESULTS Android 4 vs 5

          var db = openDatabase('UNICODE-retrieve-u0000-test.db');

          db.transaction(function (tx) {
            tx.executeSql('DROP TABLE IF EXISTS test', [], function () {
              tx.executeSql('CREATE TABLE test (name, id)', [], function() {
                tx.executeSql('INSERT INTO test VALUES (?, "id1")', ['a\u0000cd'], function () {
                  tx.executeSql('SELECT name FROM test', [], function (tx_ignored, rs) {
                    var name = rs.rows.item(0).name;

                    // There is a bug in WebKit and Chromium where strings are created
                    // using methods that rely on '\0' for termination instead of
                    // the specified byte length.
                    //
                    // https://bugs.webkit.org/show_bug.cgi?id=137637
                    //
                    // For now we expect this test to fail there, but when it is fixed
                    // we would like to know, so the test is coded to fail if it starts
                    // working there.

                    if (isWindows || (isWebSql && !(/Android [5-9]/.test(navigator.userAgent)))) {
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
          if (isWP8) pending('BROKEN on WP(8)'); // [BUG #202] UNICODE characters not working with WP(8)
          if (!isWebSql && !isWindows && isAndroid) pending('SKIP for Android plugin (cordova-android 6.x BUG: cordova/cordova-discuss#57)');
          if (!isWebSql && !isWindows && !isAndroid && !isWP8) pending('SKIP for iOS/macOS plugin (Cordova BUG: CB-9435)');

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
