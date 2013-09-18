# SQLitePlugin in Markdown (litcoffee)

New coffee compiler can compile this directly into Javascript

License for common Javascript: MIT or Apache

## Top-level SQLitePlugin objects

- root window object:

    root = @

- SQLitePlugin object is defined by a constructor function and prototype member functions:

    SQLitePlugin = (openargs, openSuccess, openError) ->
      console.log "SQLitePlugin openargs: #{JSON.stringify openargs}"

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
          return

      @openError or
        @openError = (e) ->
          console.log e.message
          return

      #@bg = !!openargs.bgType and openargs.bgType == 1
      @bg =
        if !openargs.bgType
          # default to true for iOS only (due to memory issue)
          ((navigator.userAgent.match(/iPad/i)) || (navigator.userAgent.match(/iPhone/i)))
        else
          openargs.bgType == 1

      @open @openSuccess, @openError
      return

    SQLitePlugin::databaseFeatures = isSQLitePluginDatabase: true
    SQLitePlugin::openDBs = {}

    SQLitePlugin::txQ = []

    SQLitePlugin::addTransaction = (t) ->
      @txQ.push t
      if @txQ.length is 1
        t.start()
      return

    SQLitePlugin::transaction = (fn, error, success) ->
      @addTransaction new SQLitePluginTransaction(this, fn, error, success, true)
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
      #console.log "SQLitePlugin.prototype.close"

      if @dbname of @openDBs
        delete @openDBs[@dbname]

        cordova.exec null, null, "SQLitePlugin", "close", [ { path: @dbname } ]

      return

    SQLitePlugin::executeSql = (statement, params, success, error) ->
      mysuccess = (t, r) -> if !!success then success r
      myerror = (t, e) -> if !!error then error e

      myfn = (tx) ->
        tx.executeSql(statement, params, mysuccess, myerror)
        return

      @addTransaction new SQLitePluginTransaction(this, myfn, myerror, mysuccess, false)
      return

- Deprecated pragma API, use db.executeSql() instead:

    pcb = -> 1

    ###
    DEPRECATED AND WILL BE REMOVED:
    ###
    SQLitePlugin::executePragmaStatement = (statement, success, error) ->
      console.log "SQLitePlugin::executePragmaStatement"
      pcb = success

      cordova.exec (-> 1), error, "SQLitePlugin", "executePragmaStatement", [ @dbname, statement ]
      return

    ###
    FUTURE TBD GONE: Required for db.executePragmStatement() callback ONLY:
    ###
    SQLitePluginCallback =
      p1: (id, result) ->
        console.log "PRAGMA CB"

        mycb = pcb
        pcb = -> 1
        mycb result

        return

- SQLitePluginTransaction object for batching:

    ###
    Transaction batching object:
    ###
    SQLitePluginTransaction = (db, fn, error, success, txlock) ->
      if typeof(fn) != "function"
        ###
        This is consistent with the implementation in Chrome -- it
        throws if you pass anything other than a function. This also
        prevents us from stalling our txQueue if somebody passes a
        false value for fn.
        ###
        throw new Error("transaction expected a function")

      @db = db
      @fn = fn
      @error = error
      @success = success
      @txlock = txlock
      @executes = []

      if txlock
        @executeSql "BEGIN", [], null, (tx, err) ->
          throw new Error("unable to begin transaction: " + err.message)

      return

    SQLitePluginTransaction::start = ->
      try
        unless @fn
          return
        @fn this
        @fn = null
        @run()
      catch err
        ###
        If "fn" throws, we must report the whole transaction as failed.
        ###
        @db.startNextTransaction()
        if @error
          @error err
      return

    SQLitePluginTransaction::executeSql = (sql, values, success, error) ->
      qid = @executes.length

      @executes.push
        success: success
        error: error
        qid: qid

        sql: sql
        params: values || []

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
              tx.abort txFailure
            else if tx.executes.length > 0
              ###
              new requests have been issued by the callback
              handlers, so run another batch.
              ###
              tx.run()
            else
              tx.finish()

          return

      i = 0

      mycbmap = {}

      while i < batchExecutes.length
        request = batchExecutes[i]

        qid = request.qid

        mycbmap[qid] =
          success: handlerFor(i, true)
          error: handlerFor(i, false)

        tropts.push
          qid: qid
          # for ios version:
          query: [request.sql].concat(request.params)
          sql: request.sql
          params: request.params

        i++

      mycb = (result) ->
        #console.log "mycb result #{JSON.stringify result}"

        for r in result
          type = r.type
          qid = r.qid
          res = r.result

          q = mycbmap[qid]

          if q
            if q[type]
              q[type] res

        return

      mycommand = if @db.bg then "backgroundExecuteSqlBatch" else "executeSqlBatch"
      cordova.exec mycb, null, "SQLitePlugin", mycommand, [{dbargs: {dbname: @db.dbname}, executes: tropts}]

      return

    SQLitePluginTransaction::abort = (txFailure) ->
      if @finalized then return
      tx = @

      succeeded = (tx) ->
        tx.db.startNextTransaction()
        if tx.error then tx.error txFailure
        return

      failed = (tx, err) ->
        tx.db.startNextTransaction()
        if tx.error then tx.error new Error("error while trying to roll back: " + err.message)
        return

      @finalized = true

      if @txlock
        @executeSql "ROLLBACK", [], succeeded, failed
        @run()
      else
        succeeded(tx)

      return

    SQLitePluginTransaction::finish = ->
      if @finalized then return
      tx = @

      succeeded = (tx) ->
        tx.db.startNextTransaction()
        if tx.success then tx.success()
        return

      failed = (tx, err) ->
        tx.db.startNextTransaction()
        if tx.error then tx.error new Error("error while trying to commit: " + err.message)
        return

      @finalized = true

      if @txlock
        @executeSql "COMMIT", [], succeeded, failed
        @run()
      else
        succeeded(tx)

      return

- SQLite plugin object factory:

    SQLiteFactory =
      ###
      NOTE: this function should NOT be translated from Javascript
      back to CoffeeScript by js2coffee.
      If this function is edited in Javascript then someone will
      have to translate it back to CoffeeScript by hand.
      ###
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

      deleteDb: (databaseName, success, error) ->
        cordova.exec success, error, "SQLitePlugin", "delete", [{ path: databaseName }]

    ###
    FUTURE TBD GONE: Required for db.executePragmStatement() callback ONLY:
    ###
    root.SQLitePluginCallback = SQLitePluginCallback

- Exported API:

    root.sqlitePlugin =
      sqliteFeatures:
        isSQLitePlugin: true

      openDatabase: SQLiteFactory.opendb
      deleteDatabase: SQLiteFactory.deleteDb

