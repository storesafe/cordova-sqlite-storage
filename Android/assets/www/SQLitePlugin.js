(function() {
  var SQLiteFactory, SQLitePlugin, SQLitePluginCallback, SQLitePluginTransaction, SQLitePluginTransactionCB, get_unique_id, pcb, root, transaction_callback_queue, transaction_queue;
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
  SQLitePlugin.prototype.openDBs = {};
  SQLitePlugin.prototype.transaction = function(fn, error, success) {
    var t;
    t = new SQLitePluginTransaction(this.dbname);
    fn(t);
    t.complete(success, error);
  };
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
  transaction_queue = [];
  transaction_callback_queue = {};
  SQLitePluginTransaction = function(dbname) {
    this.dbname = dbname;
    this.executes = [];
    this.trans_id = get_unique_id();
    this.__completed = false;
    this.__submitted = false;
    this.optimization_no_nested_callbacks = false;
    console.log("SQLitePluginTransaction - this.trans_id:" + this.trans_id);
    transaction_queue[this.trans_id] = [];
    transaction_callback_queue[this.trans_id] = new Object();
  };
  SQLitePluginTransactionCB = {};
  SQLitePluginTransactionCB.queryCompleteCallback = function(transId, queryId, result) {
    var query, x;
    console.log("SQLitePluginTransaction.queryCompleteCallback");
    query = null;
    for (x in transaction_queue[transId]) {
      if (transaction_queue[transId][x]["query_id"] === queryId) {
        query = transaction_queue[transId][x];
        if (transaction_queue[transId].length === 1) {
          transaction_queue[transId] = [];
        } else {
          transaction_queue[transId].splice(x, 1);
        }
        break;
      }
    }
    if (query && query["callback"]) return query["callback"](result);
  };
  SQLitePluginTransactionCB.queryErrorCallback = function(transId, queryId, result) {
    var query, x;
    query = null;
    for (x in transaction_queue[transId]) {
      if (transaction_queue[transId][x]["query_id"] === queryId) {
        query = transaction_queue[transId][x];
        if (transaction_queue[transId].length === 1) {
          transaction_queue[transId] = [];
        } else {
          transaction_queue[transId].splice(x, 1);
        }
        break;
      }
    }
    if (query && query["err_callback"]) return query["err_callback"](result);
  };
  SQLitePluginTransactionCB.txCompleteCallback = function(transId) {
    if (typeof transId !== "undefined") {
      if (transId && transaction_callback_queue[transId] && transaction_callback_queue[transId]["success"]) {
        return transaction_callback_queue[transId]["success"]();
      }
    } else {
      return console.log("SQLitePluginTransaction.txCompleteCallback---transId = NULL");
    }
  };
  SQLitePluginTransactionCB.txErrorCallback = function(transId, error) {
    if (typeof transId !== "undefined") {
      console.log("SQLitePluginTransaction.txErrorCallback---transId:" + transId);
      if (transId && transaction_callback_queue[transId]["error"]) {
        transaction_callback_queue[transId]["error"](error);
      }
      delete transaction_queue[transId];
      return delete transaction_callback_queue[transId];
    } else {
      return console.log("SQLitePluginTransaction.txErrorCallback---transId = NULL");
    }
  };
  SQLitePluginTransaction.prototype.add_to_transaction = function(trans_id, query, params, callback, err_callback) {
    var new_query;
    new_query = new Object();
    new_query["trans_id"] = trans_id;
    if (callback || !this.optimization_no_nested_callbacks) {
      new_query["query_id"] = get_unique_id();
    } else {
      if (this.optimization_no_nested_callbacks) new_query["query_id"] = "";
    }
    new_query["query"] = query;
    if (params) {
      new_query["params"] = params;
    } else {
      new_query["params"] = [];
    }
    new_query["callback"] = callback;
    new_query["err_callback"] = err_callback;
    if (!transaction_queue[trans_id]) transaction_queue[trans_id] = [];
    transaction_queue[trans_id].push(new_query);
  };
  SQLitePluginTransaction.prototype.executeSql = function(sql, values, success, error) {
    var errorcb, successcb, txself;
    console.log("SQLitePluginTransaction.prototype.executeSql");
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
  SQLitePluginTransaction.prototype.complete = function(success, error) {
    var errorcb, successcb, txself;
    console.log("SQLitePluginTransaction.prototype.complete");
    if (this.__completed) throw new Error("Transaction already run");
    if (this.__submitted) throw new Error("Transaction already submitted");
    this.__submitted = true;
    txself = this;
    successcb = function() {
      if (transaction_queue[txself.trans_id].length > 0 && !txself.optimization_no_nested_callbacks) {
        txself.__submitted = false;
        return txself.complete(success, error);
      } else {
        this.__completed = true;
        if (success) return success(txself);
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
    transaction_callback_queue[this.trans_id]["success"] = successcb;
    transaction_callback_queue[this.trans_id]["error"] = errorcb;
    cordova.exec(null, null, "SQLitePlugin", "executeSqlBatch", [this.dbname, transaction_queue[this.trans_id]]);
  };
  SQLiteFactory = {
    opendb: function() {
      var errorcb, first, okcb, openargs;
      if (arguments.length < 1) return null;
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
          if (arguments.length > 5) errorcb = arguments[5];
        }
      } else {
        openargs = first;
        if (arguments.length >= 2) {
          okcb = arguments[1];
          if (arguments.length > 2) errorcb = arguments[2];
        }
      }
      return new SQLitePlugin(openargs, okcb, errorcb);
    }
  };
  root.SQLitePluginCallback = SQLitePluginCallback;
  root.SQLitePluginTransactionCB = SQLitePluginTransactionCB;
  return root.sqlitePlugin = {
    openDatabase: SQLiteFactory.opendb
  };
})();
