var dbmap = {};

var nextTick = window.setImmediate || function(fun) {
    window.setTimeout(fun, 0);
};

function handle(p, win, fail) {
    if (p)
        p.done(
            function (res) {
                if (res[1])
                    fail(res[1]);
                else
                    win(res[0]?JSON.parse(res[0]):[]);
            },
            function (err) {
                fail(err);
            }
        );
}

module.exports = {
	open: function(win, fail, args) {
	    var options = args[0];
	    var res;
		try {
			dbname = options.name;
			// from @EionRobb / phonegap-win8-sqlite:
			opendbname = Windows.Storage.ApplicationData.current.localFolder.path + "\\" + dbname;
			console.log("db name: " + dbname + " at full path: " + opendbname);

			db = new SQLite3JS.Database(opendbname);
			dbmap[dbname] = db;
			nextTick(function() {
				win();
			});
		    //res = SQLitePluginRT.SQLitePlugin.openAsync(options.name);
		} catch(ex) {
			//fail(ex);
			nextTick(function() {
				fail(ex);
			});
		}
		//handle(res, win, fail);
	},
	close: function(win, fail, args) {
	    var options = args[0];
	    var res;
		try {
		    //res = SQLitePluginRT.SQLitePlugin.closeAsync(JSON.stringify(options));
        } catch (ex) {
			fail(ex);
		}
		//handle(res, win, fail);
	},
	backgroundExecuteSqlBatch: function(win, fail, args) {
	    var options = args[0];
	    var dbname = options.dbargs.dbname;
		var executes = options.executes;
	    //var executes = options.executes.map(function (e) { return [String(e.qid), e.sql, e.params]; });
		var db = dbmap[dbname];
		var results = [];
		var i, count=executes.length;
		//console.log("executes: " + JSON.stringify(executes));
		//console.log("execute sql count: " + count);
		for (i=0; i<count; ++i) {
			var e = executes[i];
			//console.log("execute sql: " + e.sql + " params: " + JSON.stringify(e.params));
			try {
				var oldTotalChanges = db.totalChanges();
				var rows = db.all(e.sql, e.params);
				//console.log("got rows: " + JSON.stringify(rows));
				var rowsAffected = db.totalChanges() - oldTotalChanges;
				var result = { rows: rows, rowsAffected: rowsAffected };
				if (rowsAffected > 0) {
					var lastInsertRowid = db.lastInsertRowid();
					if (lastInsertRowid !== 0) result.insertId = lastInsertRowid;
				}
				results.push({
					type: "success",
					qid: e.qid,
					result: result
				});
			} catch(ex) {
				console.log("sql exception error: " + ex.message);
				results.push({
					type: "error",
					qid: e.qid,
					result: { code: -1, message: ex.message }
				});
			}
		}
		//console.log("return results: " + JSON.stringify(results));
		nextTick(function() {
			//console.log("return results: " + JSON.stringify(results));
			win(results);
		});
	},
	"delete": function(win, fail, args) {
	    var options = args[0];
	    var res;
		try {
		    //res = SQLitePluginRT.SQLitePlugin.deleteAsync(JSON.stringify(options));
		} catch(ex) {
			fail(ex);
		}
		//handle(res, win, fail);
	}
};
require("cordova/exec/proxy").add("SQLitePlugin", module.exports);
