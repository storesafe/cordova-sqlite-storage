PhoneGap/Cordova SQLitePlugin
=============================

Native interface to sqlite in a PhoneGap/Cordova plugin, working to follow the HTML5 Web SQL API as close as possible. **NOTE** that the API is now different from https://github.com/davibe/Phonegap-SQLitePlugin.

Created by @joenoon and @davibe

Android version by @marcucio and @brodyspark, nested transaction callback support by @marcucio

iOS nested transaction callback support by @ef4 (Edward Faulkner)

API changes by @brodyspark (Chris Brody)

## Announcements

 - The iOS and Android versions will be split into separate repositories.
 - New [blog posting](http://mobileapphelp.blogspot.com/2012/10/cordova-sqliteplugin-continues-to-show.html) that this Cordova/PhoneGap SQLitePlugin continues to show excellent reliability, compared to the problems described in [CB-1561](https://issues.apache.org/jira/browse/CB-1561) and in [this thread](https://groups.google.com/forum/?fromgroups=#!topic/phonegap/eJTVra33HLo) and also [this thread](https://groups.google.com/forum/?fromgroups=#!topic/phonegap/Q_jEOSIAxsY)
 - Working for Cordova 2.1 iOS and Android
 - iOS version working with nested transactions, thanks to Edward Faulkner (@ef4)
 - [iOS version working with the SQLCipher encryption library](http://mobileapphelp.blogspot.com/2012/08/trying-sqlcipher-with-cordova-ios.html)
 - [Android version with rebuilding SQLCipher from source](http://mobileapphelp.blogspot.com/2012/08/rebuilding-sqlitesqlcipher-for-android.html)

## Project Status

This fork will be kept open to concentrate on bug fixing and documentation improvements. Bug fixes in the form of pull requests that are well tested, with unit testing if at all possible, and in decent coding style will be highly appreciated.

## Project future

See [issue #33](https://github.com/brodyspark/PhoneGap-sqlitePlugin-iOS/issues/33): to provide the maximum benefits of customization it should be possible to build with a replacement of the sqlite C library itself, and also make extensions such as SQLCipher possible ([#32](https://github.com/brodyspark/PhoneGap-sqlitePlugin-iOS/issues/32)). This enhancement would solve [#22](https://github.com/brodyspark/PhoneGap-sqlitePlugin-iOS/issues/22) for all versions of the Android API. @brodyspark expects to concentrate on the Android version using the NDK.

## Highlights

 - Keeps sqlite database in a known user data location that will be backed up by iCloud on iOS
 - Drop-in replacement for HTML5 SQL API, the only change is window.openDatabase() --> sqlitePlugin.openDatabase()
 - Both Android and iOS versions are designed with batch processing optimizations

## Apps using PhoneGap/Cordova sqlitePlugin

 - [Get It Done app](http://getitdoneapp.com/) by [marcucio.com](http://marcucio.com/) (iOS and Android)
 - [Larkwire](http://www.larkwire.com/): Learn bird songs the fun way (iOS, Android version is coming)

I would like to gather some more real-world examples, please send to chris.brody@gmail.com and I will post them.

## Known limitations

 - Versioning functionality is missing ([#35](https://github.com/brodyspark/PhoneGap-sqlitePlugin-iOS/issues/35))
 - API will block app execution upon large batching (workaround: add application logic to break large batches into smaller batch transactions)
 - `rowsAffected` field in the response to UPDATE and DELETE is not working for the Android version ([#22](https://github.com/brodyspark/PhoneGap-sqlitePlugin-iOS/issues/22))

## Other forks

 - iOS enhancements, with extra fixes for console log messages: https://github.com/mineshaftgap/Cordova-SQLitePlugin
 - iOS nested transactions enhancement from: https://github.com/ef4/Cordova-SQLitePlugin
 - Original version with old API: https://github.com/davibe/Phonegap-SQLitePlugin

Usage
=====

The idea is to emulate the HTML5 SQL API as closely as possible. The only major change is to use window.sqlitePlugin.openDatabase() (or sqlitePlugin.openDatabase()) instead of window.openDatabase(). If you see any other major change please report it, it is probably a bug.

Sample
------

This is a pretty strong test: first we create a table and add a single entry, then query the count to check if the item was inserted as expected. Note that a new transaction is created in the middle of the first callback.

    // Wait for Cordova to load
    //
    document.addEventListener("deviceready", onDeviceReady, false);

    // Cordova is ready
    //
    function onDeviceReady() {
      var db = window.sqlitePlugin.openDatabase("Database", "1.0", "PhoneGap Demo", 200000);

      db.transaction(function(tx) {
        tx.executeSql('DROP TABLE IF EXISTS test_table');
        tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)');

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
    //
    document.addEventListener("deviceready", onDeviceReady, false);

    // Cordova is ready
    //
    function onDeviceReady() {
      var db = window.sqlitePlugin.openDatabase("Database", "1.0", "PhoneGap Demo", 200000);

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

Installing
==========

**NOTE:** There are now the following trees:

 - `iOS` for Cordova 2.1 iOS
 - `Android`: new version by @marcucio, with improvements for batch transaction processing, testing seems OK
 - `Lawnchair-adapter`: Lawnchair adaptor for both iOS and Android, based on the version from the Lawnchair repository, with the basic Lawnchair test suite in `test-www` subdirectory
 - `test-www`: simple testing in `index.html` using qunit 1.5.0
 - `xtra-DroidGap-test`: old DroidGap version, no improvements for batch processing, simple version to test some fixes before adding to `Android` version

## iOS

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

### Cordova post-2.0

For Cordova post-2.0 iOS, please make the following patch to iOS/Plugins/SQLitePlugin.m due to [Apache Cordova CB-1000](https://issues.apache.org/jira/browse/CB-1000):

    diff --git a/iOS/Plugins/SQLitePlugin.m b/iOS/Plugins/SQLitePlugin.m
    index 444a78b..6ab2ec4 100644
    --- a/iOS/Plugins/SQLitePlugin.m
    +++ b/iOS/Plugins/SQLitePlugin.m
    @@ -225,7 +225,7 @@
             if (hasInsertId) {
                 [resultSet setObject:insertId forKey:@"insertId"];
             }
    -        [self respond:callback withString:[resultSet JSONString] withType:@"success"];
    +        [self respond:callback withString:[resultSet cdvjk_JSONString] withType:@"success"];
         }
     }

## Android

These installation instructions are based on the Android example project from PhoneGap/Cordova 2.0.0. For your first time please unzip the PhoneGap 2.0 zipball and use the `lib/android/example` subdirectory.

 - Install Android/assets/www/SQLitePlugin.js from this repository into assets/www subdirectory
 - Install Android/src/com/phonegap/plugin/sqlitePlugin/SQLitePlugin.java from this repository into src/com/phonegap/plugin/sqlitePlugin subdirectory
 - Add the plugin element <plugin name="SQLitePlugin" value="com.phonegap.plugin.sqlitePlugin.SQLitePlugin"/> to res/xml/config.xml for Cordova 2.0+ (res/xml/plugins.xml for Cordova pre-2.0)

Sample change to res/xml/config.xml:

    --- config.xml.old	2012-07-24 19:44:49.000000000 +0200
    +++ res/xml/config.xml	2012-07-24 19:39:43.000000000 +0200
    @@ -32,6 +32,7 @@
         <log level="DEBUG"/>
         <preference name="useBrowserHistory" value="false" />
     <plugins>
    +    <plugin name="SQLitePlugin" value="com.phonegap.plugin.sqlitePlugin.SQLitePlugin"/>
         <plugin name="App" value="org.apache.cordova.App"/>
         <plugin name="Geolocation" value="org.apache.cordova.GeoBroker"/>
         <plugin name="Device" value="org.apache.cordova.Device"/>

Before building for the first time, you have to update the project with the desired version of the Android SDK with a command like:

    android update project --path $(pwd) --target 15

(assume SDK 15, use the correct desired Android SDK number here)

### Quick test

Make a change like this to index.html to run a small test program to verify the installation is OK:

    --- index.html.old	2012-08-04 14:40:07.000000000 +0200
    +++ assets/www/index.html	2012-08-04 14:36:05.000000000 +0200
    @@ -24,7 +24,35 @@
         <title>PhoneGap</title>
           <link rel="stylesheet" href="master.css" type="text/css" media="screen" title="no title">
           <script type="text/javascript" charset="utf-8" src="cordova-2.0.0.js"></script>
    -      <script type="text/javascript" charset="utf-8" src="main.js"></script>
    +      <script type="text/javascript" charset="utf-8" src="SQLitePlugin.js"></script>
    +
    +
    +      <script type="text/javascript" charset="utf-8">
    +      document.addEventListener("deviceready", onDeviceReady, false);
    +      function onDeviceReady() {
    +        var db = window.sqlitePlugin.openDatabase("Database", "1.0", "PhoneGap Demo", 200000);
    +
    +        db.transaction(function(tx) {
    +          tx.executeSql('DROP TABLE IF EXISTS test_table');
    +          tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)');
    +
    +          tx.executeSql("INSERT INTO test_table (data, data_num) VALUES (?,?)", ["test", 100], function(tx, res) {
    +          console.log("insertId: " + res.insertId + " -- probably 1"); // check #18/#38 is fixed
    +          alert("insertId: " + res.insertId + " -- should be valid");
    +
    +            db.transaction(function(tx) {
    +              tx.executeSql("SELECT data_num from test_table;", [], function(tx, res) {
    +                console.log("res.rows.length: " + res.rows.length + " -- should be 1");
    +                alert("res.rows.item(0).data_num: " + res.rows.item(0).data_num + " -- should be 100");
    +              });
    +            });
    +
    +          }, function(e) {
    +            console.log("ERROR: " + e.message);
    +          });
    +        });
    +      }
    +      </script>
     
       </head>
       <body onload="init();" id="stage" class="theme">

# Unit test(s)

For issue #4, unit testing is done in `test-www/index.html`. To run the test(s) yourself please copy `test-www/index.html` along with the `test-www/lib` subdirectory into the `www` directory of your iOS or Android Cordova project and make sure you have SQLitePlugin completely installed (JS, Objective-C or Java, and plugin registered).

In case problems I hope the unit tests can help us to reproduce, demonstrate, and verify the solution of these problems.

# Loading pre-populated database file

From [#10](https://github.com/brodyspark/PhoneGap-sqlitePlugin-iOS/issues/10): [excellent directions for the Android version](http://www.raymondcamden.com/index.cfm/2012/7/27/Guest-Blog-Post-Shipping-a-populated-SQLite-DB-with-PhoneGap) have been posted recently, directions needed for iOS version. [General directions for Cordova/PhoneGap](http://gauravstomar.blogspot.com/2011/08/prepopulate-sqlite-in-phonegap.html) had been posted but seems out-of-date and does not specifically apply for this plugin.

Extra Usage
===========

## iOS

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

Please look at the `Lawnchair-adapter` tree that contains a common adapter, working for both Android and iOS, along with a test-www directory.


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

    kvstore = new Lawnchair { name: "kvstore", adapter: SQLitePlugin.lawnchair_adapter }, () ->
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

