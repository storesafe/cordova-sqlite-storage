// SQLitePlugin.js: originally written in CoffeeScript,
// Copyright (C) 2011 Joe Noon <joenoon@gmail.com>
//
// To regenerate from CoffeeScript:
// coffee -p SQLitePlugin-orig.coffee > SQLitePlugin.js
// (and try to keep the comments by hand)
//
// NOTE: this Javascript version is now leading, however
// SQLitePlugin-orig.coffee is still available for review.
//
// To convert back to CoffeeScript:
// js2coffee SQLitePlugin.js > SQLitePlugin-new.coffee
// (will lose the comments)

if (!window.Cordova) window.Cordova = window.cordova;

(function() {
  var SQLitePlugin, SQLitePluginTransaction, counter, getOptions, root, exec;
  root = this;
  counter = 0;

  exec = function(method, options, success, error) {
    if (root.sqlitePlugin.DEBUG){
      console.log('SQLitePlugin.' + method + '(' + JSON.stringify(options) + ')');
    }
    cordova.exec(success, error, "SQLitePlugin", method, [options]);
  };

  SQLitePlugin = function(dbargs, openSuccess, openError) {
    if (!dbargs || !dbargs['name']) {
      throw new Error("Cannot create a SQLitePlugin instance without a db name");
    }

    this.dbargs = dbargs;
    this.dbname = dbargs.name + ".db";
    dbargs.name = this.dbname;

    this.openSuccess = openSuccess;
    this.openError = openError;
    this.openSuccess || (this.openSuccess = function() {
      console.log("DB opened: " + this.dbname);
    });
    this.openError || (this.openError = function(e) {
      console.log(e.message);
    });

    this.open(this.openSuccess, this.openError);
  };

  SQLitePlugin.prototype.openDBs = {};
  SQLitePlugin.prototype.txQueue = [];
  SQLitePlugin.prototype.features = { isSQLitePlugin: true };

  SQLitePlugin.prototype.executePragmaStatement = function(sql, success, error) {
    if (!sql) throw new Error("Cannot executeSql without a query");
    var mysuccesscb = function(res) {
      success(res.rows);
    };
    exec("backgroundExecuteSql", { query: [sql], path: this.dbname }, mysuccesscb, error);
  };

  // API TBD subect to change:
  SQLitePlugin.prototype._executeSql = function(sql, values, success, error) {
    if (!sql) throw new Error("Cannot executeSql without a query");
    exec("backgroundExecuteSql", { query: [sql].concat(values || []), path: this.dbname }, success, error);
  };

  // API TBD subect to change:
  SQLitePlugin.prototype._executeSqlNow = function(sql, values, success, error) {
    if (!sql) throw new Error("Cannot executeSql without a query");
    exec("executeSql", { query: [sql].concat(values || []), path: this.dbname }, success, error);
  };

  SQLitePlugin.prototype.transaction = function(fn, error, success) {
    var t = new SQLitePluginTransaction(this, fn, error, success);
    this.txQueue.push(t);
    if (this.txQueue.length == 1){
      t.start();
    }
  };
  SQLitePlugin.prototype.startNextTransaction = function(){
    this.txQueue.shift();
    if (this.txQueue[0]){
      this.txQueue[0].start();
    }
  };

  SQLitePlugin.prototype.open = function(success, error) {
    console.log('open db: ' + this.dbname);
	  var opts;
    if (!(this.dbname in this.openDBs)) {
      this.openDBs[this.dbname] = true;
      exec("open", this.dbargs, success, error);
    } else {
    	console.log('found db already open ...');
    	success();
    }
  };
  SQLitePlugin.prototype.close = function(success, error) {
    if (this.dbname in this.openDBs) {
      delete this.openDBs[this.dbname];
      exec("close", { path: this.dbname }, success, error);
    }
  };
  // API TBD ??? - subect to change:
  SQLitePlugin.prototype._closeCrashed = function(success, error) {
	 if(this.dbname in this.openDBs) {
		 delete this.openDBs[this.dbname];
	 }
	 success();
  };
  // API TBD ??? - subect to change:
  SQLitePlugin.prototype._deleteDB =
  SQLitePlugin.prototype._terminate = function(success,error) {
	    console.log('deleting db: ' + this.dbname);
	    if (this.dbname in this.openDBs) {
	        delete this.openDBs[this.dbname];
	        exec("delete", {path: this.dbname},success,error);
	    }
  };

  SQLitePluginTransaction = function(db, fn, error, success) {
    if (typeof fn !== 'function') {
      // This is consistent with the implementation in Chrome -- it
      // throws if you pass anything other than a function. This also
      // prevents us from stalling our txQueue if somebody passes a
      // false value for fn.
      throw new Error("transaction expected a function")
    }
    this.db = db;
    this.fn = fn;
    this.error = error;
    this.success = success;
    this.executes = [];
    this.executeSql('BEGIN', [], null, function(tx, err){ throw new Error("unable to begin transaction: " + err.message) });
  };

  SQLitePluginTransaction.prototype.start = function() {
    try {
      if (!this.fn) {
        return;
      }
      this.fn(this);
      this.fn = null;
      this.run();
    }
    catch (err) {
      // If "fn" throws, we must report the whole transaction as failed.
      this.db.startNextTransaction();
      if (this.error) {
        this.error(err);
      }
    }
  };

  SQLitePluginTransaction.prototype.executeSql = function(sql, values, success, error) {
    this.executes.push({
      query: [sql].concat(values || []),
      success: success,
      error: error
    });
  };

  SQLitePluginTransaction.prototype.handleStatementSuccess = function(handler, response) {
    if (!handler)
      return;
    var payload = {
      rows: { item: function (i) { return response.rows[i] }, length: response.rows.length},
      rowsAffected: response.rowsAffected,
      insertId: response.insertId || null
    };
    handler(this, payload);
  };

  SQLitePluginTransaction.prototype.handleStatementFailure = function(handler, error) {
    if (!handler || handler(this, error)){
      throw error;
    }
  };

  SQLitePluginTransaction.prototype.run = function() {

    var batchExecutes = this.executes,
        waiting = batchExecutes.length,
        txFailure,
        tx = this,
        opts = [];
        this.executes = [];

    // var handlerFor = function (index, didSucceed) {
    var handleFor = function (index, didSucceed, response) {
      try {
        if (didSucceed){
          tx.handleStatementSuccess(batchExecutes[index].success, response);
        } else {
          tx.handleStatementFailure(batchExecutes[index].error, response);
        }
      }
      catch (err) {
        if (!txFailure)
          txFailure = err;
      }
      if (--waiting == 0){
        if (txFailure){
          tx.rollBack(txFailure);
        } else if (tx.executes.length > 0) {
          // new requests have been issued by the callback
          // handlers, so run another batch.
          tx.run();
        } else {
          tx.commit();
        }
      }
    }

    for (var i=0; i<batchExecutes.length; i++) {
      var request = batchExecutes[i];
      opts.push({
        query: request.query,
        path: this.db.dbname
      });
    }

    var error = function (resultsAndError) {
        var results = resultsAndError.results;
        var nativeError = resultsAndError.error;
        var j = 0;

        // call the success handlers for statements that succeeded
        for (; j < results.length; ++j) {
          handleFor(j, true, results[j]);
        }

        if (j < batchExecutes.length) {
          // only pass along the additional error info to the statement that
          // caused the failure (the only one the error info applies to);
          var error = new Error('Request failed: ' + opts[j].query);
          error.code = nativeError.code;
          // the following properties are only defined if the plugin
          // was compiled with INCLUDE_SQLITE_ERROR_INFO
          error.sqliteCode = nativeError.sqliteCode;
          error.sqliteExtendedCode = nativeError.sqliteExtendedCode;
          error.sqliteMessage = nativeError.sqliteMessage;

          handleFor(j, false, error);
          j++;
        }

        // call the error handler for the remaining statements
        // (Note: this doesn't adhere to the Web SQL spec...)
        for (; j < batchExecutes.length; ++j) {
          handleFor(j, false, new Error('Request failed: ' + opts[j].query));
        }
    };

    var success = function (results) {
      if (results.length != opts.length) {
        // Shouldn't happen, but who knows...
        error(results);
      }
      else {
        for (var j = 0; j < results.length; ++j) {
          handleFor(j, true, results[j]);
        }
      }
    };

    exec("backgroundExecuteSqlBatch", {executes: opts}, success, error);
  };

  SQLitePluginTransaction.prototype.rollBack = function(txFailure) {
    if (this.finalized)
      return;
    this.finalized = true;
    tx = this;
    function succeeded(){
      tx.db.startNextTransaction();
      if (tx.error){
        tx.error(txFailure)
      }
    }
    function failed(tx, err){
      tx.db.startNextTransaction();
      if (tx.error){
        tx.error(new Error("error while trying to roll back: " + err.message))
      }
    }
    this.executeSql('ROLLBACK', [], succeeded, failed);
    this.run();
  };

  SQLitePluginTransaction.prototype.commit = function() {
    if (this.finalized)
      return;
    this.finalized = true;
    tx = this;
    function succeeded(){
      tx.db.startNextTransaction();
      if (tx.success){
        tx.success()
      }
    }
    function failed(tx, err){
      tx.db.startNextTransaction();
      if (tx.error){
        tx.error(new Error("error while trying to commit: " + err.message))
      }
    }
    this.executeSql('COMMIT', [], succeeded, failed);
    this.run();
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
    },
    deleteDb: function(databaseName, success, error) {
        exec("delete", { path: databaseName }, success, error);
    }
  };

  root.sqlitePlugin = {
    openDatabase: SQLiteFactory.opendb,
    deleteDatabase: SQLiteFactory.deleteDb
  };
})();
