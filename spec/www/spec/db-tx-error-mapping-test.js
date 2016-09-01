/* 'use strict'; */

var MYTIMEOUT = 12000;

var DEFAULT_SIZE = 5000000; // max to avoid popup in safari/ios

// FUTURE TODO replace in test(s):
function ok(test, desc) { expect(test).toBe(true); }

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

  for (var i=0; i<scenarioCount; ++i) {

    describe(scenarioList[i] + ': db tx error mapping test(s)', function() {
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
            androidDatabaseImplementation: 2,
            androidLockWorkaround: 1,
            location: 1
          });
        }
        if (isWebSql) {
          return window.openDatabase(name, "1.0", "Demo", DEFAULT_SIZE);
        } else {
          return window.sqlitePlugin.openDatabase({name: name, location: 0});
        }
      }


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
              expect(error).toBeDefined();
              expect(error.code).toBeDefined();
              expect(error.message).toBeDefined();

              // BROKEN on Windows/WP8:
              if (!isWindows && !isWP8)
                expect(error.code).toBe(5);

              // BROKEN (INCONSISTENT) on Windows (OK on wp8 platform):
              if (!isWindows)
                expect(error.message).toMatch(/near .*\"*\"*:*syntax error/);

              // From built-in Android database exception message:
              if (!isWebSql && isAndroid && isImpl2)
                expect(error.message).toMatch(/near .*\"*\"*:*syntax error.*code 1/);

              // SQLite error code part of Web SQL error.message:
              if (isWebSql)
                expect(error.message).toMatch(/1 near .*\"*\"*:*syntax error/);

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
              expect(error).toBeDefined();
              expect(error.code).toBeDefined();
              expect(error.message).toBeDefined();

              // BROKEN on Windows/WP8:
              if (!isWindows && !isWP8)
                expect(error.code).toBe(6);

              if (isWebSql) // WebSQL may have a missing 'r' (iOS):
                expect(error.message).toMatch(/constr?aint fail/);
              else if (!isWindows && !isWP8) // BROKEN (INCONSISTENT) on Windows/WP8
                expect(error.message).toMatch(/constraint fail/);

              // From built-in Android database exception message:
              if (!isWebSql && isAndroid && isImpl2)
                expect(error.message).toMatch(/not unique.*code 19/);

              // SQLite error code part of Web SQL error.message (Android):
              if (isWebSql && isAndroid)
                expect(error.message).toMatch(/19 .*constraint fail/);

              // SQLite error code part of Web SQL error.message (iOS):
              if (isWebSql && !isAndroid)
                expect(error.message).toMatch(/19 .*not unique/);

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

    });
  }

}

if (window.hasBrowser) mytests();
else exports.defineAutoTests = mytests;

/* vim: set expandtab : */
