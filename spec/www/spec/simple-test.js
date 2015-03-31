var MYTIMEOUT = 4000;

var DEFAULT_SIZE = 5000000; // max to avoid popup in safari/ios

var wait = 0;
function stop() { ++wait; }

function start() { --wait; if (wait == 0) done; }

function ok(test, desc) { expect(test).toBe(true); }

function equal(a, b, desc) { expect(a).toBe(b); }

var scenarioList = [ 'Plugin', 'HTML5' ];

var scenarioCount = /Windows/.test(navigator.userAgent) ? 1 : 2;

describe('check startup', function() {

  it('receives deviceready event', function(done) {
    expect(true).toBe(true);
    document.addEventListener("deviceready", function() { done(); });
  }, MYTIMEOUT);

  it('has openDatabase', function() {
    expect(true).toBe(true);
    expect(window.openDatabase).toBeDefined();
    expect(window.sqlitePlugin).toBeDefined();
    expect(window.sqlitePlugin.openDatabase).toBeDefined();
    //openDatabase = window.openDatabase = window.sqlitePlugin.openDatabase;
  });
});

for (var i=0; i<scenarioCount; ++i) {
  var scenarioName = scenarioList[i];
  var suiteName = scenarioName + ': ';
  var isWebSql = (i !== 0);

  var openDatabase = isWebSql ? window.openDatabase : window.sqlitePlugin.openDatabase;

  describe('simple tests - ' + suiteName,
    function() {

      it(suiteName + "US-ASCII String manipulation test",
        function() {

          var db = openDatabase("ASCII-string-test.db", "1.0", "Demo", DEFAULT_SIZE);

          ok(!!db, 'valid db object');

          stop(2);

          db.transaction(function(tx) {

            start(1);
            ok(!!tx, 'valid tx object');

            tx.executeSql("select upper('Some US-ASCII text') as uppertext", [], function(tx, res) {
              start(1);

              console.log("res.rows.item(0).uppertext: " + res.rows.item(0).uppertext);

              equal(res.rows.item(0).uppertext, "SOME US-ASCII TEXT", "select upper('Some US-ASCII text')");
            });
          });
        }, MYTIMEOUT);

        it(suiteName + "db transaction test", function() {
          var db = openDatabase("db-trx-test.db", "1.0", "Demo", DEFAULT_SIZE);

          ok(!!db, "db object");

          stop(10);

          db.transaction(function(tx) {

            start(1);
            ok(!!tx, "tx object");

            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)');

            tx.executeSql("INSERT INTO test_table (data, data_num) VALUES (?,?)", ["test", 100], function(tx, res) {
              start(1);
              ok(!!tx, "tx object");
              ok(!!res, "res object");

              console.log("insertId: " + res.insertId + " -- probably 1");
              console.log("rowsAffected: " + res.rowsAffected + " -- should be 1");

              ok(!!res.insertId, "Valid res.insertId");
              equal(res.rowsAffected, 1, "res rows affected");

              db.transaction(function(tx) {
                start(1);
                ok(!!tx, "second tx object");

                tx.executeSql("SELECT count(id) as cnt from test_table;", [], function(tx, res) {
                  start(1);

                  console.log("res.rows.length: " + res.rows.length + " -- should be 1");
                  console.log("res.rows.item(0).cnt: " + res.rows.item(0).cnt + " -- should be 1");

                  equal(res.rows.length, 1, "res rows length");
                  equal(res.rows.item(0).cnt, 1, "select count");
                });

                tx.executeSql("SELECT data_num from test_table;", [], function(tx, res) {
                  start(1);

                  equal(res.rows.length, 1, "SELECT res rows length");
                  equal(res.rows.item(0).data_num, 100, "SELECT data_num");
                });

                tx.executeSql("UPDATE test_table SET data_num = ? WHERE data_num = 100", [101], function(tx, res) {
                  start(1);

                  console.log("UPDATE rowsAffected: " + res.rowsAffected + " -- should be 1");

                  equal(res.rowsAffected, 1, "UPDATE res rows affected"); /* issue #22 (Android) */
                });

                tx.executeSql("SELECT data_num from test_table;", [], function(tx, res) {
                  start(1);

                  equal(res.rows.length, 1, "SELECT res rows length");
                  equal(res.rows.item(0).data_num, 101, "SELECT data_num");
                });

                tx.executeSql("DELETE FROM test_table WHERE data LIKE 'tes%'", [], function(tx, res) {
                  start(1);

                  console.log("DELETE rowsAffected: " + res.rowsAffected + " -- should be 1");

                  equal(res.rowsAffected, 1, "DELETE res rows affected"); /* issue #22 (Android) */
                });

                tx.executeSql("SELECT data_num from test_table;", [], function(tx, res) {
                  start(1);

                  equal(res.rows.length, 0, "SELECT res rows length");
                });

              });

            }, function(e) {
              console.log("ERROR: " + e.message);
            });
          }, function(e) {
            console.log("ERROR: " + e.message);
          }, function() {
            console.log("tx success cb");
            ok(true, "tx success cb");
            start(1);
          });

        }, MYTIMEOUT);

  });

};

