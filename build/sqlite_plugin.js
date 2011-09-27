(function() {
  var callbacks, counter, fnref, getOptions, root;
  root = this;
  callbacks = {};
  counter = 0;
  fnref = function(fn) {
    var f;
    f = "cb" + (counter += 1);
    callbacks[f] = fn;
    return f;
  };
  getOptions = function(opts, success, error) {
    if (typeof success === "function") {
      opts.successCallback = fnref(success);
    }
    if (typeof error === "function") {
      opts.errorCallback = fnref(error);
    }
    return opts;
  };
  root.PGSQLitePlugin = (function() {
    PGSQLitePlugin.prototype.openDBs = {};
    function PGSQLitePlugin(dbPath, openSuccess, openError) {
      this.dbPath = dbPath;
      this.openSuccess = openSuccess;
      this.openError = openError;
      if (!dbPath) {
        throw new Error("Cannot create a PGSQLitePlugin instance without a dbPath");
      }
      this.openSuccess || (this.openSuccess = function() {
        console.log("DB opened: " + dbPath);
      });
      this.openError || (this.openError = function(e) {
        console.log(e.message);
      });
      this.open(this.openSuccess, this.openError);
    }
    PGSQLitePlugin.handleCallback = function() {
      var args, f, _ref;
      args = Array.prototype.slice.call(arguments);
      f = args.shift();
      if ((_ref = callbacks[f]) != null) {
        _ref.apply(null, args);
      }
      callbacks[f] = null;
      delete callbacks[f];
    };
    PGSQLitePlugin.prototype.executeSql = function(sql, success, error) {
      var opts;
      if (!sql) {
        throw new Error("Cannot executeSql without a query");
      }
      opts = getOptions({
        query: [].concat(sql || []),
        path: this.dbPath
      }, success, error);
      PhoneGap.exec("PGSQLitePlugin.backgroundExecuteSql", opts);
    };
    PGSQLitePlugin.prototype.transaction = function(fn, success, error) {
      var t;
      t = new root.PGSQLitePluginTransaction(this.dbPath);
      fn(t);
      return t.complete(success, error);
    };
    PGSQLitePlugin.prototype.open = function(success, error) {
      var opts;
      if (!(this.dbPath in this.openDBs)) {
        this.openDBs[this.dbPath] = true;
        opts = getOptions({
          path: this.dbPath
        }, success, error);
        PhoneGap.exec("PGSQLitePlugin.open", opts);
      }
    };
    PGSQLitePlugin.prototype.close = function(success, error) {
      var opts;
      if (this.dbPath in this.openDBs) {
        delete this.openDBs[this.dbPath];
        opts = getOptions({
          path: this.dbPath
        }, success, error);
        PhoneGap.exec("PGSQLitePlugin.close", opts);
      }
    };
    return PGSQLitePlugin;
  })();
  root.PGSQLitePluginTransaction = (function() {
    function PGSQLitePluginTransaction(dbPath) {
      this.dbPath = dbPath;
      this.executes = [];
    }
    PGSQLitePluginTransaction.prototype.executeSql = function(sql, success, error) {
      this.executes.push(getOptions({
        query: [].concat(sql || []),
        path: this.dbPath
      }, success, error));
    };
    PGSQLitePluginTransaction.prototype.complete = function(success, error) {
      var begin_opts, commit_opts, executes, opts;
      if (this.__completed) {
        throw new Error("Transaction already run");
      }
      this.__completed = true;
      begin_opts = getOptions({
        query: ["BEGIN;"],
        path: this.dbPath
      });
      commit_opts = getOptions({
        query: ["COMMIT;"],
        path: this.dbPath
      }, success, error);
      executes = [begin_opts].concat(this.executes).concat([commit_opts]);
      opts = {
        executes: executes
      };
      PhoneGap.exec("PGSQLitePlugin.backgroundExecuteSqlBatch", opts);
      this.executes = [];
    };
    return PGSQLitePluginTransaction;
  })();
}).call(this);
