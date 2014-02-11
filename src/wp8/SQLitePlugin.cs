/*
* PhoneGap is available under *either* the terms of the modified BSD license *or* the
* MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
*
* Copyright (c) 2005-2011, Nitobi Software Inc.
* Copyright (c) 2011, Microsoft Corporation
*/

using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Diagnostics;
using System.Linq;
using System.Runtime.Serialization;
using System.Text.RegularExpressions;
using System.Threading;
using Newtonsoft.Json;
using SQLite;
using WPCordovaClassLib.Cordova;
using WPCordovaClassLib.Cordova.Commands;

namespace Cordova.Extension.Commands
{
	public class SQLitePlugin : BaseCommand
	{
		#region SQLitePlugin options
		[DataContract]
		public class SQLitePluginOpenCloseOptions
		{
			public string DBName
			{
				get
				{
					return string.IsNullOrWhiteSpace(this.name) ? this.dbname : this.name;
				}
			}
			[DataMember]
			private string name;
			[DataMember]
			private string dbname;
		}
		[DataContract]
		public class SQLitePluginExecuteSqlBatchOptions
		{
			[DataMember(Name = "dbargs")]
			public SQLitePluginOpenCloseOptions DbArgs { get; set; }
			[DataMember(Name = "executes")]
			public TransactionsCollection Transactions { get; set; }
		}
		[CollectionDataContract]
		public class TransactionsCollection : Collection<SQLitePluginTransaction>
		{
		}
		[DataContract]
		public class SQLitePluginTransaction
		{
			[DataMember(Name = "qid", IsRequired = true)]
			public string QueryId { get; set; }

			[DataMember(Name = "sql", IsRequired = true)]
			public string Query { get; set; }

			[DataMember(IsRequired = true, Name = "params")]
			public string[] QueryParams { get; set; }
		}

		[DataContract]
		public class SQLiteQueryRowSpecial
		{
			[DataMember(Name = "rows")]
			public IEnumerable<object> Rows { get; set; }
			[DataMember(Name = "rowsAffected")]
			public int RowsAffected { get; set; }
			[DataMember(Name = "insertId")]
			public long? LastInsertId { get; set; }
		}
		[DataContract]
		public class SQLiteQueryResult
		{
			[DataMember(Name = "qid")]
			public string QueryId { get; set; }
			[DataMember(Name = "result")]
			public SQLiteQueryRowSpecial ResultRows { get; set; }
			[DataMember(Name = "type")]
			public string Type { get; set; }
			public SQLiteQueryResult(string queryId, string type = "success")
			{
				this.QueryId = queryId;
				this.Type = type;
				this.ResultRows = new SQLiteQueryRowSpecial();
			}
		}
		#endregion
		private SQLitePluginOpenCloseOptions dbOptions = new SQLitePluginOpenCloseOptions();
		private readonly AutoResetEvent signal = new AutoResetEvent(false);
		//we don't actually open here, we will do this with each db transaction
		public void open(string options)
		{
			Debug.WriteLine("SQLitePlugin.open with options:" + options);
			string callbackId;
			if (!TryDeserializeOptions(options, out this.dbOptions, out callbackId))
			{
				this.DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
				return;
			}
			if (string.IsNullOrEmpty(this.dbOptions.DBName))
			{
				this.DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "No database name"), callbackId);
			}
			else
			{
				Debug.WriteLine("SQLitePlugin.open():" + this.dbOptions.DBName);
				this.signal.Set();
				this.DispatchCommandResult(new PluginResult(PluginResult.Status.OK), callbackId);
			}
		}
		public void close(string options)
		{
			string arguments;
			string callbackId;
			if (!TryDeserializeOptions(options, out arguments, out callbackId))
			{
				this.DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
				return;
			}
			Debug.WriteLine("SQLitePlugin.close()");
			this.dbOptions = new SQLitePluginOpenCloseOptions();
			this.DispatchCommandResult(new PluginResult(PluginResult.Status.OK), callbackId);
		}

		public void executeSqlBatch(string options)
		{
			SQLitePluginExecuteSqlBatchOptions executeSqlBatchOptions;
			string callbackId;
			if (!TryDeserializeOptions(options, out executeSqlBatchOptions, out callbackId))
			{
				this.DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
				return;
			}
			string dbName;
			if (!this.TryGetDbName(executeSqlBatchOptions, out dbName))
			{
				this.DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "Database is not open!"), callbackId);
				return;
			}
			try
			{
				var results = Enumerable.Empty<SQLiteQueryResult>();
				using (var dbConnection = new SQLiteConnection(dbName))
				{
					dbConnection.RunInTransaction(() =>
					{
						results = this.ExecuteSqlBatchCore(executeSqlBatchOptions, dbConnection).ToArray();
					});
					dbConnection.Close();
				}
				this.DispatchCommandResult(new PluginResult(PluginResult.Status.OK, JsonConvert.SerializeObject(results)), callbackId);
			}
			catch (Exception e)
			{
				Debug.WriteLine("Error: " + e);
				this.DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR), callbackId);
			}
		}
		private IEnumerable<SQLiteQueryResult> ExecuteSqlBatchCore(SQLitePluginExecuteSqlBatchOptions executeSqlBatchOptions, SQLiteConnection dbConnection)
		{
			foreach (var transaction in executeSqlBatchOptions.Transactions)
			{
				Debug.WriteLine("queryId: " + transaction.QueryId + " query: " + transaction.Query);
				var queryResult = new SQLiteQueryResult(transaction.QueryId);
				if (transaction.Query.IndexOf("DROP TABLE", StringComparison.OrdinalIgnoreCase) != -1)
				{
					//-- bug where drop tabe does not work
					transaction.Query = Regex.Replace(transaction.Query, "DROP TABLE IF EXISTS", "DELETE FROM", RegexOptions.IgnoreCase);
					transaction.Query = Regex.Replace(transaction.Query, "DROP TABLE", "DELETE FROM", RegexOptions.IgnoreCase);
					//--
					dbConnection.Execute(transaction.Query, transaction.QueryParams);
					//TODO call the callback function if there is a query_id
				}
				else
				{
					//--if the transaction contains only of COMMIT or ROLLBACK query - do not execute it - there is no point as RunInTransaction is releaseing savepoint at its end.
					//--So if COMMIT or ROLLBACK by itself is executed then there will be nothing to release and exception will occur.
					if (!EqualsIgnoreCase(transaction.Query, "commit") && !EqualsIgnoreCase(transaction.Query, "rollback"))
					{
						queryResult.ResultRows.Rows = dbConnection.Query2(transaction.Query, transaction.QueryParams)
																  .Select(sqliteRow => sqliteRow.column)
																  .Select(rowColumns => (object)rowColumns.ToDictionary(c => c.Key, c => c.Value));
					}
					queryResult.ResultRows.RowsAffected = SQLite3.Changes(dbConnection.Handle);
					queryResult.ResultRows.LastInsertId = SQLite3.LastInsertRowid(dbConnection.Handle);
				}
				yield return queryResult;
			}
		}
		private bool TryGetDbName(SQLitePluginExecuteSqlBatchOptions executeSqlBatchOptions, out string dbName)
		{
			dbName = string.IsNullOrWhiteSpace(executeSqlBatchOptions.DbArgs.DBName) ? this.dbOptions.DBName : executeSqlBatchOptions.DbArgs.DBName;
			if (string.IsNullOrWhiteSpace(dbName))
			{
				this.signal.WaitOne(1000);
				dbName = this.dbOptions.DBName;
			}
			return !string.IsNullOrWhiteSpace(dbName);
		}
		private static bool TryDeserializeOptions<T>(string options, out T result, out string callbackId) where T : class
		{
			result = null;
			callbackId = string.Empty;
			try
			{
				var jsonOptions = JsonConvert.DeserializeObject<string[]>(options);
				result = JsonConvert.DeserializeObject<T>(jsonOptions[0]);
				callbackId = jsonOptions[1];
				return true;
			}
			catch
			{
				return false;
			}
		}
		private static bool EqualsIgnoreCase(string first, string second)
		{
			if (first == null || second == null)
			{
				return first == second;
			}
			return first.Trim().Equals(second.Trim(), StringComparison.OrdinalIgnoreCase);
		}
	}
}