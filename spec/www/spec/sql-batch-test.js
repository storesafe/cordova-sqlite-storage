/* 'use strict'; */

var MYTIMEOUT = 12000;

var DEFAULT_SIZE = 5000000; // max to avoid popup in safari/ios

var isWP8 = /IEMobile/.test(navigator.userAgent); // Matches WP(7/8/8.1)
var isWindows = /Windows /.test(navigator.userAgent); // Windows (8.1)
var isAndroid = !isWindows && /Android/.test(navigator.userAgent);
var isMac = /Macintosh/.test(navigator.userAgent);
var isWKWebView = !isWindows && !isAndroid && !isWP8 && !isMac && !!window.webkit && !!window.webkit.messageHandlers;

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

  for (var i=0; i<pluginScenarioCount; ++i) {

    describe(pluginScenarioList[i] + ': BATCH SQL test(s)', function() {
      var scenarioName = pluginScenarioList[i];
      var suiteName = scenarioName + ': ';
      var isImpl2 = (i === 1);

      // NOTE: MUST be defined in function scope, NOT outer scope:
      var openDatabase = function(name, ignored1, ignored2, ignored3) {
        if (isImpl2) {
          return window.sqlitePlugin.openDatabase({
            // prevent reuse of database from default db implementation:
            name: 'i2-'+name,
            // explicit database location:
            location: 'default',
            androidDatabaseImplementation: 2,
            androidLockWorkaround: 1
          });
        } else {
          // explicit database location:
          return window.sqlitePlugin.openDatabase({name: name, location: 'default'});
        }
      }

      describe(pluginScenarioList[i] + ': Basic sql batch test(s)', function() {

        it(suiteName + 'Single-column batch sql test', function(done) {
          var db = openDatabase('Single-column-batch-sql-test.db', '1.0', 'Test', DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.sqlBatch([
            'DROP TABLE IF EXISTS MyTable',
            'CREATE TABLE MyTable (data)',
            [ 'INSERT INTO MyTable VALUES (?)', ['test-value'] ],
          ], function() {
            db.executeSql('SELECT * FROM MyTable', [], function (rs) {
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).data).toBe('test-value');
              db.close(done, done);
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'Single-column batch sql test 2 (CREATE TABLE SQL statement with no parameters in [])', function(done) {
          var db = openDatabase('Single-column-batch-sql-test-2.db', '1.0', 'Test', DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.sqlBatch([
            'DROP TABLE IF EXISTS MyTable',
            [ 'CREATE TABLE MyTable (data)' ],
            [ 'INSERT INTO MyTable VALUES (?)', ['test-value'] ],
          ], function() {
            db.executeSql('SELECT * FROM MyTable', [], function (rs) {
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(1);
              expect(rs.rows.item(0).data).toBe('test-value');
              db.close(done, done);
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'Single-column batch sql test values: INSERT INTEGER/REAL number values and check stored data', function(done) {
          var db = openDatabase('Single-column-batch-sql-test-number-values.db', '1.0', 'Test', DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.sqlBatch([
            'DROP TABLE IF EXISTS MyTable',
            'CREATE TABLE MyTable (data)',
            [ 'INSERT INTO MyTable VALUES (?)', [101] ],
            [ 'INSERT INTO MyTable VALUES (?)', [-101] ],
            [ 'INSERT INTO MyTable VALUES (?)', [123.456] ],
            [ 'INSERT INTO MyTable VALUES (?)', [-123.456] ],
            [ 'INSERT INTO MyTable VALUES (?)', [1234567890123] ],
            [ 'INSERT INTO MyTable VALUES (?)', [-1234567890123] ],
            [ 'INSERT INTO MyTable VALUES (?)', [0] ],
          ], function() {
            db.executeSql('SELECT data AS d1, TYPEOF(data) AS t1, ABS(data) AS a1, UPPER(data) as u1 FROM MyTable', [], function (rs) {
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(7);
              expect(rs.rows.item(0).d1).toBe(101);
              if (isMac || isWKWebView)
                expect(rs.rows.item(0).t1).toBe('real');
              else
                expect(rs.rows.item(0).t1).toBe('integer');
              expect(rs.rows.item(0).a1).toBe(101);
              if (isMac || isWKWebView)
                expect(rs.rows.item(0).u1).toBe('101.0');
              else
                expect(rs.rows.item(0).u1).toBe('101');
              expect(rs.rows.item(1).d1).toBe(-101);
              if (isMac || isWKWebView)
                expect(rs.rows.item(1).t1).toBe('real');
              else
                expect(rs.rows.item(1).t1).toBe('integer');
              expect(rs.rows.item(1).a1).toBe(101);
              if (isMac || isWKWebView)
                expect(rs.rows.item(1).u1).toBe('-101.0');
              else
                expect(rs.rows.item(1).u1).toBe('-101');
              expect(rs.rows.item(2).d1).toBe(123.456);
              expect(rs.rows.item(2).t1).toBe('real');
              expect(rs.rows.item(2).a1).toBe(123.456);
              expect(rs.rows.item(2).u1).toBe('123.456');
              expect(rs.rows.item(3).d1).toBe(-123.456);
              expect(rs.rows.item(3).t1).toBe('real');
              expect(rs.rows.item(3).a1).toBe(123.456);
              expect(rs.rows.item(3).u1).toBe('-123.456');
              expect(rs.rows.item(4).d1).toBe(1234567890123);
              if (isMac || isWKWebView)
                expect(rs.rows.item(4).t1).toBe('real');
              else
                expect(rs.rows.item(4).t1).toBe('integer');
              expect(rs.rows.item(4).a1).toBe(1234567890123);
              if (isMac || isWKWebView)
                expect(rs.rows.item(4).u1).toBe('1234567890123.0');
              else
                expect(rs.rows.item(4).u1).toBe('1234567890123');
              expect(rs.rows.item(5).d1).toBe(-1234567890123);
              if (isMac || isWKWebView)
                expect(rs.rows.item(5).t1).toBe('real');
              else
                expect(rs.rows.item(5).t1).toBe('integer');
              expect(rs.rows.item(5).a1).toBe(1234567890123);
              if (isMac || isWKWebView)
                expect(rs.rows.item(5).u1).toBe('-1234567890123.0');
              else
                expect(rs.rows.item(5).u1).toBe('-1234567890123');
              expect(rs.rows.item(6).d1).toBe(0);
              if (isMac || isWKWebView)
                expect(rs.rows.item(6).t1).toBe('real');
              else
                expect(rs.rows.item(6).t1).toBe('integer');
              expect(rs.rows.item(6).a1).toBe(0);
              if (isMac || isWKWebView)
                expect(rs.rows.item(6).u1).toBe('0.0');
              else
                expect(rs.rows.item(6).u1).toBe('0');
              db.close(done, done);
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'Single-column batch sql test values: INSERT null/undefined values and check stored data', function(done) {
          var db = openDatabase('Single-column-batch-sql-test-null-undefined-values.db', '1.0', 'Test', DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.sqlBatch([
            'DROP TABLE IF EXISTS MyTable',
            'CREATE TABLE MyTable (data)',
            [ 'INSERT INTO MyTable VALUES (?)', [null] ],
            [ 'INSERT INTO MyTable VALUES (?)', [undefined] ],
          ], function() {
            db.executeSql('SELECT data AS d1, TYPEOF(data) AS t1, ABS(data) AS a1, UPPER(data) as u1 FROM MyTable', [], function (rs) {
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(2);
              expect(rs.rows.item(0).d1).toBe(null);
              expect(rs.rows.item(0).t1).toBe('null');
              expect(rs.rows.item(0).a1).toBe(null);
              expect(rs.rows.item(0).u1).toBe(null);
              expect(rs.rows.item(1).d1).toBe(null);
              expect(rs.rows.item(1).t1).toBe('null');
              expect(rs.rows.item(1).a1).toBe(null);
              expect(rs.rows.item(1).u1).toBe(null);
              db.close(done, done);
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'Single-column batch sql test values: INSERT +/- Infinity & NaN values and check stored data [TBD Android/iOS/macOS plugin result for +/- Infinity]', function(done) {
          if (isWP8) pending('SKIP for WP8'); // SKIP for now
          if (isMac) pending('SKIP for macOS [CRASH]'); // FUTURE TBD

          var db = openDatabase('Single-column-batch-sql-test-infinity-nan-values.db', '1.0', 'Test', DEFAULT_SIZE);
          expect(db).toBeDefined();

          db.sqlBatch([
            'DROP TABLE IF EXISTS MyTable',
            'CREATE TABLE MyTable (data)',
            [ 'INSERT INTO MyTable VALUES (?)', [Infinity] ],
            [ 'INSERT INTO MyTable VALUES (?)', [-Infinity] ],
            [ 'INSERT INTO MyTable VALUES (?)', [NaN] ],
          ], function() {
            db.executeSql('SELECT data AS d1, TYPEOF(data) AS t1, ABS(data) AS a1, UPPER(data) as u1 FROM MyTable', [], function (rs) {
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(3);
              if (isWindows) {
                expect(rs.rows.item(0).d1).toBe(Infinity);
                expect(rs.rows.item(0).t1).toBe('real');
                expect(rs.rows.item(0).a1).toBe(Infinity);
                expect(rs.rows.item(0).u1).toBe('INF');
                expect(rs.rows.item(1).d1).toBe(-Infinity);
                expect(rs.rows.item(1).t1).toBe('real');
                expect(rs.rows.item(1).a1).toBe(Infinity);
                expect(rs.rows.item(1).u1).toBe('-INF');
              } else {
                expect(rs.rows.item(0).d1).toBe(null);
                expect(rs.rows.item(0).t1).toBe('null');
                expect(rs.rows.item(0).a1).toBe(null);
                expect(rs.rows.item(0).u1).toBe(null);
                expect(rs.rows.item(1).d1).toBe(null);
                expect(rs.rows.item(1).t1).toBe('null');
                expect(rs.rows.item(1).a1).toBe(null);
                expect(rs.rows.item(1).u1).toBe(null);
              }
              expect(rs.rows.item(2).d1).toBe(null);
              expect(rs.rows.item(2).t1).toBe('null');
              expect(rs.rows.item(2).a1).toBe(null);
              expect(rs.rows.item(2).u1).toBe(null);
              db.close(done, done);
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'Single-column batch sql test values: INSERT true/false values and check stored data [stored as strings]', function(done) {
          var db = openDatabase('Single-column-batch-sql-test-true-false-values.db', '1.0', 'Test', DEFAULT_SIZE);

          db.sqlBatch([
            'DROP TABLE IF EXISTS MyTable',
            'CREATE TABLE MyTable (data)',
            [ 'INSERT INTO MyTable VALUES (?)', [true] ],
            [ 'INSERT INTO MyTable VALUES (?)', [false] ],
          ], function() {
            db.executeSql('SELECT data AS d1, TYPEOF(data) AS t1, ABS(data) AS a1, UPPER(data) as u1 FROM MyTable', [], function (rs) {
              expect(rs.rows).toBeDefined();
              expect(rs.rows.length).toBe(2);
              expect(rs.rows.item(0).d1).toBe('true');
              expect(rs.rows.item(0).t1).toBe('text');
              expect(rs.rows.item(0).a1).toBe(0);
              expect(rs.rows.item(0).u1).toBe('TRUE');
              expect(rs.rows.item(1).d1).toBe('false');
              expect(rs.rows.item(1).t1).toBe('text');
              expect(rs.rows.item(1).a1).toBe(0);
              expect(rs.rows.item(1).u1).toBe('FALSE');
              db.close(done, done);
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'batch sql with dynamic object for SQL [INCONSISTENT BEHAVIOR]', function(done) {
          // MyDynamicObject "class":
          function MyDynamicObject() { this.name = 'Alice'; };
          MyDynamicObject.prototype.toString = function() {return "INSERT INTO MyTable VALUES ('" + this.name + "')";}

          var myObject = new MyDynamicObject();
          // Check myObject:
          expect(myObject.toString()).toBe("INSERT INTO MyTable VALUES ('Alice')");

          var db = openDatabase('batch-sql-with-dynamic-object-for-sql.db', '1.0', 'Test', DEFAULT_SIZE);

          expect(db).toBeDefined();

          myObject.name = 'Betty';
          db.sqlBatch([
            'DROP TABLE IF EXISTS MyTable',
            'CREATE TABLE MyTable (data)',
            myObject
          ], function() {
            db.executeSql('SELECT * FROM MyTable', [], function (res) {
              expect(res.rows.item(0).data).toBe('Carol');
              db.close(done, done);
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
          myObject.name = 'Carol';
        }, MYTIMEOUT);

        it(suiteName + 'batch sql with dynamic object for SQL arg value [INCONSISTENT BEHAVIOR]', function(done) {
          // MyDynamicParameterObject "class":
          function MyDynamicParameterObject() {this.name='Alice';};
          MyDynamicParameterObject.prototype.toString = function() {return this.name;};

          var myObject = new MyDynamicParameterObject();

          // Check myObject:
          expect(myObject.toString()).toBe('Alice');

          var db = openDatabase('batch-sql-with-dynamic-object-for-sql-arg-value.db', '1.0', 'Test', DEFAULT_SIZE);

          expect(db).toBeDefined();

          myObject.name = 'Betty';
          db.sqlBatch([
            'DROP TABLE IF EXISTS MyTable',
            'CREATE TABLE MyTable (data)',
            [ 'INSERT INTO MyTable VALUES (?)', [myObject] ],
          ], function() {
            db.executeSql('SELECT * FROM MyTable', [], function (res) {
              expect(res.rows.item(0).data).toBe('Carol');
              db.close(done, done);
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
          myObject.name = 'Carol';
        }, MYTIMEOUT);

        it(suiteName + 'Multi-row INSERT with parameters in batch sql test', function(done) {
          if (isWP8) pending('SKIP: NOT SUPPORTED for WP8');

          var db = openDatabase('Multi-row-INSERT-with-parameters-batch-sql-test.db', '1.0', 'Test', DEFAULT_SIZE);

          expect(db).toBeDefined();

          db.sqlBatch([
            'DROP TABLE IF EXISTS MyTable',
            'CREATE TABLE MyTable (x,y)',
            [ 'INSERT INTO MyTable VALUES (?,?),(?,?)', ['a',1,'b',2] ],
          ], function() {
            db.executeSql('SELECT * FROM MyTable', [], function (resultSet) {
              // EXPECTED: CORRECT RESULT:
              expect(resultSet.rows.length).toBe(2);
              expect(resultSet.rows.item(0).x).toBe('a');
              expect(resultSet.rows.item(0).y).toBe(1);
              expect(resultSet.rows.item(1).x).toBe('b');
              expect(resultSet.rows.item(1).y).toBe(2);
              db.close(done, done);
            });
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'batch sql with syntax error', function(done) {
          var db = openDatabase('batch-sql-syntax-error-test.db', '1.0', 'Test', DEFAULT_SIZE);

          expect(db).toBeDefined();

          db.sqlBatch([
            'DROP TABLE IF EXISTS MyTable',
            // syntax error below:
            'CRETE TABLE MyTable (SampleColumn)',
            [ 'INSERT INTO MyTable VALUES (?)', ['test-value'] ],
          ], function() {
            // NOT EXPECTED:
            expect(true).toBe(false);
            db.close(done, done);
          }, function(error) {
            // EXPECTED RESULT:
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.message).toBeDefined();

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows || (isAndroid && isImpl2))
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(5);

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
              expect(error.message).toMatch(/a statement with no error handler failed: Error preparing an SQLite statement/);
            else
              expect(error.message).toMatch(/a statement with no error handler failed.*near \"CRETE\": syntax error/);

            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'batch sql with constraint violation (check error code & basic error message pattern)', function(done) {
          var db = openDatabase('batch-sql-constraint-violation-test.db', '1.0', 'Test', DEFAULT_SIZE);

          expect(db).toBeDefined();

          db.sqlBatch([
            'DROP TABLE IF EXISTS MyTable',
            // syntax error below:
            'CREATE TABLE MyTable (data UNIQUE)',
            [ 'INSERT INTO MyTable VALUES (?)', [123] ],
            [ 'INSERT INTO MyTable VALUES (?)', [123] ],
          ], function() {
            // NOT EXPECTED:
            expect(false).toBe(true);
            db.close(done, done);
          }, function(error) {
            // EXPECTED RESULT:
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.message).toBeDefined();

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
              expect(error.code).toBe(0);
            else
              expect(error.code).toBe(6);

            if (isWP8)
              expect(true).toBe(true); // SKIP for now
            else if (isWindows)
              expect(error.message).toMatch(/a statement with no error handler failed: SQLite3 step error result code: 1/);
            else
              expect(error.message).toMatch(/a statement with no error handler failed.*constraint fail/);
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'batch sql failure-safe semantics', function(done) {
          var db = openDatabase('batch-sql-failure-safe-test.db', '1.0', 'Test', DEFAULT_SIZE);

          expect(db).toBeDefined();

          db.executeSql('DROP TABLE IF EXISTS MyTable');
          db.executeSql('CREATE TABLE MyTable (SampleColumn)');
          db.executeSql('INSERT INTO MyTable VALUES (?)', ['test-value'], function() {
            db.sqlBatch([
              'DELETE FROM MyTable',
              // syntax error below:
              [ 'INSRT INTO MyTable VALUES (?)', 'test-value' ]
            ], function() {
              // NOT EXPECTED:
              expect(true).toBe(false);
              db.close(done, done);
            }, function(error) {
              // CHECK INTEGRITY & FINISH:
              db.executeSql('SELECT * FROM MyTable', [], function (res) {
                expect(res.rows.item(0).SampleColumn).toBe('test-value');
                db.close(done, done);
              });
            });

          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'sqlBatch() with no arguments (BOGUS)', function(done) {
          var db = openDatabase('sql-batch-with-no-arguments.db', '1.0', 'Test', DEFAULT_SIZE);

          try {
            db.sqlBatch();
            // SHOULD NOT GET HERE:
            expect(false).toBe(true);
          } catch(e) {
            // EXPECTED:
            expect(e).toBeDefined();
            expect(e.message).toMatch(/sqlBatch expects an array/);
            db.close(done, done);
          };
        }, MYTIMEOUT);

        it(suiteName + 'sqlBatch with [] for sql batch item (BOGUS)', function(done) {
          var db = openDatabase('sql-batch-with-empty-array-for-batch-item.db', '1.0', 'Test', DEFAULT_SIZE);

          try {
            db.sqlBatch(['SELECT 1', []], function() {
              // NOT EXPECTED:
              expect(false).toBe(true);
              db.close(done, done);
            }, function(error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              db.close(done, done);
            });
            // SHOULD NOT GET HERE:
            expect(false).toBe(true);
          } catch(e) {
            expect(e).toBeDefined();
            expect(e.message).toMatch(/sqlBatch array element of zero .*0.* length/);
            db.close(done, done);
          };
        }, MYTIMEOUT);

        it(suiteName + 'sqlBatch with true for SQL statements (BOGUS)', function(done) {
          var db = openDatabase('sql-batch-with-true-for-sql-statements.db', '1.0', 'Test', DEFAULT_SIZE);

          try {
            db.sqlBatch(true, function() {
              // NOT EXPECTED:
              expect(false).toBe(true);
              db.close(done, done);
            }, function(error) {
              // NOT EXPECTED:
              expect(false).toBe(true);
              db.close(done, done);
            });
            // SHOULD NOT GET HERE:
            expect(false).toBe(true);
          } catch(e) {
            expect(e).toBeDefined();
            expect(e.message).toMatch(/sqlBatch expects an array/);
            db.close(done, done);
          };
        }, MYTIMEOUT);

        it(suiteName + 'batch sql with batch item with false for arguments array (BOGUS)', function(done) {
          var db = openDatabase('batch-sql-with-false-for-args-array.db', '1.0', 'Test', DEFAULT_SIZE);

          var check1 = false;
          try {
            db.sqlBatch([
              'SELECT 1',
              [ 'SELECT 1', false ],
            ], function() {
              // TBD EXPECTED RESULT:
              check1 = true;
            }, function(error) {
              // TBD NOT EXPECTED:
              expect(false).toBe(true);
              expect(error.message).toBe('--');
            });
          } catch(e) {
            expect('Plugin behavior changed please update this test').toBe('--');
            db.close(done, done);
          };

          db.sqlBatch([
            'SELECT 1',
          ], function() {
            // EXPECTED RESULT:
            expect(check1).toBe(true);
            db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'batch sql with batch item with "string-value" for arguments array (BOGUS)', function(done) {
          var db = openDatabase('batch-sql-with-false-for-args-array.db', '1.0', 'Test', DEFAULT_SIZE);

          var check1 = false;
          try {
            db.sqlBatch([
              'SELECT 1',
              [ 'SELECT 1', 'string-value' ],
            ], function() {
              // TBD EXPECTED RESULT:
              check1 = true;
            }, function(error) {
              // TBD NOT EXPECTED:
              expect(false).toBe(true);
              expect(error.message).toBe('--');
            });
          } catch(e) {
            expect('Plugin behavior changed please update this test').toBe('--');
            db.close(done, done);
          };

          db.sqlBatch([
            'SELECT 1',
          ], function() {
            // EXPECTED RESULT:
            expect(check1).toBe(true);
            db.close(done, done);
          }, function(error) {
            // NOT EXPECTED:
            expect(false).toBe(true);
            expect(error.message).toBe('--');
            db.close(done, done);
          });
        }, MYTIMEOUT);

        it(suiteName + 'sqlBatch with single SELECT statement, false for error callback (BOGUS)', function(done) {
          var db = openDatabase('sql-batch-with-select-false-for-error-cb.db', '1.0', 'Test', DEFAULT_SIZE);

          try {
            db.sqlBatch(['SELECT 1'], function() {
              // EXPECTED:
              expect(true).toBe(true);
              db.close(done, done);
            }, false);
          } catch(e) {
            expect('Plugin behavior changed please update this test').toBe('--');
            db.close(done, done);
          };
        }, MYTIMEOUT);

        it(suiteName + 'sqlBatch with single SELECT statement, string-value for error callback (BOGUS)', function(done) {
          var db = openDatabase('sql-batch-with-select-string-value-for-error-cb.db', '1.0', 'Test', DEFAULT_SIZE);

          try {
            db.sqlBatch(['SELECT 1'], function() {
              // EXPECTED:
              expect(true).toBe(true);
              db.close(done, done);
            }, 'stirng-value');
          } catch(e) {
            expect('Plugin behavior changed please update this test').toBe('--');
            db.close(done, done);
          };
        }, MYTIMEOUT);

        it(suiteName + 'sqlBatch with error, false for success callback (BOGUS)', function(done) {
          var db = openDatabase('sql-batch-with-select-false-for-success-cb.db', '1.0', 'Test', DEFAULT_SIZE);

          try {
            db.sqlBatch(['SLCT 1'], false, function(e) {
              // EXPECTED:
              expect(e).toBeDefined();
              // TBD ...
              db.close(done, done);
            }, true);
          } catch(e) {
            expect('Plugin behavior changed please update this test').toBe('--');
            db.close(done, done);
          };
        }, MYTIMEOUT);

        it(suiteName + 'sqlBatch with error, string-value for success callback (BOGUS)', function(done) {
          var db = openDatabase('sql-batch-with-select-string-value-for-success-cb.db', '1.0', 'Test', DEFAULT_SIZE);

          try {
            db.sqlBatch(['SLCT 1'], 'string-value', function(e) {
              // EXPECTED:
              expect(e).toBeDefined();
              // TBD ...
              db.close(done, done);
            }, true);
          } catch(e) {
            expect('Plugin behavior changed please update this test').toBe('--');
            db.close(done, done);
          };
        }, MYTIMEOUT);

      });

    });
  }
}

if (window.hasBrowser) mytests();
else exports.defineAutoTests = mytests;

/* vim: set expandtab : */
