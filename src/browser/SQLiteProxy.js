var dbmap = {};

var closed_dbmap = {};

function echoStringValue(success, error, options) {
  success(options[0].value);
}

var SQL = null;

window.initSqlJs().then(sql => { SQL = sql })

function openDatabase(success, error, options) {
  var name = options[0].name;

  if (!!dbmap[name]) return setTimeout(function() {
    error('INTERNAL OPEN ERROR: db already open for ' + name);
  }, 0);

  // Support close-and-reopen tests
  if (!!closed_dbmap[name]) {
    var db = dbmap[name] = closed_dbmap[name];
    delete closed_dbmap[name];
    try {
      db.exec('ROLLBACK');
    } catch(e) { }
    return setTimeout(success, 0);
  }

  try {
    dbmap[name] = new SQL.Database();
  } catch(e) {
    // INTERNAL OPEN ERROR
    return error(e);
  }

  setTimeout(success, 0);
}

function backgroundExecuteSqlBatch(success, error, options) {
  var dbname = options[0].dbargs.dbname;

  if (!dbmap[dbname]) return error('INTERNAL ERROR: database not open');

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
      // FUTURE TODO: report correct error code according to Web SQL
      resultList.push({
        type: 'error',
        result: {
          code: 0,
          message: e.toString()
        }
      });
    }
  }

  setTimeout(function() {
    success(resultList);
  }, 0);
}

function closeDatabase(success, error, options) {
  var dbname = options[0].path;

  var db = dbmap[dbname];

  if (!db) return setTimeout(function() {
    error('INTERNAL CLOSE ERROR: database not open');
  }, 0);

  // Keep in memory to support close-and-reopen tests
  closed_dbmap[dbname] = dbmap[dbname];

  delete dbmap[dbname];

  setTimeout(success, 0);
}

function deleteDatabase(success, error, options) {
  var dbname = options[0].path;

  if (!!closed_dbmap[dbname]) {
    // XXX TBD causes test timeouts:
    // closed_dbmap[name].close();
    delete closed_dbmap[dbname];
    return setTimeout(success, 0);
  }

  var db = dbmap[dbname];

  if (!db) return setTimeout(function() {
    error('INTERNAL DELETE ERROR');
  }, 0);

  db.close();

  delete dbmap[dbname];

  setTimeout(success, 0);
}

module.exports = {
  echoStringValue: echoStringValue,
  open: openDatabase,
  backgroundExecuteSqlBatch: backgroundExecuteSqlBatch,
  close: closeDatabase,
  delete: deleteDatabase
}

require('cordova/exec/proxy').add('SQLitePlugin', module.exports);
