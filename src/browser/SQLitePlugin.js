(function(root) {
  //var root = this;

  nextTick = window.setImmediate || function(fun) {
    window.setTimeout(fun, 0);
  };

  root.sqlitePlugin = {
    sqliteFeatures: {
      isSQLitePlugin: true
    },
    // TODO: echoTest, selfTest
    openDatabase: function(opts, okcb, errorcb) {
      var mydb = window.openDatabase(opts.name, '1.0', 'Test', 5*1024*1024);
      var dbobj = {
        //* **
        transaction: function(f, errorcb, okcb) {
          mydb.transaction(function(tx) {
            var txobj = {
              executeSql: function(sql, values, sqlok, sqlerror) {
                tx.executeSql(sql, values, function(ignored, rs) {
                  if (!!sqlok) sqlok(txobj, rs);
                }, function(ignored, error) {
                  if (!!sqlerror) sqlerror(txobj, error);
                });
              }
            };
            f(txobj);
          }, function(error) {
            if (!!errorcb) errorcb(error);
          }, function() {
            if (!!okcb) okcb();
          });
        },
        readTransaction: function(f, errorcb, okcb) {
          mydb.readTransaction(function(tx) {
            var txobj = {
              executeSql: function(sql, values, sqlok, sqlerror) {
                tx.executeSql(sql, values, function(ignored, rs) {
                  if (!!sqlok) sqlok(txobj, rs);
                }, function(ignored, error) {
                  if (!!sqlerror) sqlerror(txobj, error);
                });
              }
            };
            f(txobj);
          }, function(error) {
            if (!!errorcb) errorcb(error);
          }, function() {
            if (!!okcb) okcb();
          });
        },
        executeSql: function(sql, values, sqlok, sqlerror) {
          mydb.transaction(function(tx) {
            try {
              tx.executeSql(sql, values, function(ignored, rs) {
                if (!!sqlok) sqlok(rs);
              }, function(ignored, error) {
                if (!!sqlerror) sqlerror(error);
              });
            } catch(e) {
              if (!!sqlerror) sqlerror(e);
            }
          });
        },
        sqlBatch: function(sl, okcb, errorcb) {
          if (!!errorcb) nextTick(function() {
            errorcb(new Error('NOT IMPLEMENTED'));
          });
        },
        close: function(cb1, cb2) {
          if (!!cb1) nextTick(cb1);
        }
      };
      nextTick(function() {
        if (!!okcb) okcb(dbobj);
      });
      return dbobj;
    },
    // TODO: deleteDatabase
  };

})(this);
