# Copyright (C) 2011 Joe Noon <joenoon@gmail.com>

# This file is intended to be compiled by Coffeescript WITH the top-level function wrapper

# Make Cordova 1.6 compatible - now uses lowercase cordova variable
window.Cordova = window.cordova

root = this

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

# XXX TEMP workaround:
root.SQLitePlugin =
  handleCallback: (ref, type, obj) ->
    callbacks[ref]?[type]?(obj)
    callbacks[ref] = null
    delete callbacks[ref]
    return
  
class SQLiteNative

  # All instances will interact directly on the prototype openDBs object.
  # One instance that closes a db path will remove it from any other instance's perspective as well.
  openDBs: {}
  
  constructor: (@dbPath, @openSuccess, @openError) ->
    throw new Error "Cannot create a SQLitePlugin instance without a dbPath" unless dbPath
    @openSuccess ||= () ->
      console.log "DB opened: #{dbPath}"
      return
    @openError ||= (e) ->
      console.log e.message
      return
    @open(@openSuccess, @openError)
  
  # Note: Class method
  @handleCallback: (ref, type, obj) ->
    callbacks[ref]?[type]?(obj)
    callbacks[ref] = null
    delete callbacks[ref]
    return
    
  executeSql: (sql, values, success, error) ->
    throw new Error "Cannot executeSql without a query" unless sql
    opts = getOptions({ query: [sql].concat(values || []), path: @dbPath }, success, error)
    Cordova.exec("SQLitePlugin.backgroundExecuteSql", opts)
    return

  transaction: (fn, error, success) ->
    t = new SQLitePluginTransaction(@dbPath)
    fn(t)
    t.complete(success, error)
    
  open: (success, error) ->
    unless @dbPath of @openDBs
      @openDBs[@dbPath] = true
      opts = getOptions({ path: @dbPath }, success, error)
      Cordova.exec("SQLitePlugin.open", opts)
    return
  
  close: (success, error) ->
    if @dbPath of @openDBs
      delete @openDBs[@dbPath]
      opts = getOptions({ path: @dbPath }, success, error)
      Cordova.exec("SQLitePlugin.close", opts)
    return

class SQLitePluginTransaction
  
  constructor: (@dbPath) ->
    @executes = []

  executeSql: (sql, values, success, error) ->
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

  complete: (success, error) ->
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
    return new SQLiteNative(dbPath, creationCallback, errorCallback)

