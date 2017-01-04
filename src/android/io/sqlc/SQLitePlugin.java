/*
 * Copyright (c) 2012-2017: Christopher J. Brody (aka Chris Brody)
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010, IBM Corporation
 */

package io.sqlc;

import android.annotation.SuppressLint;

import android.util.Log;

import java.io.File;
import java.lang.IllegalArgumentException;
import java.lang.Number;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.IOException;

public class SQLitePlugin extends CordovaPlugin {

    /**
     * Multiple database runner map (static).
     * NOTE: no public static accessor to db (runner) map since it would not work with db threading.
     * FUTURE put DBRunner into a public class that can provide external accessor.
     */
    static ConcurrentHashMap<String, DBRunner> dbrmap = new ConcurrentHashMap<String, DBRunner>();

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
        String echo_value;
        String dbname;

        switch (action) {
            case echoStringValue:
                o = args.getJSONObject(0);
                echo_value = o.getString("value");
                cbc.success(echo_value);
                break;

            case open:
                o = args.getJSONObject(0);
                dbname = o.getString("name");
                // open database and start reading its queue
                this.startDatabase(dbname, o, cbc);
                break;

            case close:
                o = args.getJSONObject(0);
                dbname = o.getString("path");
                // put request in the q to close the db
                this.closeDatabase(dbname, cbc);
                break;

            case delete:
                o = args.getJSONObject(0);
                dbname = o.getString("path");

                deleteDatabase(dbname, cbc);

                break;

            case executeSqlBatch:
            case backgroundExecuteSqlBatch:
                JSONObject allargs = args.getJSONObject(0);
                JSONObject dbargs = allargs.getJSONObject("dbargs");
                dbname = dbargs.getString("dbname");
                JSONArray txargs = allargs.getJSONArray("executes");

                if (txargs.isNull(0)) {
                    cbc.error("missing executes list");
                } else {
                    int len = txargs.length();
                    String[] queries = new String[len];
                    JSONArray[] jsonparams = new JSONArray[len];

                    for (int i = 0; i < len; i++) {
                        JSONObject a = txargs.getJSONObject(i);
                        queries[i] = a.getString("sql");
                        jsonparams[i] = a.getJSONArray("params");
                    }

                    // put db query in the queue to be executed in the db thread:
                    DBQuery q = new DBQuery(queries, jsonparams, cbc);
                    DBRunner r = dbrmap.get(dbname);
                    if (r != null) {
                        try {
                            r.q.put(q);
                        } catch(Exception e) {
                            Log.e(SQLitePlugin.class.getSimpleName(), "couldn't add to queue", e);
                            cbc.error("couldn't add to queue");
                        }
                    } else {
                        cbc.error("database not open");
                    }
                }
                break;
        }

        return status;
    }

    /**
     * Clean up and close all open databases.
     */
    @Override
    public void onDestroy() {
        while (!dbrmap.isEmpty()) {
            String dbname = dbrmap.keySet().iterator().next();

            this.closeDatabaseNow(dbname);

            DBRunner r = dbrmap.get(dbname);
            try {
                // stop the db runner thread:
                r.q.put(new DBQuery());
            } catch(Exception e) {
                Log.e(SQLitePlugin.class.getSimpleName(), "couldn't stop db thread", e);
            }
            dbrmap.remove(dbname);
        }
    }

    // --------------------------------------------------------------------------
    // LOCAL METHODS
    // --------------------------------------------------------------------------

    private void startDatabase(String dbname, JSONObject options, CallbackContext cbc) {
        // TODO: is it an issue that we can orphan an existing thread?  What should we do here?
        // If we re-use the existing DBRunner it might be in the process of closing...
        DBRunner r = dbrmap.get(dbname);

        // Brody TODO: It may be better to terminate the existing db thread here & start a new one, instead.
        if (r != null) {
            // don't orphan the existing thread; just re-open the existing database.
            // In the worst case it might be in the process of closing, but even that's less serious
            // than orphaning the old DBRunner.
            cbc.success();
        } else {
            r = new DBRunner(dbname, options, cbc);
            dbrmap.put(dbname, r);
            this.cordova.getThreadPool().execute(r);
        }
    }
    /**
     * Open a database.
     *
     * @param dbName   The name of the database file
     */
    private SQLiteAndroidDatabase openDatabase(String dbname, CallbackContext cbc, boolean old_impl) throws Exception {
        try {
            // ASSUMPTION: no db (connection/handle) is already stored in the map
            // [should be true according to the code in DBRunner.run()]

            File dbfile = this.cordova.getActivity().getDatabasePath(dbname);

            if (!dbfile.exists()) {
                dbfile.getParentFile().mkdirs();
            }

            Log.v("info", "Open sqlite db: " + dbfile.getAbsolutePath());

            SQLiteAndroidDatabase mydb = old_impl ? new SQLiteAndroidDatabase() : new SQLiteConnectorDatabase();
            mydb.open(dbfile);

            if (cbc != null) // XXX Android locking/closing BUG workaround
                cbc.success();

            return mydb;
        } catch (Exception e) {
            if (cbc != null) // XXX Android locking/closing BUG workaround
                cbc.error("can't open database " + e);
            throw e;
        }
    }

    /**
     * Close a database (in another thread).
     *
     * @param dbName   The name of the database file
     */
    private void closeDatabase(String dbname, CallbackContext cbc) {
        DBRunner r = dbrmap.get(dbname);
        if (r != null) {
            try {
                r.q.put(new DBQuery(false, cbc));
            } catch(Exception e) {
                if (cbc != null) {
                    cbc.error("couldn't close database" + e);
                }
                Log.e(SQLitePlugin.class.getSimpleName(), "couldn't close database", e);
            }
        } else {
            if (cbc != null) {
                cbc.success();
            }
        }
    }

    /**
     * Close a database (in the current thread).
     *
     * @param dbname   The name of the database file
     */
    private void closeDatabaseNow(String dbname) {
        DBRunner r = dbrmap.get(dbname);

        if (r != null) {
            SQLiteAndroidDatabase mydb = r.mydb;

            if (mydb != null)
                mydb.closeDatabaseNow();
        }
    }

    private void deleteDatabase(String dbname, CallbackContext cbc) {
        DBRunner r = dbrmap.get(dbname);
        if (r != null) {
            try {
                r.q.put(new DBQuery(true, cbc));
            } catch(Exception e) {
                if (cbc != null) {
                    cbc.error("couldn't close database" + e);
                }
                Log.e(SQLitePlugin.class.getSimpleName(), "couldn't close database", e);
            }
        } else {
            boolean deleteResult = this.deleteDatabaseNow(dbname);
            if (deleteResult) {
                cbc.success();
            } else {
                cbc.error("couldn't delete database");
            }
        }
    }

    /**
     * Delete a database.
     *
     * @param dbName   The name of the database file
     *
     * @return true if successful or false if an exception was encountered
     */
    private boolean deleteDatabaseNow(String dbname) {
        File dbfile = this.cordova.getActivity().getDatabasePath(dbname);

        try {
            return cordova.getActivity().deleteDatabase(dbfile.getAbsolutePath());
        } catch (Exception e) {
            Log.e(SQLitePlugin.class.getSimpleName(), "couldn't delete database", e);
            return false;
        }
    }

    private class DBRunner implements Runnable {
        final String dbname;
        private boolean oldImpl;
        private boolean bugWorkaround;

        final BlockingQueue<DBQuery> q;
        final CallbackContext openCbc;

        SQLiteAndroidDatabase mydb;

        DBRunner(final String dbname, JSONObject options, CallbackContext cbc) {
            this.dbname = dbname;
            this.oldImpl = options.has("androidOldDatabaseImplementation");
            Log.v(SQLitePlugin.class.getSimpleName(), "Android db implementation: built-in android.database.sqlite package");
            this.bugWorkaround = this.oldImpl && options.has("androidBugWorkaround");
            if (this.bugWorkaround)
                Log.v(SQLitePlugin.class.getSimpleName(), "Android db closing/locking workaround applied");

            this.q = new LinkedBlockingQueue<DBQuery>();
            this.openCbc = cbc;
        }

        public void run() {
            try {
                this.mydb = openDatabase(dbname, this.openCbc, this.oldImpl);
            } catch (Exception e) {
                Log.e(SQLitePlugin.class.getSimpleName(), "unexpected error, stopping db thread", e);
                dbrmap.remove(dbname);
                return;
            }

            DBQuery dbq = null;

            try {
                dbq = q.take();

                while (!dbq.stop) {
                    mydb.executeSqlBatch(dbq.queries, dbq.jsonparams, dbq.cbc);

                    if (this.bugWorkaround && dbq.queries.length == 1 && dbq.queries[0] == "COMMIT")
                        mydb.bugWorkaround();

                    dbq = q.take();
                }
            } catch (Exception e) {
                Log.e(SQLitePlugin.class.getSimpleName(), "unexpected error", e);
            }

            if (dbq != null && dbq.close) {
                try {
                    closeDatabaseNow(dbname);

                    dbrmap.remove(dbname); // (should) remove ourself

                    if (!dbq.delete) {
                        dbq.cbc.success();
                    } else {
                        try {
                            boolean deleteResult = deleteDatabaseNow(dbname);
                            if (deleteResult) {
                                dbq.cbc.success();
                            } else {
                                dbq.cbc.error("couldn't delete database");
                            }
                        } catch (Exception e) {
                            Log.e(SQLitePlugin.class.getSimpleName(), "couldn't delete database", e);
                            dbq.cbc.error("couldn't delete database: " + e);
                        }
                    }                    
                } catch (Exception e) {
                    Log.e(SQLitePlugin.class.getSimpleName(), "couldn't close database", e);
                    if (dbq.cbc != null) {
                        dbq.cbc.error("couldn't close database: " + e);
                    }
                }
            }
        }
    }

    private final class DBQuery {
        // XXX TODO replace with DBRunner action enum:
        final boolean stop;
        final boolean close;
        final boolean delete;
        final String[] queries;
        final JSONArray[] jsonparams;
        final CallbackContext cbc;

        DBQuery(String[] myqueries, JSONArray[] params, CallbackContext c) {
            this.stop = false;
            this.close = false;
            this.delete = false;
            this.queries = myqueries;
            this.jsonparams = params;
            this.cbc = c;
        }

        DBQuery(boolean delete, CallbackContext cbc) {
            this.stop = true;
            this.close = true;
            this.delete = delete;
            this.queries = null;
            this.jsonparams = null;
            this.cbc = cbc;
        }

        // signal the DBRunner thread to stop:
        DBQuery() {
            this.stop = true;
            this.close = false;
            this.delete = false;
            this.queries = null;
            this.jsonparams = null;
            this.cbc = null;
        }
    }

    private static enum Action {
        echoStringValue,
        open,
        close,
        delete,
        executeSqlBatch,
        backgroundExecuteSqlBatch,
    }
}

/* vim: set expandtab : */
