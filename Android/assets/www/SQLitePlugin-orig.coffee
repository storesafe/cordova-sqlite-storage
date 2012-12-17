do ->
  root = @

  SQLitePlugin = (dbPath, openSuccess, openError) ->
    console.log "SQLitePlugin"
    throw new Error("Cannot create a SQLitePlugin instance without a dbPath")  unless dbPath

    @dbPath = dbPath
    @openSuccess = openSuccess
    @openError = openError

    @openSuccess or
      @openSuccess = ->
        console.log "DB opened: " + dbPath

    @openError or
      @openError = (e) ->
        console.log e.message

    @open @openSuccess, @openError
    return

  SQLitePlugin::openDBs = {}

  SQLitePlugin::transaction = (fn, error, success) ->
    t = new SQLitePluginTransaction(@dbPath)
    fn t
    t.complete success, error
    return

  SQLitePlugin::open = (success, error) ->
    console.log "SQLitePlugin.prototype.open"

    unless @dbPath of @openDBs
      @openDBs[@dbPath] = true
      cordova.exec success, error, "SQLitePlugin", "open", [ @dbPath ]

    return

  SQLitePlugin::close = (success, error) ->
    console.log "SQLitePlugin.prototype.close"

    if @dbPath of @openDBs
      delete @openDBs[@dbPath]

      cordova.exec null, null, "SQLitePlugin", "close", [ @dbPath ]

    return

  pcb = -> 1

  SQLitePlugin::executePragmaStatement = (statement, success, error) ->
    console.log "SQLitePlugin::executePragmaStatement"
    pcb = success

    cordova.exec (-> 1), error, "SQLitePlugin", "executePragmaStatement", [ @dbPath, statement ]
    return

  SQLitePluginCallback =
    p1: (id, result) ->
      console.log "PRAGMA CB"

      mycb = pcb
      pcb = -> 1
      mycb result

      return

  get_unique_id = ->
    id = new Date().getTime()
    id2 = new Date().getTime()
    id2 = new Date().getTime()  while id is id2
    id2 + "000"

  transaction_queue = []
  transaction_callback_queue = {}

  SQLitePluginTransaction = (dbPath) ->
    @dbPath = dbPath
    @executes = []
    @trans_id = get_unique_id()
    @__completed = false
    @__submitted = false
    # this.optimization_no_nested_callbacks: default is false.
    # if set to true large batches of queries within a transaction will be much faster but 
    # you will lose the ability to do multi level nesting of executeSQL callbacks
    @optimization_no_nested_callbacks = false
    console.log "SQLitePluginTransaction - this.trans_id:" + @trans_id
    transaction_queue[@trans_id] = []
    transaction_callback_queue[@trans_id] = new Object()
    return

  SQLitePluginTransactionCB = {}

  SQLitePluginTransactionCB.queryCompleteCallback = (transId, queryId, result) ->
    console.log "SQLitePluginTransaction.queryCompleteCallback"
    query = null
    for x of transaction_queue[transId]
      if transaction_queue[transId][x]["query_id"] is queryId
        query = transaction_queue[transId][x]
        if transaction_queue[transId].length is 1
          transaction_queue[transId] = []
        else
          transaction_queue[transId].splice x, 1
        break
    query["callback"] result  if query and query["callback"]

  SQLitePluginTransactionCB.queryErrorCallback = (transId, queryId, result) ->
    query = null
    for x of transaction_queue[transId]
      if transaction_queue[transId][x]["query_id"] is queryId
        query = transaction_queue[transId][x]
        if transaction_queue[transId].length is 1
          transaction_queue[transId] = []
        else
          transaction_queue[transId].splice x, 1
        break
    query["err_callback"] result  if query and query["err_callback"]

  SQLitePluginTransactionCB.txCompleteCallback = (transId) ->
    unless typeof transId is "undefined"
      transaction_callback_queue[transId]["success"]()  if transId and transaction_callback_queue[transId] and transaction_callback_queue[transId]["success"]
    else
      console.log "SQLitePluginTransaction.txCompleteCallback---transId = NULL"

  SQLitePluginTransactionCB.txErrorCallback = (transId, error) ->
    unless typeof transId is "undefined"
      console.log "SQLitePluginTransaction.txErrorCallback---transId:" + transId
      transaction_callback_queue[transId]["error"] error  if transId and transaction_callback_queue[transId]["error"]
      delete transaction_queue[transId]

      delete transaction_callback_queue[transId]
    else
      console.log "SQLitePluginTransaction.txErrorCallback---transId = NULL"

  SQLitePluginTransaction::add_to_transaction = (trans_id, query, params, callback, err_callback) ->
    new_query = new Object()
    new_query["trans_id"] = trans_id

    if callback or not @optimization_no_nested_callbacks
      new_query["query_id"] = get_unique_id()
    else new_query["query_id"] = ""  if @optimization_no_nested_callbacks

    new_query["query"] = query

    if params
      new_query["params"] = params
    else
      new_query["params"] = []

    new_query["callback"] = callback
    new_query["err_callback"] = err_callback

    transaction_queue[trans_id] = []  unless transaction_queue[trans_id]
    transaction_queue[trans_id].push new_query
    return

  SQLitePluginTransaction::executeSql = (sql, values, success, error) ->
    console.log "SQLitePluginTransaction.prototype.executeSql"
    errorcb = undefined
    successcb = undefined
    txself = undefined
    txself = this
    successcb = null
    if success
      console.log "success not null:" + sql
      successcb = (execres) ->
        console.log "executeSql callback:" + JSON.stringify(execres)
        res = undefined
        saveres = undefined
        saveres = execres
        res =
          rows:
            item: (i) ->
              saveres[i]

            length: saveres.length

          rowsAffected: saveres.rowsAffected
          insertId: saveres.insertId or null

        success txself, res
    else
      console.log "success NULL:" + sql
    errorcb = null
    if error
      errorcb = (res) ->
        error txself, res

    console.log "executeSql - add_to_transaction" + sql
    @add_to_transaction @trans_id, sql, values, successcb, errorcb

    return

  SQLitePluginTransaction::complete = (success, error) ->
    console.log "SQLitePluginTransaction.prototype.complete"

    throw new Error("Transaction already run")  if @__completed
    throw new Error("Transaction already submitted")  if @__submitted

    @__submitted = true
    txself = this

    successcb = ->
      if transaction_queue[txself.trans_id].length > 0 and not txself.optimization_no_nested_callbacks
        txself.__submitted = false
        txself.complete success, error
      else
        @__completed = true
        success txself  if success

    errorcb = (res) -> null

    if error
      errorcb = (res) ->
        error txself, res

    transaction_callback_queue[@trans_id]["success"] = successcb
    transaction_callback_queue[@trans_id]["error"] = errorcb

    cordova.exec null, null, "SQLitePlugin", "executeSqlBatch", [ @dbPath, transaction_queue[@trans_id] ]
    return

  SQLiteFactory =
    opendb: ->
      if arguments.length < 1 then return null

      first = arguments[0]
      dbname = "DB"
      okcb = null
      errorcb = null

      if first.constructor == String
        dbname = first
        if arguments.length >= 5
          okcb = arguments[4]
          if arguments.length > 5 then errorcb = arguments[5]

      else
        dbname = first['name']
        if arguments.length >= 2
          okcb = arguments[1]
          if arguments.length > 2 then errorcb = arguments[2]

      new SQLitePlugin dbname, okcb, errorcb

  # Required for callbacks:
  root.SQLitePluginCallback = SQLitePluginCallback
  root.SQLitePluginTransactionCB = SQLitePluginTransactionCB

  root.sqlitePlugin =
    #openDatabase: (dbPath, version, displayName, estimatedSize, creationCallback, errorCallback) ->
    #  new SQLitePlugin(dbPath, creationCallback, errorCallback)
    openDatabase: SQLiteFactory.opendb

