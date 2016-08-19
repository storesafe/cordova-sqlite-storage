# SQLite plugin in Markdown (litcoffee)

#### Use coffee compiler to compile this directly into Javascript

#### License for common script: MIT or Apache

# Top-level SQLite plugin objects

## root window object:

    root = @

## constant(s):

    READ_ONLY_REGEX = /^(\s|;)*(?:alter|create|delete|drop|insert|reindex|replace|update)/i

    # per-db state
    DB_STATE_INIT = "INIT"
    DB_STATE_OPEN = "OPEN"

## global(s):

    # per-db map of locking and queueing
    # XXX NOTE: This is NOT cleaned up when a db is closed and/or deleted.
    # If the record is simply removed when a db is closed or deleted,
    # it will cause some test failures and may break large-scale
    # applications that repeatedly open and close the database.
    # [BUG #210] TODO: better to abort and clean up the pending transaction state.
    # XXX TBD this will be renamed and include some more per-db state.
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

## SQLite plugin db-connection handle

#### NOTE: there can be multipe SQLitePlugin db-connection handles per open db.

#### SQLite plugin db connection handle object is defined by a constructor function and prototype member functions:

    SQLitePlugin = (openargs, openSuccess, openError) ->
      # console.log "SQLitePlugin openargs: #{JSON.stringify openargs}"

      # _should_ already be checked by openDatabase:
      if !(openargs and openargs['name'])
        throw newSQLError "Cannot create a SQLitePlugin db instance without a db name"

      dbname = openargs.name

      if typeof dbname != 'string'
        throw newSQLError 'sqlite plugin database name must be a string'

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

    # Keep track of state of open db connections
    # XXX TBD this will be moved and renamed or
    # combined with txLocks.
    SQLitePlugin::openDBs = {}

    SQLitePlugin::addTransaction = (t) ->
      if !txLocks[@dbname]
        txLocks[@dbname] = {
          queue: []
          inProgress: false
        }
      txLocks[@dbname].queue.push t
      if @dbname of @openDBs && @openDBs[@dbname] isnt DB_STATE_INIT
        # XXX TODO: only when queue has length of 1 [and test it!!]
        @startNextTransaction()

      else
        if @dbname of @openDBs
          console.log 'new transaction is waiting for open operation'
        else
          # XXX TBD TODO: in this case (which should not happen), should abort and discard the transaction.
          console.log 'database is closed, new transaction is [stuck] waiting until db is opened again!'
      return

    SQLitePlugin::transaction = (fn, error, success) ->
      # FUTURE TBD check for valid fn here
      if !@openDBs[@dbname]
        error newSQLError 'database not open'
        return

      @addTransaction new SQLitePluginTransaction(this, fn, error, success, true, false)
      return

    SQLitePlugin::readTransaction = (fn, error, success) ->
      # FUTURE TBD check for valid fn here (and add test for this)
      if !@openDBs[@dbname]
        error newSQLError 'database not open'
        return

      @addTransaction new SQLitePluginTransaction(this, fn, error, success, false, true)
      return

    SQLitePlugin::startNextTransaction = ->
      self = @

      nextTick =>
        if !(@dbname of @openDBs) || @openDBs[@dbname] isnt DB_STATE_OPEN
          console.log 'cannot start next transaction: database not open'
          return

        txLock = txLocks[self.dbname]
        if !txLock
          console.log 'cannot start next transaction: database connection is lost'
          # XXX TBD TODO (BUG #210/??): abort all pending transactions with error cb [and test!!]
          # @abortAllPendingTransactions()
          return

        else if txLock.queue.length > 0 && !txLock.inProgress
          # start next transaction in q
          txLock.inProgress = true
          txLock.queue.shift().start()
        return

      return

    SQLitePlugin::abortAllPendingTransactions = ->
      # extra debug info:
      # if txLocks[@dbname] then console.log 'abortAllPendingTransactions with transaction queue length: ' + txLocks[@dbname].queue.length
      # else console.log 'abortAllPendingTransactions with no transaction lock state'

      txLock = txLocks[@dbname]
      if !!txLock && txLock.queue.length > 0
        # XXX TODO: what to do in case there is a (stray) transaction in progress?
        #console.log 'abortAllPendingTransactions - cleanup old transaction(s)'
        for tx in txLock.queue
          tx.abortFromQ newSQLError 'Invalid database handle'

        # XXX TODO: consider cleaning up (delete) txLocks[@dbname] resource,
        # in case it is known there are no more pending transactions
        txLock.queue = []
        txLock.inProgress = false

      return

    SQLitePlugin::open = (success, error) ->
      if @dbname of @openDBs
        console.log 'database already open: ' + @dbname

        # for a re-open run the success cb async so that the openDatabase return value
        # can be used in the success handler as an alternative to the handler's
        # db argument
        nextTick =>
          success @
          return

      else
        console.log 'OPEN database: ' + @dbname

        opensuccesscb = =>
          # NOTE: the db state is NOT stored (in @openDBs) if the db was closed or deleted.
          console.log 'OPEN database: ' + @dbname + ' - OK'

          #if !@openDBs[@dbname] then call open error cb, and abort pending tx if any
          if !@openDBs[@dbname]
            console.log 'database was closed during open operation'
            # XXX TODO [BUG #210] (and test!!):
            # if !!error then error newSQLError 'database closed during open operation'
            # @abortAllPendingTransactions()

          if @dbname of @openDBs
            @openDBs[@dbname] = DB_STATE_OPEN

          if !!success then success @

          txLock = txLocks[@dbname]
          if !!txLock && txLock.queue.length > 0 && !txLock.inProgress
            @startNextTransaction()
          return

        openerrorcb = =>
          console.log 'OPEN database: ' + @dbname + ' FAILED, aborting any pending transactions'
          # XXX TODO: newSQLError missing the message part!
          if !!error then error newSQLError 'Could not open database'
          delete @openDBs[@dbname]
          @abortAllPendingTransactions()
          return

        # store initial DB state:
        @openDBs[@dbname] = DB_STATE_INIT

        cordova.exec opensuccesscb, openerrorcb, "SQLitePlugin", "open", [ @openargs ]

      return

    SQLitePlugin::close = (success, error) ->
      if @dbname of @openDBs
        if txLocks[@dbname] && txLocks[@dbname].inProgress
          # XXX TBD: wait for current tx then close (??)
          console.log 'cannot close: transaction is in progress'
          error newSQLError 'database cannot be closed while a transaction is in progress'
          return

        console.log 'CLOSE database: ' + @dbname

        # XXX [BUG #209] closing one db handle disables other handles to same db
        delete @openDBs[@dbname]

        if txLocks[@dbname] then console.log 'closing db with transaction queue length: ' + txLocks[@dbname].queue.length
        else console.log 'closing db with no transaction lock state'

        # XXX [BUG #210] TODO: when closing or deleting a db, abort any pending transactions [and test it!!]

        cordova.exec success, error, "SQLitePlugin", "close", [ { path: @dbname } ]

      else
        console.log 'cannot close: database is not open'
        if error then nextTick -> error()

      return

    SQLitePlugin::executeSql = (statement, params, success, error) ->
      # XXX TODO: better to capture the result, and report it once
      # the transaction has completely finished.
      # This would fix BUG #204 (cannot close db in db.executeSql() callback).
      mysuccess = (t, r) -> if !!success then success r
      myerror = (t, e) -> if !!error then error e

      myfn = (tx) ->
        tx.addStatement(statement, params, mysuccess, myerror)
        return

      @addTransaction new SQLitePluginTransaction(this, myfn, null, null, false, false)
      return

    SQLitePlugin::sqlBatch = (sqlStatements, success, error) ->
      if !sqlStatements || sqlStatements.constructor isnt Array
        throw newSQLError 'sqlBatch expects an array'

      batchList = []

      for st in sqlStatements
        if st.constructor is Array
          if st.length == 0
            throw newSQLError 'sqlBatch array element of zero (0) length'

          batchList.push
            sql: st[0]
            params: if st.length == 0 then [] else st[1]

        else
          batchList.push
            sql: st
            params: []

      myfn = (tx) ->
        for elem in batchList
          tx.addStatement(elem.sql, elem.params, null, null)

      @addTransaction new SQLitePluginTransaction(this, myfn, error, success, true, false)
      return

## SQLite plugin transaction object for batching:

    SQLitePluginTransaction = (db, fn, error, success, txlock, readOnly) ->
      # FUTURE TBD check this earlier:
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

      # Workaround for litehelpers/Cordova-sqlite-storage#409
      # extra statement in case user function does not add any SQL statements
      # TBD This also adds an extra statement to db.executeSql()
      else
        @addStatement "SELECT 1", [], null, null

      return

    SQLitePluginTransaction::start = ->
      try
        @fn this

        @run()

      catch err
        # If "fn" throws, we must report the whole transaction as failed.
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
      sqlStatement = if typeof sql is 'string'
        sql
      else
        sql.toString()

      params = []
      if !!values && values.constructor == Array
        for v in values
          t = typeof v
          params.push (
            if v == null || v == undefined || t == 'number' || t == 'string' then v
            else v.toString()
          )

      @executes.push
        success: success
        error: error

        sql: sqlStatement
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

      # NOTE: If this is zero it will not work. Workaround is applied in the constructor.
      # FUTURE TBD: It would be better to fix the problem here.
      waiting = batchExecutes.length
      @executes = []

      # my tx object (this)
      tx = @

      handlerFor = (index, didSucceed) ->
        (response) ->
          if !txFailure
            try
              if didSucceed
                tx.handleStatementSuccess batchExecutes[index].success, response
              else
                tx.handleStatementFailure batchExecutes[index].error, newSQLError(response)
            catch err
              # NOTE: txFailure is expected to be null at this point.
              txFailure = newSQLError(err)

          if --waiting == 0
            if txFailure
              tx.executes = []
              tx.abort txFailure
            else if tx.executes.length > 0
              # new requests have been issued by the callback
              # handlers, so run another batch.
              tx.run()
            else
              tx.finish()

          return

      mycbmap = {}

      i = 0
      while i < batchExecutes.length
        request = batchExecutes[i]

        mycbmap[i] =
          success: handlerFor(i, true)
          error: handlerFor(i, false)

        tropts.push
          qid: null # TBD NEEDED to pass @brodybits/Cordova-sql-test-app for some reason
          sql: request.sql
          params: request.params

        i++

      mycb = (result) ->
        #console.log "mycb result #{JSON.stringify result}"

        for resultIndex in [0 .. result.length-1]
          r = result[resultIndex]
          type = r.type
          # NOTE: r.qid can be ignored
          res = r.result

          q = mycbmap[resultIndex]

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

    SQLitePluginTransaction::abortFromQ = (sqlerror) ->
      # NOTE: since the transaction is waiting in the queue,
      # the transaction function containing the SQL statements
      # would not be run yet. Simply report the transaction error.
      if @error
        @error sqlerror

      return

## SQLite plugin object factory:

    # OLD:
    dblocations = [ "docs", "libs", "nosync" ]

    iosLocationMap =
      'default' : 'nosync'
      'Documents' : 'docs'
      'Library' : 'libs'

    SQLiteFactory =
      ###
      NOTE: this function should NOT be translated from Javascript
      back to CoffeeScript by js2coffee.
      If this function is edited in Javascript then someone will
      have to translate it back to CoffeeScript by hand.
      ###
      openDatabase: argsArray (args) ->
        if args.length < 1 || !args[0]
          throw newSQLError 'Sorry missing mandatory open arguments object in openDatabase call'

        #first = args[0]
        #openargs = null
        #okcb = null
        #errorcb = null

        #if first.constructor == String
        #  openargs = {name: first}

        #  if args.length >= 5
        #    okcb = args[4]
        #    if args.length > 5 then errorcb = args[5]

        #else
        #  openargs = first

        #  if args.length >= 2
        #    okcb = args[1]
        #    if args.length > 2 then errorcb = args[2]

        if args[0].constructor == String
          throw newSQLError 'Sorry first openDatabase argument must be an object'

        openargs = args[0]

        # check here
        if !openargs.name
          throw newSQLError 'Database name value is missing in openDatabase call'

        if !openargs.iosDatabaseLocation and !openargs.location and openargs.location isnt 0
          throw newSQLError 'Database location or iosDatabaseLocation value is now mandatory in openDatabase call'

        if !!openargs.location and !!openargs.iosDatabaseLocation
          throw newSQLError 'AMBIGUOUS: both location or iosDatabaseLocation values are present in openDatabase call'

        dblocation =
          if !!openargs.location and openargs.location is 'default'
            iosLocationMap['default']
          else if !!openargs.iosDatabaseLocation
            iosLocationMap[openargs.iosDatabaseLocation]
          else
            dblocations[openargs.location]

        if !dblocation
          throw newSQLError 'Valid iOS database location could not be determined in openDatabase call'

        openargs.dblocation = dblocation

        if !!openargs.createFromLocation and openargs.createFromLocation == 1
          openargs.createFromResource = "1"

        if !!openargs.androidDatabaseImplementation and openargs.androidDatabaseImplementation == 2
          openargs.androidOldDatabaseImplementation = 1

        if !!openargs.androidLockWorkaround and openargs.androidLockWorkaround == 1
          openargs.androidBugWorkaround = 1

        okcb = null
        errorcb = null
        if args.length >= 2
          okcb = args[1]
          if args.length > 2 then errorcb = args[2]

        new SQLitePlugin openargs, okcb, errorcb

      deleteDatabase: (first, success, error) ->
        args = {}

        if first.constructor == String
          #console.log "delete db name: #{first}"
          #args.path = first
          #args.dblocation = dblocations[0]
          throw newSQLError 'Sorry first deleteDatabase argument must be an object'

        else
          #console.log "delete db args: #{JSON.stringify first}"
          if !(first and first['name']) then throw new Error "Please specify db name"
          dbname = first.name

          if typeof dbname != 'string'
            throw newSQLError 'delete database name must be a string'

          args.path = dbname
          #dblocation = if !!first.location then dblocations[first.location] else null
          #args.dblocation = dblocation || dblocations[0]

        if !first.iosDatabaseLocation and !first.location and first.location isnt 0
          throw newSQLError 'Database location or iosDatabaseLocation value is now mandatory in deleteDatabase call'

        if !!first.location and !!first.iosDatabaseLocation
          throw newSQLError 'AMBIGUOUS: both location or iosDatabaseLocation values are present in deleteDatabase call'

        dblocation =
          if !!first.location and first.location is 'default'
            iosLocationMap['default']
          else if !!first.iosDatabaseLocation
            iosLocationMap[first.iosDatabaseLocation]
          else
            dblocations[first.location]

        if !dblocation
          throw newSQLError 'Valid iOS database location could not be determined in deleteDatabase call'

        args.dblocation = dblocation

        # XXX [BUG #210] TODO: when closing or deleting a db, abort any pending transactions (with error callback)
        delete SQLitePlugin::openDBs[args.path]
        cordova.exec success, error, "SQLitePlugin", "delete", [ args ]

## Self test:

    SelfTest =
      DBNAME: '___$$$___litehelpers___$$$___test___$$$___.db'

      start: (successcb, errorcb) ->
        SQLiteFactory.deleteDatabase {name: SelfTest.DBNAME, location: 'default'},
          (-> SelfTest.start2(successcb, errorcb)),
          (-> SelfTest.start2(successcb, errorcb))

      start2: (successcb, errorcb) ->
        SQLiteFactory.openDatabase {name: SelfTest.DBNAME, location: 'default'}, (db) ->
          db.sqlBatch [
            'CREATE TABLE TestTable(id integer primary key autoincrement unique, data);'
            [ 'INSERT INTO TestTable (data) VALUES (?);', ['test-value'] ]
          ], () ->
            firstid = -1 # invalid

            db.executeSql 'SELECT id, data FROM TestTable', [], (resutSet) ->
              if !resutSet.rows
                SelfTest.finishWithError errorcb, 'Missing resutSet.rows'
                return

              if !resutSet.rows.length
                SelfTest.finishWithError errorcb, 'Missing resutSet.rows.length'
                return

              if resutSet.rows.length isnt 1
                SelfTest.finishWithError errorcb,
                  "Incorrect resutSet.rows.length value: #{resutSet.rows.length} (expected: 1)"
                return

              if resutSet.rows.item(0).id is undefined
                SelfTest.finishWithError errorcb,
                  'Missing resutSet.rows.item(0).id'
                return

              firstid = resutSet.rows.item(0).id

              if !resutSet.rows.item(0).data
                SelfTest.finishWithError errorcb,
                  'Missing resutSet.rows.item(0).data'
                return

              if resutSet.rows.item(0).data isnt 'test-value'
                SelfTest.finishWithError errorcb,
                  "Incorrect resutSet.rows.item(0).data value: #{resutSet.rows.item(0).data} (expected: 'test-value')"
                return

              db.transaction (tx) ->
                tx.executeSql 'UPDATE TestTable SET data = ?', ['new-value']
              , (tx_err) ->
                SelfTest.finishWithError errorcb, "UPDATE transaction error: #{tx_err}"
              , () ->
                readTransactionFinished = false
                db.readTransaction (tx2) ->
                  tx2.executeSql 'SELECT id, data FROM TestTable', [], (ignored, resutSet2) ->
                    if !resutSet2.rows
                      throw newSQLError 'Missing resutSet2.rows'

                    if !resutSet2.rows.length
                      throw newSQLError 'Missing resutSet2.rows.length'

                    if resutSet2.rows.length isnt 1
                      throw newSQLError "Incorrect resutSet2.rows.length value: #{resutSet2.rows.length} (expected: 1)"

                    if !resutSet2.rows.item(0).id
                      throw newSQLError 'Missing resutSet2.rows.item(0).id'

                    if resutSet2.rows.item(0).id isnt firstid
                      throw newSQLError "resutSet2.rows.item(0).id value #{resutSet2.rows.item(0).id} does not match previous primary key id value (#{firstid})"

                    if !resutSet2.rows.item(0).data
                      throw newSQLError 'Missing resutSet2.rows.item(0).data'

                    if resutSet2.rows.item(0).data isnt 'new-value'
                      throw newSQLError "Incorrect resutSet2.rows.item(0).data value: #{resutSet2.rows.item(0).data} (expected: 'test-value')"
                    readTransactionFinished = true

                , (tx2_err) ->
                  SelfTest.finishWithError errorcb, "readTransaction error: #{tx2_err}"
                , () ->
                  if !readTransactionFinished
                    SelfTest.finishWithError errorcb, 'readTransaction did not finish'
                    return

                  db.transaction (tx3) ->
                    tx3.executeSql 'DELETE FROM TestTable'
                    tx3.executeSql 'INSERT INTO TestTable (data) VALUES(?)', [123]
                  , (tx3_err) ->
                    SelfTest.finishWithError errorcb, "DELETE transaction error: #{tx3_err}"
                  , () ->
                    secondReadTransactionFinished = false
                    db.readTransaction (tx4) ->
                      tx4.executeSql 'SELECT id, data FROM TestTable', [], (ignored, resutSet3) ->
                        if !resutSet3.rows
                          throw newSQLError 'Missing resutSet3.rows'

                        if !resutSet3.rows.length
                          throw newSQLError 'Missing resutSet3.rows.length'

                        if resutSet3.rows.length isnt 1
                          throw newSQLError "Incorrect resutSet3.rows.length value: #{resutSet3.rows.length} (expected: 1)"

                        if !resutSet3.rows.item(0).id
                          throw newSQLError 'Missing resutSet3.rows.item(0).id'

                        if resutSet3.rows.item(0).id is firstid
                          throw newSQLError "resutSet3.rows.item(0).id value #{resutSet3.rows.item(0).id} incorrectly matches previous unique key id value value (#{firstid})"

                        if !resutSet3.rows.item(0).data
                          throw newSQLError 'Missing resutSet3.rows.item(0).data'

                        if resutSet3.rows.item(0).data isnt 123
                          throw newSQLError "Incorrect resutSet3.rows.item(0).data value: #{resutSet3.rows.item(0).data} (expected 123)"

                        secondReadTransactionFinished = true

                    , (tx4_err) ->
                      SelfTest.finishWithError errorcb, "second readTransaction error: #{tx4_err}"
                    , () ->
                      if !secondReadTransactionFinished
                        SelfTest.finishWithError errorcb, 'second readTransaction did not finish'
                        return
                      # CLEANUP & FINISH:
                      db.close () ->
                        SQLiteFactory.deleteDatabase {name: SelfTest.DBNAME, location: 'default'}, successcb, (cleanup_err)->
                          SelfTest.finishWithError errorcb, "Cleanup error: #{cleanup_err}"

                      , (close_err) ->
                        SelfTest.finishWithError errorcb, "close error: #{close_err}"

            , (select_err) ->
              SelfTest.finishWithError errorcb, "SELECT error: #{select_err}"

          , (batch_err) ->
            SelfTest.finishWithError errorcb, "sql batch error: #{batch_err}"

        , (open_err) ->
          SelfTest.finishWithError errorcb, "Open database error: #{open_err}"

      finishWithError: (errorcb, message) ->
        SQLiteFactory.deleteDatabase {name: SelfTest.DBNAME, location: 'default'}, ->
          errorcb newSQLError message
        , (err2)-> errorcb newSQLError "Cleanup error: #{err2} for error: #{message}"

## Exported API:

    root.sqlitePlugin =
      sqliteFeatures:
        isSQLitePlugin: true

      echoTest: (okcb, errorcb) ->
        ok = (s) ->
          if s is 'test-string'
            okcb()
          else
            errorcb "Mismatch: got: '#{s}' expected 'test-string'"

        error = (e) ->
          errorcb e

        cordova.exec okcb, errorcb, "SQLitePlugin", "echoStringValue", [{value:'test-string'}]

      selfTest: SelfTest.start

      openDatabase: SQLiteFactory.openDatabase
      deleteDatabase: SQLiteFactory.deleteDatabase

## vim directives

#### vim: set filetype=coffee :
#### vim: set expandtab :

