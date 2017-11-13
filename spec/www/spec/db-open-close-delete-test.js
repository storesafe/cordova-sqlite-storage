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

var isWP8 = /IEMobile/.test(navigator.userAgent); // Matches WP(7/8/8.1)
var isWindows = /Windows /.test(navigator.userAgent);
var isAndroid = !isWindows && /Android/.test(navigator.userAgent);

// NOTE: While in certain version branches there is no difference between
// the default Android implementation and implementation #2,
// this test script will also apply the androidLockWorkaround: 1 option
// in case of implementation #2.
var pluginScenarioList = [
  isAndroid ? 'Plugin-implementation-default' : 'Plugin',
  'Plugin-implementation-2'
];

var pluginScenarioCount = isAndroid ? 2 : 1;

var mytests = function() {

  describe('Open database parameter test(s)', function() {

    for (var i=0; i<pluginScenarioCount; ++i) {

      describe(pluginScenarioList[i] + ': open database file name test(s)', function() {
        var scenarioName = pluginScenarioList[i];
        var suiteName = scenarioName + ': ';
        var isImpl2 = (i === 1);

        // NOTE: MUST be defined in function scope, NOT outer scope:
        var openDatabase = function(first, second, third, fourth, fifth, sixth) {
          var dbname, okcb, errorcb;

          if (first.constructor === String ) {
            dbname = first;
            okcb = fifth;
            errorcb = sixth;
          } else {
            dbname = first.name;
            okcb = second;
            errorcb = third;
          }

          if (!isImpl2) {
            return window.sqlitePlugin.openDatabase({name: dbname, location: 'default'}, okcb, errorcb);
          }

          var dbopts = {
            name: 'i2-'+dbname,
            androidDatabaseImplementation: 2,
            androidLockWorkaround: 1,
            location: 1
          };

          return window.sqlitePlugin.openDatabase(dbopts, okcb, errorcb);
        }

        it(suiteName + 'Open database with normal US-ASCII characters (no slash) & check database file name', function(done) {
          var dbName = "Test!123-456$789.db";

          try {
            openDatabase({name: dbName, location: 'default'}, function(db) {
              // EXPECTED RESULT:
              expect(db).toBeDefined();
              db.executeSql('PRAGMA database_list', [], function(rs) {
                // EXPECTED RESULT:
                expect(rs).toBeDefined();
                expect(rs.rows).toBeDefined();
                expect(rs.rows.length).toBe(1);
                expect(rs.rows.item(0).name).toBe('main');
                expect(rs.rows.item(0).file).toBeDefined();
                expect(rs.rows.item(0).file.indexOf(dbName)).not.toBe(-1);

                // Close & finish:
                db.close(done, done);
              }, function(error) {
                // NOT EXPECTED:
                expect(false).toBe(true);
                expect(error.message).toBe('--');
                done();
              });
            }, function(error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              expect(error.message).toBe('--');
              done();
            });
          } catch (e) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(e.message).toBe('--');
            done();
          }
        }, MYTIMEOUT);

        it(suiteName + 'Open database with EXTRA US-ASCII characters WITHOUT SLASH & check database file name - WORKING on Android/iOS/macOS/Windows', function(done) {
          var dbName = "Test @#$%^&(), '1' [] {} _-+=:;.db";

          try {
            openDatabase({name: dbName, location: 'default'}, function(db) {
              // EXPECTED RESULT:
              expect(db).toBeDefined();
              db.executeSql('PRAGMA database_list', [], function(rs) {
                // EXPECTED RESULT:
                expect(rs).toBeDefined();
                expect(rs.rows).toBeDefined();
                expect(rs.rows.length).toBe(1);
                expect(rs.rows.item(0).name).toBe('main');
                expect(rs.rows.item(0).file).toBeDefined();
                expect(rs.rows.item(0).file.indexOf(dbName)).not.toBe(-1);

                // Close & finish:
                db.close(done, done);
              }, function(error) {
                // NOT EXPECTED:
                expect(false).toBe(true);
                expect(error.message).toBe('--');
                done();
              });
            }, function(error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              expect(error.message).toBe('--');
              done();
            });
          } catch (e) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(e.message).toBe('--');
            done();
          }
        }, MYTIMEOUT);

        it(suiteName + 'Open database WITH SLASH (/) REPORTS ERROR (all supported platforms Android/iOS/macOS/Windows)', function(done) {
          var dbName = "first/second.db";

          try {
            openDatabase({name: dbName, location: 'default'}, function(db) {
              // NOT EXPECTED:
              expect(false).toBe(true);

              // Close (plugin) & finish:
              db.close(done, done);
            }, function(error) {
              // EXPECTED RESULT:
              expect(error).toBeDefined();
              expect(error.message).toBeDefined();
              expect(error.message).toMatch(/Could not open database/);
              done();
            });
          } catch (e) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(e.message).toBe('--');
            done();
          }
        }, MYTIMEOUT);

        it(suiteName + 'Open database with EXTRA, UNSUPPORTED US-ASCII characters WITHOUT SLASH [BROKEN on Windows, OK on Android/iOS/macOS]', function(done) {
          var dbName = "Test @#$%^&*(),<>'1' \"2\" [] {} _-+=:; \\ ||?.db";

          try {
            openDatabase({name: dbName, location: 'default'}, function(db) {
              // EXPECTED RESULT on Android/iOS/macOS:
              if (isWindows) expect('UNEXPECTED SUCCESS on Windows PLEASE UPDATE TEST');
              expect(db).toBeDefined();
              db.executeSql('PRAGMA database_list', [], function(rs) {
                // EXPECTED RESULT:
                expect(rs).toBeDefined();
                expect(rs.rows).toBeDefined();
                expect(rs.rows.length).toBe(1);
                expect(rs.rows.item(0).name).toBe('main');
                expect(rs.rows.item(0).file).toBeDefined();
                expect(rs.rows.item(0).file.indexOf(dbName)).not.toBe(-1);

                // Close & finish:
                db.close(done, done);
              }, function(error) {
                // NOT EXPECTED:
                expect(false).toBe(true);
                expect(error.message).toBe('--');
                done();
              });
            }, function(error) {
              // EXPECTED RESULT on Windows ONLY:
              if (isWindows) {
                expect(true).toBe(true);
              } else {
                expect(false).toBe(true);
                expect(error.message).toBe('--');
              }
              done();
            });
          } catch (e) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(e.message).toBe('--');
            done();
          }
        }, MYTIMEOUT);

        it(suiteName + 'Open database with u2028 & check database file name - Windows ONLY [Cordova BROKEN Android/iOS/macOS]', function(done) {
          if (!isWindows) pending('SKIP for Android/macOS/iOS due to Cordova BUG');

          var dbName = 'first\u2028second.db';

          try {
            openDatabase({name: dbName, location: 'default'}, function(db) {
              // EXPECTED RESULT:
              expect(db).toBeDefined();
              db.executeSql('PRAGMA database_list', [], function(rs) {
                // EXPECTED RESULT:
                expect(rs).toBeDefined();
                expect(rs.rows).toBeDefined();
                expect(rs.rows.length).toBe(1);
                expect(rs.rows.item(0).name).toBe('main');
                expect(rs.rows.item(0).file).toBeDefined();
                expect(rs.rows.item(0).file.indexOf(dbName)).not.toBe(-1);

                // Close & finish:
                db.close(done, done);
              }, function(error) {
                // NOT EXPECTED:
                expect(false).toBe(true);
                expect(error.message).toBe('--');
                done();
              });
            }, function(error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              expect(error.message).toBe('--');
              done();
            });
          } catch (e) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(e.message).toBe('--');
            done();
          }
        }, MYTIMEOUT);

        it(suiteName + 'Open database with u2029 & check database file name - Windows ONLY [BROKEN: Cordova BUG Android/iOS/macOS]', function(done) {
          if (!isWindows) pending('SKIP for Android/macOS/iOS due to Cordova BUG');

          var dbName = 'first\u2029second.db';

          try {
            openDatabase({name: dbName, location: 'default'}, function(db) {
              // EXPECTED RESULT:
              expect(db).toBeDefined();
              db.executeSql('PRAGMA database_list', [], function(rs) {
                // EXPECTED RESULT:
                expect(rs).toBeDefined();
                expect(rs.rows).toBeDefined();
                expect(rs.rows.length).toBe(1);
                expect(rs.rows.item(0).name).toBe('main');
                expect(rs.rows.item(0).file).toBeDefined();
                expect(rs.rows.item(0).file.indexOf(dbName)).not.toBe(-1);

                // Close & finish:
                db.close(done, done);
              }, function(error) {
                // NOT EXPECTED:
                expect(false).toBe(true);
                expect(error.message).toBe('--');
                done();
              });
            }, function(error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              expect(error.message).toBe('--');
              done();
            });
          } catch (e) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(e.message).toBe('--');
            done();
          }
        }, MYTIMEOUT);

        // TBD emoji (UTF-8 4 octets) [NOT RECOMMENDED]:
        it(suiteName + 'Open database with emoji \uD83D\uDE03 (UTF-8 4 octets) & check database file name [NOT RECOMMENDED]', function(done) {
          var dbName = 'a\uD83D\uDE03';

          try {
            openDatabase({name: dbName, location: 'default'}, function(db) {
              // EXPECTED RESULT:
              expect(db).toBeDefined();
              db.executeSql('PRAGMA database_list', [], function(rs) {
                // EXPECTED RESULT:
                expect(rs).toBeDefined();
                expect(rs.rows).toBeDefined();
                expect(rs.rows.length).toBe(1);
                expect(rs.rows.item(0).name).toBe('main');
                expect(rs.rows.item(0).file).toBeDefined();
                expect(rs.rows.item(0).file.indexOf(dbName)).not.toBe(-1);

                // Close & finish:
                db.close(done, done);
              }, function(error) {
                // NOT EXPECTED:
                expect(false).toBe(true);
                expect(error.message).toBe('--');
                done();
              });
            }, function(error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              expect(error.message).toBe('--');
              done();
            });
          } catch (e) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(e.message).toBe('--');
            done();
          }
        }, MYTIMEOUT);

        // WORKING on ALL PLATFORMS:
        var additionalDatabaseNameScenarios = [
          // MORE SUPPORTED US-ASCII characters
          {label: '@', dbName: 'first@second.db'},
          {label: '#', dbName: 'first#second.db'},
          {label: '%', dbName: 'first%second.db'},
          {label: '^', dbName: 'first^second.db'},
          {label: '&', dbName: 'first&second.db'},
          {label: '()', dbName: 'first () second.db'},
          {label: '{}', dbName: 'first {} second.db'},
          {label: '[]', dbName: 'first [] second.db'},
          {label: '_', dbName: 'first_second.db'},
          {label: '-', dbName: 'first-second.db'},
          {label: '+', dbName: 'first+second.db'},
          {label: '=', dbName: 'first=second.db'},
          {label: ',', dbName: 'first , second.db'},
          {label: ':', dbName: 'first:second.db'},
          {label: ';', dbName: 'first;second.db'},
          {label: "'1'", dbName: "'1'.db"},
          // UTF-8 multiple octets:
          {label: 'é (UTF-8 2 octets)', dbName: 'aé.db'},
          {label: '€ (UTF-8 3 octets)', dbName: 'a€.db'},
        ];

        additionalDatabaseNameScenarios.forEach(function(mytest) {
          it(suiteName + 'Open database & check database file name with ' + mytest.label, function(done) {
            var dbName = mytest.dbName;

            try {
              openDatabase({name: dbName, location: 'default'}, function(db) {
                // EXPECTED RESULT:
                expect(db).toBeDefined();
                db.executeSql('PRAGMA database_list', [], function(rs) {
                  // EXPECTED RESULT:
                  expect(rs).toBeDefined();
                  expect(rs.rows).toBeDefined();
                  expect(rs.rows.length).toBe(1);
                  expect(rs.rows.item(0).name).toBe('main');
                  expect(rs.rows.item(0).file).toBeDefined();
                  expect(rs.rows.item(0).file.indexOf(dbName)).not.toBe(-1);

                  // Close & finish:
                  db.close(done, done);
                }, function(error) {
                  // NOT EXPECTED:
                  expect(false).toBe(true);
                  expect(error.message).toBe('--');
                  done();
                });
              }, function(error) {
                // NOT EXPECTED:
                expect(false).toBe(true);
                expect(error.message).toBe('--');
                done();
              });
            } catch (e) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              expect(e.message).toBe('--');
              done();
            }
          }, MYTIMEOUT);
        });


        var unsupportedDatabaseNameScenariosWithFailureOnWindows = [
          {label: 'tab', dbName: 'first\tsecond'},
          {label: 'CR', dbName: 'a\rb'},
          {label: 'LF', dbName: 'a\nb'},
          {label: 'CRLF', dbName: 'a\r\nb'},
          {label: 'vertical tab', dbName: 'a\v1'},
          {label: 'form feed', dbName: 'a\f1'},
          {label: 'backspace', dbName: 'a\b1'},
          {label: '*', dbName: 'first * second.db'},
          {label: '<', dbName: 'first < second.db'},
          {label: '>', dbName: 'first > second.db'},
          {label: '\\', dbName: 'first\\second.db'},
          {label: '?', dbName: 'a?.db'},
          {label: '"2".db', dbName: '"2".db'},
          {label: '||', dbName: 'first||second.db'},
        ];

        unsupportedDatabaseNameScenariosWithFailureOnWindows.forEach(function(mytest) {
          it(suiteName + 'Open database & check database file name with ' + mytest.label + ' [NOT SUPPORTED, NOT WORKING on Windows]', function(done) {
            var dbName = mytest.dbName;

            try {
              openDatabase({name: dbName, location: 'default'}, function(db) {
                // EXPECTED RESULT (Android/iOS/macOS):
                if (isWindows) expect('UNEXPECTED SUCCESS on Windows PLEASE UPDATE THIS TEST').toBe('--');
                expect(db).toBeDefined();

                db.executeSql('PRAGMA database_list', [], function(rs) {
                  // EXPECTED RESULT:
                  expect(rs).toBeDefined();
                  expect(rs.rows).toBeDefined();
                  expect(rs.rows.length).toBe(1);
                  expect(rs.rows.item(0).name).toBe('main');
                  expect(rs.rows.item(0).file).toBeDefined();
                  expect(rs.rows.item(0).file.indexOf(dbName)).not.toBe(-1);

                  // Close & finish:
                  db.close(done, done);
                }, function(error) {
                  // NOT EXPECTED:
                  expect(false).toBe(true);
                  expect(error.message).toBe('--');
                  done();
                });

              }, function(error) {
                // NOT EXPECTED on Android/iOS/macOS:
                if (isWindows) {
                  expect(error).toBeDefined();
                  expect(error.message).toBeDefined();
                } else {
                  expect(false).toBe(true);
                  expect(error.message).toBe('--');
                }
                done();
              });

            } catch (e) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              expect(e.message).toBe('--');
              done();
            }
          }, MYTIMEOUT);
        });

      });
    }


        it('Open plugin database with Web SQL parameters (REJECTED with exception)', function(done) {
          try {
            var db = window.sqlitePlugin.openDatabase('open-with-web-sql-parameters-test.db', "1.0", "Demo", DEFAULT_SIZE);

            // NOT EXPECTED - window.sqlitePlugin.openDatabase did not throw
            expect(false).toBe(true);

            // IMPORTANT FIX: avoid the risk of over 100 db handles open when running the full test suite
            db.close(done, done);
          } catch (e) {
            // EXPECTED RESULT:
            expect(true).toBe(true);
            done();
          }
        }, MYTIMEOUT);

        // NOTE: this was an issue due to a past inconsistency between the
        // ngCordova documentation and source code which triggered problems
        // reported in litehelpers/Cordova-sqlite-storage#246 and
        // litehelpers/Cordova-sqlcipher-adapter#5.
        // The implementation now avoids this problem *by throwing an exception*.
        // While (WebKit) Web SQL seems to succeed in this case this is not really desired
        // and would be a problem with sqlcipher as discussed in
        // litehelpers/Cordova-sqlcipher-adapter#5.
        it('Plugin check that db name is really a string', function(done) {
          var p1 = { name: 'my.db.name', location: 'default' };
          try {
            window.sqlitePlugin.openDatabase({ name: p1, location: 'default' }, function(db) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              done();
            }, function(error) {
              // OK but NOT EXPECTED:
              expect('Behavior changed, please update this test').toBe('--');
              done();
            });
          } catch (e) {
            // EXPECTED RESULT: stopped by the implementation
            expect(e).toBeDefined();
            done();
          }
        }, MYTIMEOUT);

      if (window.hasWebKitBrowser)
        it('Web SQL check that db name is really a string', function(done) {
          var p1 = { name: 'my.db.name', location: 'default' };
          try {
            // SUCCEEDS in (WebKit) Web SQL:
            var db = window.openDatabase(p1, '1.0', 'Test', DEFAULT_SIZE);
            db.readTransaction(function(tx) {
              tx.executeSql('SELECT LENGTH(?) AS myResult', ['tenletters'], function(tx, rs) {
                expect(rs).toBeDefined();
                expect(rs.rows).toBeDefined();
                expect(rs.rows.length).toBe(1);
                expect(rs.rows.item(0).myResult).toBe(10);
                done();
              });
            });
          } catch (e) {
            expect('(WebKit) Web SQL Behavior changed, please update this test').toBe('--');
            done();
          }
        }, MYTIMEOUT);

    for (var i=0; i<pluginScenarioCount; ++i) {

      describe(pluginScenarioList[i] + ': open database location parameter test(s)', function() {

        var suiteName = 'Plugin: ';

        it(suiteName + 'open with no location setting (REJECTED with exception)', function(done) {
          try {
            window.sqlitePlugin.openDatabase({ name: 'open-with-no-location-setting.db' }, function(db) {
              // NOT EXPECTED:
              expect(false).toBe(true);

              // Close (plugin) & finish:
              db.close(done, done);
            }, function(error) {
              // OK but NOT EXPECTED:
              expect('Behavior changed, please update this test').toBe('--');

              done();
            });
          } catch (e) {
            // EXPECTED RESULT: stopped by the implementation
            expect(e).toBeDefined();

            done();
          }
        }, MYTIMEOUT);

        it(suiteName + 'open with both location & iosDatabaseLocation settings (REJECTED with exception)', function(done) {
          try {
            window.sqlitePlugin.openDatabase({
              name: 'open-with-both-location-and-iosDatabaseLocation.db',
              location: 'default',
              iosDatabaseLocation: 2
            }, function(db) {
              // NOT EXPECTED:
              expect(false).toBe(true);

              // Close (plugin) & finish:
              db.close(done, done);
            }, function(error) {
              // OK but NOT EXPECTED:
              expect('Behavior changed, please update this test').toBe('--');

              done();
            });
          } catch (e) {
            // EXPECTED RESULT: stopped by the implementation
            expect(true).toBe(true);

            done();
          }
        }, MYTIMEOUT);

        it(suiteName + 'open with location: -1 (REJECTED with exception)', function(done) {
          try {
            window.sqlitePlugin.openDatabase({ name: 'open-with-location--1.db', location: -1 }, function(db) {
              // NOT EXPECTED:
              expect(false).toBe(true);

              // Close (plugin) & finish:
              db.close(done, done);
            }, function(error) {
              // OK but NOT EXPECTED:
              expect('Behavior changed, please update this test').toBe('--');

              done();
            });
          } catch (e) {
            // EXPECTED RESULT: stopped by the implementation
            expect(e).toBeDefined();

            done();
          }
        }, MYTIMEOUT);

        it(suiteName + 'open with iosDatabaseLocation: -1 (REJECTED with exception)', function(done) {
          try {
            window.sqlitePlugin.openDatabase({
              name: 'open-iosDatabaseLocation--1.db',
              iosDatabaseLocation: -1
            }, function(db) {
              // NOT EXPECTED:
              expect(false).toBe(true);

              // Close (plugin) & finish:
              db.close(done, done);
            }, function(error) {
              // OK but NOT EXPECTED:
              expect('Behavior changed, please update this test').toBe('--');

              done();
            });
          } catch (e) {
            // EXPECTED RESULT: stopped by the implementation
            expect(e).toBeDefined();

            done();
          }
        }, MYTIMEOUT);

        it(suiteName + 'open with location: 3 (REJECTED with exception)', function(done) {
          try {
            window.sqlitePlugin.openDatabase({ name: 'open-with-location-3.db', location: 3 }, function(db) {
              // NOT EXPECTED:
              expect(false).toBe(true);

              // Close (plugin) & finish:
              db.close(done, done);
            }, function(error) {
              // OK but NOT EXPECTED:
              expect('Behavior changed, please update this test').toBe('--');

              done();
            });
          } catch (e) {
            // EXPECTED RESULT: stopped by the implementation
            expect(e).toBeDefined();

            done();
          }
        }, MYTIMEOUT);

        it(suiteName + 'open with iosDatabaseLocation: 1 (REJECTED with exception)', function(done) {
          try {
            window.sqlitePlugin.openDatabase({
              name: 'open-iosDatabaseLocation-1.db',
              iosDatabaseLocation: 1
            }, function(db) {
              // NOT EXPECTED:
              expect(false).toBe(true);

              // Close (plugin) & finish:
              db.close(done, done);
            }, function(error) {
              // OK but NOT EXPECTED:
              expect('Behavior changed, please update this test').toBe('--');

              done();
            });
          } catch (e) {
            // EXPECTED RESULT: stopped by the implementation
            expect(e).toBeDefined();

            done();
          }
        }, MYTIMEOUT);

        it(suiteName + 'open with iosDatabaseLocation: 2 (REJECTED with exception)', function(done) {
          try {
            window.sqlitePlugin.openDatabase({
              name: 'open-iosDatabaseLocation-2.db',
              iosDatabaseLocation: 2
            }, function(db) {
              // NOT EXPECTED:
              expect(false).toBe(true);

              // Close (plugin) & finish:
              db.close(done, done);
            }, function(error) {
              // OK but NOT EXPECTED:
              expect('Behavior changed, please update this test').toBe('--');

              done();
            });
          } catch (e) {
            // EXPECTED RESULT: stopped by the implementation
            expect(e).toBeDefined();

            done();
          }
        }, MYTIMEOUT);

        it(suiteName + 'open with iosDatabaseLocation: 3 (REJECTED with exception)', function(done) {
          try {
            window.sqlitePlugin.openDatabase({
              name: 'open-iosDatabaseLocation-3.db',
              iosDatabaseLocation: 3
            }, function(db) {
              // NOT EXPECTED:
              expect(false).toBe(true);

              // Close (plugin) & finish:
              db.close(done, done);
            }, function(error) {
              // OK but NOT EXPECTED:
              expect('Behavior changed, please update this test').toBe('--');

              done();
            });
          } catch (e) {
            // EXPECTED RESULT: stopped by the implementation
            expect(e).toBeDefined();

            done();
          }
        }, MYTIMEOUT);

        it(suiteName + "open with location: 'bogus' (REJECTED with exception)", function(done) {
          try {
            window.sqlitePlugin.openDatabase({
              name: 'open-location-bogus.db',
              location: 'bogus'
            }, function(db) {
              // NOT EXPECTED:
              expect(false).toBe(true);

              // Close (plugin) & finish:
              db.close(done, done);
            }, function(error) {
              // OK but NOT EXPECTED:
              expect('Behavior changed, please update this test').toBe('--');

              done();
            });
          } catch (e) {
            // EXPECTED RESULT: stopped by the implementation
            expect(e).toBeDefined();

            done();
          }
        }, MYTIMEOUT);

        it(suiteName + "open with iosDatabaseLocation: 'bogus' (REJECTED with exception)", function(done) {
          try {
            window.sqlitePlugin.openDatabase({
              name: 'open-iosDatabaseLocation-bogus.db',
              iosDatabaseLocation: 'bogus'
            }, function(db) {
              // NOT EXPECTED:
              expect(false).toBe(true);

              // Close (plugin) & finish:
              db.close(done, done);
            }, function(error) {
              // OK but NOT EXPECTED:
              expect('Behavior changed, please update this test').toBe('--');

              done();
            });
          } catch (e) {
            // EXPECTED RESULT: stopped by the implementation
            expect(e).toBeDefined();

            done();
          }
        }, MYTIMEOUT);

        it(suiteName + 'open with location: null (REJECTED with exception)', function(done) {
          try {
            window.sqlitePlugin.openDatabase({ name: 'open-with-location-null.db', location: null }, function(db) {
              // NOT EXPECTED:
              expect(false).toBe(true);

              // Close (plugin) & finish:
              db.close(done, done);
            }, function(error) {
              // OK but NOT EXPECTED:
              expect('Behavior changed, please update this test').toBe('--');

              done();
            });
          } catch (e) {
              // EXPECTED RESULT:
              expect(true).toBe(true);

              done();
          }
        }, MYTIMEOUT);

        it(suiteName + 'open with iosDatabaseLocation: null (REJECTED with exception)', function(done) {
          try {
            window.sqlitePlugin.openDatabase({
              name: 'open-with-iosDatabaseLocation-null.db',
              iosDatabaseLocation: null
            }, function(db) {
              // NOT EXPECTED:
              expect(false).toBe(true);

              // Close (plugin) & finish:
              db.close(done, done);
            }, function(error) {
              // OK but NOT EXPECTED:
              expect('Behavior changed, please update this test').toBe('--');

              done();
            });
          } catch (e) {
            // EXPECTED RESULT: stopped by the implementation
            expect(e).toBeDefined();

            done();
          }
        }, MYTIMEOUT);

      });

    }

  });


  describe('Plugin - basic sqlitePlugin.deleteDatabase parameter check test(s)', function() {

      var suiteName = 'plugin: ';

        it(suiteName + 'check that sqlitePlugin.deleteDatabase db name is really a string', function(done) {
          var p1 = { name: 'my.db.name', location: 1 };
          try {
            // FUTURE TBD test without callbacks?
            //window.sqlitePlugin.deleteDatabase({ name: p1, location: 'default' }); // callbacks ignored
            window.sqlitePlugin.deleteDatabase({ name: p1, location: 'default' }, function() {
              // NOT EXPECTED:
              expect(false).toBe(true);

              // Close (plugin) & finish:
              db.close(done, done);
            }, function(error) {
              expect('Behavior changed, please update this test').toBe('--');

              done();
            });
          } catch (e) {
            // EXPECTED RESULT: stopped by the implementation
            expect(true).toBe(true);

            done();
          }
        }, MYTIMEOUT);

        it(suiteName + 'sqlitePlugin.deleteDatabase with no location setting (REJECTED with exception)', function(done) {
          try {
            // FUTURE TBD test without callbacks?
            window.sqlitePlugin.deleteDatabase({name: 'my.db'}, function() {
              // NOT EXPECTED:
              expect(false).toBe(true);

              // Close (plugin) & finish:
              db.close(done, done);
            }, function(error) {
              // OK but NOT EXPECTED:
              expect('Behavior changed, please update this test').toBe('--');

              done();
            });
          } catch (e) {
            // EXPECTED RESULT: stopped by the implementation
            expect(true).toBe(true);

            done();
          }
        }, MYTIMEOUT);

        it(suiteName + 'sqlitePlugin.deleteDatabase with string parameter (REJECTED with exception)', function(done) {
          try {
            window.sqlitePlugin.deleteDatabase('my.db', function() {
              // NOT EXPECTED:
              expect(false).toBe(true);

              // Close (plugin) & finish:
              db.close(done, done);
            }, function(error) {
              // OK but NOT EXPECTED:
              expect('Behavior changed, please update this test').toBe('--');

              done();
            });

            // NOT EXPECTED - window.sqlitePlugin.deleteDatabase did not throw
            expect(false).toBe(true);
            done();
          } catch (e) {
            // EXPECTED RESULT: stopped by the implementation
            expect(true).toBe(true);

            done();
          }
        }, MYTIMEOUT);

        it(suiteName + 'sqlitePlugin.deleteDatabase with both location & iosDatabaseLocation settings (REJECTED with exception)', function(done) {
          try {
            window.sqlitePlugin.deleteDatabase({ name: 'my.db', location: 'default', iosDatabaseLocation: 2 }, function() {
              // NOT EXPECTED:
              expect(false).toBe(true);

              // Close (plugin) & finish:
              db.close(done, done);
            }, function(error) {
              expect('Behavior changed, please update this test').toBe('--');

              done();
            });
          } catch (e) {
            // EXPECTED RESULT: stopped by the implementation
            expect(true).toBe(true);

            done();
          }
        }, MYTIMEOUT);

        it(suiteName + 'sqlitePlugin.deleteDatabase with location: -1 (REJECTED with exception)', function(done) {
          try {
            window.sqlitePlugin.deleteDatabase({ name: 'my.db', location: -1 }, function() {
              // NOT EXPECTED:
              expect(false).toBe(true);

              // Close (plugin) & finish:
              db.close(done, done);
            }, function(error) {
              expect('Behavior changed, please update this test').toBe('--');

              done();
            });
          } catch (e) {
            // EXPECTED RESULT: stopped by the implementation
            expect(true).toBe(true);

            done();
          }
        }, MYTIMEOUT);

        it(suiteName + 'sqlitePlugin.deleteDatabase with iosDatabaseLocation: -1 (REJECTED with exception)', function(done) {
          try {
            window.sqlitePlugin.deleteDatabase({ name: 'my.db', iosDatabaseLocation: -1 }, function() {
              // NOT EXPECTED:
              expect(false).toBe(true);

              // Close (plugin) & finish:
              db.close(done, done);
            }, function(error) {
              expect('Behavior changed, please update this test').toBe('--');

              done();
            });
          } catch (e) {
            // EXPECTED RESULT: stopped by the implementation
            expect(true).toBe(true);

            done();
          }
        }, MYTIMEOUT);

        it(suiteName + 'sqlitePlugin.deleteDatabase with location: 3 (REJECTED with exception)', function(done) {
          try {
            window.sqlitePlugin.deleteDatabase({ name: 'my.db', location: 3 }, function() {
              // NOT EXPECTED:
              expect(false).toBe(true);

              // Close (plugin) & finish:
              db.close(done, done);
            }, function(error) {
              expect('Behavior changed, please update this test').toBe('--');

              done();
            });
          } catch (e) {
            // EXPECTED RESULT: stopped by the implementation
            expect(true).toBe(true);

            done();
          }
        }, MYTIMEOUT);

        it(suiteName + 'sqlitePlugin.deleteDatabase with iosDatabaseLocation: 3 (REJECTED with exception)', function(done) {
          try {
            window.sqlitePlugin.deleteDatabase({ name: 'my.db', iosDatabaseLocation: 3 }, function() {
              // NOT EXPECTED:
              expect(false).toBe(true);

              // Close (plugin) & finish:
              db.close(done, done);
            }, function(error) {
              expect('Behavior changed, please update this test').toBe('--');

              done();
            });
          } catch (e) {
            // EXPECTED RESULT: stopped by the implementation
            expect(true).toBe(true);

            done();
          }
        }, MYTIMEOUT);

        it(suiteName + "sqlitePlugin.deleteDatabase with location: 'bogus' (REJECTED with exception)", function(done) {
          try {
            // FUTURE TBD test without callbacks?
            //window.sqlitePlugin.deleteDatabase({ name: 'my.db', location: 'bogus' }); // callbacks ignored
            window.sqlitePlugin.deleteDatabase({ name: 'my.db', location: 'bogus' }, function() {
              // NOT EXPECTED:
              expect(false).toBe(true);

              // Close (plugin) & finish:
              db.close(done, done);
            }, function(error) {
              expect('Behavior changed, please update this test').toBe('--');

              done();
            });
          } catch (e) {
            // EXPECTED RESULT: stopped by the implementation
            expect(true).toBe(true);

            done();
          }
        }, MYTIMEOUT);

        it(suiteName + "sqlitePlugin.deleteDatabase with iosDatabaseLocation: 'bogus' (REJECTED with exception)", function(done) {
          try {
            // FUTURE TBD test without callbacks?
            //window.sqlitePlugin.deleteDatabase({ name: 'my.db', iosDatabaseLocation: 'bogus' }); // callbacks ignored
            window.sqlitePlugin.deleteDatabase({ name: 'my.db', iosDatabaseLocation: 'bogus' }, function() {
              // NOT EXPECTED:
              expect(false).toBe(true);

              // Close (plugin) & finish:
              db.close(done, done);
            }, function(error) {
              expect('Behavior changed, please update this test').toBe('--');

              done();
            });
          } catch (e) {
            // EXPECTED RESULT - stopped by the implementation:
            expect(e).toBeDefined();
            done();
          }
        }, MYTIMEOUT);

  });

  describe('Plugin: db open-close-delete test(s)', function() {

    for (var i=0; i<pluginScenarioCount; ++i) {

      describe(pluginScenarioList[i] + ': basic sqlitePlugin.deleteDatabase test(s)', function() {
        var scenarioName = pluginScenarioList[i];
        var suiteName = scenarioName + ': ';
        var isImpl2 = (i === 1);

        // NOTE 1: These MUST be defined in function scope, NOT outer scope.
        // NOTE 2: This part is tested with the iosDatabaseLocation: 'default'
        //         setting.

        var openDatabase = function(first, second, third, fourth, fifth, sixth) {
          var dbname, okcb, errorcb;

          if (first.constructor === String ) {
            dbname = first;
            okcb = fifth;
            errorcb = sixth;
          } else {
            dbname = first.name;
            okcb = second;
            errorcb = third;
          }

          if (!isImpl2) {
            return window.sqlitePlugin.openDatabase({name: dbname, iosDatabaseLocation: 'default'}, okcb, errorcb);
          }

          var dbopts = {
            name: 'i2-'+dbname,
            // database location setting needed in this version branch:
            location: 1, // (value ignored on Android)
            androidDatabaseImplementation: 2,
            androidLockWorkaround: 1
          };

          return window.sqlitePlugin.openDatabase(dbopts, okcb, errorcb);
        }

        var deleteDatabase = function(first, second, third) {
          if (!isImpl2) {
            window.sqlitePlugin.deleteDatabase({name: first, iosDatabaseLocation: 'default'}, second, third);
          } else {
            window.sqlitePlugin.deleteDatabase({
              name: 'i2-'+first,
              // database location setting needed in this version branch:
              location: 1 // (value ignored on Android)
            }, second, third);
          }
        }

        test_it(suiteName + ' test sqlitePlugin.deleteDatabase()', function () {
          stop();
          var db = openDatabase("DB-Deletable", "1.0", "Demo", DEFAULT_SIZE);

          function createAndInsertStuff() {

            db.transaction(function(tx) {
              tx.executeSql('DROP TABLE IF EXISTS test');
              tx.executeSql('CREATE TABLE IF NOT EXISTS test (name)', [], function () {
                tx.executeSql('INSERT INTO test VALUES (?)', ['foo']);
              });
            }, function (err) {
              ok(false, 'create and insert tx failed with ERROR: ' + JSON.stringify(err));
              console.log('create and insert tx failed with ERROR: ' + JSON.stringify(err));
              start();
            }, function () {
              // check that we can read it
              db.transaction(function(tx) {
                tx.executeSql('SELECT * FROM test', [], function (tx, res) {
                  equal(res.rows.item(0).name, 'foo');
                });
              }, function (err) {
                ok(false, 'SELECT tx failed with ERROR: ' + JSON.stringify(err));
                console.log('SELECT tx failed with ERROR: ' + JSON.stringify(err));
                start();
              }, function () {
                deleteAndConfirmDeleted();
              });
            });
          }

          function deleteAndConfirmDeleted() {

            deleteDatabase("DB-Deletable", function () {

              // check that the data's gone
              db.transaction(function (tx) {
                tx.executeSql('SELECT name FROM test', []);
              }, function (err) {
                ok(true, 'got an expected transaction error');
                testDeleteError();
              }, function () {
                console.log('UNEXPECTED SUCCESS: expected a transaction error');
                ok(false, 'expected a transaction error');
                start();
              });
            }, function (err) {
              console.log("ERROR: " + JSON.stringify(err));
              // XXX TBD IGNORE delete error on Windows:
              if (isWindows) return start();
              ok(false, 'error: ' + err);
              start();
            });
          }

          function testDeleteError() {
            // should throw an error if the db doesn't exist
            deleteDatabase("Foo-Doesnt-Exist", function () {
              console.log('UNEXPECTED SUCCESS: expected a delete error');
              ok(false, 'expected error');
              start();
            }, function (err) {
              ok(!!err, 'got error like we expected');

              start();
            });
          }

          createAndInsertStuff();
        });

      });
    }

    for (var i=0; i<pluginScenarioCount; ++i) {

      describe(pluginScenarioList[i] + ': basic plugin open-close test(s)', function() {
        var scenarioName = pluginScenarioList[i];
        var suiteName = scenarioName + ': ';
        var isImpl2 = (i === 1);

        // NOTE: MUST be defined in function scope, NOT outer scope:
        var openDatabase = function(first, second, third, fourth, fifth, sixth) {
          var dbname, okcb, errorcb;

          if (first.constructor === String ) {
            dbname = first;
            okcb = fifth;
            errorcb = sixth;
          } else {
            dbname = first.name;
            okcb = second;
            errorcb = third;
          }

          if (!isImpl2) {
            // database location setting needed in this version branch:
            return window.sqlitePlugin.openDatabase({name: dbname, location: 'default'}, okcb, errorcb);
          }

          var dbopts = {
            name: 'i2-'+dbname,
            // database location setting needed in this version branch:
            location: 1, // (value ignored on Android)
            androidDatabaseImplementation: 2,
            androidLockWorkaround: 1
          };

          return window.sqlitePlugin.openDatabase(dbopts, okcb, errorcb);
        }

        test_it(suiteName + ' database.open calls its success callback', function () {
          // asynch test coming up
          stop(1);

          var dbName = "Database-Open-callback";
          openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE, function (db) {
            ok(true, 'expected open success callback to be called ...');
            start(1);
          }, function (error) {
            ok(false, 'expected open error callback not to be called ...');
            start(1);
          });
        });

        it(suiteName + ' can run (read) transaction after openDatabase with null for callback', function (done) {
          var dbName = 'null-for-open-callback-test.db';

          var db = openDatabase(dbName, '1.0', 'Test', DEFAULT_SIZE, null);

          db.readTransaction(function(tx) {
            tx.executeSql('SELECT LENGTH(?) AS myResult', ['tenletters'], function(tx, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).myResult).toBe(10);
              done();
            });
          });
        }, MYTIMEOUT);

        // XXX BROKEN:
        xit(suiteName + ' attempt (read) transaction after openDatabase with bogus string for callback', function (done) {
          var dbName = 'bogus-string-open-callback-test.db';

          var db = openDatabase(dbName, '1.0', 'Test', DEFAULT_SIZE, 'bogus');

          db.readTransaction(function(tx) {
            tx.executeSql('SELECT LENGTH(?) AS myResult', ['tenletters'], function(tx, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0)).toBe(10);
              done();
            });
          });
        }, MYTIMEOUT);

        // XXX BROKEN:
        xit(suiteName + ' attempt (read) transaction after openDatabase with callback that throws', function (done) {
          var dbName = 'open-callback-that-throws.db';

          var db = openDatabase(dbName, '1.0', 'Test', DEFAULT_SIZE, function(db) { throw new Error('Boom'); });

          db.transaction(function(tx) {
            tx.executeSql('SELECT LENGTH(?) AS myResult', ['tenletters'], function(ignored, rs) {
              expect('Plugin BEHAVIOR CHANGED, please update this test').toBe('--');
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0)).toBe(10);
              done();
            }, function(ignored1, ignored2) {
              expect('Plugin BEHAVIOR CHANGED, please update this test').toBe('--');
              done();
            });
          });
        }, MYTIMEOUT);

        test_it(suiteName + ' database.close (immediately after open) calls its success callback', function () {
          // TBD POSSIBLY BROKEN on iOS/macOS due to current background processing implementation:
          if (!isAndroid && !isWindows && !isWP8) pending('CURRENTLY BROKEN on iOS/macOS (background processing implementation)');

          // asynch test coming up
          stop(1);

          var dbName = "Immediate-close-callback";
          var db = openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE);

          // close database - need to run tests directly in callbacks as nothing is guarenteed to be queued after a close
          db.close(function () {
            ok(true, 'expected close success callback to be called after database is closed');
            start(1);
          }, function (error) {
            ok(false, 'expected close error callback not to be called after database is closed');
            start(1);
          });
        });

        test_it(suiteName + ' database.close after open callback calls its success callback', function () {
          // asynch test coming up
          stop(1);

          var dbName = "Close-after-open-callback";

          openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE, function(db) {
            // close database - need to run tests directly in callbacks as nothing is guarenteed to be queued after a close
            db.close(function () {
              ok(true, 'expected close success callback to be called after database is closed');
              start(1);
            }, function (error) {
              ok(false, 'expected close error callback not to be called after database is closed');
              start(1);
            });
          }, function (error) {
            ok(false, 'unexpected open error');
            start(1);
          });
        });

        test_it(suiteName + ' database.close fails in transaction', function () {
          stop(2);
          var dbName = "Database-Close-fail.db";

          var db = openDatabase({name: dbName, location: 'default'});

          db.readTransaction(function(tx) {
            tx.executeSql('SELECT 1', [], function(tx, results) {
              // close database - need to run tests directly in callbacks as nothing is guarenteed to be queued after a close
              db.close(function () {
                ok(false, 'expect close to fail during transaction');
                start(1);
              }, function (error) {
                ok(true, 'expect close to fail during transaction');
                start(1);
              });
              start(1);
            }, function(error) {
              ok(false, error);
              start(2);
            });
          }, function(error) {
            ok(false, error);
            start(2);
          });
        });

        test_it(suiteName + ' attempt to close db twice', function () {
          var dbName = 'close-db-twice.db';
          var dbargs = {name: dbName, location: 'default'};

          stop(1);

          openDatabase(dbargs, function(db) {
            ok(!!db, 'valid db object');
            db.close(function () {
              ok(true, 'db.close() success callback (first time)');
              db.close(function () {
                ok(false, 'db.close() second time should not have succeeded');
                start(1);
              }, function (error) {
                ok(true, 'db.close() second time reported error ok');
                start(1);
              });
            }, function (error) {
              ok(false, 'expected close error callback not to be called after database is closed');
              start(1);
            });
          });
        });

        /* ** FUTURE TBD (NOT IMPLEMENTED) dispose
        xtest_it(suiteName + " 'dispose' writer db handle should not close reader db handle [NOT IMPLEMENTED]", function () {
          var dbname = 'dispose-one-db-handle.db';
          var dbw = openDatabase(dbname, "1.0", "Demo", DEFAULT_SIZE);
          var dbr = openDatabase(dbname, "1.0", "Demo", DEFAULT_SIZE);

          stop(1);

          dbw.transaction(function (tx) {
            tx.executeSql('DROP TABLE IF EXISTS tt');
            tx.executeSql('CREATE TABLE IF NOT EXISTS tt (test_data)');
            tx.executeSql('INSERT INTO tt VALUES (?)', ['My-test-data']);
          }, function(error) {
            console.log("ERROR: " + error.message);
            ok(false, error.message);
            start(1);
          }, function() {
            // FUTURE TBD (NOT IMPLEMENTED):
            dbw.dispose(function () {
              // XXX dbr no longer working [BUG #209]:
              dbr.readTransaction(function (tx) {
                ok(false, "Behavior changed - please update this test");
                tx.executeSql('SELECT test_data from tt', [], function (tx, result) {
                  equal(result.rows.item(0).test_data, 'My-test-data', 'read data from reader handle');
                  start(1);
                });
              }, function(error) {
                console.log("ERROR reading db handle: " + error.message);
                //ok(false, "ERROR reading db handle: " + error.message);
                ok(true, "BUG REPRODUCED");
                start(1);
              });
            }, function (error) {
              ok(false, 'close error callback not to be called after database is closed');
              start(1);
            });
          });
        });
        // ** */

        // XXX TODO BROKEN [BUG #204]:
        it(suiteName + ' REPRODUCE BUG: close DB in db.executeSql() callback', function (done) {
          var dbName = "Close-DB-in-db-executeSql-callback.db";

          openDatabase({name: dbName, location: 'default'}, function (db) {
            db.executeSql("CREATE TABLE IF NOT EXISTS tt (test_data)", [], function() {
              db.close(function () {
                // FUTURE TBD EXPECTED RESULT:
                expect('Behavior changed - please update this test').toBe('--');
                expect(true).toBe(true);
                done();
              }, function (error) {
                // BUG REPRODUCED:
                //expect(false).toBe(true);
                //expect('CLOSE ERROR' + error).toBe('--');
                expect(true).toBe(true);
                done();
              });
            });
          }, function (error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect('OPEN ERROR' + error).toBe('--');
            done();
          });
        }, MYTIMEOUT);

      });
    }

    describe('repeated open/close/delete test(s)', function() {
      var scenarioName = isAndroid ? 'Plugin-implementation-default' : 'Plugin';
      var suiteName = scenarioName + ': ';

        // NOTE: MUST be defined in function scope, NOT outer scope:
        var openDatabase = function(first, second, third) {
          return window.sqlitePlugin.openDatabase(first, second, third);
        }

        var deleteDatabase = function(first, second, third) {
          window.sqlitePlugin.deleteDatabase(first, second, third);
        }

        // Needed to support some large-scale applications:
        test_it(suiteName + ' open same database twice in [same] specified location works', function () {
          // XXX TODO [BROKEN]: same db name, different location should be different db!
          stop(2);

          var dbName = 'test-open-twice-in-same-location.db';
          var dbargs = {name: dbName, location: 1};

          var db1 = openDatabase(dbargs, function () {
            var db2 = openDatabase(dbargs, function () {
              db1.readTransaction(function(tx1) {
                tx1.executeSql('SELECT 1', [], function(tx1d, results) {
                  ok(true, 'db1 transaction working');
                  start(1);
                }, function(ignored, error) {
                  ok(false, error);
                });
              }, function(error) {
                ok(false, error);
              });
              db2.readTransaction(function(tx2) {
                tx2.executeSql('SELECT 1', [], function(tx2d, results) {
                  ok(true, 'db2 transaction working');
                  start(1);
                }, function(ignored, error) {
                  ok(false, error);
                });
              }, function(error) {
                ok(false, error);
              });
            }, function (error) {
              ok(false, error);
            });
          }, function (error) {
            ok(false, error);
          });
        });

        // Needed to support some large-scale applications:
        test_it(suiteName + ' close then re-open (2x) allows subsequent queries to run', function () {
          // asynch test coming up
          stop(1);

          var dbName = 'test-database-close-and-reopen.db';
          var dbargs = {name: dbName, location: 0};

          openDatabase(dbargs, function (db) {
            db.close(function () {
              openDatabase(dbargs, function (db) {
                db.close(function () {
                  openDatabase(dbargs, function (db) {
                    db.readTransaction(function (tx) {
                      tx.executeSql('SELECT 1', [], function (tx, results) {
                        ok(true, 'database re-opened succesfully');
                        start(1);
                      }, function (error) {
                        ok(false, error.message);
                        start(1);
                      });
                    }, function (error) {
                      ok(false, error.message);
                      start(1);
                    }, function(tx) {
                      // close on transaction success not while executing
                      // or commit will fail
                      db.close();
                    });
                  }, function (error) {
                    ok(false, error.message);
                    start(1);
                  });
                }, function (error) {
                  ok(false, error.message);
                  start(1);
                });
              }, function (error) {
                ok(false, error.message);
                start(1);
              });
            }, function (error) {
              ok(false, error.message);
              start(1);
            });
          }, function (error) {
            ok(false, error.message);
            start(1);
          });
        });

        // Needed to support some large-scale applications:
        test_it(suiteName + " delete then re-open (location: 'default') allows subsequent queries to run", function () {
          var dbName = "test-database-delete-and-reopen.db";
          var dbargs = {name: dbName, iosDatabaseLocation: 'default'};

          // async test coming up
          stop(1);

          var db = openDatabase(dbargs, function () {
            // success CB
            deleteDatabase(dbargs, function () {
              db = openDatabase(dbargs, function () {
                db.readTransaction(function (tx) {
                  tx.executeSql('SELECT 1', [], function (tx, results) {
                    ok(true, 'database re-opened succesfully');
                    start(1);
                  }, function (error) {
                    ok(false, error);
                    start(1);
                  }, function (error) {
                    ok(false, error);
                    start(1);
                  });
                }, function (error) {
                  ok(false, error);
                  start(1);
                });
              }, function (error) {
                ok(false, error);
                start(1);
              });
            }, function (error) {
              ok(false, error);
              start(1);
            });
          }, function (error) {
            ok(false, error);
            start(1);
          });
        });

        // XXX SEE BELOW: repeat scenario but wait for open callback before close/delete/reopen
        // Needed to support some large-scale applications:
        test_it(suiteName + ' immediate close, then delete then re-open allows subsequent queries to run', function () {
          if (!isAndroid && !isWindows && !isWP8) pending('CURRENTLY BROKEN on iOS/macOS (background processing implementation)');

          var dbName = "Immediate-close-delete-Reopen.db";
          var dbargs = {name: dbName, location: 'default'};

          // asynch test coming up
          stop(1);

          var db1 = openDatabase(dbargs);

          db1.close(function () {
            deleteDatabase(dbargs, function () {
              openDatabase(dbargs, function(db) {
                db.readTransaction(function (tx) {
                  tx.executeSql('SELECT 1', [], function (tx, results) {
                    ok(true, 'database re-opened succesfully');
                    start(1);
                  }, function (e) {
                    ok(false, 'error: ' + e);
                    start(1);
                  });
                }, function (e) {
                  ok(false, 'error: ' + e);
                  start(1);
                });
              }, function (e) {
                ok(false, 'error: ' + e);
                start(1);
              });
            }, function (e) {
              ok(false, 'error: ' + e);
              start(1);
            });
          }, function (e) {
            ok(false, 'error: ' + e);
            start(1);
          });
        });

        test_it(suiteName + ' close (after open cb), then delete & re-open allows subsequent queries to run', function () {
          var dbName = 'test-close-after-opencb-then-delete-and-reopen.db';
          var dbargs = {name: dbName, iosDatabaseLocation: 'Library'};

          // asynch test coming up
          stop(1);

          openDatabase(dbargs, function(db1) {

            db1.close(function () {
              deleteDatabase(dbargs, function () {
                openDatabase(dbargs, function(db) {
                  db.readTransaction(function (tx) {
                    tx.executeSql('SELECT 1', [], function (tx, results) {
                      ok(true, 'database re-opened succesfully');
                      start(1);
                    }, function (e) {
                      ok(false, 'error: ' + e);
                      start(1);
                    });
                  }, function (e) {
                    ok(false, 'error: ' + e);
                    start(1);
                  });
                }, function (e) {
                  ok(false, 'error: ' + e);
                  start(1);
                });
              }, function (e) {
                ok(false, 'error: ' + e);
                start(1);
              });
            }, function (e) {
              ok(false, 'error: ' + e);
              start(1);
            });

          }, function (e) {
            ok(false, 'open error: ' + e);
            start(1);
          });

        });

        test_it(suiteName + ' repeatedly open and close database (4x)', function () {
          var dbName = 'test-repeatedly-open-and-close-db-4x.db';
          var dbargs = {name: dbName, location: 0};

          // async test coming up
          stop(1);

          openDatabase(dbargs, function(db) {
            ok(!!db, 'valid db object 1/4');
            db.close(function () {
              ok(true, 'success 1/4');

              openDatabase(dbargs, function(db) {
                ok(!!db, 'valid db object 2/4');
                db.close(function () {
                  ok(true, 'success 2/4');

                  openDatabase(dbargs, function(db) {
                    ok(!!db, 'valid db object 3/4');
                    db.close(function () {
                      ok(true, 'success 3/4');

                      openDatabase(dbargs, function(db) {
                        ok(!!db, 'valid db object 4/4');
                        db.close(function () {
                          ok(true, 'success 4/4');

                          start(1);
                        }, function (error) {
                          ok(false, 'close 4/4: unexpected close error callback: ' + error);
                          start(1);
                        });
                      }, function (error) {
                        ok(false, 'open 4/4: unexpected open error callback: ' + error);
                        start(1);
                      });
                    }, function (error) {
                      ok(false, 'close 3/4: unexpected close error callback: ' + error);
                      start(1);
                    });
                  }, function (error) {
                    ok(false, 'open 3/4: unexpected open error callback: ' + error);
                    start(1);
                  });
                }, function (error) {
                  ok(false, 'close 2/4: unexpected delete close callback: ' + error);
                  start(1);
                });
              }, function (error) {
                ok(false, 'close 2/4: unexpected open close callback: ' + error);
                start(1);
              });
            }, function (error) {
              ok(false, 'close 1/4: unexpected delete close callback: ' + error);
              start(1);
            });
          }, function (error) {
            ok(false, 'open 1/4: unexpected open error callback: ' + error);
            start(1);
          });
        });

        test_it(suiteName + ' repeatedly open and close database faster (5x)', function () {
          // TBD CURRENTLY BROKEN on iOS/macOS due to current background processing implementation:
          if (!isAndroid && !isWindows && !isWP8) pending('CURRENTLY BROKEN on iOS/macOS (background processing implementation)');

          var dbName = 'repeatedly-open-and-close-faster-5x.db';
          var dbargs = {name: dbName, location: 'default'};

          // async test coming up
          stop(1);

          var db = openDatabase(dbargs);
          ok(!!db, 'valid db object 1/5');
          db.close(function () {
            ok(true, 'success 1/5');

            db = openDatabase(dbargs);
            ok(!!db, 'valid db object 2/5');
            db.close(function () {
              ok(true, 'success 2/5');

              db = openDatabase(dbargs);
              ok(!!db, 'valid db object 3/5');
              db.close(function () {
                ok(true, 'success 3/5');

                db = openDatabase(dbargs);
                ok(!!db, 'valid db object 4/5');
                db.close(function () {
                  ok(true, 'success 4/5');

                  db = openDatabase(dbargs);
                  ok(!!db, 'valid db object 5/5');
                  db.close(function () {
                    ok(true, 'success 5/5');

                    start(1);
                  }, function (error) {
                    ok(false, 'close 5/5: unexpected close error callback: ' + error);
                    start(1);
                  });
                }, function (error) {
                  ok(false, 'close 4/5: unexpected close error callback: ' + error);
                  start(1);
                });
              }, function (error) {
                ok(false, 'close 3/5: unexpected close error callback: ' + error);
                start(1);
              });
            }, function (error) {
              ok(false, 'close 2/5: unexpected close error callback: ' + error);
              start(1);
            });
          }, function (error) {
            ok(false, 'close 1/5: unexpected close error callback: ' + error);
            start(1);
          });
        });

        // Needed to support some large-scale applications:
        test_it(suiteName + ' repeatedly open and delete database (4x)', function () {
          var dbName = 'test-repeatedly-open-and-delete-4x.db';
          var dbargs = {name: dbName, iosDatabaseLocation: 'Documents'};

          // async test coming up
          stop(1);

          openDatabase(dbargs, function(db) {
            ok(true, 'valid db object 1/4');
            deleteDatabase(dbargs, function () {
              ok(true, 'success 1/4');

              openDatabase(dbargs, function(db) {
                ok(true, 'valid db object 2/4');
                deleteDatabase(dbargs, function () {
                  ok(true, 'success 2/4');

                  openDatabase(dbargs, function(db) {
                    ok(true, 'valid db object 3/4');
                    deleteDatabase(dbargs, function () {
                      ok(true, 'success 3/4');

                      openDatabase(dbargs, function(db) {
                        ok(true, 'valid db object 4/4');
                        deleteDatabase(dbargs, function () {
                          ok(true, 'success 4/4');

                          start(1);
                        }, function (error) {
                          ok(false, 'delete 4/4: unexpected delete error callback: ' + error);
                          start(1);
                        });
                      }, function (error) {
                        ok(false, 'open 4/4: unexpected open error callback: ' + error);
                        start(1);
                      });
                    }, function (error) {
                      ok(false, 'delete 3/4: unexpected delete error callback: ' + error);
                      start(1);
                    });
                  }, function (error) {
                    ok(false, 'open 3/4: unexpected open error callback: ' + error);
                    start(1);
                  });
                }, function (error) {
                  ok(false, 'delete 2/4: unexpected delete error callback: ' + error);
                  start(1);
                });
              }, function (error) {
                ok(false, 'open 2/4: unexpected open error callback: ' + error);
                start(1);
              });
            }, function (error) {
              ok(false, 'delete 1/4: unexpected delete error callback: ' + error);
              start(1);
            });
          }, function (error) {
            ok(false, 'open 1/4: unexpected open error callback: ' + error);
            start(1);
          });
        });

        // Needed to support some large-scale applications:
        test_it(suiteName + ' repeatedly open and delete database faster (5x)', function () {
          // TBD POSSIBLY BROKEN on iOS/macOS ...
          // if (!isAndroid && !isWindows && !isWP8) pending(...);
          // TBD CURRENTLY BROKEN DUE TO BUG 666 WORKAROUND SOLUTION
          pending('CURRENTLY BROKEN DUE TO BUG 666 WORKAROUND SOLUTION');

          var dbName = 'repeatedly-open-and-delete-faster-5x.db';
          var dbargs = {name: dbName, location: 'default'};

          // async test coming up
          stop(1);

          var db = openDatabase(dbargs);
          ok(!!db, 'valid db object 1/5');
          sqlitePlugin.deleteDatabase(dbargs, function () {
            ok(true, 'success 1/5');

            db = openDatabase(dbargs);
            ok(!!db, 'valid db object 2/5');
            sqlitePlugin.deleteDatabase(dbargs, function () {
              ok(true, 'success 2/5');

              db = openDatabase(dbargs);
              ok(!!db, 'valid db object 3/5');
              sqlitePlugin.deleteDatabase(dbargs, function () {
                ok(true, 'success 3/5');

                db = openDatabase(dbargs);
                ok(!!db, 'valid db object 4/5');
                sqlitePlugin.deleteDatabase(dbargs, function () {
                  ok(true, 'success 4/5');

                  db = openDatabase(dbargs);
                  ok(!!db, 'valid db object 5/5');
                  sqlitePlugin.deleteDatabase(dbargs, function () {
                    ok(true, 'success 5/5');

                    start(1);
                  }, function (error) {
                    ok(false, 'expected delete 5/5 error callback not to be called for an open database' + error);
                    start(1);
                  });
                }, function (error) {
                  ok(false, 'expected delete 4/5 error callback not to be called for an open database' + error);
                  start(1);
                });
              }, function (error) {
                ok(false, 'expected delete 3/5 error callback not to be called for an open database' + error);
                start(1);
              });
            }, function (error) {
              ok(false, 'expected delete 2/5 error callback not to be called for an open database' + error);
              start(1);
            });
          }, function (error) {
            ok(false, 'expected delete 1/5 error callback not to be called for an open database' + error);
            start(1);
          });
        });

    });

  });

}

if (window.hasBrowser) mytests();
else exports.defineAutoTests = mytests;

/* vim: set expandtab : */
