/* 'use strict'; */

var MYTIMEOUT = 12000;

// NOTE: DEFAULT_SIZE wanted depends on type of browser

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
// the default Android implementation and implementation #2,
// this test script will also apply the androidLockWorkaround: 1 option
// in case of implementation #2.
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

    describe(scenarioList[i] + ': simultaneous tx access test(s)', function() {
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

        test_it(suiteName + ' test simultaneous transactions (same db handle)', function () {
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

        test_it(suiteName + ' test simultaneous transactions, different db handles (same db)', function () {
          stop();

          var dbName = "Database-Simultaneous-Tx-Diff-DB-handles";

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

    });
  }

}

if (window.hasBrowser) mytests();
else exports.defineAutoTests = mytests;

/* vim: set expandtab : */
