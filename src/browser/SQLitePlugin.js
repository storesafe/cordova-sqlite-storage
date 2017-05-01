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
        transaction: function(f, errorcb, okcb) {
          if (!f || typeof(f) !== 'function') throw new Error('transaction expected a function');
          mydb.transaction(function(tx) {
            var txobj = {
              executeSql: function(sql, values, sqlok, sqlerror) {
                if (sql === null || sql === void 0) throw new Error('asdf');
                var params = (!!values && values.constructor === Array) ? values : null;
                tx.executeSql(sql, params, function(ignored, rs) {
                  if (!!sqlok) sqlok(txobj, rs);
                }, function(ignored, error) {
                  //if (!sqlerror) throw error;
                  if (!sqlerror) throw new Error('no sql error callback');
                  var e = (!!error.code) ? error : {code: 0, message: error.message};
                  return sqlerror(txobj, e) !== false;
                });
              }
            };
            f(txobj);
          }, function(error) {
            //if (!!errorcb) errorcb(error);
            if (!!errorcb)
              errorcb((!!error.code) ? error : {code: 0, message: error.message});
          }, function() {
            if (!!okcb) okcb();
          });
        },
        readTransaction: function(f, errorcb, okcb) {
          if (!f || typeof(f) !== 'function') throw new Error('transaction expected a function');
          mydb.readTransaction(function(tx) {
            var txobj = {
              executeSql: function(sql, values, sqlok, sqlerror) {
                if (sql === null || sql === void 0) throw new Error('asdf');
                var params = (!!values && values.constructor === Array) ? values : null;
                tx.executeSql(sql, params, function(ignored, rs) {
                  if (!!sqlok) sqlok(txobj, rs);
                }, function(ignored, error) {
                  //if (!sqlerror) throw error;
                  if (!sqlerror) throw new Error('no sql error callback');
                  return sqlerror(txobj, error) !== false;
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
              var params = (!!values && values.constructor === Array) ? values : null;
              tx.executeSql(sql, params, function(ignored, rs) {
                if (sql === null || sql === void 0) throw new Error('asdf');
                if (!!sqlok) sqlok(rs);
              }, function(ignored, error) {
                if (!sqlerror) throw new Error('no error callback');
                return sqlerror(error) !== false;
              });
            } catch(e) {
              if (!!sqlerror) sqlerror(e);
            }
          });
        },
        sqlBatch: function(sqlStatements, success, error) {
          var batchList, j, len1, myfn, st;
          if (!sqlStatements || sqlStatements.constructor !== Array) {
            throw newSQLError('sqlBatch expects an array');
          }
          batchList = [];
          for (j = 0, len1 = sqlStatements.length; j < len1; j++) {
            st = sqlStatements[j];
            if (st.constructor === Array) {
              if (st.length === 0) {
                throw newSQLError('sqlBatch array element of zero (0) length');
              }
              batchList.push({
                sql: st[0],
                params: st.length === 0 ? [] : st[1]
              });
            } else {
              batchList.push({
                sql: st,
                params: []
              });
            }
          }
          //alert('batch list: ' + JSON.stringify(batchList));
          mydb.transaction(function(tx) {
            try {
              for (k = 0, len2 = batchList.length; k < len2; k++) {
                elem = batchList[k];
                //alert('elem.sql: ' + elem.sql);
                //alert('elem.params: ' + JSON.stringify(elem.params));
                tx.executeSql(elem.sql, elem.params);
	      }
            } catch(e) {
              //alert('exception: ' + JSON.stringify(e));
              if (!!sqlerror) sqlerror(e);
            }
          }, error, success);
        },
        close: function(cb1, cb2) {
          if (!!cb2) nextTick(function() {cb2(new Error('not implemented'));});
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
