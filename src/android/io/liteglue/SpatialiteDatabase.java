/*
 * Copyright (c) 2012-2015, Chris Brody
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010, IBM Corporation
 */

package io.liteglue;

import android.annotation.SuppressLint;
import android.database.sqlite.SQLiteException;
import android.util.Log;
import jsqlite.*;
import jsqlite.Exception;
import org.apache.cordova.CallbackContext;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Spatialite Database helper class
 */
class SpatialiteDatabase {
    private static final Pattern FIRST_WORD = Pattern.compile("^\\s*(\\S+)",
            Pattern.CASE_INSENSITIVE);

    @SuppressWarnings({"FieldCanBeLocal", "unused"})
    private File dbFile;
    private Database db;

    /**
     * Open a database.
     *
     * @param dbfile The database File specification
     */
    void open(File dbfile) throws Exception {
        dbFile = dbfile; // for possible bug workaround
        if (!dbfile.exists()) {
            throw new IllegalArgumentException("No such db file: "
                    + dbfile);
        }
        Log.d(SpatialiteDatabase.class.getSimpleName(), "Open sqlite db: " + dbfile.getAbsolutePath());
        db = new Database();
        db.open(dbfile.getAbsolutePath(), Constants.SQLITE_OPEN_READWRITE);
        Log.d(SpatialiteDatabase.class.getSimpleName(), "DB version: " + db.dbversion());
    }

    /**
     * Close a database (in the current thread).
     */
    void closeDatabaseNow() {
        if (db != null) {
            try {
                db.close();
            } catch (Exception e) {
                e.printStackTrace();
                Log.v(SpatialiteDatabase.class.getSimpleName(), "closeDatabaseNow(): Error=" + e.getMessage());
            }
            db = null;
        }
    }

    /**
     * Executes a batch request and sends the results via cbc.
     *
     * @param queryarr   Array of query strings
     * @param jsonparams Array of JSON query parameters
     * @param queryIDs   Array of query ids
     * @param cbc        Callback context from Cordova API
     */
    @SuppressLint("NewApi")
    void executeSqlBatch(String[] queryarr, JSONArray[] jsonparams,
                         String[] queryIDs, CallbackContext cbc) {

        if (db == null) {
            // not allowed - can only happen if someone has closed (and possibly deleted) a database and then re-used the database
            cbc.error("database has been closed");
            return;
        }

        JSONArray batchResults = new JSONArray();

        for (int i = 0; i < queryarr.length; i++) {
            String queryId = queryIDs[i];
            JSONObject queryResult = executeQuery(queryarr, jsonparams, i);

            try {
                if (queryResult == null) {
                    JSONObject r = new JSONObject();
                    r.put("qid", queryId);
                    r.put("type", "error");

                    JSONObject er = new JSONObject();
                    String errorMessage = "unknown";
                    er.put("message", errorMessage);
                    r.put("result", er);

                    batchResults.put(r);
                } else {
                    JSONObject r = new JSONObject();
                    r.put("qid", queryId);

                    r.put("type", "success");
                    r.put("result", queryResult);

                    batchResults.put(r);
                }
            } catch (JSONException ex) {
                ex.printStackTrace();
                Log.e("executeSqlBatch", "SpatialiteDatabase.executeSql[Batch](): Error=" + ex.getMessage(), ex);
            }
        }

        cbc.success(batchResults);
    }

    private JSONObject executeQuery(String[] queryarr, JSONArray[] jsonparams, int i) {
        JSONObject queryResult = null;
        try {

            String query = queryarr[i];

            Log.v("executeSqlBatch", "Fire sql query to DB: [" + query + ']');
            QueryType queryType = getQueryType(query);

            boolean needRawQuery = true;
            if (queryType == QueryType.update || queryType == QueryType.delete) {
                long rowsAffected = -1L; // (assuming invalid)

                try {
                    if (jsonparams == null) {
                        db.exec(query, null);
                    } else {
                        String[] arguments = getStringArgs(jsonparams[i]);
                        db.exec(query, null, arguments);
                    }

                    rowsAffected = db.changes();
                    // Indicate valid results:
                    needRawQuery = false;
                    Log.v("executeSqlBatch", "Rows affected: " + rowsAffected);
                } catch (java.lang.Exception ex) {
                    // Indicate problem & stop this query:
                    ex.printStackTrace();
                    Log.e("executeSqlBatch", "Stmt.executeUpdateDelete(): Error=" + ex.getMessage(), ex);
                    needRawQuery = false;
                }

                if (rowsAffected != -1L) {
                    queryResult = new JSONObject();
                    queryResult.put("rowsAffected", rowsAffected);
                }
            }

            // INSERT:
            if (queryType == QueryType.insert) {
                needRawQuery = false;

                try {
                    if (jsonparams == null) {
                        Log.w("executeSqlBatch", "Executing insert query without parameters!");
                        db.exec(query, null);
                    } else {
                        String[] arguments = getStringArgs(jsonparams[i]);
                        db.exec(query, null, arguments);
                    }

                    long insertId = db.last_insert_rowid();

                    // statement has finished with no constraint violation:
                    queryResult = new JSONObject();
                    if (insertId == -1L) {
                        queryResult.put("rowsAffected", 0);
                        Log.w("executeSqlBatch", "No row was inserted from statement!");
                    } else {
                        queryResult.put("insertId", insertId);
                        queryResult.put("rowsAffected", 1);
                        Log.v("executeSqlBatch", "Inserted row with id [" + insertId + ']');
                    }
                } catch (SQLiteException ex) {
                    // report error result with the error message
                    // could be constraint violation or some other error
                    ex.printStackTrace();
                    Log.e("executeSqlBatch", "Database.executeInsert(): Error=" + ex.getMessage(), ex);
                }
            }

            if (queryType == QueryType.begin) {
                needRawQuery = false;
                try {
                    db.exec(query, null);
                    Log.v("executeSqlBatch", "Transaction started");
                    queryResult = new JSONObject(); // otherwise the javascript plugin thinks the statement failed
                } catch (SQLiteException ex) {
                    ex.printStackTrace();
                    Log.e("executeSqlBatch", "Database.beginTransaction(): Error=" + ex.getMessage(), ex);
                }
            }

            if (queryType == QueryType.commit) {
                needRawQuery = false;
                try {
                    db.exec(query, null);
                    Log.v("executeSqlBatch", "Transaction committed");
                    queryResult = new JSONObject(); // otherwise the javascript plugin thinks the statement failed
                } catch (SQLiteException ex) {
                    ex.printStackTrace();
                    Log.e("executeSqlBatch", "Database.commitTransaction(): Error=" + ex.getMessage(), ex);
                }
            }

            if (queryType == QueryType.rollback) {
                needRawQuery = false;
                try {
                    db.exec(query, null);
                    Log.v("executeSqlBatch", "Transaction rolled back");
                    queryResult = new JSONObject(); // otherwise the javascript plugin thinks the statement failed
                } catch (SQLiteException ex) {
                    ex.printStackTrace();
                    Log.e("executeSqlBatch", "Database.endTransaction(): Error=" + ex.getMessage(), ex);
                }
            }

            // raw query for other statements:
            if (needRawQuery) {
                queryResult = executeSqlStatementQuery(query, jsonparams[i]);
            }
        } catch (java.lang.Exception ex) {
            ex.printStackTrace();
            Log.e("executeSqlBatch", "SpatialiteDatabase.executeSql[Batch](): Error=" + ex.getMessage(), ex);
        }
        return queryResult;
    }

    private static void bindArgsToStatement(Stmt myStatement, JSONArray sqlArgs) throws JSONException, jsqlite.Exception {
        for (int i = 0; i < sqlArgs.length(); i++) {
            if (sqlArgs.get(i) instanceof Float || sqlArgs.get(i) instanceof Double) {
                myStatement.bind(i + 1, sqlArgs.getDouble(i));
            } else if (sqlArgs.get(i) instanceof Number) {
                myStatement.bind(i + 1, sqlArgs.getLong(i));
            } else if (sqlArgs.isNull(i)) {
                myStatement.bind(i + 1);
            } else {
                myStatement.bind(i + 1, sqlArgs.getString(i));
            }
        }
    }

    private static String[] getStringArgs(JSONArray sqlArgs) throws JSONException {
        String[] result = new String[sqlArgs.length()];
        for (int i = 0; i < sqlArgs.length(); i++) {
            result[i] = sqlArgs.getString(i);
        }
        return result;
    }

    private JSONObject executeSqlStatementQuery(String query, JSONArray paramsAsJson) throws Exception, JSONException {
        JSONObject rowsResult = new JSONObject();
        Stmt stmt;
        try {
            stmt = db.prepare(query);
            if (paramsAsJson != null) {
                bindArgsToStatement(stmt, paramsAsJson);
            }

            JSONArray rowsArrayResult = new JSONArray();
            while (stmt.step()) {
                JSONObject row = new JSONObject();
                for (int i = 0; i < stmt.column_count(); i++) {
                    Object columnValue = stmt.column(i);
                    row.put(stmt.column_name(i), columnValue == null ? stmt.column_string(i) : columnValue);
                }
                rowsArrayResult.put(row);
            }

            rowsResult.put("rows", rowsArrayResult);
            Log.v("executeSqlBatch", "Statement result size: " + rowsArrayResult.length());
        } catch (Exception ex) {
            ex.printStackTrace();
            Log.e("executeSqlBatch", "SpatialiteDatabase.executeSql[Batch](): Error=" + ex.getMessage(), ex);
            throw ex;
        }
        stmt.close();

        return rowsResult;
    }

    private static QueryType getQueryType(CharSequence query) {
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

    private enum QueryType {
        update,
        insert,
        delete,
        select,
        begin,
        commit,
        rollback,
        other
    }
} /* vim: set expandtab : */
