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
  var SQLitePlugin, SQLitePluginTransaction, callbacks, cbref, counter, getOptions, root, exec;
  root = this;
  callbacks = {};
  counter = 0;
  cbref = function(hash) {
    var f;
    f = "cb" + (counter += 1);
    callbacks[f] = hash;
    return f;
  };

  exec = function(s, o){
    if (root.sqlitePlugin.DEBUG){
      console.log(s + ": " + JSON.stringify(o));
    }
    Cordova.exec(s, o);
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

  SQLitePlugin = function(dbargs, openSuccess, openError) {
    if (!dbargs || !dbargs['name']) {
      throw new Error("Cannot create a SQLitePlugin instance without a db name");
    }

    this.dbargs = dbargs;
    this.dbname = dbargs.name;

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
  SQLitePlugin.handleCallback = function(ref, type, obj) {
    if (root.sqlitePlugin.DEBUG){
      console.log("handle callback: " + ref + ", " + type + ", " + JSON.stringify(obj));
    }
    var _ref;
    if ((_ref = callbacks[ref]) != null) {
      if (typeof _ref[type] === "function") _ref[type](obj);
    }
    callbacks[ref] = null;
    delete callbacks[ref];
  };
  SQLitePlugin.prototype.executePragmaStatement = function(sql, success, error) {
    var opts;
    if (!sql) throw new Error("Cannot executeSql without a query");
    var cbsave = success;
    var mysuccesscb = function(res) {
      cbsave(res.rows);
    };
    opts = getOptions({
      query: [sql],
      path: this.dbname
    }, mysuccesscb, error);
    exec("SQLitePlugin.backgroundExecuteSql", opts);
  };
  SQLitePlugin.prototype.executeSql = function(sql, values, success, error) {
    var opts;
    if (!sql) throw new Error("Cannot executeSql without a query");
    opts = getOptions({
      query: [sql].concat(values || []),
      path: this.dbname
    }, success, error);
    exec("SQLitePlugin.backgroundExecuteSql", opts);
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
    var opts;
    if (!(this.dbname in this.openDBs)) {
      this.openDBs[this.dbname] = true;
      opts = getOptions(this.dbargs, success, error);
      exec("SQLitePlugin.open", opts);
    }
  };
  SQLitePlugin.prototype.close = function(success, error) {
    var opts;
    if (this.dbname in this.openDBs) {
      delete this.openDBs[this.dbname];
      opts = getOptions({
        path: this.dbname
      }, success, error);
      exec("SQLitePlugin.close", opts);
    }
  };
  SQLitePluginTransaction = function(db, fn, error, success) {
    if (typeof(fn) != 'function'){
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
  SQLitePluginTransaction.prototype.start = function(){
    try {
      if (!this.fn) { return }
      this.fn(this);
      this.fn = null;
      this.run();
    }
    catch(err){
      // If "fn" throws, we must report the whole transaction as failed.
      this.db.startNextTransaction();
      if (this.error){
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
      rows: {item: function(i){ return response.rows[i] }, length: response.rows.length},
      rowsAffected: response.rowsAffected,
      insertId: response.insertId || null
    };
    handler(this, payload);
  };
  SQLitePluginTransaction.prototype.handleStatementFailure = function(handler, response) {
    if (!handler){
      throw new Error("a statement with no error handler failed: " + response.message)
    }
    if (handler(this, response)){
      throw new Error("a statement error callback did not return false");
    }
  };
  SQLitePluginTransaction.prototype.run = function() {
    var batchExecutes, waiting, txFailure, tx, opts=[];
    batchExecutes = this.executes;
    waiting = batchExecutes.length;
    this.executes = [];
    tx = this;
    function handlerFor(index, didSucceed){
      return function (response){
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
	  } else if (tx.executes.length > 0){
	    // new requests have been issued by the callback
	    // handlers, so run another batch.
	    tx.run();
	  } else {
	    tx.commit();
	  }
	}
      }
    }

    for (var i=0; i<batchExecutes.length; i++){
      var request = batchExecutes[i];
      opts.push(getOptions({
	query: request.query,
	path: this.db.dbname
      }, handlerFor(i, true), handlerFor(i, false)));
    }

    exec("SQLitePlugin.backgroundExecuteSqlBatch", {executes: opts});
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
    }
  };

  root.sqlitePlugin = {
    openDatabase: SQLiteFactory.opendb,

    handleCallback: SQLitePlugin.handleCallback
  };
})();
