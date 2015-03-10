# SQLitePlugin in Markdown (litcoffee)

#### Use coffee compiler to compile this directly into Javascript

#### License for common script: MIT or Apache

# Top-level SQLitePlugin objects

## root window object:

    root = @

## constant(s):

    READ_ONLY_REGEX = /^\s*(?:drop|delete|insert|update|create)\s/i

## global(s):

    txLocks = {}

## utility functions:

    # Errors returned to callbacks must conform to `SqlError` with a code and message.
    # Some errors are of type `Error` or `string` and must be converted.
    newSQLError = (error, code) ->
      sqlError = error
      code = 0 if !code # unknown by default

      if !sqlError
        sqlError = new Error "a plugin had an error but provided no response"
        sqlError.code = code

      if typeof sqlError is "string"
        sqlError = new Error error
        sqlError.code = code

      if !sqlError.code && sqlError.message
        sqlError.code = code

      if !sqlError.code && !sqlError.message
        sqlError = new Error "an unknown error was returned: " + JSON.stringify(sqlError)
        sqlError.code = code

      return sqlError

    nextTick = window.setImmediate || (fun) ->
      window.setTimeout(fun, 0)
      return

    ###
      Utility that avoids leaking the arguments object. See
      https://www.npmjs.org/package/argsarray
    ###
    argsArray = (fun) ->
      return ->
        len = arguments.length
        if len
          args = []
          i = -1
          while ++i < len
            args[i] = arguments[i]
          return fun.call this, args
        else
          return fun.call this, []

## SQLitePlugin db-connection

#### SQLitePlugin object is defined by a constructor function and prototype member functions:

    SQLitePlugin = (openargs, openSuccess, openError) ->
      console.log "SQLitePlugin openargs: #{JSON.stringify openargs}"

      if !(openargs and openargs['name'])
        throw newSQLError "Cannot create a SQLitePlugin db instance without a db name"

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

      @open @openSuccess, @openError
      return

    SQLitePlugin::databaseFeatures = isSQLitePluginDatabase: true
    SQLitePlugin::openDBs = {}

    SQLitePlugin::addTransaction = (t) ->

      if !txLocks[@dbname]
        txLocks[@dbname] = {
          queue: []
          inProgress: false
        }
      txLocks[@dbname].queue.push t
      @startNextTransaction()
      return

    SQLitePlugin::transaction = (fn, error, success) ->
      if !@openDBs[@dbname]
        error newSQLError 'database not open'
        return

      @addTransaction new SQLitePluginTransaction(this, fn, error, success, true, false)
      return

    SQLitePlugin::readTransaction = (fn, error, success) ->
      if !@openDBs[@dbname]
        error newSQLError 'database not open'
        return

      @addTransaction new SQLitePluginTransaction(this, fn, error, success, true, true)
      return

    SQLitePlugin::startNextTransaction = ->
      self = @

      nextTick () ->
        txLock = txLocks[self.dbname]
        if txLock.queue.length > 0 && !txLock.inProgress
          txLock.inProgress = true
          txLock.queue.shift().start()
        return
      return

    SQLitePlugin::open = (success, error) ->
      onSuccess = () => success this

      if @dbname of @openDBs
        ###
        for a re-open run onSuccess async so that the openDatabase return value
        can be used in the success handler as an alternative to the handler's
        db argument
        ###
        nextTick () -> onSuccess()
      else
        @openDBs[@dbname] = true
        cordova.exec onSuccess, error, "SQLitePlugin", "open", [ @openargs ]

      return

    SQLitePlugin::close = (success, error) ->
      #console.log "SQLitePlugin.prototype.close"

      if @dbname of @openDBs
        if txLocks[@dbname] && txLocks[@dbname].inProgress
          error newSQLError 'database cannot be closed while a transaction is in progress'
          return

        delete @openDBs[@dbname]

        cordova.exec success, error, "SQLitePlugin", "close", [ { path: @dbname } ]

      return

    SQLitePlugin::executeSql = (statement, params, success, error) ->
      mysuccess = (t, r) -> if !!success then success r
      myerror = (t, e) -> if !!error then error e

      myfn = (tx) ->
        tx.addStatement(statement, params, mysuccess, myerror)
        return

      @addTransaction new SQLitePluginTransaction(this, myfn, null, null, false, false)
      return

## SQLitePluginTransaction object for batching:

    ###
    Transaction batching object:
    ###
    SQLitePluginTransaction = (db, fn, error, success, txlock, readOnly) ->
      if typeof(fn) != "function"
        ###
        This is consistent with the implementation in Chrome -- it
        throws if you pass anything other than a function. This also
        prevents us from stalling our txQueue if somebody passes a
        false value for fn.
        ###
        throw newSQLError "transaction expected a function"

      @db = db
      @fn = fn
      @error = error
      @success = success
      @txlock = txlock
      @readOnly = readOnly
      @executes = []

      if txlock
        @addStatement "BEGIN", [], null, (tx, err) ->
          throw newSQLError "unable to begin transaction: " + err.message, err.code

      return

    SQLitePluginTransaction::start = ->
      try
        @fn this
        @run()
      catch err
        ###
        If "fn" throws, we must report the whole transaction as failed.
        ###
        txLocks[@db.dbname].inProgress = false
        @db.startNextTransaction()
        if @error
          @error newSQLError err
      return

    SQLitePluginTransaction::executeSql = (sql, values, success, error) ->

      if @finalized
        throw {message: 'InvalidStateError: DOM Exception 11: This transaction is already finalized. Transactions are committed after its success or failure handlers are called. If you are using a Promise to handle callbacks, be aware that implementations following the A+ standard adhere to run-to-completion semantics and so Promise resolution occurs on a subsequent tick and therefore after the transaction commits.', code: 11}
        return

      if @readOnly && READ_ONLY_REGEX.test(sql)
        @handleStatementFailure(error, {message: 'invalid sql for a read-only transaction'})
        return

      @addStatement(sql, values, success, error)
      return

    # This method adds the SQL statement to the transaction queue but does not check for
    # finalization since it is used to execute COMMIT and ROLLBACK.
    SQLitePluginTransaction::addStatement = (sql, values, success, error) ->

      qid = @executes.length

      params = []
      if !!values && values.constructor == Array
        for v in values
          t = typeof v
          params.push (
            if v == null || v == undefined || t == 'number' || t == 'string' then v
            else if v instanceof Blob then v.valueOf()
            else v.toString()
          )

      @executes.push
        success: success
        error: error
        qid: qid

        sql: sql
        #params: values || []
        params: params

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
        throw newSQLError "a statement with no error handler failed: " + response.message, response.code
      if handler(this, response) isnt false
        throw newSQLError "a statement error callback did not return false: " + response.message, response.code
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
              tx.handleStatementFailure batchExecutes[index].error, newSQLError(response)
          catch err
            if !txFailure
              txFailure = newSQLError(err)

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

      cordova.exec mycb, null, "SQLitePlugin", "backgroundExecuteSqlBatch", [{dbargs: {dbname: @db.dbname}, executes: tropts}]

      return

    SQLitePluginTransaction::abort = (txFailure) ->
      if @finalized then return
      tx = @

      succeeded = (tx) ->
        txLocks[tx.db.dbname].inProgress = false
        tx.db.startNextTransaction()
        if tx.error then tx.error txFailure
        return

      failed = (tx, err) ->
        txLocks[tx.db.dbname].inProgress = false
        tx.db.startNextTransaction()
        if tx.error then tx.error newSQLError("error while trying to roll back: " + err.message, err.code)
        return

      @finalized = true

      if @txlock
        @addStatement "ROLLBACK", [], succeeded, failed
        @run()
      else
        succeeded(tx)

      return

    SQLitePluginTransaction::finish = ->
      if @finalized then return
      tx = @

      succeeded = (tx) ->
        txLocks[tx.db.dbname].inProgress = false
        tx.db.startNextTransaction()
        if tx.success then tx.success()
        return

      failed = (tx, err) ->
        txLocks[tx.db.dbname].inProgress = false
        tx.db.startNextTransaction()
        if tx.error then tx.error newSQLError("error while trying to commit: " + err.message, err.code)
        return

      @finalized = true

      if @txlock
        @addStatement "COMMIT", [], succeeded, failed
        @run()
      else
        succeeded(tx)

      return

## SQLite plugin object factory:

    dblocations = [ "docs", "libs", "nosync" ]

    SQLiteFactory =
      ###
      NOTE: this function should NOT be translated from Javascript
      back to CoffeeScript by js2coffee.
      If this function is edited in Javascript then someone will
      have to translate it back to CoffeeScript by hand.
      ###
      opendb: argsArray (args) ->
        if args.length < 1 then return null

        first = args[0]
        openargs = null
        okcb = null
        errorcb = null

        if first.constructor == String
          openargs = {name: first}

          if args.length >= 5
            okcb = args[4]
            if args.length > 5 then errorcb = args[5]

        else
          openargs = first

          if args.length >= 2
            okcb = args[1]
            if args.length > 2 then errorcb = args[2]

        dblocation = if !!openargs.location then dblocations[openargs.location] else null
        openargs.dblocation = dblocation || dblocations[0]

        if !!openargs.createFromLocation and openargs.createFromLocation == 1
          openargs.createFromResource = "1"

        if !!openargs.androidLockWorkaround and openargs.androidLockWorkaround == 1
          openargs.androidLockWorkaround = 1

        new SQLitePlugin openargs, okcb, errorcb

      deleteDb: (first, success, error) ->
        args = {}

        if first.constructor == String
          #console.log "delete db name: #{first}"
          args.path = first
          args.dblocation = dblocations[0]

        else
          #console.log "delete db args: #{JSON.stringify first}"
          if !(first and first['name']) then throw new Error "Please specify db name"
          args.path = first.name
          dblocation = if !!first.location then dblocations[first.location] else null
          args.dblocation = dblocation || dblocations[0]

        delete SQLitePlugin::openDBs[args.path]
        cordova.exec success, error, "SQLitePlugin", "delete", [ args ]

## Exported API:

    root.sqlitePlugin =
      sqliteFeatures:
        isSQLitePlugin: true

      openDatabase: SQLiteFactory.opendb
      deleteDatabase: SQLiteFactory.deleteDb

