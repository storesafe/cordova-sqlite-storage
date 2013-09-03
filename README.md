# Cordova/PhoneGap SQLitePlugin - iOS version

Native interface to sqlite in a Cordova/PhoneGap plugin, working to follow the HTML5 Web SQL API as close as possible. **NOTE** that the API is now different from [davibe / Phonegap-SQLitePlugin](https://github.com/davibe/Phonegap-SQLitePlugin).

Created by @joenoon and @davibe

API changes by @brodybits (Chris Brody)

iOS nested transaction callback support by @ef4 (Edward Faulkner)

Cordova 2.7+ port with background processing by @j3k0 (Jean-Christophe Hoelt)

License for this version: MIT

## Announcements

- This version is now working with the Cordova 3.0 tool.
- This version can now be built with either ARC or MRC.
- Significant rewrite by [@j3k0 (Jean-Christophe Hoelt)](https://github.com/j3k0) to support `plugman` & background processing.
- Forum & community support at: http://groups.google.com/group/pgsqlite

## Highlights

As described in [a recent posting](http://brodyspark.blogspot.com/2012/12/cordovaphonegap-sqlite-plugins-offer.html):
- Keeps sqlite database in a known user data location that will be backed up by iCloud on iOS. This Cordova/PhoneGap SQLitePlugin continues to show excellent reliability, compared to the problems described in [CB-1561](https://issues.apache.org/jira/browse/CB-1561), in [this thread](https://groups.google.com/forum/?fromgroups=#!topic/phonegap/eJTVra33HLo), and also [this thread](https://groups.google.com/forum/?fromgroups=#!topic/phonegap/Q_jEOSIAxsY)
- No 5MB maximum, more information at: http://www.sqlite.org/limits.html

Some other highlights:
- Drop-in replacement for HTML5 SQL API: the only change is window.openDatabase() --> sqlitePlugin.openDatabase()
- Fail-safe nested transactions with batch processing optimizations
- [integration with SQLCipher for iOS](http://brodyspark.blogspot.com/2012/12/integrating-sqlcipher-with.html)

## Apps using Cordova/PhoneGap SQLitePlugin

- [Get It Done app](http://getitdoneapp.com/) by [marcucio.com](http://marcucio.com/)
- [Larkwire](http://www.larkwire.com/): Learn bird songs the fun way

## Known limitations

- The db version, display name, and size parameter values are not supported and will be ignored.
- The sqlite plugin will not work before the callback for the "deviceready" event has been fired, as described in **Usage**.
- There is a memory leak if you use this version with background processing disabled. This issue will be solved once the Cordova 3.0 integration is finished with the Android & Windows Phone 8 versions. As a workaround, this version has background processing enabled by default.

## Other versions

- Android version: [pgsqlite / PG-SQLitePlugin-Android](https://github.com/pgsqlite/PG-SQLitePlugin-Android).
- Windows Phone 8+ version: https://github.com/marcucio/Cordova-WP-SqlitePlugin
- iOS enhancements, with extra fixes for console log messages: https://github.com/mineshaftgap/Cordova-SQLitePlugin
- Original iOS version with a different API: https://github.com/davibe/Phonegap-SQLitePlugin

# Usage

The idea is to emulate the HTML5 SQL API as closely as possible. The only major change is to use window.sqlitePlugin.openDatabase() (or sqlitePlugin.openDatabase()) instead of window.openDatabase(). If you see any other major change please report it, it is probably a bug.

## Opening a database

There are two options to open a database:
- Recommended: `var db = window.sqlitePlugin.openDatabase({name: "DB"});`
- Classical: `var db = window.sqlitePlugin.openDatabase("Database", "1.0", "Demo", -1);`

**IMPORTANT:** Please wait for the "deviceready" event, as in the following example:

    // Wait for Cordova to load
    document.addEventListener("deviceready", onDeviceReady, false);

    // Cordova is ready
    function onDeviceReady() {
      var db = window.sqlitePlugin.openDatabase({name: "DB"});
      // ...
    }

**NOTE:** The database file is created with `.db` extension.

## Background processing

To enable background processing on a permanent basis, open a database like:

    var db = window.sqlitePlugin.openDatabase({name: "DB", bgType: 1});

**NOTE:** Currently, this version has background processing enabled by default as a workaround for a memory leak described under **Known limitations**. To disable background processing, open a database like:

    var db = window.sqlitePlugin.openDatabase({name: "DB", bgType: 0});

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
            db.executeSql("pragma table_info (test_table);", [], function(res) {
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

**NOTE:** This plugin is now prepared to be installed using either the `plugman` or `cordova` tool.

## Source tree

 - `www`: `SQLitePlugin.js` (currently platform-specific)
 - `src/ios`: Objective-C plugin code (platform-specific)
 - `test-www`: simple testing in `index.html` using qunit 1.5.0
 - `Lawnchair-adapter`: Lawnchair adaptor for both iOS and Android, based on the version from the Lawnchair repository, with the basic Lawnchair test suite in `test-www` subdirectory

## Manual installation

### SQLite library

In the Project "Build Phases" tab, select the _first_ "Link Binary with Libraries" dropdown menu and add the library `libsqlite3.dylib` or `libsqlite3.0.dylib`.

**NOTE:** In the "Build Phases" there can be multiple "Link Binary with Libraries" dropdown menus. Please select the first one otherwise it will not work.

### SQLite Plugin

Drag .h and .m files into your project's Plugins folder (in xcode) -- I always
just have "Create references" as the option selected.

Take the precompiled javascript file from build/, or compile the coffeescript
file in src/ to javascript WITH the top-level function wrapper option (default).

Use the resulting javascript file in your HTML.

Enable the SQLitePlugin in `config.xml`:

    --- config.xml.old	2013-05-17 13:18:39.000000000 +0200
    +++ config.xml	2013-05-17 13:18:49.000000000 +0200
    @@ -39,6 +39,7 @@
         <content src="index.html" />
     
         <plugins>
    +        <plugin name="SQLitePlugin" value="SQLitePlugin" />
             <plugin name="Device" value="CDVDevice" />
             <plugin name="Logger" value="CDVLogger" />
             <plugin name="Compass" value="CDVLocation" />

# Common traps & pitfalls

- The plugin class name starts with "SQL" in capital letters, but in Javascript the `sqlitePlugin` object name starts with "sql" in small letters.
- Attempting to open a database before receiving the "deviceready" event callback.

# Support

Community support is available via the new Google group: http://groups.google.com/group/pgsqlite

If you have an issue with the plugin please check the following first:
- You are using the latest version of the Plugin Javascript & Objective-C source from this repository.
- You have installed the Javascript & Objective-C correctly.
- You have included the correct version of the cordova Javascript and SQLitePlugin.js and got the path right.
- You have registered the plugin properly in `config.xml`.

If you still cannot get something to work:
- Make the simplest test program necessary to reproduce the issue and try again.
- If it still does not work then please make sure it is prepared to demonstrate the issue including:
  - it completely self-contained, i.e. it is using no extra libraries beyond cordova & SQLitePlugin.js;
  - if the issue is with *adding* data to a table, that the test program includes the statements you used to open the database and create the table;
  - if the issue is with *retrieving* data from a table, that the test program includes the statements you used to open the database, create the table, and enter the data you are trying to retrieve.

Then please post the issue to the [pgsqlite forum](http://groups.google.com/group/pgsqlite).

# Unit test(s)

Unit testing is done in `test-www/index.html`. To run the test(s) yourself please copy the files from `test-www` (`index.html`, `qunit-1.5.0.js`, & `qunit-1.5.0.css`) into the `www` directory of your iOS Cordova project and make sure you have SQLitePlugin completely installed (JS, Objective-C, and plugin registered).

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

# Contributing

- Testimonials of apps that are using this plugin would be especially helpful.
- Reporting issues to the [pgsqlite forum](http://groups.google.com/group/pgsqlite) can help improve the quality of this plugin.
- Patches with bug fixes are helpful, especially when submitted with test code.
- Other enhancements will be considered if they do not increase the complexity of this plugin.
- All contributions may be reused by [@brodybits (Chris Brody)](https://github.com/brodybits) under another license in the future. Efforts will be taken to give credit for major contributions but it will not be guaranteed.

