/*
 * PhoneGap is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 *
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010, IBM Corporation
 */
package org.pgsqlite;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;

import java.lang.Number;

import java.util.HashMap;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;

import android.database.Cursor;

import android.database.sqlite.*;

import android.util.Base64;
import android.util.Log;

public class SQLitePlugin extends CordovaPlugin
{
	/**
	 * Multiple database map (static).
	 */
	static HashMap<String, SQLiteDatabase> dbmap = new HashMap<String, SQLiteDatabase>();

	/**
	 * Get a SQLiteDatabase reference from the db map (public static accessor).
	 *
	 * @param dbname
	 *            The name of the database.
	 *
	 */
	public static SQLiteDatabase getSQLiteDatabase(String dbname)
	{
		return dbmap.get(dbname);
	}

	/**
	 * NOTE: Using default constructor, explicit constructor no longer required.
	 */

	/**
	 * Executes the request and returns PluginResult.
	 *
	 * @param action
	 *            The action to execute.
	 *
	 * @param args
	 *            JSONArry of arguments for the plugin.
	 *
	 * @param cbc
	 *            Callback context from Cordova API
	 *
	 */
	@Override
	public boolean execute(String action, JSONArray args, CallbackContext cbc)
	{
		try {
			if (action.equals("open")) {
				JSONObject o = args.getJSONObject(0);
				String dbname = o.getString("name");

				this.openDatabase(dbname, null);
			}
			else if (action.equals("close")) {
				JSONObject o = args.getJSONObject(0);
				String dbname = o.getString("path");

				this.closeDatabase(dbname);
			}
			else if (action.equals("delete")) {
				JSONObject o = args.getJSONObject(0);
				String dbname = o.getString("path");

				this.deleteDatabase(dbname);
			}
			else if (action.equals("executePragmaStatement"))
			{
				String dbName = args.getString(0);
				String query = args.getString(1);

				JSONArray jparams = (args.length() < 3) ? null : args.getJSONArray(2);

				String[] params = null;

				if (jparams != null) {
					params = new String[jparams.length()];

					for (int j = 0; j < jparams.length(); j++) {
						if (jparams.isNull(j))
							params[j] = "";
						else
							params[j] = jparams.getString(j);
					}
				}

				Cursor myCursor = this.getDatabase(dbName).rawQuery(query, params);

				String result = this.getRowsResultFromQuery(myCursor).getJSONArray("rows").toString();

				this.sendJavascriptCB("window.SQLitePluginCallback.p1('" + id + "', " + result + ");");
			}
			else if (action.equals("executeSqlBatch") || action.equals("executeBatchTransaction") || action.equals("backgroundExecuteSqlBatch"))
			{
				String[] 	queries 	= null;
				String[] 	queryIDs 	= null;

				JSONArray 	jsonArr 	= null;
				int 		paramLen	= 0;
				JSONArray[] 	jsonparams 	= null;

				JSONObject allargs = args.getJSONObject(0);
				JSONObject dbargs = allargs.getJSONObject("dbargs");
				String dbName = dbargs.getString("dbname");
				JSONArray txargs = allargs.getJSONArray("executes");

				if (txargs.isNull(0)) {
					queries = new String[0];
				} else {
					int len = txargs.length();
					queries = new String[len];
					queryIDs = new String[len];
					jsonparams = new JSONArray[len];

					for (int i = 0; i < len; i++)
					{
						JSONObject a	= txargs.getJSONObject(i);
						queries[i] 	= a.getString("sql");
						queryIDs[i] = a.getString("qid");
						jsonArr 	= a.getJSONArray("params");
						paramLen	= jsonArr.length();
						jsonparams[i] 	= jsonArr;
					}
				}

				boolean ex = action.equals("executeBatchTransaction");

				if (action.equals("backgroundExecuteSqlBatch"))
					this.executeSqlBatchInBackground(dbName, queries, jsonparams, queryIDs, cbc);
				else
					this.executeSqlBatch(dbName, queries, jsonparams, queryIDs, cbc);
			}

			return true;
		} catch (JSONException e) {
			// TODO: signal JSON problem to JS

			return false;
		}
	}

	/**
	 *
	 * Clean up and close all open databases.
	 *
	 */
	@Override
	public void onDestroy() {
		while (!dbmap.isEmpty()) {
			String dbname = dbmap.keySet().iterator().next();
			this.closeDatabase(dbname);
			dbmap.remove(dbname);
		}
	}

	// --------------------------------------------------------------------------
	// LOCAL METHODS
	// --------------------------------------------------------------------------

	/**
	 * Open a database.
	 *
	 * @param dbname
	 *            The name of the database-NOT including its extension.
	 *
	 * @param password
	 *            The database password or null.
	 *
	 */
	private void openDatabase(String dbname, String password)
	{
		if (this.getDatabase(dbname) != null) this.closeDatabase(dbname);

		File dbfile = this.cordova.getActivity().getDatabasePath(dbname + ".db");

		Log.v("info", "Open sqlite db: " + dbfile.getAbsolutePath());

		SQLiteDatabase mydb = SQLiteDatabase.openOrCreateDatabase(dbfile, null);

		dbmap.put(dbname, mydb);
	}

	/**
	 * Close a database.
	 *
	 * @param dbName
	 *            The name of the database-NOT including its extension.
	 *
	 */
	private void closeDatabase(String dbName)
	{
		SQLiteDatabase mydb = this.getDatabase(dbName);

		if (mydb != null)
		{
			mydb.close();
			dbmap.remove(dbName);
		}
	}

	/**
	 * Delete a database.
	 *
	 * @param dbname
	 *            The name of the database-NOT including its extension.
	 *
	 */
	private void deleteDatabase(String dbname)
	{
		if (this.getDatabase(dbname) != null) this.closeDatabase(dbname);

		File dbfile = this.cordova.getActivity().getDatabasePath(dbname + ".db");

		Log.v("info", "delete sqlite db: " + dbfile.getAbsolutePath());

		SQLiteDatabase.deleteDatabase(dbfile);
	}

	/**
	 * Get a database from the db map.
	 *
	 * @param dbname
	 *            The name of the database.
	 *
	 */
	private SQLiteDatabase getDatabase(String dbname)
	{
		return dbmap.get(dbname);
	}

	/**
	 * Executes a batch request IN BACKGROUND THREAD and sends the results via sendJavascriptCB().
	 *
	 * @param dbName
	 *            The name of the database.
	 *
	 * @param queryarr
	 *            Array of query strings
	 *
	 * @param jsonparams
	 *            Array of JSON query parameters
	 *
	 * @param queryIDs
	 *            Array of query ids
	 *
	 * @param cbc
	 *            Callback context from Cordova API
	 *
	 */
	private void executeSqlBatchInBackground(final String dbName,
		final String[] queryarr, final JSONArray[] jsonparams, final String[] queryIDs, final CallbackContext cbc)
	{
		final SQLitePlugin myself = this;

		this.cordova.getThreadPool().execute(new Runnable() {
			public void run() {
				synchronized(myself) {
					myself.executeSqlBatch(dbName, queryarr, jsonparams, queryIDs, cbc);
				}
			}
		});
	}

	/**
	 * Executes a batch request and sends the results via sendJavascriptCB().
	 *
	 * @param dbname
	 *            The name of the database.
	 *
	 * @param queryarr
	 *            Array of query strings
	 *
	 * @param jsonparams
	 *            Array of JSON query parameters
	 *
	 * @param queryIDs
	 *            Array of query ids
	 *
	 * @param cbc
	 *            Callback context from Cordova API
	 *
	 */
	private void executeSqlBatch(String dbname, String[] queryarr, JSONArray[] jsonparams, String[] queryIDs, CallbackContext cbc)
	{
		SQLiteDatabase mydb = this.getDatabase(dbname);

		if (mydb == null) return;

		String query = "";
		String query_id = "";
		int len = queryarr.length;

		JSONArray batchResults = new JSONArray();

		for (int i = 0; i < len; i++) {
			query_id = queryIDs[i];

			JSONObject queryResult = null;
			String errorMessage = null;

			try {
				query = queryarr[i];

				// /* OPTIONAL changes for new Android SDK from HERE:
				if (android.os.Build.VERSION.SDK_INT >= 11 &&
				    (query.toLowerCase().startsWith("update") ||
				     query.toLowerCase().startsWith("delete")))
				{
					SQLiteStatement myStatement = mydb.compileStatement(query);

					if (jsonparams != null) {
						for (int j = 0; j < jsonparams[i].length(); j++) {
							if (jsonparams[i].get(j) instanceof Float || jsonparams[i].get(j) instanceof Double ) {
								myStatement.bindDouble(j + 1, jsonparams[i].getDouble(j));
							} else if (jsonparams[i].get(j) instanceof Number) {
								myStatement.bindLong(j + 1, jsonparams[i].getLong(j));
							} else if (jsonparams[i].isNull(j)) {
								myStatement.bindNull(j + 1);
							} else {
								myStatement.bindString(j + 1, jsonparams[i].getString(j));
							}
						}
					}

					int rowsAffected = myStatement.executeUpdateDelete();

					queryResult = new JSONObject();
					queryResult.put("rowsAffected", rowsAffected);
				} else // to HERE. */
				if (query.toLowerCase().startsWith("insert") && jsonparams != null) {
					SQLiteStatement myStatement = mydb.compileStatement(query);

					for (int j = 0; j < jsonparams[i].length(); j++) {
						if (jsonparams[i].get(j) instanceof Float || jsonparams[i].get(j) instanceof Double ) {
							myStatement.bindDouble(j + 1, jsonparams[i].getDouble(j));
						} else if (jsonparams[i].get(j) instanceof Number) {
							myStatement.bindLong(j + 1, jsonparams[i].getLong(j));
						} else if (jsonparams[i].isNull(j)) {
							myStatement.bindNull(j + 1);
						} else {
							myStatement.bindString(j + 1, jsonparams[i].getString(j));
						}
					}

					long insertId = myStatement.executeInsert();
					
					int rowsAffected = (insertId == -1) ? 0 : 1;

					queryResult = new JSONObject();
					queryResult.put("insertId", insertId);
					queryResult.put("rowsAffected", rowsAffected);
				} else {
					String[] params = null;

					if (jsonparams != null) {
						params = new String[jsonparams[i].length()];

						for (int j = 0; j < jsonparams[i].length(); j++) {
							if (jsonparams[i].isNull(j))
								params[j] = "";
							else
								params[j] = jsonparams[i].getString(j);
						}
					}

					Cursor myCursor = mydb.rawQuery(query, params);

					if (query_id.length() > 0) {
						queryResult = this.getRowsResultFromQuery(myCursor);
					}

					myCursor.close();
				}
			} catch (Exception ex) {
				ex.printStackTrace();
				errorMessage = ex.getMessage();
				Log.v("executeSqlBatch", "SQLitePlugin.executeSql[Batch](): Error=" +  errorMessage);
			}

			try {
				if (queryResult != null) {
					JSONObject r = new JSONObject();
					r.put("qid", query_id);

					r.put("type", "success");
					r.put("result", queryResult);

					batchResults.put(r);
				} else if (errorMessage != null) {
					JSONObject r = new JSONObject();
					r.put("qid", query_id);

					r.put("type", "error");
					r.put("result", errorMessage);

					batchResults.put(r);
				}
			} catch (JSONException ex) {
				ex.printStackTrace();
				Log.v("executeSqlBatch", "SQLitePlugin.executeSql[Batch](): Error=" +  ex.getMessage());
				// TODO what to do?
			}
		}

		cbc.success(batchResults);
	}

	/**
	 * Get rows results from query cursor.
	 *
	 * @param cur
	 *            Cursor into query results
	 *
	 * @return results in string form
	 *
	 */
	private JSONObject getRowsResultFromQuery(Cursor cur)
	{
		JSONObject rowsResult = new JSONObject();

		// If query result has rows
		if (cur.moveToFirst()) {
			JSONArray rowsArrayResult = new JSONArray();
			String key = "";
			int colCount = cur.getColumnCount();

			// Build up JSON result object for each row
			do {
				JSONObject row = new JSONObject();
				try {
					for (int i = 0; i < colCount; ++i) {
						key = cur.getColumnName(i);

						// for old Android SDK remove lines from HERE:
						if(android.os.Build.VERSION.SDK_INT >= 11)
						{
							switch(cur.getType (i))
							{
								case Cursor.FIELD_TYPE_NULL:
									row.put(key, JSONObject.NULL);
									break;
								case Cursor.FIELD_TYPE_INTEGER:
									row.put(key, cur.getInt(i));
									break;
								case Cursor.FIELD_TYPE_FLOAT:
									row.put(key, cur.getFloat(i));
									break;
								case Cursor.FIELD_TYPE_STRING:
									row.put(key, cur.getString(i));
									break;
								case Cursor.FIELD_TYPE_BLOB:
									row.put(key, new String(Base64.encode(cur.getBlob(i), Base64.DEFAULT)));
									break;
							}
						}
						else // to HERE.
						{
							row.put(key, cur.getString(i));
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

		return rowsResult;
	}

	/**
	 * Send Javascript callback.
	 *
	 * @param cb
	 *            Javascript callback command to send
	 *
	 */
	private void sendJavascriptCB(String cb)
	{
		this.webView.sendJavascript(cb);
	}

	/**
	 * Send Javascript callback on GUI thread.
	 *
	 * @param cb
	 *            Javascript callback command to send
	 *
	 */
	private void sendJavascriptToGuiThread(final String cb)
	{
		final SQLitePlugin myself = this;

		this.cordova.getActivity().runOnUiThread(new Runnable() {
			public void run() {
				myself.webView.sendJavascript(cb);
			}
		});
	}
}
