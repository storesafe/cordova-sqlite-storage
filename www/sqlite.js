/* Base API */

function openSQLite (dbPath, success, fail) {
    var options = { path : dbPath };
    PhoneGap.exec("it.dadeb.sqliteplugin.open", GetFunctionName(success), GetFunctionName(fail), options);
}

function closeSQLite (dbPath, success, fail) {
    var options = { path: dbPath };
    PhoneGap.exec("it.dadeb.sqliteplugin.close", GetFunctionName(success), GetFunctionName(fail), options);
}

function exitApp () {
    /* This method will be moved to a separate plugin but it's needed because
     * UIWebView's sqlite engine will not apply the hacked quota immediately,
     * the application needs a restart instead. */
    var options = {};
    PhoneGap.exec("it.dadeb.sqliteplugin.exitApp", GetFunctionName(console.log), GetFunctionName(console.log), options);
}

function executeSQLite (path, query, success, fail) {
    var options = {
        path: path, query: query
    };
    PhoneGap.exec ("it.dadeb.sqliteplugin.executeSQL", GetFunctionName(success),
        GetFunctionName(fail), options);
}


/* Used to hack WebKitSQLite database index to change DBs quota */

function patchDb (dbPath, dbName, success, failure) {
    /*
     * - dbPath is the path to the Database.db index file webkitsqlite 
     * uses to store dbs configurations
     * - dbName is the name of the webkitsql database you want to patch
     */
    
    function update1 (res) {
        console.log (res);
        var query = "update origins set quota = '999999999999' where origin = 'file__0';";
        executeSQLite(dbPath, query, update2, failure);
    }
    
    function update2 (res) {
        console.log (res);
        var query2 = "update databases set estimatedSize = '999999999999' where name = '" + dbName + "';";
        executeSQLite(dbPath, query2, finish, failure);
    }
    
    function finish (res) {
        console.log (res);
        closeSQLite (dbPath, console.log, console.log);
        if (success) { success (); }
    }
    
    openSQLite (dbPath, update1, failure);

}

function haveDbPath (fileSystem, dbName, success, failure) {
    var dbPath = fileSystem.root.fullPath + "/../Library/WebKit/Databases/Databases.db";
    console.log ("dbPath: "+ dbPath);
    patchDb (dbPath, dbName, success, failure);
}

function patchDbWithName (dbName, success, failure) {
    function onSuccess (fs) {
        haveDbPath (fs, dbName, success, failure);
    }
    window.localFileSystem.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onSuccess, failure);
}

/* Example usage.
 * database_patched is a db already created usign openDatabase

function patch () {
    ...
    database_patched is a db already created usign openDatabase

    patchDbWithName ("database_patched", console.log, console.log);
}

document.addEventListener("deviceready", start, false);
*/
