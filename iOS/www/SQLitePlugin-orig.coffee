# SQLitePlugin-orig.coffee
# Copyright (C) 2011 Joe Noon <joenoon@gmail.com>
#
# NOTE: SQLitePlugin.js is now leading.
#
# This file is maintained by @chbrody to make it easier to refactor a common version for both
# iOS and Android.
#
# This file is NOW intended to be compiled by Coffeescript WITHOUT a top-level function wrapper
#
# To regenerate SQLitePlugin.js:
# coffee -bp SQLitePlugin-orig.coffee > SQLitePlugin.js
# (and try to keep the comments by hand)
#
# Round-trip (useful to determine what is most relevant for Javascript):
# coffee -bp SQLitePlugin-orig.coffee | js2coffee SQLitePlugin.js > SQLitePlugin2.coffee
# (will lose the comments)

# Make Cordova 1.6 compatible - now uses lowercase cordova variable (conditional)
if !window.Cordova
    window.Cordova = window.cordova

do ->
  root = @

  callbacks = {}

  counter = 0

  cbref = (hash) ->
    f = "cb#{counter+=1}"
    callbacks[f] = hash
    f

  exec = (s, o) ->
    if root.sqlitePlugin.DEBUG
      console.log s + ": " + JSON.stringify(o)
    Cordova.exec s, o
    return

  getOptions = (opts, success, error) ->
    cb = {}
    has_cbs = false
    if typeof success == "function"
      has_cbs = true
      cb.success = success
    if typeof error == "function"
      has_cbs = true
      cb.error = error
    if has_cbs then opts.callback = cbref(cb)
    opts

  # Prototype constructor function
  SQLitePlugin = (dbPath, openSuccess, openError) ->
    if !dbPath
      throw new Error "Cannot create a SQLitePlugin instance without a dbPath"
    @dbPath = dbPath
    @openSuccess = openSuccess || ->
      console.log "DB opened: #{dbPath}"
      return
    @openError = openError || ->
      console.log e.message
      return
    @open(@openSuccess, @openError)
    return

  # Note: Class member
  # All instances will interact directly on the prototype openDBs object.
  # One instance that closes a db path will remove it from any other instance's perspective as well.
  SQLitePlugin::openDBs = {}
  SQLitePlugin::txQueue = []
  SQLitePlugin::features = isSQLitePlugin: true

  # Note: Class method (will be exported by a member of root.sqlitePlugin)
  SQLitePlugin.handleCallback = (ref, type, obj) ->
    if root.sqlitePlugin.DEBUG
      console.log "handle callback: " + ref + ", " + type + ", " + JSON.stringify(obj)  
    callbacks[ref]?[type]?(obj)
    callbacks[ref] = null
    delete callbacks[ref]
    return

  SQLitePlugin::executeSql = (sql, values, success, error) ->
    if !sql
      throw new Error "Cannot executeSql without a query"
    opts = getOptions({ query: [sql].concat(values || []), path: @dbPath }, success, error)
    exec "SQLitePlugin.backgroundExecuteSql", opts
    return

  SQLitePlugin::transaction = (fn, error, success) ->
    t = new SQLitePluginTransaction(this, fn, error, success)
    @txQueue.push t
    t.start()  if @txQueue.length is 1
    return

  SQLitePlugin::startNextTransaction = ->
    @txQueue.shift()
    @txQueue[0].start()  if @txQueue[0]
    return

  SQLitePlugin::open = (success, error) ->
    unless @dbPath of @openDBs
      @openDBs[@dbPath] = true
      opts = getOptions({ path: @dbPath }, success, error)
      exec "SQLitePlugin.open", opts
    return

  SQLitePlugin::close = (success, error) ->
    if @dbPath of @openDBs
      delete @openDBs[@dbPath]

      opts = getOptions({ path: @dbPath }, success, error)
      exec "SQLitePlugin.close", opts
    return

  SQLitePluginTransaction = (db, fn, error, success) ->
    if typeof(fn) != "function"
      # This is consistent with the implementation in Chrome -- it
      # throws if you pass anything other than a function. This also
      # prevents us from stalling our txQueue if somebody passes a
      # false value for fn.
      throw new Error("transaction expected a function")
    @db = db
    @fn = fn
    @error = error
    @success = success
    @executes = []
    @executeSql "BEGIN", [], null, (tx, err) ->
      throw new Error("unable to begin transaction: " + err.message)
    return

  SQLitePluginTransaction::start = ->
    try
      return  unless @fn
      @fn this
      @fn = null
      @run()
    catch err
      # If "fn" throws, we must report the whole transaction as failed.
      @db.startNextTransaction()
      @error err  if @error
    return

  SQLitePluginTransaction::executeSql = (sql, values, success, error) ->
    @executes.push
      query: [sql].concat(values or [])
      success: success
      error: error
    return

  SQLitePluginTransaction::handleStatementSuccess = (handler, response) ->
    return  unless handler
    payload =
      rows:
        item: (i) ->
          response.rows[i]

        length: response.rows.length

      rowsAffected: response.rowsAffected
      insertId: response.insertId or null

    handler this, payload

    return

  SQLitePluginTransaction::handleStatementFailure = (handler, response) ->
    if !handler
      throw new Error "a statement with no error handler failed: " + response.message
    if handler(this, response)
      throw new Error "a statement error callback did not return false"
    return

  SQLitePluginTransaction::run = ->
    txFailure = null
    opts = []
    batchExecutes = @executes
    waiting = batchExecutes.length
    @executes = []
    tx = this

    handlerFor = (index, didSucceed) ->
      (response) ->
        try
          if didSucceed
            tx.handleStatementSuccess batchExecutes[index].success, response
          else
            tx.handleStatementFailure batchExecutes[index].error, response
        catch err
          txFailure = err  unless txFailure

        if --waiting == 0
          if txFailure
            tx.rollBack txFailure
          else if tx.executes.length > 0
            # new requests have been issued by the callback
            # handlers, so run another batch.
            tx.run()
          else
            tx.commit()

    i = 0

    while i < batchExecutes.length
      request = batchExecutes[i]
      opts.push getOptions(
        query: request.query
        path: @db.dbPath
      , handlerFor(i, true), handlerFor(i, false))
      i++

    exec "SQLitePlugin.backgroundExecuteSqlBatch",
      executes: opts

    return

  SQLitePluginTransaction::rollBack = (txFailure) ->
    if @finalized then return
    tx = @

    succeeded = ->
      tx.db.startNextTransaction()
      if tx.error then tx.error txFailure

    failed = (tx, err) ->
      tx.db.startNextTransaction()
      if tx.error then tx.error new Error("error while trying to roll back: " + err.message)

    @finalized = true
    @executeSql "ROLLBACK", [], succeeded, failed
    @run()
    return

  SQLitePluginTransaction::commit = ->
    if @finalized then return
    tx = @

    succeeded = ->
      tx.db.startNextTransaction()
      if tx.success then tx.success()

    failed = (tx, err) ->
      tx.db.startNextTransaction()
      if tx.error then tx.error new Error("error while trying to commit: " + err.message)

    @finalized = true
    @executeSql "COMMIT", [], succeeded, failed
    @run()
    return

  root.sqlitePlugin =
    # NOTE: the following parameters are ignored but included to match HTML5/W3 spec:
    # version, displayName, estimatedSize
    openDatabase: (dbPath, version=null, displayName=null, estimatedSize=0, creationCallback=null, errorCallback=null) ->
      return new SQLitePlugin(dbPath, creationCallback, errorCallback)

    # export reference to SQLitePlugin.handleCallback [SQLitePlugin::handleCallback] class method
    handleCallback: SQLitePlugin.handleCallback

  return # end the block

