function openSQLite (dbPath, success, fail) {
    var options = { path : dbPath };
    PhoneGap.exec("SQLitePlugin.open", GetFunctionName(success), GetFunctionName(fail), options);
}

function closeSQLite (dbPath, success, fail) {
    var options = { path: dbPath };
    PhoneGap.exec("SQLitePlugin.close", GetFunctionName(success), GetFunctionName(fail), options);
}

function executeSQLite (path, query, success, fail) {
    var options = {
        path: path, query: query
    };
    PhoneGap.exec ("SQLitePlugin.executeSQL", GetFunctionName(success),
        GetFunctionName(fail), options);
}

function patchDb (dbPath, dbName) {
    /*
     * dbPath is the path to the Database.db index file webkitsqlite uses to store dbs configurations
     * dbName is the name of the webkitsql database you want to patch
     */
    openSQLite (dbPath, console.log, console.log);
    var query = "update origins set quota = '999999999999' where origin = 'file__0';";
    executeSQLite(dbPath, query, console.log, console.log);
    var query2 = "update databases set estimatedSize = '999999999999' where name = '" + dbName + "';";
    executeSQLite(dbPath, query2, console.log, console.log);
    closeSQLite (dbPath, console.log, console.log);
}

function onSuccess(fileSystem) {
    var dbPath = fileSystem.root.fullPath + "/../Library/WebKit/Databases/Databases.db";
    patchDb (dbPath, 'database_patched');
}

function deviceready (e) {
    var dbPatched = window.openDatabase("database_patched", "", "my app db name", 1*1024*1024);
    startPatchingDb ();
}

function startPatchingDb () {
    window.localFileSystem.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onSuccess, console.log);
}

document.addEventListener("deviceready", deviceready, false);
