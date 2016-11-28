/* 'use strict'; */

var MYTIMEOUT = 12000;

var DEFAULT_SIZE = 5000000; // max to avoid popup in safari/ios

var isWP8 = /IEMobile/.test(navigator.userAgent); // Matches WP(7/8/8.1)
var isWindows = /Windows /.test(navigator.userAgent); // Windows (8.1)
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

    describe(scenarioList[i] + ': tx string test(s)', function() {
      var scenarioName = scenarioList[i];
      var suiteName = scenarioName + ': ';
      var isWebSql = (i === 1);
      var isImpl2 = (i === 2);

      // NOTE: MUST be defined in proper describe function scope, NOT outer scope:
      var openDatabase = function(name, ignored1, ignored2, ignored3) {
        if (isImpl2) {
          return window.sqlitePlugin.openDatabase({
            // prevent reuse of database from default db implementation:
            name: 'i2-'+name,
            androidDatabaseImplementation: 2,
            androidLockWorkaround: 1,
            iosDatabaseLocation: 'Documents'
          });
        }
        if (isWebSql) {
          return window.openDatabase(name, "1.0", "Demo", DEFAULT_SIZE);
        } else {
          return window.sqlitePlugin.openDatabase({name: name, location: 'default'});
        }
      }

      describe(suiteName + 'basic string binding/manipulation tests', function() {

        it(suiteName + 'Inline US-ASCII String manipulation test with empty ([]) parameter list', function(done) {
          var db = openDatabase("Inline-US-ASCII-string-test-with-empty-parameter-list.db", "1.0", "Demo", DEFAULT_SIZE);

          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql("SELECT UPPER('Some US-ASCII text') AS uppertext", [], function(tx, res) {
              expect(res.rows.item(0).uppertext).toBe("SOME US-ASCII TEXT");

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

        it(suiteName + 'Inline US-ASCII String manipulation test with null parameter list', function(done) {
          var db = openDatabase("Inline-US-ASCII-string-test-with-null-parameter-list.db", "1.0", "Demo", DEFAULT_SIZE);

          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql("SELECT UPPER('Some US-ASCII text') AS uppertext", null, function(tx, res) {
              expect(res.rows.item(0).uppertext).toBe("SOME US-ASCII TEXT");

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

        it(suiteName + 'Inline US-ASCII String manipulation test with undefined parameter list', function(done) {
          var db = openDatabase("Inline-US-ASCII-string-test-with-undefined-parameter-list.db", "1.0", "Demo", DEFAULT_SIZE);

          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql("SELECT UPPER('Some US-ASCII text') AS uppertext", undefined, function(tx, res) {
              expect(res.rows.item(0).uppertext).toBe("SOME US-ASCII TEXT");

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

        it(suiteName + 'US-ASCII String binding test', function(done) {
          var db = openDatabase("ASCII-string-binding-test.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {
            tx.executeSql('SELECT UPPER(?) AS uppertext', ['Some US-ASCII text'], function(tx, res) {
              expect(res.rows.item(0).uppertext).toBe("SOME US-ASCII TEXT");

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

        it(suiteName + 'tx.executeSql(new String(sql))', function(done) {
          var db = openDatabase("tx-executeSql-new-String-test.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql(new String("SELECT UPPER('Some US-ASCII text') AS uppertext"), [], function(tx, res) {
              expect(res.rows.item(0).uppertext).toBe("SOME US-ASCII TEXT");

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

        it(suiteName + 'String encoding test with UNICODE \\u0000', function (done) {
          if (isWP8) pending('BROKEN for WP(8)'); // [BUG #202] UNICODE characters not working with WP(8)
          if (isWindows) pending('BROKEN for Windows'); // [FUTURE TBD, already documented]
          if (!isWebSql && isAndroid && !isImpl2) pending('BROKEN for Android (default sqlite-connector version)'); // [FUTURE TBD (documented)]

          var dbName = "Unicode-hex-test";
          var db = openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function (tx) {
            tx.executeSql('SELECT HEX("foob") AS hexvalue', [], function (tx, res) {
              console.log(suiteName + "res.rows.item(0).hexvalue: " + res.rows.item(0).hexvalue);

              var expected_hexvalue_length = res.rows.item(0).hexvalue.length;

              tx.executeSql('SELECT HEX(?) AS hexvalue', ['\u0000foo'], function (tx, res) {
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
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(JSON.stringify(err)).toBe('--');
            // Close (plugin only) & finish:
            (isWebSql) ? done() : db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + "CR-LF String test", function(done) {
          var db = openDatabase("CR-LF-String-test.db", "1.0", "Demo", DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql("SELECT UPPER('cr\r\nlf') AS uppertext", [], function(tx, res) {
              expect(res.rows.item(0).uppertext).not.toBe("CR\nLF"); // CR-LF should not be converted to \\n
              expect(res.rows.item(0).uppertext).toBe("CR\r\nLF"); // Check CR-LF OK
              tx.executeSql("SELECT UPPER('Carriage\rReturn') AS uppertext", [], function(tx, res) {
                expect(res.rows.item(0).uppertext).toBe("CARRIAGE\rRETURN"); // Check CR OK
                tx.executeSql("SELECT UPPER('New\nLine') AS uppertext", [], function(tx, res) {
                  expect(res.rows.item(0).uppertext).toBe("NEW\nLINE"); // CHECK newline OK

                  // Close (plugin only) & finish:
                  (isWebSql) ? done() : db.close(done, done);
                });
              });
            });
          });
        }, MYTIMEOUT);

        it(suiteName + "String tab test", function(done) {
          var db = openDatabase("String-tab-test.db", "1.0", "Demo", DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql("SELECT UPPER('first\tsecond') AS uppertext", [], function(tx, res) {
              expect(res.rows.item(0).uppertext).toBe('FIRST\tSECOND');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

        it(suiteName + "String vertical tab test", function(done) {
          if (isWP8) pending('BROKEN for WP(8)'); // [BUG #202] UNICODE characters not working with WP(8)

          var db = openDatabase("String-vertical-tab-test.db", "1.0", "Demo", DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql("SELECT UPPER('first\vsecond') AS uppertext", [], function(tx, res) {
              expect(res.rows.item(0).uppertext).toBe('FIRST\vSECOND');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

        it(suiteName + "String form feed test", function(done) {
          if (isWP8) pending('BROKEN for WP(8)'); // [BUG #202] UNICODE characters not working with WP(8)

          var db = openDatabase("String-form-feed-test.db", "1.0", "Demo", DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql("SELECT UPPER('first\fsecond') AS uppertext", [], function(tx, res) {
              expect(res.rows.item(0).uppertext).toBe('FIRST\fSECOND');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

        it(suiteName + "String backspace test", function(done) {
          if (isWP8) pending('BROKEN for WP(8)'); // [BUG #202] UNICODE characters not working with WP(8)

          var db = openDatabase("String-backspace-test.db", "1.0", "Demo", DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql("SELECT UPPER('first\bsecond') AS uppertext", [], function(tx, res) {
              expect(res.rows.item(0).uppertext).toBe('FIRST\bSECOND');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

        // NOTE On Windows [using a customized version of the SQLite3-WinRT component] and
        // default Android-sqlite-connector implementations it is possible to manipulate,
        // store, and retrieve a text string with 4-octet UTF-8 characters such as emojis.
        // However HEX manipulations do not work the same as Android/iOS WebKit Web SQL,
        // iOS plugin, or Android plugin with androidDatabaseImplementation : 2 setting.
        // This linkely indicates that such characters are stored differently
        // due to UTF-8 string handling limitations of Android-sqlite-connector
        // and Windows (SQLite3-WinRT) versions. ref: litehelpers/Cordova-sqlite-storage#564

        it(suiteName + 'Inline emoji string manipulation test: SELECT UPPER("a\\uD83D\\uDE03.") [\\u1F603 SMILING FACE (MOUTH OPEN)]', function(done) {
          var db = openDatabase("Inline-emoji-hex-test.db", "1.0", "Demo", DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT UPPER("a\uD83D\uDE03.") AS uppertext', [], function(tx, res) {
              expect(res.rows.item(0).uppertext).toBe('A\uD83D\uDE03.');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

        it(suiteName + 'Inline emoji HEX test: SELECT HEX("@\\uD83D\\uDE03!") [\\u1F603 SMILING FACE (MOUTH OPEN)]', function(done) {
          if (isWP8) pending('BROKEN for WP8');
          if (isAndroid && !isWebSql && !isImpl2) pending('BROKEN for Android (default sqlite-connector version)');
          if (isWindows) pending('BROKEN for Windows');

          var db = openDatabase("Inline-emoji-hex-test.db", "1.0", "Demo", DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT HEX("@\uD83D\uDE03!") AS hexvalue', [], function(tx, res) {
              expect(res.rows.item(0).hexvalue).toBe('40F09F988321');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

        it(suiteName + "Inline BLOB with emoji string manipulation test: SELECT LOWER(X'41F09F9883') [A\uD83D\uDE03] [\\u1F603 SMILING FACE (MOUTH OPEN)]", function(done) {
          if (isWP8) pending('BROKEN for WP8');
          if (isAndroid && !isWebSql && !isImpl2) pending('BROKEN for Android (default sqlite-connector version)'); // CRASH on Android 5.x
          if (isWindows) pending('BROKEN for Windows');

          var db = openDatabase("Inline-emoji-select-lower-result-test.db", "1.0", "Demo", DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql("SELECT LOWER(X'41F09F9883') AS lowertext", [], function(ignored, res) {
              expect(res).toBeDefined();
              expect(res.rows.item(0).lowertext).toBe('a\uD83D\uDE03');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

        it(suiteName + 'emoji SELECT HEX(?) parameter value test: "@\\uD83D\\uDE03!" [\\u1F603 SMILING FACE (MOUTH OPEN)]', function(done) {
          if (isWP8) pending('BROKEN for WP8');
          if (isAndroid && !isWebSql && !isImpl2) pending('BROKEN for Android (default sqlite-connector version)');
          if (isWindows) pending('BROKEN for Windows');

          var db = openDatabase("String-emoji-parameter-value-test.db", "1.0", "Demo", DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql('SELECT HEX(?) AS hexvalue', ['@\uD83D\uDE03!'], function(tx, res) {
              expect(res.rows.item(0).hexvalue).toBe('40F09F988321');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

        // NOTE: the next two tests show that for iOS/macOS/Android:
        // - UNICODE \u2028 line separator from JavaScript to native (Objective-C/Java) is working OK
        // - UNICODE \u2028 line separator from native (Objective-C/Java) to JavaScript is BROKEN
        // For reference:
        // - litehelpers/Cordova-sqlite-storage#147
        // - Apache Cordova CB-9435 (issue with cordova-ios, also affects macOS)
        // - cordova/cordova-discuss#57 (issue with cordova-android)
        it(suiteName + "UNICODE \\u2028 line separator string length", function(done) {
          if (isWP8) pending('BROKEN for WP(8)'); // [BUG #202] Certain UNICODE characters not working with WP(8)

          // NOTE: this test verifies that the UNICODE line separator (\u2028)
          // is seen by the sqlite implementation OK:
          var db = openDatabase("UNICODE-line-separator-string-length.db", "1.0", "Demo", DEFAULT_SIZE);

          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql("select length(?) AS stringlength", ['First\u2028Second'], function (tx, res) {
              expect(res.rows.item(0).stringlength).toBe(12);

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

        it(suiteName + ' handles UNICODE \\u2028 line separator correctly [string test]', function (done) {
          if (isWP8) pending('BROKEN for WP(8)'); // [BUG #202] UNICODE characters not working with WP(8)
          if (!isWebSql && isAndroid) pending('BROKEN for Android plugin (cordova-android 6.x'); // see cordova/cordova-discuss#57
          if (!isWebSql && !isAndroid && !isWindows && !isWP8) pending('BROKEN for iOS/macOS plugin'); // [BUG #147] (no callback received)

          // NOTE: since the above test shows the UNICODE line separator (\u2028)
          // is seen by the sqlite implementation OK, it is now concluded that
          // the failure is caused by the native JSON result encoding.
          var db = openDatabase("UNICODE-line-separator-string-lowertext.db", "1.0", "Demo", DEFAULT_SIZE);

          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql("SELECT LOWER(?) AS lowertext", ['First\u2028Second'], function (tx, res) {
              expect(res).toBeDefined();
              expect(res.rows.item(0).lowertext).toBe("first\u2028second");

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

        // NOTE: the next two tests repeat the above for UNICODE \u2029 paragraph separator
        // on iOS/macOS/Android:
        // - UNICODE \u2029 paragraph separator from JavaScript to native (Objective-C/Java) is working OK
        // - UNICODE \u2029 paragraph separator from native (Objective-C/Java) to JavaScript is BROKEN
        // For reference:
        // - litehelpers/Cordova-sqlite-storage#147
        // - Apache Cordova CB-9435 (issue with cordova-ios, also affects macOS)
        // - cordova/cordova-discuss#57 (issue with cordova-android)
        it(suiteName + "UNICODE \\u2029 paragraph separator string length", function(done) {
          if (isWP8) pending('BROKEN for WP(8)'); // [BUG #202] Certain UNICODE characters not working with WP(8)

          // NOTE: this test verifies that the UNICODE paragraph separator (\u2029)
          // is seen by the sqlite implementation OK:
          var db = openDatabase("UNICODE-paragraph-separator-string-length.db", "1.0", "Demo", DEFAULT_SIZE);

          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            var text = 'Abcd\u20281234';
            tx.executeSql("select length(?) AS stringlength", ['First\u2029Second'], function (tx, res) {
              expect(res.rows.item(0).stringlength).toBe(12);

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

        it(suiteName + ' handles UNICODE \\u2029 paragraph separator correctly [string test]', function (done) {
          if (isWP8) pending('BROKEN for WP(8)'); // [BUG #202] UNICODE characters not working with WP(8)
          if (!isWebSql && isAndroid) pending('BROKEN for Android plugin (cordova-android 6.x'); // see cordova/cordova-discuss#57
          if (!isWebSql && !isAndroid && !isWindows && !isWP8) pending('BROKEN for iOS/macOS plugin'); // [BUG #147] (no callback received)

          // NOTE: since the above test shows the UNICODE paragraph separator (\u2029)
          // is seen by the sqlite implementation OK, it is now concluded that
          // the failure is caused by the native JSON result encoding.
          var db = openDatabase("UNICODE-paragraph-separator-string-lowertext.db", "1.0", "Demo", DEFAULT_SIZE);

          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql("SELECT LOWER(?) AS lowertext", ['First\u2029Second'], function (tx, res) {
              expect(res).toBeDefined();
              expect(res.rows.item(0).lowertext).toBe("first\u2029second");

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

        it(suiteName + 'UTF-8 string test', function(done) {
          if (isWP8) pending('SKIP for WP(8)');

          var db = openDatabase("UTF8-string-test.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {

            tx.executeSql("SELECT UPPER('Test ¢ é €') AS upper_result", [], function(ignored, rs) {
              if (isAndroid && (isWebSql || (isImpl2 && /Android [5-9]/.test(navigator.userAgent))))
                expect(rs.rows.item(0).upper_result).toBe('TEST ¢ É €');
              else
                expect(rs.rows.item(0).upper_result).toBe('TEST ¢ é €');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

        it(suiteName + 'UTF-8 string binding test', function(done) {
          if (isWP8) pending('SKIP for WP(8)');

          var db = openDatabase("UTF8-string-binding-test.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {

            tx.executeSql('SELECT UPPER(?) AS upper_result', ['Test ¢ é €'], function(ignored, rs) {
              if (isAndroid && (isWebSql || (isImpl2 && /Android [5-9]/.test(navigator.userAgent))))
                expect(rs.rows.item(0).upper_result).toBe('TEST ¢ É €');
              else
                expect(rs.rows.item(0).upper_result).toBe('TEST ¢ é €');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

        it(suiteName + 'Double-quote string test', function(done) {
          var db = openDatabase("Double-quote-string-test.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {

            tx.executeSql("SELECT UPPER('\"String\" test') AS upper_result", [], function(ignored, rs) {
              expect(rs.rows.item(0).upper_result).toBe('"STRING" TEST');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

        it(suiteName + 'Double-quote string binding test', function(done) {
          var db = openDatabase("Double-quote-string-binding-test.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {

            tx.executeSql('SELECT UPPER(?) AS upper_result', ['"String" test'], function(ignored, rs) {
              expect(rs.rows.item(0).upper_result).toBe('"STRING" TEST');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

        it(suiteName + 'Backslash string test', function(done) {
          var db = openDatabase("Backslash-string-test.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {

            tx.executeSql("SELECT UPPER('Test \\') AS upper_result", [], function(ignored, rs) {
              expect(rs.rows.item(0).upper_result).toBe('TEST \\');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

        it(suiteName + 'Backslash string binding test', function(done) {
          var db = openDatabase("Backslash-string-binding-test.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {

            tx.executeSql('SELECT UPPER(?) AS upper_result', ['Test \\'], function(ignored, rs) {
              expect(rs.rows.item(0).upper_result).toBe('TEST \\');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

      });

      describe(suiteName + 'string test with non-primitive parameter values', function() {

        it(suiteName + 'String test with array parameter value', function(done) {
          var db = openDatabase("String-test-with-array-parameter-value.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {

            tx.executeSql('SELECT UPPER(?) AS upper_result', [['Test',null,123.456,789]], function(ignored, rs) {
              expect(rs.rows.item(0).upper_result).toBe('TEST,,123.456,789');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

        it(suiteName + 'String test with new String object', function(done) {
          var db = openDatabase("String-object-string-test.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {

            tx.executeSql('SELECT UPPER(?) AS upper_result', [new String('Test value')], function(ignored, rs) {
              expect(rs.rows.item(0).upper_result).toBe('TEST VALUE');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
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
              expect(rs.rows.item(0).upper_result).toBe('TOSTRING RESULT');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
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
          });
        }, MYTIMEOUT);

      });

      describe(suiteName + 'string test with Array "subclass" for SQL parameter arg values array', function() {
        ;
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

        xit(suiteName + 'Blank string test with null/undefined callback functions', function(done) {
          var db = openDatabase("Inline-US-ASCII-string-test-with-undefined-parameter-list.db", "1.0", "Demo", DEFAULT_SIZE);

          expect(db).toBeDefined();

          db.transaction(function(tx) {
            expect(tx).toBeDefined();

            tx.executeSql("SELECT ''", null, null);
            tx.executeSql("SELECT ''", undefined, undefined);
            tx.executeSql("SELECT ''", null, undefined);
            tx.executeSql("SELECT ''", undefined, null);

            tx.executeSql("SELECT ''", function(ignored, rs) {
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
          });
        }, MYTIMEOUT);

      });

    });

  }

}

if (window.hasBrowser) mytests();
else exports.defineAutoTests = mytests;

/* vim: set expandtab : */
