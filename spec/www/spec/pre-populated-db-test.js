/* 'use strict'; */

var MYTIMEOUT = 12000;

var DEFAULT_SIZE = 5000000; // max to avoid popup in safari/ios

// FUTURE TODO replace in test(s):
function ok(test, desc) { expect(test).toBe(true); }
function equal(a, b, desc) { expect(a).toEqual(b); } // '=='
function strictEqual(a, b, desc) { expect(a).toBe(b); } // '==='

var isAndroid = /Android/.test(navigator.userAgent);
var isWP8 = /IEMobile/.test(navigator.userAgent); // Matches WP(7/8/8.1)
var isWindows = /Windows /.test(navigator.userAgent); // Windows (8.1)
var isIE = isWindows || isWP8;

var scenarioList = [ isAndroid ? 'Plugin-sqlite-connector' : 'Plugin', 'HTML5', 'Plugin-android.database' ];

var scenarioCount = 1;

// simple tests:
var mytests = function() {

  for (var i=0; i<scenarioCount; ++i) {

    describe(scenarioList[i] + ': pre-populated test(s)', function() {
      var scenarioName = scenarioList[i];
      var suiteName = scenarioName + ': ';

      it(suiteName + 'Pre-populated database test',
        function(done) {
          if (isIE) pending('NOT IMPLEMENTED for Windows Universal or WP8');

          // IMPORTANT: needed in case it is installed by a previous test run
          window.sqlitePlugin.deleteDatabase('pre.db');

          var dbc1 = window.sqlitePlugin.openDatabase({name: 'pre.db', createFromLocation: 1});

          expect(dbc1).toBeDefined()

          dbc1.transaction(function(tx) {

            expect(tx).toBeDefined()

            tx.executeSql('SELECT * from tt', [], function(tx, res) {
              expect(res.rows.item(0).testcol).toEqual('Test-Value');

              // try some changes:
              tx.executeSql('DROP TABLE tt');
              tx.executeSql('CREATE TABLE tt (testcol)');
              tx.executeSql('INSERT INTO tt VALUES (?)', ['new-value']);
            });
          }, function(e) {
            expect(false).toBe(true);
            done();
          }, function() {
            dbc1.close(function() {
              // try opening it again:
              var dbc2 = window.sqlitePlugin.openDatabase({name: 'pre.db', createFromLocation: 1});

              dbc2.transaction(function(tx) {
                expect(tx).toBeDefined()

                // verify that the changes were not overwritten:
                tx.executeSql('SELECT * from tt', [], function(tx, res) {
                  expect(res.rows.item(0).testcol).toEqual('new-value');

                  done();
                });
              });
            });
          });
        }, MYTIMEOUT);
    });
  };
}

if (window.hasBrowser) mytests();
else exports.defineAutoTests = mytests;

/* vim: set expandtab : */
