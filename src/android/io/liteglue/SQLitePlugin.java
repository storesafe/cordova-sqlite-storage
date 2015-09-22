/*
 * Copyright (c) 2012-2015, Chris Brody
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010, IBM Corporation
 */

package io.liteglue;

import android.util.Log;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.*;
import java.net.URI;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.LinkedBlockingQueue;

public class SQLitePlugin extends CordovaPlugin {

    /**
     * Multiple database runner map (static).
     * NOTE: no public static accessor to db (runner) map since it would not work with db threading.
     * FUTURE put DBRunner into a public class that can provide external accessor.
     */
    private static final Map<String, DBRunner> RUNNERS = new ConcurrentHashMap<String, DBRunner>();
    public static final String[] EMPTY_QUERIES = new String[0];

    /**
     * Executes the request and returns PluginResult.
     *
     * @param action The action to execute.
     * @param args   JSONArry of arguments for the plugin.
     * @param callbackContext    Callback context from Cordova API
     * @return       Whether the action was valid.
     */
    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) {
        Action actionValue;
        String simpleName = SQLitePlugin.class.getSimpleName();
        try {
            actionValue = Action.valueOf(action);
        } catch (IllegalArgumentException e) {
            // shouldn't ever happen
            Log.e(simpleName, "unexpected error", e);
            return false;
        }

        try {
            return executeAction(actionValue, args, callbackContext);
        } catch (JSONException e) {
            // TODO: signal JSON problem to JS
            Log.e(simpleName, "unexpected error", e);
            return false;
        }
    }

    private boolean executeAction(Action action, JSONArray args, CallbackContext cbc)
            throws JSONException {

        JSONObject o;
        String dbname;

        switch (action) {
            case open:
                o = args.getJSONObject(0);
                dbname = o.getString("name");
                // open database and start reading its queue
                startDatabase(dbname, o, cbc);
                break;

            case close:
                o = args.getJSONObject(0);
                dbname = o.getString("path");
                // put request in the q to close the db
                closeDatabase(dbname, cbc);
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

                String[] queries;
                String[] queryIDs = null;
                JSONArray[] jsonparams = null;
                if (txargs.isNull(0)) {
                    queries = EMPTY_QUERIES;
                } else {
                    int len = txargs.length();
                    queries = new String[len];
                    queryIDs = new String[len];
                    jsonparams = new JSONArray[len];

                    for (int i = 0; i < len; i++) {
                        JSONObject a = txargs.getJSONObject(i);
                        queries[i] = a.getString("sql");
                        queryIDs[i] = a.getString("qid");
                        JSONArray jsonArr = a.getJSONArray("params");
                        jsonparams[i] = jsonArr;
                    }
                }

                // put db query in the queue to be executed in the db thread:
                DBQuery q = new DBQuery(queries, queryIDs, jsonparams, cbc);
                DBRunner r = RUNNERS.get(dbname);
                if (r == null) {
                    cbc.error("database not open");
                } else {
                    try {
                        r.q.put(q);
                    } catch(Exception e) {
                        String simpleName = SQLitePlugin.class.getSimpleName();
                        Log.e(simpleName, "couldn't add to queue", e);
                        cbc.error("couldn't add to queue");
                    }
                }
                break;
        }

        return true;
    }

    /**
     * Clean up and close all open databases.
     */
    @Override
    public void onDestroy() {
        while (!RUNNERS.isEmpty()) {
            String dbname = RUNNERS.keySet().iterator().next();
            closeDatabaseNow(dbname);
            DBRunner r = RUNNERS.get(dbname);
            try {
                // stop the db runner thread:
                r.q.put(new DBQuery());
            } catch(Exception e) {
                String simpleName = SQLitePlugin.class.getSimpleName();
                Log.e(simpleName, "couldn't stop db thread", e);
            }
            RUNNERS.remove(dbname);
        }
    }

    // --------------------------------------------------------------------------
    // LOCAL METHODS
    // --------------------------------------------------------------------------

    private void startDatabase(String dbname, JSONObject options, CallbackContext cbc) {
        // TODO: is it an issue that we can orphan an existing thread?  What should we do here?
        // If we re-use the existing DBRunner it might be in the process of closing...
        DBRunner r = RUNNERS.get(dbname);

        // Brody TODO: It may be better to terminate the existing db thread here & start a new one, instead.
        if (r == null) {
            r = new DBRunner(dbname, options, cbc);
            RUNNERS.put(dbname, r);
            cordova.getThreadPool().execute(r);
        } else {
            // don't orphan the existing thread; just re-open the existing database.
            // In the worst case it might be in the process of closing, but even that's less serious
            // than orphaning the old DBRunner.
            cbc.success();
        }
    }

    private SpatialiteDatabase openDatabase(String dbname, boolean createFromAssets, CallbackContext cbc) throws Exception {
        try {
            // ASSUMPTION: no db (connection/handle) is already stored in the map
            // [should be true according to the code in DBRunner.run()]

            // create database file from uri
            File dbfile = new File(new URI(dbname));

            if (!dbfile.exists() && createFromAssets) {
                createFromAssets(dbname, dbfile);
            }

            if (!dbfile.exists()) {
                Log.v("info", "Unable to find database " + dbfile + ", creating new file!");
                dbfile.getParentFile().mkdirs();
            }

            Log.v("info", "Open sqlite db: " + dbfile.getAbsolutePath());

            SpatialiteDatabase mydb = new SpatialiteDatabase();
            mydb.open(dbfile);

            if (cbc != null) // XXX Android locking/closing BUG workaround
            {
                cbc.success();
            } else {
                Log.v("info", "Received null callback!");
            }

            return mydb;
        } catch (Exception e) {
            if (cbc != null) // XXX Android locking/closing BUG workaround
            {
                cbc.error("can't open database " + e);
            }
            throw e;
        }
    }

    /**
     * If a prepopulated DB file exists in the assets folder it is copied to the dbPath.
     * Only runs the first time the app runs.
     */
    private void createFromAssets(String myDBName, File dbfile)
    {
        InputStream in = null;
        OutputStream out = null;

            try {
                in = cordova.getActivity().getAssets().open("www/" + myDBName);
                String dbPath = dbfile.getAbsolutePath();
                dbPath = dbPath.substring(0, dbPath.lastIndexOf('/') + 1);

                File dbPathFile = new File(dbPath);
                if (!dbPathFile.exists()) {
                    dbPathFile.mkdirs();
                }

                File newDbFile = new File(dbPath + myDBName);
                out = new FileOutputStream(newDbFile);

                // XXX TODO: this is very primitive, other alternatives at:
                // http://www.journaldev.com/861/4-ways-to-copy-file-in-java
                byte[] buf = new byte[1024];
                int len;
                while ((len = in.read(buf)) > 0) {
                    out.write(buf, 0, len);
                }

                Log.v("info", "Copied prepopulated DB content to: " + newDbFile.getAbsolutePath());
            } catch (IOException e) {
                Log.v("createFromAssets", "No prepopulated DB found, Error=" + e.getMessage());
            } finally {
                if (in != null) {
                    try {
                        in.close();
                    } catch (IOException ignored) {
                    }
                }

                if (out != null) {
                    try {
                        out.close();
                    } catch (IOException ignored) {
                    }
                }
            }
    }

    private void closeDatabase(String dbname, CallbackContext cbc) {
        DBRunner r = RUNNERS.get(dbname);
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
        DBRunner r = RUNNERS.get(dbname);

        if (r != null) {
            SpatialiteDatabase mydb = r.mydb;

            if (mydb != null) {
                mydb.closeDatabaseNow();
            }
        }
    }

    private void deleteDatabase(String dbname, CallbackContext cbc) {
        DBRunner r = RUNNERS.get(dbname);
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
            boolean deleteResult = deleteDatabaseNow(dbname);
            if (deleteResult) {
                cbc.success();
            } else {
                cbc.error("couldn't delete database");
            }
        }
    }

    private boolean deleteDatabaseNow(String dbname) {
        File dbfile = cordova.getActivity().getDatabasePath(dbname);

        try {
            return cordova.getActivity().deleteDatabase(dbfile.getAbsolutePath());
        } catch (Exception e) {
            Log.e(SQLitePlugin.class.getSimpleName(), "couldn't delete database", e);
            return false;
        }
    }

    private class DBRunner implements Runnable {
        private final String dbname;
        private final boolean createFromAssets;
        private final boolean oldImpl;
        private final boolean bugWorkaround;

        private final BlockingQueue<DBQuery> q;
        private final CallbackContext openCbc;

        private SpatialiteDatabase mydb;

        DBRunner(String dbname, JSONObject options, CallbackContext cbc) {
            this.dbname = dbname;
            createFromAssets = options.has("createFromResource");
            oldImpl = options.has("androidOldDatabaseImplementation");
            Log.v(SQLitePlugin.class.getSimpleName(), "Android db implementation: " + (oldImpl ? "OLD" : "spatialite"));
            bugWorkaround = oldImpl && options.has("androidBugWorkaround");
            if (bugWorkaround) {
                Log.v(SQLitePlugin.class.getSimpleName(), "Android db closing/locking workaround applied");
            }

            q = new LinkedBlockingQueue<DBQuery>();
            openCbc = cbc;
        }

        @Override
        public void run() {
            try {
                mydb = openDatabase(dbname, createFromAssets, openCbc);
            } catch (Exception e) {
                Log.e(SQLitePlugin.class.getSimpleName(), "unexpected error, stopping db thread", e);
                RUNNERS.remove(dbname);
                return;
            }

            DBQuery dbq = null;

            try {
                dbq = q.take();

                while (!dbq.stop) {
                    mydb.executeSqlBatch(dbq.queries, dbq.jsonparams, dbq.queryIDs, dbq.cbc);
                    dbq = q.take();
                }
            } catch (Exception e) {
                Log.e(SQLitePlugin.class.getSimpleName(), "unexpected error", e);
            }

            if (dbq != null && dbq.close) {
                try {
                    closeDatabaseNow(dbname);

                    RUNNERS.remove(dbname); // (should) remove ourself

                    if (dbq.delete) {
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
                    } else {
                        dbq.cbc.success();
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

    private static final class DBQuery {
        // XXX TODO replace with DBRunner action enum:
        private final boolean stop;
        private final boolean close;
        private final boolean delete;
        private final String[] queries;
        private final String[] queryIDs;
        private final JSONArray[] jsonparams;
        private final CallbackContext cbc;

        DBQuery(String[] myqueries, String[] qids, JSONArray[] params, CallbackContext c) {
            stop = false;
            close = false;
            delete = false;
            queries = myqueries;
            queryIDs = qids;
            jsonparams = params;
            cbc = c;
        }

        DBQuery(boolean delete, CallbackContext cbc) {
            stop = true;
            close = true;
            this.delete = delete;
            queries = null;
            queryIDs = null;
            jsonparams = null;
            this.cbc = cbc;
        }

        // signal the DBRunner thread to stop:
        DBQuery() {
            stop = true;
            close = false;
            delete = false;
            queries = null;
            queryIDs = null;
            jsonparams = null;
            cbc = null;
        }
    }

    private enum Action {
        open,
        close,
        delete,
        executeSqlBatch,
        backgroundExecuteSqlBatch,
    }
}

/* vim: set expandtab : */
