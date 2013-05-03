# Cordova/PhoneGap SQLitePlugin - iOS version

Native interface to sqlite in a Cordova/PhoneGap plugin, working to follow the HTML5 Web SQL API as close as possible. **NOTE** that the API is now different from [davibe / Phonegap-SQLitePlugin](https://github.com/davibe/Phonegap-SQLitePlugin).

Created by @joenoon and @davibe

API changes by @brodyspark (Chris Brody)

iOS nested transaction callback support by @ef4 (Edward Faulkner)

Cordova 2.7+ port by @j3k0 (Jean-Christophe Hoelt)

License for this version: MIT

## Announcements

- [New posting about integration with SQLCipher for iOS](http://brodyspark.blogspot.com/2012/12/integrating-sqlcipher-with.html)
- New, optional interface to open a database like: `var db = window.sqlitePlugin.openDatabase({name: "DB"});`
- [PRAGMA support added](http://brodyspark.blogspot.com/2012/12/improvements-to-phonegap-sqliteplugin.html).
- The Android version is now split off to [brodyspark / PhoneGap-SQLitePlugin-Android](https://github.com/brodyspark/PhoneGap-SQLitePlugin-Android).

## Project Status

This fork will be kept open to concentrate on bug fixing and documentation improvements. Bug fixes in the form of pull requests that are well tested, with unit testing if at all possible, and in decent coding style will be highly appreciated.

## Highlights

As described in [a recent posting](http://brodyspark.blogspot.com/2012/12/cordovaphonegap-sqlite-plugins-offer.html):
- Keeps sqlite database in a known user data location that will be backed up by iCloud on iOS. This Cordova/PhoneGap SQLitePlugin continues to show excellent reliability, compared to the problems described in [CB-1561](https://issues.apache.org/jira/browse/CB-1561), in [this thread](https://groups.google.com/forum/?fromgroups=#!topic/phonegap/eJTVra33HLo), and also [this thread](https://groups.google.com/forum/?fromgroups=#!topic/phonegap/Q_jEOSIAxsY)
- No 5MB maximum, more information at: http://www.sqlite.org/limits.html

Some other highlights:
- Drop-in replacement for HTML5 SQL API: the only change is window.openDatabase() --> sqlitePlugin.openDatabase()
- batch processing optimizations
- [integration with SQLCipher for iOS](http://brodyspark.blogspot.com/2012/12/integrating-sqlcipher-with.html)

## Apps using Cordova/PhoneGap SQLitePlugin

- [Get It Done app](http://getitdoneapp.com/) by [marcucio.com](http://marcucio.com/)
- [Larkwire](http://www.larkwire.com/): Learn bird songs the fun way

I would like to gather some more real-world examples, please send to chris.brody@gmail.com and I will post them.

## Known limitations

- API will block app execution upon large batching (workaround: add application logic to break large batches into smaller batch transactions)
- The db version, display name, and size parameter values are not supported and will be ignored.
- The sqlite plugin will not work before the callback for the "deviceready" event has been fired, as described in **Usage**.

## Other versions

- Android version moved to: https://github.com/brodyspark/PhoneGap-SQLitePlugin-Android
- Windows Phone 8+ version: https://github.com/marcucio/Cordova-WP-SqlitePlugin
- iOS enhancements, with extra fixes for console log messages: https://github.com/mineshaftgap/Cordova-SQLitePlugin
- iOS nested transactions enhancement from: https://github.com/ef4/Cordova-SQLitePlugin
- Original iOS version with a different API: https://github.com/davibe/Phonegap-SQLitePlugin

Usage
=====

The idea is to emulate the HTML5 SQL API as closely as possible. The only major change is to use window.sqlitePlugin.openDatabase() (or sqlitePlugin.openDatabase()) instead of window.openDatabase(). If you see any other major change please report it, it is probably a bug.

## Opening a database

There are two options to open a database:
- Recommended: `var db = window.sqlitePlugin.openDatabase({name: "DB"});`
- Classical: `var db = window.sqlitePlugin.openDatabase("Database", "1.0", "Demo", -1);`

**NOTE:** Please wait for the "deviceready" event, as in the following example:

    // Wait for Cordova to load
    document.addEventListener("deviceready", onDeviceReady, false);

    // Cordova is ready
    function onDeviceReady() {
      var db = window.sqlitePlugin.openDatabase({name: "DB"});
      // ...
    }

# Sample with PRAGMA feature

This is a pretty strong test: first we create a table and add a single entry, then query the count to check if the item was inserted as expected. Note that a new transaction is created in the middle of the first callback.

        // Wait for Cordova to load
        document.addEventListener("deviceready", onDeviceReady, false);

        // Cordova is ready
        function onDeviceReady() {
          var db = window.sqlitePlugin.openDatabase({name: "DB"});

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)');

            // demonstrate PRAGMA:
            db.executePragmaStatement("pragma table_info (test_table);", function(res) {
              console.log("PRAGMA res: " + JSON.stringify(res));
            });

            tx.executeSql("INSERT INTO test_table (data, data_num) VALUES (?,?)", ["test", 100], function(tx, res) {
              console.log("insertId: " + res.insertId + " -- probably 1");
              console.log("rowsAffected: " + res.rowsAffected + " -- should be 1");

              db.transaction(function(tx) {
                tx.executeSql("select count(id) as cnt from test_table;", [], function(tx, res) {
                  console.log("res.rows.length: " + res.rows.length + " -- should be 1");
                  console.log("res.rows.item(0).cnt: " + res.rows.item(0).cnt + " -- should be 1");
                });
              });

            }, function(e) {
              console.log("ERROR: " + e.message);
            });
          });
        }

## Sample with transaction-level nesting

In this case, the same transaction in the first executeSql() callback is being reused to run executeSql() again.

        // Wait for Cordova to load
        document.addEventListener("deviceready", onDeviceReady, false);

        // Cordova is ready
        function onDeviceReady() {
          var db = window.sqlitePlugin.openDatabase("Database", "1.0", "Demo", -1);

          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)');

            tx.executeSql("INSERT INTO test_table (data, data_num) VALUES (?,?)", ["test", 100], function(tx, res) {
              console.log("insertId: " + res.insertId + " -- probably 1");
              console.log("rowsAffected: " + res.rowsAffected + " -- should be 1");

              tx.executeSql("select count(id) as cnt from test_table;", [], function(tx, res) {
                console.log("res.rows.length: " + res.rows.length + " -- should be 1");
                console.log("res.rows.item(0).cnt: " + res.rows.item(0).cnt + " -- should be 1");
              });

            }, function(e) {
              console.log("ERROR: " + e.message);
            });
          });
        }

This case will also works with Safari (WebKit), assuming you replace window.sqlitePlugin.openDatabase with window.openDatabase.

# Installing

**NOTE:** There are now the following trees:

 - `iOS`: platform-specific code
 - `Lawnchair-adapter`: Lawnchair adaptor for both iOS and Android, based on the version from the Lawnchair repository, with the basic Lawnchair test suite in `test-www` subdirectory
 - `test-www`: simple testing in `index.html` using qunit 1.5.0

## iOS platform

### SQLite library

In the Project "Build Phases" tab, select the _first_ "Link Binary with Libraries" dropdown menu and add the library `libsqlite3.dylib` or `libsqlite3.0.dylib`.

**NOTE:** In the "Build Phases" there can be multiple "Link Binary with Libraries" dropdown menus. Please select the first one otherwise it will not work.

### SQLite Plugin

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

### Dealing with ARC

A project generated by the create script from Cordova should already have the Automatic Reference Counting (ARC) option disabled. However, a project generated by the xcode GUI may have the ARC option enabled and this will cause a number of build problems with the SQLitePlugin.

To disable ARC for the module only (from @LouAlicegary): click on your app name at the top of the left-hand column in the Project Navigator, then click on the app name under "Targets," click on the "Build Phases" tab, and then double-click on the SQLitePlugin.m file under "Compile Sources" and add a "-fno-objc-arc" compiler flag to that entry 

### Cordova pre-2.1

For Cordova pre-2.1 iOS please make the following change to iOS/Plugins/SQLitePlugin.m:

    --- iOS/Plugins/SQLitePlugin.m	2012-10-10 14:22:05.000000000 +0200
    +++ iOS/Plugins/SQLitePlugin-old.m	2012-10-10 14:37:32.000000000 +0200
    @@ -237,7 +237,7 @@
             if (hasInsertId) {
                 [resultSet setObject:insertId forKey:@"insertId"];
             }
    -        [self respond:callback withString:[resultSet cdvjk_JSONString] withType:@"success"];
    +        [self respond:callback withString:[resultSet JSONString] withType:@"success"];
         }
     }

### Cordova pre-2.0

In addition, for Cordova pre-2.0 iOS, please make the following patch to iOS/Plugins/SQLitePlugin.h:

    --- iOS/Plugins/SQLitePlugin.h	2012-08-10 08:55:21.000000000 +0200
    +++ iOS/Plugins/SQLitePlugin.h.old	2012-08-10 08:55:08.000000000 +0200
    @@ -12,8 +12,13 @@
     #import <Foundation/Foundation.h>
     #import "sqlite3.h"
     
    +#ifdef CORDOVA_FRAMEWORK
     #import <CORDOVA/CDVPlugin.h>
     #import <CORDOVA/JSONKit.h>
    +#else
    +#import "CDVPlugin.h"
    +#import "JSONKit.h"
    +#endif
     
     #import "AppDelegate.h"

# Common traps & pitfalls

- The plugin class name starts with "SQL" in capital letters, but in Javascript the `sqlitePlugin` object name starts with "sql" in small letters.
- Attempting to open a database before receiving the "deviceready" event callback.

# Support

If you have an issue with the plugin please check the following first:
- You are using the latest version of the Plugin Javascript & Objective-C source from this repository.
- You have installed the Javascript & Objective-C correctly.
- You have included the correct version of the cordova Javascript and SQLitePlugin.js and got the path right.
- You have registered the plugin properly.

If you still cannot get something to work:
- Make the simplest test program necessary to reproduce the issue and try again.
- If it still does not work then please make sure it is prepared to demonstrate the issue including:
  - it completely self-contained, i.e. it is using no extra libraries beyond cordova & SQLitePlugin.js;
  - if the issue is with *adding* data to a table, that the test program includes the statements you used to open the database and create the table;
  - if the issue is with *retrieving* data from a table, that the test program includes the statements you used to open the database, create the table, and enter the data you are trying to retrieve.

Then please raise an issue with the test program included in the description.

# Unit test(s)

Unit testing is done in `test-www/index.html`. To run the test(s) yourself please copy the files from `test-www` (`index.html`, `qunit-1.5.0.js`, & `qunit-1.5.0.css`) into the `www` directory of your iOS Cordova project and make sure you have SQLitePlugin completely installed (JS, Objective-C, and plugin registered).

# Extra Usage for this version

**NOTE:** This is from an old sample, old API which is hereby deprecated **and going away**.

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

Lawnchair Adapter Usage
=======================

Common adapter
--------------

Please look at the `Lawnchair-adapter` tree that contains a common adapter, which should also work with the Android version, along with a test-www directory.


Included files
--------------

Include the following js files in your html:

-  lawnchair.js (you provide)
-  SQLitePlugin.js
-  Lawnchair-sqlitePlugin.js (must come after SQLitePlugin.js)

Sample
------

The `name` option will determine the sqlite filename. Optionally, you can change it using the `db` option.

In this example, you would be using/creating the database at: *Documents/kvstore.sqlite3* (all db's in SQLitePlugin are in the Documents folder)

    kvstore = new Lawnchair { name: "kvstore" }, () ->
      # do stuff

Using the `db` option you can create multiple stores in one sqlite file. (There will be one table per store.)

    recipes = new Lawnchair {db: "cookbook", name: "recipes", ...}
	ingredients = new Lawnchair {db: "cookbook", name: "ingredients", ...}

Extra notes
-----------

### Other notes from @Joenoon - iOS batching:

I played with the idea of batching responses into larger sets of
writeJavascript on a timer, however there was only a barely noticeable
performance gain.  So I took it out, not worth it.  However there is a
massive performance gain by batching on the client-side to minimize
PhoneGap.exec calls using the transaction support.


### Other notes from @davibe:

I used the plugin to store very large documents (1 or 2 Mb each) and found
that the main bottleneck was passing data from javascript to native code.
Running PhoneGap.exec took some seconds while completely blocking my
application.

# Contributing

- Testimonials of apps that are using this plugin would be especially helpful.
- Issue reports can help improve the quality of this plugin.
- Patches with bug fixes are helpful, especially when submitted with test code.
- Other enhancements will be considered if they do not increase the complexity of this plugin.
- All contributions may be reused by @brodyspark under another license in the future. Efforts
will be taken to give credit for major contributions but it will not be guaranteed.

