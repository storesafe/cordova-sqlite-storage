/* 'use strict'; */

var MYTIMEOUT = 12000;

var DEFAULT_SIZE = 5000000; // max to avoid popup in safari/ios

// FUTURE TODO replace in test(s):
function ok(test, desc) { expect(test).toBe(true); }
function equal(a, b, desc) { expect(a).toEqual(b); } // '=='

var isWP8 = /IEMobile/.test(navigator.userAgent); // Matches WP(7/8/8.1)
var isWindows = /Windows /.test(navigator.userAgent); // Windows (8.1)
var isAndroid = !isWindows && /Android/.test(navigator.userAgent);
var isIE = isWindows || isWP8;
var isWebKit = !isIE; // TBD [Android or iOS]

// NOTE: In the core-master branch there is no difference between the default
// implementation and implementation #2. But the test will also apply
// the androidLockWorkaround: 1 option in the case of implementation #2.
var scenarioList = [
  isAndroid ? 'Plugin-implementation-default' : 'Plugin',
  'HTML5',
  'Plugin-implementation-2'
];

var scenarioCount = (!!window.hasWebKitBrowser) ? (isAndroid ? 3 : 2) : 1;

var mytests = function() {

  for (var i=0; i<scenarioCount; ++i) {

    describe(scenarioList[i] + ': tx string test(s)', function() {
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

        it(suiteName + "US-ASCII String manipulation test", function(done) {

          var db = openDatabase("ASCII-string-test.db", "1.0", "Demo", DEFAULT_SIZE);

          expect(db).toBeDefined();

          db.transaction(function(tx) {

            expect(tx).toBeDefined();

            tx.executeSql("select upper('Some US-ASCII text') as uppertext", [], function(tx, res) {
              expect(res.rows.item(0).uppertext).toBe("SOME US-ASCII TEXT");

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        });

        it(suiteName + ' string encoding test with UNICODE \\u0000', function (done) {
          if (isWindows) pending('BROKEN for Windows'); // XXX
          if (isWP8) pending('BROKEN for WP(8)'); // [BUG #202] UNICODE characters not working with WP(8)
          if (isAndroid && !isWebSql && !isOldImpl) pending('BROKEN for Android (default sqlite-connector version)'); // XXX

          var dbName = "Unicode-hex-test";
          var db = openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function (tx) {
            tx.executeSql('SELECT hex("foob") AS hexvalue', [], function (tx, res) {
              console.log(suiteName + "res.rows.item(0).hexvalue: " + res.rows.item(0).hexvalue);

              var expected_hexvalue_length = res.rows.item(0).hexvalue.length;

              tx.executeSql('SELECT hex(?) AS hexvalue', ['\u0000foo'], function (tx, res) {
                //console.log(suiteName + "res.rows.item(0).hexvalue: " + res.rows.item(0).hexvalue);

                expect(res.rows.length).toBe(1);
                expect(res.rows.item(0).hexvalue).toBeDefined();

                var hexvalue = res.rows.item(0).hexvalue;

                // varies between Chrome-like (UTF-8)
                // and Safari-like (UTF-16)
                expect(['000066006F006F00', '00666F6F'].indexOf(hexvalue)).not.toBe(-1);

                // ensure this matches our expectation of that database's
                // default encoding
                expect(hexvalue.length).toBe(expected_hexvalue_length);

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });

            });
          }, function(err) {
            ok(false, 'unexpected error: ' + err.message);
          });
        });

        it(suiteName + "CR-LF String test", function(done) {
          var db = openDatabase("CR-LF-String-test.db", "1.0", "Demo", DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql("select upper('cr\r\nlf') as uppertext", [], function(tx, res) {
              ok(res.rows.item(0).uppertext !== "CR\nLF", "CR-LF should not be converted to \\n");
              equal(res.rows.item(0).uppertext, "CR\r\nLF", "CRLF ok");
              tx.executeSql("select upper('Carriage\rReturn') as uppertext", [], function(tx, res) {
                equal(res.rows.item(0).uppertext, "CARRIAGE\rRETURN", "CR ok");
                tx.executeSql("select upper('New\nLine') as uppertext", [], function(tx, res) {
                  equal(res.rows.item(0).uppertext, "NEW\nLINE", "newline ok");

                  // Close (plugin only) & finish:
                  (isWebSql) ? done() : db.close(done, done);
                });
              });
            });
          });
        });

        it(suiteName + "String tab test", function(done) {
          var db = openDatabase("String-tab-test.db", "1.0", "Demo", DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql("select upper('first\tsecond') as uppertext", [], function(tx, res) {
              expect(res.rows.item(0).uppertext).toBe('FIRST\tSECOND');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        });

        it(suiteName + "String vertical tab test", function(done) {
          if (isWP8) pending('BROKEN for WP(8)'); // [BUG #202] UNICODE characters not working with WP(8)

          var db = openDatabase("String-vertical-tab-test.db", "1.0", "Demo", DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql("select upper('first\vsecond') as uppertext", [], function(tx, res) {
              expect(res.rows.item(0).uppertext).toBe('FIRST\vSECOND');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        });

        it(suiteName + "String form feed test", function(done) {
          if (isWP8) pending('BROKEN for WP(8)'); // [BUG #202] UNICODE characters not working with WP(8)

          var db = openDatabase("String-form-feed-test.db", "1.0", "Demo", DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql("select upper('first\fsecond') as uppertext", [], function(tx, res) {
              expect(res.rows.item(0).uppertext).toBe('FIRST\fSECOND');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        });

        it(suiteName + "String backspace test", function(done) {
          if (isWP8) pending('BROKEN for WP(8)'); // [BUG #202] UNICODE characters not working with WP(8)

          var db = openDatabase("String-backspace-test.db", "1.0", "Demo", DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql("select upper('first\bsecond') as uppertext", [], function(tx, res) {
              expect(res.rows.item(0).uppertext).toBe('FIRST\bSECOND');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        });

        // NOTE: the next two tests show that for iOS:
        // - UNICODE \u2028 line separator from Javascript to Objective-C is working ok
        // - UNICODE \u2028 line separator from Objective-C to Javascript is BROKEN
        // ref: litehelpers/Cordova-sqlite-storage#147
        it(suiteName + "UNICODE \\u2028 line separator string length", function(done) {
          if (isWP8) pending('BROKEN for WP(8)'); // [BUG #202] Certain UNICODE characters not working with WP(8)

          // NOTE: this test verifies that the UNICODE line separator (\u2028)
          // is seen by the sqlite implementation OK:
          var db = openDatabase("UNICODE-line-separator-string-length.db", "1.0", "Demo", DEFAULT_SIZE);

          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql("select length(?) as stringlength", ['First\u2028Second'], function (tx, res) {
              expect(res.rows.item(0).stringlength).toBe(12);

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        });

        it(suiteName + ' handles UNICODE \\u2028 line separator correctly [string test]', function (done) {

          if (isWP8) pending('BROKEN for WP(8)'); // [BUG #202] UNICODE characters not working with WP(8)
          if (!(isWebSql || isAndroid || isIE)) pending('BROKEN for iOS'); // XXX [BUG #147] (no callback received)

          // NOTE: since the above test shows the UNICODE line separator (\u2028)
          // is seen by the sqlite implementation OK, it is now concluded that
          // the failure is caused by the Objective-C JSON result encoding.
          var db = openDatabase("UNICODE-line-separator-string-lowertext.db", "1.0", "Demo", DEFAULT_SIZE);

          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql("select lower(?) as lowertext", ['First\u2028Second'], function (tx, res) {
              expect(res).toBeDefined();
              expect(res.rows.item(0).lowertext).toBe("first\u2028second");

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        });

        // NOTE: the next two tests repeat the above for UNICODE \u2029 paragraph separator
        // for iOS:
        // - UNICODE \u2029 line separator from Javascript to Objective-C is working ok
        // - UNICODE \u2029 line separator from Objective-C to Javascript is BROKEN
        // ref: litehelpers/Cordova-sqlite-storage#147
        it(suiteName + "UNICODE \\u2029 line separator string length", function(done) {
          if (isWP8) pending('BROKEN for WP(8)'); // [BUG #202] Certain UNICODE characters not working with WP(8)

          // NOTE: this test verifies that the UNICODE paragraph separator (\u2029)
          // is seen by the sqlite implementation OK:
          var db = openDatabase("UNICODE-paragraph-separator-string-length.db", "1.0", "Demo", DEFAULT_SIZE);

          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            var text = 'Abcd\u20281234';
            tx.executeSql("select length(?) as stringlength", ['First\u2029Second'], function (tx, res) {
              expect(res.rows.item(0).stringlength).toBe(12);

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        });

        it(suiteName + ' handles UNICODE \\u2029 line separator correctly [string test]', function (done) {

          if (isWP8) pending('BROKEN for WP(8)'); // [BUG #202] UNICODE characters not working with WP(8)
          if (!(isWebSql || isAndroid || isIE)) pending('BROKEN for iOS'); // XXX [BUG #147] (no callback received)

          // NOTE: since the above test shows the UNICODE paragraph separator (\u2029)
          // is seen by the sqlite implementation OK, it is now concluded that
          // the failure is caused by the Objective-C JSON result encoding.
          var db = openDatabase("UNICODE-paragraph-separator-string-lowertext.db", "1.0", "Demo", DEFAULT_SIZE);

          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql("select lower(?) as lowertext", ['First\u2029Second'], function (tx, res) {
              expect(res).toBeDefined();
              expect(res.rows.item(0).lowertext).toBe("first\u2029second");

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        });

        it(suiteName + 'UTF-8 string test', function(done) {
          var db = openDatabase("UTF8-string-test.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {

            tx.executeSql("SELECT UPPER('Test ¢ é €') AS upper_result", [], function(ignored, rs) {
              if (isAndroid && isWebSql) expect(rs.rows.item(0).upper_result).toBe('TEST ¢ É €');
              else expect(rs.rows.item(0).upper_result).toBe('TEST ¢ é €');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        });

        it(suiteName + 'UTF-8 string binding test', function(done) {
          var db = openDatabase("UTF8-string-binding-test.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {

            tx.executeSql('SELECT UPPER(?) AS upper_result', ['Test ¢ é €'], function(ignored, rs) {
              if (isAndroid && isWebSql) expect(rs.rows.item(0).upper_result).toBe('TEST ¢ É €');
              else expect(rs.rows.item(0).upper_result).toBe('TEST ¢ é €');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        });

        it(suiteName + 'Double-quote string test', function(done) {
          var db = openDatabase("Double-quote-string-test.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {

            tx.executeSql("SELECT UPPER('\"String\" test') AS upper_result", [], function(ignored, rs) {
              expect(rs.rows.item(0).upper_result).toBe('"STRING" TEST');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        });

        it(suiteName + 'Double-quote string binding test', function(done) {
          var db = openDatabase("Double-quote-string-binding-test.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {

            tx.executeSql('SELECT UPPER(?) AS upper_result', ['"String" test'], function(ignored, rs) {
              expect(rs.rows.item(0).upper_result).toBe('"STRING" TEST');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        });

        it(suiteName + 'Backslash string test', function(done) {
          var db = openDatabase("Backslash-string-test.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {

            tx.executeSql("SELECT UPPER('Test \\') AS upper_result", [], function(ignored, rs) {
              expect(rs.rows.item(0).upper_result).toBe('TEST \\');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        });

        it(suiteName + 'Backslash string binding test', function(done) {
          var db = openDatabase("Backslash-string-binding-test.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {

            tx.executeSql('SELECT UPPER(?) AS upper_result', ['Test \\'], function(ignored, rs) {
              expect(rs.rows.item(0).upper_result).toBe('TEST \\');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        });

        it(suiteName + 'String test with new String object', function(done) {
          var db = openDatabase("String-object-string-test.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {

            tx.executeSql('SELECT UPPER(?) AS upper_result', [new String('Test value')], function(ignored, rs) {
              expect(rs.rows.item(0).upper_result).toBe('TEST VALUE');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        });

        it(suiteName + 'String test with custom object', function(done) {
          // MyCustomObject "class":
          function MyCustomObject() {};
          MyCustomObject.prototype.toString = function() {return 'toString result';};
          MyCustomObject.prototype.valueOf = function() {return 'valueOf result';};

          var myObject = new MyCustomObject();
          // Check myObject:
          expect(myObject.toString()).toBe('toString result');
          expect(myObject.valueOf()).toBe('valueOf result');

          var db = openDatabase("Custom-object-string-test.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {

            tx.executeSql('SELECT UPPER(?) AS upper_result', [myObject], function(ignored, rs) {
              expect(rs.rows.item(0).upper_result).toBe('TOSTRING RESULT');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        });

    });
  }

}

if (window.hasBrowser) mytests();
else exports.defineAutoTests = mytests;

/* vim: set expandtab : */
