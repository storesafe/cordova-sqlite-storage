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
		    res = SQLitePluginRT.SQLitePlugin.openAsync(options.name);
		} catch(ex) {
			fail(ex);
		}
		handle(res, win, fail);
	},
	close: function(win, fail, args) {
	    var options = args[0];
	    var res;
		try {
		    res = SQLitePluginRT.SQLitePlugin.closeAsync(JSON.stringify(options));
        } catch (ex) {
			fail(ex);
		}
		handle(res, win, fail);
	},
	backgroundExecuteSqlBatch: function(win, fail, args) {
	    var options = args[0];
	    var dbname = options.dbargs.dbname;
	    var executes = options.executes.map(function (e) { return [String(e.qid), e.sql, e.params]; });
	    var res;
		try {
		    res = SQLitePluginRT.SQLitePlugin.backgroundExecuteSqlBatch(dbname,executes);
		} catch(ex) {
			fail(ex);
		}
		handle(res, win, fail);
	},
	"delete": function(win, fail, args) {
	    var options = args[0];
	    var res;
		try {
		    res = SQLitePluginRT.SQLitePlugin.deleteAsync(JSON.stringify(options));
		} catch(ex) {
			fail(ex);
		}
		handle(res, win, fail);
	}
};
require("cordova/exec/proxy").add("SQLitePlugin", module.exports);
