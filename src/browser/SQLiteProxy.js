var dbmap = {};

function echoStringValue(success, error, options) {
  success(options[0].value);
}

function open(success, error, options) {
  var name = options[0].name;
  if (!!dbmap[name]) return error('INTERNAL ERROR: db already open for ' + name);

  try {
    dbmap[name] = new window.SQL.Database();
  } catch(e) {
    // XXX INTERNAL ERROR:
    return error(e);
  }

  setTimeout(success, 0);
}

function backgroundExecuteSqlBatch(success, error, options) {
  var dbname = options[0].dbargs.dbname;

  if (!dbmap[dbname]) return error('INTERNAL ERROR: XXX');

  var db = dbmap[dbname];

  var e = options[0].executes;

  var resultList = [];

  for (var i = 0; i < e.length; ++i) {
    var sql = e[i].sql;
    var params = e[i].params;

    var rr = []

    var prevTotalChanges = (db.exec('SELECT total_changes()'))[0].values[0][0];

    try {
      db.each(sql, params, function(r) {
        rr.push(r);
      }, function() {
        var insertId = (db.exec('SELECT last_insert_rowid()'))[0].values[0][0];
        var totalChanges = (db.exec('SELECT total_changes()'))[0].values[0][0];
        var rowsAffected = totalChanges - prevTotalChanges;
        resultList.push({
          type: 'success',
          result: (rowsAffected !== 0) ? {
            rows: rr,
            insertId: insertId,
            rowsAffected: rowsAffected
          } : {
            rows: rr,
            rowsAffected: 0
          }
        });
      });
    } catch(e) {
      resultList.push({
        type: 'error',
        result: {
          code: -1, // XXX XXX
          message: e.toString()
        }
      });
    }
  }

  setTimeout(function() {
    success(resultList);
  }, 0);
}

function close(success, error, options) {
  var dbname = options[0].path;

  var db = dbmap[dbname];

  if (!db) return error('INTERNAL ERROR: XXX');

  db.close();

  setTimeout(success, 0);
}

module.exports = {
  echoStringValue: echoStringValue,
  open: open,
  backgroundExecuteSqlBatch: backgroundExecuteSqlBatch,
  close: close
}

require('cordova/exec/proxy').add('SQLitePlugin', module.exports);
