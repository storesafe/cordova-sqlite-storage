(function() {
  var callbacks, cbref, counter, getOptions, root;

  root = this;

  callbacks = {};

  counter = 0;

  cbref = function(hash) {
    var f;
    f = "cb" + (counter += 1);
    callbacks[f] = hash;
    return f;
  };

  getOptions = function(opts, success, error) {
    var cb, has_cbs;
    cb = {};
    has_cbs = false;
    if (typeof success === "function") {
      has_cbs = true;
      cb.success = success;
    }
    if (typeof error === "function") {
      has_cbs = true;
      cb.error = error;
    }
    if (has_cbs) opts.callback = cbref(cb);
    return opts;
  };

  root.SQLitePlugin = (function() {

    SQLitePlugin.prototype.openDBs = {};

    function SQLitePlugin(dbPath, openSuccess, openError) {
      this.dbPath = dbPath;
      this.openSuccess = openSuccess;
      this.openError = openError;
      if (!dbPath) {
        throw new Error("Cannot create a SQLitePlugin instance without a dbPath");
      }
      this.openSuccess || (this.openSuccess = function() {
        console.log("DB opened: " + dbPath);
      });
      this.openError || (this.openError = function(e) {
        console.log(e.message);
      });
      this.open(this.openSuccess, this.openError);
    }

    SQLitePlugin.handleCallback = function(ref, type, obj) {
      var _ref;
      if ((_ref = callbacks[ref]) != null) {
        if (typeof _ref[type] === "function") _ref[type](obj);
      }
      callbacks[ref] = null;
      delete callbacks[ref];
    };

    SQLitePlugin.prototype.executeSql = function(sql, values, success, error) {
      var opts;
      if (!sql) throw new Error("Cannot executeSql without a query");
      opts = getOptions({
        query: [sql].concat(values || []),
        path: this.dbPath
      }, success, error);
      PhoneGap.exec("SQLitePlugin.backgroundExecuteSql", opts);
    };

    SQLitePlugin.prototype.transaction = function(fn, error, success) {
      var t;
      t = new root.SQLitePluginTransaction(this.dbPath);
      fn(t);
      return t.complete(success, error);
    };

    SQLitePlugin.prototype.open = function(success, error) {
      var opts;
      if (!(this.dbPath in this.openDBs)) {
        this.openDBs[this.dbPath] = true;
        opts = getOptions({
          path: this.dbPath
        }, success, error);
        PhoneGap.exec("SQLitePlugin.open", opts);
      }
    };

    SQLitePlugin.prototype.close = function(success, error) {
      var opts;
      if (this.dbPath in this.openDBs) {
        delete this.openDBs[this.dbPath];
        opts = getOptions({
          path: this.dbPath
        }, success, error);
        PhoneGap.exec("SQLitePlugin.close", opts);
      }
    };

    return SQLitePlugin;

  })();

  root.SQLitePluginTransaction = (function() {

    function SQLitePluginTransaction(dbPath) {
      this.dbPath = dbPath;
      this.executes = [];
    }

    SQLitePluginTransaction.prototype.executeSql = function(sql, values, success, error) {
      var errorcb, successcb, txself;
      txself = this;
      successcb = null;
      if (success) {
        successcb = function(execres) {
          var res, saveres;
          saveres = execres;
          res = {
            rows: {
              item: function(i) {
                return saveres.rows[i];
              },
              length: saveres.rows.length
            },
            rowsAffected: saveres.rowsAffected,
            insertId: saveres.insertId || null
          };
          return success(txself, res);
        };
      }
      errorcb = null;
      if (error) {
        errorcb = function(res) {
          return error(txself, res);
        };
      }
      this.executes.push(getOptions({
        query: [sql].concat(values || []),
        path: this.dbPath
      }, successcb, errorcb));
    };

    SQLitePluginTransaction.prototype.complete = function(success, error) {
      var begin_opts, commit_opts, errorcb, executes, opts, successcb, txself;
      if (this.__completed) throw new Error("Transaction already run");
      this.__completed = true;
      txself = this;
      successcb = function(res) {
        return success(txself, res);
      };
      errorcb = function(res) {
        return error(txself, res);
      };
      begin_opts = getOptions({
        query: ["BEGIN;"],
        path: this.dbPath
      });
      commit_opts = getOptions({
        query: ["COMMIT;"],
        path: this.dbPath
      }, successcb, errorcb);
      executes = [begin_opts].concat(this.executes).concat([commit_opts]);
      opts = {
        executes: executes
      };
      PhoneGap.exec("SQLitePlugin.backgroundExecuteSqlBatch", opts);
      this.executes = [];
    };

    return SQLitePluginTransaction;

  })();
  root.sqlitePlugin = {
    openDatabase: function(dbPath, version, displayName, estimatedSize, creationCallback, errorCallback) {
      if (version == null) version = null;
      if (displayName == null) displayName = null;
      if (estimatedSize == null) estimatedSize = 0;
      if (creationCallback == null) creationCallback = null;
      if (errorCallback == null) errorCallback = null;
      return new SQLitePlugin(dbPath, creationCallback, errorCallback);
    }
  };
}).call(this);