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
// the default Android implementation and implementation #2,
// this test script will also apply the androidLockWorkaround: 1 option
// in case of implementation #2.
var scenarioList = [
  isAndroid ? 'Plugin-implementation-default' : 'Plugin',
  'HTML5',
  'Plugin-implementation-2'
];

var scenarioCount = (!!window.hasWebKitWebSQL) ? (isAndroid ? 3 : 2) : 1;

function logSuccess(message) { console.log('OK - ' + message); }
function logError(message) { console.log('FAILED - ' + message); }

var mytests = function() {

  for (var i=0; i<scenarioCount; ++i) {

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

        it(suiteName + ' open same db twice with string test', function (done) {
          var dbName = 'open-same-db-twice-string-test.db';

          var db1 = openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE);
          var db2 = openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE);

          expect(db1).toBeTruthy(); // valid db1 database handle object
          expect(db2).toBeTruthy(); // valid db2 database handle object

          // Replacement for QUnit stop()/start() functions:
          var checkCount = 0;
          var expectedCheckCount = 2;

          db1.readTransaction(function(tx) {
            expect(tx).toBeTruthy(); // valid db1 tx object
            tx.executeSql("select upper('first') as uppertext", [], function(tx, result) {
              expect(result).toBeTruthy(); // valid db1 read tx result object
              expect(result.rows.item(0).uppertext).toBe('FIRST'); // check db1 read tx result
              if (++checkCount === expectedCheckCount) done();
            }, function(error) {
              // ERROR NOT EXPECTED here:
              logError(error);
              expect(error.message).toBe('--');
              done.fail();
            });
          }, function(error) {
            // ERROR NOT EXPECTED here:
            logError(error);
            expect(error.message).toBe('--');
            done.fail();
          });
          db2.readTransaction(function(tx) {
            expect(tx).toBeTruthy(); // valid db2 tx object
            tx.executeSql("select upper('second') as uppertext", [], function(tx, result) {
              expect(result).toBeTruthy(); // valid db2 read tx result object
              expect(result.rows.item(0).uppertext).toBe('SECOND'); // check db2 read tx result
              if (++checkCount === expectedCheckCount) done();
            }, function(error) {
              // ERROR NOT EXPECTED here:
              logError(error);
              expect(error.message).toBe('--');
              done.fail();
            });
          }, function(error) {
            // ERROR NOT EXPECTED here:
            logError(error);
            expect(error.message).toBe('--');
            done.fail();
          });
        });

        it(suiteName + ' test simultaneous transactions (same db handle)', function (done) {
          var db = openDatabase("Database-Simultaneous-Tx", "1.0", "Demo", DEFAULT_SIZE);

          var numDone = 0;
          function checkDone() {
            if (++numDone == 2) {
              done();
            }
          }

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test', [], function () {
              tx.executeSql('CREATE TABLE test (name);');

            });
          }, function(error) {
            // ERROR NOT EXPECTED here:
            logError(error);
            expect(error.message).toBe('--');
            done.fail();
          }, function () {
            db.transaction(function(tx) {
              tx.executeSql('INSERT INTO test VALUES ("foo")', [], function () {
                tx.executeSql('SELECT * FROM test', [], function (tx, res) {
                  expect(res.rows.length).toBe(1); // only one row
                  expect(res.rows.item(0).name).toBe('foo');

                  tx.executeSql('SELECT * FROM bogustable'); // force rollback
                });
              });
            }, function(error) {
              // EXPECTED RESULT - expected error:
              expect(error).toBeDefined();
              expect(error.message).toBeDefined();
              checkDone();
            }, function () {
              // NOT EXPECTED - should have rolled back:
              logError('should have rolled back');
              expect(error.message).toBe('--');
              done.fail();
            });

            db.transaction(function(tx) {
              tx.executeSql('INSERT INTO test VALUES ("bar")', [], function () {
                tx.executeSql('SELECT * FROM test', [], function (tx, res) {
                  expect(res.rows.length).toBe(1); // only one row
                  expect(res.rows.item(0).name).toBe('bar');

                  tx.executeSql('SELECT * FROM bogustable'); // force rollback
                });
              });
            }, function(error) {
              // EXPECTED RESULT - expected error:
              expect(error).toBeDefined();
              expect(error.message).toBeDefined();
              checkDone();
            }, function () {
              // NOT EXPECTED - should have rolled back:
              logError('should have rolled back');
              done.fail();
            });
          });

        });

        it(suiteName + ' test simultaneous transactions, different db handles (same db)', function (done) {
          var dbName = "Database-Simultaneous-Tx-Diff-DB-handles";

          var db = openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE);

          var numDone = 0;
          function checkDone() {
            if (++numDone == 2) {
              done();
            }
          }

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test', [], function () {
              tx.executeSql('CREATE TABLE test (name);');

            });
          }, function(error) {
            // ERROR NOT EXPECTED here:
            logError(error);
            expect(error.message).toBe('--');
            done.fail();
          }, function () {
            var db1 = openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE);
            db1.transaction(function(tx) {
              tx.executeSql('INSERT INTO test VALUES ("foo")', [], function () {
                tx.executeSql('SELECT * FROM test', [], function (tx, res) {
                  expect(res.rows.length).toBe(1); // only one row
                  expect(res.rows.item(0).name).toBe('foo');

                  tx.executeSql('SELECT * FROM bogustable'); // force rollback
                });
              });
            }, function(error) {
              // EXPECTED RESULT - expected error:
              expect(error).toBeDefined();
              expect(error.message).toBeDefined();
              checkDone();
            }, function () {
              // NOT EXPECTED - should have rolled back:
              logError('should have rolled back');
              done.fail();
            });

            var db2 = openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE);

            db2.transaction(function(tx) {
              tx.executeSql('INSERT INTO test VALUES ("bar")', [], function () {
                tx.executeSql('SELECT * FROM test', [], function (tx, res) {
                  expect(res.rows.length).toBe(1); // only one row
                  expect(res.rows.item(0).name).toBe('bar');

                  tx.executeSql('SELECT * FROM bogustable'); // force rollback
                });
              });
            }, function(error) {
              // EXPECTED RESULT - expected error:
              expect(error).toBeDefined();
              expect(error.message).toBeDefined();
              checkDone();
            }, function () {
              // NOT EXPECTED - should have rolled back:
              logError('should have rolled back');
              done.fail();
            });
          });

        });

        it(suiteName + ' can open two databases at the same time', function (done) {
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

          // Quick replacement for QUnit stop()/start() functions:
          var checkCount = 0;
          var expectedCheckCount = 12;

          // create overlapping transactions
          db1.transaction(function (tx1) {
            db2.transaction(function (tx2) {

              tx2.executeSql('INSERT INTO test2 VALUES (2)', [], function (tx, result) {
                logSuccess('inserted into second database');
                ++checkCount;
              });
              tx2.executeSql('SELECT * from test2', [], function (tx, result) {
                expect(result.rows.item(0).x).toBe(2); // selected from second database
                ++checkCount;
              });
            }, function (error) {
              // ERROR NOT EXPECTED here:
              logError('transaction 2 failed ' + error);
              expect(error.message).toBe('--');
              done.fail();
            }, function () {
              logSuccess('transaction 2 committed');
              ++checkCount;
            });

            tx1.executeSql('INSERT INTO test1 VALUES (1)', [], function (tx, result) {
              logSuccess('inserted into first database');
              ++checkCount;
            });

            tx1.executeSql('SELECT * from test1', [], function (tx, result) {
              expect(result.rows.item(0).x).toBe(1); // selected from first database
              ++checkCount;
            });
          }, function (error) {
            // ERROR NOT EXPECTED here:
            logError('transaction 1 failed ' + error);
            expect(error.message).toBe('--');
            done.fail();
          }, function () {
            logSuccess('transaction 1 committed');
            if (++checkCount === expectedCheckCount) done();
          });

          // now that the databases are truly open, do it again!
          // - should wait for first db1.transaction() call to finish
          // - must check for - checkCount === expectedCheckCount in both
          //   db1.transaction() callback & db2.transaction() callback
          //   since it is not certain which will finish first or last.
          db1.transaction(function (tx1) {
            db2.transaction(function (tx2) {

              tx2.executeSql('INSERT INTO test2 VALUES (2)', [], function (tx, result) {
                logSuccess('inserted into second database');
                ++checkCount;
              });
              tx2.executeSql('SELECT * from test2', [], function (tx, result) {
                expect(result.rows.item(0).x).toBe(2); // selected from second database
                ++checkCount;
              });
            }, function (error) {
              // ERROR NOT EXPECTED here:
              logError('transaction 2 failed ' + error);
              expect(error.message).toBe('--');
              done.fail();
            }, function () {
              logSuccess('transaction 2 committed');
              if (++checkCount === expectedCheckCount) done();
            });

            tx1.executeSql('INSERT INTO test1 VALUES (1)', [], function (tx, result) {
              logSuccess('inserted into first database');
              ++checkCount;
            });

            tx1.executeSql('SELECT * from test1', [], function (tx, result) {
              expect(result.rows.item(0).x).toBe(1); // selected from first database
              ++checkCount;
            });
          }, function (error) {
            // ERROR NOT EXPECTED here:
            logError('transaction 1 failed ' + error);
            expect(error.message).toBe('--');
            done.fail();
          }, function () {
            logSuccess('transaction 1 committed');
            if (++checkCount === expectedCheckCount) done();
          });
        });

        it(suiteName + ' same database file with separate writer/reader db handles', function (done) {
          var dbname = 'writer-reader-test.db';
          var dbw = openDatabase(dbname, "1.0", "Demo", DEFAULT_SIZE);
          var dbr = openDatabase(dbname, "1.0", "Demo", DEFAULT_SIZE);

          dbw.transaction(function (tx) {
            tx.executeSql('DROP TABLE IF EXISTS tt');
            tx.executeSql('CREATE TABLE IF NOT EXISTS tt (test_data)');
            tx.executeSql('INSERT INTO tt VALUES (?)', ['My-test-data']);
          }, function(error) {
            // ERROR NOT EXPECTED here:
            logError(error.message);
            expect(error.message).toBe('--');
            done.fail();
          }, function() {
            dbr.readTransaction(function (tx) {
              tx.executeSql('SELECT test_data from tt', [], function (tx, result) {
                expect(result.rows.item(0).test_data).toBe('My-test-data'); // read data from reader handle
                done();
              });
            }, function(error) {
              // ERROR NOT EXPECTED here:
              logError(error.message);
              expect(error.message).toBe('--');
              done.fail();
            });
          });
        });

        it(suiteName + ' same database file with multiple writer db handles', function (done) {
          var dbname = 'multi-writer-test.db';
          var dbw1 = openDatabase(dbname, "1.0", "Demo", DEFAULT_SIZE);
          var dbw2 = openDatabase(dbname, "1.0", "Demo", DEFAULT_SIZE);
          var dbr = openDatabase(dbname, "1.0", "Demo", DEFAULT_SIZE);

          dbw1.transaction(function (tx) {
            tx.executeSql('DROP TABLE IF EXISTS tt');
            tx.executeSql('CREATE TABLE IF NOT EXISTS tt (test_data)');
          }, function(error) {
            // ERROR NOT EXPECTED here:
            logError(error.message);
            expect(error.message).toBe('--');
            done.fail();
          }, function() {
            dbw2.transaction(function (tx) {
              tx.executeSql('INSERT INTO tt VALUES (?)', ['My-test-data']);
            }, function(error) {
              // ERROR NOT EXPECTED here:
              logError(error.message);
              expect(error.message).toBe('--');
              done.fail();
            }, function() {
              dbr.readTransaction(function (tx) {
                tx.executeSql('SELECT test_data from tt', [], function (tx, result) {
                  expect(result.rows.item(0).test_data).toBe('My-test-data'); // read data from reader handle
                  done();
                });
              }, function(error) {
                // ERROR NOT EXPECTED here:
                logError(error.message);
                expect(error.message).toBe('--');
                done.fail();
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
