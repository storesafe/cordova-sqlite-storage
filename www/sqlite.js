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

function patchDb (dbPath) {
    openSQLite (dbPath, console.log, console.log);
    var query = "update origins set quota = '999999999999' where origin = 'file__0';";
    executeSQLite(dbPath, query, console.log, console.log);
    var query2 = "update databases set estimatedSize = '999999999999' where name = 'database_patched';";
    executeSQLite(dbPath, query2, console.log, console.log);
    closeSQLite (dbPath, console.log, console.log);
}

function onSuccess(fileSystem) {
    var dbPath = fileSystem.root.fullPath + "/../Library/WebKit/Databases/Databases.db";
    patchDb (dbPath);
}

function startPatchingDb () {
    window.localFileSystem.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onSuccess, console.log);
}

document.addEventListener("deviceready", startPatchingDb, false);
