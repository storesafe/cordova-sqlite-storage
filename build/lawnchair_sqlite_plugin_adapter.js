
/*
     SQLitePlugin Lawnchair Adapter
     (c) 2011 Joe Noon <joenoon@gmail.com>
     This may be freely distributed under the MIT license.
*/

(function() {
  var fail, now, sqlite_plugin, root;

  root = this;

  fail = function(e) {
    console.log("Error in SQLitePlugin Lawnchair adapter: " + e.message);
  };

  now = function() {
    return (new Date()).getTime();
  };

  sqlite_plugin = {
    valid: function() {
      return !!("SQLitePlugin" in root);
    },
    init: function(options, callback) {
      var cb, db, sql, success, that;
      that = this;
      cb = this.fn(this.name, callback);
      sql = "CREATE TABLE IF NOT EXISTS " + this.name + " (id NVARCHAR(32) UNIQUE PRIMARY KEY, value TEXT, timestamp REAL)";
      success = function() {
        cb.call(that, that);
      };
      db = options.db || this.name;
      this.db = new SQLitePlugin("" + db + ".sqlite3");
      this.db.executeSql(sql, [], success, fail);
    },
    keys: function(callback) {
      var cb, sql, success, that;
      that = this;
      cb = this.lambda(callback);
      sql = "SELECT id FROM " + this.name + " ORDER BY timestamp DESC";
      success = function(res) {
        cb.call(that, res.rows);
      };
      this.db.executeSql(sql, [], success, fail);
      return this;
    },
    save: function(obj, callback) {
      var db, id, ins, success, that, up, val;
      that = this;
      db = this.db;
      id = obj.key || this.uuid();
      ins = "INSERT INTO " + this.name + " (value, timestamp, id) VALUES (?,?,?)";
      up = "UPDATE " + this.name + " SET value = ?, timestamp = ? WHERE id = ?";
      success = function() {
        obj.key = id;
        if (callback) that.lambda(callback).call(that, obj);
      };
      val = [now(), id];
      this.exists(obj.key, function(exists) {
        var sql;
        delete obj.key;
        val.unshift(JSON.stringify(obj));
        sql = exists ? up : ins;
        db.executeSql(sql, val, success, fail);
      });
      return this;
    },
    batch: function(objs, cb) {
      var checkComplete, db, done, exists_sql, exists_success, finalized, ins, keys, marks, results, that, up, updateProgress, x, _i, _len;
      if (!(objs && objs.length > 0)) return this;
      that = this;
      done = false;
      finalized = false;
      db = this.db;
      results = [];
      checkComplete = function() {
        if (finalized) return;
        if (done && cb && results.length === objs.length) {
          finalized = true;
          that.lambda(cb).call(that, results);
        }
      };
      updateProgress = function(obj) {
        results.push(obj);
        checkComplete();
      };
      ins = "INSERT INTO " + this.name + " (value, timestamp, id) VALUES (?,?,?)";
      up = "UPDATE " + this.name + " SET value = ?, timestamp = ? WHERE id = ?";
      marks = [];
      keys = [];
      for (_i = 0, _len = objs.length; _i < _len; _i++) {
        x = objs[_i];
        if (!x.key) continue;
        marks.push("?");
        keys.push(x.key);
      }
      marks = marks.join(",");
      exists_success = function(res) {
        var ids_hash, row, rows, transaction, transaction_success, _j, _len2;
        rows = res.rows;
        ids_hash = {};
        for (_j = 0, _len2 = rows.length; _j < _len2; _j++) {
          row = rows[_j];
          ids_hash[row.id] = true;
        }
        transaction = function(t) {
          var obj, _fn, _k, _len3;
          _fn = function(obj) {
            var id, sql, success, val;
            id = obj.key || that.uuid();
            success = function(u) {
              obj.key = id;
              updateProgress(obj);
            };
            val = [now(), id];
            sql = obj.key in ids_hash ? up : ins;
            delete obj.key;
            val.unshift(JSON.stringify(obj));
            t.executeSql(sql, val, success, fail);
          };
          for (_k = 0, _len3 = objs.length; _k < _len3; _k++) {
            obj = objs[_k];
            _fn(obj);
          }
        };
        transaction_success = function() {
          done = true;
          checkComplete();
        };
        db.transaction(transaction, transaction_success, fail);
      };
      if (keys.length > 0) {
        exists_sql = ["SELECT id FROM " + this.name + " WHERE id IN (" + marks + ")"].concat(keys);
        db.executeSql(exists_sql, [], exists_success);
      } else {
        exists_success({
          rows: []
        });
      }
      return this;
    },
    get: function(keyOrArray, cb) {
      var is_array, marks, sql, success, that, x;
      if (!keyOrArray) return this;
      that = this;
      is_array = this.isArray(keyOrArray);
      if (is_array) {
        if (!(keyOrArray.length > 0)) return this;
        marks = ((function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = keyOrArray.length; _i < _len; _i++) {
            x = keyOrArray[_i];
            _results.push("?");
          }
          return _results;
        })()).join(",");
        sql = ["SELECT id, value FROM " + this.name + " WHERE id IN (" + marks + ")"].concat(keyOrArray);
      } else {
        sql = ["SELECT id, value FROM " + this.name + " WHERE id = ?"].concat([keyOrArray]);
      }
      success = function(res) {
        var r, row;
        r = (function() {
          var _i, _len, _ref, _results;
          _ref = res.rows;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            row = _ref[_i];
            _results.push((function(row) {
              var o;
              o = JSON.parse(row.value);
              o.key = row.id;
              return o;
            })(row));
          }
          return _results;
        })();
        if (!is_array) r = r[0];
        if (cb) that.lambda(cb).call(that, r);
      };
      this.db.executeSql(sql, [], success, fail);
      return this;
    },
    exists: function(key, cb) {
      var sql, success, that;
      that = this;
      sql = ["SELECT id FROM " + this.name + " WHERE id = ?", key];
      success = function(res) {
        if (cb) that.fn("exists", cb).call(that, res.rows.length > 0);
      };
      this.db.executeSql(sql, [], success, fail);
      return this;
    },
    all: function(callback) {
      var cb, sql, success, that;
      if (!callback) return this;
      that = this;
      sql = "SELECT * FROM " + this.name;
      cb = this.fn(this.name, callback);
      success = function(res) {
        var r, row;
        r = (function() {
          var _i, _len, _ref, _results;
          _ref = res.rows;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            row = _ref[_i];
            _results.push((function(row) {
              var obj;
              obj = JSON.parse(row.value);
              obj.key = row.id;
              return obj;
            })(row));
          }
          return _results;
        })();
        cb.call(that, r);
      };
      this.db.executeSql(sql, [], success, fail);
      return this;
    },
    remove: function(keyOrObj, cb) {
      var key, sql, success, that;
      if (!keyOrObj) return this;
      that = this;
      key = typeof keyOrObj === "string" ? keyOrObj : keyOrObj.key;
      if (!key) return this;
      sql = ["DELETE FROM " + this.name + " WHERE id = ?", key];
      success = function() {
        if (cb) that.lambda(cb).call(that);
      };
      this.db.executeSql(sql, [], success, fail);
      return this;
    },
    nuke: function(cb) {
      var db, sql, success, that;
      that = this;
      db = this.db;
      sql = "DELETE FROM " + this.name;
      success = function() {
        if (cb) that.lambda(cb).call(that);
        db.executeSql("VACUUM");
      };
        this.db.executeSql(sql, [], success, fail);
      return this;
    }
  };

  SQLitePlugin.lawnchair_adapter = sqlite_plugin;

  Lawnchair.adapter("sqlite_plugin", sqlite_plugin);

}).call(this);
