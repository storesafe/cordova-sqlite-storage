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

// XXX FUTURE TBD split this script further:

var mytests = function() {

  for (var i=0; i<scenarioCount; ++i) {

    describe(scenarioList[i] + ': misc legacy tx test(s)', function() {
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

      describe(scenarioList[i] + ': error mapping test(s)', function() {

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

      });

      describe(scenarioList[i] + ': multiple update test(s)', function() {

        // ref: litehelpers/Cordova-sqlite-storage#128
        // Was caused by a failure to create temporary transaction files on WP8.
        // Workaround by Mark Oppenheim mailto:mark.oppenheim@mnetics.co.uk
        // solved the issue for WP8.
        // @brodybits noticed similar issue possible with Android-sqlite-connector
        // if the Android-sqlite-native-driver part is not built correctly.
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
              expect(res.rowsAffected).toEqual(1);
            }, function (error) {
              ok(false, '1st update failed ' + error);
            });

            tx.executeSql('UPDATE Task SET subject="Task", id="511e3fb7-5aed-4c1a-b1b7-96bf9c5012e2" WHERE id = "511e3fb7-5aed-4c1a-b1b7-96bf9c5012e2"', [], function(tx, res) {
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

    });
  }

  describe('Plugin: plugin-specific sql test(s)', function() {

    var pluginScenarioList = [
      isAndroid ? 'Plugin-implementation-default' : 'Plugin',
      'Plugin-implementation-2'
    ];

    var pluginScenarioCount = isAndroid ? 2 : 1;

    for (var i=0; i<pluginScenarioCount; ++i) {

      describe(pluginScenarioList[i] + ': db.executeSql test(s)', function() {
        var scenarioName = pluginScenarioList[i];
        var suiteName = scenarioName + ': ';
        var isImpl2 = (i === 1);

        // NOTE: MUST be defined in function scope, NOT outer scope:
        var openDatabase = function(first, second, third, fourth, fifth, sixth) {
          //if (!isImpl2) {
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

          if (!isImpl2) {
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

        test_it(suiteName + "Multiple db.executeSql string result test", function() {
          // NOTE: this test checks that for db.executeSql(), the result callback is
          // called exactly once, with the proper result:
          var db = openDatabase("Multiple-DB-sql-String-result-test.db", "1.0", "Demo", DEFAULT_SIZE);

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

      });
    }

  });

  describe('Plugin: plugin-specific error test(s)', function() {

    var pluginScenarioList = [
      isAndroid ? 'Plugin-implementation-default' : 'Plugin',
      'Plugin-implementation-2'
    ];

    var pluginScenarioCount = isAndroid ? 2 : 1;

    for (var i=0; i<pluginScenarioCount; ++i) {

      describe(pluginScenarioList[i] + ': db.executeSql error test(s)', function() {
        var scenarioName = pluginScenarioList[i];
        var suiteName = scenarioName + ': ';
        var isImpl2 = (i === 1);

        // NOTE: MUST be defined in function scope, NOT outer scope:
        var openDatabase = function(first, second, third, fourth, fifth, sixth) {
          //if (!isImpl2) {
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

          if (!isImpl2) {
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

        it(suiteName + "Multiple db.executeSql error result test", function(done) {
          // NOTE: this test checks that for db.executeSql(), the error result
          // callback is called exactly once, with the proper result:
          var db = openDatabase("Multiple-DB-sql-error-result-test.db", "1.0", "Demo", DEFAULT_SIZE);

          var error_result_count = 0;

          // First: syntax error
          db.executeSql("SELCT upper('first') AS uppertext", [], function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
          }, function(e) {
            expect(e).toBeDefined();
            // FUTURE TBD check error fields

            // CHECK that this was not called before
            expect(error_result_count).toBe(0);
            ++error_result_count;
          });

          // Second: SELECT misspelled function name
          db.executeSql("SELECT uper('second') as uppertext", [], function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
          }, function(e) {
            expect(e).toBeDefined();
            // FUTURE TBD check error fields

            expect(error_result_count).toBe(1);
            ++error_result_count;

            // and finish this test:
            done();
          });
        });

      });
    }

  });

  describe('Plugin: more plugin-specific test(s)', function() {

    var pluginScenarioList = [
      isAndroid ? 'Plugin-implementation-default' : 'Plugin',
      'Plugin-implementation-2'
    ];

    var pluginScenarioCount = isAndroid ? 2 : 1;

    for (var i=0; i<pluginScenarioCount; ++i) {

      describe(pluginScenarioList[i] + ': more db.executeSql test(s)', function() {
        var scenarioName = pluginScenarioList[i];
        var suiteName = scenarioName + ': ';
        var isImpl2 = (i === 1);

        // NOTE: MUST be defined in function scope, NOT outer scope:
        var openDatabase = function(first, second, third, fourth, fifth, sixth) {
          //if (!isImpl2) {
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

          if (!isImpl2) {
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

        test_it(suiteName + "PRAGMAs & multiple database transactions mixed together", function() {
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
