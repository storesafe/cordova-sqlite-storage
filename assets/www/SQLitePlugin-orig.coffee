do ->
  root = @

  SQLitePlugin = (openargs, openSuccess, openError) ->
    console.log "SQLitePlugin"

    if !(openargs and openargs['name'])
      throw new Error("Cannot create a SQLitePlugin instance without a db name")

    dbname = openargs.name

    @openargs = openargs
    @dbname = dbname

    @openSuccess = openSuccess
    @openError = openError

    @openSuccess or
      @openSuccess = ->
        console.log "DB opened: " + dbname

    @openError or
      @openError = (e) ->
        console.log e.message

    @open @openSuccess, @openError
    return

  SQLitePlugin::databaseFeatures = isSQLitePluginDatabase: true
  SQLitePlugin::openDBs = {}

  # OLD SQLite(Batch)Transaction mechanism:
  SQLitePlugin::batchTransaction = (fn, error, success) ->
    t = new SQLiteBatchTransaction(@dbname)
    fn t
    t.complete success, error
    return

  SQLitePlugin::txQ = []

  #SQLitePlugin::transaction = SQLitePlugin::batchTransaction

  # Using NEW SQLitePluginTransaction mechanism:
  SQLitePlugin::transaction = (fn, error, success) ->
    t = new SQLitePluginTransaction(this, fn, error, success)
    @txQ.push t
    if @txQ.length is 1
      t.start()
    return

  SQLitePlugin::startNextTransaction = ->
    @txQ.shift()
    if @txQ[0]
      @txQ[0].start()
    return

  SQLitePlugin::open = (success, error) ->
    unless @dbname of @openDBs
      @openDBs[@dbname] = true
      cordova.exec success, error, "SQLitePlugin", "open", [ @openargs ]

    return

  SQLitePlugin::close = (success, error) ->
    console.log "SQLitePlugin.prototype.close"

    if @dbname of @openDBs
      delete @openDBs[@dbname]

      cordova.exec null, null, "SQLitePlugin", "close", [ @dbname ]

    return

  pcb = -> 1

  # XXX TBD fix callback(s):
  SQLitePlugin::executeSql = (statement, params, success, error) ->
    console.log "SQLitePlugin::executeSql[Statement]"
    pcb = success
    cordova.exec (-> 1), error, "SQLitePlugin", "executePragmaStatement", [@dbname, statement, params]
    return
  
  # DEPRECATED AND WILL BE REMOVED:
  SQLitePlugin::executePragmaStatement = (statement, success, error) ->
    console.log "SQLitePlugin::executePragmaStatement"
    pcb = success

    cordova.exec (-> 1), error, "SQLitePlugin", "executePragmaStatement", [ @dbname, statement ]
    return

  SQLitePluginCallback =
    p1: (id, result) ->
      console.log "PRAGMA CB"

      mycb = pcb
      pcb = -> 1
      mycb result

      return

  uid = 1000

  get_unique_id = -> ++uid

  get_unique_id$old = ->
    id = new Date().getTime()
    id2 = new Date().getTime()
    id2 = new Date().getTime()  while id is id2
    id2 + "000"

  queryQ = []
  queryCBQ = {}

  # XXX OLD mechanism:
  SQLiteBatchTransaction = (dbname) ->
    @dbname = dbname
    @executes = []
    @trans_id = get_unique_id()
    @__completed = false
    @__submitted = false
    # this.optimization_no_nested_callbacks: default is false.
    # if set to true large batches of queries within a transaction will be much faster but 
    # you will lose the ability to do multi level nesting of executeSQL callbacks
    @optimization_no_nested_callbacks = false
    console.log "SQLiteBatchTransaction - this.trans_id:" + @trans_id
    queryQ[@trans_id] = []
    queryCBQ[@trans_id] = new Object()
    return

  SQLiteQueryCB = {}

  SQLiteQueryCB.queryCompleteCallback = (transId, queryId, result) ->
    console.log "SQLiteBatchTransaction.queryCompleteCallback"
    query = null
    for x of queryQ[transId]
      if queryQ[transId][x]["query_id"] is queryId
        query = queryQ[transId][x]
        if queryQ[transId].length is 1
          queryQ[transId] = []
        else
          queryQ[transId].splice x, 1
        break

    if query and query["callback"]
      query["callback"] result
    return

  SQLiteQueryCB.queryErrorCallback = (transId, queryId, result) ->
    query = null
    for x of queryQ[transId]
      if queryQ[transId][x]["query_id"] is queryId
        query = queryQ[transId][x]
        if queryQ[transId].length is 1
          queryQ[transId] = []
        else
          queryQ[transId].splice x, 1
        break

    if query and query["err_callback"]
      query["err_callback"] result
    return

  SQLiteQueryCB.txCompleteCallback = (transId) ->
    if typeof transId isnt "undefined"
      queryCBQ[transId]["success"]()  if transId and queryCBQ[transId] and queryCBQ[transId]["success"]
    else
      console.log "SQLiteBatchTransaction.txCompleteCallback---transId = NULL"
    return

  SQLiteQueryCB.txErrorCallback = (transId, error) ->
    if typeof transId isnt "undefined"
      console.log "SQLiteBatchTransaction.txErrorCallback---transId:" + transId
      queryCBQ[transId]["error"] error  if transId and queryCBQ[transId]["error"]
      delete queryQ[transId]

      delete queryCBQ[transId]
    else
      console.log "SQLiteBatchTransaction.txErrorCallback---transId = NULL"
    return

  SQLiteBatchTransaction::add_to_transaction = (trans_id, query, params, callback, err_callback) ->
    new_query = new Object()
    new_query["trans_id"] = trans_id

    if callback or not @optimization_no_nested_callbacks
      new_query["query_id"] = get_unique_id()
    else
      if @optimization_no_nested_callbacks
        new_query["query_id"] = ""

    new_query["query"] = query

    if params
      new_query["params"] = params
    else
      new_query["params"] = []

    new_query["callback"] = callback
    new_query["err_callback"] = err_callback

    queryQ[trans_id] = []  unless queryQ[trans_id]
    queryQ[trans_id].push new_query
    return

  SQLiteBatchTransaction::executeSql = (sql, values, success, error) ->
    console.log "SQLiteBatchTransaction.prototype.executeSql"
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

  SQLiteBatchTransaction::complete = (success, error) ->
    console.log "SQLiteBatchTransaction.prototype.complete"

    throw new Error("Transaction already run")  if @__completed
    throw new Error("Transaction already submitted")  if @__submitted

    @__submitted = true
    txself = this

    successcb = ->
      if queryQ[txself.trans_id].length > 0 and not txself.optimization_no_nested_callbacks
        txself.__submitted = false
        txself.complete success, error
      else
        @__completed = true
        success txself  if success

    errorcb = (res) -> null

    if error
      errorcb = (res) ->
        error txself, res

    queryCBQ[@trans_id]["success"] = successcb
    queryCBQ[@trans_id]["error"] = errorcb

    cordova.exec null, null, "SQLitePlugin", "executeBatchTransaction", [ @dbname, queryQ[@trans_id] ]
    return

  # NEW mechanism:

  trcbq = {}

  SQLitePluginTransaction = (db, fn, error, success) ->
    @trid = get_unique_id()
    trcbq[@trid] = {}
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

  SQLiteTransactionCB = {}

  SQLiteTransactionCB.queryCompleteCallback = (transId, queryId, result) ->
    #console.log "SQLiteTransactionCB.queryCompleteCallback"

    t = trcbq[transId]

    if t
      q = t[queryId]

      if q
        if q["success"]
          q["success"] result

        # ???:
        delete trcbq[transId][queryId]

    return

  SQLiteTransactionCB.queryErrorCallback = (transId, queryId, result) ->
    #console.log "query errror cb trid " + transId + " qid " + queryId

    t = trcbq[transId]

    if t
      q = t[queryId]

      if q
        if q["error"]
          q["error"] result

        # ???:
        delete trcbq[transId][queryId]

    return

  # ???:
  SQLiteTransactionCB.txCompleteCallback = (transId) ->
    return

  # ???:
  SQLiteTransactionCB.txErrorCallback = (transId, error) ->
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
      if @error
        @error err
    return

  SQLitePluginTransaction::executeSql = (sql, values, success, error) ->
    #console.log "SQLitePluginTransaction::executeSql"
    qid = get_unique_id()

    @executes.push
      #query: [sql].concat(values or [])
      success: success
      error: error
      qid: qid

      sql: sql
      params: values

    return

  SQLitePluginTransaction::handleStatementSuccess = (handler, response) ->
    if !handler
      return

    rows = response.rows || []
    payload =
      rows:
        item: (i) ->
          rows[i]

        length: rows.length

      rowsAffected: response.rowsAffected or 0
      insertId: response.insertId or undefined

    handler this, payload

    return

  SQLitePluginTransaction::handleStatementFailure = (handler, response) ->
    if !handler
      throw new Error "a statement with no error handler failed: " + response.message
    if handler(this, response)
      throw new Error "a statement error callback did not return false"
    return

  SQLitePluginTransaction::run = ->
    #console.log "SQLitePluginTransaction::run"
    txFailure = null

    tropts = []
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

      qid = request.qid

      trcbq[@trid][qid] =
        success: handlerFor(i, true)
        error: handlerFor(i, false)

      tropts.push
        trans_id: @trid
        query_id: qid
        query: request.sql
        params: request.params || []

      i++

    cordova.exec null, null, "SQLitePlugin", "executeSqlBatch", [ @db.dbname, tropts ]

    return

  SQLitePluginTransaction::rollBack = (txFailure) ->
    if @finalized then return
    tx = @

    succeeded = ->
      delete trcbq[@trid]
      tx.db.startNextTransaction()
      if tx.error then tx.error txFailure

    failed = (tx, err) ->
      delete trcbq[@trid]
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
      delete trcbq[@trid]
      tx.db.startNextTransaction()
      if tx.success then tx.success()

    failed = (tx, err) ->
      delete trcbq[@trid]
      tx.db.startNextTransaction()
      if tx.error then tx.error new Error("error while trying to commit: " + err.message)

    @finalized = true
    @executeSql "COMMIT", [], succeeded, failed
    @run()
    return

  SQLiteFactory =
    # NOTE: this function should NOT be translated from Javascript
    # back to CoffeeScript by js2coffee.
    # If this function is edited in Javascript then someone will
    # have to translate it back to CoffeeScript by hand.
    opendb: ->
      if arguments.length < 1 then return null

      first = arguments[0]
      openargs = null
      okcb = null
      errorcb = null

      if first.constructor == String
        openargs = {name: first}

        if arguments.length >= 5
          okcb = arguments[4]
          if arguments.length > 5 then errorcb = arguments[5]

      else
        openargs = first

        if arguments.length >= 2
          okcb = arguments[1]
          if arguments.length > 2 then errorcb = arguments[2]

      new SQLitePlugin openargs, okcb, errorcb

  # Required for callbacks:
  root.SQLitePluginCallback = SQLitePluginCallback
  #root.SQLiteQueryCB = SQLiteQueryCB
  root.SQLiteQueryCB = SQLiteTransactionCB

  root.sqlitePlugin =
    sqliteFeatures:
      isSQLitePlugin: true

    openDatabase: SQLiteFactory.opendb

