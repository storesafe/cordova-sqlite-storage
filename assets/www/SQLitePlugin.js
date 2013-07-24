(function() {
  var SQLiteBatchTransaction, SQLiteFactory, SQLitePlugin, SQLitePluginCallback, SQLiteQueryCB, get_unique_id, pcb, queryCBQ, queryQ, root;
  root = this;
  SQLitePlugin = function(openargs, openSuccess, openError) {
    var dbname;
    console.log("SQLitePlugin");
    if (!(openargs && openargs['name'])) {
      throw new Error("Cannot create a SQLitePlugin instance without a db name");
    }
    dbname = openargs.name;
    this.openargs = openargs;
    this.dbname = dbname;
    this.openSuccess = openSuccess;
    this.openError = openError;
    this.openSuccess || (this.openSuccess = function() {
      return console.log("DB opened: " + dbname);
    });
    this.openError || (this.openError = function(e) {
      return console.log(e.message);
    });
    this.open(this.openSuccess, this.openError);
  };
  SQLitePlugin.prototype.databaseFeatures = {
    isSQLitePluginDatabase: true
  };
  SQLitePlugin.prototype.openDBs = {};
  SQLitePlugin.prototype.batchTransaction = function(fn, error, success) {
    var t;
    t = new SQLiteBatchTransaction(this.dbname);
    fn(t);
    t.complete(success, error);
  };
  SQLitePlugin.prototype.transaction = SQLitePlugin.prototype.batchTransaction;
  SQLitePlugin.prototype.open = function(success, error) {
    console.log("SQLitePlugin.prototype.open");
    if (!(this.dbname in this.openDBs)) {
      this.openDBs[this.dbname] = true;
      cordova.exec(success, error, "SQLitePlugin", "open", [this.openargs]);
    }
  };
  SQLitePlugin.prototype.close = function(success, error) {
    console.log("SQLitePlugin.prototype.close");
    if (this.dbname in this.openDBs) {
      delete this.openDBs[this.dbname];
      cordova.exec(null, null, "SQLitePlugin", "close", [this.dbname]);
    }
  };
  pcb = function() {
    return 1;
  };

  // XXX TBD fix callback(s):
  SQLitePlugin.prototype.executeSql = function(statement, params, success, error) {
    console.log("SQLitePlugin::executeSql[Statement]");
    pcb = success;
    cordova.exec((function() {
      return 1;
    }), error, "SQLitePlugin", "executePragmaStatement", [this.dbname, statement, params]);
  };
  // DEPRECATED AND WILL BE REMOVED:
  SQLitePlugin.prototype.executePragmaStatement = function(statement, success, error) {
    console.log("SQLitePlugin::executePragmaStatement");
    pcb = success;
    cordova.exec((function() {
      return 1;
    }), error, "SQLitePlugin", "executePragmaStatement", [this.dbname, statement]);
  };

  SQLitePluginCallback = {
    p1: function(id, result) {
      var mycb;
      console.log("PRAGMA CB");
      mycb = pcb;
      pcb = function() {
        return 1;
      };
      mycb(result);
    }
  };
  get_unique_id = function() {
    var id, id2;
    id = new Date().getTime();
    id2 = new Date().getTime();
    while (id === id2) {
      id2 = new Date().getTime();
    }
    return id2 + "000";
  };
  queryQ = [];
  queryCBQ = {};
  SQLiteBatchTransaction = function(dbname) {
    this.dbname = dbname;
    this.executes = [];
    this.trans_id = get_unique_id();
    this.__completed = false;
    this.__submitted = false;
    this.optimization_no_nested_callbacks = false;
    console.log("SQLiteBatchTransaction - this.trans_id:" + this.trans_id);
    queryQ[this.trans_id] = [];
    queryCBQ[this.trans_id] = new Object();
  };
  SQLiteQueryCB = {};
  SQLiteQueryCB.queryCompleteCallback = function(transId, queryId, result) {
    var query, x;
    console.log("SQLiteBatchTransaction.queryCompleteCallback");
    query = null;
    for (x in queryQ[transId]) {
      if (queryQ[transId][x]["query_id"] === queryId) {
        query = queryQ[transId][x];
        if (queryQ[transId].length === 1) {
          queryQ[transId] = [];
        } else {
          queryQ[transId].splice(x, 1);
        }
        break;
      }
    }
    if (query && query["callback"]) {
      query["callback"](result);
    }
  };
  SQLiteQueryCB.queryErrorCallback = function(transId, queryId, result) {
    var query, x;
    query = null;
    for (x in queryQ[transId]) {
      if (queryQ[transId][x]["query_id"] === queryId) {
        query = queryQ[transId][x];
        if (queryQ[transId].length === 1) {
          queryQ[transId] = [];
        } else {
          queryQ[transId].splice(x, 1);
        }
        break;
      }
    }
    if (query && query["err_callback"]) {
      query["err_callback"](result);
    }
  };
  SQLiteQueryCB.txCompleteCallback = function(transId) {
    if (typeof transId !== "undefined") {
      if (transId && queryCBQ[transId] && queryCBQ[transId]["success"]) {
        queryCBQ[transId]["success"]();
      }
    } else {
      console.log("SQLiteBatchTransaction.txCompleteCallback---transId = NULL");
    }
  };
  SQLiteQueryCB.txErrorCallback = function(transId, error) {
    if (typeof transId !== "undefined") {
      console.log("SQLiteBatchTransaction.txErrorCallback---transId:" + transId);
      if (transId && queryCBQ[transId]["error"]) {
        queryCBQ[transId]["error"](error);
      }
      delete queryQ[transId];
      delete queryCBQ[transId];
    } else {
      console.log("SQLiteBatchTransaction.txErrorCallback---transId = NULL");
    }
  };
  SQLiteBatchTransaction.prototype.add_to_transaction = function(trans_id, query, params, callback, err_callback) {
    var new_query;
    new_query = new Object();
    new_query["trans_id"] = trans_id;
    if (callback || !this.optimization_no_nested_callbacks) {
      new_query["query_id"] = get_unique_id();
    } else {
      if (this.optimization_no_nested_callbacks) {
        new_query["query_id"] = "";
      }
    }
    new_query["query"] = query;
    if (params) {
      new_query["params"] = params;
    } else {
      new_query["params"] = [];
    }
    new_query["callback"] = callback;
    new_query["err_callback"] = err_callback;
    if (!queryQ[trans_id]) {
      queryQ[trans_id] = [];
    }
    queryQ[trans_id].push(new_query);
  };
  SQLiteBatchTransaction.prototype.executeSql = function(sql, values, success, error) {
    var errorcb, successcb, txself;
    console.log("SQLiteBatchTransaction.prototype.executeSql");
    errorcb = void 0;
    successcb = void 0;
    txself = void 0;
    txself = this;
    successcb = null;
    if (success) {
      console.log("success not null:" + sql);
      successcb = function(execres) {
        var res, saveres;
        console.log("executeSql callback:" + JSON.stringify(execres));
        res = void 0;
        saveres = void 0;
        saveres = execres;
        res = {
          rows: {
            item: function(i) {
              return saveres[i];
            },
            length: saveres.length
          },
          rowsAffected: saveres.rowsAffected,
          insertId: saveres.insertId || null
        };
        return success(txself, res);
      };
    } else {
      console.log("success NULL:" + sql);
    }
    errorcb = null;
    if (error) {
      errorcb = function(res) {
        return error(txself, res);
      };
    }
    console.log("executeSql - add_to_transaction" + sql);
    this.add_to_transaction(this.trans_id, sql, values, successcb, errorcb);
  };
  SQLiteBatchTransaction.prototype.complete = function(success, error) {
    var errorcb, successcb, txself;
    console.log("SQLiteBatchTransaction.prototype.complete");
    if (this.__completed) {
      throw new Error("Transaction already run");
    }
    if (this.__submitted) {
      throw new Error("Transaction already submitted");
    }
    this.__submitted = true;
    txself = this;
    successcb = function() {
      if (queryQ[txself.trans_id].length > 0 && !txself.optimization_no_nested_callbacks) {
        txself.__submitted = false;
        return txself.complete(success, error);
      } else {
        this.__completed = true;
        if (success) {
          return success(txself);
        }
      }
    };
    errorcb = function(res) {
      return null;
    };
    if (error) {
      errorcb = function(res) {
        return error(txself, res);
      };
    }
    queryCBQ[this.trans_id]["success"] = successcb;
    queryCBQ[this.trans_id]["error"] = errorcb;
    cordova.exec(null, null, "SQLitePlugin", "executeBatchTransaction", [this.dbname, queryQ[this.trans_id]]);
  };
  SQLiteFactory = {
    // NOTE: this function should NOT be translated from Javascript
    // back to CoffeeScript by js2coffee.
    // If this function is edited in Javascript then someone will
    // have to translate it back to CoffeeScript by hand.
    opendb: function() {
      var errorcb, first, okcb, openargs;
      if (arguments.length < 1) {
        return null;
      }
      first = arguments[0];
      openargs = null;
      okcb = null;
      errorcb = null;
      if (first.constructor === String) {
        openargs = {
          name: first
        };
        if (arguments.length >= 5) {
          okcb = arguments[4];
          if (arguments.length > 5) {
            errorcb = arguments[5];
          }
        }
      } else {
        openargs = first;
        if (arguments.length >= 2) {
          okcb = arguments[1];
          if (arguments.length > 2) {
            errorcb = arguments[2];
          }
        }
      }
      return new SQLitePlugin(openargs, okcb, errorcb);
    }
  };
  root.SQLitePluginCallback = SQLitePluginCallback;
  root.SQLiteQueryCB = SQLiteQueryCB;
  return root.sqlitePlugin = {
    sqliteFeatures: {
      isSQLitePlugin: true
    },
    openDatabase: SQLiteFactory.opendb
  };
})();
