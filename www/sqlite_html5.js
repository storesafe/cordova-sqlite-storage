/* WebSQL-like interface to SQLite db (DRAFT) 
 * <http://www.w3.org/TR/webdatabase/> */

function WebSQLite (name, foo, desc, size) {
    this.dbName = name;
    this.path = null;
}

WebSQLite.openDatabase = function (name, foo, desc, size) {
    return new WebSQLite (name, foo, desc,size);
};

WebSQLite.inject = function () {
    window.openDatabase = WebSQLite.openDatabase;
};


WebSQLite.prototype = {
    version : "1.0",
    
    transaction : function (callback, errorCallback, successCallback) {
        var self = this;
        console.log ("requested transaction");
        var deferredCallback = function () { 
            callback (self);
            /* I just decided self is also the transaction object */
        };
        
        setTimeout (deferredCallback, 0);
    },
    
    readTransaction : function () {
        // TODO
    },
    
    changeVersion : function () {
        // TODO
    },
    
    executeSql : function (sqlStatement, arguments, callback, errorCallback) {
        var self = this;
        
        function callbackReal (arg) { callback (self, arg); }
        
        function onSuccess () {
            self.executeSqlReal (sqlStatement, arguments, callbackReal, errorCallback);
        }
        
        this.updatePath (onSuccess, errorCallback);
    },
    
    executeSqlReal : function (sqlStatement, arguments, callback, errorCallback) {
        /* TODO: update query with params */
        var options = {
            path: this.path, query: sqlStatement
        };
        /* TODO : handle callbacks and response structures */
        PhoneGap.exec ("Storage.executeSQL", GetFunctionName(callback),
                       GetFunctionName(errorCallback), options);
    },
    
    updatePath : function (success, error) {
        var self = this;
        
        if (this.path !== null) { success (); }
        
        function onSuccess (fileSystem) {
            self.path = fileSystem.root.fullPath + "/../Library/WebKit/" + self.name + ".db";
            success ();
        }
        function onError (e) {
            error ();
        }
        
        window.localFileSystem.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onSuccess, onError);
    }
    
};
