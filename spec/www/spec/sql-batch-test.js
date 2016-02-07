/* 'use strict'; */

var MYTIMEOUT = 12000;

var DEFAULT_SIZE = 5000000; // max to avoid popup in safari/ios

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
  'Plugin-implementation-2'
];

var scenarioCount = isAndroid ? 2 : 1;

// simple tests:
var mytests = function() {

  for (var i=0; i<scenarioCount; ++i) {

    describe(scenarioList[i] + ': BATCH SQL test(s)', function() {
      var scenarioName = scenarioList[i];
      var suiteName = scenarioName + ': ';
      var isImpl2 = (i === 1);

      // NOTE: MUST be defined in function scope, NOT outer scope:
      var openDatabase = function(name, ignored1, ignored2, ignored3) {
        if (isImpl2) {
          return window.sqlitePlugin.openDatabase({
            // prevent reuse of database from default db implementation:
            name: 'i2-'+name,
            androidDatabaseImplementation: 2,
            androidLockWorkaround: 1
          });
        } else {
          return window.sqlitePlugin.openDatabase(name, '1.0', 'Test', DEFAULT_SIZE);
        }
      }

      describe(scenarioList[i] + ': Basic sql batch test(s)', function() {

        it(suiteName + 'Single-column batch sql test', function(done) {
          var db = openDatabase('Single-column-batch-sql-test.db', '1.0', 'Test', DEFAULT_SIZE);

          expect(db).toBeDefined();

          db.sqlBatch([
            'DROP TABLE IF EXISTS MyTable',
            'CREATE TABLE MyTable (SampleColumn)',
            [ 'INSERT INTO MyTable VALUES (?)', ['test-value'] ],
          ], function() {
            db.executeSql('SELECT * FROM MyTable', [], function (res) {
              expect(res.rows.item(0).SampleColumn).toBe('test-value');
              done();
            });
          }, function(error) {
            expect(true).toBe(false);
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'batch sql with syntax error', function(done) {
          var db = openDatabase('batch-sql-syntax-error-test.db', '1.0', 'Test', DEFAULT_SIZE);

          expect(db).toBeDefined();

          db.sqlBatch([
            'DROP TABLE IF EXISTS MyTable',
            // syntax error below:
            'CRETE TABLE MyTable (SampleColumn)',
            [ 'INSERT INTO MyTable VALUES (?)', ['test-value'] ],
          ], function() {
            // not expected:
            expect(true).toBe(false);
            done();
          }, function(error) {
            // expected:
            expect(true).toBe(true);
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'batch sql failure-safe semantics', function(done) {
          var db = openDatabase('batch-sql-failure-safe-test.db', '1.0', 'Test', DEFAULT_SIZE);

          expect(db).toBeDefined();

          db.executeSql('DROP TABLE IF EXISTS MyTable');
          db.executeSql('CREATE TABLE MyTable (SampleColumn)');
          db.executeSql('INSERT INTO MyTable VALUES (?)', ['test-value'], function() {
            db.sqlBatch([
              'DELETE FROM MyTable',
              // syntax error below:
              [ 'INSRT INTO MyTable VALUES (?)', 'test-value' ]
            ], function() {
              // not expected:
              expect(true).toBe(false);
              done();
            }, function(error) {
              // check integrity:
              db.executeSql('SELECT * FROM MyTable', [], function (res) {
                expect(res.rows.item(0).SampleColumn).toBe('test-value');
                done();
              });
            });

          }, function(error) {
            expect(true).toBe(false);
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
