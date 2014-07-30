
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
            string mycbid = this.CurrentCommandCallbackId;
            //System.Diagnostics.Debug.WriteLine("SQLitePlugin.open() with cbid " + mycbid + " options:" + options);

            try
            {
                String [] jsonOptions = JsonHelper.Deserialize<string[]>(options);
                dbOptions = JsonHelper.Deserialize<SQLitePluginOpenCloseOptions>(jsonOptions[0]);
                mycbid = jsonOptions[1];
                //System.Diagnostics.Debug.WriteLine("real cbid: " + mycbid);
            }
            catch (Exception)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION), mycbid);
                return;
            }

            // check if options were valid
            if (dbOptions != null)
            {

                //System.Diagnostics.Debug.WriteLine("SQLitePlugin.open() dbname:" + dbOptions.name);

                DispatchCommandResult(new PluginResult(PluginResult.Status.OK), mycbid);

            }
            else
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "Invalid openDatabase parameters"), mycbid);
            }
        }

        public void close(string options)
        {
            string mycbid = this.CurrentCommandCallbackId;
            //System.Diagnostics.Debug.WriteLine("SQLitePlugin.close() with cbid " + mycbid + " options:" + options);

            try
            {
                String[] jsonOptions = JsonHelper.Deserialize<string[]>(options);
                mycbid = jsonOptions[1];
                //System.Diagnostics.Debug.WriteLine("real cbid: " + mycbid);
            }
            catch (Exception)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION), mycbid);
                return;
            }

            /* check we have a database, and close it
            if (this.db != null)
                this.db.Close();
             */

            DispatchCommandResult(new PluginResult(PluginResult.Status.OK), mycbid);
        }

        public void delete(string options)
        {
            string mycbid = this.CurrentCommandCallbackId;

            //System.Diagnostics.Debug.WriteLine("SQLitePlugin.delete() with cbid " + mycbid + " options:" + options);
            try
            {
                String[] jsonOptions = JsonHelper.Deserialize<string[]>(options);
                mycbid = jsonOptions[1];
                //System.Diagnostics.Debug.WriteLine("real cbid: " + mycbid);
            }
            catch (Exception)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION), mycbid);
                return;
            }

            //DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "Sorry SQLitePlugin.delete() not implemented"), mycbid);
            DispatchCommandResult(new PluginResult(PluginResult.Status.OK), mycbid);
        }

        public void backgroundExecuteSqlBatch(string options)
        {
            string mycbid = this.CurrentCommandCallbackId;
            //System.Diagnostics.Debug.WriteLine("SQLitePlugin.backgroundExecuteSqlBatch() with cbid " + mycbid + " options:" + options);
            executeSqlBatch(options);
        }

        public void executeSqlBatch(string options)
        {
            string mycbid = this.CurrentCommandCallbackId;
            //System.Diagnostics.Debug.WriteLine("SQLitePlugin.executeSqlBatch() with cbid " + mycbid + " options:" + options);

            //Deployment.Current.Dispatcher.BeginInvoke(() =>
            {
                List<string> opt = JsonHelper.Deserialize<List<string>>(options);
                SQLitePluginExecuteSqlBatchOptions batch = JsonHelper.Deserialize<SQLitePluginExecuteSqlBatchOptions>(opt[0]);

                mycbid = opt[1];
                //System.Diagnostics.Debug.WriteLine("real cbid: " + mycbid);

                // XXX TODO keep in a map:
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

				string batchResultsStr = "";

                // loop through the sql in the transaction
                foreach (SQLitePluginTransaction transaction in batch.executes)
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
                                            rowString += String.Format("\"{0}\":{1}",
                                                column.Key, Convert.ToDouble(column.Value));
                                        }
                                        else
                                        {
                                            rowString += String.Format("\"{0}\":\"{1}\"",
                                                column.Key, column.Value.ToString().Replace("\\","\\\\").Replace("\"","\\\""));
                                        }
                                    }
                                    else
                                    {
                                        rowString += String.Format("\"{0}\":null", column.Key);
                                    }

                                }

                                rowsString += "{" + rowString + "}";
                            }

                            resultString = "\"rows\":["+rowsString+"]";
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
						batchResultsStr += "{\"qid\":\"" + transaction.queryId + "\",\"type\":\"error\",\"result\":{\"message\":\"" + errorMessage.Replace("\\","\\\\").Replace("\"","\\\"") + "\"}}";
                    }
                }

                DispatchCommandResult(new PluginResult(PluginResult.Status.OK, "["+batchResultsStr+"]"), mycbid);
            }//);
        }
    }
}
