(function() {
  var SQLiteFactory, SQLitePlugin, SQLitePluginCallback, SQLitePluginTransaction, pcb, root;

  root = this;

  SQLitePlugin = function(openargs, openSuccess, openError) {
    var dbname;
    console.log("SQLitePlugin openargs: " + (JSON.stringify(openargs)));
    if (!(openargs && openargs['name'])) {
      throw new Error("Cannot create a SQLitePlugin instance without a db name");
    }
    dbname = openargs.name;
    this.openargs = openargs;
    this.dbname = dbname;
    this.openSuccess = openSuccess;
    this.openError = openError;
    this.openSuccess || (this.openSuccess = function() {
      console.log("DB opened: " + dbname);
    });
    this.openError || (this.openError = function(e) {
      console.log(e.message);
    });
    this.bg = !openargs.bgType ? (navigator.userAgent.match(/iPad/i)) || (navigator.userAgent.match(/iPhone/i)) : openargs.bgType === 1;
    this.open(this.openSuccess, this.openError);
  };

  SQLitePlugin.prototype.databaseFeatures = {
    isSQLitePluginDatabase: true
  };

  SQLitePlugin.prototype.openDBs = {};

  SQLitePlugin.prototype.txQ = [];

  SQLitePlugin.prototype.addTransaction = function(t) {
    this.txQ.push(t);
    if (this.txQ.length === 1) {
      t.start();
    }
  };

  SQLitePlugin.prototype.transaction = function(fn, error, success) {
    this.addTransaction(new SQLitePluginTransaction(this, fn, error, success, true));
  };

  SQLitePlugin.prototype.startNextTransaction = function() {
    this.txQ.shift();
    if (this.txQ[0]) {
      this.txQ[0].start();
    }
  };

  SQLitePlugin.prototype.open = function(success, error) {
    if (!(this.dbname in this.openDBs)) {
      this.openDBs[this.dbname] = true;
      cordova.exec(success, error, "SQLitePlugin", "open", [this.openargs]);
    }
  };

  SQLitePlugin.prototype.close = function(success, error) {
    if (this.dbname in this.openDBs) {
      delete this.openDBs[this.dbname];
      cordova.exec(null, null, "SQLitePlugin", "close", [
        {
          path: this.dbname
        }
      ]);
    }
  };

  SQLitePlugin.prototype.executeSql = function(statement, params, success, error) {
    var myerror, myfn, mysuccess;
    mysuccess = function(t, r) {
      if (!!success) {
        return success(r);
      }
    };
    myerror = function(t, e) {
      if (!!error) {
        return error(e);
      }
    };
    myfn = function(tx) {
      tx.executeSql(statement, params, mysuccess, myerror);
    };
    this.addTransaction(new SQLitePluginTransaction(this, myfn, myerror, mysuccess, false));
  };

  pcb = function() {
    return 1;
  };

  /*
  DEPRECATED AND WILL BE REMOVED:
  */


  SQLitePlugin.prototype.executePragmaStatement = function(statement, success, error) {
    console.log("SQLitePlugin::executePragmaStatement");
    pcb = success;
    cordova.exec((function() {
      return 1;
    }), error, "SQLitePlugin", "executePragmaStatement", [this.dbname, statement]);
  };

  /*
  FUTURE TBD GONE: Required for db.executePragmStatement() callback ONLY:
  */


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

  /*
  Transaction batching object:
  */


  SQLitePluginTransaction = function(db, fn, error, success, txlock) {
    if (typeof fn !== "function") {
      /*
      This is consistent with the implementation in Chrome -- it
      throws if you pass anything other than a function. This also
      prevents us from stalling our txQueue if somebody passes a
      false value for fn.
      */

      throw new Error("transaction expected a function");
    }
    this.db = db;
    this.fn = fn;
    this.error = error;
    this.success = success;
    this.txlock = txlock;
    this.executes = [];
    if (txlock) {
      this.executeSql("BEGIN", [], null, function(tx, err) {
        throw new Error("unable to begin transaction: " + err.message);
      });
    }
  };

  SQLitePluginTransaction.prototype.start = function() {
    var err;
    try {
      if (!this.fn) {
        return;
      }
      this.fn(this);
      this.fn = null;
      this.run();
    } catch (_error) {
      err = _error;
      /*
      If "fn" throws, we must report the whole transaction as failed.
      */

      this.db.startNextTransaction();
      if (this.error) {
        this.error(err);
      }
    }
  };

  SQLitePluginTransaction.prototype.executeSql = function(sql, values, success, error) {
    var qid;
    qid = this.executes.length;
    this.executes.push({
      success: success,
      error: error,
      qid: qid,
      sql: sql,
      params: values || []
    });
  };

  SQLitePluginTransaction.prototype.handleStatementSuccess = function(handler, response) {
    var payload, rows;
    if (!handler) {
      return;
    }
    rows = response.rows || [];
    payload = {
      rows: {
        item: function(i) {
          return rows[i];
        },
        length: rows.length
      },
      rowsAffected: response.rowsAffected || 0,
      insertId: response.insertId || void 0
    };
    handler(this, payload);
  };

  SQLitePluginTransaction.prototype.handleStatementFailure = function(handler, response) {
    if (!handler) {
      throw new Error("a statement with no error handler failed: " + response.message);
    }
    if (handler(this, response)) {
      throw new Error("a statement error callback did not return false");
    }
  };

  SQLitePluginTransaction.prototype.run = function() {
    var batchExecutes, handlerFor, i, mycb, mycbmap, mycommand, qid, request, tropts, tx, txFailure, waiting;
    txFailure = null;
    tropts = [];
    batchExecutes = this.executes;
    waiting = batchExecutes.length;
    this.executes = [];
    tx = this;
    handlerFor = function(index, didSucceed) {
      return function(response) {
        var err;
        try {
          if (didSucceed) {
            tx.handleStatementSuccess(batchExecutes[index].success, response);
          } else {
            tx.handleStatementFailure(batchExecutes[index].error, response);
          }
        } catch (_error) {
          err = _error;
          if (!txFailure) {
            txFailure = err;
          }
        }
        if (--waiting === 0) {
          if (txFailure) {
            tx.abort(txFailure);
          } else if (tx.executes.length > 0) {
            /*
            new requests have been issued by the callback
            handlers, so run another batch.
            */

            tx.run();
          } else {
            tx.finish();
          }
        }
      };
    };
    i = 0;
    mycbmap = {};
    while (i < batchExecutes.length) {
      request = batchExecutes[i];
      qid = request.qid;
      mycbmap[qid] = {
        success: handlerFor(i, true),
        error: handlerFor(i, false)
      };
      tropts.push({
        qid: qid,
        query: [request.sql].concat(request.params),
        sql: request.sql,
        params: request.params
      });
      i++;
    }
    mycb = function(result) {
      var q, r, res, type, _i, _len;
      for (_i = 0, _len = result.length; _i < _len; _i++) {
        r = result[_i];
        type = r.type;
        qid = r.qid;
        res = r.result;
        q = mycbmap[qid];
        if (q) {
          if (q[type]) {
            q[type](res);
          }
        }
      }
    };
    mycommand = this.db.bg ? "backgroundExecuteSqlBatch" : "executeSqlBatch";
    cordova.exec(mycb, null, "SQLitePlugin", mycommand, [
      {
        dbargs: {
          dbname: this.db.dbname
        },
        executes: tropts
      }
    ]);
  };

  SQLitePluginTransaction.prototype.abort = function(txFailure) {
    var failed, succeeded, tx;
    if (this.finalized) {
      return;
    }
    tx = this;
    succeeded = function(tx) {
      tx.db.startNextTransaction();
      if (tx.error) {
        tx.error(txFailure);
      }
    };
    failed = function(tx, err) {
      tx.db.startNextTransaction();
      if (tx.error) {
        tx.error(new Error("error while trying to roll back: " + err.message));
      }
    };
    this.finalized = true;
    if (this.txlock) {
      this.executeSql("ROLLBACK", [], succeeded, failed);
      this.run();
    } else {
      succeeded(tx);
    }
  };

  SQLitePluginTransaction.prototype.finish = function() {
    var failed, succeeded, tx;
    if (this.finalized) {
      return;
    }
    tx = this;
    succeeded = function(tx) {
      tx.db.startNextTransaction();
      if (tx.success) {
        tx.success();
      }
    };
    failed = function(tx, err) {
      tx.db.startNextTransaction();
      if (tx.error) {
        tx.error(new Error("error while trying to commit: " + err.message));
      }
    };
    this.finalized = true;
    if (this.txlock) {
      this.executeSql("COMMIT", [], succeeded, failed);
      this.run();
    } else {
      succeeded(tx);
    }
  };

  SQLiteFactory = {
    /*
    NOTE: this function should NOT be translated from Javascript
    back to CoffeeScript by js2coffee.
    If this function is edited in Javascript then someone will
    have to translate it back to CoffeeScript by hand.
    */

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
    },
    deleteDb: function(databaseName, success, error) {
      return cordova.exec(success, error, "SQLitePlugin", "delete", [
        {
          path: databaseName
        }
      ]);
    }
  };

  /*
  FUTURE TBD GONE: Required for db.executePragmStatement() callback ONLY:
  */


  root.SQLitePluginCallback = SQLitePluginCallback;

  root.sqlitePlugin = {
    sqliteFeatures: {
      isSQLitePlugin: true
    },
    openDatabase: SQLiteFactory.opendb,
    deleteDatabase: SQLiteFactory.deleteDb
  };

}).call(this);
