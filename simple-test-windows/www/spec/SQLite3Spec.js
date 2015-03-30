// source: https://github.com/doo/SQLite3-WinRT
describe('SQLite3JS', function () {
  function waitsForPromise (promise) {
    var done = false;

    promise.then(function () {
      done = true;
    }, function (error) {
      currentJasmineSpec.fail(error);
      done = true;
    });

    waitsFor(function () { return done; });
  }
  
  var db = null;

  beforeEach(function () {
    db = new SQLite3JS.Database(':memory:');
    db.run('CREATE TABLE Item (name TEXT, price REAL, id INT PRIMARY KEY)');
    db.run('INSERT INTO Item (name, price, id) VALUES (?, ?, ?)', ['Apple', 1.2, 1]);
    db.run('INSERT INTO Item (name, price, id) VALUES (?, ?, ?)', ['Orange', 2.5, 2]);
    db.run('INSERT INTO Item (name, price, id) VALUES (?, ?, ?)', ['Banana', 3, 3]);
  });

  afterEach(function () {
    db.run('DROP TABLE Item');
    db.close();
  });

  it('should return the correct count', function () {
    var row;

    row = db.one('SELECT COUNT(*) AS count FROM Item');
    return expect(row.count).toEqual(3);
  });

  it('should return an item by id', function () {
    var row;

    row = db.one('SELECT * FROM Item WHERE id = ?', [2]);
    expect(row.name).toEqual('Orange');
    expect(row.price).toEqual(2.5);
    expect(row.id).toEqual(2);
  });

  it('should return items with names ending on "e"', function () {
    var expectedValues, i, properties, property, rows, _i, _len, _ref;

    rows = db.all('SELECT * FROM Item WHERE name LIKE ? ORDER BY id ASC', ['%e']);
    expect(rows.length).toEqual(2);
    expect(rows[0].name).toEqual('Apple');
    expect(rows[1].name).toEqual('Orange');
  });

  it('should allow binding null arguments', function () {
    var row, name = 'Mango';

    db.run('INSERT INTO Item (name, price, id) VALUES (?, ?, ?)', [name, null, null]);
    row = db.one('SELECT * FROM Item WHERE name = ?', [name]);
    expect(row.name).toEqual(name);
    expect(row.price).toEqual(null);
    expect(row.id).toEqual(null);
  });

  it('should call a callback for each row', function () {
    var calls, countCall = function () { calls += 1; };

    calls = 0;
    db.each('SELECT * FROM Item', countCall);
    expect(calls).toEqual(3);

    calls = 0;
    db.each('SELECT * FROM Item WHERE price > ?', [2], countCall);
    expect(calls).toEqual(2);
  });

  it('should map a function over all rows', function () {
    var rating = db.map('SELECT * FROM Item', function (row) {
      return row.price > 2 ? 'expensive' : 'cheap';
    });

    expect(rating.length).toEqual(3);
    expect(rating[0]).toEqual('cheap');
    expect(rating[1]).toEqual('expensive');
    expect(rating[2]).toEqual('expensive');
  });

  describe('Error Handling', function () {
    beforeEach(function () {
      this.addMatchers({
        toThrowWithResultCode: function (expected) {
          try {
            this.actual();
            return false;
          } catch (error) {
            return error.resultCode === expected;
          }
        }
      });
    });

    it('should throw when creating an invalid database', function () {
      expect(function () {
        new SQLite3JS.Database('invalid path');
      }).toThrowWithResultCode(SQLite3.ResultCode.cantOpen);
    });

    it('should throw when executing an invalid statement', function () {
      expect(function () {
        db.run('invalid sql');
      }).toThrowWithResultCode(SQLite3.ResultCode.error);
    });
  });

    // source: https://github.com/01org/cordova-win8/tree/develop/src/cordova-win8/js
    describe("HTML 5 Storage", function () {

        it("should exist", function() {
            expect(window.openDatabase);
        });

        it("Should open a database", function () {
            var db = openDatabase("Database", "1.0", "HTML5 Database API example", 200000);
            expect(db).toBeDefined();
        });

        it("should retrieve a correct database object", function () {
            var db = openDatabase("Database", "1.0", "HTML5 Database API example", 200000);
            expect(db).toBeDefined();
            expect(typeof (db.transaction)).toBe('function');
            //expect(typeof (db.changeVersion)).toBe('function');
        });

        it("Should insert data and return SQLResultSet objects", function () {
            function populateDB(tx) {
                tx.executeSql('DROP TABLE IF EXISTS Item');
                tx.executeSql('CREATE TABLE Item (name TEXT, price REAL, id INT PRIMARY KEY)');
                tx.executeSql('INSERT INTO Item (name, price, id) VALUES (?, ?, ?)', ['Apple', 1.2, 1]);
                tx.executeSql('INSERT INTO Item (name, price, id) VALUES (?, ?, ?)', ['Orange', 2.5, 2]);
                tx.executeSql('INSERT INTO Item (name, price, id) VALUES (?, ?, ?)', ['Banana', 3, 3]);
                tx.executeSql('SELECT * FROM Item', null, successCB, errorCB);
                tx.executeSql('DROP TABLE Item');
            }

            var errorCB = jasmine.createSpy().andCallFake(function (error) {
                console.log("error callBack , error code:" + error.code);
                
            });
            var successCB = jasmine.createSpy().andCallFake(function (tx, results) {
                expect(tx).toBeDefined();
                expect(results).toBeDefined();
                expect(results.rows.item(0).id).toBe(1);
                expect(results.rows.item(1).id).toBe(2);
                expect(results.rows.item(2).id).toBe(3);
            });
            runs(function () {
                var db = openDatabase("Database", "1.0", "HTML5 Database API example", 200000);
                db.transaction(populateDB, errorCB);
            });
            
            waitsFor(function () { return successCB.wasCalled; }, "Insert callback never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(successCB).toHaveBeenCalled();
                expect(errorCB).not.toHaveBeenCalled();
            });
        });

        return;

        it('should return the correct count', function () {
           
            function populateDB(tx) {
                tx.executeSql('CREATE TABLE Item (name TEXT, price REAL, id INT PRIMARY KEY)');
                tx.executeSql('INSERT INTO Item (name, price, id) VALUES (?, ?, ?)', ['Apple', 1.2, 1]);
                tx.executeSql('INSERT INTO Item (name, price, id) VALUES (?, ?, ?)', ['Orange', 2.5, 2]);
                tx.executeSql('INSERT INTO Item (name, price, id) VALUES (?, ?, ?)', ['Banana', 3, 3]);
                tx.executeSql('SELECT COUNT(*) AS count FROM Item', null, successCB, errorCB);
                tx.executeSql('DROP TABLE Item');
            }
            var errorCB = jasmine.createSpy().andCallFake(function (error) {
                console.log("error callBack , error code:" + error.code);

            });
            var successCB = jasmine.createSpy().andCallFake(function (tx, results) {
                expect(tx).toBeDefined();
                expect(results).toBeDefined();
                expect(results.rows.item(0).count).toEqual(3);
            });
            runs(function () {
                var db = openDatabase("Database", "1.0", "HTML5 Database API example", 200000);
                db.transaction(populateDB, errorCB);
            });

            waitsFor(function () { return successCB.wasCalled; }, "Insert callback never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(successCB).toHaveBeenCalled();
                expect(errorCB).not.toHaveBeenCalled();
            });
            
        });

        it('should return an item by id', function () {
            function populateDB(tx) {
                tx.executeSql('CREATE TABLE Item (name TEXT, price REAL, id INT PRIMARY KEY)');
                tx.executeSql('INSERT INTO Item (name, price, id) VALUES (?, ?, ?)', ['Apple', 1.2, 1]);
                tx.executeSql('INSERT INTO Item (name, price, id) VALUES (?, ?, ?)', ['Orange', 2.5, 2]);
                tx.executeSql('INSERT INTO Item (name, price, id) VALUES (?, ?, ?)', ['Banana', 3, 3]);
                tx.executeSql('SELECT * FROM Item WHERE id = ?', [2], successCB, errorCB);
                tx.executeSql('DROP TABLE Item');
            }
            var errorCB = jasmine.createSpy().andCallFake(function (error) {
                console.log("error callBack , error code:" + error.code);

            });
            var successCB = jasmine.createSpy().andCallFake(function (tx, results) {
                expect(tx).toBeDefined();
                expect(results).toBeDefined();
                expect(results.rows.length).toEqual(1);
                expect(results.rows.item(0).name).toEqual('Orange');
                expect(results.rows.item(0).price).toEqual(2.5);
                expect(results.rows.item(0).id).toEqual(2);
            });
            runs(function () {
                var db = openDatabase("Database", "1.0", "HTML5 Database API example", 200000);
                db.transaction(populateDB, errorCB);
            });

            waitsFor(function () { return successCB.wasCalled; }, "Insert callback never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(successCB).toHaveBeenCalled();
                expect(errorCB).not.toHaveBeenCalled();
            });
        });


        it('should return items with names ending on "e"', function () {
            function populateDB(tx) {
                tx.executeSql('CREATE TABLE Item (name TEXT, price REAL, id INT PRIMARY KEY)');
                tx.executeSql('INSERT INTO Item (name, price, id) VALUES (?, ?, ?)', ['Apple', 1.2, 1]);
                tx.executeSql('INSERT INTO Item (name, price, id) VALUES (?, ?, ?)', ['Orange', 2.5, 2]);
                tx.executeSql('INSERT INTO Item (name, price, id) VALUES (?, ?, ?)', ['Banana', 3, 3]);
                tx.executeSql('SELECT * FROM Item WHERE name LIKE ? ORDER BY id ASC', ['%e'], successCB, errorCB);
                tx.executeSql('DROP TABLE Item');
            }
            var errorCB = jasmine.createSpy().andCallFake(function (error) {
                console.log("error callBack , error code:" + error.code);

            });
            var successCB = jasmine.createSpy().andCallFake(function (tx, results) {
                expect(tx).toBeDefined();
                expect(results).toBeDefined();
                expect(results.rows.length).toEqual(2);
                expect(results.rows.item(0).name).toEqual('Apple');
                expect(results.rows.item(1).name).toEqual('Orange');
                expect(results.rows.item(0).id).toEqual(1);
            });
            runs(function () {
                var db = openDatabase("Database", "1.0", "HTML5 Database API example", 200000);
                db.transaction(populateDB, errorCB);
            });

            waitsFor(function () { return successCB.wasCalled; }, "Insert callback never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(successCB).toHaveBeenCalled();
                expect(errorCB).not.toHaveBeenCalled();
            });

        });

        it('should allow binding null arguments', function () {
            var name = 'Mango';
            function populateDB(tx) {
                tx.executeSql('CREATE TABLE Item (name TEXT, price REAL, id INT PRIMARY KEY)');
                tx.executeSql('INSERT INTO Item (name, price, id) VALUES (?, ?, ?)', [name, null, null]);
                tx.executeSql('SELECT * FROM Item WHERE name = ?', [name], successCB, errorCB);
                tx.executeSql('DROP TABLE Item');
            }
            var errorCB = jasmine.createSpy().andCallFake(function (error) {
                console.log("error callBack , error code:" + error.code);

            });
            var successCB = jasmine.createSpy().andCallFake(function (tx, results) {
                expect(tx).toBeDefined();
                expect(results).toBeDefined();
                expect(results.rows.length).toEqual(1);
                expect(results.rows.item(0).name).toEqual(name);
                expect(results.rows.item(0).price).toEqual(null);
                expect(results.rows.item(0).id).toEqual(null);
            });
            runs(function () {
                var db = openDatabase("Database", "1.0", "HTML5 Database API example", 200000);
                db.transaction(populateDB, errorCB);
            });

            waitsFor(function () { return successCB.wasCalled; }, "Insert callback never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(successCB).toHaveBeenCalled();
                expect(errorCB).not.toHaveBeenCalled();
            });

        });

        it("should error about invalid syntax", function () {
            function populateDB(tx) {
                tx.executeSql('CREATE TABLE11 Item (name TEXT, price REAL, id INT PRIMARY KEY)' , null , successCB , errorCB);
            }
            var successCB = jasmine.createSpy().andCallFake(function (tx, results) {
                expect(tx).toBeDefined();
                expect(results).toBeDefined();

            });

            var errorCB = jasmine.createSpy().andCallFake(function (error) {
                expect(error).toBeDefined();
                expect(error.code).toBe(5);
            });

            runs(function () {
                var db = openDatabase("Database", "1.0", "HTML5 Database API example", 200000);
                db.transaction(populateDB, errorCB);
            });
            waitsFor(function () { return errorCB.wasCalled; }, "error callback never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(errorCB).toHaveBeenCalled();
                expect(successCB).not.toHaveBeenCalled();
            });
        });


        it("should error about invalid params", function () {
            function populateDB(tx) {
                tx.executeSql('CREATE TABLE Item (name TEXT, price REAL, id INT PRIMARY KEY)');
                tx.executeSql('INSERT INTO Item (name, price, id) VALUES (?, ?, ?)', ['Apple', 1.2, 1]);
                tx.executeSql('INSERT INTO Item (name, price, id) VALUES (?, ?, ?)', ['Orange', 2.5, 1] , successCB , errorCB);
                tx.executeSql('DROP TABLE Item');
            }
            var successCB = jasmine.createSpy().andCallFake(function (tx, results) {
                expect(tx).toBeDefined();
                expect(results).toBeDefined();
                
            });

            var errorCB = jasmine.createSpy().andCallFake(function (error) {
                expect(error).toBeDefined();
                expect(error.code).toBe(5);
            });
            runs(function () {
                var db = openDatabase("Database", "1.0", "HTML5 Database API example", 200000);
                db.transaction(populateDB , errorCB);
            });

            waitsFor(function () { return errorCB.wasCalled; }, "error callback never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(errorCB).toHaveBeenCalled();
                expect(successCB).not.toHaveBeenCalled();
            });
        });
        it('should return null when creating an invalid name', function () {
            var db = openDatabase("invalid::name", "1.0", "HTML5 Database API example", 200000);
            expect(db).toBe(null);
            
        });
    });

});
