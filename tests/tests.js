/* 'use strict'; */

var MYTIMEOUT = 12000;

var DEFAULT_SIZE = 5000000; // max to avoid popup in safari/ios

// FUTURE TBD replace in test(s):
function ok(test, desc) { expect(test).toBe(true); }
function equal(a, b, desc) { expect(a).toEqual(b); } // '=='
function strictEqual(a, b, desc) { expect(a).toBe(b); } // '==='

var isAndroid = /Android/.test(navigator.userAgent);
var isWindows = /Windows NT/.test(navigator.userAgent); // Windows [NT] (8.1)
var isWP8 = /IEMobile/.test(navigator.userAgent); // WP(8)
// FUTURE:
//var isWindowsPhone = /Windows Phone 8.1/.test(navigator.userAgent); // Windows [NT] (8.1)
var isIE = isWindows || isWP8;
var isWebKit = !isIE; // TBD [Android or iOS]

var scenarioList = [ 'Plugin', 'HTML5' ];

//var scenarioCount = isWebKit ? 2 : 1;
var scenarioCount = 1;

exports.defineAutoTests = function() {

  describe('Very simple legacy tests', function() {

    for (var i=0; i<scenarioCount; ++i) {

      describe(scenarioList[i] + ': simple sql test(s)', function() {
        var scenarioName = scenarioList[i];
        var suiteName = scenarioName + ': ';
        var isWebSql = (i !== 0);

        // NOTE: MUST be defined in function scope, NOT outer scope:
        var openDatabase = function(name, ignored1, ignored2, ignored3) {
          if (isWebSql) {
            return window.openDatabase(name, "1.0", "Demo", DEFAULT_SIZE);
          } else {
            return sqlitePlugin.openDatabase(name, "1.0", "Demo", DEFAULT_SIZE);
          }
        }

        it(suiteName + "US-ASCII String manipulation test", function(done) {
          var db = openDatabase("Simple-ASCII-string-test.db", "1.0", "Demo", DEFAULT_SIZE);

          expect(db).toBeDefined()

          stop();

          db.transaction(function(tx) {

            expect(tx).toBeDefined()

            tx.executeSql("select upper('Some US-ASCII text') as uppertext", [], function(tx, res) {
              console.log("res.rows.item(0).uppertext: " + res.rows.item(0).uppertext);
              expect(res.rows.item(0).uppertext).toEqual("SOME US-ASCII TEXT");

              done();
            });
          });
        });

        it(suiteName + 'Simple INSERT test: check insertId & rowsAffected in result', function(done) {

          var db = openDatabase("Simple-INSERT-test.db", "1.0", "Demo", DEFAULT_SIZE);

          ok(!!db, "db object");

          db.transaction(function(tx) {
            ok(!!tx, "tx object");

            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)');

            tx.executeSql("INSERT INTO test_table (data, data_num) VALUES (?,?)", ["test", 100], function(tx, res) {
              console.log("insertId: " + res.insertId + " -- probably 1");
              console.log("rowsAffected: " + res.rowsAffected + " -- should be 1");

              ok(!!res.insertId, "Valid res.insertId");
              equal(res.rowsAffected, 1, "res rows affected");

              done();
            });

          });
        }, MYTIMEOUT);

      });
    }
  });
};

/* vim: set expandtab : */
