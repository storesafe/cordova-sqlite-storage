/* 'use strict'; */

var MYTIMEOUT = 12000;

var DEFAULT_SIZE = 5000000; // max to avoid popup in safari/ios

// FUTURE TODO replace in test(s):
function ok(test, desc) { expect(test).toBe(true); }
function equal(a, b, desc) { expect(a).toEqual(b); } // '=='
function strictEqual(a, b, desc) { expect(a).toBe(b); } // '==='

var isAndroid = /Android/.test(navigator.userAgent);
var isWindows = /Windows NT/.test(navigator.userAgent); // Windows [NT] (8.1)
var isWP8 = /IEMobile/.test(navigator.userAgent); // WP(8)
// XXX FUTURE:
//var isWindowsPhone = /Windows Phone 8.1/.test(navigator.userAgent); // Windows [NT] (8.1)
var isIE = isWindows || isWP8;
var isWebKit = !isIE; // TBD [Android or iOS]

var scenarioList = [ isAndroid ? 'Plugin-sqlite4java' : 'Plugin', 'HTML5', 'Plugin-android.database' ];

var scenarioCount = isAndroid ? 3 : (isIE ? 1 : 2);

describe('check startup', function() {

  it('receives deviceready event', function(done) {
    expect(true).toBe(true);
    document.addEventListener("deviceready", function() { done(); });
  }, MYTIMEOUT);

  it('has openDatabase', function() {
    if (isWebKit) expect(window.openDatabase).toBeDefined();
    expect(window.sqlitePlugin).toBeDefined();
    expect(window.sqlitePlugin.openDatabase).toBeDefined();
  });
});

describe('simple tests', function() {

  for (var i=0; i<scenarioCount; ++i) {

    describe(scenarioList[i] + ': simple test(s)', function() {
      var scenarioName = scenarioList[i];
      var suiteName = scenarioName + ': ';
      var isWebSql = (i === 1);
      var isOldImpl = (i === 2);

      // NOTE: MUST be defined in function scope, NOT outer scope:
      var openDatabase = function(name, ignored1, ignored2, ignored3) {
        if (isOldImpl) {
          return window.sqlitePlugin.openDatabase({name: name, androidDatabaseImplementation: 2});
        }
        if (isWebSql) {
          return window.openDatabase(name, "1.0", "Demo", DEFAULT_SIZE);
        } else {
          return window.sqlitePlugin.openDatabase(name, "1.0", "Demo", DEFAULT_SIZE);
        }
      }

      it(suiteName + "US-ASCII String manipulation test",
        function(done) {
          var db = openDatabase("ASCII-string-test.db", "1.0", "Demo", DEFAULT_SIZE);

          expect(db).toBeDefined()

          db.transaction(function(tx) {

            expect(tx).toBeDefined()

            tx.executeSql("select upper('Some US-ASCII text') as uppertext", [], function(tx, res) {
              console.log("res.rows.item(0).uppertext: " + res.rows.item(0).uppertext);
              expect(res.rows.item(0).uppertext).toEqual("SOME US-ASCII TEXT");

              done();
            });
          });
        }, MYTIMEOUT);

      // Only test ICU-UNICODE with Android 5.0(+):
      if (/Android [5-9]/.test(navigator.userAgent))
        it(suiteName + "ICU-UNICODE string manipulation test", function(done) {
          if ((!isWebSql) && isAndroid) pending('BROKEN for Android version of plugin [with sqlite4java]');

          var db = openDatabase("UNICODE-string-test.db", "1.0", "Demo", DEFAULT_SIZE);

          expect(db).toBeDefined()

          db.transaction(function(tx) {

            expect(tx).toBeDefined()

            // 'Some Cyrillic text'
            tx.executeSql("select UPPER('Какой-то кириллический текст') as uppertext", [], function (tx, res) {
              console.log("res.rows.item(0).uppertext: " + res.rows.item(0).uppertext);
              expect(res.rows.item(0).uppertext).toEqual("КАКОЙ-ТО КИРИЛЛИЧЕСКИЙ ТЕКСТ");

              done();
            });
          });
        });

        it(suiteName + 'Simple INSERT test: check insertId & rowsAffected in result', function(done) {

          var db = openDatabase("INSERT-test.db", "1.0", "Demo", DEFAULT_SIZE);

          ok(!!db, "db object");

          db.transaction(function(tx) {
            ok(!!tx, "tx object");

            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)');

            tx.executeSql("INSERT INTO test_table (data, data_num) VALUES (?,?)", ["test", 100], function(tx, res) {
              console.log("insertId: " + res.insertId + " -- probably 1");
              console.log("rowsAffected: " + res.rowsAffected + " -- should be 1");

              ok(!!res.insertId, "Valid res.insertId");
              equal(res.rowsAffected, 1, "res rows affected");

              done();
            });

          });
        }, MYTIMEOUT);

      it(suiteName + "db transaction test",
        function(done) {
          var db = openDatabase("db-trx-test.db", "1.0", "Demo", DEFAULT_SIZE);

          ok(!!db, "db object");

          var check = 0;

          db.transaction(function(tx) {

            ok(!!tx, "tx object");

            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)');

            tx.executeSql("INSERT INTO test_table (data, data_num) VALUES (?,?)", ["test", 100], function(tx, res) {
              expect(tx).toBeDefined();
              expect(res).toBeDefined();

              console.log("insertId: " + res.insertId + " -- probably 1");
              console.log("rowsAffected: " + res.rowsAffected + " -- should be 1");

              expect(res.insertId).toBeDefined();
              expect(res.rowsAffected).toBe(1);

              db.transaction(function(tx) {
                ok(!!tx, "second tx object");

                tx.executeSql("SELECT count(id) as cnt from test_table;", [], function(tx, res) {
                  ++check;

                  console.log("res.rows.length: " + res.rows.length + " -- should be 1");
                  console.log("res.rows.item(0).cnt: " + res.rows.item(0).cnt + " -- should be 1");

                  equal(res.rows.length, 1, "res rows length");
                  equal(res.rows.item(0).cnt, 1, "select count");
                });

                tx.executeSql("SELECT data_num from test_table;", [], function(tx, res) {
                  ++check;

                  equal(res.rows.length, 1, "SELECT res rows length");
                  equal(res.rows.item(0).data_num, 100, "SELECT data_num");
                });

                tx.executeSql("UPDATE test_table SET data_num = ? WHERE data_num = 100", [101], function(tx, res) {
                  ++check;

                  console.log("UPDATE rowsAffected: " + res.rowsAffected + " -- should be 1");

                  expect(res.rowsAffected).toBe(1);
                });

                tx.executeSql("SELECT data_num from test_table;", [], function(tx, res) {
                  ++check;

                  equal(res.rows.length, 1, "SELECT res rows length");
                  equal(res.rows.item(0).data_num, 101, "SELECT data_num");
                });

                tx.executeSql("DELETE FROM test_table WHERE data LIKE 'tes%'", [], function(tx, res) {
                  ++check;

                  console.log("DELETE rowsAffected: " + res.rowsAffected + " -- should be 1");

                  expect(res.rowsAffected).toBe(1);
                });

                tx.executeSql("SELECT data_num from test_table;", [], function(tx, res) {
                  ++check;

                  equal(res.rows.length, 0, "SELECT res rows length");
                });

              }, function(e) {
                console.log("ERROR: " + e.message);
                expect(false);
              }, function() {
                console.log("second tx ok success cb");
                expect(check).toBe(6);

                done();
              });

            }, function(e) {
              console.log("ERROR: " + e.message);
              expect(false);
            });
          }, function(e) {
            console.log("ERROR: " + e.message);
            expect(false);
          }, function() {
            console.log("tx success cb");
          });

        }, MYTIMEOUT);

      it(suiteName + "number values inserted using number bindings",
        function(done) {
          var db = openDatabase("Value-binding-test.db", "1.0", "Demo", DEFAULT_SIZE);
          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data_text1, data_text2, data_int, data_real)');
          }, function(err) { ok(false, err.message) }, function() {
            db.transaction(function(tx) {
              // create columns with no type affinity
              tx.executeSql("insert into test_table (data_text1, data_text2, data_int, data_real) VALUES (?,?,?,?)", ["314159", "3.14159", 314159, 3.14159], function(tx, res) {
                expect(res.rowsAffected).toBe(1);
                tx.executeSql("select * from test_table", [], function(tx, res) {
                  var row = res.rows.item(0);
                  strictEqual(row.data_text1, "314159", "data_text1 should have inserted data as text");
                  if (!isWP8) // JSON issue in WP(8) version
                    strictEqual(row.data_text2, "3.14159", "data_text2 should have inserted data as text");
                  strictEqual(row.data_int, 314159, "data_int should have inserted data as an integer");
                  ok(Math.abs(row.data_real - 3.14159) < 0.000001, "data_real should have inserted data as a real");

                  done();
                });
              });
            });
          });
        }, MYTIMEOUT);

    });
  };
});

/* vim: set expandtab : */
