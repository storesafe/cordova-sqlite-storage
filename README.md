Phonegap SQLitePlugin
=====================

This is Joe Noon's fork of Phonegap-SQLitePlugin

This fork lives at: https://github.com/joenoon/Phonegap-SQLitePlugin

The original lives at: https://github.com/davibe/Phonegap-SQLitePlugin

This fork has largely diverged from the original, and is not a drop-in
replacement.

DISCLAIMER: 
  
I'm brand new to objective-c, so there could be problems with my code!
Please tell me. joenoon@gmail.com

Added:

-  obj-c:
  -  batch execution support
  -  query parameter binding
  -  perform after delay so js-objc call doesn't need to wait for response
  -  callbacks moved out of instance and into options of each method call
  -  path just takes filename, and path is put in Documents folder
  -  added rowsAffected, insertId
  -  success callback response is { insertId: x, rowsAffected: y, rows: z }
  -  error callback response is { message: x }
  
-  js (coffeescript):
  -  new implementation
  -  first cut transaction support
  -  callbacks per-statement, even within transaction
  -  somewhat similar api to the webkit/phonegap default

-  lawnchair adapter

Removed:

-  quota limit webkit html5 db patching
-  exit from app
-  (I don't think either of these would make it through the approval process)

Other notes:

I played with the idea of batching responses into larger sets of
writeJavascript on a timer, however there was only a barely noticeable
performance gain.  So I took it out, not worth it.  However there is a
massive performance gain by batching on the client-side to minimize
PhoneGap.exec calls using the transaction support.

Installing
==========

Drag .h and .m files into your project's Plugins folder (in xcode) -- I always
just have "Create references" as the option selected.

Take the precompiled javascript file from build/, or compile the coffeescript
file in src/ to javascript WITH the top-level function wrapper option (default).

Use the resulting javascript file in your HTML.

Look for the following to your project's PhoneGap.plist:

    <key>Plugins</key>
    <dict>
      ...
    </dict>

Insert this in there:

    <key>PGSQLitePlugin</key>
    <string>PGSQLitePlugin</string>

General Usage
=============

(You're using Coffeescript right? Of course you are.)

    db = new PGSQLitePlugin("test_native.sqlite3")
    db.executeSql('DROP TABLE IF EXISTS test_table')
    db.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)')

    db.transaction (tx) ->
  
      tx.executeSql [ "INSERT INTO test_table (data, data_num) VALUES (?,?)", "test", 100], (res) ->
    
        # success callback
    
        console.log "insertId: #{res.insertId} -- probably 1"
        console.log "rowsAffected: #{res.rowsAffected} -- should be 1"
    
        # check the count (not a part of the transaction)
        db.executeSql "select count(id) as cnt from test_table;", (res) ->
          console.log "rows.length: #{res.rows.length} -- should be 1"
          console.log "rows[0].cnt: #{res.rows[0].cnt} -- should be 1"
  
      , (e) ->
    
        # error callback
    
        console.log "ERROR: #{e.message}"

Lawnchair Adapter Usage
=======================

Include the following js files in your html:

-  lawnchair.js (you provide)
-  pgsqlite_plugin.js
-  lawnchair_pgsqlite_plugin_adapter.js (must come after pgsqlite_plugin.js)

The `name` option will determine the sqlite filename.  In this example, you would be using/creating
the database at: *Documents/kvstore.sqlite3* (all db's in PGSQLitePlugin are in the Documents folder)

    kvstore = new Lawnchair { name: "kvstore", adapter: PGSQLitePlugin.lawnchair_adapter }, () ->
      # do stuff
