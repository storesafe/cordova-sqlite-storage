###
     PGSQLitePlugin Lawnchair Adapter
     (c) 2011 Joe Noon <joenoon@gmail.com>
     This may be freely distributed under the MIT license.
###

root = this

fail = (e) ->
  console.log "Error in PGSQLitePlugin Lawnchair adapter: #{e.message}"
  return

now = () -> (new Date()).getTime()

pgsqlite_plugin =

  valid: () -> !!("PGSQLitePlugin" of root)

  init: (options, callback) ->
    that = this
    cb = @fn(@name, callback)
    sql = "CREATE TABLE IF NOT EXISTS #{@name} (id NVARCHAR(32) UNIQUE PRIMARY KEY, value TEXT, timestamp REAL)"
    success = () ->
      cb.call(that, that)
      return
    # open a connection and create the db if it doesn't exist
    db = options.db || @name
    @db = new PGSQLitePlugin("#{db}.sqlite3")
    @db.executeSql sql, success, fail
    return

  keys: (callback) ->
    that = this
    cb = @lambda(callback)
    sql = "SELECT id FROM #{@name} ORDER BY timestamp DESC"
    success = (res) ->
      cb.call(that, res.rows)
      return
    @db.executeSql sql, success, fail
    this

  save: (obj, callback) ->
    that = this
    db = @db
    id = obj.key || @uuid()
    ins = "INSERT INTO #{@name} (value, timestamp, id) VALUES (?,?,?)"
    up = "UPDATE #{@name} SET value = ?, timestamp = ? WHERE id = ?"
    success = () ->
      obj.key = id
      that.lambda(callback).call(that, obj) if callback
      return
    val = [ now(), id ]

    @exists obj.key, (exists) ->
      delete obj.key
      val.unshift(JSON.stringify(obj))
      sql = if exists then up else ins
      db.executeSql [ sql ].concat(val), success, fail
      return
    this

  batch: (objs, cb) ->
    return this unless objs && objs.length > 0

    that = this
    done = false
    finalized = false
    db = @db
    results = []

    # checkComplete is called after each individual records success, and on commit succes,
    # so one way or another, all conditions will be true at some point, avoiding race
    # conditions (the commit success occurs before every record success has been fired, etc),
    # and it will fire the user-supplied callback (with a fire-once-only safeguard).
    checkComplete = () ->
      return if finalized
      if done && cb && results.length == objs.length
        finalized = true
        that.lambda(cb).call(that, results)
      return

    updateProgress = (obj) ->
      results.push(obj)
      checkComplete()
      return

    ins = "INSERT INTO #{@name} (value, timestamp, id) VALUES (?,?,?)"
    up = "UPDATE #{@name} SET value = ?, timestamp = ? WHERE id = ?"

    marks = []
    keys = []
    for x in objs when x.key
      marks.push "?"
      keys.push x.key
    marks = marks.join(",")

    exists_success = (res) ->
      rows = res.rows
      # one pass through to create an efficient lookup table
      ids_hash = {}
      ids_hash[row.id] = true for row in rows
      transaction = (t) ->
        for obj in objs
          do (obj) ->
            id = obj.key || that.uuid()
            success = (u) ->
              obj.key = id
              updateProgress(obj)
              return
            val = [ now(), id ]
            sql = if obj.key of ids_hash then up else ins
            delete obj.key
            val.unshift(JSON.stringify(obj))
            t.executeSql [ sql ].concat(val), success, fail
            return
        return

      transaction_success = () ->
        done = true
        checkComplete()
        return

      db.transaction transaction, transaction_success, fail
      return

    if keys.length > 0
      # the case where there is at least one object with an existing key
      exists_sql = [ "SELECT id FROM #{@name} WHERE id IN (#{marks})" ].concat(keys)
      db.executeSql exists_sql, exists_success
    else
      # the case where every object is new, so we don't need to do a select query first
      exists_success({ rows: [] })

    this

  get: (keyOrArray, cb) ->
    return this unless keyOrArray
    that = this
    is_array = @isArray(keyOrArray)

    if is_array
      return this unless keyOrArray.length > 0
      marks = ("?" for x in keyOrArray).join(",")
      sql = [ "SELECT id, value FROM #{@name} WHERE id IN (#{marks})" ].concat(keyOrArray)
    else
      sql = [ "SELECT id, value FROM #{@name} WHERE id = ?" ].concat([ keyOrArray ])

    success = (res) ->
      r = for row in res.rows
        do (row) ->
          o = JSON.parse(row.value)
          o.key = row.id
          o

      r = r[0] if !is_array
      that.lambda(cb).call(that, r) if cb
      return

    @db.executeSql sql, success, fail
    this

  exists: (key, cb) ->
    that = this
    sql = [ "SELECT id FROM #{@name} WHERE id = ?", key ]
    success = (res) ->
      that.fn("exists", cb).call(that, res.rows.length > 0) if cb
      return
    @db.executeSql sql, success, fail
    this

  all: (callback) ->
    return this unless callback
    that = this
    sql = "SELECT * FROM #{@name}"
    cb = @fn(@name, callback)
    success = (res) ->
      r = for row in res.rows
        do (row) ->
          obj = JSON.parse(row.value)
          obj.key = row.id
          obj
      cb.call(that, r)
      return
    @db.executeSql sql, success, fail
    this

  remove: (keyOrObj, cb) ->
    return this unless keyOrObj
    that = this
    key = if typeof keyOrObj == "string" then keyOrObj else keyOrObj.key
    return this unless key
    sql = [ "DELETE FROM #{@name} WHERE id = ?", key ]
    success = () ->
      that.lambda(cb).call(that) if cb
      return
    @db.executeSql sql, success, fail
    this

  nuke: (cb) ->
    that = this
    db = @db
    sql = "DELETE FROM #{@name}"
    success = () ->
      that.lambda(cb).call(that) if cb
      # clean up the db
      db.executeSql "VACUUM"
      return
    @db.executeSql sql, success, fail
    this

PGSQLitePlugin.lawnchair_adapter = pgsqlite_plugin
Lawnchair.adapter "pgsqlite_plugin", pgsqlite_plugin
