cordova.define("ch.zhaw.sqlite.SqlitePlugin", function (require, exports, module) {
    var cordova = require('cordova');
    var SQLitePlugin = function () { };
    var SQLitePluginTransaction, get_unique_id, transaction_callback_queue, transaction_queue;
    var sqlitePluginRunning = false;
    var root = this;

    SQLitePlugin = function (databasePath, openSuccess, openError) {
        this.dbPath = databasePath;
        this.openSuccess = openSuccess;
        this.openError = openError;
        if (!this.dbPath) {
            return openError("Cannot create a SQLitePlugin instance without a dbPath");
        }
        if (!this.openSuccess) {
            this.openSuccess = function () {
                return console.log("DB opened: " + dbPath);
            };
        }

        if (!this.openError) {
            this.openError = function (e) {
                return console.log("Error openening DB: " + e.message);
            };
        }

        try {
            return this.open(this.openSuccess, this.openError);
        }
        catch (err) {
            console.log(err);
        }
    };

    SQLitePlugin.prototype.openDBs = {};
    SQLitePlugin.prototype.transaction = function (fn, error, success) {
        var t;
        t = new SQLitePluginTransaction(this.dbPath);
        fn(t);
        return t.complete(success, error);
    };
    SQLitePlugin.prototype.open = function (success, error) {
        var opts;
        opts = void 0;

        if (!this.openDBs) {
            openDB.push("");
        }

        if (!(this.dbPath in this.openDBs)) {
            this.openDBs[this.dbPath] = true;
            return cordova.exec(success, error, "SQLitePlugin", "open", [{ dbName: this.dbPath }]);
        }
        else { // we already have this db open
            return cordova.exec(success, error, "SQLitePlugin", "open", [{ dbName: this.dbPath }]);
        }
    };
    SQLitePlugin.prototype.close = function (success, error) {
        var opts;
        opts = 0;
        if (this.dbPath in this.openDBs) {
            delete this.openDBs[this.dbPath];
            return cordova.exec(success, error, "SQLitePlugin", "close", [this.dbPath]);
        }
    };
    get_unique_id = function () {
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
    SQLitePluginTransaction = function (dbPath) {
        this.dbPath = dbPath;
        this.executes = [];
        this.trans_id = get_unique_id();
        this.__completed = false;
        this.__submitted = false;
        transaction_queue[this.trans_id] = [];
        transaction_callback_queue[this.trans_id] = new Object();
    };
    SQLitePluginTransaction.queryCompleteCallback = function (transId, queryId, result) {
        var query, x;
        query = null;
        var trans;
        if (queryId) {
            for (x in transaction_queue[transId]) {
                if (transaction_queue[transId][x]["query_id"] === queryId) {
                    query = transaction_queue[transId][x];
                    if (transaction_queue[transId].length === 1) {
                        transaction_queue[transId] = [];
                    }
                    else {
                        transaction_queue[transId].splice(x, 1);
                    }
                    break;
                }
            }
        }
        if (queryId && query && query["callback"]) {
            return query["callback"](result);
        }
    };
    SQLitePluginTransaction.queryErrorCallback = function (transId, queryId, result) {
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
        if (query && query["err_callback"]) {
            return query["err_callback"](result);
        }
    };
    SQLitePluginTransaction.escapeJSONVal = function (str) {
        return str
          .replace(/[\\]/g, '\\\\')
          .replace(/[\"]/g, '\\\"')
          .replace(/[\/]/g, '\\/')
          .replace(/[\b]/g, '\\b')
          .replace(/[\f]/g, '\\f')
          .replace(/[\n]/g, '\\n')
          .replace(/[\r]/g, '\\r')
          .replace(/[\t]/g, '\\t');
    };
    //-- makes the reslts that come from cordova into results thar resemble the websql results
    SQLitePluginTransaction.fixQueryResult = function (resultColumns) {
        //make a JSON string then turn it back to an object, since we cannot have dynamic varable names I don't see any other way to do this
        var newResults = "[";
        var columNum = 0;
        var temp = '';
        var tempObj = '';
        for (var x in resultColumns) {
            if (newResults !== "[") {
                newResults += ",{";
            }
            else {
                newResults += "{";
            }
            columNum = 0;
            for (var y in resultColumns[x].column) {
                if (columNum > 0) {
                    newResults += ",";
                }

                if (typeof resultColumns[x].column[y].Value == 'string') {
                    newResults += '"' + resultColumns[x].column[y].Key.replace("\"", "\\\"") + '":"' + SQLitePluginTransaction.escapeJSONVal(resultColumns[x].column[y].Value) + '"';
                }
                else {
                    newResults += '"' + resultColumns[x].column[y].Key.replace("\"", "\\\"") + '":' + resultColumns[x].column[y].Value + '';
                }

                columNum++;
            }
            newResults += "}";
        }
        newResults += "]";
        return JSON.parse(newResults);
    };

    SQLitePluginTransaction.txCompleteCallback = function (result, success) {
        var transId = result.transId;
        var queryId = null;
        var queryResult = null;
        for (var x in result.results) {
            queryId = result.results[x].queryId;
            queryResult = result.results[x].result;
            if (queryId) {
                SQLitePluginTransaction.queryCompleteCallback(transId, queryId, SQLitePluginTransaction.fixQueryResult(queryResult));
            }
        }

        if (success) {
            return success();
        }
    };
    SQLitePluginTransaction.txErrorCallback = function (transId, error) {
        if (typeof transId !== "undefined") {
            if (transId && transaction_callback_queue[transId]["error"]) {
                transaction_callback_queue[transId]["error"](error);
            }
            delete transaction_queue[transId];
            return delete transaction_callback_queue[transId];
        }
    };
    SQLitePluginTransaction.prototype.add_to_transaction = function (trans_id, query, params, callback, err_callback) {
        var new_query;
        new_query = new Object();
        new_query["trans_id"] = trans_id;
        if (callback) {
            new_query["query_id"] = get_unique_id();
        } else {
            new_query["query_id"] = "";
        }
        new_query["query"] = query;
        if (params) {
            new_query["params"] = params;
        } else {
            new_query["params"] = [];
        }
        new_query["callback"] = callback;
        new_query["err_callback"] = err_callback;
        if (!transaction_queue[trans_id]) {
            transaction_queue[trans_id] = [];
        }

        return transaction_queue[trans_id].push(new_query);
    };
    SQLitePluginTransaction.prototype.executeSql = function (sql, values, success, error) {
        var errorcb, successcb, txself;
        errorcb = 0;
        successcb = 0;
        txself = 0;
        txself = this;
        successcb = null;
        if (success) {
            successcb = function (execres) {
                var res, saveres;
                res = 0;
                saveres = 0;
                saveres = execres;
                res = {
                    rows: {
                        item: function (i) {
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
            errorcb = function (res) {
                return error(txself, res);
            };
        }
        return this.add_to_transaction(this.trans_id, sql, values, successcb, errorcb);
    };
    SQLitePluginTransaction.prototype.complete = function (success, error) {
        var begin_opts, commit_opts, errorcb, executes, opts, successcb, txself;
        txself = this;
        if (sqlitePluginRunning) {
            setTimeout(function () {
                txself.complete(success, error);
            }, 5);
        }
        else {
            sqlitePluginRunning = true;
            begin_opts = 0;
            commit_opts = 0;
            errorcb = 0;
            executes = 0;
            opts = 0;
            successcb = 0;
            txself = 0;
            if (this.__completed) {
                throw new Error("Transaction already run");
            }

            if (this.__submitted) {
                throw new Error("Transaction already submitted");
            }

            this.__submitted = true;
            txself = this;
            errorcb = function (res) { };
            if (error) {
                errorcb = function (res) {
                    sqlitePluginRunning = false;
                    return error(txself, res);
                };
            }

            successcb = function (result) {
                sqlitePluginRunning = false;
                SQLitePluginTransaction.txCompleteCallback(result, success);
            };
            return cordova.exec(successcb, function () { console.log('txerror:') }, "SQLitePlugin", "executeSqlBatch", [transaction_queue[this.trans_id]]);
        }
    };

    SQLitePlugin.openDatabase = function (dbPath, version, displayName, estimatedSize, creationCallback, errorCallback) {
        return new SQLitePlugin(dbPath, creationCallback, errorCallback);
    };

    window.openDatabase = SQLitePlugin.openDatabase;
    module.exports = SQLitePlugin;
});