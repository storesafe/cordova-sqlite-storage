/* 'use strict'; */

var MYTIMEOUT = 12000;

var DEFAULT_SIZE = 5000000; // max to avoid popup in safari/ios

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

    describe(scenarioList[i] + ': BASE64 encoding test(s)', function() {
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

      describe(suiteName + 'SELECT BASE64 value test(s)', function() {

        it(suiteName + "SELECT BASE64(X'010203')", function(done) {
          if (isWebSql) pending('SKIP: BASE64 not supported by Web SQL');
          if (!isWebSql && isAndroid && isImpl2) pending('SKIP: BASE64 not supported for androidDatabaseImplementation: 2');

          var db = openDatabase("SELECT-BASE64-010203.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {
            tx.executeSql("SELECT BASE64(X'010203') AS base64_value", [], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).base64_value).toBe('AQID');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

        it(suiteName + "SELECT BASE64(X'FFD1FFD2')", function(done) {
          if (isWebSql) pending('SKIP: BASE64 not supported by Web SQL');
          if (!isWebSql && isAndroid && isImpl2) pending('SKIP: BASE64 not supported for androidDatabaseImplementation: 2');

          var db = openDatabase("SELECT-BASE64-FFD1FFD2.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {
            tx.executeSql("SELECT BASE64(X'FFD1FFD2') AS base64_value", [], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).base64_value).toBe('/9H/0g==');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

        it(suiteName + "SELECT BASE64(X'FFD1FFD212')", function(done) {
          if (isWebSql) pending('SKIP: BASE64 not supported by Web SQL');
          if (!isWebSql && isAndroid && isImpl2) pending('SKIP: BASE64 not supported for androidDatabaseImplementation: 2');

          var db = openDatabase("SELECT-BASE64-FFD1FFD212.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {
            tx.executeSql("SELECT BASE64(X'FFD1FFD212') AS base64_value", [], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).base64_value).toBe('/9H/0hI=');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

        it(suiteName + "SELECT BASE64(X'FFD1FFD23456')", function(done) {
          if (isWebSql) pending('SKIP: BASE64 not supported by Web SQL');
          if (!isWebSql && isAndroid && isImpl2) pending('SKIP: BASE64 not supported for androidDatabaseImplementation: 2');

          var db = openDatabase("SELECT-BASE64-FFD1FFD23456.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {
            tx.executeSql("SELECT BASE64(X'FFD1FFD23456') AS base64_value", [], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).base64_value).toBe('/9H/0jRW');

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

        it(suiteName + "SELECT BASE64 (96 bytes)", function(done) {
          if (isWebSql) pending('SKIP: BASE64 not supported by Web SQL');
          if (!isWebSql && isAndroid && isImpl2) pending('SKIP: BASE64 not supported for androidDatabaseImplementation: 2');

          var db = openDatabase("SELECT-BASE64-96-bytes.db", "1.0", "Demo", DEFAULT_SIZE);

          var hex = 'FFD1FFD23456';
          var base64 = '/9H/0jRW';
          for (var ii=0; ii<4; ++ii) {
            hex = hex + hex;
            base64 = base64 + base64;
          }

          db.transaction(function(tx) {
            tx.executeSql("SELECT BASE64(X'"+hex+"') AS base64_value", [], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).base64_value).toBe(base64);

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

        it(suiteName + "SELECT BASE64 (100 bytes)", function(done) {
          if (isWebSql) pending('SKIP: BASE64 not supported by Web SQL');
          if (!isWebSql && isAndroid && isImpl2) pending('SKIP: BASE64 not supported for androidDatabaseImplementation: 2');

          var db = openDatabase("SELECT-BASE64-100-bytes.db", "1.0", "Demo", DEFAULT_SIZE);

          var hex = 'FFD1FFD23456';
          var base64 = '/9H/0jRW';
          for (var ii=0; ii<4; ++ii) {
            hex = hex + hex;
            base64 = base64 + base64;
          }
          hex = hex + 'FFD1FFD2';
          base64 = base64 + '/9H/0g==';

          db.transaction(function(tx) {
            tx.executeSql("SELECT BASE64(X'"+hex+"') AS base64_value", [], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).base64_value).toBe(base64);

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

        it(suiteName + "SELECT BASE64 (101 bytes)", function(done) {
          if (isWebSql) pending('SKIP: BASE64 not supported by Web SQL');
          if (!isWebSql && isAndroid && isImpl2) pending('SKIP: BASE64 not supported for androidDatabaseImplementation: 2');

          var db = openDatabase("SELECT-BASE64-101-bytes.db", "1.0", "Demo", DEFAULT_SIZE);

          var hex = 'FFD1FFD23456';
          var base64 = '/9H/0jRW';
          for (var ii=0; ii<4; ++ii) {
            hex = hex + hex;
            base64 = base64 + base64;
          }
          hex = hex + 'FFD1FFD212';
          base64 = base64 + '/9H/0hI=';

          db.transaction(function(tx) {
            tx.executeSql("SELECT BASE64(X'"+hex+"') AS base64_value", [], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).base64_value).toBe(base64);

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

        it(suiteName + "SELECT BASE64 (1536 [256*6] bytes)", function(done) {
          if (isWebSql) pending('SKIP: BASE64 not supported by Web SQL');
          if (!isWebSql && isAndroid && isImpl2) pending('SKIP: BASE64 not supported for androidDatabaseImplementation: 2');

          var db = openDatabase("SELECT-BASE64-1536-bytes.db", "1.0", "Demo", DEFAULT_SIZE);

          var hex = 'FFD1FFD23456';
          var base64 = '/9H/0jRW';
          for (var ii=0; ii<8; ++ii) {
            hex = hex + hex;
            base64 = base64 + base64;
          }

          db.transaction(function(tx) {
            tx.executeSql("SELECT BASE64(X'"+hex+"') AS base64_value", [], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).base64_value).toBe(base64);

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

        it(suiteName + "SELECT BASE64 (1540 [256*6+4] bytes)", function(done) {
          if (isWebSql) pending('SKIP: BASE64 not supported by Web SQL');
          if (!isWebSql && isAndroid && isImpl2) pending('SKIP: BASE64 not supported for androidDatabaseImplementation: 2');

          var db = openDatabase("SELECT-BASE64-1540-bytes.db", "1.0", "Demo", DEFAULT_SIZE);

          var hex = 'FFD1FFD23456';
          var base64 = '/9H/0jRW';
          for (var ii=0; ii<8; ++ii) {
            hex = hex + hex;
            base64 = base64 + base64;
          }
          hex = hex + 'FFD1FFD2';
          base64 = base64 + '/9H/0g==';

          db.transaction(function(tx) {
            tx.executeSql("SELECT BASE64(X'"+hex+"') AS base64_value", [], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).base64_value).toBe(base64);

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

        it(suiteName + "SELECT BASE64 (1541 [256*6+5] bytes)", function(done) {
          if (isWebSql) pending('SKIP: BASE64 not supported by Web SQL');
          if (!isWebSql && isAndroid && isImpl2) pending('SKIP: BASE64 not supported for androidDatabaseImplementation: 2');

          var db = openDatabase("SELECT-BASE64-1541-bytes.db", "1.0", "Demo", DEFAULT_SIZE);

          var hex = 'FFD1FFD23456';
          var base64 = '/9H/0jRW';
          for (var ii=0; ii<8; ++ii) {
            hex = hex + hex;
            base64 = base64 + base64;
          }
          hex = hex + 'FFD1FFD212';
          base64 = base64 + '/9H/0hI=';

          db.transaction(function(tx) {
            tx.executeSql("SELECT BASE64(X'"+hex+"') AS base64_value", [], function(ignored, rs) {
              expect(rs).toBeDefined();
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).base64_value).toBe(base64);

              // Close (plugin only) & finish:
              (isWebSql) ? done() : db.close(done, done);
            });
          });
        }, MYTIMEOUT);

      });

      describe(suiteName + 'INSERT inline BLOB data & SELECT as BASE64', function() {

        it(suiteName + "INSERT X'FFD1FFD234' & SELECT as BASE64", function(done) {
          if (isWebSql) pending('SKIP: BASE64 not supported by Web SQL');
          if (!isWebSql && isAndroid && isImpl2) pending('SKIP: BASE64 not supported for androidDatabaseImplementation: 2');

          var db = openDatabase("INSERT-FFD1FFD234-and-SELECT.db", "1.0", "Demo", DEFAULT_SIZE);

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS tt');
            tx.executeSql('CREATE TABLE tt (data)');
            tx.executeSql("INSERT INTO tt VALUES(X'FFD1FFD212')");
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          }, function() {
            db.transaction(function(tx2) {
              tx2.executeSql("SELECT BASE64(data) AS base64_value from tt", [], function(ignored, rs) {
                expect(rs).toBeDefined();
                expect(rs.rows).toBeDefined();
                expect(rs.rows.length).toBe(1);
                expect(rs.rows.item(0).base64_value).toBe('/9H/0hI=');

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });
            });
          });
        }, MYTIMEOUT);

        it(suiteName + "INSERT BLOB with 101 bytes & SELECT as BASE64", function(done) {
          if (isWebSql) pending('SKIP: BASE64 not supported by Web SQL');
          if (!isWebSql && isAndroid && isImpl2) pending('SKIP: BASE64 not supported for androidDatabaseImplementation: 2');

          var db = openDatabase("INSERT-101-bytes-and-SELECT.db", "1.0", "Demo", DEFAULT_SIZE);

          var hex = 'FFD1FFD23456';
          var base64 = '/9H/0jRW';
          for (var ii=0; ii<4; ++ii) {
            hex = hex + hex;
            base64 = base64 + base64;
          }
          hex = hex + 'FFD1FFD212';
          base64 = base64 + '/9H/0hI=';

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS tt');
            tx.executeSql('CREATE TABLE tt (data)');
            tx.executeSql("INSERT INTO tt VALUES(X'"+hex+"')");
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          }, function() {
            db.transaction(function(tx2) {
              tx2.executeSql("SELECT BASE64(data) AS base64_value from tt", [], function(ignored, rs) {
                expect(rs).toBeDefined();
                expect(rs.rows).toBeDefined();
                expect(rs.rows.length).toBe(1);
                expect(rs.rows.item(0).base64_value).toBe(base64);

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });
            });
          });
        }, MYTIMEOUT);

        it(suiteName + "INSERT BLOB with 1541 bytes & SELECT as BASE64", function(done) {
          if (isWebSql) pending('SKIP: BASE64 not supported by Web SQL');
          if (!isWebSql && isAndroid && isImpl2) pending('SKIP: BASE64 not supported for androidDatabaseImplementation: 2');

          var db = openDatabase("INSERT-101-bytes-and-SELECT.db", "1.0", "Demo", DEFAULT_SIZE);

          var hex = 'FFD1FFD23456';
          var base64 = '/9H/0jRW';
          for (var ii=0; ii<8; ++ii) {
            hex = hex + hex;
            base64 = base64 + base64;
          }
          hex = hex + 'FFD1FFD212';
          base64 = base64 + '/9H/0hI=';

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS tt');
            tx.executeSql('CREATE TABLE tt (data)');
            tx.executeSql("INSERT INTO tt VALUES(X'"+hex+"')");
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            done();
          }, function() {
            db.transaction(function(tx2) {
              tx2.executeSql("SELECT BASE64(data) AS base64_value from tt", [], function(ignored, rs) {
                expect(rs).toBeDefined();
                expect(rs.rows).toBeDefined();
                expect(rs.rows.length).toBe(1);
                expect(rs.rows.item(0).base64_value).toBe(base64);

                // Close (plugin only) & finish:
                (isWebSql) ? done() : db.close(done, done);
              });
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
