# Copyright (C) 2011 Joe Noon <joenoon@gmail.com>

# This file is intended to be compiled by Coffeescript WITH the top-level function wrapper

root = this

callbacks = {}

counter = 0

fnref = (fn) ->
  f = "_sqliteplugin#{counter+=1}"
  callbacks[f] = fn
  f

getOptions = (opts, success, error) ->
  opts.successCallback = fnref(success) if typeof success == "function"
  opts.errorCallback = fnref(error) if typeof error == "function"
  opts
  
class root.PGSQLitePlugin
  
  # All instances will interact directly on the prototype openDBs object.
  # One instance that closes a db path will remove it from any other instance's perspective as well.
  openDBs: {}
  
  constructor: (@dbPath, @openSuccess, @openError) ->
    throw new Error "Cannot create a PGSQLitePlugin instance without a dbPath" unless dbPath
    @openSuccess ||= () ->
      console.log "DB opened: #{dbPath}"
      return
    @openError ||= (e) ->
      console.log e.message
      return
    @open(@openSuccess, @openError)
  
  # Note: Class method
  @handleCallback: () ->
    args = Array::slice.call(arguments)
    f = args.shift()
    callbacks[f]?.apply(null, args)
    callbacks[f] = null
    delete callbacks[f]
    return
    
  executeSql: (sql, success, error) ->
    throw new Error "Cannot executeSql without a query" unless sql
    opts = getOptions({ query: [].concat(sql || []), path: @dbPath }, success, error)
    PhoneGap.exec("PGSQLitePlugin.backgroundExecuteSql", opts)
    return

  transaction: (fn, success, error) ->
    t = new root.PGSQLitePluginTransaction(@dbPath)
    fn(t)
    t.complete(success, error)
    
  open: (success, error) ->
    unless @dbPath of @openDBs
      @openDBs[@dbPath] = true
      opts = getOptions({ path: @dbPath }, success, error)
      PhoneGap.exec("PGSQLitePlugin.open", opts)
    return
  
  close: (success, error) ->
    if @dbPath of @openDBs
      delete @openDBs[@dbPath]
      opts = getOptions({ path: @dbPath }, success, error)
      PhoneGap.exec("PGSQLitePlugin.close", opts)
    return

class root.PGSQLitePluginTransaction
  
  constructor: (@dbPath) ->
    @executes = []
    
  executeSql: (sql, success, error) ->
    @executes.push getOptions({ query: [].concat(sql || []), path: @dbPath }, success, error)
    return
  
  complete: (success, error) ->
    throw new Error "Transaction already run" if @__completed
    @__completed = true
    begin_opts = getOptions({ query: [ "BEGIN;" ], path: @dbPath })
    commit_opts = getOptions({ query: [ "COMMIT;" ], path: @dbPath }, success, error)
    executes = [ begin_opts ].concat(@executes).concat([ commit_opts ])
    opts = { executes: executes }
    PhoneGap.exec("PGSQLitePlugin.backgroundExecuteSqlBatch", opts)
    @executes = []
    return

