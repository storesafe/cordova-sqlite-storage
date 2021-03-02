/*
 * Copyright (c) 2012-present Christopher J. Brody (aka Chris Brody)
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010, IBM Corporation
 */

package io.sqlc;

import android.util.Log;

import java.io.File;

import java.lang.Number;

import java.sql.SQLException;

import org.apache.cordova.CallbackContext;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import io.liteglue.SQLCode;
import io.liteglue.SQLColumnType;
import io.liteglue.SQLiteConnector;
import io.liteglue.SQLiteConnection;
import io.liteglue.SQLiteOpenFlags;
import io.liteglue.SQLiteStatement;

/**
 * Android SQLite-Connector Database helper class
 */
class SQLiteConnectorDatabase extends SQLiteAndroidDatabase
{
    static SQLiteConnector connector = new SQLiteConnector();

    SQLiteConnection mydb;

    /**
     * NOTE: Using default constructor, no explicit constructor.
     */


    /**
     * Open a database.
     *
     * @param dbFile   The database File specification
     */
    @Override
    void open(File dbFile) throws Exception {
        mydb = connector.newSQLiteConnection(dbFile.getAbsolutePath(),
          SQLiteOpenFlags.READWRITE | SQLiteOpenFlags.CREATE);
    }

    /**
     * Close a database (in the current thread).
     */
    @Override
    void closeDatabaseNow() {
        try {
          if (mydb != null)
            mydb.dispose();
        } catch (Exception e) {
            Log.e(SQLitePlugin.class.getSimpleName(), "couldn't close database, ignoring", e);
        }
    }

    /**
     * Ignore Android bug workaround for NDK version
     */
    @Override
    void bugWorkaround() { }

    /**
     * Executes a batch request and sends the results via cbc.
     *
     * @param dbname     The name of the database.
     * @param queryarr   Array of query strings
     * @param jsonparams Array of JSON query parameters
     * @param cbc        Callback context from Cordova API
     */
    @Override
    void executeSqlBatch( String[] queryarr, JSONArray[] jsonparams, CallbackContext cbc) {

        if (mydb == null) {
            // not allowed - can only happen if someone has closed (and possibly deleted) a database and then re-used the database
            cbc.error("database has been closed");
            return;
        }

        int len = queryarr.length;
        JSONArray batchResults = new JSONArray();

        for (int i = 0; i < len; i++) {
            int rowsAffectedCompat = 0;
            boolean needRowsAffectedCompat = false;

            JSONObject queryResult = null;

            String errorMessage = "unknown";
            int sqliteErrorCode = -1;
            int code = 0; // SQLException.UNKNOWN_ERR

            try {
                String query = queryarr[i];

                long lastTotal = mydb.getTotalChanges();
                queryResult = this.executeSQLiteStatement(query, jsonparams[i], cbc);
                long newTotal = mydb.getTotalChanges();
                long rowsAffected = newTotal - lastTotal;

                queryResult.put("rowsAffected", rowsAffected);
                if (rowsAffected > 0) {
                    long insertId = mydb.getLastInsertRowid();
                    if (insertId > 0) {
                        queryResult.put("insertId", insertId);
                    }
                }
            } catch (SQLException ex) {
                ex.printStackTrace();
                sqliteErrorCode = ex.getErrorCode();
                errorMessage = ex.getMessage();
                Log.v("executeSqlBatch", "SQLitePlugin.executeSql[Batch](): SQL Error code = " + sqliteErrorCode + " message = " + errorMessage);

                switch(sqliteErrorCode) {
                case SQLCode.ERROR:
                    code = 5; // SQLException.SYNTAX_ERR
                    break;
                case 13: // SQLITE_FULL
                    code = 4; // SQLException.QUOTA_ERR
                    break;
                case SQLCode.CONSTRAINT:
                    code = 6; // SQLException.CONSTRAINT_ERR
                    break;
                default:
                    /* do nothing */
                }
            } catch (JSONException ex) {
                // NOT expected:
                ex.printStackTrace();
                errorMessage = ex.getMessage();
                code = 0; // SQLException.UNKNOWN_ERR
                Log.e("executeSqlBatch", "SQLitePlugin.executeSql[Batch](): UNEXPECTED JSON Error=" + errorMessage);
            }

            try {
                if (queryResult != null) {
                    JSONObject r = new JSONObject();

                    r.put("type", "success");
                    r.put("result", queryResult);

                    batchResults.put(r);
                } else {
                    JSONObject r = new JSONObject();
                    r.put("type", "error");

                    JSONObject er = new JSONObject();
                    er.put("message", errorMessage);
                    er.put("code", code);
                    r.put("result", er);

                    batchResults.put(r);
                }
            } catch (JSONException ex) {
                ex.printStackTrace();
                Log.e("executeSqlBatch", "SQLitePlugin.executeSql[Batch](): Error=" + ex.getMessage());
                // TODO what to do?
            }
        }

        cbc.success(batchResults);
    }

    /**
     * Get rows results from query cursor.
     *
     * @param cur Cursor into query results
     * @return results in string form
     */
    private JSONObject executeSQLiteStatement(String query, JSONArray paramsAsJson,
                                              CallbackContext cbc) throws JSONException, SQLException {
        JSONObject rowsResult = new JSONObject();

        boolean hasRows = false;

        SQLiteStatement myStatement = mydb.prepareStatement(query);

        try {
            String[] params = null;

            params = new String[paramsAsJson.length()];

            for (int i = 0; i < paramsAsJson.length(); ++i) {
                if (paramsAsJson.isNull(i)) {
                    myStatement.bindNull(i + 1);
                } else {
                    Object p = paramsAsJson.get(i);
                    if (p instanceof Float || p instanceof Double)
                        myStatement.bindDouble(i + 1, paramsAsJson.getDouble(i));
                    else if (p instanceof Number)
                        myStatement.bindLong(i + 1, paramsAsJson.getLong(i));
                    else
                        myStatement.bindTextNativeString(i + 1, paramsAsJson.getString(i));
                }
            }

            hasRows = myStatement.step();
        } catch (SQLException ex) {
            ex.printStackTrace();
            String errorMessage = ex.getMessage();
            Log.v("executeSqlBatch", "SQLitePlugin.executeSql[Batch](): Error=" + errorMessage);

            // cleanup statement and throw the exception:
            myStatement.dispose();
            throw ex;
        } catch (JSONException ex) {
            ex.printStackTrace();
            String errorMessage = ex.getMessage();
            Log.v("executeSqlBatch", "SQLitePlugin.executeSql[Batch](): Error=" + errorMessage);

            // cleanup statement and throw the exception:
            myStatement.dispose();
            throw ex;
        }

        // If query result has rows
        if (hasRows) {
            JSONArray rowsArrayResult = new JSONArray();
            String key = "";
            int colCount = myStatement.getColumnCount();

            // Build up JSON result object for each row
            do {
                JSONObject row = new JSONObject();
                try {
                    for (int i = 0; i < colCount; ++i) {
                        key = myStatement.getColumnName(i);

                        switch (myStatement.getColumnType(i)) {
                        case SQLColumnType.NULL:
                            row.put(key, JSONObject.NULL);
                            break;

                        case SQLColumnType.REAL:
                            row.put(key, myStatement.getColumnDouble(i));
                            break;

                        case SQLColumnType.INTEGER:
                            row.put(key, myStatement.getColumnLong(i));
                            break;

                        case SQLColumnType.BLOB:
                        case SQLColumnType.TEXT:
                        default: // (just in case)
                            row.put(key, myStatement.getColumnTextNativeString(i));
                        }

                    }

                    rowsArrayResult.put(row);

                } catch (JSONException e) {
                    e.printStackTrace();
                }
            } while (myStatement.step());

            try {
                rowsResult.put("rows", rowsArrayResult);
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }

        myStatement.dispose();

        return rowsResult;
    }

} /* vim: set expandtab : */
