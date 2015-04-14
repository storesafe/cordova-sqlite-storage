(function () {
  "use strict";

  var Statement, Database, ItemDataSource, GroupDataSource;

  // Alternative typeof implementation yielding more meaningful results,
  // see http://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/
  function type(obj) {
    var typeString;

    typeString = Object.prototype.toString.call(obj);
    return typeString.substring(8, typeString.length - 1).toLowerCase();
  }

  function throwSQLiteError(message, comException) {
    var error = new Error(message);
    error.resultCode = comException.number & 0xffff;
    throw error;
  }

  Statement = WinJS.Class.define(function (db, sql, args) {
    try {
      this.statement = db.connection.prepare(sql);
    } catch (comException) {
      throwSQLiteError('Error preparing an SQLite statement.', comException);
    }

    if (args) {
      this.bind(args);
    }
  }, {
    bind: function (args) {
      var index, resultCode;

      args.forEach(function (arg, i) {
        index = i + 1;
        switch (type(arg)) {
          case 'number':
            if (arg % 1 === 0) {
              resultCode = this.statement.bindInt(index, arg);
            } else {
              resultCode = this.statement.bindDouble(index, arg);
            }
            break;
          case 'string':
            resultCode = this.statement.bindText(index, arg);
            break;
          case 'null':
            resultCode = this.statement.bindNull(index);
            break;
          default:
            throw new Error("Unsupported argument type: " + type(arg));
        }
        if (resultCode !== SQLite3.ResultCode.ok) {
          throw new Error("Error " + resultCode + " when binding argument to SQL query.");
        }
      }, this);
    },
    run: function () {
      this.statement.step();
    },
    one: function () {
      this.statement.step();
      return this._getRow();
    },
    all: function () {
      var result = [];

      this.each(function (row) {
        result.push(row);
      });
      return result;
    },
    each: function (callback) {
      while (this.statement.step() === SQLite3.ResultCode.row) {
        callback(this._getRow());
      }
    },
    map: function (callback) {
      var result = [];

      this.each(function (row) {
        result.push(callback(row));
      });
      return result;
    },
    close: function () {
      this.statement.close();
    },
    _getRow: function () {
      var i, len, name, row = {};

      for (i = 0, len = this.statement.columnCount() ; i < len; i += 1) {
        name = this.statement.columnName(i);
        row[name] = this._getColumn(i);
      }

      return row;
    },
    _getColumn: function (index) {
      switch (this.statement.columnType(index)) {
        case SQLite3.Datatype.integer:
          return this.statement.columnInt(index);
        case SQLite3.Datatype.float:
          return this.statement.columnDouble(index);
        case SQLite3.Datatype.text:
          return this.statement.columnText(index);
        case SQLite3.Datatype["null"]:
          return null;
        default:
          throw new Error('Unsupported column type in column ' + index);
      }
    }
  });

  Database = WinJS.Class.define(function (dbPath) {
    try {
      this.connection = SQLite3.Database(dbPath);
    } catch (comException) {
      throwSQLiteError('Error creating an SQLite database connection.', comException);
    }
  }, {
    run: function (sql, args) {
      var statement = this.prepare(sql, args);

      statement.run();
      statement.close();
    },
    one: function (sql, args) {
      var row, statement = this.prepare(sql, args);

      row = statement.one();
      statement.close();
      return row;
    },
    all: function (sql, args) {
      var rows, statement = this.prepare(sql, args);

      rows = statement.all();
      statement.close();
      return rows;
    },
    each: function (sql, args, callback) {
      if (!callback && type(args) === 'function') {
        callback = args;
        args = null;
      }

      var statement = this.prepare(sql, args);

      statement.each(callback);
      statement.close();
    },
    map: function (sql, args, callback) {
      if (!callback && type(args) === 'function') {
        callback = args;
        args = null;
      }

      var rows, statement = this.prepare(sql, args);

      rows = statement.map(callback);
      statement.close();
      return rows;
    },
    prepare: function (sql, args) {
      return new Statement(this, sql, args);
    },
    itemDataSource: function (sql, args, keyColumnName, groupKeyColumnName) {
      if (type(args) === 'string') {
        groupKeyColumnName = keyColumnName;
        keyColumnName = args;
        args = undefined;
      }

      return new ItemDataSource(this, sql, args, keyColumnName, groupKeyColumnName);
    },
    groupDataSource: function (sql, args, keyColumnName, sizeColumnName) {
      if (type(args) === 'string') {
        sizeColumnName = keyColumnName;
        keyColumnName = args;
        args = undefined;
      }

      return new GroupDataSource(this, sql, args, keyColumnName, sizeColumnName);
    },
    close: function () {
      this.connection.close();
    },
    lastInsertRowid: function () {
        return this.connection.lastInsertRowid();
    },
    totalChanges: function () {
      return this.connection.totalChanges();
    }
  });

  ItemDataSource = WinJS.Class.derive(WinJS.UI.VirtualizedDataSource,
    function (db, sql, args, keyColumnName, groupKeyColumnName) {
      var dataAdapter = {
        getCount: function () {
          var row = db.one('SELECT COUNT(*) AS cnt FROM (' + sql + ')', args);
          return WinJS.Promise.wrap(row.cnt);
        },
        itemsFromIndex: function (requestIndex, countBefore, countAfter) {
          var items,
              limit = countBefore + 1 + countAfter,
              offset = requestIndex - countBefore;

          items = db.map(
            'SELECT * FROM (' + sql + ') LIMIT ' + limit + ' OFFSET ' + offset,
            function (row) {
              var item = {
                key: row[keyColumnName].toString(),
                data: row
              };
              if (groupKeyColumnName) {
                item.groupKey = row[groupKeyColumnName].toString();
              }
              return item;
            });

          return WinJS.Promise.wrap({
            items: items,
            offset: countBefore,
            atEnd: items.length < limit
          });
        }
      };

      this._baseDataSourceConstructor(dataAdapter);
    }
  );

  GroupDataSource = WinJS.Class.derive(WinJS.UI.VirtualizedDataSource,
    function (db, sql, args, keyColumnName, sizeColumnName) {
      var groups,
          dataAdapter,
          keyIndexMap = {},
          groupIndex = 0,
          firstItemIndex = 0;

      groups = db.map(sql, args, function (row) {
        var item = {
          key: row[keyColumnName].toString(),
          groupSize: row[sizeColumnName],
          firstItemIndexHint: firstItemIndex,
          data: row
        };

        keyIndexMap[item.key] = groupIndex;
        groupIndex += 1;
        firstItemIndex += item.groupSize;

        return item;
      });

      dataAdapter = {
        getCount: function () {
          return WinJS.Promise.wrap(groups.length);
        },
        itemsFromIndex: function (requestIndex, countBefore, countAfter) {
          return WinJS.Promise.wrap({
            items: groups.slice(),
            offset: requestIndex,
            absoluteIndex: requestIndex,
            atStart: true,
            atEnd: true
          });
        },
        itemsFromKey: function (key, countBefore, countAfter) {
          return this.itemsFromIndex(keyIndexMap[key], countBefore, countAfter);
        }
      };

      this._baseDataSourceConstructor(dataAdapter);
    }
  );

  WinJS.Namespace.define('SQLite3JS', {
    Database: Database
  });

}());
