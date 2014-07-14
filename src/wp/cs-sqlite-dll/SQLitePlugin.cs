
using System;
using System.Linq;
using System.Runtime.Serialization;
using System.Windows;
using System.Collections.Generic;
using SQLite;
using Microsoft.Phone.Controls;
using Microsoft.Phone.Shell;
using System.Collections.ObjectModel;
using WPCordovaClassLib.Cordova;
using WPCordovaClassLib.Cordova.Commands;
using WPCordovaClassLib.Cordova.JSON;
using System.Text.RegularExpressions;
using Newtonsoft.Json.Linq;

namespace Cordova.Extension.Commands
{

    public class SQLitePlugin : BaseCommand
    {
        #region SQLitePlugin options

        [DataContract]
        public class SQLitePluginOpenCloseOptions
        {
            [DataMember(IsRequired = true, Name = "name")]
            public string name { get; set; }

            [DataMember(IsRequired = false, Name = "bgType", EmitDefaultValue = false)]
            public int bgType = 0;
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
            /// Identifier for transaction
            /// </summary>
            [DataMember(IsRequired = true, Name = "qid")]
            public string queryId { get; set; }

            /// <summary>
            /// Identifier for transaction
            /// </summary>
            [DataMember(IsRequired = true, Name = "sql")]
            public string query { get; set; }

            /// <summary>
            /// Identifier for transaction
            /// </summary>
            [DataMember(IsRequired = true, Name = "params")]
            public string[] query_params { get; set; }

        }

        #endregion

        private SQLitePluginOpenCloseOptions dbOptions = null;
        private SQLiteConnection db;

        public void open(string options)
        {
            System.Diagnostics.Debug.WriteLine("SQLitePlugin.open with options:" + options);

            try
            {
                String jsonOptions = JsonHelper.Deserialize<string[]>(options)[0];
                dbOptions = JsonHelper.Deserialize<SQLitePluginOpenCloseOptions>(jsonOptions);
            }
            catch (Exception)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
                return;
            }

            // check if options were valid
            if (dbOptions != null)
            {

                System.Diagnostics.Debug.WriteLine("SQLitePlugin.open():" + dbOptions.name);

                DispatchCommandResult(new PluginResult(PluginResult.Status.OK));

            }
            else
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "Invalid openDatabase parameters"));
            }
        }

        public void close(string options)
        {
            System.Diagnostics.Debug.WriteLine("SQLitePlugin.close()");

            // check we have a database, and close it
            if (this.db != null)
                this.db.Close();

            DispatchCommandResult(new PluginResult(PluginResult.Status.OK));
        }

        public void backgroundExecuteSqlBatch(string options)
        {
            executeSqlBatch(options);
        }

        public void executeSqlBatch(string options)
        {
            Deployment.Current.Dispatcher.BeginInvoke(() =>
            {
                List<string> opt = JsonHelper.Deserialize<List<string>>(options);
                SQLitePluginExecuteSqlBatchOptions batch = JsonHelper.Deserialize<SQLitePluginExecuteSqlBatchOptions>(opt[0]);
                JArray batchResults = new JArray();

                // check our db is not null, create a new connection
                if (this.db == null || !this.db.DatabasePath.Equals(dbOptions.name))
                {
                    // close open database to be safe
                    if (this.db != null)
                    {
                        this.db.Close();
                    }

                    // open database
                    this.db = new SQLiteConnection(dbOptions.name);
                }

                // loop through the sql in the transaction
                foreach (SQLitePluginTransaction transaction in batch.executes)
                {
                    JObject result = null;
                    string errorMessage = "unknown";
                    bool needQuery = true;

                    // begin
                    if (transaction.query.StartsWith("BEGIN", StringComparison.OrdinalIgnoreCase))
                    {
                        needQuery = false;

                        try
                        {
                            this.db.BeginTransaction();

                            result = new JObject();
                            result.Add("rowsAffected", 0);

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

                            result = new JObject();
                            result.Add("rowsAffected", 0);
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

                            result = new JObject();
                            result.Add("rowsAffected", 0);
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

                            result = new JObject();
                            result.Add("rowsAffected", 0);
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

                            result = new JObject();
                            result.Add("rowsAffected", res);

                            if (transaction.query.StartsWith("INSERT", StringComparison.OrdinalIgnoreCase))
                            {
                                result.Add("insertId", insertId);
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

                            JArray rows = new JArray();

                            foreach (SQLiteQueryRow res in results)
                            {
                                JObject row = new JObject();

                                foreach (SQLiteQueryColumn column in res.column)
                                {
                                    if (column.Value != null)
                                    {
                                        if (column.Value.GetType().Equals(typeof(Int32)))
                                        {
                                            row.Add(column.Key, Convert.ToInt32(column.Value));
                                        }
                                        else if (column.Value.GetType().Equals(typeof(Double)))
                                        {
                                            row.Add(column.Key, Convert.ToDouble(column.Value));
                                        }
                                        else
                                        {
                                            row.Add(column.Key, column.Value.ToString());
                                        }
                                    }
                                    else
                                    {
                                        row.Add(column.Key, null);
                                    }

                                }

                                rows.Add(row);
                            }

                            result = new JObject();
                            result.Add("rows", rows);
                        }
                        catch (Exception e)
                        {
                            errorMessage = e.Message;
                        }

                    }

                    if (result != null)
                    {
                        JObject r = new JObject();
                        r.Add("qid", transaction.queryId);
                        r.Add("type", "success");
                        r.Add("result", result);

                        batchResults.Add(r);
                    }
                    else
                    {
                        JObject r = new JObject();
                        r.Add("qid", transaction.queryId);
                        r.Add("type", "error");

                        JObject err = new JObject();
                        err.Add("message", errorMessage);

                        r.Add("result", err);

                        batchResults.Add(r);
                    }
                }

                DispatchCommandResult(new PluginResult(PluginResult.Status.OK, batchResults.ToString()));

            });
        }
    }
}