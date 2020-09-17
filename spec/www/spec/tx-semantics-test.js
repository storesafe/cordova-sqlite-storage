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
// the default Android implementation and system database provider,
// this test script will also apply the androidLockWorkaround: 1 option
// in case of androidDatabaseProvider: 'system'.
var scenarioList = [
  isAndroid ? 'Plugin-implementation-default' : 'Plugin',
  'HTML5',
  'Plugin-system-database-provider'
];

var scenarioCount = (!!window.hasWebKitWebSQL) ? (isAndroid ? 3 : 2) : 1;

function logSuccess(message) { console.log('OK - ' + message); }
function logFailure(message) { console.log('FAILED - ' + message); }

var mytests = function() {

  for (var i=0; i<scenarioCount; ++i) {

    describe(scenarioList[i] + ': tx semantics test(s)', function() {
      var scenarioName = scenarioList[i];
      var suiteName = scenarioName + ': ';
      var isWebSql = (i === 1);
      var isSystemDatabaseProvider = (i === 2);

      // NOTE: MUST be defined in function scope, NOT outer scope:
      var openDatabase = function(name, ignored1, ignored2, ignored3) {
        if (isSystemDatabaseProvider) {
          return window.sqlitePlugin.openDatabase({
            // prevent reuse of database from default db implementation:
            name: 'system-'+name,
            // explicit database location:
            location: 'default',
            androidDatabaseProvider: 'system',
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

        it(suiteName + 'Simple tx sql order test', function(done) {
          // This test shows that executeSql statements run in intermediate callback
          // are executed AFTER executeSql statements that were queued before

          var db = openDatabase('Simple-tx-order-test.db', '1.0', 'Test', DEFAULT_SIZE);

          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('DROP TABLE IF EXISTS tt');
            tx.executeSql('CREATE TABLE tt (data)');

            tx.executeSql('INSERT INTO tt VALUES (?)', ['first'], function(tx, res) {
              expect(res).toBeDefined();
              expect(res.insertId).toBeDefined();
              expect(res.rowsAffected).toBe(1);

              tx.executeSql('INSERT INTO tt VALUES (?)', ['middle']);
            });

            tx.executeSql("INSERT INTO tt VALUES ('last')");

          }, null, function() {
            db.transaction(function(tx) {
              tx.executeSql('SELECT * FROM tt', [], function(tx, res) {
                expect(res).toBeDefined();
                expect(res.rows).toBeDefined();
                expect(res.rows.length).toBe(3);
                expect(res.rows.item(0).data).toBe('first');
                expect(res.rows.item(1).data).toBe('last');
                expect(res.rows.item(2).data).toBe('middle');
                done();
              });
            });
          });
        }, MYTIMEOUT);

        it(suiteName + 'Simple tx sql order test with error recovery', function(done) {
          // This test shows that executeSql statements run in intermediate error handling callback
          // are executed _after_ executeSql statements that were queued before

          var db = openDatabase('tx-order-with-error-test.db', '1.0', 'Test', DEFAULT_SIZE);

          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('DROP TABLE IF EXISTS tt');
            tx.executeSql('CREATE TABLE tt (data)');

            tx.executeSql('INSERT INTO tt VALUES (?)', [1], function(tx, res) {
              expect(res).toBeDefined();
              expect(res.insertId).toBeDefined();
              expect(res.rowsAffected).toBe(1);

              tx.executeSql('INSERT INTO tt VALUES (?)', [2]);
            });

            // syntax error:
            tx.executeSql('INSRT INTO tt VALUES (?)', ['bogus'], null, function(err) {
              expect(err).toBeDefined();
              // TBD check err

              tx.executeSql('INSERT INTO tt VALUES (?)', [3]);

              return false;
            });

            tx.executeSql('INSERT INTO tt VALUES (?)', [4]);

          }, function(err) {
            // not expected:
            expect(false).toBe(true);
            done();
          }, function() {
            db.transaction(function(tx) {
              tx.executeSql('SELECT * FROM tt', [], function(tx, res) {
                expect(res).toBeDefined();
                expect(res.rows).toBeDefined();
                expect(res.rows.length).toBe(4);
                expect(res.rows.item(0).data).toBe(1);
                expect(res.rows.item(1).data).toBe(4);
                expect(res.rows.item(2).data).toBe(2);
                expect(res.rows.item(3).data).toBe(3);
                done();
              });
            });
          });
        }, MYTIMEOUT);

        it(suiteName + 'transaction test: check rowsAffected [intermediate]', function (done) {
          var db = openDatabase("RowsAffected", "1.0", "Demo", DEFAULT_SIZE);

          function test1(tx) {
            tx.executeSql('DROP TABLE IF EXISTS characters');
            tx.executeSql('CREATE TABLE IF NOT EXISTS characters (name, creator, fav tinyint(1))');
            tx.executeSql('UPDATE characters SET name = ?', ['foo'], function (tx, res) {
              expect(res.rowsAffected).toBe(0); // nothing updated
              tx.executeSql('DELETE from characters WHERE name = ?', ['foo'], function (tx, res) {
                expect(res.rowsAffected).toBe(0); // nothing deleted
                tx.executeSql('UPDATE characters SET name = ?', ['foo'], function (tx, res) {
                  expect(res.rowsAffected).toBe(0); // nothing updated
                  tx.executeSql('DELETE from characters', [], function (tx, res) {
                    expect(res.rowsAffected).toBe(0); // nothing deleted
                    test2(tx);
                  });
                });
              });
            });
          }

          function test2(tx) {
            tx.executeSql('INSERT INTO characters VALUES (?,?,?)', ['Sonic', 'Sega', 0], function (tx, res) {
              expect(res.rowsAffected).toBe(1);
              tx.executeSql('INSERT INTO characters VALUES (?,?,?)', ['Mario', 'Nintendo', 0], function (tx, res) {
                expect(res.rowsAffected).toBe(1);
                tx.executeSql('INSERT INTO characters VALUES (?,?,?)', ['Samus', 'Nintendo', 0], function (tx, res) {
                  expect(res.rowsAffected).toBe(1);
                  tx.executeSql('UPDATE characters SET fav=1 WHERE creator=?', ['Nintendo'], function (tx, res) {
                    expect(res.rowsAffected).toBe(2);
                    tx.executeSql('UPDATE characters SET fav=1 WHERE creator=?', ['Konami'], function (tx, res) {
                      expect(res.rowsAffected).toBe(0);
                      tx.executeSql('UPDATE characters SET fav=1', [], function (tx, res) {
                        expect(res.rowsAffected).toBe(3);
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
              expect(res.rowsAffected).toBe(1);
              tx.executeSql('UPDATE characters SET fav=?, name=? WHERE creator=?;', [1, 'X', 'Capcom'], function (tx, res) {
                expect(res.rowsAffected).toBe(1);
                tx.executeSql('UPDATE characters SET fav=? WHERE (creator=? OR creator=?)', [1, 'Capcom', 'Nintendo'], function (tx, res) {
                  expect(res.rowsAffected).toBe(3);
                  tx.executeSql('DELETE FROM characters WHERE name="Samus";', [], function (tx, res) {
                    expect(res.rowsAffected).toBe(1);
                    tx.executeSql('UPDATE characters SET fav=0,name=?', ["foo"], function (tx, res) {
                      expect(res.rowsAffected).toBe(3);
                      tx.executeSql('DELETE FROM characters', [], function (tx, res) {
                        expect(res.rowsAffected).toBe(3);

                        done();
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

        it(suiteName + 'test insertId & rowsAffected [advanced] - plugin vs (WebKit) Web SQL', function (done) {
          var db = openDatabase('test-rowsAffected-advanced.db');

          db.transaction(function (tx) {
            tx.executeSql('DROP TABLE IF EXISTS characters');
            tx.executeSql('CREATE TABLE IF NOT EXISTS characters (name unique, creator, fav tinyint(1))');
            tx.executeSql('DROP TABLE IF EXISTS companies');
            tx.executeSql('CREATE TABLE IF NOT EXISTS companies (name unique, fav tinyint(1))');

            // INSERT or IGNORE with the real thing:
            tx.executeSql('INSERT or IGNORE INTO characters VALUES (?,?,?)', ['Sonic', 'Sega', 0], function (txIgnored, rs1) {
              expect(rs1.rowsAffected).toBe(1);
              expect(rs1.insertId).toBe(1);

              tx.executeSql('INSERT INTO characters VALUES (?,?,?)', ['Tails', 'Sega', 0], function (txIgnored, rs2) {
                expect(rs2.rowsAffected).toBe(1);
                expect(rs2.insertId).toBe(2);

                tx.executeSql('INSERT INTO companies VALUES (?,?)', ['Sega', 1], function (txIgnored, rs3) {
                  expect(rs3.rowsAffected).toBe(1);
                  expect(rs3.insertId).toBe(1);

                  // query with subquery
                  var sql = 'UPDATE characters ' +
                      ' SET fav=(SELECT fav FROM companies WHERE name=?)' +
                      ' WHERE creator=?';
                  tx.executeSql(sql, ['Sega', 'Sega'], function (txIgnored, rs4) {
                    expect(rs4.rowsAffected).toBe(2);
                    try {
                      // defined on plugin (except for Android with androidDatabaseImplementation: 2);
                      // throws on (WebKit) Web SQL:
                      if (!isWebSql && isAndroid && isSystemDatabaseProvider)
                        expect(rs4.insertId).not.toBeDefined();
                      else
                        expect(rs4.insertId).toBeDefined();

                      // NOT EXPECTED to get here on (WebKit) Web SQL:
                      if (isWebSql) expect('(WebKit) Web SQL behavior changed').toBe('--');

                      if (!(isAndroid && isSystemDatabaseProvider))
                        expect(rs4.insertId).toBe(1);
                    } catch(ex) {
                      // SHOULD NOT CATCH EXCEPTION on plugin:
                      if (!isWebSql) expect('EXCEPTION NOT EXPECTED on plugin with message: ' + ex.message).toBe('--');
                      expect(ex).toBeDefined();
                      expect(ex.message).toBeDefined();
                      // FUTURE TBD check message
                    }

                    // query with 2 subqueries
                    var sql = 'UPDATE characters ' +
                        ' SET fav=(SELECT fav FROM companies WHERE name=?),' +
                        ' creator=(SELECT name FROM companies WHERE name=?)' +
                        ' WHERE creator=?';
                    tx.executeSql(sql, ['Sega', 'Sega', 'Sega'], function (txIgnored, rs5) {
                      expect(rs5.rowsAffected).toBe(2);
                      try {
                        // defined on plugin (except for Android with androidDatabaseImplementation: 2);
                        // throws on (WebKit) Web SQL:
                        if (!isWebSql && isAndroid && isSystemDatabaseProvider)
                          expect(rs5.insertId).not.toBeDefined();
                        else
                          expect(rs5.insertId).toBeDefined();

                        // EXPECTED to get here on plugin only:
                        if (isWebSql) expect('(WebKit) Web SQL behavior changed').toBe('--');

                        if (!(isAndroid && isSystemDatabaseProvider))
                          expect(rs5.insertId).toBe(1);
                      } catch(ex) {
                        // SHOULD NOT CATCH EXCEPTION on plugin:
                        if (!isWebSql) expect('EXCEPTION NOT EXPECTED on plugin with message: ' + ex.message).toBe('--');
                        // XXX TODO CHECK message, etc.
                      }

                      // knockoffs shall be ignored:
                      tx.executeSql('INSERT or IGNORE INTO characters VALUES (?,?,?)', ['Sonic', 'knockoffs4you', 0], function (txIgnored, rs6) {
                        // EXPECTED RESULT:
                        expect(rs6.rowsAffected).toBe(0);

                        // insertId plugin vs (WebKit) Web SQL:
                        if (isWebSql)
                          expect(rs6.insertId).toBe(1);
                        else
                          expect(rs6.insertId).not.toBeDefined();

                        done();
                      }, function(txIgnored, error) {
                        // ERROR NOT EXPECTED here - knockoff should have been ignored:
                        logError('knockoff should have been ignored');
                        expect(error.message).toBe('--');

                        done.fail();
                      });

                    });

                  });

                });

              });

            });

          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        });

        // FUTURE TODO: fix these tests to follow the Jasmine style and move into a separate spec file:

        it(suiteName + "nested transaction test", function(done) {
          var db = openDatabase("Database2", "1.0", "Demo", DEFAULT_SIZE);

          expect(db).toBeTruthy(); // db object

          db.transaction(function(tx) {
            expect(tx).toBeTruthy(); // tx object

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

                expect(res.rows.length).toBe(1); // res rows length
                expect(res.rows.item(0).cnt).toBe(1); // select count

                done();
              });

            });

          });

        });

      describe(suiteName + 'transaction callback semantics test(s)', function() {

        function withTestTable(func) {
          var db = openDatabase("Database", "1.0", "Demo", DEFAULT_SIZE);
          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)');
          }, function(err) { ok(false, err.message) }, function() {
            //start();
            func(db);
          });
        };

        it(suiteName + "transaction encompasses all callbacks", function(done) {
          var db = openDatabase("tx-all-callbacks.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {

            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)');

            db.transaction(function(tx) {
              tx.executeSql('INSERT INTO test_table (data, data_num) VALUES (?,?)', ['test', 100], function(tx, res) {
                tx.executeSql("SELECT count(*) as cnt from test_table", [], function(tx, res) {
                  expect(res.rows.item(0).cnt).toBe(1); // did insert row
                  throw new Error("deliberately aborting transaction");
                });
              });
            }, function(error) {
              if (!isWebSql) expect(error.message).toBe("deliberately aborting transaction");
              db.transaction(function(tx) {
                tx.executeSql("select count(*) as cnt from test_table", [], function(tx, res) {
                  // EXPECTED RESULT:
                  expect(res.rows.item(0).cnt).toBe(0); // final count shows we rolled back

                  done();
                });
              });
            }, function() {
              // ERROR NOT EXPECTED here:
              logError("transaction succeeded but wasn't supposed to");done.fail();
              expect(error.message).toBe('--');

              start();
            });
          });
        });

        it(suiteName + 'exception from transaction handler causes failure', function(done) {
          var db = openDatabase("exception-causes-failure.db", "1.0", "Demo", DEFAULT_SIZE);

          try {
            db.transaction(function(tx) {
              throw new Error("boom");
            }, function(error) {
              expect(error).toBeDefined();
              expect(error.code).toBeDefined();
              expect(error.message).toBeDefined();

              // error.hasOwnProperty('message') apparently NOT WORKING on
              // WebKit Web SQL on Android 5.x/... or iOS 10.x/...:
              if (!isWebSql || isWindows || (isAndroid && (/Android 4/.test(navigator.userAgent))))
                expect(error.hasOwnProperty('message')).toBe(true);

              expect(error.code).toBe(0);

              if (isWebSql)
                expect(error.message).toMatch(/the SQLTransactionCallback was null or threw an exception/);
              else
                expect(error.message).toBe('boom');

              done();
            }, function() {
              // transaction success callback not expected
              expect(false).toBe(true);
              done();
            });
            logSuccess("db.transaction() did not throw an error");
          } catch(ex) {
            // exception not expected here
            expect(false).toBe(true);
            done();
          }
        });

        it(suiteName + 'exception with code from transaction handler', function(done) {
          var db = openDatabase("exception-with-code.db", "1.0", "Demo", DEFAULT_SIZE);

          try {
            db.transaction(function(tx) {
              var e = new Error("boom");
              e.code = 3;
              throw e;
            }, function(error) {
              expect(error).toBeDefined();
              expect(error.code).toBeDefined();
              expect(error.message).toBeDefined();

              if (isWebSql)
                expect(error.code).toBe(0);
              else
                expect(error.code).toBe(3);

              if (isWebSql)
                expect(error.message).toMatch(/the SQLTransactionCallback was null or threw an exception/);
              else
                expect(error.message).toBe('boom');

              done();
            }, function() {
              // transaction success callback not expected
              expect(false).toBe(true);
              done();
            });
          } catch(ex) {
            // exception not expected here
            expect(false).toBe(true);
            done();
          }
        });

        it(suiteName + "error handler returning true causes rollback", function(done) {
          withTestTable(function(db) {
            db.transaction(function(tx) {
              tx.executeSql("insert into test_table (data, data_num) VALUES (?,?)", ['test', null], function(tx, res) {
                expect(res).toBeDefined();
                expect(res.rowsAffected).toBe(1);

                tx.executeSql("select * from bogustable", [], function(tx, res) {
                  // NOT EXPECTED:
                  done.fail();
                }, function(tx, err) {
                  // EXPECTED RESULT:
                  expect(err.message).toBeDefined();
                  return true;
                });
              });
            }, function(err) {
              // EXPECTED RESULT:
              expect(err.message).toBeTruthy(); // should report error message

              db.transaction(function(tx) {
                tx.executeSql("select count(*) as cnt from test_table", [], function(tx, res) {
                  // EXPECTED RESULT:
                  expect(res.rows.item(0).cnt).toBe(0); // should have rolled back

                  done();
                });
              });
            }, function() {
              // NOT EXPECTED - not supposed to succeed:
              logError('not supposed to succeed');
              expect(error.message).toBe('--');
              done.fail();
            });
          });
        });

        // NOTE: conclusion reached with @aarononeal and @nolanlawson in litehelpers/Cordova-sqlite-storage#232
        // that the according to the spec at http://www.w3.org/TR/webdatabase/ the transaction should be
        // recovered *only* if the sql error handler returns false.
        it(suiteName + 'error handler returning false lets transaction continue', function(done) {
          var check1 = false;
          withTestTable(function(db) {
            db.transaction(function(tx) {
              tx.executeSql("insert into test_table (data, data_num) VALUES (?,?)", ['test', null], function(tx, res) {
                expect(res).toBeDefined();
                expect(res.rowsAffected).toBe(1);
                tx.executeSql("select * from bogustable", [], function(tx, res) {
                  // NOT EXPECTED:
                  logError("select statement not supposed to succeed");
                  done.fail();
                }, function(tx, err) {
                  // EXPECTED RESULT:
                  check1 = true;
                  expect(err.message).toBeTruthy(); // should report a valid error message
                  return false;
                });
              });
            }, function(error) {
              // ERROR NOT EXPECTED here:
              logError('transaction was supposed to succeed: ' + error.message);
              expect(error.message).toBe('--');
              done.fail();
            }, function() {
              db.transaction(function(tx) {
                tx.executeSql("select count(*) as cnt from test_table", [], function(tx, res) {
                  expect(check1).toBe(true);
                  expect(res.rows.item(0).cnt).toBe(1); // should have commited

                  done();
                });
              });
            });
          });
        });

        it(suiteName + "missing error handler causes rollback", function(done) {
          withTestTable(function(db) {
            db.transaction(function(tx) {
              tx.executeSql("insert into test_table (data, data_num) VALUES (?,?)", ['test', null], function(tx, res) {
                expect(res).toBeDefined();
                expect(res.rowsAffected).toEqual(1);
                tx.executeSql("select * from bogustable", [], function(tx, res) {
                  // NOT EXPECTED:
                  logError("select statement not supposed to succeed");
                  done.fail();
                });
              });
            }, function(err) {
              // EXPECTED RESULT:
              expect(err.message).toBeTruthy(); // should report a valid error message
              db.transaction(function(tx) {
                tx.executeSql("select count(*) as cnt from test_table", [], function(tx, res) {
                  expect(res.rows.item(0).cnt).toBe(0); // should have rolled back

                  done();
                });
              });
            }, function() {
              // ERROR NOT EXPECTED here:
              logError("transaction was supposed to fail");done.fail();
              expect(error.message).toBe('--');
              done.fail();
            });
          });
        });

        it(suiteName + "executeSql fails outside transaction", function(done) {
          var check1 = false;
          withTestTable(function(db) {
            expect(db).toBeTruthy(); // db ok
            var txg;
            db.transaction(function(tx) {
              expect(tx).toBeTruthy(); // tx ok
              txg = tx;
              tx.executeSql("insert into test_table (data, data_num) VALUES (?,?)", ['test', null], function(tx, res) {
                expect(res).toBeDefined();
                expect(res.rowsAffected).toEqual(1);
                check1 = true;
              });
            }, function(error) {
              // ERROR NOT EXPECTED here:
              logError('unexpected error callback with message: ' + error.message);
              expect(error.message).toBe('--');
              done.fail();
            }, function() {
              // this simulates what would happen if a Promise ran on the next tick
              // and invoked an execute on the transaction
              try {
                txg.executeSql("select count(*) as cnt from test_table", [], null, null);
                // NOT EXPECTED to get here:
                logError("executeSql should have thrown but continued instead");
                done.fail();
              } catch(err) {
                expect(err.message).toBeTruthy(); // error had valid message
              }
              done();
            });
          });
        });

      });

        it(suiteName + "readTransaction should fail & report error on modification", function(done) {
          var db = openDatabase("tx-readonly-test.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('DROP TABLE IF EXISTS ExtraTestTable1');
            tx.executeSql('DROP TABLE IF EXISTS ExtraTestTable2');
            tx.executeSql('DROP TABLE IF EXISTS ExtraTestTable3');
            tx.executeSql('DROP TABLE IF EXISTS ExtraTestTable4');
            tx.executeSql('DROP TABLE IF EXISTS ExtraTestTable5');
            tx.executeSql('DROP TABLE IF EXISTS ExtraTestTable6');
            tx.executeSql('DROP TABLE IF EXISTS AlterTestTable');

            tx.executeSql('CREATE TABLE test_table (data)');
            tx.executeSql('INSERT INTO test_table VALUES (?)', ['first']);

            tx.executeSql('CREATE TABLE AlterTestTable (FirstColumn)');
          }, function () {}, function () {
            db.readTransaction(function (tx) {
              tx.executeSql('SELECT * from test_table', [], function (tx, res) {
                expect(res.rows.length).toBe(1);
                expect(res.rows.item(0).data).toBe('first');
              });
            }, function () {}, function () {
              var numDone = 0;
              var failed = false;
              var tasks;

              function checkDone() {
                if (++numDone === tasks.length) {
                  done();
                }
              }
              function fail() {
                if (!failed) {
                  expect(false).toBe(true);
                  expect('readTransaction was supposed to fail').toBe('--');
                  failed = true;

                  done();
                }
              }

              tasks = [
                // these transactions should be OK:
                function () {
                  db.readTransaction(function (tx) {
                    tx.executeSql(' SELECT 1;');
                  }, fail, checkDone);
                },
                function () {
                  db.readTransaction(function (tx) {
                    tx.executeSql('; SELECT 1;');
                  }, fail, checkDone);
                },

                // all of these transactions should report an error
                function () {
                  db.readTransaction(function (tx) {
                    tx.executeSql('UPDATE test_table SET foo = "another"');
                  }, checkDone, fail);
                },
                function () {
                  db.readTransaction(function (tx) {
                    tx.executeSql('INSERT INTO test_table VALUES ("another")');
                  }, checkDone, fail);
                },
                function () {
                  db.readTransaction(function (tx) {
                    tx.executeSql('DELETE from test_table');
                  }, checkDone, fail);
                },
                function () {
                  db.readTransaction(function (tx) {
                    tx.executeSql('DROP TABLE test_table');
                  }, checkDone, fail);
                },
                function () {
                  db.readTransaction(function (tx) {
                    // extra space before sql (OK)
                    tx.executeSql(' CREATE TABLE test_table2 (data)');
                  }, checkDone, fail);
                },
                function () {
                  db.readTransaction(function (tx) {
                    // two extra spaces before sql (OK)
                    tx.executeSql('  CREATE TABLE test_table3 (data)');
                  }, checkDone, fail);
                },
                function () {
                  db.readTransaction(function (tx) {
                    tx.executeSql(';  CREATE TABLE ExtraTestTable1 (data)');
                  }, checkDone, fail);
                },
                function () {
                  db.readTransaction(function (tx) {
                    tx.executeSql(' ;  CREATE TABLE ExtraTestTable2 (data)');
                  }, checkDone, fail);
                },
                function () {
                  db.readTransaction(function (tx) {
                    tx.executeSql(';CREATE TABLE ExtraTestTable3 (data)');
                  }, checkDone, fail);
                },
                function () {
                  db.readTransaction(function (tx) {
                    tx.executeSql(';; CREATE TABLE ExtraTestTable4 (data)');
                  }, checkDone, fail);
                },
                function () {
                  db.readTransaction(function (tx) {
                    tx.executeSql('; ;CREATE TABLE ExtraTestTable5 (data)');
                  }, checkDone, fail);
                },
                function () {
                  db.readTransaction(function (tx) {
                    tx.executeSql('; ; CREATE TABLE ExtraTestTable6 (data)');
                  }, checkDone, fail);
                },
                function () {
                  db.readTransaction(function (tx) {
                    tx.executeSql('ALTER TABLE AlterTestTable ADD COLUMN NewColumn');
                  }, checkDone, fail);
                },
                function () {
                  db.readTransaction(function (tx) {
                    tx.executeSql('REINDEX');
                  }, checkDone, fail);
                },
                function () {
                  db.readTransaction(function (tx) {
                    tx.executeSql('REPLACE INTO test_table VALUES ("another")');
                  }, checkDone, fail);
                },
              ];
              for (var i = 0; i < tasks.length; i++) {
                tasks[i]();
              }
            });
          });
        });

        it(suiteName + ' test callback order', function (done) {
          var db = openDatabase("Database-Callback-Order", "1.0", "Demo", DEFAULT_SIZE);
          var blocked = true;

          db.transaction(function(tx) {
            // callback to the transaction shouldn't block (1)
            expect(blocked).toBe(false);
            tx.executeSql('SELECT 1', [], function () {
              // callback to the transaction shouldn't block (2)
              expect(blocked).toBe(false);
            });
          }, function(err) { ok(false, err.message) }, function() {
            // callback to the transaction shouldn't block (3)
            expect(blocked).toBe(false);

            done();
          });
          blocked = false;
        });

    });
  }

}

if (window.hasBrowser) mytests();
else exports.defineAutoTests = mytests;

/* vim: set expandtab : */
