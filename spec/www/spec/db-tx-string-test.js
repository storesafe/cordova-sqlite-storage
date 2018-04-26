/* 'use strict'; */

var MYTIMEOUT = 12000;

var DEFAULT_SIZE = 5000000; // max to avoid popup in safari/ios

var isWP8 = /IEMobile/.test(navigator.userAgent); // Matches WP(7/8/8.1)
var isWindows = /Windows /.test(navigator.userAgent); // Windows (8.1)
var isAndroid = !isWindows && /Android/.test(navigator.userAgent);

// NOTE: While in certain version branches there is no difference between
// the default Android implementation and implementation #2,
// this test script will also apply the androidLockWorkaround: 1 option
// in case of implementation #2.
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

    describe(scenarioList[i] + ': tx string test(s)', function() {
      var scenarioName = scenarioList[i];
      var suiteName = scenarioName + ': ';
      var isWebSql = (i === 1);
      var isImpl2 = (i === 2);

      // NOTE 1: MUST be defined in proper describe function scope, NOT outer scope.
      // NOTE 2: Using same database name in this script to avoid issue with
      //         "Too many open files" on iOS with WKWebView engine plugin.
      //         (FUTURE TBD NEEDS INVESTIGATION)
      var openDatabase = function(name_ignored, ignored1, ignored2, ignored3) {
        var name = 'string-test.db';
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

      describe(suiteName + 'Basic US-ASCII string binding/manipulation tests', function() {

        it(suiteName + 'Inline US-ASCII String manipulation test with empty ([]) parameter list', function(done) {
          var db = openDatabase('Inline-US-ASCII-string-test-with-empty-parameter-list.db')

          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql("SELECT UPPER('Some US-ASCII text') AS uppertext", [], function(tx_ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).uppertext).toBe("SOME US-ASCII TEXT");

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'Inline US-ASCII String manipulation test with null parameter list', function(done) {
          var db = openDatabase('Inline-US-ASCII-string-test-with-null-parameter-list.db');

          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql("SELECT UPPER('Some US-ASCII text') AS uppertext", null, function(tx_ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).uppertext).toBe("SOME US-ASCII TEXT");

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'Inline US-ASCII String manipulation test with undefined parameter list', function(done) {
          var db = openDatabase('Inline-US-ASCII-string-test-with-undefined-parameter-list.db');

          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql("SELECT UPPER('Some US-ASCII text') AS uppertext", undefined, function(tx_ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).uppertext).toBe("SOME US-ASCII TEXT");

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'US-ASCII String binding test', function(done) {
          var db = openDatabase('ASCII-string-binding-test.db');

          db.transaction(function(tx) {
            tx.executeSql('SELECT UPPER(?) AS uppertext', ['Some US-ASCII text'], function(tx_ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).uppertext).toBe("SOME US-ASCII TEXT");

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'US-ASCII String HEX parameter value test ("Test 123") [default sqlite encoding: UTF-16le on Windows & Android 4.1-4.4 (WebKit) Web SQL, UTF-8 otherwise]', function(done) {
          var db = openDatabase('ASCII-String-hex-value-test.db');

          db.transaction(function(tx) {

            tx.executeSql('SELECT HEX(?) AS myresult', ['Test 123'], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (isWindows || (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent)))
                expect(rs.rows.item(0).myresult).toBe('54006500730074002000310032003300'); // (UTF-16le)
              else
                expect(rs.rows.item(0).myresult).toBe('5465737420313233'); // (UTF-8)

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'tx.executeSql(new String(sql))', function(done) {
          var db = openDatabase('tx-executeSql-new-String-test.db');

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql(new String("SELECT UPPER('Some US-ASCII text') AS uppertext"), [], function(tx_ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).uppertext).toBe("SOME US-ASCII TEXT");

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

      });

      describe(suiteName + 'U+0000 character tests', function() {

        it(suiteName + 'String HEX encoding test with U+0000 character (same as \\0 [null]) [XXX HEX ENCODING BUG REPRODUCED on default Android NDK access implementation (Android-sqlite-connector with Android-sqlite-native-driver), TRUNCATION ISSUE REPRODUCED on Windows; default sqlite encoding: UTF-16le on Windows & Android 4.1-4.4 (WebKit) Web SQL, UTF-8 otherwise]', function (done) {
          var db = openDatabase('U-0000-hex-test.db');

          db.transaction(function (tx) {
            tx.executeSql('SELECT HEX(?) AS hexvalue', ['abcd'], function (tx_ignored, rs1) {
              expect(rs1).toBeDefined();
              expect(rs1.rows).toBeDefined();
              expect(rs1.rows.length).toBe(1);

              var resultRow1 = rs1.rows.item(0);
              expect(resultRow1).toBeDefined();
              expect(resultRow1.hexvalue).toBeDefined();

              // NOTE: WebKit Web SQL on recent versions of Android & iOS
              // seems to use follow UTF-8 encoding/decoding rules.
              if (isWindows || (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent)))
                expect(resultRow1.hexvalue).toBe('6100620063006400');   // (UTF-16le)
              else
                expect(resultRow1.hexvalue).toBe('61626364');           // (UTF-8)

              var expected_hexvalue_length = resultRow1.hexvalue.length;
              if (isWindows || (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent)))
                expect(expected_hexvalue_length).toBe(16);  // (UTF-16le)
              else
                expect(expected_hexvalue_length).toBe(8);   // (UTF-8)

              tx.executeSql('SELECT HEX(?) AS hexvalue', ['a\u0000cd'], function (tx_ignored, rs2) {
                expect(rs2).toBeDefined();
                expect(rs2.rows).toBeDefined();
                expect(rs2.rows.length).toBe(1);

                var resultRow2 = rs2.rows.item(0);
                expect(resultRow2).toBeDefined();
                expect(resultRow2.hexvalue).toBeDefined();

                if (isWindows)
                  expect(resultRow2.hexvalue).toBe('6100');     // (UTF-16le with TRUNCATION BUG)
                else if ((isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent)))
                  expect(resultRow2.hexvalue).toBe('6100000063006400'); // (UTF-16le)
                else if (!isWebSql && isAndroid && !isImpl2)
                  expect(resultRow2.hexvalue).toBe('61C0806364'); // (XXX UTF-8 with XXX ENCODING BUG REPRODUCED on Android)
                else
                  expect(resultRow2.hexvalue).toBe('61006364');   // (UTF-8)

                // extra check:
                // ensure this matches our expectation of that database's
                // default encoding
                if (isWindows)
                  expect(resultRow2.hexvalue.length).toBe(4);   // (UTF-16le with TRUNCATION ISSUE REPRODUCED on Windows)
                else if (!isWebSql && !isWindows && isAndroid && !isImpl2)
                  expect(resultRow2.hexvalue.length).toBe(10);  // (XXX UTF-8 with ENCODING BUG REPRODUCED on Android)
                else
                  expect(resultRow2.hexvalue.length).toBe(expected_hexvalue_length);

                tx.executeSql('SELECT HEX(?) AS hexvalue', ['e\0gh'], function (tx_ignored, rs3) {
                  expect(rs3).toBeDefined();
                  expect(rs3.rows).toBeDefined();
                  expect(rs3.rows.length).toBe(1);

                  var resultRow3 = rs3.rows.item(0);
                  expect(resultRow3).toBeDefined();
                  expect(resultRow3.hexvalue).toBeDefined();

                  if (isWindows)
                    expect(resultRow3.hexvalue).toBe('6500');       // (UTF-16le with TRUNCATION ISSUE REPRODUCED on Windows)
                  else if ((isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent)))
                    expect(resultRow3.hexvalue).toBe('6500000067006800'); // (UTF-16le)
                  else if (!isWebSql && !isWindows && isAndroid && !isImpl2)
                    expect(resultRow3.hexvalue).toBe('65C0806768'); // (XXX UTF-8 with ENCODING BUG REPRODUCED on Android)
                  else
                    expect(resultRow3.hexvalue).toBe('65006768');   // (UTF-8)

                  // Close (plugin only) & finish:
                  (isWebSql) ? done() : db.close(done, done);
                });

              });

            });

          }, function(err) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(JSON.stringify(err)).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'INLINE HEX encoding test with U+0000 (\\0) [XXX HEX ENCODING BUG REPRODUCED on default Android NDK access implementation (Android-sqlite-connector with Android-sqlite-native-driver), SQL ERROR reported otherwise; default sqlite encoding: UTF-16le on TBD, UTF-8 otherwise]', function (done) {
          var db = openDatabase('INLINE-UNICODE-0000-hex-test.db');

          db.transaction(function (tx) {
            tx.executeSql('SELECT HEX("efgh") AS hexvalue', [], function (tx_ignored, rs1) {
              expect(rs1).toBeDefined();
              expect(rs1.rows).toBeDefined();
              expect(rs1.rows.length).toBe(1);

              var resultRow1 = rs1.rows.item(0);
              expect(resultRow1).toBeDefined();
              expect(resultRow1.hexvalue).toBeDefined();
              // NOTE: WebKit Web SQL on recent versions of Android & iOS
              // seems to use follow UTF-8 encoding/decoding rules.
              if (isWindows || (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent)))
                expect(resultRow1.hexvalue).toBe('6500660067006800'); // (UTF-16le)
              else
                expect(resultRow1.hexvalue).toBe('65666768'); // (UTF-8)

              var expected_hexvalue_length = resultRow1.hexvalue.length;
              if (isWindows || (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent)))
                expect(expected_hexvalue_length).toBe(16); // (UTF-16le)
              else
                expect(expected_hexvalue_length).toBe(8); // (UTF-8)

              tx.executeSql("SELECT HEX('e\u0000gh') AS hexvalue", [], function (tx_ignored, rs2) {
                if (isWebSql) expect('UNEXPECTED SUCCESS on (WebKit) Web SQL PLEASE UPDATE THIS TEST').toBe('--');
                if (!isWebSql && isWindows) expect('UNEXPECTED SUCCESS on Windows PLUGIN PLEASE UPDATE THIS TEST').toBe('--');
                if (!isWebSql && !isWindows && isAndroid && isImpl2) expect('UNEXPECTED SUCCESS on BUILTIN android.database PLEASE UPDATE THIS TEST').toBe('--');
                if (!isWebSql && !isWindows && !isAndroid) expect('UNEXPECTED SUCCESS on iOS/macOS PLUGIN PLEASE UPDATE THIS TEST').toBe('--');
                expect(rs2).toBeDefined();
                expect(rs2.rows).toBeDefined();
                expect(rs2.rows.length).toBe(1);

                var resultRow2 = rs2.rows.item(0);
                expect(resultRow2).toBeDefined();
                expect(resultRow2.hexvalue).toBeDefined();
                if (!isWebSql && !isWindows && isAndroid && !isImpl2)
                  expect(resultRow2.hexvalue).toBe('65C0806768'); // XXX UTF-8 ENCODING BUG REPRODUCED on default Android implementation (NDK)
                else
                  expect(resultRow2.hexvalue).toBe('??'); // FUTURE TBD ??

                // extra check:
                // ensure this matches our expectation of that database's
                // default encoding
                if (!isWebSql && !isWindows && isAndroid && !isImpl2)
                  expect(resultRow2.hexvalue.length).toBe(10);  // XXX INCORRECT LENGTH on default Android implementation (NDK)
                else
                  expect(resultRow2.hexvalue.length).toBe(expected_hexvalue_length);

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);

              }, function(ignored, error) {
                // ERROR NOT EXPECTED on default Android implementation (NDK):
                if (!isWebSql && !isWindows && isAndroid && !isImpl2)
                  expect(false).toBe(true);
                expect(error).toBeDefined();
                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });

            }, function(ignored, err) {
              // NOT EXPECTED for first SELECT:
              expect(false).toBe(true);
              expect(JSON.stringify(err)).toBe('--');
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

        it(suiteName + 'U+0000 string parameter manipulation test [TBD TRUNCATION ISSUE REPRODUCED on (WebKit) Web SQL & plugin on multiple platforms]', function(done) {
          var db = openDatabase('U-0000-string-parameter-upper-test');

          db.transaction(function(tx) {
            tx.executeSql('SELECT UPPER(?) AS uppertext', ['a\u0000cd'], function(tx_ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);

              // TRUNCATION ISSUE REPRODUCED on (WebKit) Web SQL & plugin
              // on multiple platforms

              if ((isWebSql && isAndroid && (/Android 4/.test(navigator.userAgent))) ||
                  (isWebSql && isAndroid && (/Android 5.0/.test(navigator.userAgent))) ||
                  (isWebSql && !isAndroid) ||
                  (!isWebSql && isWindows) ||
                  (!isWebSql && !isWindows && isAndroid && isImpl2 &&
                    !(/Android 4/.test(navigator.userAgent))))
                expect(rs.rows.item(0).uppertext).toBe('A');
              else
                expect(rs.rows.item(0).uppertext).toBe('A\0CD');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

      });

      describe(suiteName + 'control character tests', function() {

        it(suiteName + 'string HEX value test with double-quote (\") character [default sqlite HEX encoding: UTF-6le on Windows & Android 4.1-4.3 (WebKit) Web SQL, UTF-8 otherwise]', function(done) {
          var db = openDatabase('double-quote-hex-value-test.db');

          db.transaction(function(tx) {

            tx.executeSql('SELECT HEX(?) AS myresult', ['"123"'], function(ignored, rs1) {
              expect(rs1).toBeDefined();
              expect(rs1.rows).toBeDefined();
              expect(rs1.rows.length).toBe(1);
              var resultRow1 = rs1.rows.item(0);
              expect(resultRow1).toBeDefined();
              expect(resultRow1.myresult).toBeDefined();
              if (isWindows || (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent)))
                expect(resultRow1.myresult).toBe('22003100320033002200'); // (UTF-16le)
              else
                expect(resultRow1.myresult).toBe('2231323322');           // (UTF-8)

              tx.executeSql("SELECT HEX('\"45\"') AS myresult", [], function(ignored, rs2) {
                expect(rs2).toBeDefined();
                expect(rs2.rows).toBeDefined();
                expect(rs2.rows.length).toBe(1);
                var resultRow2 = rs2.rows.item(0);
                expect(resultRow2).toBeDefined();
                expect(resultRow2.myresult).toBeDefined();
                if (isWindows || (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent)))
                  expect(resultRow2.myresult).toBe('2200340035002200'); // (UTF-16le)
                else
                  expect(resultRow2.myresult).toBe('22343522');         // (UTF-8)

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });

            });

          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'string value manipulation test with double-quote (\") character', function(done) {
          var db = openDatabase('double-quote-upper-value-string-test.db');

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT UPPER(?) AS myresult', ['"abc"'], function(ignored, rs1) {
              expect(rs1).toBeDefined();
              expect(rs1.rows).toBeDefined();
              expect(rs1.rows.length).toBe(1);
              var resultRow1 = rs1.rows.item(0);
              expect(resultRow1).toBeDefined();
              expect(resultRow1.myresult).toBeDefined();
              expect(resultRow1.myresult).toBe('"ABC"');

              tx.executeSql("SELECT UPPER('\"de\"') AS myresult", [], function(ignored, rs2) {
                expect(rs2).toBeDefined();
                expect(rs2.rows).toBeDefined();
                expect(rs2.rows.length).toBe(1);
                var resultRow2 = rs2.rows.item(0);
                expect(resultRow2).toBeDefined();
                expect(resultRow2.myresult).toBeDefined();
                expect(resultRow2.myresult).toBe('"DE"');

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });

            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'string HEX value test with backslash (\\) character [default sqlite HEX encoding: UTF-6le on Windows & Android 4.1-4.3 (WebKit) Web SQL, UTF-8 otherwise]', function(done) {
          var db = openDatabase('backslash-hex-value-test.db');

          db.transaction(function(tx) {

            tx.executeSql('SELECT HEX(?) AS myresult', ['1\\2'], function(ignored, rs1) {
              expect(rs1).toBeDefined();
              expect(rs1.rows).toBeDefined();
              expect(rs1.rows.length).toBe(1);
              var resultRow1 = rs1.rows.item(0);
              expect(resultRow1).toBeDefined();
              expect(resultRow1.myresult).toBeDefined();
              if (isWindows || (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent)))
                expect(resultRow1.myresult).toBe('31005C003200'); // (UTF-16le)
              else
                expect(resultRow1.myresult).toBe('315C32');       // (UTF-8)

              tx.executeSql("SELECT HEX('3\\4') AS myresult", [], function(ignored, rs2) {
                expect(rs2).toBeDefined();
                expect(rs2.rows).toBeDefined();
                expect(rs2.rows.length).toBe(1);
                var resultRow2 = rs2.rows.item(0);
                expect(resultRow2).toBeDefined();
                expect(resultRow2.myresult).toBeDefined();

                if (isWindows || (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent)))
                  expect(resultRow2.myresult).toBe('33005C003400'); // (UTF-16le)
                else
                  expect(resultRow2.myresult).toBe('335C34');       // (UTF-8)

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });

            });

          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'string value manipulation test with backslash (\\) character', function(done) {
          var db = openDatabase('backslash-upper-value-string-test.db');

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT UPPER(?) AS myresult', ['a\\b'], function(ignored, rs1) {
              expect(rs1).toBeDefined();
              expect(rs1.rows).toBeDefined();
              expect(rs1.rows.length).toBe(1);
              var resultRow1 = rs1.rows.item(0);
              expect(resultRow1).toBeDefined();
              expect(resultRow1.myresult).toBeDefined();
              expect(resultRow1.myresult).toBe('A\\B');

              tx.executeSql("SELECT UPPER('c\\d') AS myresult", [], function(ignored, rs2) {
                expect(rs2).toBeDefined();
                expect(rs2.rows).toBeDefined();
                expect(rs2.rows.length).toBe(1);
                var resultRow2 = rs2.rows.item(0);
                expect(resultRow2).toBeDefined();
                expect(resultRow2.myresult).toBeDefined();
                expect(resultRow2.myresult).toBe('C\\D');

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });

            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'CR-LF String test (inline vs argument parameter value) [default sqlite HEX encoding: UTF-6le on Windows & Android 4.1-4.3 (WebKit) Web SQL, UTF-8 otherwise]', function(done) {
          var db = openDatabase('INLINE-CR-LF-String-test.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql("SELECT UPPER('cr\r\nlf') AS uppertext", [], function(tx_ignored, rs1) {
              // Check INLINE string result:
              expect(rs1).toBeDefined();
              expect(rs1.rows).toBeDefined();
              expect(rs1.rows.length).toBe(1);
              expect(rs1.rows.item(0).uppertext).not.toBe("CR\nLF"); // CR-LF should not be converted to \\n
              expect(rs1.rows.item(0).uppertext).toBe("CR\r\nLF"); // Check CR-LF OK

              tx.executeSql("SELECT UPPER('Carriage\rReturn') AS uppertext", [], function(tx_ignored, rs2) {
                // Check INLINE string result:
                expect(rs2).toBeDefined();
                expect(rs2.rows).toBeDefined();
                expect(rs2.rows.length).toBe(1);
                expect(rs2.rows.item(0).uppertext).toBe("CARRIAGE\rRETURN"); // Check CR OK

                tx.executeSql("SELECT UPPER('New\nLine') AS uppertext", [], function(tx_ignored, rs3) {
                  // Check INLINE string result:
                  expect(rs3).toBeDefined();
                  expect(rs3.rows).toBeDefined();
                  expect(rs3.rows.length).toBe(1);
                  expect(rs3.rows.item(0).uppertext).toBe("NEW\nLINE"); // CHECK newline OK

                  // Check value binding & HEX result:
                  tx.executeSql("SELECT HEX(?) AS myResult", ['1\r2\n3\r\n4'], function(tx_ignored, rs4) {
                    expect(rs4).toBeDefined();
                    expect(rs4.rows).toBeDefined();
                    expect(rs4.rows.length).toBe(1);
                    if (isWindows || (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent)))
                      expect(rs4.rows.item(0).myResult).toBe('31000D0032000A0033000D000A003400'); // (UTF-16le)
                    else
                      expect(rs4.rows.item(0).myResult).toBe('310D320A330D0A34');

                    // Close (plugin only) & finish:
                    (isWebSql) ? done() : db.close(done, done);
                  });
                });
              });
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'string tab test (inline vs argument parameter value) [default sqlite HEX encoding: UTF-6le on Windows & Android 4.1-4.3 (WebKit) Web SQL, UTF-8 otherwise]', function(done) {
          var db = openDatabase('string-tab-test.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql("SELECT UPPER('first\tsecond') AS uppertext", [], function(tx_ignored, rs1) {
              // Check INLINE string result:
              expect(rs1).toBeDefined();
              expect(rs1.rows).toBeDefined();
              expect(rs1.rows.length).toBe(1);
              expect(rs1.rows.item(0).uppertext).toBe('FIRST\tSECOND');

              // Check value binding & HEX result:
              tx.executeSql("SELECT HEX(?) AS myResult", ['A\t1'], function(tx_ignored, rs2) {
                expect(rs2).toBeDefined();
                expect(rs2.rows).toBeDefined();
                expect(rs2.rows.length).toBe(1);
                if (isWindows || (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent)))
                  expect(rs2.rows.item(0).myResult).toBe('410009003100'); // (UTF-16le)
                else
                  expect(rs2.rows.item(0).myResult).toBe('410931');

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });

            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'string vertical tab test (inline vs argument parameter value) [default sqlite HEX encoding: UTF-6le on Windows & Android 4.1-4.3 (WebKit) Web SQL, UTF-8 otherwise]', function(done) {
          if (isWP8) pending('BROKEN on WP(8)'); // [BUG #202] UNICODE characters not working with WP(8)

          var db = openDatabase('String-vertical-tab-test.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql("SELECT UPPER('first\vsecond') AS uppertext", [], function(tx_ignored, rs1) {
              // Check INLINE string result:
              expect(rs1).toBeDefined();
              expect(rs1.rows).toBeDefined();
              expect(rs1.rows.length).toBe(1);
              expect(rs1.rows.item(0).uppertext).toBe('FIRST\vSECOND');

              // Check value binding & HEX result:
              tx.executeSql("SELECT HEX(?) AS myResult", ['A\v1'], function(tx_ignored, rs2) {
                expect(rs2).toBeDefined();
                expect(rs2.rows).toBeDefined();
                expect(rs2.rows.length).toBe(1);
                if (isWindows || (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent)))
                  expect(rs2.rows.item(0).myResult).toBe('41000B003100'); // (UTF-16le)
                else
                  expect(rs2.rows.item(0).myResult).toBe('410B31');

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });

            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'string form feed test (inline vs argument parameter value) [default sqlite HEX encoding: UTF-6le on Windows & Android 4.1-4.3 (WebKit) Web SQL, UTF-8 otherwise]', function(done) {
          if (isWP8) pending('BROKEN on WP(8)'); // [BUG #202] UNICODE characters not working with WP(8)

          var db = openDatabase('String-form-feed-test.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql("SELECT UPPER('first\fsecond') AS uppertext", [], function(tx_ignored, rs1) {
              // Check INLINE string result:
              expect(rs1).toBeDefined();
              expect(rs1.rows).toBeDefined();
              expect(rs1.rows.length).toBe(1);
              expect(rs1.rows.item(0).uppertext).toBe('FIRST\fSECOND');

              // Check value binding & HEX result:
              tx.executeSql("SELECT HEX(?) AS myResult", ['A\f1'], function(tx_ignored, rs2) {
                expect(rs2).toBeDefined();
                expect(rs2.rows).toBeDefined();
                expect(rs2.rows.length).toBe(1);
                if (isWindows || (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent)))
                  expect(rs2.rows.item(0).myResult).toBe('41000C003100'); // (UTF-16le)
                else
                  expect(rs2.rows.item(0).myResult).toBe('410C31');

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });

            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'string backspace test (inline vs argument parameter value) [default sqlite HEX encoding: UTF-6le on Windows & Android 4.1-4.3 (WebKit) Web SQL, UTF-8 otherwise]', function(done) {
          if (isWP8) pending('BROKEN on WP(8)'); // [BUG #202] UNICODE characters not working with WP(8)

          var db = openDatabase('String-backspace-test.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql("SELECT UPPER('first\bsecond') AS uppertext", [], function(tx_ignored, rs1) {
              // Check INLINE string result:
              expect(rs1).toBeDefined();
              expect(rs1.rows).toBeDefined();
              expect(rs1.rows.length).toBe(1);
              expect(rs1.rows.item(0).uppertext).toBe('FIRST\bSECOND');

              // Check value binding & HEX result:
              tx.executeSql("SELECT HEX(?) AS myResult", ['A\b1'], function(tx_ignored, rs2) {
                expect(rs2).toBeDefined();
                expect(rs2.rows).toBeDefined();
                expect(rs2.rows.length).toBe(1);
                if (isWindows || (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent)))
                  expect(rs2.rows.item(0).myResult).toBe('410008003100'); // (UTF-16le)
                else
                  expect(rs2.rows.item(0).myResult).toBe('410831');

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

      });

      describe(suiteName + 'UTF-8 multi-byte character string binding & manipulation tests', function() {

        it(suiteName + 'string HEX value test with UTF-8 2-byte cent character (¢) [default sqlite HEX encoding: UTF-6le on Windows & Android 4.1-4.3 (WebKit) Web SQL, UTF-8 otherwise]', function(done) {
          var db = openDatabase('UTF8-2-byte-cent-hex-value-test.db');

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT HEX(?) AS myresult', ['1¢'], function(ignored, rs1) {
              expect(rs1).toBeDefined();
              expect(rs1.rows).toBeDefined();
              expect(rs1.rows.length).toBe(1);

              var resultRow1 = rs1.rows.item(0);
              expect(resultRow1).toBeDefined();
              expect(resultRow1.myresult).toBeDefined();
              if (isWindows || (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent)))
                expect(resultRow1.myresult).toBe('3100A200');   // (UTF-16le)
              else
                expect(resultRow1.myresult).toBe('31C2A2');     // (UTF-8)

              tx.executeSql("SELECT HEX('@¢') AS myresult", [], function(ignored, rs2) {
                expect(rs2).toBeDefined();
                expect(rs2.rows).toBeDefined();
                expect(rs2.rows.length).toBe(1);

                var resultRow2 = rs2.rows.item(0);
                expect(resultRow2).toBeDefined();
                expect(resultRow2.myresult).toBeDefined();
                if (isWindows || (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent)))
                  expect(resultRow2.myresult).toBe('4000A200'); // (UTF-16le)
                else
                  expect(resultRow2.myresult).toBe('40C2A2');   // (UTF-8)

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });

            });

          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'string value manipulation test with UTF-8 2-byte cent character (¢)', function(done) {
          var db = openDatabase('UTF8-2-byte-cent-upper-value-string-test.db');

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT UPPER(?) AS myresult', ['a¢'], function(ignored, rs1) {
              expect(rs1).toBeDefined();
              expect(rs1.rows).toBeDefined();
              expect(rs1.rows.length).toBe(1);

              var resultRow1 = rs1.rows.item(0);
              expect(resultRow1).toBeDefined();
              expect(resultRow1.myresult).toBeDefined();
              expect(resultRow1.myresult).toBe('A¢');

              tx.executeSql("SELECT UPPER('b¢') AS myresult", [], function(ignored, rs2) {
                expect(rs2).toBeDefined();
                expect(rs2.rows).toBeDefined();
                expect(rs2.rows.length).toBe(1);

                var resultRow2 = rs2.rows.item(0);
                expect(resultRow2).toBeDefined();
                expect(resultRow2.myresult).toBeDefined();
                expect(resultRow2.myresult).toBe('B¢');

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });

            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'string HEX value test with UTF-8 2-byte accented character é [default sqlite HEX encoding: UTF-6le on Windows & Android 4.1-4.3 (WebKit) Web SQL, UTF-8 otherwise]', function(done) {
          var db = openDatabase('UTF8-2-byte-accented-character-hex-value-test.db');

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT HEX(?) AS myresult', ['1é'], function(ignored, rs1) {
              expect(rs1).toBeDefined();
              expect(rs1.rows).toBeDefined();
              expect(rs1.rows.length).toBe(1);

              var resultRow1 = rs1.rows.item(0);
              expect(resultRow1).toBeDefined();
              expect(resultRow1.myresult).toBeDefined();
              if (isWindows || (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent)))
                expect(resultRow1.myresult).toBe('3100E900');   // (UTF-16le)
              else
                expect(resultRow1.myresult).toBe('31C3A9');     // (UTF-8)

              tx.executeSql("SELECT HEX('@é') AS myresult", [], function(ignored, rs2) {
                expect(rs2).toBeDefined();
                expect(rs2.rows).toBeDefined();
                expect(rs2.rows.length).toBe(1);

                var resultRow2 = rs2.rows.item(0);
                expect(resultRow2).toBeDefined();
                expect(resultRow2.myresult).toBeDefined();
                if (isWindows || (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent)))
                  expect(resultRow2.myresult).toBe('4000E900'); // (UTF-16le)
                else
                  expect(resultRow2.myresult).toBe('40C3A9');   // (UTF-8)

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });

            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'string value manipulation test with UTF-8 2-byte accented character é', function(done) {
          var db = openDatabase('UTF8-2-byte-accented-character-upper-value-string-test.db');

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT UPPER(?) AS myresult', ['aé'], function(ignored, rs1) {
              expect(rs1).toBeDefined();
              expect(rs1.rows).toBeDefined();
              expect(rs1.rows.length).toBe(1);

              var resultRow1 = rs1.rows.item(0);
              expect(resultRow1).toBeDefined();
              expect(resultRow1.myresult).toBeDefined();
              // SQLite3 with ICU-UNICODE for builtin android.database on Android 4.4 and greater
              if (isAndroid && ((isWebSql && isAndroid && !(/Android 4.[1-3]/.test(navigator.userAgent))) || (isImpl2 && /Android [5-9]/.test(navigator.userAgent))))
                expect(resultRow1.myresult).toBe('AÉ');
              else
                expect(resultRow1.myresult).toBe('Aé');

              tx.executeSql("SELECT UPPER('bé') AS myresult", [], function(ignored, rs2) {
                expect(rs2).toBeDefined();
                expect(rs2.rows).toBeDefined();
                expect(rs2.rows.length).toBe(1);

                var resultRow2 = rs2.rows.item(0);
                expect(resultRow2).toBeDefined();
                expect(resultRow2.myresult).toBeDefined();
                // SQLite3 with ICU-UNICODE for builtin android.database on Android 4.4 and greater
                if (isAndroid && ((isWebSql && isAndroid && !(/Android 4.[1-3]/.test(navigator.userAgent))) || (isImpl2 && /Android [5-9]/.test(navigator.userAgent))))
                  expect(resultRow2.myresult).toBe('BÉ');
                else
                  expect(resultRow2.myresult).toBe('Bé');

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });

            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'string HEX value test with UTF-8 3-byte Euro character (€) [default sqlite HEX encoding: UTF-6le on Windows & Android 4.1-4.3 (WebKit) Web SQL, UTF-8 otherwise]', function(done) {
          // if (isWP8) pending('SKIP for WP(8)'); // XXX GONE
          var db = openDatabase('UTF8-3-byte-euro-hex-value-test.db');

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT HEX(?) AS myresult', ['1€'], function(ignored, rs1) {
              expect(rs1).toBeDefined();
              expect(rs1.rows).toBeDefined();
              expect(rs1.rows.length).toBe(1);

              var resultRow1 = rs1.rows.item(0);
              expect(resultRow1).toBeDefined();
              expect(resultRow1.myresult).toBeDefined();
              if (isWindows || (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent)))
                expect(resultRow1.myresult).toBe('3100AC20');   // (UTF-16le)
              else
                expect(resultRow1.myresult).toBe('31E282AC');   // (UTF-8)

              tx.executeSql("SELECT HEX('@€') AS myresult", [], function(ignored, rs2) {
                expect(rs2).toBeDefined();
                expect(rs2.rows).toBeDefined();
                expect(rs2.rows.length).toBe(1);

                var resultRow2 = rs2.rows.item(0);
                expect(resultRow2).toBeDefined();
                expect(resultRow2.myresult).toBeDefined();
                if (isWindows || (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent)))
                  expect(resultRow2.myresult).toBe('4000AC20'); // (UTF-16le)
                else
                  expect(resultRow2.myresult).toBe('40E282AC'); // (UTF-8)

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });

            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'string parameter value manipulation test with UTF-8 3-byte Euro character (€)', function(done) {
          // if (isWP8) pending('SKIP for WP(8)'); // XXX GONE
          var db = openDatabase('UTF8-3-byte-euro-string-upper-value-test.db');

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT UPPER(?) AS myresult', ['a€'], function(ignored, rs1) {
              expect(rs1).toBeDefined();
              expect(rs1.rows).toBeDefined();
              expect(rs1.rows.length).toBe(1);

              var resultRow1 = rs1.rows.item(0);
              expect(resultRow1).toBeDefined();
              expect(resultRow1.myresult).toBeDefined();
              expect(resultRow1.myresult).toBe('A€');

              tx.executeSql("SELECT UPPER('b€') AS myresult", [], function(ignored, rs2) {
                expect(rs2).toBeDefined();
                expect(rs2.rows).toBeDefined();
                expect(rs2.rows.length).toBe(1);

                var resultRow2 = rs2.rows.item(0);
                expect(resultRow2).toBeDefined();
                expect(resultRow2.myresult).toBeDefined();
                expect(resultRow2.myresult).toBe('B€');

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });

            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        // ENCODING BUG REPRODUCED for emojis and other
        // 4-byte UTF-8 characters in SELECT HEX value tests
        // on default Android database access implementation
        // (Android-sqlite-connector with Android-sqlite-ext-native-driver,
        // using NDK) on Android pre-6.0
        // ref: litehelpers/Cordova-sqlite-storage#564

        it(suiteName + 'string HEX value test with UTF-8 3-byte Samaritan character Bit (U+0801) [default sqlite HEX encoding: UTF-6le on Windows & Android 4.1-4.3 (WebKit) Web SQL, UTF-8 otherwise]', function(done) {
          var db = openDatabase('UTF8-0801-hex-value-test.db');

          db.transaction(function(tx) {

            tx.executeSql('SELECT HEX(?) AS myresult', ['@\u0801!'], function(ignored, rs1) {
              expect(rs1).toBeDefined();
              expect(rs1.rows).toBeDefined();
              expect(rs1.rows.length).toBe(1);

              var resultRow1 = rs1.rows.item(0);
              expect(resultRow1).toBeDefined();
              expect(resultRow1.myresult).toBeDefined();
              if (isWindows || (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent)))
                expect(resultRow1.myresult).toBe('400001082100');   // (UTF-16le)
              else
                expect(resultRow1.myresult).toBe('40E0A08121');     // (UTF-8)

              tx.executeSql("SELECT HEX('@\u0801!') AS myresult", [], function(ignored, rs2) {
                expect(rs2).toBeDefined();
                expect(rs2.rows).toBeDefined();
                expect(rs2.rows.length).toBe(1);

                var resultRow2 = rs2.rows.item(0);
                expect(resultRow2).toBeDefined();
                expect(resultRow2.myresult).toBeDefined();
                if (isWindows || (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent)))
                  expect(resultRow2.myresult).toBe('400001082100'); // (UTF-16le)
                else
                  expect(resultRow2.myresult).toBe('40E0A08121');   // (UTF-8)

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });

            });

          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'string manipulation test with UTF-8 3-byte Samaritan character Bit (U+0801)', function(done) {
          // ref: litehelpers/Cordova-sqlite-evcore-extbuild-free#37
          var db = openDatabase('UTF8-0801-string-upper-value-test.db');

          db.transaction(function(tx) {

            tx.executeSql('SELECT UPPER(?) AS myresult', ['a\u0801;'], function(ignored, rs1) {
              expect(rs1).toBeDefined();
              expect(rs1.rows).toBeDefined();
              expect(rs1.rows.length).toBe(1);

              var resultRow1 = rs1.rows.item(0);
              expect(resultRow1).toBeDefined();
              expect(resultRow1.myresult).toBeDefined();
              expect(resultRow1.myresult).toBe('Aࠁ;');

              tx.executeSql("SELECT UPPER('b\u0801.') AS myresult", [], function(ignored, rs2) {
                expect(rs2).toBeDefined();
                expect(rs2.rows).toBeDefined();
                expect(rs2.rows.length).toBe(1);
                var resultRow2 = rs2.rows.item(0);

                expect(resultRow2).toBeDefined();
                expect(resultRow2.myresult).toBeDefined();
                expect(resultRow2.myresult).toBe('Bࠁ.');

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });

            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'string HEX value test with UTF-8 4-byte Gothic bairkan 𐌱 (U+10331) [XXX ENCODING BUG REPRODUCED on default Android SQLite3 NDK build (using Android-sqlite-connector with Android-sqlite-ext-native-driver) on Android 4.x/5.x; default sqlite HEX encoding: UTF-6le on Windows & Android 4.1-4.3 (WebKit) Web SQL, UTF-8 otherwise]', function(done) {
          var db = openDatabase('UTF8-2050-hex-value-test.db');

          db.transaction(function(tx) {

            tx.executeSql('SELECT HEX(?) AS myresult', ['@𐌱'], function(ignored, rs1) {
              expect(rs1).toBeDefined();
              expect(rs1.rows).toBeDefined();
              expect(rs1.rows.length).toBe(1);
              if (isWindows || (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent)))
                expect(rs1.rows.item(0).myresult).toBe('400000D831DF'); // (UTF-16le)
              else if (!isWebSql && !isWindows && isAndroid && !isImpl2 && (/Android [4-5]/.test(navigator.userAgent)))
                expect(rs1.rows.item(0).myresult).toBe('40EDA080EDBCB1'); // (XXX ENCODING BUG REPRODUCED on default Android NDK implementation on Android 4.x/5.x)
              else
                expect(rs1.rows.item(0).myresult).toBe('40F0908CB1'); // (UTF-8)

              tx.executeSql("SELECT HEX('@𐌱') AS myresult", null, function(ignored, rs2) {
                expect(rs2).toBeDefined();
                expect(rs2.rows).toBeDefined();
                expect(rs2.rows.length).toBe(1);
                if (isWindows || (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent)))
                  expect(rs2.rows.item(0).myresult).toBe('400000D831DF'); // (UTF-16le)
                else if (!isWebSql && !isWindows && isAndroid && !isImpl2 && (/Android [4-5]/.test(navigator.userAgent)))
                  expect(rs2.rows.item(0).myresult).toBe('40EDA080EDBCB1'); // (XXX ENCODING BUG REPRODUCED on default Android NDK implementation on Android 4.x/5.x)
                else
                  expect(rs2.rows.item(0).myresult).toBe('40F0908CB1'); // (UTF-8)

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);

              });

            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'string manipulation test with UTF-8 4-byte Gothic bairkan 𐌱 (U+10331)', function(done) {
          var db = openDatabase('UTF8-2050-upper-value-string-test.db');

          db.transaction(function(tx) {

            tx.executeSql('SELECT UPPER(?) AS myresult', ['a𐌱'], function(ignored, rs1) {
              expect(rs1).toBeDefined();
              expect(rs1.rows).toBeDefined();
              expect(rs1.rows.length).toBe(1);
              expect(rs1.rows.item(0).myresult).toBe('A𐌱');

              tx.executeSql("SELECT UPPER('a𐌱') AS myresult", null, function(ignored, rs2) {
                expect(rs2).toBeDefined();
                expect(rs2.rows).toBeDefined();
                expect(rs2.rows.length).toBe(1);
                expect(rs2.rows.item(0).myresult).toBe('A𐌱');

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'Inline emoji string manipulation test: SELECT UPPER("a\\uD83D\\uDE03.") [\\u1F603 SMILING FACE (MOUTH OPEN)]', function(done) {
          var db = openDatabase('Inline-emoji-select-upper-test.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT UPPER("a\uD83D\uDE03.") AS uppertext', [], function(tx_ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).uppertext).toBe('A\uD83D\uDE03.');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'emoji string argument value manipulation test', function(done) {
          var db = openDatabase('emoji-string-argument-upper-value-test.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT UPPER(?) AS uppertext', ["a\uD83D\uDE03."], function(tx_ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).uppertext).toBe('A\uD83D\uDE03.');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'emoji HEX test: SELECT HEX("@\\uD83D\\uDE03!") [\\u1F603 SMILING FACE (MOUTH OPEN)] [XXX TBD HEX encoding BUG REPRODUCED default Android SQLite3 NDK build (using Android-sqlite-connector with Android-sqlite-ext-native-driver) on Android 4.x & 5.x; default sqlite HEX encoding: UTF-6le on Windows & Android 4.1-4.3 (WebKit) Web SQL, UTF-8 otherwise]', function(done) {
          var db = openDatabase('emoji-select-hex-value-test.db');
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT HEX(?) AS hexvalue', ['@\uD83D\uDE03!'], function(tx_ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);

              if (isWindows || (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent)))
                expect(rs.rows.item(0).hexvalue).toBe('40003DD803DE2100'); // (UTF-16le)
              else if (!isWebSql && !isWindows && isAndroid && !isImpl2 && /Android [4-5]/.test(navigator.userAgent))
                expect(rs.rows.item(0).hexvalue).toBe('40EDA0BDEDB88321'); // (XXX BUG REPRODUCED on default Android NDK implementation)
              else
                expect(rs.rows.item(0).hexvalue).toBe('40F09F988321'); // (UTF-8)

              tx.executeSql('SELECT HEX("@\uD83D\uDE03!") AS hexvalue', [], function(tx_ignored, rs2) {
                expect(rs2).toBeDefined();
                expect(rs2.rows).toBeDefined();
                expect(rs2.rows.length).toBe(1);

                if (isWindows || (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent)))
                  expect(rs2.rows.item(0).hexvalue).toBe('40003DD803DE2100'); // (UTF-16le)
                else if (!isWebSql && !isWindows && isAndroid && !isImpl2 && /Android [4-5]/.test(navigator.userAgent))
                  expect(rs2.rows.item(0).hexvalue).toBe('40EDA0BDEDB88321'); // (XXX BUG REPRODUCED on default Android NDK implementation)
                else
                  expect(rs2.rows.item(0).hexvalue).toBe('40F09F988321'); // (UTF-8)

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });

            });

          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + "Inline BLOB with emoji string manipulation test: SELECT LOWER(X'41F09F9883') [A\uD83D\uDE03] [\\u1F603 SMILING FACE (MOUTH OPEN)]", function(done) {
          if (isWP8) pending('BROKEN for WP8');
          if (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent)) pending('SKIP for Android 4.1-4.3 (WebKit) Web SQL'); // TBD ???
          if (!isWebSql && !isWindows && isAndroid && !isImpl2) pending('XXX CRASH on Android 5.x (default sqlite-connector implementation)');
          if (isWindows) pending('SKIP for Windows'); // FUTURE TBD

          var db = openDatabase("Inline-emoji-select-lower-result-test.db", "1.0", "Demo", DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql("SELECT LOWER(X'41F09F9883') AS lowertext", [], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).lowertext).toBe('a\uD83D\uDE03');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        // NOTE: the next 3 tests show that for iOS/macOS/Android:
        // - UNICODE \u2028 line separator from JavaScript to native (Objective-C/Java) is working OK
        // - UNICODE \u2028 line separator from native (Objective-C/Java) to JavaScript is BROKEN
        // For reference:
        // - litehelpers/Cordova-sqlite-storage#147
        // - Apache Cordova CB-9435 (issue with cordova-ios, also affects macOS)
        // - cordova/cordova-discuss#57 (issue with cordova-android)

        it(suiteName + "UNICODE \\u2028 line separator string length", function(done) {
          if (isWP8) pending('BROKEN on WP(8)'); // [BUG #202] Certain UNICODE characters not working with WP(8)

          // NOTE: this test verifies that the UNICODE line separator (\u2028)
          // is seen by the sqlite implementation OK:
          var db = openDatabase('UNICODE-line-separator-string-length.db');

          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql("select length(?) AS stringlength", ['First\u2028Second'], function (tx_ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).stringlength).toBe(12);

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'HEX value of string with UNICODE \\u2028 line separator [default sqlite HEX encoding: UTF-6le on Windows & Android 4.1-4.3 (WebKit) Web SQL, UTF-8 otherwise]', function(done) {
          // NOTE: this test verifies that the UNICODE line separator (\u2028)
          // is seen by the sqlite implementation OK:
          var db = openDatabase('UNICODE-line-separator-hex-value-test.db');

          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT HEX(?) AS myresult', ['1\u2028'], function (tx_ignored, rs) {
              if (isWindows || (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent)))
                expect(rs.rows.item(0).myresult).toBe('31002820'); // (UTF-16le)
              else
                expect(rs.rows.item(0).myresult).toBe('31E280A8'); // (UTF-8)

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + ' handles UNICODE \\u2028 line separator correctly [string test]', function (done) {
          if (isWP8) pending('BROKEN on WP(8)'); // [BUG #202] UNICODE characters not working with WP(8)
          if (!isWebSql && !isWindows && isAndroid) pending('SKIP for Android plugin (cordova-android 6.x BUG: cordova/cordova-discuss#57)');
          if (!isWebSql && !isWindows && !isAndroid && !isWP8) pending('SKIP for iOS/macOS plugin (Cordova BUG: CB-9435)');
          if (isWebSql && !isWindows && isAndroid) pending('SKIP for Android Web SQL'); // TBD SKIP for Android Web for now

          // NOTE: since the above test shows the UNICODE line separator (\u2028)
          // is seen by the sqlite implementation OK, it is now concluded that
          // the failure is caused by the native JSON result encoding.
          var db = openDatabase('UNICODE-line-separator-string-lowertext.db');

          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql("SELECT LOWER(?) AS lowertext", ['First\u2028Second'], function (tx_ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows.item(0).lowertext).toBe("first\u2028second");

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        // NOTE: the next 3 tests repeat the above for UNICODE \u2029 paragraph separator
        // on iOS/macOS/Android:
        // - UNICODE \u2029 paragraph separator from JavaScript to native (Objective-C/Java) is working OK
        // - UNICODE \u2029 paragraph separator from native (Objective-C/Java) to JavaScript is BROKEN
        // For reference:
        // - litehelpers/Cordova-sqlite-storage#147
        // - Apache Cordova CB-9435 (issue with cordova-ios, also affects macOS)
        // - cordova/cordova-discuss#57 (issue with cordova-android)

        it(suiteName + "UNICODE \\u2029 paragraph separator string length", function(done) {
          if (isWP8) pending('BROKEN on WP(8)'); // [BUG #202] Certain UNICODE characters not working with WP(8)

          // NOTE: this test verifies that the UNICODE paragraph separator (\u2029)
          // is seen by the sqlite implementation OK:
          var db = openDatabase('UNICODE-paragraph-separator-string-length.db');

          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            var text = 'Abcd\u20281234';
            tx.executeSql("select length(?) AS stringlength", ['First\u2029Second'], function (tx_ignored, rs) {
              expect(rs.rows.item(0).stringlength).toBe(12);

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'HEX value of string with UNICODE \\u2029 paragraph separator [default sqlite HEX encoding: UTF-6le on Windows & Android 4.1-4.3 (WebKit) Web SQL, UTF-8 otherwise]', function(done) {
          // NOTE: this test verifies that the UNICODE paragraph separator (\u2029)
          // is seen by the sqlite implementation OK:
          var db = openDatabase('UNICODE-paragraph-separator-hex-value-test.db');

          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT HEX(?) AS myresult', ['1\u2029'], function (tx_ignored, rs) {
              if (isWindows || (isWebSql && isAndroid && /Android 4.[1-3]/.test(navigator.userAgent)))
                expect(rs.rows.item(0).myresult).toBe('31002920'); // (UTF-16le)
              else
                expect(rs.rows.item(0).myresult).toBe('31E280A9'); // (UTF-8)

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + ' handles UNICODE \\u2029 paragraph separator correctly [string test]', function (done) {
          if (isWP8) pending('BROKEN on WP(8)'); // [BUG #202] UNICODE characters not working with WP(8)
          if (!isWebSql && !isWindows && isAndroid) pending('SKIP for Android plugin (cordova-android 6.x BUG: cordova/cordova-discuss#57)');
          if (!isWebSql && !isWindows && !isAndroid && !isWP8) pending('SKIP for iOS/macOS plugin (Cordova BUG: CB-9435)');

          // NOTE: since the above test shows the UNICODE paragraph separator (\u2029)
          // is seen by the sqlite implementation OK, it is now concluded that
          // the failure is caused by the native JSON result encoding.
          var db = openDatabase('UNICODE-paragraph-separator-string-lowertext.db');

          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql("SELECT LOWER(?) AS lowertext", ['First\u2029Second'], function (tx_ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows.item(0).lowertext).toBe("first\u2029second");

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

      });

      describe(suiteName + 'additional (extra) multi-byte UTF-8 character string binding & manipulation tests', function() {

        it(suiteName + 'Inline string manipulation test with a combination of UTF-8 2-byte & 3-byte characters', function(done) {
          if (isWP8) pending('SKIP for WP(8)');

          var db = openDatabase('Inline-UTF8-combo-string-manipulation-test.db');

          db.transaction(function(tx) {

            tx.executeSql("SELECT UPPER('Test ¢ é €') AS upper_result", [], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (isAndroid && ((isWebSql && !(/Android 4.[1-3]/.test(navigator.userAgent))) || (isImpl2 && /Android [5-9]/.test(navigator.userAgent))))
                expect(rs.rows.item(0).upper_result).toBe('TEST ¢ É €');
              else
                expect(rs.rows.item(0).upper_result).toBe('TEST ¢ é €');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'string parameter manipulation test with a combination of UTF-8 2-byte & 3-byte characters', function(done) {
          if (isWP8) pending('SKIP for WP(8)');

          var db = openDatabase('UTF8-combo-select-upper-test.db');

          db.transaction(function(tx) {

            tx.executeSql('SELECT UPPER(?) AS upper_result', ['Test ¢ é €'], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (isAndroid && ((isWebSql && !(/Android 4.[1-3]/.test(navigator.userAgent))) || (isImpl2 && /Android [5-9]/.test(navigator.userAgent))))
                expect(rs.rows.item(0).upper_result).toBe('TEST ¢ É €');
              else
                expect(rs.rows.item(0).upper_result).toBe('TEST ¢ é €');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

      });

      describe(suiteName + 'Additional US-ASCII string binding/manipulation tests', function() {

        // TBD CHECK HEX value results

        it(suiteName + 'INLINE Double-quote string manipulation test', function(done) {
          var db = openDatabase('INLINE-Double-quote-string-test.db');

          db.transaction(function(tx) {

            tx.executeSql("SELECT UPPER('\"String\" test') AS upper_result", [], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).upper_result).toBe('"STRING" TEST');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'Double-quote string binding test', function(done) {
          var db = openDatabase('Double-quote-string-binding-test.db');

          db.transaction(function(tx) {

            tx.executeSql('SELECT UPPER(?) AS upper_result', ['"String" test'], function(tx_ignored, rs1) {
              expect(rs1).toBeDefined();
              expect(rs1.rows).toBeDefined();
              expect(rs1.rows.length).toBe(1);
              expect(rs1.rows.item(0).upper_result).toBe('"STRING" TEST');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'INLINE Backslash string test', function(done) {
          var db = openDatabase('INLINE-Backslash-string-test.db');

          db.transaction(function(tx) {

            tx.executeSql("SELECT UPPER('Test \\') AS upper_result", [], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).upper_result).toBe('TEST \\');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'Backslash string binding test', function(done) {
          var db = openDatabase('Backslash-string-binding-test.db');

          db.transaction(function(tx) {

            tx.executeSql('SELECT UPPER(?) AS upper_result', ['Test \\'], function(tx_ignored, rs1) {
              expect(rs1).toBeDefined();
              expect(rs1.rows).toBeDefined();
              expect(rs1.rows.length).toBe(1);
              expect(rs1.rows.item(0).upper_result).toBe('TEST \\');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

      });

      describe(suiteName + 'string test with non-primitive parameter values', function() {

        it(suiteName + 'String test with array parameter value', function(done) {
          var db = openDatabase('String-test-with-array-parameter-value.db');

          db.transaction(function(tx) {

            tx.executeSql('SELECT UPPER(?) AS upper_result', [['Test',null,123.456,789]], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).upper_result).toBe('TEST,,123.456,789');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'String test with new String object', function(done) {
          var db = openDatabase('String-object-string-test.db');

          db.transaction(function(tx) {

            tx.executeSql('SELECT UPPER(?) AS upper_result', [new String('Test value')], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).upper_result).toBe('TEST VALUE');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'String test with custom object parameter value', function(done) {
          // MyCustomParameterObject "class":
          function MyCustomParameterObject() {};
          MyCustomParameterObject.prototype.toString = function() {return 'toString result';};
          MyCustomParameterObject.prototype.valueOf = function() {return 'valueOf result';};

          var myObject = new MyCustomParameterObject();
          // Check myObject:
          expect(myObject.toString()).toBe('toString result');
          expect(myObject.valueOf()).toBe('valueOf result');

          var db = openDatabase('Custom-object-string-test.db');

          db.transaction(function(tx) {

            tx.executeSql('SELECT UPPER(?) AS upper_result', [myObject], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).upper_result).toBe('TOSTRING RESULT');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);
      });

      describe(suiteName + 'string test with [non-primitive] values for SQL', function() {

        it(suiteName + 'String test with new String for SQL', function(done) {
          var myNewString = new String("SELECT UPPER('Alice') as u1");

          var db = openDatabase('New-string-for-sql-test.db');

          db.transaction(function(tx) {
            tx.executeSql(myNewString, [], function(tx_ignored, resultSet) {
              // EXPECTED RESULT:
              expect(true).toBe(true);
              expect(resultSet).toBeDefined();
              expect(resultSet.rows).toBeDefined();
              expect(resultSet.rows.length).toBe(1);
              expect(resultSet.rows.item(0)).toBeDefined();
              expect(resultSet.rows.item(0).u1).toBeDefined();
              expect(resultSet.rows.item(0).u1).toBe('ALICE');
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);

            }, function(tx_ignored, error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              expect(error.message).toBe('--');
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          });
        }, MYTIMEOUT);

        it(suiteName + 'String test with single element array for SQL', function(done) {
          var db = openDatabase('String-test-with-single-element-array-for-sql.db');

          db.transaction(function(tx) {
            tx.executeSql(["SELECT UPPER('Alice') as u1"], [], function(tx_ignored, resultSet) {
              // EXPECTED RESULT:
              expect(true).toBe(true);
              expect(resultSet).toBeDefined();
              expect(resultSet.rows).toBeDefined();
              expect(resultSet.rows.length).toBe(1);
              expect(resultSet.rows.item(0)).toBeDefined();
              expect(resultSet.rows.item(0).u1).toBeDefined();
              expect(resultSet.rows.item(0).u1).toBe('ALICE');
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);

            }, function(tx_ignored, error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              expect(error.message).toBe('--');
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          });
        }, MYTIMEOUT);

        it(suiteName + 'String test with custom object for SQL', function(done) {
          // MyCustomObject "class":
          function MyCustomObject() {};
          MyCustomObject.prototype.toString = function() {return "SELECT UPPER('Alice') as u1";};
          MyCustomObject.prototype.valueOf = function() {return "SELECT UPPER('Betty') as u1";};

          var myObject = new MyCustomObject();
          // Check myObject:
          expect(myObject.toString()).toBe("SELECT UPPER('Alice') as u1");
          expect(myObject.valueOf()).toBe("SELECT UPPER('Betty') as u1");

          var db = openDatabase('Custom-object-for-sql-test.db');

          db.transaction(function(tx) {
            tx.executeSql(myObject, [], function(tx_ignored, resultSet) {
              // EXPECTED RESULT:
              expect(true).toBe(true);
              expect(resultSet).toBeDefined();
              expect(resultSet.rows).toBeDefined();
              expect(resultSet.rows.length).toBe(1);
              expect(resultSet.rows.item(0)).toBeDefined();
              expect(resultSet.rows.item(0).u1).toBeDefined();
              expect(resultSet.rows.item(0).u1).toBe('ALICE');
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);

            }, function(tx_ignored, error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              expect(error.message).toBe('--');
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          });
        }, MYTIMEOUT);

      });

      describe(suiteName + 'string test with dynamically changing objects', function() {

        it(suiteName + 'String test with dynamically changing object for SQL', function(done) {
          // MyDynamicObject "class":
          function MyDynamicObject() { this.name = 'Alice'; };
          MyDynamicObject.prototype.toString = function() {return "SELECT UPPER('" + this.name + "') as uppertext";}

          var myObject = new MyDynamicObject();

          // Check myObject:
          expect(myObject.toString()).toBe("SELECT UPPER('Alice') as uppertext");

          var db = openDatabase('Dynamic-object-for-sql-test.db');

          db.transaction(function(tx) {
            myObject.name = 'Betty';
            tx.executeSql(myObject, [], function(ignored, rs) {
              // EXPECTED RESULT:
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0)).toBeDefined();
              expect(rs.rows.item(0).uppertext).toBe('BETTY');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);

            }, function(tx_ignored, error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              expect(error.message).toBe('--');
              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
            myObject.name = 'Carol';
          });
        }, MYTIMEOUT);

        it(suiteName + 'String test with dynamically changing object parameter arg value', function(done) {
          // MyDynamicParameterObject "class":
          function MyDynamicParameterObject() {this.name='Alice';};
          MyDynamicParameterObject.prototype.toString = function() {return this.name;};

          var myObject = new MyDynamicParameterObject();

          // Check myObject:
          expect(myObject.toString()).toBe('Alice');

          var db = openDatabase('Dynamic-object-arg-string-test.db');

          db.transaction(function(tx) {
            myObject.name = 'Betty';
            tx.executeSql('SELECT UPPER(?) AS uppertext', [myObject], function(ignored, rs) {
              // EXPECTED RESULT:
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0)).toBeDefined();
              expect(rs.rows.item(0).uppertext).toBeDefined();
              expect(rs.rows.item(0).uppertext).toBe('BETTY');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
            myObject.name = 'Carol';

          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

      });

      describe(suiteName + 'string test with Array "subclass" for SQL parameter arg values array', function() {
        it(suiteName + 'SELECT UPPER(?) AS upper1, UPPER(?) AS upper2 with "naive" Array subclass (constructor NOT explicitly set) as value arguments array', function(done) {
          var db = openDatabase('SELECT-multi-upper-on-array-subclass.db');
          expect(db).toBeDefined();

          // Variation on the "naive approach" described in
          // http://perfectionkills.com/how-ecmascript-5-still-does-not-allow-to-subclass-an-array/
          function F() {}
          F.prototype = Array.prototype;
          function MyArraySubclass() {}
          MyArraySubclass.prototype = new F();
          myObject = new MyArraySubclass();
          myObject.push('s1', 's2');

          expect(myObject.length).toBe(2);
          expect(myObject[0]).toBe('s1');
          expect(myObject[1]).toBe('s2');

          expect(myObject.constructor).toBe(Array);

          db.transaction(function(tx) {
            tx.executeSql('SELECT UPPER(?) AS upper1, UPPER(?) AS upper2', myObject, function(ignored, rs) {
              // EXPECTED RESULT:
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).upper1).toBe('S1');
              expect(rs.rows.item(0).upper2).toBe('S2');
              done();
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'SELECT UPPER(?) AS upper1, UPPER(?) AS upper2 with "naive" Array subclass (constructor explicitly set to subclasss) as value arguments array [SQL argument values IGNORED by plugin]', function(done) {
          var db = openDatabase('SELECT-multi-upper-on-array-subclass-explicit-constructor.db');
          expect(db).toBeDefined();

          // Variation on the "naive approach" described in
          // http://perfectionkills.com/how-ecmascript-5-still-does-not-allow-to-subclass-an-array/
          function F() {}
          F.prototype = Array.prototype;
          function MyArraySubclass() {}
          MyArraySubclass.prototype = new F();
          myObject = new MyArraySubclass();
          myObject.push('s1', 's2');

          expect(myObject.length).toBe(2);
          expect(myObject[0]).toBe('s1');
          expect(myObject[1]).toBe('s2');

          expect(myObject.constructor).toBe(Array);
          myObject.constructor = MyArraySubclass;
          expect(myObject.constructor).toBe(MyArraySubclass);

          db.transaction(function(tx) {
            tx.executeSql('SELECT UPPER(?) AS upper1, UPPER(?) AS upper2', myObject, function(ignored, rs) {
              // EXPECTED RESULT:
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (isWebSql) {
                expect(rs.rows.item(0).upper1).toBe('S1');
                expect(rs.rows.item(0).upper2).toBe('S2');
              } else {
                expect(rs.rows.item(0).upper1).toBeNull();
                expect(rs.rows.item(0).upper2).toBeNull();
              }
              done();
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'Blank transaction string test with null/undefined callback functions', function(done) {
          var db = openDatabase('Blank-tx-string-test-with-undefined-parameter-list.db');

          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql("SELECT ''", null, null);
            tx.executeSql("SELECT ''", undefined, undefined);
            tx.executeSql("SELECT ''", null, undefined);
            tx.executeSql("SELECT ''", undefined, null);

            tx.executeSql("SELECT ''", null, null, null);
            tx.executeSql("SELECT ''", null, undefined, undefined);
            tx.executeSql("SELECT ''", null, null, undefined);
            tx.executeSql("SELECT ''", null, undefined, null);

            tx.executeSql("SELECT ''", undefined, null, null);
            tx.executeSql("SELECT ''", undefined, undefined, undefined);
            tx.executeSql("SELECT ''", undefined, null, undefined);
            tx.executeSql("SELECT ''", undefined, undefined, null);

            tx.executeSql("SELECT ''", null, function(ignored, rs) {
              expect(rs).toBeDefined();

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

        it(suiteName + 'Blank readTransaction string test with null/undefined callback functions', function(done) {
          var db = openDatabase('Blank-readtx-string-test-with-undefined-parameter-list.db');

          expect(db).toBeDefined();

          db.readTransaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql("SELECT ''", null, null);
            tx.executeSql("SELECT ''", undefined, undefined);
            tx.executeSql("SELECT ''", null, undefined);
            tx.executeSql("SELECT ''", undefined, null);

            tx.executeSql("SELECT ''", null, null, null);
            tx.executeSql("SELECT ''", null, undefined, undefined);
            tx.executeSql("SELECT ''", null, null, undefined);
            tx.executeSql("SELECT ''", null, undefined, null);

            tx.executeSql("SELECT ''", undefined, null, null);
            tx.executeSql("SELECT ''", undefined, undefined, undefined);
            tx.executeSql("SELECT ''", undefined, null, undefined);
            tx.executeSql("SELECT ''", undefined, undefined, null);

            tx.executeSql("SELECT ''", null, function(ignored, rs) {
              expect(rs).toBeDefined();

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

        it(suiteName + 'String binding test with extra transaction executeSql arguments', function(done) {
          var db = openDatabase('String-binding-test-extra-execute-args.db');

          db.transaction(function(tx) {
            tx.executeSql('SELECT UPPER(?) AS uppertext', ['Some US-ASCII text'], function success(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).uppertext).toBe("SOME US-ASCII TEXT");

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            }, function error(ignored, error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              expect(error.message).toBe('--');
              done();
            }, function extra(ignored1, ignored2) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              expect('Unexpected callback').toBe('--');
              done();
            });
          });
        }, MYTIMEOUT);

        it(suiteName + 'String binding test with extra readTransaction executeSql arguments', function(done) {
          var db = openDatabase('String-binding-test-extra-readtx-execute-args.db');

          db.readTransaction(function(tx) {
            tx.executeSql('SELECT UPPER(?) AS uppertext', ['Some US-ASCII text'], function success(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).uppertext).toBe("SOME US-ASCII TEXT");

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            }, function error(ignored, error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              expect(error.message).toBe('--');
              done();
            }, function extra(ignored1, ignored2) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              expect('Unexpected callback').toBe('--');
              done();
            });
          });
        }, MYTIMEOUT);

        it(suiteName + 'String manipulation test with extra transaction callbacks', function(done) {
          var db = openDatabase('String-test-with-extra-tx-cb.db');

          var check1 = false;
          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql("SELECT UPPER('Some US-ASCII text') AS uppertext", null, function(ignored, rs) {
              check1 = true;
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).uppertext).toBe("SOME US-ASCII TEXT");
            });
          }, function error(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          }, function success() {
            expect(check1).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          }, function extra(ignored) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect('Unexpected callback').toBe('--');
            done();
          });
        }, MYTIMEOUT);

        it(suiteName + 'String manipulation test with extra readTransaction callbacks', function(done) {
          var db = openDatabase('String-test-with-extra-readtx-cb.db');

          var check1 = false;
          db.readTransaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql("SELECT UPPER('Some US-ASCII text') AS uppertext", null, function(ignored, rs) {
              check1 = true;
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).uppertext).toBe("SOME US-ASCII TEXT");
            });
          }, function error(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          }, function success() {
            expect(check1).toBe(true);
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          }, function extra(ignored) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect('Unexpected callback').toBe('--');
            done();
          });
        }, MYTIMEOUT);

      });

      describe(suiteName + 'BLOB string test(s)', function() {

        it(suiteName + "SELECT HEX(X'010203') [BLOB value test]", function(done) {
          var db = openDatabase('SELECT-HEX-BLOB-test.db');

          db.transaction(function(tx) {

            tx.executeSql("SELECT HEX(X'010203') AS hexvalue", [], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).hexvalue).toBe('010203');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });

          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

      });

    });

  }

}

if (window.hasBrowser) mytests();
else exports.defineAutoTests = mytests;

/* vim: set expandtab : */
