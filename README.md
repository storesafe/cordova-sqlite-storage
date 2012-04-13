Cordova/PhoneGap SQLitePlugin
=============================

Native interface to sqlite in a Cordova/PhoneGap plugin, working to follow the HTML5 Web SQL API as close as possible. **NOTE** that the API is now different from https://github.com/davibe/Phonegap-SQLitePlugin.

Created by @joenoon and @davibe

Adapted to Cordova 1.5+ by @coomsie, Cordova 1.6 bugfix by @mineshaftgap

Android version by @marcucio and @chbrody

API changes by @chbrody

Highlights
----------

 - Keeps sqlite database in a known user data location that will be backed up by iCloud on iOS
 - Drop-in replacement for HTML5 SQL API, the only change is window.openDatabase() --> sqlitePlugin.openDatabase()
 - Both Android and iOS versions are designed with batch processing optimizations
 - Future: API to configure the desired database location

Usage
=====

The idea is to emulate the HTML5 SQL API as closely as possible. The only major change is to use window.sqlitePlugin.openDatabase() (or sqlitePlugin.openDatabase()) instead of window.openDatabase(). If you see any other major change please report it, it is probably a bug.

Sample in Javascript:

    // Wait for Cordova/PhoneGap to load
    //
    document.addEventListener("deviceready", onDeviceReady, false);

    // Cordova/PhoneGap is ready
    //
    function onDeviceReady() {
        var db = window.sqlitePlugin.openDatabase("Database", "1.0", "PhoneGap Demo", 200000);

    db.transaction(function(tx) {

    tx.executeSql('DROP TABLE IF EXISTS test_table');
    tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)');


      return tx.executeSql("INSERT INTO test_table (data, data_num) VALUES (?,?)", ["test", 100], function(tx, res) {
        //console.log("insertId: " + res.insertId + " -- probably 1");
        //console.log("rowsAffected: " + res.rowsAffected + " -- should be 1");

        tx.executeSql("select count(id) as cnt from test_table;", [], function(tx, res) {
          console.log("rows.length: " + res.rows.length + " -- should be 1");
          return console.log("rows[0].cnt: " + res.rows.item(0).cnt + " -- should be 1");
        });

      }, function(e) {
        return console.log("ERROR: " + e.message);
      });
    });
    }

Installing
==========

**NOTE:** There are now the following trees:

 - `iOS` for Cordova 1.5/1.6 iOS
 - `iOS-legacy-phonegap` to support new API for PhoneGap 1.4- (cleanups by @marcucio)
 - `Android`: new version by @marcucio, with improvements for batch transaction processing, testing seems OK

PhoneGap 1.3.0
--------------

For installing with PhoneGap 1.3.0:
in iOS-legacy-phonegap/SQLitePlugin.h file change for PhoneGap's JSONKit.h implementation.

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

and in iOS-legacy-phonegap/SQLitePlugin.m JSONRepresentation must be changed to JSONString:

    @@ -219,7 +219,7 @@
             if (hasInsertId) {
                 [resultSet setObject:insertId forKey:@"insertId"];
             }
    -        [self respond:callback withString:[resultSet JSONRepresentation] withType:@"success"];
    +        [self respond:callback withString:[resultSet JSONString] withType:@"success"];
         }
     }

SQLite library
--------------

In the Project "Build Phases" tab, select the _first_ "Link Binary with Libraries" dropdown menu and add the library `libsqlite3.dylib` or `libsqlite3.0.dylib`.

**NOTE:** In the "Build Phases" there can be multiple "Link Binary with Libraries" dropdown menus. Please select the first one otherwise it will not work.

Native SQLite Plugin
--------------------

Drag .h and .m files into your project's Plugins folder (in xcode) -- I always
just have "Create references" as the option selected.

Take the precompiled javascript file from build/, or compile the coffeescript
file in src/ to javascript WITH the top-level function wrapper option (default).

Use the resulting javascript file in your HTML.

Look for the following to your project's Cordova.plist or PhoneGap.plist:

    <key>Plugins</key>
    <dict>
      ...
    </dict>

Insert this in there:

    <key>SQLitePlugin</key>
    <string>SQLitePlugin</string>

Extra Usage
===========

Cordova iOS
-----------

**NOTE:** These are from old samples, old API which is hereby deprecated.

## Coffee Script

    db = sqlitePlugin.openDatabase("my_sqlite_database.sqlite3")
    db.executeSql('DROP TABLE IF EXISTS test_table')
    db.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)')

    db.transaction (tx) ->

      tx.executeSql "INSERT INTO test_table (data, data_num) VALUES (?,?)", ["test", 100], (res) ->

        # success callback

        console.log "insertId: #{res.insertId} -- probably 1"
        console.log "rowsAffected: #{res.rowsAffected} -- should be 1"

        # check the count (not a part of the transaction)
        db.executeSql "select count(id) as cnt from test_table;", [], (res) ->
          console.log "rows.length: #{res.rows.length} -- should be 1"
          console.log "rows[0].cnt: #{res.rows[0].cnt} -- should be 1"

      , (e) ->

        # error callback

        console.log "ERROR: #{e.message}"

## Plain Javascript

    var db = sqlitePlugin.openDatabase("my_sqlite_database.sqlite3");

    db.executeSql('DROP TABLE IF EXISTS test_table');
    db.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)');
    db.transaction(function(tx) {
      return tx.executeSql("INSERT INTO test_table (data, data_num) VALUES (?,?)", ["test", 100], function(res) {
        console.log("insertId: " + res.insertId + " -- probably 1");
        console.log("rowsAffected: " + res.rowsAffected + " -- should be 1");
        return db.executeSql("select count(id) as cnt from test_table;", [], function(res) {
          console.log("rows.length: " + res.rows.length + " -- should be 1");
          return console.log("rows[0].cnt: " + res.rows[0].cnt + " -- should be 1");
        });
      }, function(e) {
        return console.log("ERROR: " + e.message);
      });
    });

## Changes in tx.executeSql() success callback

        var db = sqlitePlugin.openDatabase("my_sqlite_database.sqlite3");
        db.executeSql('DROP TABLE IF EXISTS test_table');
        db.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)');
        db.executeSql("INSERT INTO test_table (data, data_num) VALUES (?,?)", ["test", 100], function(res) {
                      console.log("insertId: " + res.insertId + " -- probably 1");
                      console.log("rowsAffected: " + res.rowsAffected + " -- should be 1");
                      db.transaction(function(tx) {
                                     return tx.executeSql("select count(id) as cnt from test_table;", [], function(tx, res) {
                                                          console.log("rows.length: " + res.rows.length + " -- should be 1");
                                                          return console.log("rows.item(0).cnt: " + res.rows.item(0).cnt + " -- should be 1");
                                                          });
                                     });
                      });


iOS Legacy PhoneGap
-----------------------------

## Coffee Script

    db = new PGSQLitePlugin("my_sqlite_database.sqlite3")
    db.executeSql('DROP TABLE IF EXISTS test_table')
    db.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)')

    db.transaction (tx) ->

      tx.executeSql "INSERT INTO test_table (data, data_num) VALUES (?,?)", ["test", 100], (res) ->

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
    db = new PGSQLitePlugin("my_sqlite_database.sqlite3");
    db.executeSql('DROP TABLE IF EXISTS test_table');
    db.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)');
    db.transaction(function(tx) {
      return tx.executeSql("INSERT INTO test_table (data, data_num) VALUES (?,?)", ["test", 100], function(tx, res) {
        console.log("insertId: " + res.insertId + " -- probably 1");
        console.log("rowsAffected: " + res.rowsAffected + " -- should be 1");
        return db.executeSql("select count(id) as cnt from test_table;", [], function(res) {
          console.log("rows.length: " + res.rows.length + " -- should be 1");
          return console.log("rows[0].cnt: " + res.rows[0].cnt + " -- should be 1");
        });
      }, function(e) {
        return console.log("ERROR: " + e.message);
      });
    });

## Changes in tx.executeSql() success callback

        var db;
        db = new PGSQLitePlugin("my_sqlite_database.sqlite3");
        db.executeSql('DROP TABLE IF EXISTS test_table');
        db.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)');
        db.executeSql("INSERT INTO test_table (data, data_num) VALUES (?,?)", ["test", 100], function(res) {
                      console.log("insertId: " + res.insertId + " -- probably 1");
                      console.log("rowsAffected: " + res.rowsAffected + " -- should be 1");
                      db.transaction(function(tx) {
                                     return tx.executeSql("select count(id) as cnt from test_table;", [], function(tx, res) {
                                                          console.log("rows.length: " + res.rows.length + " -- should be 1");
                                                          return console.log("rows[0].cnt: " + res.rows.item(0).cnt + " -- should be 1");
                                                          });
                                     });
                      });


Lawnchair Adapter Usage
=======================

Common adapter
--------------

Please look at the `Lawnchair-adapter` tree that contains a common adapter, working for both Android and iOS, along with a test-www directory.


Legacy: iOS/iPhone only
-----------------------

Include the following js files in your html:

-  lawnchair.js (you provide)
-  SQLitePlugin.js [pgsqlite_plugin.js in Legacy-PhoneGap-iPhone]
-  Lawnchair-sqlitePlugin.js (must come after SQLitePlugin.js)


The `name` option will determine the sqlite filename. Optionally, you can change it using the `db` option.

In this example, you would be using/creating the database at: *Documents/kvstore.sqlite3* (all db's in SQLitePlugin are in the Documents folder)

    kvstore = new Lawnchair { name: "kvstore", adapter: SQLitePlugin.lawnchair_adapter }, () ->
      # do stuff

Using the `db` option you can create multiple stores in one sqlite file. (There will be one table per store.)

    recipes = new Lawnchair {db: "cookbook", name: "recipes", ...}
	ingredients = new Lawnchair {db: "cookbook", name: "ingredients", ...}


Legacy iOS Lawnchair test
-------------------------

*For cleanup this is to be removed*: In the lawnchair-test subdirectory of `iOS` you can copy the contents of the www subdirectory into a Cordova/PhoneGap project and see the behavior of the Lawnchair test suite.

Extra notes
-----------

### Other notes from @Joenoon - iOS batching:

I played with the idea of batching responses into larger sets of
writeJavascript on a timer, however there was only a barely noticeable
performance gain.  So I took it out, not worth it.  However there is a
massive performance gain by batching on the client-side to minimize
PhoneGap.exec calls using the transaction support.
