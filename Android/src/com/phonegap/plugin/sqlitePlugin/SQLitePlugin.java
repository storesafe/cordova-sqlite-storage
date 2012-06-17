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
import org.apache.cordova.api.Plugin;
import org.apache.cordova.api.PluginResult;
import android.database.Cursor;
import android.database.sqlite.*;

import android.util.Log;

public class SQLitePlugin extends Plugin {

	// Data Definition Language
	SQLiteDatabase myDb = null; // Database object
	String path 		= null; // Database path
	String dbName 		= null; // Database name

	/**
	 * Constructor.
	 */
	public SQLitePlugin() {
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
			// TODO: Do we want to allow a user to do this, since they could get
			// to other app databases?
			if (action.equals("setStorage")) {
				this.setStorage(args.getString(0), false);
			} else if (action.equals("open")) {
				this.openDatabase(args.getString(0), "1",
						"database", 5000000);
				//this.openDatabase(args.getString(0), args.getString(1),
				//		args.getString(2), args.getLong(3));
			} 
			else if (action.equals("executeSqlBatch")) 
			{
				String[] 	queries 	= null;
				String[] 	queryIDs 	= null;
				String[][] 	params 		= null;
				String 		trans_id 	= null;
				JSONObject 	a 			= null;
				JSONArray 	jsonArr 	= null;
				int 		paramLen	= 0;
				
				if (args.isNull(0)) {
					queries = new String[0];
				} else {
					int len = args.length();
					queries = new String[len];
					queryIDs = new String[len];
					params = new String[len][1];
					for (int i = 0; i < len; i++) 
					{
						a 			= args.getJSONObject(i);
						queries[i] 	= a.getString("query");
						queryIDs[i] = a.getString("query_id");
						trans_id 	= a.getString("trans_id");
						jsonArr 	= a.getJSONArray("params");
						paramLen	= jsonArr.length();
						params[i] 	= new String[paramLen];
						
						for (int j = 0; j < paramLen; j++) {
							params[i][j] = jsonArr.getString(j);
							if(params[i][j] == "null")
								params[i][j] = "";
						}
					}
				}
				if(trans_id != null)
					this.executeSqlBatch(queries, params, queryIDs, trans_id);
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
		if (this.myDb != null) {
			this.myDb.close();
			this.myDb = null;
		}
	}

	// --------------------------------------------------------------------------
	// LOCAL METHODS
	// --------------------------------------------------------------------------

	/**
	 * Set the application package for the database. Each application saves its
	 * database files in a directory with the application package as part of the
	 * file name.
	 *
	 * For example, application "com.phonegap.demo.Demo" would save its database
	 * files in "/data/data/com.phonegap.demo/databases/" directory.
	 *
	 * When a file is downloaded using a FileTransfer it is placed on the sd 
	 * memory card. 
	 * 
	 * @param appPackage
	 *            The application package.
	 * @param preLoaded
	 * 	      If db was loaded with project or downloaded externally
	 */
	public void setStorage(String appPackage, Boolean preLoaded) {
		if(preLoaded)
			this.path = "/data/data/" + appPackage + "/databases/";
		else
			this.path = Environment.getExternalStorageDirectory().getAbsolutePath() + "/";
	}

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
	public void openDatabase(String db, String version, String display_name,
			long size) {

		// If database is open, then close it
		if (this.myDb != null) {
			this.myDb.close();
		}

		// If no database path, generate from application package
		if (this.path == null) {
			Package pack = this.ctx.getClass().getPackage();
			String appPackage = pack.getName();
			this.setStorage(appPackage, false);
		}

		this.dbName = this.path + db;
		this.myDb = SQLiteDatabase.openOrCreateDatabase(this.dbName, null);
	}

	public void executeSqlBatch(String[] queryarr, String[][] paramsarr, String[] queryIDs, String tx_id) {
		try {
			this.myDb.beginTransaction();
			String query = "";
			String query_id = "";
			String[] params;
			int len = queryarr.length;
			for (int i = 0; i < len; i++) {
				query = queryarr[i];
				params = paramsarr[i];
				query_id = queryIDs[i];
				Cursor myCursor = this.myDb.rawQuery(query, params);
				
				this.processResults(myCursor, query_id, tx_id);
				myCursor.close();
			}
			this.myDb.setTransactionSuccessful();
		}
		catch (SQLiteException ex) {
			ex.printStackTrace();
			Log.v("executeSqlBatch", "SQLitePlugin.executeSql(): Error=" +  ex.getMessage());
			this.sendJavascript("SQLitePluginTransaction.txErrorCallback('" + tx_id + "', '"+ex.getMessage()+"');");
		}
		finally {
			this.myDb.endTransaction();
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
	public void processResults(Cursor cur, String query_id, String tx_id) {

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
		if(query_id.length() > 0)
			this.sendJavascript(" SQLitePluginTransaction.queryCompleteCallback('" + tx_id + "','" + query_id + "', " + result + ");");

	}
}
