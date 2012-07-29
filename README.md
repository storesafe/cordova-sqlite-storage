Cordova/PhoneGap SQLitePlugin
=============================

Native interface to sqlite in a Cordova/PhoneGap plugin, working to follow the HTML5 Web SQL API as close as possible. **NOTE** that the API is now different from https://github.com/davibe/Phonegap-SQLitePlugin.

Created by @joenoon and @davibe

Adapted to Cordova 1.5+ by @coomsie, Cordova 1.6 bugfix by @mineshaftgap

Android version by @marcucio and @chbrody

API changes by @chbrody

## Project Status

This fork will be kept open to concentrate on bug fixing and documentation improvements. Bug fixes in the form of pull requests that are well tested, with unit testing if at all possible, and in decent coding style will be highly appreciated. Due to professional commitments @chbrody cannot guarantee any level of support at this time.

## Project future

See [issue #33](https://github.com/chbrody/Cordova-SQLitePlugin/issues/33): to provide the maximum benefits of customization it should be possible to build with a replacement of the sqlite C library itself, and also make extensions such as SQLCipher possible ([#32](https://github.com/chbrody/Cordova-SQLitePlugin/issues/32)). This enhancement would solve [#22](https://github.com/chbrody/Cordova-SQLitePlugin/issues/22) for all versions of the Android API. @chbrody expects to concentrate on the Android version using the NDK.

## Highlights

 - Keeps sqlite database in a known user data location that will be backed up by iCloud on iOS
 - Drop-in replacement for HTML5 SQL API, the only change is window.openDatabase() --> sqlitePlugin.openDatabase()
 - Both Android and iOS versions are designed with batch processing optimizations
 - Future: API to configure the desired database location

## Known limitations

 - Versioning functionality is missing ([#35](https://github.com/chbrody/Cordova-SQLitePlugin/issues/35))
 - API will block app execution upon large batching (workaround: add application logic to break large batches into smaller batch transactions)

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

**Android version only:** In this case, the same transaction in the first executeSql() callback is being reused to run executeSql() again. This version will only work on the Android version and only if you make the following patch:

    diff --git a/Android/assets/www/SQLitePlugin.js b/Android/assets/www/SQLitePlugin.js
    index 51761ea..10b7595 100755
    --- a/Android/assets/www/SQLitePlugin.js
    +++ b/Android/assets/www/SQLitePlugin.js
    @@ -59,7 +59,7 @@
         this.trans_id = get_unique_id();
         this.__completed = false;
         this.__submitted = false;
    -    this.optimization_no_nested_callbacks = true;
    +    this.optimization_no_nested_callbacks = false;
         console.log("SQLitePluginTransaction - this.trans_id:" + this.trans_id);
         transaction_queue[this.trans_id] = [];
         transaction_callback_queue[this.trans_id] = new Object();

This case is (currently) not supported by the iOS version

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

 - `iOS` for Cordova 1.8 iOS (@chbrody TBD test for Cordova 2.0.0)
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

### Quick test

Make a change like this to index.html to run a small test program to verify the installation is OK:

    --- index.html.old	2012-07-23 22:05:21.000000000 +0200
    +++ assets/www/index.html	2012-07-23 22:43:42.000000000 +0200
    @@ -24,7 +24,32 @@
         <title>PhoneGap</title>
           <link rel="stylesheet" href="master.css" type="text/css" media="screen" title="no title">
           <script type="text/javascript" charset="utf-8" src="cordova-2.0.0.js"></script>
    -      <script type="text/javascript" charset="utf-8" src="main.js"></script>
    +      <script type="text/javascript" charset="utf-8" src="SQLitePlugin.js"></script>
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
    +
    +          db.transaction(function(tx) {
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

