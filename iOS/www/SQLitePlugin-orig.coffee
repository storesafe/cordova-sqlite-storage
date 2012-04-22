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

  getOptions = (opts, success, error) ->
    cb = {}
    has_cbs = false
    if typeof success == "function"
      has_cbs = true
      cb.success = success
    if typeof error == "function"
      has_cbs = true
      cb.error = error
    opts.callback = cbref(cb) if has_cbs
    opts

  # Prototype constructor function
  SQLitePlugin = (dbPath, openSuccess, openError) ->
    @dbPath = dbPath
    @openSuccess = openSuccess
    @openError = openError
    throw new Error "Cannot create a SQLitePlugin instance without a dbPath" unless dbPath
    @openSuccess ||= () ->
      console.log "DB opened: #{dbPath}"
      return
    @openError ||= (e) ->
      console.log e.message
      return
    @open(@openSuccess, @openError)
    return

  # Note: Class member
  # All instances will interact directly on the prototype openDBs object.
  # One instance that closes a db path will remove it from any other instance's perspective as well.
  SQLitePlugin::openDBs = {}

  # Note: Class method (will be exported by a member of root.sqlitePlugin)
  SQLitePlugin.handleCallback = (ref, type, obj) ->
    callbacks[ref]?[type]?(obj)
    callbacks[ref] = null
    delete callbacks[ref]
    return

  SQLitePlugin::executeSql = (sql, values, success, error) ->
    throw new Error "Cannot executeSql without a query" unless sql
    opts = getOptions({ query: [sql].concat(values || []), path: @dbPath }, success, error)
    Cordova.exec("SQLitePlugin.backgroundExecuteSql", opts)
    return

  SQLitePlugin::transaction = (fn, error, success) ->
    t = new SQLitePluginTransaction(@dbPath)
    fn(t)
    t.complete(success, error)

  SQLitePlugin::open = (success, error) ->
    unless @dbPath of @openDBs
      @openDBs[@dbPath] = true
      opts = getOptions({ path: @dbPath }, success, error)
      Cordova.exec("SQLitePlugin.open", opts)
    return

  SQLitePlugin::close = (success, error) ->
    if @dbPath of @openDBs
      delete @openDBs[@dbPath]
      opts = getOptions({ path: @dbPath }, success, error)
      Cordova.exec("SQLitePlugin.close", opts)
    return

  # Prototype constructor function
  SQLitePluginTransaction = (dbPath) ->
    @dbPath = dbPath
    @executes = []
    return

  SQLitePluginTransaction::executeSql = (sql, values, success, error) ->
    txself = @
    successcb = null
    if success
      successcb = (execres) ->
        saveres = execres
        res =
          rows:
            item: (i) ->
              saveres.rows[i]
            length: saveres.rows.length
          rowsAffected: saveres.rowsAffected
          insertId: saveres.insertId || null
        success(txself, res)
    errorcb = null
    if error
      errorcb = (res) ->
        error(txself, res)
    @executes.push getOptions({ query: [sql].concat(values || []), path: @dbPath }, successcb, errorcb)
    return

  SQLitePluginTransaction::complete = (success, error) ->
    throw new Error "Transaction already run" if @__completed
    @__completed = true
    txself = @
    successcb = (res) ->
      success(txself, res)
    errorcb = (res) ->
      error(txself, res)
    begin_opts = getOptions({ query: [ "BEGIN;" ], path: @dbPath })
    commit_opts = getOptions({ query: [ "COMMIT;" ], path: @dbPath }, successcb, errorcb)
    executes = [ begin_opts ].concat(@executes).concat([ commit_opts ])
    opts = { executes: executes }
    Cordova.exec("SQLitePlugin.backgroundExecuteSqlBatch", opts)
    @executes = []
    return

  root.sqlitePlugin =
    # NOTE: the following parameters are ignored but included to match HTML5/W3 spec:
    # version, displayName, estimatedSize
    openDatabase: (dbPath, version=null, displayName=null, estimatedSize=0, creationCallback=null, errorCallback=null) ->
      return new SQLitePlugin(dbPath, creationCallback, errorCallback)

    # export reference to SQLitePlugin.handleCallback [SQLitePlugin::handleCallback] class method
    handleCallback: SQLitePlugin.handleCallback

  return # end the block

