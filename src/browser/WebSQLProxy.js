var databases = {};

var log = {
    verbose: false,
    error: function() {
        console.error.apply(console, arguments);
    },
    warn: function() {
        console.warn.apply(console, arguments);
    },
    info: function() {
        console.log.apply(console, arguments);
    },
    debug: function() {
        if(this.verbose) {
            console.log.apply(console, arguments);
        }
    }
};

function echoStringValueFn(success, error, args) {
    success = success || function(){};

    log.debug("SQLitePlugin.echoStringValue", args);
    success(args[0].value);
}

function openFn(success, error, args) {
    success = success || function(){};
    error = error || function(){};
    try {
        var openargs = args[0];
        log.verbose = openargs.verbose == true;
        log.debug("SQLitePlugin.open", args);
        var dbName = openargs.name;
        var db = openDatabase(dbName, "", dbName, 5 * 1024 * 2014);
        databases[dbName] = db;
        success();
    } catch(err) {
        log.error("WebSQLProxy.open", err);
        error(err);
    }
}

function closeFn(success, error, args) {
    success = success || function(){};

    log.debug("SQLitePlugin.close", args);
    log.warn("SQLitePlugin.close is not supported in browser");
    var dbName = args[0].name;
    delete databases[dbName];
    success();
}

function deleteFn(success, error, args) {
    success = success || function(){};

    log.debug("SQLitePlugin.delete", args);
    log.warn("SQLitePlugin.delete is not supported in browser");
    var dbName = args[0].name;
    delete databases[dbName];
    success();
}

function executeSqlBatchFn(success, error, args) {
    success = success || function(){};
    error = error || function(){};


    function fireCallbackIfCompleted(batchResults, batchClb) {
        var completed = true;
        for(var i=0; i<batchResults.length; i++) {
            if(batchResults[i] == null) {
                completed = false;
                break;
            }
        }
        if(completed) {
            log.debug("WebSQLProxy.executeSqlBatch completed", batchResults);

            batchClb(batchResults);
        }
    }
    function handleSuccess(batchResults, index, execute, batchClb) {
        return function(tx, results) {
            var queryResult = {
                rowsAffected: results.rowsAffected,
                rows: []
            };
            for(var i=0; i<results.rows.length; i++) {
                queryResult.rows.push(results.rows.item(i));
            }
            batchResults[index] = {
                type: "success",
                result: queryResult
            };
            fireCallbackIfCompleted(batchResults, batchClb);
        }
    }
    function handleError(batchResults, index, execute, batchClb) {
        return function(tx, error) {
            log.debug("handleError", execute, error);
            var queryResult = {
                code: error.code,
                message: error.message
            };
            batchResults[index] = {
                type: "error",
                result: queryResult
            };
            fireCallbackIfCompleted(batchResults, batchClb);
        }
    }


    try {
        log.debug("WebSQLProxy.executeSqlBatch", args);
        var dbName = args[0].dbargs.dbname;
        var executes = args[0].executes;

        var db = databases[dbName];
        if(!db) {
            throw Error("unknown database: " + dbName);
        }
        db.transaction(function(tx) {
            var batchResults = [];
            for(var i=0; i<executes.length; i++) {
                batchResults[i] = null;
            }
            for(var i=0; i<executes.length; i++) {
                var execute = executes[i];
                if(["BEGIN", "COMMIT", "ROLLBACK"].indexOf(execute.sql) >= 0) {
                    batchResults[i] = {
                        type: "success",
                        result: {
                            rowsAffected: 0,
                            rows: []
                        }
                    }
                    fireCallbackIfCompleted(batchResults, success);
                    continue;
                }
                tx.executeSql(execute.sql, execute.params, handleSuccess(batchResults, i, execute, success), handleError(batchResults, i, execute, success));
            }
        })

    } catch(err) {
        log.error("WebSQLProxy.executeSqlBatch", err);
        error(err);
    }
}

module.exports = {
    echoStringValue: echoStringValueFn,
    open: openFn,
    close: closeFn,
    delete: deleteFn,
    executeSqlBatch: executeSqlBatchFn,
    backgroundExecuteSqlBatch: executeSqlBatchFn
};

require("cordova/exec/proxy").add("SQLitePlugin", module.exports);