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

import java.lang.Number;

import org.apache.cordova.api.Plugin;
import org.apache.cordova.api.PluginResult;

import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.*;

import java.util.HashMap;

import android.util.Log;

public class SQLitePlugin extends Plugin {
	/**
	 * Multiple database map.
	 */
	HashMap<String, SQLiteDatabase> myDbMap;

	/**
	 * Constructor.
	 */
	public SQLitePlugin() {
		myDbMap = new HashMap<String, SQLiteDatabase>();
	}

	/**
	 * Executes the request and returns PluginResult.
	 *
	 * @param action
	 *            The action to execute.
	 * @param args
	 *            JSONArry of arguments for the plugin.
	 * @param callbackId
	 *            The callback id used when calling back into JavaScript.
	 * @return A PluginResult object with a status and message.
	 */
	public PluginResult execute(String action, JSONArray args, String callbackId) {
		PluginResult.Status status = PluginResult.Status.OK;
		String result = "";

		try {
			if (action.equals("open")) {
				this.openDatabase(args.getString(0), "1",
						"database", 5000000);
				//this.openDatabase(args.getString(0), args.getString(1),
				//		args.getString(2), args.getLong(3));
			}
			// XXX TODO:
			else if (action.equals("close")) {
				Log.v("error", "NOT IMPLEMENTED"); // XXX TODO
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
			return new PluginResult(status, result);
		} catch (JSONException e) {
			return new PluginResult(PluginResult.Status.JSON_EXCEPTION);
		}
	}

	/**
	 * Identifies if action to be executed returns a value and should be run
	 * synchronously.
	 *
	 * @param action
	 *            The action to execute
	 * @return T=returns value
	 */
	public boolean isSynch(String action) {
		return true;
	}

	/**
	 * Clean up and close database.
	 */
	@Override
	public void onDestroy() {
		/** XXX TODO :
		if (this.myDb != null) {
			this.myDb.close();
			this.myDb = null;
		}
		**/
	}

	// --------------------------------------------------------------------------
	// LOCAL METHODS
	// --------------------------------------------------------------------------

	/**
	 * Open database.
	 *
	 * @param db
	 *            The name of the database including its extension.
	 * @param version
	 *            The version
	 * @param display_name
	 *            The display name
	 * @param size
	 *            The size in bytes
	 */
	private void openDatabase(String db, String version, String display_name,
			long size) {
		SQLiteDatabase myDb = this.cordova.getActivity().getApplicationContext().openOrCreateDatabase(db + ".db", Context.MODE_PRIVATE, null);
		myDbMap.put(db, myDb);
	}

	private SQLiteDatabase getDatabase(String dbName) {
		return myDbMap.get(dbName);
	}

	private void executeSqlBatch(String dbName, String[] queryarr, JSONArray[] jsonparams, String[] queryIDs, String tx_id) {
		SQLiteDatabase myDb = this.getDatabase(dbName); // XXX TODO check for null

		try {
			myDb.beginTransaction();

			String query = "";
			String query_id = "";
			int len = queryarr.length;

			for (int i = 0; i < len; i++) {
				query = queryarr[i];
				query_id = queryIDs[i];
				if (query.toLowerCase().startsWith("insert") && jsonparams != null) {
					SQLiteStatement myStatement = myDb.compileStatement(query);
					for (int j = 0; j < jsonparams[i].length(); j++) {
						if (jsonparams[i].get(j) instanceof Float || jsonparams[i].get(j) instanceof Double ) {
							myStatement.bindDouble(j + 1, jsonparams[i].getDouble(j));
						} else if (jsonparams[i].get(j) instanceof Number) {
							myStatement.bindLong(j + 1, jsonparams[i].getLong(j));
						} else {
							myStatement.bindString(j + 1, jsonparams[i].getString(j));
						}
					}
					long insertId = myStatement.executeInsert();

					String result = "{'insertId':'" + insertId + "'}";
					this.sendJavascript("SQLitePluginTransaction.queryCompleteCallback('" + tx_id + "','" + query_id + "', " + result + ");");
				} else {
					String[] params = null;

					if (jsonparams != null) {
						params = new String[jsonparams[i].length()];

						for (int j = 0; j < jsonparams[i].length(); j++) {
							params[j] = jsonparams[i].getString(j);
							if(params[j] == "null") // XXX better check
								params[j] = "";
						}
					}

					Cursor myCursor = myDb.rawQuery(query, params);

					this.processResults(myCursor, query_id, tx_id);
					myCursor.close();
				}
			}
			myDb.setTransactionSuccessful();
		}
		catch (SQLiteException ex) {
			ex.printStackTrace();
			Log.v("executeSqlBatch", "SQLitePlugin.executeSql(): Error=" +  ex.getMessage());
			this.sendJavascript("SQLitePluginTransaction.txErrorCallback('" + tx_id + "', '"+ex.getMessage()+"');");
		} catch (JSONException ex) {
			ex.printStackTrace();
			Log.v("executeSqlBatch", "SQLitePlugin.executeSql(): Error=" +  ex.getMessage());
			this.sendJavascript("SQLitePluginTransaction.txErrorCallback('" + tx_id + "', '"+ex.getMessage()+"');");
		}
		finally {
			myDb.endTransaction();
			Log.v("executeSqlBatch", tx_id);
			this.sendJavascript("SQLitePluginTransaction.txCompleteCallback('" + tx_id + "');");
		}
	}

	/**
	 * Process query results.
	 *
	 * @param cur
	 *            Cursor into query results
	 * @param tx_id
	 *            Transaction id
	 */
	private void processResults(Cursor cur, String query_id, String tx_id)
	{
		String result = "[]";
		// If query result has rows

		// XXX TODO use results2string() and do test:
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
									row.put(key, cur.getBlob(i));
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
		if(query_id.length() > 0)
			this.sendJavascript(" SQLitePluginTransaction.queryCompleteCallback('" + tx_id + "','" + query_id + "', " + result + ");");

	}

	private void processPragmaResults(Cursor cur, String id)
	{
		String result = this.results2string(cur);

		this.sendJavascript(" SQLitePluginCallback.p1('" + id + "', " + result + ");");
	}

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
									row.put(key, cur.getBlob(i));
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
}
