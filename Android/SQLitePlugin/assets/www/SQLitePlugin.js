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
	console.log("root.SQLitePlugin");
    SQLitePlugin.prototype.openDBs = {};

    function SQLitePlugin(dbPath, openSuccess, openError) {
		console.log("SQLitePlugin");
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
		console.log("SQLitePlugin.prototype.handleCallback");
      var _ref;
      if ((_ref = callbacks[ref]) != null) {
        if (typeof _ref[type] === "function") _ref[type](obj);
      }
      callbacks[ref] = null;
      delete callbacks[ref];
    };
    SQLitePlugin.prototype.executeSql = function(sql, values, success, error) {
		console.log("SQLitePlugin.prototype.executeSql");
      var opts;
      if (!sql) throw new Error("Cannot executeSql without a query");
      opts = getOptions({
        query: [sql].concat(values || []),
        path: this.dbPath
      }, success, error);
     // PhoneGap.exec("SQLitePlugin.backgroundExecuteSql", opts);
	  PhoneGap.exec(null, null, "SQLitePlugin", "backgroundExecuteSql", opts);
    };
    SQLitePlugin.prototype.transaction = function(fn, error, success) {
		console.log("SQLitePlugin.prototype.transaction");
      var t;
      t = new root.SQLitePluginTransaction(this.dbPath);
      fn(t);
      return t.complete(success, error);
    };

    SQLitePlugin.prototype.open = function(success, error) {
		console.log("SQLitePlugin.prototype.open");
      var opts;
      if (!(this.dbPath in this.openDBs)) {
        this.openDBs[this.dbPath] = true;
        opts = getOptions({
          path: this.dbPath
        }, success, error);
        //PhoneGap.exec("SQLitePlugin.open", opts);
        /*
         * 	db The name of the database
			version The version
			display_name The display name
			size The size in bytes
         * 
         */
		PhoneGap.exec(success, error, "SQLitePlugin", "open", [this.dbPath]);
      }
    };

    SQLitePlugin.prototype.close = function(success, error) {
		console.log("SQLitePlugin.prototype.close");
      var opts;
      if (this.dbPath in this.openDBs) {
        delete this.openDBs[this.dbPath];
        opts = getOptions({
          path: this.dbPath
        }, success, error);
        //PhoneGap.exec("SQLitePlugin.close", opts);
		PhoneGap.exec(null, null, "SQLitePlugin", "close", opts);
      }
    };

    return SQLitePlugin;

  })();
  get_unique_id = function()
  {
	var id = new Date().getTime();
	var id2 = new Date().getTime();
	while(id === id2)
	{
		id2 = new Date().getTime();
	}
	return id2+'000';
  }
  transaction_queue = [];
  transaction_callback_queue = new Object();
  root.SQLitePluginTransaction = (function() {
		console.log("root.SQLitePluginTransaction");
    function SQLitePluginTransaction(dbPath) {
		console.log("root.SQLitePluginTransaction.SQLitePluginTransaction");
      this.dbPath = dbPath;
      this.executes = [];
      this.trans_id = get_unique_id();
      console.log("root.SQLitePluginTransaction - this.trans_id:"+this.trans_id);
      transaction_queue[this.trans_id] = [];
    }
    SQLitePluginTransaction.queryCompleteCallback = function(transId, queryId, result) 
    {
    	var query = null;
		for (var x in transaction_queue[transId]) 
		{
			if(transaction_queue[transId][x]['query_id'] == queryId)
			{
				query = transaction_queue[transId][x];
				break;
			}
		}
		if(query)
	      	console.log("SQLitePluginTransaction.completeCallback---query:"+query['query']);
		else
			console.log("SQLitePluginTransaction.completeCallback---JSON.stringify(transaction_queue):"+JSON.stringify(transaction_queue[transId]));
		if(query['callback'])
			query['callback'](result)
    }
    SQLitePluginTransaction.txCompleteCallback = function(transId) 
    {
    	if(typeof transId != 'undefined')
    	{
		    console.log("SQLitePluginTransaction.txCompleteCallback---transId:"+transId);
		    if(transId && transaction_callback_queue[transId])
		    	transaction_callback_queue[transId]();
    	}
    	else
    		console.log("SQLitePluginTransaction.txCompleteCallback---transId = NULL");
    }
    SQLitePluginTransaction.prototype.add_to_transaction = function(trans_id, query, params, callback, err_callback)
    {
    	var new_query = new Object();;
    	new_query['trans_id'] = trans_id;
    	new_query['query_id'] = get_unique_id();
    	new_query['query'] = query;
    	new_query['params'] = params;
    	new_query['callback'] = callback;
    	new_query['err_callback'] = err_callback;
    	if(!transaction_queue[trans_id])
    		transaction_queue[trans_id] = [];
    	transaction_queue[trans_id].push(new_query);
    }

    SQLitePluginTransaction.prototype.executeSql = function(sql, values, success, error) {
		console.log("SQLitePluginTransaction.prototype.executeSql");
      var errorcb, successcb, txself;
      txself = this;
      successcb = null;
      if (success) {
        successcb = function(execres) {
        	console.log("executeSql callback:"+JSON.stringify(execres));
          var res, saveres;
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
      }
      errorcb = null;
      if (error) {
        errorcb = function(res) {
          return error(txself, res);
        };
      }
		this.add_to_transaction(this.trans_id, sql, values, successcb, errorcb);
		console.log("executeSql - add_to_transaction"+sql);
    };
 
    

    SQLitePluginTransaction.prototype.complete = function(success, error) {
		console.log("SQLitePluginTransaction.prototype.complete");
      var begin_opts, commit_opts, errorcb, executes, opts, successcb, txself;
      if (this.__completed) throw new Error("Transaction already run");
      this.__completed = true;
      txself = this;
      successcb = function() {};
      if (success) {
        successcb = function() {
          return success(txself);
        };
      }
      errorcb = function(res) {
      };
      if (error) {
        errorcb = function(res) {
          return error(txself, res);
        };
      }
      console.log("complete - this.transaction_queue"+JSON.stringify(transaction_queue[this.trans_id]));
      transaction_callback_queue[this.trans_id] = successcb;
	  PhoneGap.exec(null, null, "SQLitePlugin", "executeSqlBatch", transaction_queue[this.trans_id]);
    };

    return SQLitePluginTransaction;

  })();

}).call(this);