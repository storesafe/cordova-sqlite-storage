/* 'use strict'; */

var MYTIMEOUT = 12000;

var DEFAULT_SIZE = 5000000; // max to avoid popup in safari/ios

// FUTURE TODO replace in test(s):
function ok(test, desc) { expect(test).toBe(true); }
function equal(a, b, desc) { expect(a).toEqual(b); } // '=='
function strictEqual(a, b, desc) { expect(a).toBe(b); } // '==='

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

var isAndroid = /Android/.test(navigator.userAgent);
var isWP8 = /IEMobile/.test(navigator.userAgent); // Matches WP(7/8/8.1)
//var isWindows = /Windows NT/.test(navigator.userAgent); // Windows [NT] (8.1)
var isWindows = /Windows /.test(navigator.userAgent); // Windows (8.1)
//var isWindowsPC = /Windows NT/.test(navigator.userAgent); // Windows [NT] (8.1)
//var isWindowsPhone_8_1 = /Windows Phone 8.1/.test(navigator.userAgent); // Windows Phone 8.1
//var isIE = isWindows || isWP8 || isWindowsPhone_8_1;
var isIE = isWindows || isWP8;
var isWebKit = !isIE; // TBD [Android or iOS]

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

    describe(scenarioList[i] + ': extended sql tx test(s)', function() {
      var scenarioName = scenarioList[i];
      var suiteName = scenarioName + ': ';
      var isWebSql = (i === 1);
      var isOldImpl = (i === 2);

      // NOTE: MUST be defined in function scope, NOT outer scope:
      var openDatabase = function(name, ignored1, ignored2, ignored3) {
        if (isOldImpl) {
          return window.sqlitePlugin.openDatabase({
            // prevent reuse of database from default db implementation:
            name: 'i2-'+name,
            androidDatabaseImplementation: 2,
            androidLockWorkaround: 1
          });
        }
        if (isWebSql) {
          return window.openDatabase(name, "1.0", "Demo", DEFAULT_SIZE);
        } else {
          return window.sqlitePlugin.openDatabase(name, "1.0", "Demo", DEFAULT_SIZE);
        }
      }

      //describe(suiteName + 'legacy string test(s)', function() {

        test_it(suiteName + "US-ASCII String manipulation test", function() {

          var db = openDatabase("ASCII-string-test.db", "1.0", "Demo", DEFAULT_SIZE);

          ok(!!db, 'valid db object');

          stop();

          db.transaction(function(tx) {

            ok(!!tx, 'valid tx object');

            tx.executeSql("select upper('Some US-ASCII text') as uppertext", [], function(tx, res) {

              console.log("res.rows.item(0).uppertext: " + res.rows.item(0).uppertext);

              equal(res.rows.item(0).uppertext, "SOME US-ASCII TEXT", "select upper('Some US-ASCII text')");

              start(1);
            });
          });
        });

        test_it(suiteName + ' string encoding test with UNICODE \\u0000', function () {
          if (isWindows) pending('BROKEN for Windows'); // XXX
          if (isWP8) pending('BROKEN for WP(8)'); // [BUG #202] UNICODE characters not working with WP(8)
          if (isAndroid && !isWebSql && !isOldImpl) pending('BROKEN for Android (default sqlite-connector version)'); // XXX

          stop();

          var dbName = "Unicode-hex-test";
          var db = openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function (tx) {
            tx.executeSql('SELECT hex(?) AS hexvalue', ['\u0000foo'], function (tx, res) {
              console.log(suiteName + "res.rows.item(0).hexvalue: " + res.rows.item(0).hexvalue);

              var hex1 = res.rows.item(0).hexvalue;

              // varies between Chrome-like (UTF-8)
              // and Safari-like (UTF-16)
              var expected = [
                '000066006F006F00',
                '00666F6F'
              ];

              ok(expected.indexOf(hex1) !== -1, 'hex matches: ' +
                  JSON.stringify(hex1) + ' should be in ' +
                  JSON.stringify(expected));

                // ensure this matches our expectation of that database's
                // default encoding
                tx.executeSql('SELECT hex("foob") AS hexvalue', [], function (tx, res) {
                  console.log(suiteName + "res.rows.item(0).hexvalue: " + res.rows.item(0).hexvalue);

                  var hex2 = res.rows.item(0).hexvalue;

                  equal(hex1.length, hex2.length,
                      'expect same length, i.e. same global db encoding');

                  start();
              });
            });
          }, function(err) {
            ok(false, 'unexpected error: ' + err.message);
          }, function () {
          });
        });

        test_it(suiteName + "CR-LF String test", function() {
          var db = openDatabase("CR-LF-String-test.db", "1.0", "Demo", DEFAULT_SIZE);
          ok(!!db, "db object");
          stop();

          db.transaction(function(tx) {
            ok(!!tx, "tx object");
            tx.executeSql("select upper('cr\r\nlf') as uppertext", [], function(tx, res) {
              ok(res.rows.item(0).uppertext !== "CR\nLF", "CR-LF should not be converted to \\n");
              equal(res.rows.item(0).uppertext, "CR\r\nLF", "CRLF ok");
              tx.executeSql("select upper('Carriage\rReturn') as uppertext", [], function(tx, res) {
                equal(res.rows.item(0).uppertext, "CARRIAGE\rRETURN", "CR ok");
                tx.executeSql("select upper('New\nLine') as uppertext", [], function(tx, res) {
                  equal(res.rows.item(0).uppertext, "NEW\nLINE", "newline ok");
                  start();
                });
              });
            });
          });
        });

        // NOTE: the next two tests show that for iOS [BUG #147]:
        // - UNICODE \u2028 line separator from Javascript to Objective-C is working ok
        // - UNICODE \u2028 line separator from Objective-C to Javascript is BROKEN
        test_it(suiteName + "UNICODE \\u2028 line separator string to hex", function() {
          if (isWP8) pending('BROKEN for WP(8)'); // [BUG #202] UNICODE characters not working with WP(8)

          // NOTE: this test verifies that the UNICODE line separator (\u2028)
          // is seen by the sqlite implementation OK:
          var db = openDatabase("UNICODE-line-separator-string-1.db", "1.0", "Demo", DEFAULT_SIZE);

          ok(!!db, "db object");

          stop();

          db.transaction(function(tx) {

            ok(!!tx, "tx object");

            var text = 'Abcd\u20281234';
            tx.executeSql("select hex(?) as hexvalue", [text], function (tx, res) {
              var hexvalue = res.rows.item(0).hexvalue;

              // varies between Chrome-like (UTF-8)
              // and Safari-like (UTF-16)
              var expected = [
                '41626364E280A831323334',
                '410062006300640028203100320033003400'
              ];

              ok(expected.indexOf(hexvalue) !== -1, 'hex matches: ' +
                  JSON.stringify(hexvalue) + ' should be in ' +
                  JSON.stringify(expected));

              start();
            });
          });
        });

        test_it(suiteName + ' handles UNICODE \\u2028 line separator correctly [string test]', function () {

          if (isWP8) pending('BROKEN for WP(8)'); // [BUG #202] UNICODE characters not working with WP(8)
          if (!(isWebSql || isAndroid || isIE)) pending('BROKEN for iOS'); // XXX [BUG #147] (no callback received)

          // NOTE: since the above test shows the UNICODE line separator (\u2028)
          // is seen by the sqlite implementation OK, it is now concluded that
          // the failure is caused by the Objective-C JSON result encoding.
          var db = openDatabase("UNICODE-line-separator-string-2.db", "1.0", "Demo", DEFAULT_SIZE);

          ok(!!db, "db object");

          stop();

          db.transaction(function(tx) {

            ok(!!tx, "tx object");

            var text = 'Abcd\u20281234';
            tx.executeSql("select lower(?) as lowertext", [text], function (tx, res) {
              ok(!!res, "res object");
              equal(res.rows.item(0).lowertext, "abcd\u20281234", "lower case string test with UNICODE line separator");

              start();
            });
          });
        });

        test_it(suiteName + ' open same db twice with string test', function () {
          var dbName = 'open-same-db-twice-string-test.db';

          var db1 = openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE);
          var db2 = openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE);

          ok(!!db1, 'valid db1 database handle object');
          ok(!!db2, 'valid db2 database handle object');

          stop(2);

          db1.readTransaction(function(tx) {
            ok(!!tx, 'valid db1 tx object');
            tx.executeSql("select upper('first') as uppertext", [], function(tx, result) {
              ok(!!result, 'valid db1 read tx result object');
              equal(result.rows.item(0).uppertext, 'FIRST', 'check db1 read tx result');
              start(1);
            }, function(error) {
              ok(false, error);
            });
          }, function(error) {
            ok(false, error);
          });
          db2.readTransaction(function(tx) {
            ok(!!tx, 'valid db2 tx object');
            tx.executeSql("select upper('second') as uppertext", [], function(tx, result) {
              ok(!!result, 'valid db2 read tx result object');
              equal(result.rows.item(0).uppertext, 'SECOND', 'check db2 read tx result');
              start(1);
            }, function(error) {
              ok(false, error);
            });
          }, function(error) {
            ok(false, error);
          });
        });

      //});

        test_it(suiteName + 'transaction test: check rowsAffected [intermediate]', function () {
          var db = openDatabase("RowsAffected", "1.0", "Demo", DEFAULT_SIZE);

          stop();

          function test1(tx) {
            tx.executeSql('DROP TABLE IF EXISTS characters');
            tx.executeSql('CREATE TABLE IF NOT EXISTS characters (name, creator, fav tinyint(1))');
            tx.executeSql('UPDATE characters SET name = ?', ['foo'], function (tx, res) {
              equal(res.rowsAffected, 0, 'nothing updated');
              tx.executeSql('DELETE from characters WHERE name = ?', ['foo'], function (tx, res) {
                equal(res.rowsAffected, 0, 'nothing deleted');
                tx.executeSql('UPDATE characters SET name = ?', ['foo'], function (tx, res) {
                  equal(res.rowsAffected, 0, 'nothing updated');
                  tx.executeSql('DELETE from characters', [], function (tx, res) {
                    equal(res.rowsAffected, 0, 'nothing deleted');
                    test2(tx);
                  });
                });
              });
            });
          }

          function test2(tx) {
            tx.executeSql('INSERT INTO characters VALUES (?,?,?)', ['Sonic', 'Sega', 0], function (tx, res) {
              equal(res.rowsAffected, 1);
              tx.executeSql('INSERT INTO characters VALUES (?,?,?)', ['Mario', 'Nintendo', 0], function (tx, res) {
                equal(res.rowsAffected, 1);
                tx.executeSql('INSERT INTO characters VALUES (?,?,?)', ['Samus', 'Nintendo', 0], function (tx, res) {
                  equal(res.rowsAffected, 1);
                  tx.executeSql('UPDATE characters SET fav=1 WHERE creator=?', ['Nintendo'], function (tx, res) {
                    equal(res.rowsAffected, 2);
                    tx.executeSql('UPDATE characters SET fav=1 WHERE creator=?', ['Konami'], function (tx, res) {
                      equal(res.rowsAffected, 0);
                      tx.executeSql('UPDATE characters SET fav=1', [], function (tx, res) {
                        equal(res.rowsAffected, 3);
                        test3(tx);
                      });
                    });
                  });
                });
              });
            });
          }

          function test3(tx) {
            tx.executeSql('INSERT INTO characters VALUES (?,?,?)', ['Mega Man', 'Capcom', 0], function (tx, res) {
              equal(res.rowsAffected, 1);
              tx.executeSql('UPDATE characters SET fav=?, name=? WHERE creator=?;', [1, 'X', 'Capcom'], function (tx, res) {
                equal(res.rowsAffected, 1);
                tx.executeSql('UPDATE characters SET fav=? WHERE (creator=? OR creator=?)', [1, 'Capcom', 'Nintendo'], function (tx, res) {
                  equal(res.rowsAffected, 3);
                  tx.executeSql('DELETE FROM characters WHERE name="Samus";', [], function (tx, res) {
                    equal(res.rowsAffected, 1);
                    tx.executeSql('UPDATE characters SET fav=0,name=?', ["foo"], function (tx, res) {
                      equal(res.rowsAffected, 3);
                      tx.executeSql('DELETE FROM characters', [], function (tx, res) {
                        equal(res.rowsAffected, 3);

                        start();
                      });
                    });
                  });
                });
              });
            });
          }

          db.transaction(function (tx) {
            test1(tx);
          })
        });

        test_it(suiteName + 'test rowsAffected [advanced]', function () {
          var db = openDatabase("RowsAffectedAdvanced", "1.0", "Demo", DEFAULT_SIZE);

          stop();

          db.transaction(function (tx) {
            tx.executeSql('DROP TABLE IF EXISTS characters');
            tx.executeSql('CREATE TABLE IF NOT EXISTS characters (name unique, creator, fav tinyint(1))');
            tx.executeSql('DROP TABLE IF EXISTS companies');
            tx.executeSql('CREATE TABLE IF NOT EXISTS companies (name unique, fav tinyint(1))');
            // INSERT or IGNORE with the real thing:
            tx.executeSql('INSERT or IGNORE INTO characters VALUES (?,?,?)', ['Sonic', 'Sega', 0], function (tx, res) {
              expect(res.rowsAffected).toBe(1);
              tx.executeSql('INSERT INTO characters VALUES (?,?,?)', ['Tails', 'Sega', 0], function (tx, res) {
                expect(res.rowsAffected).toBe(1);
                tx.executeSql('INSERT INTO companies VALUES (?,?)', ['Sega', 1], function (tx, res) {
                  expect(res.rowsAffected).toBe(1);
                  // query with subquery
                  var sql = 'UPDATE characters ' +
                      ' SET fav=(SELECT fav FROM companies WHERE name=?)' +
                      ' WHERE creator=?';
                  tx.executeSql(sql, ['Sega', 'Sega'], function (tx, res) {
                    equal(res.rowsAffected, 2);
                    // query with 2 subqueries
                    var sql = 'UPDATE characters ' +
                        ' SET fav=(SELECT fav FROM companies WHERE name=?),' +
                        ' creator=(SELECT name FROM companies WHERE name=?)' +
                        ' WHERE creator=?';
                    tx.executeSql(sql, ['Sega', 'Sega', 'Sega'], function (tx, res) {
                      equal(res.rowsAffected, 2);
                      // knockoffs shall be ignored:
                      tx.executeSql('INSERT or IGNORE INTO characters VALUES (?,?,?)', ['Sonic', 'knockoffs4you', 0], function (tx, res) {
                        equal(res.rowsAffected, 0);

                        start();
                      }, function(tx, err) {
                        ok(false, 'knockoff should have been ignored');

                        start();
                      });
                    });
                  });
                });
              });
            });
          });
        });

      describe(suiteName + 'legacy transaction semantics test(s)', function() {

        // FUTURE TODO: fix these tests to follow the Jasmine style and move into a separate spec file:

        test_it(suiteName + "nested transaction test", function() {

          var db = openDatabase("Database2", "1.0", "Demo", DEFAULT_SIZE);

          ok(!!db, "db object");

          stop();

          db.transaction(function(tx) {
            ok(!!tx, "tx object");

            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)');

            tx.executeSql("INSERT INTO test_table (data, data_num) VALUES (?,?)", ["test", 100], function(tx, res) {
              console.log("insertId: " + res.insertId + " -- probably 1");
              console.log("rowsAffected: " + res.rowsAffected + " -- should be 1");

              expect(res).toBeDefined();
              expect(res.insertId).toBeDefined();
              expect(res.rowsAffected).toBe(1);

              tx.executeSql("select count(id) as cnt from test_table;", [], function(tx, res) {
                console.log("res.rows.length: " + res.rows.length + " -- should be 1");
                console.log("res.rows.item(0).cnt: " + res.rows.item(0).cnt + " -- should be 1");

                equal(res.rows.length, 1, "res rows length");
                equal(res.rows.item(0).cnt, 1, "select count");

                start();
              });

            });

          });

        });

        function withTestTable(func) {
          //stop();
          var db = openDatabase("Database", "1.0", "Demo", DEFAULT_SIZE);
          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)');
          }, function(err) { ok(false, err.message) }, function() {
            //start();
            func(db);
          });
        };

        test_it(suiteName + "transaction encompasses all callbacks", function() {
          stop(); // wait until callback with the final count before signalling end of test

          var db = openDatabase("tx-all-callbacks.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {

            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)');

            db.transaction(function(tx) {
              tx.executeSql('INSERT INTO test_table (data, data_num) VALUES (?,?)', ['test', 100], function(tx, res) {
                tx.executeSql("SELECT count(*) as cnt from test_table", [], function(tx, res) {
                  equal(res.rows.item(0).cnt, 1, "did insert row");
                  throw new Error("deliberately aborting transaction");
                });
              });
            }, function(error) {
              if (!isWebSql) equal(error.message, "deliberately aborting transaction");
              db.transaction(function(tx) {
                tx.executeSql("select count(*) as cnt from test_table", [], function(tx, res) {
                  equal(res.rows.item(0).cnt, 0, "final count shows we rolled back");

                  start();
                });
              });
            }, function() {
              ok(false, "transaction succeeded but wasn't supposed to");

              start();
            });
          });
        });

        test_it(suiteName + "exception from transaction handler causes failure", function() {
          stop();
          var db = openDatabase("exception-causes-failure.db", "1.0", "Demo", DEFAULT_SIZE);

          try {
            db.transaction(function(tx) {
              throw new Error("boom");
            }, function(err) {
              expect(err).toBeDefined();
              expect(err.hasOwnProperty('message')).toBe(true);

              if (!isWebSql) expect(err.message).toEqual('boom');

              start();
            }, function() {
              // transaction success callback not expected
              expect(false).toBe(true);
              start();
            });
            ok(true, "db.transaction() did not throw an error");
          } catch(err) {
            // exception not expected here
            expect(false).toBe(true);
            start();
          }
        });

        test_it(suiteName + "error handler returning true causes rollback", function() {
          stop();

          withTestTable(function(db) {
            db.transaction(function(tx) {
              tx.executeSql("insert into test_table (data, data_num) VALUES (?,?)", ['test', null], function(tx, res) {
                expect(res).toBeDefined();
                expect(res.rowsAffected).toBe(1);

                tx.executeSql("select * from bogustable", [], function(tx, res) {
                  expect(false).toBe(true);
                }, function(tx, err) {
                  expect(err.message).toBeDefined();
                  return true;
                });
              });
            }, function(err) {
              ok(!!err.message, "should report error message");

              db.transaction(function(tx) {
                tx.executeSql("select count(*) as cnt from test_table", [], function(tx, res) {
                  equal(res.rows.item(0).cnt, 0, "should have rolled back");

                  start();
                });
              });
            }, function() {
              ok(false, "not supposed to succeed");
              start();
            });
          });
        });

        // NOTE: conclusion reached with @aarononeal and @nolanlawson in litehelpers/Cordova-sqlite-storage#232
        // that the according to the spec at http://www.w3.org/TR/webdatabase/ the transaction should be
        // recovered *only* if the sql error handler returns false.
        test_it(suiteName + "error handler returning false lets transaction continue", function() {
          withTestTable(function(db) {
            stop(2);
            db.transaction(function(tx) {
              tx.executeSql("insert into test_table (data, data_num) VALUES (?,?)", ['test', null], function(tx, res) {
                start();
                expect(res).toBeDefined();
                expect(res.rowsAffected).toBe(1);
                stop();
                tx.executeSql("select * from bogustable", [], function(tx, res) {
                  start();
                  ok(false, "select statement not supposed to succeed");
                }, function(tx, err) {
                  start();
                  ok(!!err.message, "should report a valid error message");
                  return false;
                });
              });
            }, function(err) {
              ok(false, "transaction was supposed to succeed: " + err.message);
              start();
            }, function() {
              db.transaction(function(tx) {
                tx.executeSql("select count(*) as cnt from test_table", [], function(tx, res) {
                  equal(res.rows.item(0).cnt, 1, "should have commited");

                  start();
                });
              });
            });
          });
        });

        test_it(suiteName + "missing error handler causes rollback", function() {
          withTestTable(function(db) {
            stop();
            db.transaction(function(tx) {
              tx.executeSql("insert into test_table (data, data_num) VALUES (?,?)", ['test', null], function(tx, res) {
                expect(res).toBeDefined();
                //if (!isWindows) // XXX TODO
                  expect(res.rowsAffected).toEqual(1);
                tx.executeSql("select * from bogustable", [], function(tx, res) {
                  ok(false, "select statement not supposed to succeed");
                });
              });
            }, function(err) {
              ok(!!err.message, "should report a valid error message");
              db.transaction(function(tx) {
                tx.executeSql("select count(*) as cnt from test_table", [], function(tx, res) {
                  equal(res.rows.item(0).cnt, 0, "should have rolled back");

                  start();
                });
              });
            }, function() {
              ok(false, "transaction was supposed to fail");

              start();
            });
          });
        });
        
        test_it(suiteName + "executeSql fails outside transaction", function() {
          withTestTable(function(db) {
            expect(4);
            ok(!!db, "db ok");            
            var txg;
            stop(2);
            db.transaction(function(tx) {
              ok(!!tx, "tx ok");
              txg = tx;
              tx.executeSql("insert into test_table (data, data_num) VALUES (?,?)", ['test', null], function(tx, res) {
                expect(res).toBeDefined();
                //if (!isWindows) // XXX TODO
                  expect(res.rowsAffected).toEqual(1);
              });
              start(1);
            }, function(err) {
              ok(false, err);
              start(1);
            }, function() {
              // this simulates what would happen if a Promise ran on the next tick
              // and invoked an execute on the transaction
              try {
                txg.executeSql("select count(*) as cnt from test_table", [], null, null);
                ok(false, "executeSql should have thrown but continued instead");
              } catch(err) {
                ok(!!err.message, "error had valid message");
              }
              start(1);
            });            
          });
        });

        // XXX NOTE: this test does not belong in this section but uses withTestTable():
        test_it(suiteName + "all columns should be included in result set (including 'null' columns)", function() {
          withTestTable(function(db) {
            stop();
            db.transaction(function(tx) {
              tx.executeSql("insert into test_table (data, data_num) VALUES (?,?)", ["test", null], function(tx, res) {
                expect(res).toBeDefined();
                //if (!isWindows) // XXX TODO
                  expect(res.rowsAffected).toEqual(1);
                tx.executeSql("select * from test_table", [], function(tx, res) {
                  var row = res.rows.item(0);
                  //deepEqual(row, { id: 1, data: "test", data_num: null }, "all columns should be included in result set.");
                  expect(row.id).toBe(1);
                  expect(row.data).toEqual('test');
                  expect(row.data_num).toBeDefined();
                  expect(row.data_num).toBeNull();

                  start();
                });
              });
            });
          });
        });

      });

        test_it(suiteName + "number values inserted using number bindings", function() {
          stop();
          var db = openDatabase("Value-binding-test.db", "1.0", "Demo", DEFAULT_SIZE);
          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data_text1, data_text2, data_int, data_real)');
          }, function(err) { ok(false, err.message) }, function() {
            db.transaction(function(tx) {
              // create columns with no type affinity
              tx.executeSql("insert into test_table (data_text1, data_text2, data_int, data_real) VALUES (?,?,?,?)", ["314159", "3.14159", 314159, 3.14159], function(tx, res) {
                expect(res).toBeDefined();
                //if (!isWindows) // XXX TODO
                  expect(res.rowsAffected).toBe(1);

                tx.executeSql("select * from test_table", [], function(tx, res) {
                  var row = res.rows.item(0);
                  strictEqual(row.data_text1, "314159", "data_text1 should have inserted data as text");
                  if (!isWP8) // JSON issue in WP(8) version
                    strictEqual(row.data_text2, "3.14159", "data_text2 should have inserted data as text");
                  strictEqual(row.data_int, 314159, "data_int should have inserted data as an integer");
                  ok(Math.abs(row.data_real - 3.14159) < 0.000001, "data_real should have inserted data as a real");

                  start();
                });
              });
            });
          });
        });

        test_it(suiteName + "Big [integer] value bindings", function() {
          if (isWP8) pending('BROKEN for WP(8)'); // XXX [BUG #195]

          stop();

          var db = openDatabase("Big-int-bindings.db", "1.0", "Demo", DEFAULT_SIZE);
          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS tt');
            tx.executeSql('CREATE TABLE IF NOT EXISTS tt (test_date INTEGER, test_text TEXT)');
          }, function(err) { ok(false, err.message) }, function() {
            db.transaction(function(tx) {
              tx.executeSql("insert into tt (test_date, test_text) VALUES (?,?)",
                  [1424174959894, 1424174959894], function(tx, res) {
                expect(res).toBeDefined();
                expect(res.rowsAffected).toBe(1);
                tx.executeSql("select * from tt", [], function(tx, res) {
                  var row = res.rows.item(0);
                  strictEqual(row.test_date, 1424174959894, "Big integer number inserted properly");

                  // NOTE: storing big integer in TEXT field WORKING OK with WP(8) version.
                  // It is now suspected that the issue lies with the results handling.
                  // XXX Brody TODO: storing big number in TEXT field is different for Plugin vs. Web SQL!
                  if (isWebSql)
                    strictEqual(row.test_text, "1424174959894.0", "[Big] number inserted as string ok");
                  else
                    strictEqual(row.test_text, "1424174959894", "Big integer number inserted as string ok");

                  start();
                });
              });
            });
          });
        });

        test_it(suiteName + "Double precision decimal number insertion", function() {
          stop();
          var db = openDatabase("Double-precision-number-insertion.db", "1.0", "Demo", DEFAULT_SIZE);
          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS tt');
            tx.executeSql('CREATE TABLE IF NOT EXISTS tt (tr REAL)');
          }, function(err) { ok(false, err.message) }, function() {
            db.transaction(function(tx) {
              tx.executeSql("insert into tt (tr) VALUES (?)", [123456.789], function(tx, res) {
                expect(res).toBeDefined();
                //if (!isWindows) // XXX TODO
                  expect(res.rowsAffected).toBe(1);
                tx.executeSql("select * from tt", [], function(tx, res) {
                  var row = res.rows.item(0);
                  strictEqual(row.tr, 123456.789, "Decimal number inserted properly");

                  start();
                });
              });
            });
          });
        });

        test_it(suiteName + "executeSql parameter as array", function() {
          stop();
          var db = openDatabase("array-parameter.db", "1.0", "Demo", DEFAULT_SIZE);
          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data1, data2)');
          }, function(err) { ok(false, err.message) }, function() {
            db.transaction(function(tx) {
              // create columns with no type affinity
              tx.executeSql("insert into test_table (data1, data2) VALUES (?,?)", ['abc', [1,2,3]], function(tx, res) {
                expect(res).toBeDefined();
                //if (!isWindows) // XXX TODO
                  expect(res.rowsAffected).toBe(1);
                tx.executeSql("select * from test_table", [], function(tx, res) {
                  var row = res.rows.item(0);
                  strictEqual(row.data1, 'abc', "data1: string");
                  strictEqual(row.data2, '1,2,3', "data2: array should have been inserted as text (string)");

                  start();
                });
              });
            });
          });
        });

        // XXX TBD skip for now:
        // This test shows that the plugin does not throw an error when trying to serialize
        // a non-standard parameter type. Blob becomes an empty dictionary on iOS, for example,
        // and so this verifies the type is converted to a string and continues. Web SQL does
        // the same but on the JavaScript side and converts to a string like `[object Blob]`.
        xtest_it(suiteName + "INSERT Blob from ArrayBuffer (non-standard parameter type)", function() {
          if (isWindows) pending('BROKEN for Windows'); // XXX (??)
          if (isWP8) pending('BROKEN for WP(8)'); // (???)
          if (typeof Blob === "undefined") pending('Blob type does not exist');
          if (/Android [1-4]/.test(navigator.userAgent)) pending('BROKEN for Android [version 1.x-4.x]');

          // abort the test if ArrayBuffer is undefined
          // TODO: consider trying this for multiple non-standard parameter types instead
          if (typeof ArrayBuffer === "undefined") pending('ArrayBuffer type does not exist');


          var db = openDatabase("Blob-test.db", "1.0", "Demo", DEFAULT_SIZE);
          ok(!!db, "db object");
          stop(1);

          db.transaction(function(tx) {
            ok(!!tx, "tx object");
            stop(1);

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
            tx.executeSql('INSERT INTO test_table VALUES (?)', [blob], function(tx, res) {
              ok(true, "INSERT blob OK");
              start(1);
            }, function(tx, error) {
              ok(false, "INSERT blob FAILED");
              start(1);
            });
            start(1);
          }, function(err) { 
            ok(false, "transaction failure with message: " + err.message);
            start(1);
          });
        });

        test_it(suiteName + "readTransaction should throw on modification", function() {
          stop();
          var db = openDatabase("Database-readonly", "1.0", "Demo", DEFAULT_SIZE);
          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (foo text)');
            tx.executeSql('INSERT INTO test_table VALUES ("bar")');
          }, function () {}, function () {
            db.readTransaction(function (tx) {
              tx.executeSql('SELECT * from test_table', [], function (tx, res) {
                equal(res.rows.length, 1);
                equal(res.rows.item(0).foo, 'bar');
              });
            }, function () {}, function () {
              var tasks;
              var numDone = 0;
              var failed = false;
              function checkDone() {
                if (++numDone === tasks.length) {
                  start();
                }
              }
              function fail() {
                if (!failed) {
                  failed = true;
                  ok(false, 'readTransaction was supposed to fail');

                  start();
                }
              }
              // all of these should throw an error
              tasks = [
                function () {
                  db.readTransaction(function (tx) {
                    tx.executeSql('DELETE from test_table');
                  }, checkDone, fail);
                },
                function () {
                  db.readTransaction(function (tx) {
                    tx.executeSql('UPDATE test_table SET foo = "baz"');
                  }, checkDone, fail);
                },
                function () {
                  db.readTransaction(function (tx) {
                    tx.executeSql('INSERT INTO test_table VALUES ("baz")');
                  }, checkDone, fail);
                },
                function () {
                  db.readTransaction(function (tx) {
                    tx.executeSql('DROP TABLE test_table');
                  }, checkDone, fail);
                },
                function () {
                  db.readTransaction(function (tx) {
                    tx.executeSql('CREATE TABLE test_table2');
                  }, checkDone, fail);
                }
              ];
              for (var i = 0; i < tasks.length; i++) {
                tasks[i]();
              }
            });
          });
        });

        test_it(suiteName + ' test callback order', function () {
          stop();
          var db = openDatabase("Database-Callback-Order", "1.0", "Demo", DEFAULT_SIZE);
          var blocked = true;

          db.transaction(function(tx) {
            ok(!blocked, 'callback to the transaction shouldn\'t block (1)');
            tx.executeSql('SELECT 1', [], function () {
              ok(!blocked, 'callback to the transaction shouldn\'t block (2)');
            });
          }, function(err) { ok(false, err.message) }, function() {
            ok(!blocked, 'callback to the transaction shouldn\'t block (3)');

            start();
          });
          blocked = false;
        });

        test_it(suiteName + ' test simultaneous transactions', function () {
          stop();

          var db = openDatabase("Database-Simultaneous-Tx", "1.0", "Demo", DEFAULT_SIZE);

          var numDone = 0;
          function checkDone() {
            if (++numDone == 2) {
              start();
            }
          }

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test', [], function () {
              tx.executeSql('CREATE TABLE test (name);');

            });
          }, function(err) { ok(false, err.message) }, function() {
            db.transaction(function(tx) {
              tx.executeSql('INSERT INTO test VALUES ("foo")', [], function () {
                tx.executeSql('SELECT * FROM test', [], function (tx, res) {
                  equal(res.rows.length, 1, 'only one row');
                  equal(res.rows.item(0).name, 'foo');

                  tx.executeSql('SELECT * FROM bogustable'); // force rollback
                });
              });
            }, function(err) {
              ok(true, 'expected error');
              checkDone();
            }, function () {
              ok(false, 'should have rolled back');
            });

            db.transaction(function(tx) {
              tx.executeSql('INSERT INTO test VALUES ("bar")', [], function () {
                tx.executeSql('SELECT * FROM test', [], function (tx, res) {
                  equal(res.rows.length, 1, 'only one row');
                  equal(res.rows.item(0).name, 'bar');

                  tx.executeSql('SELECT * FROM bogustable'); // force rollback
                });
              });
            }, function(err) {
              ok(true, 'expected error');
              checkDone();
            }, function () {
              ok(false, 'should have rolled back');
            });
          });

        });

        test_it(suiteName + ' test simultaneous transactions, different dbs', function () {
          stop();

          var dbName = "Database-Simultaneous-Tx-Diff-DBs";

          var db = openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE);

          var numDone = 0;
          function checkDone() {
            if (++numDone == 2) {
              start();
            }
          }

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test', [], function () {
              tx.executeSql('CREATE TABLE test (name);');

            });
          }, function(err) { ok(false, err.message) }, function() {
            var db1 = openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE);
            db1.transaction(function(tx) {
              tx.executeSql('INSERT INTO test VALUES ("foo")', [], function () {
                tx.executeSql('SELECT * FROM test', [], function (tx, res) {
                  equal(res.rows.length, 1, 'only one row');
                  equal(res.rows.item(0).name, 'foo');

                  tx.executeSql('SELECT * FROM bogustable'); // force rollback
                });
              });
            }, function(err) {
              ok(true, 'expected error');
              checkDone();
            }, function () {
              ok(false, 'should have rolled back');
            });

            var db2 = openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE);

            db2.transaction(function(tx) {
              tx.executeSql('INSERT INTO test VALUES ("bar")', [], function () {
                tx.executeSql('SELECT * FROM test', [], function (tx, res) {
                  equal(res.rows.length, 1, 'only one row');
                  equal(res.rows.item(0).name, 'bar');

                  tx.executeSql('SELECT * FROM bogustable'); // force rollback
                });
              });
            }, function(err) {
              ok(true, 'expected error');
              checkDone();
            }, function () {
              ok(false, 'should have rolled back');
            });
          });

        });

        test_it(suiteName + ' stores [Unicode] string with \\u0000 correctly', function () {
          if (isWindows) pending('BROKEN on Windows'); // XXX
          if (isWP8) pending('BROKEN for WP(8)'); // [BUG #202] UNICODE characters not working with WP(8)
          if (isAndroid && !isWebSql && !isOldImpl) pending('BROKEN for Android (default sqlite-connector version)'); // XXX

          stop();

          var dbName = "Database-Unicode";
          var db = openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function (tx) {
            tx.executeSql('DROP TABLE IF EXISTS test', [], function () {
              tx.executeSql('CREATE TABLE test (name, id)', [], function() {
                tx.executeSql('INSERT INTO test VALUES (?, "id1")', ['\u0000foo'], function () {
                  tx.executeSql('SELECT hex(name) AS `hex` FROM test', [], function (tx, res) {
                    // select hex() because even the native database doesn't
                    // give the full string. it's a bug in WebKit apparently
                    var hex = res.rows.item(0).hex;

                    // varies between Chrome-like (UTF-8)
                    // and Safari-like (UTF-16)
                    var expected = [
                      '000066006F006F00',
                      '00666F6F'
                    ];
                    ok(expected.indexOf(hex) !== -1, 'hex matches: ' +
                        JSON.stringify(hex) + ' should be in ' +
                        JSON.stringify(expected));

                    // ensure this matches our expectation of that database's
                    // default encoding
                    tx.executeSql('SELECT hex("foob") AS `hex`', [], function (tx, res) {
                      var otherHex = res.rows.item(0).hex;
                      equal(hex.length, otherHex.length,
                          'expect same length, i.e. same global db encoding');

                      checkCorrectOrdering(tx);
                    });
                  })
                });
              });
            });
          }, function(err) {
            ok(false, 'unexpected error: ' + err.message);
          }, function () {
          });
        });

        function checkCorrectOrdering(tx) {
          var least = "54key3\u0000\u0000";
          var most = "54key3\u00006\u0000\u0000";
          var key1 = "54key3\u00004bar\u000031\u0000\u0000";
          var key2 = "54key3\u00004foo\u000031\u0000\u0000";

          tx.executeSql('INSERT INTO test VALUES (?, "id2")', [key1], function () {
            tx.executeSql('INSERT INTO test VALUES (?, "id3")', [key2], function () {
              var sql = 'SELECT id FROM test WHERE name > ? AND name < ? ORDER BY name';
              tx.executeSql(sql, [least, most], function (tx, res) {
                equal(res.rows.length, 2, 'should get two results');
                equal(res.rows.item(0).id, 'id2', 'correct ordering');
                equal(res.rows.item(1).id, 'id3', 'correct ordering');

                start();
              });
            });
          });
        }

        test_it(suiteName + ' returns [Unicode] string with \\u0000 correctly', function () {
          if (isWindows) pending('BROKEN on Windows'); // XXX
          if (isWP8) pending('BROKEN for WP(8)'); // [BUG #202] UNICODE characters not working with WP(8)

          stop();

          var dbName = "Database-Unicode";
          var db = openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function (tx) {
            tx.executeSql('DROP TABLE IF EXISTS test', [], function () {
              tx.executeSql('CREATE TABLE test (name, id)', [], function() {
                tx.executeSql('INSERT INTO test VALUES (?, "id1")', ['\u0000foo'], function () {
                  tx.executeSql('SELECT name FROM test', [], function (tx, res) {
                    var name = res.rows.item(0).name;

                    var expected = [
                      '\u0000foo'
                    ];

                    // There is a bug in WebKit and Chromium where strings are created
                    // using methods that rely on '\0' for termination instead of
                    // the specified byte length.
                    //
                    // https://bugs.webkit.org/show_bug.cgi?id=137637
                    //
                    // For now we expect this test to fail there, but when it is fixed
                    // we would like to know, so the test is coded to fail if it starts
                    // working there.
                    if(isWebSql) {
                        ok(expected.indexOf(name) === -1, 'field value: ' +
                            JSON.stringify(name) + ' should not be in this until a bug is fixed ' +
                            JSON.stringify(expected));

                        equal(name.length, 0, 'length of field === 0'); 
                        start();
                        return;
                    }

                    // correct result:
                    ok(expected.indexOf(name) !== -1, 'field value: ' +
                        JSON.stringify(name) + ' should be in ' +
                        JSON.stringify(expected));

                    equal(name.length, 4, 'length of field === 4');
                    start();
                  })
                });
              });
            });
          }, function(err) {
            ok(false, 'unexpected error: ' + err.message);
          }, function () {
          });
        });

        // XXX Brody NOTE: same issue is now reproduced in a string test.
        //           TBD ???: combine with other test
        // BUG #147 iOS version of plugin BROKEN:
        test_it(suiteName +
            ' handles UNICODE \\u2028 line separator correctly [in database]', function () {
          if (isWP8) pending('BROKEN for WP(8)'); // [BUG #202] UNICODE characters not working with WP(8)
          if (!(isWebSql || isAndroid || isIE)) pending('BROKEN for iOS'); // XXX [BUG #147] (no callback received)

          var dbName = "Unicode-line-separator.db";
          var db = openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE);

          stop(2);

          db.transaction(function (tx) {
            tx.executeSql('DROP TABLE IF EXISTS test', [], function () {
              tx.executeSql('CREATE TABLE test (name, id)', [], function() {
                tx.executeSql('INSERT INTO test VALUES (?, "id1")', ['hello\u2028world'], function () {
                  tx.executeSql('SELECT name FROM test', [], function (tx, res) {
                    var name = res.rows.item(0).name;

                    var expected = [
                      'hello\u2028world'
                    ];

                    ok(expected.indexOf(name) !== -1, 'field value: ' +
                       JSON.stringify(name) + ' should be in ' +
                       JSON.stringify(expected));

                    equal(name.length, 11, 'length of field should be 15');
                    start();
                  })
                });
              });
            });
          }, function(err) {
            ok(false, 'unexpected error: ' + err.message);
            start(2);
          }, function () {
            ok(true, 'transaction ok');
            start();
          });
        });

        test_it(suiteName + "syntax error", function() {
          var db = openDatabase("Syntax-error-test.db", "1.0", "Demo", DEFAULT_SIZE);
          ok(!!db, "db object");

          stop(2);
          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (data unique)');

            // This insertion has a sql syntax error
            tx.executeSql("insert into test_table (data) VALUES ", [123], function(tx) {
              ok(false, "unexpected success");
              start();
              throw new Error('abort tx');
            }, function(tx, error) {
              ok(!!error, "valid error object");

              // XXX ONLY WORKING for iOS version of plugin:
              if (isWebSql || !(isAndroid || isWindows || isWP8))
                ok(!!error['code'], "valid error.code exists");

              ok(error.hasOwnProperty('message'), "error.message exists");
              // XXX ONLY WORKING for iOS version of plugin:
              if (isWebSql || !(isAndroid || isWindows || isWP8))
                strictEqual(error.code, 5, "error.code === SQLException.SYNTAX_ERR (5)");
              //equal(error.message, "Request failed: insert into test_table (data) VALUES ,123", "error.message");
              start();

              // We want this error to fail the entire transaction
              return true;
            });
          }, function (error) {
            ok(!!error, "valid error object");
            ok(error.hasOwnProperty('message'), "error.message exists");
            start();
          });
        });

        test_it(suiteName + "constraint violation", function() {
          if (isWindows) pending('BROKEN for Windows'); // XXX TODO
          //if (isWindowsPhone_8_1) pending('BROKEN for Windows Phone 8.1'); // XXX TODO

          var db = openDatabase("Constraint-violation-test.db", "1.0", "Demo", DEFAULT_SIZE);
          ok(!!db, "db object");

          stop(2);
          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (data unique)');

            tx.executeSql("insert into test_table (data) VALUES (?)", [123], null, function(tx, error) {
              ok(false, error.message);
            });

            // This insertion will violate the unique constraint
            tx.executeSql("insert into test_table (data) VALUES (?)", [123], function(tx) {
              ok(false, "unexpected success");
              ok(!!res['rowsAffected'] || !(res.rowsAffected >= 1), "should not have positive rowsAffected");
              start();
              throw new Error('abort tx');
            }, function(tx, error) {
              ok(!!error, "valid error object");

              // XXX ONLY WORKING for iOS version of plugin:
              if (isWebSql || !(isAndroid || isWindows || isWP8))
                ok(!!error['code'], "valid error.code exists");

              ok(error.hasOwnProperty('message'), "error.message exists");
              //strictEqual(error.code, 6, "error.code === SQLException.CONSTRAINT_ERR (6)");
              //equal(error.message, "Request failed: insert into test_table (data) VALUES (?),123", "error.message");
              start();

              // We want this error to fail the entire transaction
              return true;
            });
          }, function(error) {
            ok(!!error, "valid error object");
            ok(error.hasOwnProperty('message'), "error.message exists");
            start();
          });
        });

        test_it(suiteName + ' can open two databases at the same time', function () {
          // create databases and tables
          var db1 = openDatabase("DB1", "1.0", "Demo", DEFAULT_SIZE);
          db1.transaction(function (tx1) {
            tx1.executeSql('CREATE TABLE IF NOT EXISTS test1 (x int)');
          });
          

          var db2 = openDatabase("DB2", "1.0", "Demo", DEFAULT_SIZE);
          db2.transaction(function (tx2) {
            tx2.executeSql('CREATE TABLE IF NOT EXISTS test2 (x int)');
          });

          // two databases that perform two queries and one commit each, then repeat
          stop(12);

          // create overlapping transactions
          db1.transaction(function (tx1) {
            db2.transaction(function (tx2) {

              tx2.executeSql('INSERT INTO test2 VALUES (2)', [], function (tx, result) {
                ok(true, 'inserted into second database');
                start(1);
              });
              tx2.executeSql('SELECT * from test2', [], function (tx, result) {
                equal(result.rows.item(0).x, 2, 'selected from second database');
                start(1);
              });
            }, function (error) {
              ok(false, 'transaction 2 failed ' + error);
              start(1);
            }, function () {
              ok(true, 'transaction 2 committed');
              start(1);
            });

            tx1.executeSql('INSERT INTO test1 VALUES (1)', [], function (tx, result) {
              ok(true, 'inserted into first database');
              start(1);
            });

            tx1.executeSql('SELECT * from test1', [], function (tx, result) {
              equal(result.rows.item(0).x, 1, 'selected from first database');
              start(1);
            });
          }, function (error) {
            ok(false, 'transaction 1 failed ' + error);
            start(1);
          }, function () {
            ok(true, 'transaction 1 committed');
            start(1);
          });

          // now that the databases are truly open, do it again!
          db1.transaction(function (tx1) {
            db2.transaction(function (tx2) {

              tx2.executeSql('INSERT INTO test2 VALUES (2)', [], function (tx, result) {
                ok(true, 'inserted into second database');
                start(1);
              });
              tx2.executeSql('SELECT * from test2', [], function (tx, result) {
                equal(result.rows.item(0).x, 2, 'selected from second database');
                start(1);
              });
            }, function (error) {
              ok(false, 'transaction 2 failed ' + error);
              start(1);
            }, function () {
              ok(true, 'transaction 2 committed');
              start(1);
            });

            tx1.executeSql('INSERT INTO test1 VALUES (1)', [], function (tx, result) {
              ok(true, 'inserted into first database');
              start(1);
            });

            tx1.executeSql('SELECT * from test1', [], function (tx, result) {
              equal(result.rows.item(0).x, 1, 'selected from first database');
              start(1);
            });
          }, function (error) {
            ok(false, 'transaction 1 failed ' + error);
            start(1);
          }, function () {
            ok(true, 'transaction 1 committed');
            start(1);
          });
        });

        test_it(suiteName + ' same database file with separate writer/reader db handles', function () {
          var dbname = 'writer-reader-test.db';
          var dbw = openDatabase(dbname, "1.0", "Demo", DEFAULT_SIZE);
          var dbr = openDatabase(dbname, "1.0", "Demo", DEFAULT_SIZE);

          stop(1);

          dbw.transaction(function (tx) {
            tx.executeSql('DROP TABLE IF EXISTS tt');
            tx.executeSql('CREATE TABLE IF NOT EXISTS tt (test_data)');
            tx.executeSql('INSERT INTO tt VALUES (?)', ['My-test-data']);
          }, function(error) {
            console.log("ERROR: " + error.message);
            ok(false, error.message);
            start(1);
          }, function() {
            dbr.readTransaction(function (tx) {
              tx.executeSql('SELECT test_data from tt', [], function (tx, result) {
                equal(result.rows.item(0).test_data, 'My-test-data', 'read data from reader handle');
                start(1);
              });
            }, function(error) {
              console.log("ERROR: " + error.message);
              ok(false, error.message);
              start(1);
            });
          });
        });

        test_it(suiteName + ' same database file with multiple writer db handles', function () {
          var dbname = 'multi-writer-test.db';
          var dbw1 = openDatabase(dbname, "1.0", "Demo", DEFAULT_SIZE);
          var dbw2 = openDatabase(dbname, "1.0", "Demo", DEFAULT_SIZE);
          var dbr = openDatabase(dbname, "1.0", "Demo", DEFAULT_SIZE);

          stop(1);

          dbw1.transaction(function (tx) {
            tx.executeSql('DROP TABLE IF EXISTS tt');
            tx.executeSql('CREATE TABLE IF NOT EXISTS tt (test_data)');
          }, function(error) {
            console.log("ERROR: " + error.message);
            ok(false, error.message);
            start(1);
          }, function() {
            dbw2.transaction(function (tx) {
              tx.executeSql('INSERT INTO tt VALUES (?)', ['My-test-data']);
            }, function(error) {
              console.log("ERROR: " + error.message);
              ok(false, error.message);
              start(1);
            }, function() {
              dbr.readTransaction(function (tx) {
                tx.executeSql('SELECT test_data from tt', [], function (tx, result) {
                  equal(result.rows.item(0).test_data, 'My-test-data', 'read data from reader handle');
                  start(1);
                });
              }, function(error) {
                console.log("ERROR: " + error.message);
                ok(false, error.message);
                start(1);
              });
            });
          });
        });

        test_it(suiteName + 'Multiple updates with key', function () {
          var db = openDatabase("MultipleUpdatesWithKey", "1.0",
"Demo", DEFAULT_SIZE);

          stop();

          db.transaction(function (tx) {
            tx.executeSql('DROP TABLE IF EXISTS Task');
            tx.executeSql('CREATE TABLE IF NOT EXISTS Task (id primary key, subject)');
            tx.executeSql('INSERT INTO Task VALUES (?,?)', ['928238b3-a227-418f-aa15-12bb1943c1f2', 'test1']);
            tx.executeSql('INSERT INTO Task VALUES (?,?)', ['511e3fb7-5aed-4c1a-b1b7-96bf9c5012e2', 'test2']);

            tx.executeSql('UPDATE Task SET subject="Send reminder", id="928238b3-a227-418f-aa15-12bb1943c1f2" WHERE id = "928238b3-a227-418f-aa15-12bb1943c1f2"', [], function(tx, res) {
              expect(res).toBeDefined();
              if (!isWindows) // XXX TODO
                expect(res.rowsAffected).toEqual(1);
            }, function (error) {
              ok(false, '1st update failed ' + error);
            });

            tx.executeSql('UPDATE Task SET subject="Task", id="511e3fb7-5aed-4c1a-b1b7-96bf9c5012e2" WHERE id = "511e3fb7-5aed-4c1a-b1b7-96bf9c5012e2"', [], function(tx, res) {
              //if (!isWindows) // XXX TODO
              expect(res.rowsAffected).toEqual(1);
            }, function (error) {
              ok(false, '2nd update failed ' + error);
            });
          }, function (error) {
            ok(false, 'transaction failed ' + error);
            start(1);
          }, function () {
            ok(true, 'transaction committed ok');
            start(1);
          });
        });

    });
  }

  describe('Plugin: plugin-specific tx test(s)', function() {

    var scenarioList = [
      isAndroid ? 'Plugin-implementation-default' : 'Plugin',
      'Plugin-implementation-2'
    ];

    var scenarioCount = isAndroid ? 2 : 1;

    for (var i=0; i<scenarioCount; ++i) {

      describe(scenarioList[i] + ': plugin-specific sql test(s)', function() {
        var scenarioName = scenarioList[i];
        var suiteName = scenarioName + ': ';
        var isOldAndroidImpl = (i === 1);

        // NOTE: MUST be defined in function scope, NOT outer scope:
        var openDatabase = function(first, second, third, fourth, fifth, sixth) {
          if (!isOldAndroidImpl) {
            return window.sqlitePlugin.openDatabase(first, second, third, fourth, fifth, sixth);
          }

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

          dbopts = {
            name: 'i2-'+dbname,
            androidDatabaseImplementation: 2,
            androidLockWorkaround: 1
          };

          return window.sqlitePlugin.openDatabase(dbopts, okcb, errorcb);
        }

        test_it(suiteName + "DB String result test", function() {
          // NOTE: this test checks that for db.executeSql(), the result callback is
          // called exactly once, with the proper result:
          var db = openDatabase("DB-String-result-test.db", "1.0", "Demo", DEFAULT_SIZE);

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
        });

        test_it(suiteName + "PRAGMAs and multiple databases", function() {
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
