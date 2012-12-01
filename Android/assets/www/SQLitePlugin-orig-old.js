(function() {
	var root;
	root = this;
	//root.SQLitePlugin = (function() {
	console.log("root.SQLitePlugin");
    SQLitePlugin.prototype.openDBs = {};

    function SQLitePlugin(dbPath, openSuccess, openError) 
    {
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
    	return;
    }

    SQLitePlugin.prototype.transaction = function(fn, error, success) 
    {
    	console.log("SQLitePlugin.prototype.transaction");
    	var t;
    	t = new root.SQLitePluginTransaction(this.dbPath);
    	fn(t);
    	return t.complete(success, error);
    };

    SQLitePlugin.prototype.open = function(success, error) 
    {
    	console.log("SQLitePlugin.prototype.open");
    	var opts;
    	if (!(this.dbPath in this.openDBs)) {
    		this.openDBs[this.dbPath] = true;
    		PhoneGap.exec(success, error, "SQLitePlugin", "open", [this.dbPath]);
    	}
    };

    SQLitePlugin.prototype.close = function(success, error) 
    {
		console.log("SQLitePlugin.prototype.close");
		var opts;
		if (this.dbPath in this.openDBs) {
			delete this.openDBs[this.dbPath];
			PhoneGap.exec(null, null, "SQLitePlugin", "close", [this.dbPath]);
		}
    };
    //return SQLitePlugin;
  //})();
	root.SQLitePlugin = SQLitePlugin;
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
	//root.SQLitePluginTransaction = (function() {
	console.log("root.SQLitePluginTransaction");
	function SQLitePluginTransaction(dbPath) 
	{
		console.log("root.SQLitePluginTransaction.SQLitePluginTransaction");
		this.dbPath = dbPath;
		this.executes = [];
		this.trans_id = get_unique_id();
		this.__completed = false;
		this.__submitted = false;
		//this.optimization_no_nested_callbacks: default is false.
		//if set to true large batches of queries within a transaction will be much faster but 
		//you will lose the ability to do multi level nesting of executeSQL callbacks
		this.optimization_no_nested_callbacks = false;
		console.log("root.SQLitePluginTransaction - this.trans_id:"+this.trans_id);
		transaction_queue[this.trans_id] = [];
		transaction_callback_queue[this.trans_id] = new Object();
		return;
	}
    SQLitePluginTransaction.queryCompleteCallback = function(transId, queryId, result) 
    {
    	console.log("SQLitePluginTransaction.queryCompleteCallback");
    	var query = null;
		for (var x in transaction_queue[transId]) 
		{
			if(transaction_queue[transId][x]['query_id'] == queryId)
			{
				query = transaction_queue[transId][x];
				if(transaction_queue[transId].length == 1)
					transaction_queue[transId] = [];
				else
					transaction_queue[transId].splice(x, 1);
				break;
			}
		}

//		if(query)
//	      	console.log("SQLitePluginTransaction.completeCallback---query:"+query['query']);
		if(query && query['callback'])
		{
			query['callback'](result)
		}
    }
    SQLitePluginTransaction.queryErrorCallback = function(transId, queryId, result) 
    {
    	var query = null;
		for (var x in transaction_queue[transId]) 
		{
			if(transaction_queue[transId][x]['query_id'] == queryId)
			{
				query = transaction_queue[transId][x];
				if(transaction_queue[transId].length == 1)
					transaction_queue[transId] = [];
				else
					transaction_queue[transId].splice(x, 1);
				break;
			}
		}
		//if(query)
	    //  	console.log("SQLitePluginTransaction.queryErrorCallback---query:"+query['query']);
		if(query && query['err_callback'])
			query['err_callback'](result)
    }
    SQLitePluginTransaction.txCompleteCallback = function(transId) 
    {
    	if(typeof transId != 'undefined')
    	{
		    if(transId && transaction_callback_queue[transId] && transaction_callback_queue[transId]['success'])
		    {
		    	transaction_callback_queue[transId]['success']();
		    }
		    	
		    
		   // delete transaction_queue[transId];
		   // delete transaction_callback_queue[transId];
    	}
    	else
    		console.log("SQLitePluginTransaction.txCompleteCallback---transId = NULL");
    }
    SQLitePluginTransaction.txErrorCallback = function(transId, error) 
    {
    	if(typeof transId != 'undefined')
    	{
		    console.log("SQLitePluginTransaction.txErrorCallback---transId:"+transId);
		    if(transId && transaction_callback_queue[transId]['error'])
		    	transaction_callback_queue[transId]['error'](error);
		    delete transaction_queue[transId];
		    delete transaction_callback_queue[transId];
    	}
    	else
    		console.log("SQLitePluginTransaction.txErrorCallback---transId = NULL");
    }
    SQLitePluginTransaction.prototype.add_to_transaction = function(trans_id, query, params, callback, err_callback)
    {
    	var new_query = new Object();;
    	new_query['trans_id'] = trans_id;
    	if(callback || !this.optimization_no_nested_callbacks)
    		new_query['query_id'] = get_unique_id();
    	else if(this.optimization_no_nested_callbacks)
    		new_query['query_id'] = "";
    	new_query['query'] = query;
    	if(params)
    		new_query['params'] = params;
    	else
    		new_query['params'] = [];
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
		if (success) 
		{
			console.log("success not null:"+sql);
			successcb = function(execres) 
			{
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
		else
			console.log("success NULL:"+sql);
		
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
		if (this.__submitted) throw new Error("Transaction already submitted");
		this.__submitted = true;
		txself = this;
		successcb = function() 
		{
			if(transaction_queue[txself.trans_id].length > 0 && !txself.optimization_no_nested_callbacks)
			{
				txself.__submitted = false;
				txself.complete(success, error);
			}
			else
			{
				this.__completed = true;
				if(success)
					return success(txself);
			}
		};
		errorcb = function(res) {};
		if (error) {
			errorcb = function(res) {
				return error(txself, res);
			};
		}
		transaction_callback_queue[this.trans_id]['success'] = successcb;
		transaction_callback_queue[this.trans_id]['error'] = errorcb;
		PhoneGap.exec(null, null, "SQLitePlugin", "executeSqlBatch", transaction_queue[this.trans_id]);
    };
    //return SQLitePluginTransaction;
  //})();
	root.SQLitePluginTransaction = SQLitePluginTransaction;

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
