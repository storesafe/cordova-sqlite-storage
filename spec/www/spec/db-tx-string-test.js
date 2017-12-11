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

      describe(suiteName + 'Basic US-ASCII string binding/manipulation tests [default sqlite encoding: UTF-16le on Windows; UTF-8 on others]', function() {

        it(suiteName + 'Inline US-ASCII String manipulation test with empty ([]) parameter list', function(done) {
          var db = openDatabase("Inline-US-ASCII-string-test-with-empty-parameter-list.db", "1.0", "Demo", DEFAULT_SIZE);

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
          var db = openDatabase("Inline-US-ASCII-string-test-with-null-parameter-list.db", "1.0", "Demo", DEFAULT_SIZE);

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
          var db = openDatabase("Inline-US-ASCII-string-test-with-undefined-parameter-list.db", "1.0", "Demo", DEFAULT_SIZE);

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
          var db = openDatabase("ASCII-string-binding-test.db", "1.0", "Demo", DEFAULT_SIZE);

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

        it(suiteName + 'US-ASCII String HEX parameter value test ("Test 123")', function(done) {
          var db = openDatabase("ASCII-String-hex-value-test.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {

            tx.executeSql('SELECT HEX(?) AS myresult', ['Test 123'], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (isWindows)
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

        it(suiteName + 'US-ASCII String HEX parameter value test ("Test 123")', function(done) {
          var db = openDatabase("ASCII-String-hex-value-test.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {

            tx.executeSql('SELECT HEX(?) AS myresult', ['Test 123'], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (isWindows)
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
          var db = openDatabase("tx-executeSql-new-String-test.db", "1.0", "Demo", DEFAULT_SIZE);

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

        it(suiteName + 'String HEX encoding test with \\0 (null) character [TRUNCATION BUG on Windows; HEX encoding BUG on Android-sqlite-connector]', function (done) {
          var db = openDatabase('text-string-with-null-character-test.db');

          db.transaction(function (tx) {
            tx.executeSql('SELECT HEX(?) AS hexvalue', ['abcd'], function (tx_ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);

              // NOTE: WebKit Web SQL on recent versions of Android & iOS
              // seems to use follow UTF-8 encoding/decoding rules.

              if (isWindows)
                expect(rs.rows.item(0).hexvalue).toBe('6100620063006400'); // (UTF16-le)
              else
                expect(rs.rows.item(0).hexvalue).toBe('61626364'); // (UTF-8)

              var expected_hexvalue_length = rs.rows.item(0).hexvalue.length;
              if (!isWindows)
                expect(expected_hexvalue_length).toBe(8);

              tx.executeSql('SELECT HEX(?) AS hexvalue', ['a\0cd'], function (tx_ignored, rs2) {
                expect(rs2).toBeDefined();
                expect(rs2.rows).toBeDefined();
                expect(rs2.rows.length).toBe(1);
                expect(rs2.rows.item(0).hexvalue).toBeDefined();

                // STOP HERE [HEX encoding BUG] for Android-sqlite-connector:
                if (!isWebSql && !isWindows && isAndroid && !isImpl2) return done();

                var hexvalue = rs2.rows.item(0).hexvalue;
                if (isWindows)
                  expect(hexvalue).toBe('6100'); // (UTF16-le with TRUNCATION BUG)
                else if (!isWebSql && isAndroid && !isImpl2)
                  expect(hexvalue).toBe('--'); // (UTF-8 with TRUNCATION BUG)
                else
                  expect(hexvalue).toBe('61006364'); // (UTF-8)

                // extra check:
                // ensure this matches our expectation of that database's
                // default encoding
                if (!isWindows)
                  expect(hexvalue.length).toBe(expected_hexvalue_length);

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
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

        it(suiteName + 'String encoding test with UNICODE \\u0000 (same as \\0) [TRUNCATION BUG on Windows; HEX encoding BUG on Android-sqlite-connector]', function (done) {
          var db = openDatabase('UNICODE-0000-hex-test.db');

          db.transaction(function (tx) {
            tx.executeSql('SELECT HEX("efgh") AS hexvalue', [], function (tx_ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);

              // NOTE: WebKit Web SQL on recent versions of Android & iOS
              // seems to use follow UTF-8 encoding/decoding rules.

              if (isWindows)
                expect(rs.rows.item(0).hexvalue).toBe('6500660067006800'); // )UTF-16le)
              else
                expect(rs.rows.item(0).hexvalue).toBe('65666768'); // (UTF-8)

              var expected_hexvalue_length = rs.rows.item(0).hexvalue.length;
              if (!isWindows)
                expect(expected_hexvalue_length).toBe(8);

              tx.executeSql('SELECT HEX(?) AS hexvalue', ['e\u0000gh'], function (tx_ignored, rs2) {
                expect(rs2).toBeDefined();
                expect(rs2.rows).toBeDefined();
                expect(rs2.rows.length).toBe(1);
                expect(rs2.rows.item(0).hexvalue).toBeDefined();

                // STOP HERE [HEX encoding BUG] for Android-sqlite-connector:
                if (!isWebSql && !isWindows && isAndroid && !isImpl2) return done();

                var hexvalue = rs2.rows.item(0).hexvalue;
                if (isWindows)
                  expect(hexvalue).toBe('6500'); // (UTF-16le with TRUNCATION BUG)
                else if (!isWebSql && isAndroid && !isImpl2)
                  expect(hexvalue).toBe('--'); // (UTF-8 with TRUNCATION BUG)
                else
                  expect(hexvalue).toBe('65006768'); // (UTF-8)

                // extra check:
                // ensure this matches our expectation of that database's
                // default encoding
                if (!isWindows)
                  expect(hexvalue.length).toBe(expected_hexvalue_length);

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
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

        it(suiteName + "INLINE CR-LF String test", function(done) {
          var db = openDatabase("Inline-CR-LF-String-test.db", "1.0", "Demo", DEFAULT_SIZE);
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
                    if (isWindows)
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

        it(suiteName + "INLINE string tab test", function(done) {
          var db = openDatabase("Inline-string-tab-test.db", "1.0", "Demo", DEFAULT_SIZE);
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
                if (isWindows)
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

        it(suiteName + "INLINE string vertical tab test", function(done) {
          if (isWP8) pending('BROKEN on WP(8)'); // [BUG #202] UNICODE characters not working with WP(8)

          var db = openDatabase("String-vertical-tab-test.db", "1.0", "Demo", DEFAULT_SIZE);
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
                if (isWindows)
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

        it(suiteName + "INLINE string form feed test", function(done) {
          if (isWP8) pending('BROKEN on WP(8)'); // [BUG #202] UNICODE characters not working with WP(8)

          var db = openDatabase("String-form-feed-test.db", "1.0", "Demo", DEFAULT_SIZE);
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
                if (isWindows)
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

        it(suiteName + "INLINE string backspace test", function(done) {
          if (isWP8) pending('BROKEN on WP(8)'); // [BUG #202] UNICODE characters not working with WP(8)

          var db = openDatabase("String-backspace-test.db", "1.0", "Demo", DEFAULT_SIZE);
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
                if (isWindows)
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

      describe(suiteName + 'UTF-8 multiple octet character string binding/manipulation tests [default sqlite encoding: UTF-16le on Windows, UTF-8 encoding on others]', function() {

        it(suiteName + 'string HEX parameter value test with UTF-8 2-octet character é', function(done) {
          var db = openDatabase("UTF8-2-octet-hex-value-test.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {

            tx.executeSql('SELECT HEX(?) AS myresult', ['1é'], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (isWindows)
                expect(rs.rows.item(0).myresult).toBe('3100E900'); // (UTF-16le)
              else
                expect(rs.rows.item(0).myresult).toBe('31C3A9'); // (UTF-8)

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

        it(suiteName + 'string parameter value manipulation test with UTF-8 2-octet character é', function(done) {
          var db = openDatabase("UTF8-2-octet-upper-value-string-test.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {

            tx.executeSql('SELECT UPPER(?) AS myresult', ['aé'], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (isAndroid && (isWebSql || (isImpl2 && /Android [5-9]/.test(navigator.userAgent))))
                expect(rs.rows.item(0).myresult).toBe('AÉ');
              else
                expect(rs.rows.item(0).myresult).toBe('Aé');

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

        it(suiteName + 'string HEX parameter value test with UTF-8 3-octet character €', function(done) {
          if (isWP8) pending('SKIP for WP(8)');

          var db = openDatabase("UTF8-3-octet-hex-value-test.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {

            tx.executeSql('SELECT HEX(?) AS myresult', ['1€'], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (isWindows)
                expect(rs.rows.item(0).myresult).toBe('3100AC20'); // (UTF-16le)
              else
                expect(rs.rows.item(0).myresult).toBe('31E282AC'); // (UTF-8)

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

        it(suiteName + 'string parameter value manipulation test with UTF-8 3-octet character €', function(done) {
          if (isWP8) pending('SKIP for WP(8)');

          var db = openDatabase("UTF8-3-octet-string-upper-value-test.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {

            tx.executeSql('SELECT UPPER(?) AS myresult', ['a€'], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myresult).toBe('A€');

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

        // TBD NOTE: In case of the default Android database implementation
        // (Android-sqlite-connector) it is possible to manipulate,
        // store, and retrieve a text string with 4-octet UTF-8 characters such as emojis.
        // However HEX manipulations do not work the same as Android/iOS WebKit Web SQL,
        // iOS plugin, or Android plugin with androidDatabaseImplementation : 2 setting.
        // This linkely indicates that such characters are stored differently [incorrectly]
        // due to UTF-8 string handling limitations of Android-sqlite-connector
        // and Android-sqlite-native-driver. ref: litehelpers/Cordova-sqlite-storage#564

        it(suiteName + 'Inline emoji string manipulation test: SELECT UPPER("a\\uD83D\\uDE03.") [\\u1F603 SMILING FACE (MOUTH OPEN)]', function(done) {
          var db = openDatabase("Inline-emoji-hex-test.db", "1.0", "Demo", DEFAULT_SIZE);
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

        it(suiteName + 'Inline emoji HEX test: SELECT HEX("@\\uD83D\\uDE03!") [\\u1F603 SMILING FACE (MOUTH OPEN)] [HEX encoding BUG on Android-sqlite-connector]', function(done) {
          var db = openDatabase("Inline-emoji-hex-test.db", "1.0", "Demo", DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT HEX("@\uD83D\uDE03!") AS hexvalue', [], function(tx_ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);

              // STOP HERE [HEX encoding BUG] for Android-sqlite-connector:
              if (!isWebSql && !isWindows && isAndroid && !isImpl2) return done();

              if (isWindows)
                expect(rs.rows.item(0).hexvalue).toBe('40003DD803DE2100'); // (UTF-16le)
              else
                expect(rs.rows.item(0).hexvalue).toBe('40F09F988321'); // (UTF-8)

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

        it(suiteName + "Inline BLOB with emoji string manipulation test: SELECT LOWER(X'41F09F9883') [A\uD83D\uDE03] [\\u1F603 SMILING FACE (MOUTH OPEN)]", function(done) {
          if (isWP8) pending('BROKEN for WP8');
          if (!isWebSql && !isWindows && isAndroid && !isImpl2) pending('BROKEN: CRASH on Android 5.x (default sqlite-connector version)');
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

        it(suiteName + 'emoji SELECT HEX(?) parameter value test: "@\\uD83D\\uDE03!" [\\u1F603 SMILING FACE (MOUTH OPEN)]', function(done) {
          if (isWP8) pending('BROKEN for WP8');
          if (isAndroid && !isWebSql && !isImpl2) pending('BROKEN for Android (default sqlite-connector version)');

          var db = openDatabase("String-emoji-parameter-value-test.db", "1.0", "Demo", DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT HEX(?) AS hexvalue', ['@\uD83D\uDE03!'], function(tx_ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (isWindows)
                expect(rs.rows.item(0).hexvalue).toBe('40003DD803DE2100'); // (UTF-16le)
              else
                expect(rs.rows.item(0).hexvalue).toBe('40F09F988321'); // (UTF-8)

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
          var db = openDatabase("UNICODE-line-separator-string-length.db", "1.0", "Demo", DEFAULT_SIZE);

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

        it(suiteName + 'HEX value of string with UNICODE \\u2028 line separator', function(done) {
          // NOTE: this test verifies that the UNICODE line separator (\u2028)
          // is seen by the sqlite implementation OK:
          var db = openDatabase("UNICODE-line-separator-hex-value-test.db", "1.0", "Demo", DEFAULT_SIZE);

          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT HEX(?) AS myresult', ['1\u2028'], function (tx_ignored, rs) {
              if (isWindows)
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
          var db = openDatabase("UNICODE-line-separator-string-lowertext.db", "1.0", "Demo", DEFAULT_SIZE);

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
          var db = openDatabase("UNICODE-paragraph-separator-string-length.db", "1.0", "Demo", DEFAULT_SIZE);

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

        it(suiteName + 'HEX value of string with UNICODE \\u2029 paragraph separator', function(done) {
          // NOTE: this test verifies that the UNICODE paragraph separator (\u2029)
          // is seen by the sqlite implementation OK:
          var db = openDatabase("UNICODE-paragraph-separator-hex-value-test.db", "1.0", "Demo", DEFAULT_SIZE);

          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT HEX(?) AS myresult', ['1\u2029'], function (tx_ignored, rs) {
              if (isWindows)
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
          var db = openDatabase("UNICODE-paragraph-separator-string-lowertext.db", "1.0", "Demo", DEFAULT_SIZE);

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

        it(suiteName + 'Inline string manipulation test with UTF-8 2/3 octet characters', function(done) {
          if (isWP8) pending('SKIP for WP(8)');

          var db = openDatabase("Inline-UTF8-string-manipulation-test.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {

            tx.executeSql("SELECT UPPER('Test ¢ é €') AS upper_result", [], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (isAndroid && (isWebSql || (isImpl2 && /Android [5-9]/.test(navigator.userAgent))))
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

        it(suiteName + 'string parameter manipulation test with UTF-8 2/3 octet characters', function(done) {
          if (isWP8) pending('SKIP for WP(8)');

          var db = openDatabase("UTF8-string-parameter-manipulation-test.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {

            tx.executeSql('SELECT UPPER(?) AS upper_result', ['Test ¢ é €'], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              if (isAndroid && (isWebSql || (isImpl2 && /Android [5-9]/.test(navigator.userAgent))))
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
          var db = openDatabase("INLINE-Double-quote-string-test.db", "1.0", "Demo", DEFAULT_SIZE);

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
          var db = openDatabase("Double-quote-string-binding-test.db", "1.0", "Demo", DEFAULT_SIZE);

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
          var db = openDatabase("INLINE-Backslash-string-test.db", "1.0", "Demo", DEFAULT_SIZE);

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
          var db = openDatabase("Backslash-string-binding-test.db", "1.0", "Demo", DEFAULT_SIZE);

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
          var db = openDatabase("String-test-with-array-parameter-value.db", "1.0", "Demo", DEFAULT_SIZE);

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
          var db = openDatabase("String-object-string-test.db", "1.0", "Demo", DEFAULT_SIZE);

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

          var db = openDatabase("Custom-object-string-test.db", "1.0", "Demo", DEFAULT_SIZE);

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

          var db = openDatabase("New-string-for-sql-test.db", "1.0", "Demo", DEFAULT_SIZE);

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
          var db = openDatabase("String-test-with-single-element-array-for-sql.db", "1.0", "Demo", DEFAULT_SIZE);

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

          var db = openDatabase("Custom-object-for-sql-test.db", "1.0", "Demo", DEFAULT_SIZE);

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

          var db = openDatabase("Dynamic-object-for-sql-test.db", "1.0", "Demo", DEFAULT_SIZE);

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

          var db = openDatabase("Dynamic-object-arg-string-test.db", "1.0", "Demo", DEFAULT_SIZE);

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
          var db = openDatabase("Blank-tx-string-test-with-undefined-parameter-list.db", "1.0", "Demo", DEFAULT_SIZE);

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
          var db = openDatabase("Blank-readtx-string-test-with-undefined-parameter-list.db", "1.0", "Demo", DEFAULT_SIZE);

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
          var db = openDatabase("String-binding-test-extra-execute-args.db", "1.0", "Demo", DEFAULT_SIZE);

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
          var db = openDatabase("String-binding-test-extra-readtx-execute-args.db", "1.0", "Demo", DEFAULT_SIZE);

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
          var db = openDatabase("String-test-with-extra-tx-cb.db", "1.0", "Demo", DEFAULT_SIZE);

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
          var db = openDatabase("String-test-with-extra-readtx-cb.db", "1.0", "Demo", DEFAULT_SIZE);

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
          var db = openDatabase("SELECT-HEX-BLOB-test.db", "1.0", "Demo", DEFAULT_SIZE);

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
