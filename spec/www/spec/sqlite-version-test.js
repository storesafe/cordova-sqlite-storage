/* 'use strict'; */

var MYTIMEOUT = 12000;

var DEFAULT_SIZE = 5000000; // max to avoid popup in safari/ios

var isWP8 = /IEMobile/.test(navigator.userAgent); // Matches WP(7/8/8.1)
var isWindows = /Windows /.test(navigator.userAgent); // Windows (8.1)
var isAndroid = !isWindows && /Android/.test(navigator.userAgent);

// The following openDatabase settings are used for Plugin-implementation-2
// on Android:
// - androidDatabaseImplementation: 2
// - androidLockWorkaround: 1
var scenarioList = [
  isAndroid ? 'Plugin-implementation-default' : 'Plugin',
  'HTML5',
  'Plugin-implementation-2'
];

var scenarioCount = (!!window.hasWebKitBrowser) ? (isAndroid ? 3 : 2) : 1;

var mytests = function() {

  for (var i=0; i<scenarioCount; ++i) {

    describe(scenarioList[i] + ': sqlite version test(s)', function() {
      var scenarioName = scenarioList[i];
      var suiteName = scenarioName + ': ';
      var isWebSql = (i === 1);
      var isImpl2 = (i === 2);

      // NOTE 1: MUST be defined in proper describe function scope, NOT outer scope.
      // NOTE 2: Using same database name in this script to avoid creating extra,
      //         unneeded database files.
      var openDatabase = function(name_ignored, ignored1, ignored2, ignored3) {
        var name = 'sqlite-version-test.db';
        if (isImpl2) {
          return window.sqlitePlugin.openDatabase({
            // prevent reuse of database from default db implementation:
            name: 'i2-'+name,
            androidDatabaseImplementation: 2,
            androidLockWorkaround: 1,
            location: 'default'
          });
        }
        if (isWebSql) {
          return window.openDatabase(name, "1.0", "Demo", DEFAULT_SIZE);
        } else {
          return window.sqlitePlugin.openDatabase({name: name, location: 'default'});
        }
      }

      describe(suiteName + 'basic sqlite version test(s)', function() {

        it(suiteName + 'Check sqlite version (check pattern ONLY for WebKit Web SQL & androidDatabaseImplementation: 2)', function(done) {
          var db = openDatabase("check-sqlite-version.db", "1.0", "Demo", DEFAULT_SIZE);

          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT SQLITE_VERSION() AS myResult', [], function(tx_ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              // Check pattern (both Web SQL & plugin)
              expect(rs.rows.item(0).myResult).toMatch(/3\.[0-9]+\.[0-9]+/);
              // Check specific [plugin only]:
              if (!isWebSql && !(!isWindows && isAndroid && isImpl2))
                expect(rs.rows.item(0).myResult).toBe('3.22.0');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

      });

      describe(suiteName + 'sqlite encoding test(s)', function() {

        it(suiteName + 'Check internal database encoding: UTF-16le for Windows, UTF-8 for others (plugin ONLY)', function(done) {
          if (isWebSql) pending('SKIP: NOT SUPPORTED for (WebKit) Web SQL');

          var db = openDatabase("Check-sqlite-PRAGMA-encoding.db", "1.0", "Demo", DEFAULT_SIZE);

          expect(db).toBeDefined();

          db.executeSql('PRAGMA encoding', [], function(rs) {
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            if (isWindows)
              expect(rs.rows.item(0).encoding).toBe('UTF-16le');
            else
              expect(rs.rows.item(0).encoding).toBe('UTF-8');

            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

      });

      describe(suiteName + 'default page/cache size check(s)', function() {

        it(suiteName + 'Check default page size (plugin ONLY)', function(done) {
          // ref: litehelpers/Cordova-sqlite-storage#781
          if (isWebSql) pending('SKIP: NOT SUPPORTED for (WebKit) Web SQL');

          var db = openDatabase('default-page-size.db');

          db.executeSql('PRAGMA page_size', null, function(rs) {
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            if (!isWebSql && !isWindows && isAndroid && isImpl2)
              expect(rs.rows.item(0).page_size).toBe(4096); // CORRECT [androidDatabaseImplementation: 2]
            else
              expect(rs.rows.item(0).page_size).toBe(1024); // XXX TBD OLD VALUE USED IN THIS PLUGIN VERSION ref: litehelpers/Cordova-sqlite-storage#781

            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });

        }, MYTIMEOUT);

        it(suiteName + 'Check default cache size (plugin ONLY)', function(done) {
          // ref: litehelpers/Cordova-sqlite-storage#781
          if (isWebSql) pending('SKIP: NOT SUPPORTED for (WebKit) Web SQL');

          var db = openDatabase('default-cache-size.db');

          db.executeSql('PRAGMA cache_size', null, function(rs) {
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            var resultRow = rs.rows.item(0);
            expect(resultRow).toBeDefined();
            expect(resultRow.cache_size).toBeDefined();
            if (!isWebSql && !isWindows && isAndroid && isImpl2 &&
                (/Android 8/.test(navigator.userAgent)))
              expect(resultRow.cache_size).toBe(-2000); // NEW VALUE for androidDatabaseImplementation: 2, Android 8.x
            else
              expect(resultRow.cache_size).toBe(2000); // XXX TBD OLD VALUE USED IN THIS PLUGIN VERSION & androidDatabaseImplementation: 2 for Android 4.x-7.x

            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });

        }, MYTIMEOUT);

      });

      describe(suiteName + 'additional sqlite check(s)', function() {

        it(suiteName + 'Check default PRAGMA journal_mode setting (plugin ONLY)', function(done) {
          if (isWebSql) pending('SKIP: NOT SUPPORTED for (WebKit) Web SQL');

          var db = openDatabase("Check-sqlite-PRAGMA-encoding.db", "1.0", "Demo", DEFAULT_SIZE);

          expect(db).toBeDefined();

          db.executeSql('PRAGMA journal_mode', [], function(rs) {
            expect(rs).toBeDefined();
            expect(rs.rows).toBeDefined();
            expect(rs.rows.length).toBe(1);
            // DEFAULT PRAGMA journal_mode setting is
            // DIFFERENT for builtin android.database implementation:
            if (!isWindows && isAndroid && isImpl2)
              expect(rs.rows.item(0).journal_mode).toBe(
                (/Android 8.1.99/.test(navigator.userAgent)) ? 'wal' :
                (/Android 8/.test(navigator.userAgent)) ? 'truncate' :
                'persist');
            else
              expect(rs.rows.item(0).journal_mode).toBe('delete');

            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

      });

    });

  }

}

if (window.hasBrowser) mytests();
else exports.defineAutoTests = mytests;

/* vim: set expandtab : */
