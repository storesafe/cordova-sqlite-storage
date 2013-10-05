/*
 * PhoneGap is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 *
 * Copyright (c) 2005-2011, Nitobi Software Inc.
 * Copyright (c) 2011, Microsoft Corporation
 */

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
    /// <summary>
    /// Implementes access to SQLite DB
    /// </summary>
    public class SQLitePlugin : BaseCommand
    {
        #region SQLitePlugin options

        [DataContract]
        public class SQLitePluginOpenCloseOptions
        {
            [DataMember(IsRequired = true, Name = "dbName")]
            public string DBName { get; set; }
        }

        [DataContract]
        public class SQLitePluginExecuteSqlBatchOptions
        {
            [DataMember]
            public TransactionsCollection Transactions { get; set; }
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
            [DataMember(IsRequired = true, Name = "trans_id")]
            public string transId { get; set; }

            /// <summary>
            /// Identifier for transaction
            /// </summary>
            [DataMember(IsRequired = true, Name = "query_id")]
            public string queryId { get; set; }

            /// <summary>
            /// Identifier for transaction
            /// </summary>
            [DataMember(IsRequired = true, Name = "query")]
            public string query { get; set; }

            /// <summary>
            /// Identifier for transaction
            /// </summary>
            [DataMember(IsRequired = true, Name = "params")]
            public string[] query_params { get; set; }

        }
        public class SQLiteTransactionResult
        {
            public string transId;
            public List<SQLiteQueryResult> results;
        }
        public class SQLiteQueryResult
        {
            public string queryId;
            public List<SQLiteQueryRow> result;
        }

        #endregion
        private string dbName = "";
        private SQLiteConnection db;
        //we don't actually open here, we will do this with each db transaction
        public void open(string options)
        {
            //Expected: {\"dbName\":\"gid_native.sqlite3\"}

            SQLitePluginOpenCloseOptions dbOptions;
            String dbName = "";
            try
            {
                var dbNameParam = JsonHelper.Deserialize<string[]>(options);
                dbOptions = JsonHelper.Deserialize<SQLitePluginOpenCloseOptions>(dbNameParam[0]);
            }
            catch (Exception)            {

                DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
                return;
            }

            if (dbOptions != null && dbOptions.DBName != null)
            {
                dbName = dbOptions.DBName;
                System.Diagnostics.Debug.WriteLine("SQLitePlugin.open():" + dbName);
                DispatchCommandResult(new PluginResult(PluginResult.Status.OK));
                this.dbName = dbName;
            }
            else
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "No database name"));
            }
        }
        public void close(string options)
        {
            System.Diagnostics.Debug.WriteLine("SQLitePlugin.close()");

            if (this.db != null)
                this.db.Close();

            this.db = null;
            DispatchCommandResult(new PluginResult(PluginResult.Status.OK));
        }
        public void executeSqlBatch(string options)
        {
            List<string> opt = JsonHelper.Deserialize<List<string>>(options);
            TransactionsCollection transactions;
            SQLiteTransactionResult transResult = new SQLiteTransactionResult();
            try
            {
                if (this.db == null)
                    this.db = new SQLiteConnection(this.dbName);
                transactions = JsonHelper.Deserialize<TransactionsCollection>(opt[0]);


                this.db.RunInTransaction(() =>
                {
                    foreach (SQLitePluginTransaction transaction in transactions)
                    {
                        transResult.transId = transaction.transId;
                        System.Diagnostics.Debug.WriteLine("queryId: " + transaction.queryId + " transId: " + transaction.transId + " query: " + transaction.query);
                        int first = transaction.query.IndexOf("DROP TABLE", StringComparison.OrdinalIgnoreCase);
                        if (first != -1)
                        {
                            //-- bug where drop tabe does not work
                            transaction.query = Regex.Replace(transaction.query, "DROP TABLE IF EXISTS", "DELETE FROM", RegexOptions.IgnoreCase);
                            transaction.query = Regex.Replace(transaction.query, "DROP TABLE", "DELETE FROM", RegexOptions.IgnoreCase);
                            //--
                            var results = db.Execute(transaction.query, transaction.query_params);
                            //TODO call the callback function if there is a query_id
                            SQLiteQueryResult queryResult = new SQLiteQueryResult();
                            queryResult.queryId = transaction.queryId;
                            queryResult.result = null;
                            if (transResult.results == null)
                                transResult.results = new List<SQLiteQueryResult>();
                            transResult.results.Add(queryResult);
                        }
                        else
                        {
                            var results = this.db.Query2(transaction.query, transaction.query_params);
                            SQLiteQueryResult queryResult = new SQLiteQueryResult();
                            queryResult.queryId = transaction.queryId;
                            queryResult.result = results;
                            if (transResult.results == null)
                                transResult.results = new List<SQLiteQueryResult>();
                            transResult.results.Add(queryResult);
                        }

                    }
                });
            }
            catch (Exception e)
            {
                System.Diagnostics.Debug.WriteLine("Error: " + e);
                DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
                return;
            }
            DispatchCommandResult(new PluginResult(PluginResult.Status.OK, JsonHelper.Serialize(transResult)));
        }
    }
}