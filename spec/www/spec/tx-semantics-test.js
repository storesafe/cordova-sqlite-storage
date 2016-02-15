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

    describe(scenarioList[i] + ': tx semantics test(s)', function() {
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

      describe(suiteName + 'transaction callback semantics test(s)', function() {

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

    });
  }

}

if (window.hasBrowser) mytests();
else exports.defineAutoTests = mytests;

/* vim: set expandtab : */
