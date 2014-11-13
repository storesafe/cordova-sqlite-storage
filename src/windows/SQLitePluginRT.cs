using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Globalization;
using System.IO;
using System.Runtime.Serialization;
using System.Threading;
using System.Runtime.InteropServices.WindowsRuntime;
using Windows.Foundation;
using System.Threading.Tasks;

namespace SQLitePluginRT
{

    [CollectionDataContract]
    internal class TransactionsCollection : Collection<SQLitePluginTransaction>
    {

    }

    [DataContract]
    internal class SQLitePluginTransaction
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

        public SQLitePluginTransaction(object[]a) {
            queryId = (string)a[0];
            query = (string)a[1];
            query_params = (object[])a[2];
        }
    }
    
    public sealed class SQLitePlugin
    {

        private readonly DatabaseManager databaseManager;
        private static SQLitePlugin gPlugin = new SQLitePlugin();
		private static Int32 nextID = 0;
        
        public SQLitePlugin()
        {
            this.databaseManager = new DatabaseManager(this);
        }

        public static IAsyncOperation<IList<string>> openAsync(string dbName)
        {
            string txid = Convert.ToString(++nextID);
            //System.Diagnostics.Debug.WriteLine("SQLitePlugin.open() with cbid " + txid + " options:" + options);

			return gPlugin.databaseManager.OpenAsync(dbName, txid);
        }

        public static IAsyncOperation<IList<string>> closeAsync(string dbName)
        {
            string txid = Convert.ToString(++nextID);

			return gPlugin.databaseManager.Close(dbName, txid);
        }

        public static IAsyncOperation<IList<string>> deleteAsync(string dbName)
        {
            string txid = Convert.ToString(++nextID);

			return gPlugin.databaseManager.Delete(dbName, txid);
        }

        public static IAsyncOperation<IList<string>> backgroundExecuteSqlBatch(string dbName, [ReadOnlyArray()] object[] executes)
        {
            string txid = Convert.ToString(++nextID);

            TransactionsCollection tc=new TransactionsCollection();
            foreach (var t in executes)
            {
                tc.Add(new SQLitePluginTransaction((object[])t));
            }
			return gPlugin.databaseManager.Query(dbName, tc, txid);
        }

        private class TxResult {
        	public SemaphoreSlim semaphore;
        	public String result;
        	public String error;
        	public TxResult() {
        		this.semaphore = new SemaphoreSlim(1);
                this.semaphore.Wait();
        		this.result = "";
        		this.error = "";
        	}
        	public List<string> tolist() {
        		var res = new List<string>(2);
        		res[0]=this.result;
        		res[1]=this.error;
        		return res;
        	}
        };
        
        /// <summary>
        /// Manage the collection of currently open databases and queue requests for them
        /// </summary>
        internal class DatabaseManager
        {
            private readonly SQLitePlugin plugin;
            private readonly IDictionary<string, DBRunner> runners = new Dictionary<string, DBRunner>();
            private readonly IDictionary<string, TxResult> transactions = new Dictionary<string, TxResult>();
            private readonly object runnersLock = new object();

            public DatabaseManager(SQLitePlugin plugin)
            {
                this.plugin = plugin;
            }

            public void TxDone(string txid, string result="", string err="")
            {
            	TxResult res = new TxResult();
                lock (runnersLock)
                {
                	if (!this.transactions.TryGetValue(txid, out res)) {
                		System.Diagnostics.Debug.WriteLine("Invalid transaction id " + txid);
                		return;
                	}
                	res.result = result;
                	res.error = err;
                	res.semaphore.Release();
                }
			}
			
            private IAsyncOperation<IList<string>> WaitTX(string txid){
                return AsyncInfo.Run<IList<string>>(async (token) =>
                {
					TxResult res = new TxResult();
					lock (runnersLock)
					{
						if (!this.transactions.TryGetValue(txid, out res)) {
                            string[] msg = { "", "Invalid transaction id " + txid };
							System.Diagnostics.Debug.WriteLine(msg[1]);
							return msg;
						}
						
					}
                	await res.semaphore.WaitAsync();
                    res.semaphore.Release();
                    lock (runnersLock) {
                    	this.transactions.Remove(txid);
                    }
                	return new[]{res.result,res.error};

                });            	
            }
            
            public IAsyncOperation<IList<string>> OpenAsync(string dbname, string txid){
			return Task.Run(async() => {
				DBRunner runner = null;
				
				lock (runnersLock) {
					if (!runners.TryGetValue(dbname, out runner))
					{
						this.transactions[txid] = new TxResult();
						runner = new DBRunner(this, dbname, txid);
						runner.Start();
						runners[dbname] = runner;
					}
				}
				if (runner != null)
					return await WaitTX(txid);
				else 
					return new List<string>(new[]{"",""});
			}).AsAsyncOperation();
			}

            public IAsyncOperation<IList<string>> Query(string dbname, TransactionsCollection queries, string txid)
            {
			return Task.Run(async() => {
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

                    this.transactions[txid] = new TxResult();
                    var query = new DBQuery(queries, txid);
                    runner.Enqueue(query);
                }
                return await WaitTX(txid);
            }).AsAsyncOperation();
            }

            public IAsyncOperation<IList<string>> Close(string dbname, string txid)
            {
			return Task.Run(async() => {
                lock (runnersLock)
                {
                    DBRunner runner;
                    if (runners.TryGetValue(dbname, out runner))
                    {
                    	this.transactions[txid] = new TxResult();
                        var query = new DBQuery(false, txid);
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
                        return new List<string>(new[]{"",""});
                    }
                }
                return await WaitTX(txid);
            }).AsAsyncOperation();
            }

            public IAsyncOperation<IList<string>> Delete(string dbname, string txid)
            {
			return Task.Run(async() => {
                var query = new DBQuery(false, txid);
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
                        DBRunner.DeleteDatabaseNow(this, dbname, txid);
                    }
                    this.transactions[txid] = new TxResult();
                }
                return await WaitTX(txid);
			}).AsAsyncOperation();
            }

            public void Finished(DBRunner runner)
            {
                lock (runnersLock)
                {
                    runners.Remove(runner.DatabaseName);
                }
            }

            public void Ok(string txid, string result)
            {
            	this.TxDone(txid, result, "");
            }

            public void Ok(string txid)
            {
            	this.TxDone(txid, "", "");
            }

            public void Error(string txid, string message)
            {
            	this.TxDone(txid, "", message);
            }
        }

        /// <summary>
        /// Maintain a single database with a thread/queue pair to feed requests to it
        /// </summary>
        internal class DBRunner
        {
            private DatabaseManager databases;
            private SQLiteConnection db;
            public string DatabaseName { get; private set; }
            public string path { get; private set; }
            private readonly string openCalllbackId;
            private IAsyncAction thread;
            private SemaphoreSlim done;
            private readonly BlockingQueue<DBQuery> queue;

            internal DBRunner(DatabaseManager databases, string dbname, string cbc)
            {
                this.databases = databases;
                this.DatabaseName = dbname;
                this.path = Windows.Storage.ApplicationData.Current.LocalFolder.Path +"\\"+ dbname;
                this.queue = new BlockingQueue<DBQuery>();
                this.openCalllbackId = cbc;
                this.done = new SemaphoreSlim(1);
                this.done.Wait();
            }

            public void Start()
            {
                this.thread = Windows.System.Threading.ThreadPool.RunAsync(
                	(workItem) => { this.Run(workItem); }
				);
                this.thread.Completed = new AsyncActionCompletedHandler(
                    (IAsyncAction asyncInfo, AsyncStatus asyncStatus) =>
                    {
                        this.done.Release();
                    }
                );

            }

            public void WaitForStopped()
            {
                done.Wait();
                done.Release();
            }

            internal void Enqueue(DBQuery dbq)
            {
                this.queue.Enqueue(dbq);
            }

            private void Run(IAsyncAction act)
            {
                try
                {
                    // As a query can be requested for the callback for "open" has been completed, 
                    // the thread may not be started by the open request, in which case no open callback id
                    this.db = new SQLiteConnection(this.path);

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
            internal static async void DeleteDatabaseNow(DatabaseManager databases, string dbname, string callBackId)
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

                    var fileExtension = new[] { "", "-journal", "-wal", "-shm" };
                    foreach (var extension in fileExtension)
                    {
                        var file = await Windows.Storage.StorageFile.GetFileFromPathAsync(Path.Combine(folderPath, fileName + extension));
                        await file.DeleteAsync();
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

            internal void executeSqlBatch(DBQuery dbq)
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
                                        if (column.Value.GetType().Equals(typeof(Int64)))
                                        {
                                            rowString += String.Format("\"{0}\":{1}",
                                                column.Key, Convert.ToInt64(column.Value));
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
        internal class DBQuery
        {
            public bool Stop { get; private set; }
            public bool Delete { get; private set; }
            public TransactionsCollection Queries { get; private set; }
            public string CallbackId { get; private set; }

            /// <summary>
            /// Create a request to run a query
            /// </summary>
            public DBQuery(TransactionsCollection queries, string txid)
            {
                this.Stop = false;
                this.Delete = false;

                this.Queries = queries;

                this.CallbackId = txid;
            }

            /// <summary>
            /// Create a request to close, and optionally delete, a database
            /// </summary>
            public DBQuery(bool delete, string txid)
            {
                this.Stop = true;
                this.Delete = delete;

                this.Queries = null;

                this.CallbackId = txid;
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
