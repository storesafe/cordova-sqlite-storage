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
            androidLockWorkaround: 1
          });
        }
        if (isWebSql) {
          return window.openDatabase(name, "1.0", "Demo", DEFAULT_SIZE);
        } else {
          return window.sqlitePlugin.openDatabase(name, "1.0", "Demo", DEFAULT_SIZE);
        }
      }

        test_it(suiteName + "US-ASCII String manipulation test", function() {

          var db = openDatabase("ASCII-string-test.db", "1.0", "Demo", DEFAULT_SIZE);

          ok(!!db, 'valid db object');

          stop();

          db.transaction(function(tx) {

            ok(!!tx, 'valid tx object');

            tx.executeSql("select upper('Some US-ASCII text') as uppertext", [], function(tx, res) {

              console.log("res.rows.item(0).uppertext: " + res.rows.item(0).uppertext);

              equal(res.rows.item(0).uppertext, "SOME US-ASCII TEXT", "select upper('Some US-ASCII text')");

              start(1);
            });
          });
        });

        test_it(suiteName + ' string encoding test with UNICODE \\u0000', function () {
          if (isWindows) pending('BROKEN for Windows'); // XXX
          if (isWP8) pending('BROKEN for WP(8)'); // [BUG #202] UNICODE characters not working with WP(8)
          if (isAndroid && !isWebSql && !isOldImpl) pending('BROKEN for Android (default sqlite-connector version)'); // XXX

          stop();

          var dbName = "Unicode-hex-test";
          var db = openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function (tx) {
            tx.executeSql('SELECT hex(?) AS hexvalue', ['\u0000foo'], function (tx, res) {
              console.log(suiteName + "res.rows.item(0).hexvalue: " + res.rows.item(0).hexvalue);

              var hex1 = res.rows.item(0).hexvalue;

              // varies between Chrome-like (UTF-8)
              // and Safari-like (UTF-16)
              var expected = [
                '000066006F006F00',
                '00666F6F'
              ];

              ok(expected.indexOf(hex1) !== -1, 'hex matches: ' +
                  JSON.stringify(hex1) + ' should be in ' +
                  JSON.stringify(expected));

                // ensure this matches our expectation of that database's
                // default encoding
                tx.executeSql('SELECT hex("foob") AS hexvalue', [], function (tx, res) {
                  console.log(suiteName + "res.rows.item(0).hexvalue: " + res.rows.item(0).hexvalue);

                  var hex2 = res.rows.item(0).hexvalue;

                  equal(hex1.length, hex2.length,
                      'expect same length, i.e. same global db encoding');

                  start();
              });
            });
          }, function(err) {
            ok(false, 'unexpected error: ' + err.message);
          }, function () {
          });
        });

        test_it(suiteName + "CR-LF String test", function() {
          var db = openDatabase("CR-LF-String-test.db", "1.0", "Demo", DEFAULT_SIZE);
          ok(!!db, "db object");
          stop();

          db.transaction(function(tx) {
            ok(!!tx, "tx object");
            tx.executeSql("select upper('cr\r\nlf') as uppertext", [], function(tx, res) {
              ok(res.rows.item(0).uppertext !== "CR\nLF", "CR-LF should not be converted to \\n");
              equal(res.rows.item(0).uppertext, "CR\r\nLF", "CRLF ok");
              tx.executeSql("select upper('Carriage\rReturn') as uppertext", [], function(tx, res) {
                equal(res.rows.item(0).uppertext, "CARRIAGE\rRETURN", "CR ok");
                tx.executeSql("select upper('New\nLine') as uppertext", [], function(tx, res) {
                  equal(res.rows.item(0).uppertext, "NEW\nLINE", "newline ok");
                  start();
                });
              });
            });
          });
        });

        // NOTE: the next two tests show that for iOS [BUG #147]:
        // - UNICODE \u2028 line separator from Javascript to Objective-C is working ok
        // - UNICODE \u2028 line separator from Objective-C to Javascript is BROKEN
        test_it(suiteName + "UNICODE \\u2028 line separator string to hex", function() {
          if (isWP8) pending('BROKEN for WP(8)'); // [BUG #202] UNICODE characters not working with WP(8)

          // NOTE: this test verifies that the UNICODE line separator (\u2028)
          // is seen by the sqlite implementation OK:
          var db = openDatabase("UNICODE-line-separator-string-1.db", "1.0", "Demo", DEFAULT_SIZE);

          ok(!!db, "db object");

          stop();

          db.transaction(function(tx) {

            ok(!!tx, "tx object");

            var text = 'Abcd\u20281234';
            tx.executeSql("select hex(?) as hexvalue", [text], function (tx, res) {
              var hexvalue = res.rows.item(0).hexvalue;

              // varies between Chrome-like (UTF-8)
              // and Safari-like (UTF-16)
              var expected = [
                '41626364E280A831323334',
                '410062006300640028203100320033003400'
              ];

              ok(expected.indexOf(hexvalue) !== -1, 'hex matches: ' +
                  JSON.stringify(hexvalue) + ' should be in ' +
                  JSON.stringify(expected));

              start();
            });
          });
        });

        test_it(suiteName + ' handles UNICODE \\u2028 line separator correctly [string test]', function () {

          if (isWP8) pending('BROKEN for WP(8)'); // [BUG #202] UNICODE characters not working with WP(8)
          if (!(isWebSql || isAndroid || isIE)) pending('BROKEN for iOS'); // XXX [BUG #147] (no callback received)

          // NOTE: since the above test shows the UNICODE line separator (\u2028)
          // is seen by the sqlite implementation OK, it is now concluded that
          // the failure is caused by the Objective-C JSON result encoding.
          var db = openDatabase("UNICODE-line-separator-string-2.db", "1.0", "Demo", DEFAULT_SIZE);

          ok(!!db, "db object");

          stop();

          db.transaction(function(tx) {

            ok(!!tx, "tx object");

            var text = 'Abcd\u20281234';
            tx.executeSql("select lower(?) as lowertext", [text], function (tx, res) {
              ok(!!res, "res object");
              equal(res.rows.item(0).lowertext, "abcd\u20281234", "lower case string test with UNICODE line separator");

              start();
            });
          });
        });

    });
  }

}

if (window.hasBrowser) mytests();
else exports.defineAutoTests = mytests;

/* vim: set expandtab : */
