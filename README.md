Phonegap SQLitePlugin
=====================

DISCLAIMER:

We are brand new to objective-c, so there could be problems with our code!

Installing
==========
/** 
For installing with PhoneGap 1.3.0:
in PGSQLitePlugin.h file change for PhoneGaps JSONKit.h implementation.

[code]
#ifdef PHONEGAP_FRAMEWORK
    #import <PhoneGap/PGPlugin.h>
    #import <PhoneGap/JSONKit.h>
    #import <PhoneGap/PhoneGapDelegate.h>
    #import <PhoneGap/File.h>
    #import<PhoneGap/FileTransfer.h>
#else
    #import "PGPlugin.h"
    #import "JSON.h"
    #import "PhoneGapDelegate.h"
    #import "File.h"
#endif
[/code]

In the Project Build Phases tab, select the "Link Binary with Libraries" dropdown menu and add 2 libraries:

libsqlite3.0.dylib
libsqlite3.dylib


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

## Coffee Script

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

## Plain Javascript

    var db;
    db = new PGSQLitePlugin("test_native.sqlite3");
    db.executeSql('DROP TABLE IF EXISTS test_table');
    db.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)');
    db.transaction(function(tx) {
      return tx.executeSql(["INSERT INTO test_table (data, data_num) VALUES (?,?)", "test", 100], function(res) {
        console.log("insertId: " + res.insertId + " -- probably 1");
        console.log("rowsAffected: " + res.rowsAffected + " -- should be 1");
        return db.executeSql("select count(id) as cnt from test_table;", function(res) {
          console.log("rows.length: " + res.rows.length + " -- should be 1");
          return console.log("rows[0].cnt: " + res.rows[0].cnt + " -- should be 1");
        });
      }, function(e) {
        return console.log("ERROR: " + e.message);
      });
    });


Lawnchair Adapter Usage
=======================

Include the following js files in your html:

-  lawnchair.js (you provide)
-  pgsqlite_plugin.js
-  lawnchair_pgsqlite_plugin_adapter.js (must come after pgsqlite_plugin.js)



The `name` option will determine the sqlite filename. Optionally, you can change it using the `db` option.

In this example, you would be using/creating the database at: *Documents/kvstore.sqlite3* (all db's in PGSQLitePlugin are in the Documents folder)

    kvstore = new Lawnchair { name: "kvstore", adapter: PGSQLitePlugin.lawnchair_adapter }, () ->
      # do stuff

Using the `db` option you can create multiple stores in one sqlite file. (There will be one table per store.)

    recipes = new Lawnchair {db: "cookbook", name: "recipes", ...}
	ingredients = new Lawnchair {db: "cookbook", name: "ingredients", ...}

### Other notes from @Joenoon:

I played with the idea of batching responses into larger sets of
writeJavascript on a timer, however there was only a barely noticeable
performance gain.  So I took it out, not worth it.  However there is a
massive performance gain by batching on the client-side to minimize
PhoneGap.exec calls using the transaction support.

