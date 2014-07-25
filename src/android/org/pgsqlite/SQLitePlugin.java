/*
 * Copyright (c) 2012-2013, Chris Brody
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010, IBM Corporation
 */

package org.pgsqlite;

import android.annotation.SuppressLint;
import android.database.Cursor;
import android.database.CursorWindow;
import android.database.sqlite.SQLiteCursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteException;
import android.database.sqlite.SQLiteStatement;

import android.util.Base64;
import android.util.Log;

import java.io.File;
import java.lang.IllegalArgumentException;
import java.lang.Number;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class SQLitePlugin extends CordovaPlugin {

    private static final Pattern FIRST_WORD = Pattern.compile("^\\s*(\\S+)",
            Pattern.CASE_INSENSITIVE);

    private static final Pattern WHERE_CLAUSE = Pattern.compile("\\s+WHERE\\s+(.+)$",
            Pattern.CASE_INSENSITIVE);

    private static final Pattern UPDATE_TABLE_NAME = Pattern.compile("^\\s*UPDATE\\s+(\\S+)",
            Pattern.CASE_INSENSITIVE);

    private static final Pattern DELETE_TABLE_NAME = Pattern.compile("^\\s*DELETE\\s+FROM\\s+(\\S+)",
            Pattern.CASE_INSENSITIVE);

    /**
     * Multiple database map (static).
     * TBD: restructure to keep only map with the DBRunner; may not need ConcurrentHashMap.
     * NOTE: removed public static accessor to dbmap since it would not work with db threading.
     * FUTURE put DBRunner into a public class that can provide external accessor.
     */
    static ConcurrentHashMap<String, SQLiteDatabase> dbmap = new ConcurrentHashMap<String, SQLiteDatabase>();
    static ConcurrentHashMap<String, DBRunner> rmap = new ConcurrentHashMap<String, DBRunner>();

    /**
     * NOTE: Using default constructor, no explicit constructor.
     */

    /**
     * Executes the request and returns PluginResult.
     *
     * @param actionAsString The action to execute.
     * @param args   JSONArry of arguments for the plugin.
     * @param cbc    Callback context from Cordova API
     * @return       Whether the action was valid.
     */
    @Override
    public boolean execute(String actionAsString, JSONArray args, CallbackContext cbc) {

        Action action;
        try {
            action = Action.valueOf(actionAsString);
        } catch (IllegalArgumentException e) {
            // shouldn't ever happen
            Log.e(SQLitePlugin.class.getSimpleName(), "unexpected error", e);
            return false;
        }

        try {
            return executeAndPossiblyThrow(action, args, cbc);
        } catch (JSONException e) {
            // TODO: signal JSON problem to JS
            Log.e(SQLitePlugin.class.getSimpleName(), "unexpected error", e);
            return false;
        }
    }

    private boolean executeAndPossiblyThrow(Action action, JSONArray args, CallbackContext cbc)
            throws JSONException {

        boolean status = true;
        JSONObject o;
        String dbname;

        switch (action) {
            case open:
                o = args.getJSONObject(0);
                dbname = o.getString("name");

                DBRunner r = new DBRunner(dbname);
                this.rmap.put(dbname, r);
                this.cordova.getThreadPool().execute(r);
                // TODO should send an async callback
                break;

            case close:
                o = args.getJSONObject(0);
                dbname = o.getString("path");
                // put request in the q to close the db
                this.closeDatabase(dbname);
                // TODO should send an async callback
                break;

            case delete:
                o = args.getJSONObject(0);
                dbname = o.getString("path");

                // TODO: if the db is open, must put request in the q to close & delete the db
                status = this.deleteDatabase(dbname);

                // deleteDatabase() requires an async callback
                if (status) {
                    cbc.success();
                } else {
                    cbc.error("couldn't delete database");
                }
                break;

            case executeSqlBatch:
            case backgroundExecuteSqlBatch:
                String[] queries = null;
                String[] queryIDs = null;

                JSONArray jsonArr = null;
                int paramLen = 0;
                JSONArray[] jsonparams = null;

                JSONObject allargs = args.getJSONObject(0);
                JSONObject dbargs = allargs.getJSONObject("dbargs");
                dbname = dbargs.getString("dbname");
                JSONArray txargs = allargs.getJSONArray("executes");

                if (txargs.isNull(0)) {
                    queries = new String[0];
                } else {
                    int len = txargs.length();
                    queries = new String[len];
                    queryIDs = new String[len];
                    jsonparams = new JSONArray[len];

                    for (int i = 0; i < len; i++) {
                        JSONObject a = txargs.getJSONObject(i);
                        queries[i] = a.getString("sql");
                        queryIDs[i] = a.getString("qid");
                        jsonArr = a.getJSONArray("params");
                        paramLen = jsonArr.length();
                        jsonparams[i] = jsonArr;
                    }
                }

                // put db query in the queue to be executed in the db thread:
                DBQuery q = new DBQuery(queries, queryIDs, jsonparams, cbc);
                r = rmap.get(dbname);
                if (r != null) try { r.q.put(q); } catch(Exception e) {}
                break;
        }

        return status;
    }

    /**
     * Clean up and close all open databases.
     */
    @Override
    public void onDestroy() {
        while (!dbmap.isEmpty()) {
            String dbname = dbmap.keySet().iterator().next();
	    // TODO should stop the db thread(s) instead (!!)
            this.closeDatabaseNow(dbname);
            dbmap.remove(dbname);
        }
    }

    // --------------------------------------------------------------------------
    // LOCAL METHODS
    // --------------------------------------------------------------------------

    /**
     * Open a database.
     *
     * @param dbName   The name of the database file
     */
    private void openDatabase(String dbname) {
        if (this.getDatabase(dbname) != null) {
	    // TODO should wait for the db thread(s) to stop (!!)
            this.closeDatabase(dbname);
        }

        File dbfile = this.cordova.getActivity().getDatabasePath(dbname);

        if (!dbfile.exists()) {
            dbfile.getParentFile().mkdirs();
        }

        Log.v("info", "Open sqlite db: " + dbfile.getAbsolutePath());

        SQLiteDatabase mydb = SQLiteDatabase.openOrCreateDatabase(dbfile, null);

        dbmap.put(dbname, mydb);
    }

    /**
     * Close a database (in another thread).
     *
     * @param dbName   The name of the database file
     */
    private void closeDatabase(String dbName) {
        DBRunner r = rmap.get(dbName);
        if (r != null) {
            try {
                r.q.put(new DBQuery(true, null));
            } catch(Exception e) {
                Log.e(SQLitePlugin.class.getSimpleName(), "couldn't close database", e);
            }
        }
    }

    /**
     * Close a database (in the current thread).
     *
     * @param dbName   The name of the database file
     */
    private void closeDatabaseNow(String dbName) {
        SQLiteDatabase mydb = this.getDatabase(dbName);

        if (mydb != null) {
            mydb.close();
            dbmap.remove(dbName);
        }
    }

    /**
     * Delete a database.
     *
     * @param dbName   The name of the database file
     *
     * @return true if successful or false if an exception was encountered
     */
    @SuppressLint("NewApi")
    private boolean deleteDatabase(String dbname) {
        if (this.getDatabase(dbname) != null) {
            // TODO: if the db is open, put request in the q to close & delete the db (instead)
            this.closeDatabaseNow(dbname);
        }

        File dbfile = this.cordova.getActivity().getDatabasePath(dbname);

        if (android.os.Build.VERSION.SDK_INT >= 11) {
            // Use try & catch just in case android.os.Build.VERSION.SDK_INT >= 16 was lying:
            try {
                return SQLiteDatabase.deleteDatabase(dbfile);
            } catch (Exception e) {
                Log.e(SQLitePlugin.class.getSimpleName(), "couldn't delete because old SDK_INT", e);
                return deleteDatabasePreHoneycomb(dbfile);
            }
        } else {
            // use old API
            return deleteDatabasePreHoneycomb(dbfile);
        }
    }

    private boolean deleteDatabasePreHoneycomb(File dbfile) {
        try {
            return cordova.getActivity().deleteDatabase(dbfile.getAbsolutePath());
        } catch (Exception e) {
            Log.e(SQLitePlugin.class.getSimpleName(), "couldn't delete database", e);
            return false;
        }
    }

    /**
     * Get a database from the db map.
     *
     * @param dbname The name of the database.
     */
    private SQLiteDatabase getDatabase(String dbname) {
        return dbmap.get(dbname);
    }

    /**
     * Executes a batch request and sends the results via cbc.
     *
     * @param dbname     The name of the database.
     * @param queryarr   Array of query strings
     * @param jsonparams Array of JSON query parameters
     * @param queryIDs   Array of query ids
     * @param cbc        Callback context from Cordova API
     */
    @SuppressLint("NewApi")
    private void executeSqlBatch(String dbname, String[] queryarr, JSONArray[] jsonparams,
                                 String[] queryIDs, CallbackContext cbc) {

        SQLiteDatabase mydb = getDatabase(dbname);

        if (mydb == null) {
            // auto-open; this is something we have to support
            // since the API allows the user to delete a database and then re-use it
            // TBD/TODO: this case should not be allowed. The JS API should
            // invalidate its internal db handle if the db file is deleted.
            openDatabase(dbname);
            mydb = getDatabase(dbname);
        }


        String query = "";
        String query_id = "";
        int len = queryarr.length;
        JSONArray batchResults = new JSONArray();

        for (int i = 0; i < len; i++) {
            int rowsAffectedCompat = 0;
            boolean needRowsAffectedCompat = false;
            query_id = queryIDs[i];

            JSONObject queryResult = null;
            String errorMessage = "unknown";

            try {
                boolean needRawQuery = true;

                query = queryarr[i];

                QueryType queryType = getQueryType(query);

                if (queryType == QueryType.update || queryType == queryType.delete) {
                    if (android.os.Build.VERSION.SDK_INT >= 11) {
                        SQLiteStatement myStatement = mydb.compileStatement(query);

                        if (jsonparams != null) {
                            bindArgsToStatement(myStatement, jsonparams[i]);
                        }

                        int rowsAffected = -1; // (assuming invalid)

                        // Use try & catch just in case android.os.Build.VERSION.SDK_INT >= 11 is lying:
                        try {
                            rowsAffected = myStatement.executeUpdateDelete();
                            // Indicate valid results:
                            needRawQuery = false;
                        } catch (SQLiteException ex) {
                            // Indicate problem & stop this query:
                            ex.printStackTrace();
                            errorMessage = ex.getMessage();
                            Log.v("executeSqlBatch", "SQLiteStatement.executeUpdateDelete(): Error=" + errorMessage);
                            needRawQuery = false;
                        } catch (Exception ex) {
                            // Assuming SDK_INT was lying & method not found:
                            // do nothing here & try again with raw query.
                        }

                        if (rowsAffected != -1) {
                            queryResult = new JSONObject();
                            queryResult.put("rowsAffected", rowsAffected);
                        }
                    } else { // pre-honeycomb
                        rowsAffectedCompat = countRowsAffectedCompat(queryType, query, jsonparams, mydb, i);
                        needRowsAffectedCompat = true;
                    }
                }

                // INSERT:
                if (queryType == QueryType.insert && jsonparams != null) {
                    needRawQuery = false;

                    SQLiteStatement myStatement = mydb.compileStatement(query);

                    bindArgsToStatement(myStatement, jsonparams[i]);

                    long insertId = -1; // (invalid)

                    try {
                        insertId = myStatement.executeInsert();
                    } catch (SQLiteException ex) {
                        ex.printStackTrace();
                        errorMessage = ex.getMessage();
                        Log.v("executeSqlBatch", "SQLiteDatabase.executeInsert(): Error=" + errorMessage);
                    }

                    if (insertId != -1) {
                        queryResult = new JSONObject();
                        queryResult.put("insertId", insertId);
                        queryResult.put("rowsAffected", 1);
                    }
                }

                if (queryType == QueryType.begin) {
                    needRawQuery = false;
                    try {
                        mydb.beginTransaction();

                        queryResult = new JSONObject();
                        queryResult.put("rowsAffected", 0);
                    } catch (SQLiteException ex) {
                        ex.printStackTrace();
                        errorMessage = ex.getMessage();
                        Log.v("executeSqlBatch", "SQLiteDatabase.beginTransaction(): Error=" + errorMessage);
                    }
                }

                if (queryType == QueryType.commit) {
                    needRawQuery = false;
                    try {
                        mydb.setTransactionSuccessful();
                        mydb.endTransaction();

                        queryResult = new JSONObject();
                        queryResult.put("rowsAffected", 0);
                    } catch (SQLiteException ex) {
                        ex.printStackTrace();
                        errorMessage = ex.getMessage();
                        Log.v("executeSqlBatch", "SQLiteDatabase.setTransactionSuccessful/endTransaction(): Error=" + errorMessage);
                    }
                }

                if (queryType == QueryType.rollback) {
                    needRawQuery = false;
                    try {
                        mydb.endTransaction();

                        queryResult = new JSONObject();
                        queryResult.put("rowsAffected", 0);
                    } catch (SQLiteException ex) {
                        ex.printStackTrace();
                        errorMessage = ex.getMessage();
                        Log.v("executeSqlBatch", "SQLiteDatabase.endTransaction(): Error=" + errorMessage);
                    }
                }

                // raw query for other statements:
                if (needRawQuery) {
                    queryResult = this.executeSqlStatementQuery(mydb, query, jsonparams[i], cbc);

                    if (needRowsAffectedCompat) {
                        queryResult.put("rowsAffected", rowsAffectedCompat);
                    }
                }
            } catch (Exception ex) {
                ex.printStackTrace();
                errorMessage = ex.getMessage();
                Log.v("executeSqlBatch", "SQLitePlugin.executeSql[Batch](): Error=" + errorMessage);
            }

            try {
                if (queryResult != null) {
                    JSONObject r = new JSONObject();
                    r.put("qid", query_id);

                    r.put("type", "success");
                    r.put("result", queryResult);

                    batchResults.put(r);
                } else {
                    JSONObject r = new JSONObject();
                    r.put("qid", query_id);
                    r.put("type", "error");

                    JSONObject er = new JSONObject();
                    er.put("message", errorMessage);
                    r.put("result", er);

                    batchResults.put(r);
                }
            } catch (JSONException ex) {
                ex.printStackTrace();
                Log.v("executeSqlBatch", "SQLitePlugin.executeSql[Batch](): Error=" + ex.getMessage());
                // TODO what to do?
            }
        }

        cbc.success(batchResults);
    }

    private int countRowsAffectedCompat(QueryType queryType, String query, JSONArray[] jsonparams,
                                         SQLiteDatabase mydb, int i) throws JSONException {
        // quick and dirty way to calculate the rowsAffected in pre-Honeycomb.  just do a SELECT
        // beforehand using the same WHERE clause. might not be perfect, but it's better than nothing
        Matcher whereMatcher = WHERE_CLAUSE.matcher(query);

        String where = "";

        int pos = 0;
        while (whereMatcher.find(pos)) {
            where = " WHERE " + whereMatcher.group(1);
            pos = whereMatcher.start(1);
        }
        // WHERE clause may be omitted, and also be sure to find the last one,
        // e.g. for cases where there's a subquery

        // bindings may be in the update clause, so only take the last n
        int numQuestionMarks = 0;
        for (int j = 0; j < where.length(); j++) {
            if (where.charAt(j) == '?') {
                numQuestionMarks++;
            }
        }

        JSONArray subParams = null;

        if (jsonparams != null) {
            // only take the last n of every array of sqlArgs
            JSONArray origArray = jsonparams[i];
            subParams = new JSONArray();
            int startPos = origArray.length() - numQuestionMarks;
            for (int j = startPos; j < origArray.length(); j++) {
                subParams.put(j - startPos, origArray.get(j));
            }
        }

        if (queryType == QueryType.update) {
            Matcher tableMatcher = UPDATE_TABLE_NAME.matcher(query);
            if (tableMatcher.find()) {
                String table = tableMatcher.group(1);
                try {
                    SQLiteStatement statement = mydb.compileStatement(
                            "SELECT count(*) FROM " + table + where);

                    if (subParams != null) {
                        bindArgsToStatement(statement, subParams);
                    }

                    return (int)statement.simpleQueryForLong();
                } catch (Exception e) {
                    // assume we couldn't count for whatever reason, keep going
                    Log.e(SQLitePlugin.class.getSimpleName(), "uncaught", e);
                }
            }
        } else { // delete
            Matcher tableMatcher = DELETE_TABLE_NAME.matcher(query);
            if (tableMatcher.find()) {
                String table = tableMatcher.group(1);
                try {
                    SQLiteStatement statement = mydb.compileStatement(
                            "SELECT count(*) FROM " + table + where);
                    bindArgsToStatement(statement, subParams);

                    return (int)statement.simpleQueryForLong();
                } catch (Exception e) {
                    // assume we couldn't count for whatever reason, keep going
                    Log.e(SQLitePlugin.class.getSimpleName(), "uncaught", e);

                }
            }
        }

        return 0;
    }

    private QueryType getQueryType(String query) {
        Matcher matcher = FIRST_WORD.matcher(query);
        if (matcher.find()) {
            try {
                return QueryType.valueOf(matcher.group(1).toLowerCase());
            } catch (IllegalArgumentException ignore) {
                // unknown verb
            }
        }
        return QueryType.other;
    }

    private void bindArgsToStatement(SQLiteStatement myStatement, JSONArray sqlArgs) throws JSONException {
        for (int i = 0; i < sqlArgs.length(); i++) {
            if (sqlArgs.get(i) instanceof Float || sqlArgs.get(i) instanceof Double) {
                myStatement.bindDouble(i + 1, sqlArgs.getDouble(i));
            } else if (sqlArgs.get(i) instanceof Number) {
                myStatement.bindLong(i + 1, sqlArgs.getLong(i));
            } else if (sqlArgs.isNull(i)) {
                myStatement.bindNull(i + 1);
            } else {
                myStatement.bindString(i + 1, sqlArgs.getString(i));
            }
        }
    }

    /**
     * Get rows results from query cursor.
     *
     * @param cur Cursor into query results
     * @return results in string form
     */
    private JSONObject executeSqlStatementQuery(SQLiteDatabase mydb,
                                                String query, JSONArray paramsAsJson,
                                                CallbackContext cbc) throws Exception {
        JSONObject rowsResult = new JSONObject();

        Cursor cur = null;
        try {
            String[] params = null;

            params = new String[paramsAsJson.length()];

            for (int j = 0; j < paramsAsJson.length(); j++) {
                if (paramsAsJson.isNull(j))
                    params[j] = "";
                else
                    params[j] = paramsAsJson.getString(j);
            }

            cur = mydb.rawQuery(query, params);
        } catch (Exception ex) {
            ex.printStackTrace();
            String errorMessage = ex.getMessage();
            Log.v("executeSqlBatch", "SQLitePlugin.executeSql[Batch](): Error=" + errorMessage);
            throw ex;
        }

        // If query result has rows
        if (cur != null && cur.moveToFirst()) {
            JSONArray rowsArrayResult = new JSONArray();
            String key = "";
            int colCount = cur.getColumnCount();

            // Build up JSON result object for each row
            do {
                JSONObject row = new JSONObject();
                try {
                    for (int i = 0; i < colCount; ++i) {
                        key = cur.getColumnName(i);

                        if (android.os.Build.VERSION.SDK_INT >= 11) {

                            // Use try & catch just in case android.os.Build.VERSION.SDK_INT >= 11 is lying:
                            try {
                                bindPostHoneycomb(row, key, cur, i);
                            } catch (Exception ex) {
                                bindPreHoneycomb(row, key, cur, i);
                            }
                        } else {
                            bindPreHoneycomb(row, key, cur, i);
                        }
                    }

                    rowsArrayResult.put(row);

                } catch (JSONException e) {
                    e.printStackTrace();
                }
            } while (cur.moveToNext());

            try {
                rowsResult.put("rows", rowsArrayResult);
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }

        if (cur != null) {
            cur.close();
        }

        return rowsResult;
    }

    @SuppressLint("NewApi")
    private void bindPostHoneycomb(JSONObject row, String key, Cursor cur, int i) throws JSONException {
        int curType = cur.getType(i);

        switch (curType) {
            case Cursor.FIELD_TYPE_NULL:
                row.put(key, JSONObject.NULL);
                break;
            case Cursor.FIELD_TYPE_INTEGER:
                row.put(key, cur.getLong(i));
                break;
            case Cursor.FIELD_TYPE_FLOAT:
                row.put(key, cur.getDouble(i));
                break;
            case Cursor.FIELD_TYPE_BLOB:
                row.put(key, new String(Base64.encode(cur.getBlob(i), Base64.DEFAULT)));
                break;
            case Cursor.FIELD_TYPE_STRING:
            default: /* (not expected) */
                row.put(key, cur.getString(i));
                break;
        }
    }

    private void bindPreHoneycomb(JSONObject row, String key, Cursor cursor, int i) throws JSONException {
        // Since cursor.getType() is not available pre-honeycomb, this is
        // a workaround so we don't have to bind everything as a string
        // Details here: http://stackoverflow.com/q/11658239
        SQLiteCursor sqLiteCursor = (SQLiteCursor) cursor;
        CursorWindow cursorWindow = sqLiteCursor.getWindow();
        int pos = cursor.getPosition();
        if (cursorWindow.isNull(pos, i)) {
            row.put(key, JSONObject.NULL);
        } else if (cursorWindow.isLong(pos, i)) {
            row.put(key, cursor.getLong(i));
        } else if (cursorWindow.isFloat(pos, i)) {
            row.put(key, cursor.getDouble(i));
        } else if (cursorWindow.isBlob(pos, i)) {
            row.put(key, new String(Base64.encode(cursor.getBlob(i), Base64.DEFAULT)));
        } else { // string
            row.put(key, cursor.getString(i));
        }
    }

    private class DBRunner implements Runnable {
        final String dbname;
        final BlockingQueue<DBQuery> q;

        DBRunner(final String dbname) {
            this.dbname = dbname;
            this.q = new LinkedBlockingQueue<DBQuery>();
        }

        public void run() {
            openDatabase(dbname);

            try {
                DBQuery dbq = q.take();

                while (!dbq.stop) {
                    executeSqlBatch(dbname, dbq.queries, dbq.jsonparams, dbq.queryIDs, dbq.cbc);

                    dbq = q.take();
                }
            } catch (Exception e) { }

            closeDatabaseNow(dbname);
        }
    }

    private final class DBQuery {
        final boolean stop;
        final String[] queries;
        final String[] queryIDs;
        final JSONArray[] jsonparams;
        final CallbackContext cbc;

        DBQuery(String[] myqueries, String[] qids, JSONArray[] params, CallbackContext c) {
            this.stop = false;
            this.queries = myqueries;
            this.queryIDs = qids;
            this.jsonparams = params;
            this.cbc = c;
        }

        DBQuery(boolean stop, CallbackContext cbc) {
            this.stop = true;
            this.queries = null;
            this.queryIDs = null;
            this.jsonparams = null;
            this.cbc = cbc;
        }
    }

    private static enum Action {
        open,
        close,
        delete,
        executeSqlBatch,
        backgroundExecuteSqlBatch,
    }

    private static enum QueryType {
        update,
        insert,
        delete,
        select,
        begin,
        commit,
        rollback,
        other
    }
}
