/*
 * PhoneGap is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 *
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010, IBM Corporation
 */
package com.phonegap.plugin.sqlitePlugin;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;

import java.lang.Number;

import java.util.HashMap;

import org.apache.cordova.api.CordovaPlugin;
import org.apache.cordova.api.CallbackContext;

import android.database.Cursor;

import android.database.sqlite.*;

import android.util.Base64;
import android.util.Log;

public class SQLitePlugin extends CordovaPlugin
{
	/**
	 * Multiple database map.
	 */
	HashMap<String, SQLiteDatabase> dbmap;

	/**
	 * Constructor.
	 */
	public SQLitePlugin() {
		dbmap = new HashMap<String, SQLiteDatabase>();
	}

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
	 *            Callback context from Cordova API (not used here)
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
				this.closeDatabase(args.getString(0));
			}
			else if (action.equals("executePragmaStatement"))
			{
				String dbName = args.getString(0);
				String query = args.getString(1);

				Cursor myCursor = this.getDatabase(dbName).rawQuery(query, null);
				this.processPragmaResults(myCursor, id);
			}
			else if (action.equals("executeSqlBatch"))
			{
				String[] 	queries 	= null;
				String[] 	queryIDs 	= null;
				String 		trans_id 	= null;
				JSONObject 	a 			= null;
				JSONArray 	jsonArr 	= null;
				int 		paramLen	= 0;
				JSONArray[] 	jsonparams 	= null;

				String dbName = args.getString(0);
				JSONArray txargs = args.getJSONArray(1);

				if (txargs.isNull(0)) {
					queries = new String[0];
				} else {
					int len = txargs.length();
					queries = new String[len];
					queryIDs = new String[len];
					jsonparams = new JSONArray[len];

					for (int i = 0; i < len; i++)
					{
						a 			= txargs.getJSONObject(i);
						queries[i] 	= a.getString("query");
						queryIDs[i] = a.getString("query_id");
						trans_id 	= a.getString("trans_id");
						jsonArr 	= a.getJSONArray("params");
						paramLen	= jsonArr.length();
						jsonparams[i] 	= jsonArr;
					}
				}
				if(trans_id != null)
					this.executeSqlBatch(dbName, queries, jsonparams, queryIDs, trans_id);
				else
					Log.v("error", "null trans_id");
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
		while (!this.dbmap.isEmpty()) {
			String dbname = this.dbmap.keySet().iterator().next();
			this.closeDatabase(dbname);
			this.dbmap.remove(dbname);
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
			this.dbmap.remove(dbName);
		}
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
	 * @param tx_id
	 *            Transaction id
	 *
	 */
	private void executeSqlBatch(String dbname, String[] queryarr, JSONArray[] jsonparams, String[] queryIDs, String tx_id)
	{
		SQLiteDatabase mydb = this.getDatabase(dbname);

		if (mydb == null) return;

		try {
			mydb.beginTransaction();

			String query = "";
			String query_id = "";
			int len = queryarr.length;

			for (int i = 0; i < len; i++) {
				query = queryarr[i];
				query_id = queryIDs[i];
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

					String result = "{'insertId':'" + insertId + "'}";
					this.sendJavascriptCB("window.SQLitePluginTransactionCB.queryCompleteCallback('" +
						tx_id + "','" + query_id + "', " + result + ");");
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

					if(query_id.length() > 0)
						this.processResults(myCursor, query_id, tx_id);

					myCursor.close();
				}
			}
			mydb.setTransactionSuccessful();
		}
		catch (SQLiteException ex) {
			ex.printStackTrace();
			Log.v("executeSqlBatch", "SQLitePlugin.executeSql(): Error=" +  ex.getMessage());
			this.sendJavascriptCB("window.SQLitePluginTransactionCB.txErrorCallback('" + tx_id + "', '"+ex.getMessage()+"');");
		} catch (JSONException ex) {
			ex.printStackTrace();
			Log.v("executeSqlBatch", "SQLitePlugin.executeSql(): Error=" +  ex.getMessage());
			this.sendJavascriptCB("window.SQLitePluginTransactionCB.txErrorCallback('" + tx_id + "', '"+ex.getMessage()+"');");
		}
		finally {
			mydb.endTransaction();
			Log.v("executeSqlBatch", tx_id);
			this.sendJavascriptCB("window.SQLitePluginTransactionCB.txCompleteCallback('" + tx_id + "');");
		}
	}

	/**
	 * Process query results.
	 *
	 * @param cur
	 *            Cursor into query results
	 *
	 * @param query_id
	 *            Query id
	 *
	 * @param tx_id
	 *            Transaction id
	 *
	 */
	private void processResults(Cursor cur, String query_id, String tx_id)
	{
		String result = this.results2string(cur);

		this.sendJavascriptCB("window.SQLitePluginTransactionCB.queryCompleteCallback('" +
			tx_id + "','" + query_id + "', " + result + ");");
	}

	/**
	 * Process query results.
	 *
	 * @param cur
	 *            Cursor into query results
	 *
	 * @param id
	 *            Caller db id
	 *
	 */
	private void processPragmaResults(Cursor cur, String id)
	{
		String result = this.results2string(cur);

		this.sendJavascriptCB("window.SQLitePluginCallback.p1('" + id + "', " + result + ");");
	}

	/**
	 * Convert results cursor to JSON string.
	 *
	 * @param cur
	 *            Cursor into query results
	 *
	 * @return results in string form
	 *
	 */
	private String results2string(Cursor cur)
	{
		String result = "[]";

		// If query result has rows
		if (cur.moveToFirst()) {
			JSONArray fullresult = new JSONArray();
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
									row.put(key, null);
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

					fullresult.put(row);

				} catch (JSONException e) {
					e.printStackTrace();
				}

			} while (cur.moveToNext());

			result = fullresult.toString();
		}

		return result;
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
}
