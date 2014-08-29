using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Globalization;
using System.IO;
using System.Runtime.Serialization;
using System.Threading;

using SQLite;

using WPCordovaClassLib.Cordova;
using WPCordovaClassLib.Cordova.Commands;
using WPCordovaClassLib.Cordova.JSON;

namespace Cordova.Extension.Commands
{

    public class SQLitePlugin : BaseCommand
    {
        #region SQLitePlugin options

        [DataContract]
        public class SQLitePluginOpenOptions
        {
            [DataMember(IsRequired = true, Name = "name")]
            public string name { get; set; }

            [DataMember(IsRequired = false, Name = "bgType", EmitDefaultValue = false)]
            public int bgType = 0;
        }

        [DataContract]
        public class SQLitePluginCloseDeleteOptions
        {
            [DataMember(IsRequired = true, Name = "path")]
            public string name { get; set; }
        }

        [DataContract]
        public class SQLitePluginExecuteSqlBatchArgs
        {
            [DataMember(IsRequired = true, Name = "dbname")]
            public string name { get; set; }
        }

        [DataContract]
        public class SQLitePluginExecuteSqlBatchOptions
        {
            [DataMember(IsRequired = true, Name = "dbargs")]
            public SQLitePluginExecuteSqlBatchArgs dbargs { get; set; }

            [DataMember(IsRequired = true, Name = "executes")]
            public TransactionsCollection executes { get; set; }
        }

        [CollectionDataContract]
        public class TransactionsCollection : Collection<SQLitePluginTransaction>
        {

        }

        [DataContract]
        public class SQLitePluginTransaction
        {
            /// <summary>
            /// Identifier for transaction
            /// </summary>
            [DataMember(IsRequired = false, Name = "trans_id")]
            public string transId { get; set; }

            /// <summary>
            /// Callback identifer
            /// </summary>
            [DataMember(IsRequired = true, Name = "qid")]
            public string queryId { get; set; }

            /// <summary>
            /// Query string
            /// </summary>
            [DataMember(IsRequired = true, Name = "sql")]
            public string query { get; set; }

            /// <summary>
            /// Query parameters
            /// </summary>
            /// <remarks>TODO: broken in WP8 & 8.1; interprets ["1.5"] as [1.5]</remarks>
            [DataMember(IsRequired = true, Name = "params")]
            public object[] query_params { get; set; }

        }

        #endregion

        private readonly DatabaseManager databaseManager;

        public SQLitePlugin()
        {
            this.databaseManager = new DatabaseManager(this);
        }

        public void open(string options)
        {
            string mycbid = this.CurrentCommandCallbackId;
            //System.Diagnostics.Debug.WriteLine("SQLitePlugin.open() with cbid " + mycbid + " options:" + options);

            try
            {
                String [] jsonOptions = JsonHelper.Deserialize<string[]>(options);
                mycbid = jsonOptions[1];

                var dbOptions = JsonHelper.Deserialize<SQLitePluginOpenOptions>(jsonOptions[0]);
                this.databaseManager.Open(dbOptions.name, mycbid);
            }
            catch (Exception)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION), mycbid);
            }
        }

        public void close(string options)
        {
            string mycbid = this.CurrentCommandCallbackId;

            try
            {
                String[] jsonOptions = JsonHelper.Deserialize<string[]>(options);
                mycbid = jsonOptions[1];

                var dbOptions = JsonHelper.Deserialize<SQLitePluginCloseDeleteOptions>(jsonOptions[0]);
                this.databaseManager.Close(dbOptions.name, mycbid);
            }
            catch (Exception)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION), mycbid);
            }
        }

        public void delete(string options)
        {
            string mycbid = this.CurrentCommandCallbackId;

            try
            {
                String[] jsonOptions = JsonHelper.Deserialize<string[]>(options);
                mycbid = jsonOptions[1];

                var dbOptions = JsonHelper.Deserialize<SQLitePluginCloseDeleteOptions>(jsonOptions[0]);
                this.databaseManager.Delete(dbOptions.name, mycbid);
            }
            catch (Exception)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION), mycbid);
            }
        }

        public void backgroundExecuteSqlBatch(string options)
        {
            string mycbid = this.CurrentCommandCallbackId;

            try
            {
                String[] jsonOptions = JsonHelper.Deserialize<string[]>(options);
                mycbid = jsonOptions[1];

                SQLitePluginExecuteSqlBatchOptions batch = JsonHelper.Deserialize<SQLitePluginExecuteSqlBatchOptions>(jsonOptions[0]);
                this.databaseManager.Query(batch.dbargs.name, batch.executes, mycbid);
            }
            catch (Exception)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION), mycbid);
            }
        }

        /// <summary>
        /// Manage the collection of currently open databases and queue requests for them
        /// </summary>
        public class DatabaseManager
        {
            private readonly BaseCommand plugin;
            private readonly IDictionary<string, DBRunner> runners = new Dictionary<string, DBRunner>();
            private readonly object runnersLock = new object();

            public DatabaseManager(BaseCommand plugin)
            {
                this.plugin = plugin;
            }

            public void Open(string dbname, string cbc)
            {
                DBRunner runner;
                lock (runnersLock)
                {
                    if (!runners.TryGetValue(dbname, out runner))
                    {
                        runner = new DBRunner(this, dbname, cbc);
                        runner.Start();
                        runners[dbname] = runner;
                    }
                    else
                    {
                        // acknowledge open if it is scheduled after first query.
                        // Also works for re-opening a database, but means that one cannot close a single instance of a database.
                        this.Ok(cbc);
                    }
                }
            }

            public void Query(string dbname, TransactionsCollection queries, string callbackId)
            {
                lock (runnersLock)
                {
                    DBRunner runner;
                    if (!runners.TryGetValue(dbname, out runner))
                    {
                        // query may start before open is scheduled
                        runner = new DBRunner(this, dbname, null);
                        runner.Start();
                        runners[dbname] = runner;
                    }

                    var query = new DBQuery(queries, callbackId);
                    runner.Enqueue(query);
                }
            }

            public void Close(string dbname, string callbackId)
            {
                lock (runnersLock)
                {
                    DBRunner runner;
                    if (runners.TryGetValue(dbname, out runner))
                    {
                        var query = new DBQuery(false, callbackId);
                        runner.Enqueue(query);

                        // As we cannot determine the order in which query/open requests arrive,
                        // any such requests should start a new thread rather than being lost on the dying queue.
                        // Hence synchronoous wait for thread-end within request and within lock.
                        runner.WaitForStopped();
                        runners.Remove(dbname);
                    }
                    else
                    {
                        // closing a closed database is trivial
                        Ok(callbackId);
                    }
                }
            }

            public void Delete(string dbname, string callbackId)
            {
                var query = new DBQuery(false, callbackId);
                lock (runnersLock)
                {
                    DBRunner runner;
                    if (runners.TryGetValue(dbname, out runner))
                    {
                        runner.Enqueue(query);

                        // As we cannot determine the order in which query/open requests arrive,
                        // any such requests should start a new thread rather than being lost on the dying queue.
                        // Hence synchronoous wait for thread-end within request and within lock.
                        runner.WaitForStopped();
                        runners.Remove(dbname);
                    }
                    else
                    {
                        // Deleting a closed database, so no runner to queue the request on
                        // Must be inside lock so databases are not opened while being deleted
                        DBRunner.DeleteDatabaseNow(this, dbname, callbackId);
                    }
                }
            }

            public void Finished(DBRunner runner)
            {
                lock (runnersLock)
                {
                    runners.Remove(runner.DatabaseName);
                }
            }

            public void Ok(string callbackId, string result)
            {
                this.plugin.DispatchCommandResult(new PluginResult(PluginResult.Status.OK, result), callbackId);
            }

            public void Ok(string callbackId)
            {
                this.plugin.DispatchCommandResult(new PluginResult(PluginResult.Status.OK), callbackId);
            }

            public void Error(string callbackId, string message)
            {
                this.plugin.DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, message), callbackId);
            }
        }

        /// <summary>
        /// Maintain a single database with a thread/queue pair to feed requests to it
        /// </summary>
        public class DBRunner
        {
            private DatabaseManager databases;
            private SQLiteConnection db;
            public string DatabaseName { get; private set; }
            private readonly string openCalllbackId;
            private readonly Thread thread;
            private readonly BlockingQueue<DBQuery> queue;

            public DBRunner(DatabaseManager databases, string dbname, string cbc)
            {
                this.databases = databases;
                this.DatabaseName = dbname;
                this.queue = new BlockingQueue<DBQuery>();
                this.openCalllbackId = cbc;
                this.thread = new Thread(this.Run) { Name = dbname };
            }

            public void Start()
            {
                this.thread.Start();
            }

            public void WaitForStopped()
            {
                this.thread.Join();
            }

            public void Enqueue(DBQuery dbq)
            {
                this.queue.Enqueue(dbq);
            }

            private void Run()
            {
                try
                {
                    // As a query can be requested for the callback for "open" has been completed, 
                    // the thread may not be started by the open request, in which case no open callback id
                    this.db = new SQLiteConnection(this.DatabaseName);

                    if (openCalllbackId != null)
                    {
                        this.databases.Ok(openCalllbackId);
                    }
                }
                catch (Exception ex)
                {
                    LogError("Failed to open database " + DatabaseName, ex);
                    if (openCalllbackId != null)
                    {
                        this.databases.Error(openCalllbackId, "Failed to open database " + ex.Message);
                    }
                    databases.Finished(this);
                    return;
                }

                DBQuery dbq = queue.Take();
                while (!dbq.Stop)
                {
                    executeSqlBatch(dbq);
                    dbq = queue.Take();
                }

                if (!dbq.Delete)
                {
                    // close and callback
                    CloseDatabaseNow(dbq.CallbackId);
                }
                else
                {
                    // close, then delete and callback
                    CloseDatabaseNow(null);
                    DeleteDatabaseNow(this.databases, DatabaseName, dbq.CallbackId);
                }
            }

            public void CloseDatabaseNow(string callBackId)
            {
                bool success = true;
                string error = null;

                try
                {
                    this.db.Close();
                }
                catch (Exception e)
                {
                    LogError("couldn't close " + this.DatabaseName, e);
                    success = false;
                    error = e.Message;
                }

                if (callBackId != null)
                {
                    if (success)
                    {
                        this.databases.Ok(callBackId);
                    }
                    else
                    {
                        this.databases.Error(callBackId, error);
                    }
                }
            }

            // Needs to be static to support deleting closed databases
            public static void DeleteDatabaseNow(DatabaseManager databases, string dbname, string callBackId)
            {
                bool success = true;
                string error = null;
                try
                {
                    var folderPath = Path.GetDirectoryName(dbname);
                    if (folderPath == "")
                    {
                        folderPath = Windows.Storage.ApplicationData.Current.LocalFolder.Path;
                    }
                    var fileName = Path.GetFileName(dbname);

                    if (!System.IO.File.Exists(Path.Combine(folderPath, fileName)))
                    {
                        databases.Error(callBackId, "Database does not exist: " + dbname);
                    }

                    var fileExtension = new[] { "", "-journal", "-wal", "-shm" };
                    foreach (var extension in fileExtension)
                    {
                        var fullPath = Path.Combine(folderPath, fileName + extension);
                        System.IO.File.Delete(fullPath);
                    }
                }
                catch (Exception ex)
                {
                    error = ex.Message;
                    success = false;
                }

                if (success)
                {
                    databases.Ok(callBackId);
                }
                else
                {
                    databases.Error(callBackId, error);
                }
            }

            public void executeSqlBatch(DBQuery dbq)
            {
                string batchResultsStr = "";

                // loop through the sql in the transaction
                foreach (SQLitePluginTransaction transaction in dbq.Queries)
                {
                    string resultString = "";
                    string errorMessage = "unknown";
                    bool needQuery = true;

                    // begin
                    if (transaction.query.StartsWith("BEGIN", StringComparison.OrdinalIgnoreCase))
                    {
                        needQuery = false;

                        try
                        {
                            this.db.BeginTransaction();

                            resultString = "\"rowsAffected\":0";

                        }
                        catch (Exception e)
                        {
                            errorMessage = e.Message;
                        }

                    }

                    // commit
                    if (transaction.query.StartsWith("COMMIT", StringComparison.OrdinalIgnoreCase))
                    {
                        needQuery = false;

                        try
                        {
                            this.db.Commit();

                            resultString = "\"rowsAffected\":0";
                        }
                        catch (Exception e)
                        {
                            errorMessage = e.Message;
                        }
                    }

                    // rollback
                    if (transaction.query.StartsWith("ROLLBACK", StringComparison.OrdinalIgnoreCase))
                    {
                        needQuery = false;

                        try
                        {
                            this.db.Rollback();

                            resultString = "\"rowsAffected\":0";
                        }
                        catch (Exception e)
                        {
                            errorMessage = e.Message;
                        }

                    }

                    // create/drop table
                    if (transaction.query.IndexOf("DROP TABLE", StringComparison.OrdinalIgnoreCase) > -1 || transaction.query.IndexOf("CREATE TABLE", StringComparison.OrdinalIgnoreCase) > -1)
                    {
                        needQuery = false;

                        try
                        {
                            var results = db.Execute(transaction.query, transaction.query_params);

                            resultString = "\"rowsAffected\":0";
                        }
                        catch (Exception e)
                        {
                            errorMessage = e.Message;
                        }

                    }

                    // insert/update/delete
                    if (transaction.query.StartsWith("INSERT", StringComparison.OrdinalIgnoreCase) ||
                        transaction.query.StartsWith("UPDATE", StringComparison.OrdinalIgnoreCase) ||
                        transaction.query.StartsWith("DELETE", StringComparison.OrdinalIgnoreCase))
                    {
                        needQuery = false;

                        try
                        {
                            // execute our query
                            var res = db.Execute(transaction.query, transaction.query_params);

                            // get the primary key of the last inserted row
                            var insertId = SQLite3.LastInsertRowid(db.Handle);

                            resultString = String.Format("\"rowsAffected\":{0}", res);

                            if (transaction.query.StartsWith("INSERT", StringComparison.OrdinalIgnoreCase))
                            {
                                resultString += String.Format(",\"insertId\":{0}", insertId);
                            }

                        }
                        catch (Exception e)
                        {
                            errorMessage = e.Message;
                        }
                    }

                    if (needQuery)
                    {
                        try
                        {
                            var results = this.db.Query2(transaction.query, transaction.query_params);

                            string rowsString = "";

                            foreach (SQLiteQueryRow res in results)
                            {
                                string rowString = "";

                                if (rowsString.Length != 0) rowsString += ",";

                                foreach (SQLiteQueryColumn column in res.column)
                                {
                                    if (rowString.Length != 0) rowString += ",";

                                    if (column.Value != null)
                                    {
                                        if (column.Value.GetType().Equals(typeof(Int32)))
                                        {
                                            rowString += String.Format("\"{0}\":{1}",
                                                column.Key, Convert.ToInt32(column.Value));
                                        }
                                        else if (column.Value.GetType().Equals(typeof(Double)))
                                        {
                                            rowString += String.Format(CultureInfo.InvariantCulture, "\"{0}\":{1}",
                                                column.Key, Convert.ToDouble(column.Value, CultureInfo.InvariantCulture));
                                        }
                                        else
                                        {
                                            rowString += String.Format("\"{0}\":\"{1}\"",
                                                column.Key,
                                                column.Value.ToString()
                                                    .Replace("\\","\\\\")
                                                    .Replace("\"","\\\"")
                                                    .Replace("\t","\\t")
                                                    .Replace("\r","\\r")
                                                    .Replace("\n","\\n")
                                            );
                                        }
                                    }
                                    else
                                    {
                                        rowString += String.Format("\"{0}\":null", column.Key);
                                    }

                                }

                                rowsString += "{" + rowString + "}";
                            }

                            resultString = "\"rows\":[" + rowsString + "]";
                        }
                        catch (Exception e)
                        {
                            errorMessage = e.Message;
                        }
                    }

                    if (batchResultsStr.Length != 0) batchResultsStr += ",";

                    if (resultString.Length != 0)
                    {
                        batchResultsStr += "{\"qid\":\"" + transaction.queryId + "\",\"type\":\"success\",\"result\":{" + resultString + "}}";
                        //System.Diagnostics.Debug.WriteLine("batchResultsStr: " + batchResultsStr);
                    }
                    else
                    {
                        batchResultsStr += "{\"qid\":\"" + transaction.queryId + "\",\"type\":\"error\",\"result\":{\"message\":\"" + errorMessage.Replace("\\", "\\\\").Replace("\"", "\\\"") + "\"}}";
                    }
                }

                this.databases.Ok(dbq.CallbackId, "[" + batchResultsStr + "]");
            }


            private static void LogError(string message, Exception e)
            {
                // TODO - good place for a breakpoint
            }

            private static void LogWarning(string message)
            {
                // TODO - good place for a breakpoint
            }
        }

        /// <summary>
        /// A single, queueable, request for a database
        /// </summary>
        public class DBQuery
        {
            public bool Stop { get; private set; }
            public bool Delete { get; private set; }
            public TransactionsCollection Queries { get; private set; }
            public string CallbackId { get; private set; }

            /// <summary>
            /// Create a request to run a query
            /// </summary>
            public DBQuery(TransactionsCollection queries, string callbackId)
            {
                this.Stop = false;
                this.Delete = false;

                this.Queries = queries;

                this.CallbackId = callbackId;
            }

            /// <summary>
            /// Create a request to close, and optionally delete, a database
            /// </summary>
            public DBQuery(bool delete, string callbackId)
            {
                this.Stop = true;
                this.Delete = delete;

                this.Queries = null;

                this.CallbackId = callbackId;
            }
        }

        /// <summary>
        /// Minimal blocking queue
        /// </summary>
        /// <remarks>
        /// Expects one reader and n writers - no support for a reader closing down the queue and releasing other readers.
        /// </remarks>
        /// <typeparam name="T"></typeparam>
        class BlockingQueue<T>
        {
            private readonly Queue<T> items = new Queue<T>();
            private readonly object locker = new object();

            public T Take()
            {
                lock (locker)
                {
                    while (items.Count == 0)
                    {
                        Monitor.Wait(locker);
                    }
                    return items.Dequeue();
                }
            }

            public void Enqueue(T value)
            {
                lock (locker)
                {
                    items.Enqueue(value);
                    Monitor.PulseAll(locker);
                }
            }
        }
    }
}
