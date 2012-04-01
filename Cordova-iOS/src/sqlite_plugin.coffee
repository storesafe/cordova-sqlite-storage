# Copyright (C) 2011 Joe Noon <joenoon@gmail.com>

# This file is intended to be compiled by Coffeescript WITH the top-level function wrapper

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
  
class root.SQLitePlugin
  
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
    
  executeSql: (sql, params, success, error) ->
    throw new Error "Cannot executeSql without a query" unless sql
    opts = getOptions({ query: [sql].concat(params || []), path: @dbPath }, success, error)
    Cordova.exec("SQLitePlugin.backgroundExecuteSql", opts)
    return

  transaction: (fn, success, error) ->
    t = new root.SQLitePluginTransaction(@dbPath)
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

class root.SQLitePluginTransaction
  
  constructor: (@dbPath) ->
    @executes = []
    
  executeSql: (sql, params, success, error) ->
    @executes.push getOptions({ query: [sql].concat(params || []), path: @dbPath }, success, error)
    return
  
  complete: (success, error) ->
    throw new Error "Transaction already run" if @__completed
    @__completed = true
    begin_opts = getOptions({ query: [ "BEGIN;" ], path: @dbPath })
    commit_opts = getOptions({ query: [ "COMMIT;" ], path: @dbPath }, success, error)
    executes = [ begin_opts ].concat(@executes).concat([ commit_opts ])
    opts = { executes: executes }
    Cordova.exec("SQLitePlugin.backgroundExecuteSqlBatch", opts)
    @executes = []
    return

