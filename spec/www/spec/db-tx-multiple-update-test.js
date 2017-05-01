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

var isWindows = /Windows /.test(navigator.userAgent); // Windows
var isAndroid = !isWindows && /Android/.test(navigator.userAgent);

// NOTE: While in certain version branches there is no difference between
// the default Android implementation and implementation #2,
// this test script will also apply the androidLockWorkaround: 1 option
// in case of implementation #2.
var scenarioList = [
  isAndroid ? 'Plugin-implementation-default' : 'Plugin',
  'HTML5',
  'Plugin-implementation-2'
];

var scenarioCount = (!!window.hasWebKitBrowser) ? (isAndroid ? 3 : 2) : 1;

var mytests = function() {

  for (var i=0; i<scenarioCount; ++i) {

    describe(scenarioList[i] + ': db tx multiple update test(s)', function() {
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
  }

}

if (window.hasBrowser) mytests();
else exports.defineAutoTests = mytests;

/* vim: set expandtab : */
