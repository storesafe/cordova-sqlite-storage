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
var pluginScenarioList = [
  isAndroid ? 'Plugin-implementation-default' : 'Plugin',
  'Plugin-implementation-2'
];

var pluginScenarioCount = isAndroid ? 2 : 1;

var mytests = function() {

  describe('Plugin - BASIC sqlitePlugin.openDatabase test(s)', function() {

    var suiteName = 'plugin: ';

        it(suiteName + 'Open plugin database with Web SQL parameters (REJECTED with exception)', function(done) {
          try {
            var db = window.sqlitePlugin.openDatabase('open-with-web-sql-parameters-test.db', "1.0", "Demo", DEFAULT_SIZE);

            // NOT EXPECTED:
            // window.sqlitePlugin.openDatabase did not throw
            expect(false).toBe(true);

            // check returned db object:
            expect(db).toBeDefined();
            expect(db.executeSql).toBeDefined();
            expect(db.transaction).toBeDefined();
            expect(db.close).toBeDefined();

            //done();
            // IMPORTANT FIX: avoid the risk of over 100 db handles open when running the full test suite
            db.close(done, done);
          } catch (e) {
            // EXPECTED RESULT:
            expect(true).toBe(true);
            done();
          }
        }, MYTIMEOUT);

        // NOTE: this was an issue due to the inconsistency ng cordova documentation and source code which
        // triggered problems reported in litehelpers/Cordova-sqlite-storage#246 and
        // litehelpers/Cordova-sqlcipher-adapter#5.
        // The implementation now avoids this problem *by throwing an exception*.
        // It could be nicer to just signal an error in the error callback, if present,
        // through throwing an exception does prevent the user from using an invalid db object.
        // Brody TBD: check how the Web SQL API would handle this condition?
        it(suiteName + 'check that db name is really a string', function(done) {
          var p1 = { name: 'my.db.name', location: 1 };
          try {
            window.sqlitePlugin.openDatabase({ name: p1 }, function(db) {
              // not expected:
              expect(false).toBe(true);
              done();
            }, function(error) {
              // OK but NOT EXPECTED:
              expect(true).toBe(true);
              // XXX BRODY TODO:
              //expect('Behavior changed, please update this test').toBe('--');
              done();
            });
          } catch (e) {
              // stopped by the implementation:
              expect(true).toBe(true);
              done();
          }
        }, MYTIMEOUT);

  });

  describe('Plugin: db open-close-delete test(s)', function() {

    for (var i=0; i<pluginScenarioCount; ++i) {

      describe(pluginScenarioList[i] + ': basic sqlitePlugin.deleteDatabase test(s)', function() {
        var scenarioName = pluginScenarioList[i];
        var suiteName = scenarioName + ': ';
        var isOldAndroidImpl = (i === 1);

        // NOTE: MUST be defined in function scope, NOT outer scope:
        var openDatabase = function(first, second, third, fourth, fifth, sixth) {
          //if (!isOldAndroidImpl) {
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

          if (!isOldAndroidImpl) {
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

        var deleteDatabase = function(first, second, third) {
          if (!isOldAndroidImpl) {
            window.sqlitePlugin.deleteDatabase({name: first, location: 0}, second, third);
          } else {
            window.sqlitePlugin.deleteDatabase({name: 'i2-'+first, location: 0}, second, third);
          }
        }

        test_it(suiteName + ' test sqlitePlugin.deleteDatabase()', function () {
          stop();
          var db = openDatabase("DB-Deletable", "1.0", "Demo", DEFAULT_SIZE);

          function createAndInsertStuff() {

            db.transaction(function(tx) {
              tx.executeSql('DROP TABLE IF EXISTS test');
              tx.executeSql('CREATE TABLE IF NOT EXISTS test (name)', [], function () {
                tx.executeSql('INSERT INTO test VALUES (?)', ['foo']);
              });
            }, function (err) {
              ok(false, 'create and insert tx failed with ERROR: ' + JSON.stringify(err));
              console.log('create and insert tx failed with ERROR: ' + JSON.stringify(err));
              start();
            }, function () {
              // check that we can read it
              db.transaction(function(tx) {
                tx.executeSql('SELECT * FROM test', [], function (tx, res) {
                  equal(res.rows.item(0).name, 'foo');
                });
              }, function (err) {
                ok(false, 'SELECT tx failed with ERROR: ' + JSON.stringify(err));
                console.log('SELECT tx failed with ERROR: ' + JSON.stringify(err));
                start();
              }, function () {
                deleteAndConfirmDeleted();
              });
            });
          }

          function deleteAndConfirmDeleted() {

            deleteDatabase("DB-Deletable", function () {

              // check that the data's gone
              db.transaction(function (tx) {
                tx.executeSql('SELECT name FROM test', []);
              }, function (err) {
                ok(true, 'got an expected transaction error');
                testDeleteError();
              }, function () {
                console.log('UNEXPECTED SUCCESS: expected a transaction error');
                ok(false, 'expected a transaction error');
                start();
              });
            }, function (err) {
              console.log("ERROR: " + JSON.stringify(err));
              ok(false, 'error: ' + err);
              start();
            });
          }

          function testDeleteError() {
            // should throw an error if the db doesn't exist
            deleteDatabase("Foo-Doesnt-Exist", function () {
              console.log('UNEXPECTED SUCCESS: expected a delete error');
              ok(false, 'expected error');
              start();
            }, function (err) {
              ok(!!err, 'got error like we expected');

              start();
            });
          }

          createAndInsertStuff();
        });

      });
    }

    for (var i=0; i<pluginScenarioCount; ++i) {

      describe(pluginScenarioList[i] + ': basic plugin open-close test(s)', function() {
        var scenarioName = pluginScenarioList[i];
        var suiteName = scenarioName + ': ';
        var isOldAndroidImpl = (i === 1);

        // NOTE: MUST be defined in function scope, NOT outer scope:
        var openDatabase = function(first, second, third, fourth, fifth, sixth) {
          //if (!isOldAndroidImpl) {
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

          if (!isOldAndroidImpl) {
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

        test_it(suiteName + ' database.open calls its success callback', function () {
          // asynch test coming up
          stop(1);

          var dbName = "Database-Open-callback";
          openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE, function (db) {
            ok(true, 'expected open success callback to be called ...');
            start(1);
          }, function (error) {
            ok(false, 'expected open error callback not to be called ...');
            start(1);
          });
        });

        test_it(suiteName + ' database.close (immediately after open) calls its success callback', function () {
          // XXX POSSIBLY BROKEN on iOS due to current background processing implementation
          if (!(isAndroid || isIE)) pending('POSSIBLY BROKEN on iOS (background processing implementation)');

          // asynch test coming up
          stop(1);

          var dbName = "Immediate-close-callback";
          var db = openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE);

          // close database - need to run tests directly in callbacks as nothing is guarenteed to be queued after a close
          db.close(function () {
            ok(true, 'expected close success callback to be called after database is closed');
            start(1);
          }, function (error) {
            ok(false, 'expected close error callback not to be called after database is closed');
            start(1);
          });
        });

        test_it(suiteName + ' database.close after open callback calls its success callback', function () {
          // asynch test coming up
          stop(1);

          var dbName = "Close-after-open-callback";

          openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE, function(db) {
            // close database - need to run tests directly in callbacks as nothing is guarenteed to be queued after a close
            db.close(function () {
              ok(true, 'expected close success callback to be called after database is closed');
              start(1);
            }, function (error) {
              ok(false, 'expected close error callback not to be called after database is closed');
              start(1);
            });
          }, function (error) {
            ok(false, 'unexpected open error');
            start(1);
          });
        });

        test_it(suiteName + ' database.close fails in transaction', function () {
          stop(2);

          var dbName = "Database-Close-fail";
          var db = openDatabase({name: dbName, location: 1});

          db.readTransaction(function(tx) {
            tx.executeSql('SELECT 1', [], function(tx, results) {
              // close database - need to run tests directly in callbacks as nothing is guarenteed to be queued after a close
              db.close(function () {
                ok(false, 'expect close to fail during transaction');
                start(1);
              }, function (error) {
                ok(true, 'expect close to fail during transaction');
                start(1);
              });
              start(1);
            }, function(error) {
              ok(false, error);
              start(2);
            });
          }, function(error) {
            ok(false, error);
            start(2);
          });
        });

        test_it(suiteName + ' attempt to close db twice', function () {
          var dbName = "close-db-twice.db";

          stop(1);

          openDatabase({name: dbName}, function(db) {
            ok(!!db, 'valid db object');
            db.close(function () {
              ok(true, 'db.close() success callback (first time)');
              db.close(function () {
                ok(false, 'db.close() second time should not have succeeded');
                start(1);
              }, function (error) {
                ok(true, 'db.close() second time reported error ok');
                start(1);
              });
            }, function (error) {
              ok(false, 'expected close error callback not to be called after database is closed');
              start(1);
            });
          });
        });

        // XXX TODO MOVE:
        // XXX BROKEN [BUG #209]:
        xtest_it(suiteName + ' close writer db handle should not close reader db handle [BROKEN]', function () {
          var dbname = 'close-one-db-handle.db';
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
            dbw.close(function () {
              // XXX dbr no longer working [BUG #209]:
              dbr.readTransaction(function (tx) {
                ok(false, "Behavior changed - please update this test");
                tx.executeSql('SELECT test_data from tt', [], function (tx, result) {
                  equal(result.rows.item(0).test_data, 'My-test-data', 'read data from reader handle');
                  start(1);
                });
              }, function(error) {
                console.log("ERROR reading db handle: " + error.message);
                //ok(false, "ERROR reading db handle: " + error.message);
                ok(true, "BUG REPRODUCED");
                start(1);
              });
            }, function (error) {
              ok(false, 'close error callback not to be called after database is closed');
              start(1);
            });
          });
        });

        // XXX TODO MOVE:
        // XXX BROKEN [BUG #204]:
        xtest_it(suiteName + ' close DB in db.executeSql() callback [BROKEN]', function () {
          var dbName = "Close-DB-in-db-executeSql-callback.db";

          // async test coming up
          stop(1);

          openDatabase({name: dbName}, function (db) {
            db.executeSql("CREATE TABLE IF NOT EXISTS tt (test_data)", [], function() {
              db.close(function () {
                ok(false, "Behavior changed - please update this test");
                ok(true, 'DB close OK');
                start(1);
              }, function (error) {
                //ok(false, "Could not close DB: " + error.message);
                ok(true, "BUG REPRODUCED");
                start(1);
              });
            });
          }, function (error) {
            ok(false, error.message);
            start(1);
          });
        });

      });
    }

    describe('repeated open/close/delete test(s)', function() {
      var scenarioName = isAndroid ? 'Plugin-implementation-default' : 'Plugin';
      var suiteName = scenarioName + ': ';

        // NOTE: MUST be defined in function scope, NOT outer scope:
        var openDatabase = function(first, second, third) {
          return window.sqlitePlugin.openDatabase(first, second, third);
        }

        var deleteDatabase = function(first, second, third) {
          window.sqlitePlugin.deleteDatabase(first, second, third);
        }

        // Needed to support some large-scale applications:
        test_it(suiteName + ' open same database twice in [same] specified location works', function () {
          // XXX TODO [BROKEN]: same db name, different location should be different db!
          var dbName = 'open-twice-same-location.db';

          stop(2);

          var db1 = openDatabase({name: dbName, location: 2}, function () {
            var db2 = openDatabase({name: dbName, location: 2}, function () {
              db1.readTransaction(function(tx1) {
                tx1.executeSql('SELECT 1', [], function(tx1d, results) {
                  ok(true, 'db1 transaction working');
                  start(1);
                }, function(error) {
                  ok(false, error);
                });
              }, function(error) {
                ok(false, error);
              });
              db2.readTransaction(function(tx2) {
                tx2.executeSql('SELECT 1', [], function(tx2d, results) {
                  ok(true, 'db2 transaction working');
                  start(1);
                }, function(error) {
                  ok(false, error);
                });
              }, function(error) {
                ok(false, error);
              });
            }, function (error) {
              ok(false, error);
            });
          }, function (error) {
            ok(false, error);
          });
        });

        // Needed to support some large-scale applications:
        test_it(suiteName + ' close then re-open (2x) allows subsequent queries to run', function () {
          // asynch test coming up
          stop(1);
        
          var dbName = "Database-Close-and-Reopen";

          openDatabase({name: dbName, location: 0}, function (db) {
            db.close(function () {
              openDatabase({name: dbName, location: 0}, function (db) {
                db.close(function () {
                  openDatabase({name: dbName, location: 0}, function (db) {
                    db.readTransaction(function (tx) {
                      tx.executeSql('SELECT 1', [], function (tx, results) {
                        ok(true, 'database re-opened succesfully');
                        start(1);
                      }, function (error) {
                        ok(false, error.message);
                        start(1);
                      });
                    }, function (error) {
                      ok(false, error.message);
                      start(1);
                    }, function(tx) {
                      // close on transaction success not while executing
                      // or commit will fail
                      db.close(); 
                    });
                  }, function (error) {
                    ok(false, error.message);
                    start(1);
                  });
                }, function (error) {
                  ok(false, error.message);
                  start(1);
                });
              }, function (error) {
                ok(false, error.message);
                start(1);
              });
            }, function (error) {
              ok(false, error.message);
              start(1);
            });
          }, function (error) {
            ok(false, error.message);
            start(1);
          });
        });

        // Needed to support some large-scale applications:
        test_it(suiteName + ' delete then re-open (location: 2) allows subsequent queries to run', function () {
          var dbName = "Database-delete-and-Reopen.db";

          // async test coming up
          stop(1);

          var db = openDatabase({name: dbName, iosDatabaseLocation: 'default'}, function () {
            // success CB
            deleteDatabase({name: dbName, iosDatabaseLocation: 'default'}, function () {
              db = openDatabase({name: dbName, iosDatabaseLocation: 'default'}, function () {
                db.readTransaction(function (tx) {
                  tx.executeSql('SELECT 1', [], function (tx, results) {
                    ok(true, 'database re-opened succesfully');
                    start(1);
                  }, function (error) {
                    ok(false, error);
                    start(1);
                  }, function (error) {
                    ok(false, error);
                    start(1);
                  });
                }, function (error) {
                  ok(false, error);
                  start(1);
                });
              }, function (error) {
                ok(false, error);
                start(1);
              });
            }, function (error) {
              ok(false, error);
              start(1);
            });
          }, function (error) {
            ok(false, error);
            start(1);
          });
        });

        // XXX SEE BELOW: repeat scenario but wait for open callback before close/delete/reopen
        // Needed to support some large-scale applications:
        test_it(suiteName + ' immediate close, then delete then re-open allows subsequent queries to run', function () {

          // XXX POSSIBLY BROKEN on iOS due to current background processing implementation
          if (!(isAndroid || isIE)) pending('POSSIBLY BROKEN on iOS (background processing implementation)');

          var dbName = "Immediate-close-delete-Reopen.db";

          // asynch test coming up
          stop(1);

          var db1 = openDatabase({name: dbName, iosDatabaseLocation: 'Documents'});

          db1.close(function () {
            deleteDatabase({name: dbName, iosDatabaseLocation: 'Documents'}, function () {
              openDatabase({name: dbName, iosDatabaseLocation: 'Documents'}, function(db) {
                db.readTransaction(function (tx) {
                  tx.executeSql('SELECT 1', [], function (tx, results) {
                    ok(true, 'database re-opened succesfully');
                    start(1);
                  }, function (e) {
                    ok(false, 'error: ' + e);
                    start(1);
                  });
                }, function (e) {
                  ok(false, 'error: ' + e);
                  start(1);
                });
              }, function (e) {
                ok(false, 'error: ' + e);
                start(1);
              });
            }, function (e) {
              ok(false, 'error: ' + e);
              start(1);
            });
          }, function (e) {
            ok(false, 'error: ' + e);
            start(1);
          });
        });

        test_it(suiteName + ' close (after open cb), then delete then re-open allows subsequent queries to run', function () {

          var dbName = "Close-after-opencb-delete-reopen.db";

          // asynch test coming up
          stop(1);

          openDatabase({name: dbName, iosDatabaseLocation: 'Library'}, function(db1) {

            db1.close(function () {
              deleteDatabase({name: dbName, iosDatabaseLocation: 'Library'}, function () {
                openDatabase({name: dbName, iosDatabaseLocation: 'Library'}, function(db) {
                  db.readTransaction(function (tx) {
                    tx.executeSql('SELECT 1', [], function (tx, results) {
                      ok(true, 'database re-opened succesfully');
                      start(1);
                    }, function (e) {
                      ok(false, 'error: ' + e);
                      start(1);
                    });
                  }, function (e) {
                    ok(false, 'error: ' + e);
                    start(1);
                  });
                }, function (e) {
                  ok(false, 'error: ' + e);
                  start(1);
                });
              }, function (e) {
                ok(false, 'error: ' + e);
                start(1);
              });
            }, function (e) {
              ok(false, 'error: ' + e);
              start(1);
            });

          }, function (e) {
            ok(false, 'open error: ' + e);
            start(1);
          });

        });

        test_it(suiteName + ' repeatedly open and close database (4x)', function () {
          var dbName = "repeatedly-open-and-close-db-4x.db";

          // async test coming up
          stop(1);

          openDatabase({name: dbName, location: 0}, function(db) {
            ok(!!db, 'valid db object 1/4');
            db.close(function () {
              ok(true, 'success 1/4');

              openDatabase({name: dbName, location: 0}, function(db) {
                ok(!!db, 'valid db object 2/4');
                db.close(function () {
                  ok(true, 'success 2/4');

                  openDatabase({name: dbName, location: 0}, function(db) {
                    ok(!!db, 'valid db object 3/4');
                    db.close(function () {
                      ok(true, 'success 3/4');

                      openDatabase({name: dbName, location: 0}, function(db) {
                        ok(!!db, 'valid db object 4/4');
                        db.close(function () {
                          ok(true, 'success 4/4');

                          start(1);
                        }, function (error) {
                          ok(false, 'close 4/4: unexpected close error callback: ' + error);
                          start(1);
                        });
                      }, function (error) {
                        ok(false, 'open 4/4: unexpected open error callback: ' + error);
                        start(1);
                      });
                    }, function (error) {
                      ok(false, 'close 3/4: unexpected close error callback: ' + error);
                      start(1);
                    });
                  }, function (error) {
                    ok(false, 'open 3/4: unexpected open error callback: ' + error);
                    start(1);
                  });
                }, function (error) {
                  ok(false, 'close 2/4: unexpected delete close callback: ' + error);
                  start(1);
                });
              }, function (error) {
                ok(false, 'close 2/4: unexpected open close callback: ' + error);
                start(1);
              });
            }, function (error) {
              ok(false, 'close 1/4: unexpected delete close callback: ' + error);
              start(1);
            });
          }, function (error) {
            ok(false, 'open 1/4: unexpected open error callback: ' + error);
            start(1);
          });
        });

        test_it(suiteName + ' repeatedly open and close database faster (5x)', function () {
          // XXX CURRENTLY BROKEN on iOS due to current background processing implementation
          if (!(isAndroid || isIE)) pending('CURRENTLY BROKEN on iOS (background processing implementation)');

          var dbName = "repeatedly-open-and-close-faster-5x.db";

          // async test coming up
          stop(1);

          var db = openDatabase({name: dbName, location: 0});
          ok(!!db, 'valid db object 1/5');
          db.close(function () {
            ok(true, 'success 1/5');

            db = openDatabase({name: dbName, location: 0});
            ok(!!db, 'valid db object 2/5');
            db.close(function () {
              ok(true, 'success 2/5');

              db = openDatabase({name: dbName, location: 0});
              ok(!!db, 'valid db object 3/5');
              db.close(function () {
                ok(true, 'success 3/5');

                db = openDatabase({name: dbName, location: 0});
                ok(!!db, 'valid db object 4/5');
                db.close(function () {
                  ok(true, 'success 4/5');

                  db = openDatabase({name: dbName, location: 0});
                  ok(!!db, 'valid db object 5/5');
                  db.close(function () {
                    ok(true, 'success 5/5');

                    start(1);
                  }, function (error) {
                    ok(false, 'close 5/5: unexpected close error callback: ' + error);
                    start(1);
                  });
                }, function (error) {
                  ok(false, 'close 4/5: unexpected close error callback: ' + error);
                  start(1);
                });
              }, function (error) {
                ok(false, 'close 3/5: unexpected close error callback: ' + error);
                start(1);
              });
            }, function (error) {
              ok(false, 'close 2/5: unexpected close error callback: ' + error);
              start(1);
            });
          }, function (error) {
            ok(false, 'close 1/5: unexpected close error callback: ' + error);
            start(1);
          });
        });

        // Needed to support some large-scale applications:
        test_it(suiteName + ' repeatedly open and delete database (4x)', function () {
          var dbName = "repeatedly-open-and-delete-4x.db";
          var dbargs = {name: dbName, iosDatabaseLocation: 'Documents'};

          // async test coming up
          stop(1);

          openDatabase(dbargs, function(db) {
            ok(true, 'valid db object 1/4');
            deleteDatabase(dbargs, function () {
              ok(true, 'success 1/4');

              openDatabase(dbargs, function(db) {
                ok(true, 'valid db object 2/4');
                deleteDatabase(dbargs, function () {
                  ok(true, 'success 2/4');

                  openDatabase(dbargs, function(db) {
                    ok(true, 'valid db object 3/4');
                    deleteDatabase(dbargs, function () {
                      ok(true, 'success 3/4');

                      openDatabase(dbargs, function(db) {
                        ok(true, 'valid db object 4/4');
                        deleteDatabase(dbargs, function () {
                          ok(true, 'success 4/4');

                          start(1);
                        }, function (error) {
                          ok(false, 'delete 4/4: unexpected delete error callback: ' + error);
                          start(1);
                        });
                      }, function (error) {
                        ok(false, 'open 4/4: unexpected open error callback: ' + error);
                        start(1);
                      });
                    }, function (error) {
                      ok(false, 'delete 3/4: unexpected delete error callback: ' + error);
                      start(1);
                    });
                  }, function (error) {
                    ok(false, 'open 3/4: unexpected open error callback: ' + error);
                    start(1);
                  });
                }, function (error) {
                  ok(false, 'delete 2/4: unexpected delete error callback: ' + error);
                  start(1);
                });
              }, function (error) {
                ok(false, 'open 2/4: unexpected open error callback: ' + error);
                start(1);
              });
            }, function (error) {
              ok(false, 'delete 1/4: unexpected delete error callback: ' + error);
              start(1);
            });
          }, function (error) {
            ok(false, 'open 1/4: unexpected open error callback: ' + error);
            start(1);
          });
        });

        // Needed to support some large-scale applications:
        test_it(suiteName + ' repeatedly open and delete database faster (5x)', function () {
          // XXX CURRENTLY BROKEN on iOS due to current background processing implementation
          if (!(isAndroid || isIE)) pending('CURRENTLY BROKEN on iOS (background processing implementation)');

          var dbName = "repeatedly-open-and-delete-faster-5x.db";

          // async test coming up
          stop(1);

          var db = openDatabase({name: dbName, location: 0});
          ok(!!db, 'valid db object 1/5');
          sqlitePlugin.deleteDatabase({name: dbName, location: 0}, function () {
            ok(true, 'success 1/5');

            db = openDatabase({name: dbName, location: 0});
            ok(!!db, 'valid db object 2/5');
            sqlitePlugin.deleteDatabase({name: dbName, location: 0}, function () {
              ok(true, 'success 2/5');

              db = openDatabase({name: dbName, location: 0});
              ok(!!db, 'valid db object 3/5');
              sqlitePlugin.deleteDatabase({name: dbName, location: 0}, function () {
                ok(true, 'success 3/5');

                db = openDatabase({name: dbName, location: 0});
                ok(!!db, 'valid db object 4/5');
                sqlitePlugin.deleteDatabase({name: dbName, location: 0}, function () {
                  ok(true, 'success 4/5');

                  db = openDatabase({name: dbName, location: 0});
                  ok(!!db, 'valid db object 5/5');
                  sqlitePlugin.deleteDatabase({name: dbName, location: 0}, function () {
                    ok(true, 'success 5/5');

                    start(1);
                  }, function (error) {
                    ok(false, 'expected delete 5/5 error callback not to be called for an open database' + error);
                    start(1);
                  });
                }, function (error) {
                  ok(false, 'expected delete 4/5 error callback not to be called for an open database' + error);
                  start(1);
                });
              }, function (error) {
                ok(false, 'expected delete 3/5 error callback not to be called for an open database' + error);
                start(1);
              });
            }, function (error) {
              ok(false, 'expected delete 2/5 error callback not to be called for an open database' + error);
              start(1);
            });
          }, function (error) {
            ok(false, 'expected delete 1/5 error callback not to be called for an open database' + error);
            start(1);
          });
        });

    });

  });

}

if (window.hasBrowser) mytests();
else exports.defineAutoTests = mytests;

/* vim: set expandtab : */
