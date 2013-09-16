# Cordova/PhoneGap sqlite plugin - Android version

Native interface to sqlite in a Cordova/PhoneGap plugin, working to follow the HTML5 Web SQL API as close as possible.

Extracted from DroidGap by @brodybits (Chris Brody)

Transaction batch processing by @marcucio

Fail-safe nested transaction support by @ef4 (Edward Faulkner)

License for this version: MIT or Apache

## Status

- This version working with Cordova 3.0 tooling
- New feature development is on hold until the version for Windows Phone 8 is working with Cordova 3.0+ tooling

## Announcements

- This version has been updated to support background processing as an option.
- Forum & community support at: http://groups.google.com/group/pgsqlite
 
## Highlights

- Keeps sqlite database in a user data location that is known and can be reconfigured
- Drop-in replacement for HTML5 SQL API, the only change is window.openDatabase() --> sqlitePlugin.openDatabase()
- Fail-safe nested transactions with batch processing optimizations
- No 5MB maximum, more information at: http://www.sqlite.org/limits.html
- Using [SQLCipher for Android](http://sqlcipher.net/sqlcipher-for-android/) for encryption: [blog posting](http://brodyspark.blogspot.com/2012/12/using-sqlcipher-for-android-with.html) & [enhancements to SQLCipher db classes for Android](http://brodyspark.blogspot.com/2012/12/enhancements-to-sqlcipher-db-classes.html)

## Apps using Cordova/PhoneGap sqlite plugin (Android version)

- [Get It Done app](http://getitdoneapp.com/) by [marcucio.com](http://marcucio.com/)

## Known limitations

- The db version, display name, and size parameter values are not supported and will be ignored.
- The sqlite plugin will not work before the callback for the "deviceready" event has been fired, as described in **Usage**.
- For Android below SDK 11:
 - the data that is stored is of type 'TEXT' regardless of the schema
 - `rowsAffected` is not returned for INSERT or DELETE statement
- For this version, there is an issue with background processing that affects transaction error handling and may affect nested transactions.

## Other versions

- iOS version: [pgsqlite / PG-SQLitePlugin-iOS](https://github.com/pgsqlite/PG-SQLitePlugin-iOS)
- Windows Phone 8+ version: https://github.com/marcucio/Cordova-WP-SqlitePlugin

# Usage

The idea is to emulate the HTML5 SQL API as closely as possible. The only major change is to use window.sqlitePlugin.openDatabase() (or sqlitePlugin.openDatabase()) instead of window.openDatabase(). If you see any other major change and it is not reported under **known limitations** please report it, it is probably a bug.

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

To enable background processing open a database like:

    var db = window.sqlitePlugin.openDatabase({name: "DB", bgType: 1});

**NOTE:** As described in **[Known limitations](#known-limitations)** there is an issue in this version with background processing that affects transaction error handling and may affect nested transactions.

## Sample with PRAGMA feature

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
              alert("insertId: " + res.insertId + " -- probably 1");

              db.transaction(function(tx) {
                tx.executeSql("select count(id) as cnt from test_table;", [], function(tx, res) {
                  console.log("res.rows.length: " + res.rows.length + " -- should be 1");
                  console.log("res.rows.item(0).cnt: " + res.rows.item(0).cnt + " -- should be 1");
                  alert("res.rows.item(0).cnt: " + res.rows.item(0).cnt + " -- should be 1");
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

This case will also works with WebKit, assuming you replace window.sqlitePlugin.openDatabase with window.openDatabase.

# Installation

**NOTE:** This plugin is now prepared to be installed using either the `plugman` or `cordova` tool.

## Source tree

- `cs`: Coffeescript version
- `www`: Javascript
- `src`: Android Java code
- `test-www`: simple testing in `index.html` using qunit 1.5.0

## Manual installation

These installation instructions are based on the Android example project from Cordova/PhoneGap 2.7.0. For your first time please unzip the PhoneGap 2.7 zipball and use the `lib/android/example` subdirectory.

 - Install www/SQLitePlugin.js from this repository into assets/www subdirectory
 - Install src/android/org/pgsqlite/SQLitePlugin.java from this repository into src/org/pgsqlite subdirectory
 - Add the plugin element `<plugin name="SQLitePlugin" value="org.pgsqlite.SQLitePlugin"/>` to res/xml/config.xml

Sample change to res/xml/config.xml:

    --- config.xml.orig	2013-07-23 13:48:09.000000000 +0200
    +++ res/xml/config.xml	2013-07-23 13:48:26.000000000 +0200
    @@ -36,6 +36,7 @@
         <preference name="useBrowserHistory" value="true" />
         <preference name="exit-on-suspend" value="false" />
     <plugins>
    +    <plugin name="SQLitePlugin" value="org.pgsqlite.SQLitePlugin"/>
         <plugin name="App" value="org.apache.cordova.App"/>
         <plugin name="Geolocation" value="org.apache.cordova.GeoBroker"/>
         <plugin name="Device" value="org.apache.cordova.Device"/>

Before building for the first time, you have to update the project with the desired version of the Android SDK with a command like:

    android update project --path $(pwd) --target android-17

(assume Android SDK 17, use the correct desired Android SDK number here)

**NOTE:** to use this plugin on Cordova pre-3.0 you may have to make the following change to SQLitePlugin.java:

    --- src/android/org/pgsqlite/SQLitePlugin.java	2013-09-10 21:36:20.000000000 +0200
    +++ SQLitePlugin.java.old	2013-09-10 21:35:14.000000000 +0200
    @@ -17,8 +17,8 @@
     
     import java.util.HashMap;
     
    -import org.apache.cordova.CordovaPlugin;
    -import org.apache.cordova.CallbackContext;
    +import org.apache.cordova.api.CordovaPlugin;
    +import org.apache.cordova.api.CallbackContext;
     
     import android.database.Cursor;

### Quick test

Make a change like this to index.html (or use the sample code) verify proper installation:

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
    +        var db = window.sqlitePlugin.openDatabase("Database", "1.0", "Demo", -1);
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

# Common traps & pitfalls

- The plugin class name starts with "SQL" in capital letters, but in Javascript the `sqlitePlugin` object name starts with "sql" in small letters.
- Attempting to open a database before receiving the "deviceready" event callback.

# Support

Community support is available via the new Google group: http://groups.google.com/group/pgsqlite

If you have an issue with the plugin please check the following first:
- You are using the latest version of the Plugin Javascript & Java source from this repository.
- You have installed the Javascript & Java correctly.
- You have included the correct version of the cordova Javascript and SQLitePlugin.js and got the path right.
- You have registered the plugin properly.

If you still cannot get something to work:
- Make the simplest test program necessary to reproduce the issue and try again.
- If it still does not work then please make sure it is prepared to demonstrate the issue including:
  - it completely self-contained, i.e. it is using no extra libraries beyond cordova & SQLitePlugin.js;
  - if the issue is with *adding* data to a table, that the test program includes the statements you used to open the database and create the table;
  - if the issue is with *retrieving* data from a table, that the test program includes the statements you used to open the database, create the table, and enter the data you are trying to retrieve.

Then please post the issue with your test program to the [pgsqlite forum](http://groups.google.com/group/pgsqlite).

## Support priorities

**High priority:**

1. Stability is first: immediate resolution or workaround for stability issues (crashing) is the goal.
2. Correctness: any issue with correctness should result in a new testcase together with the bug fix.

**Low priority:** issues with the API or application integration will be given lower priority until the Cordova 3.0 integration is finished for this version & Windows Phone 8. Pull requests are very welcome for these kinds of issues.

# Unit test(s)

Unit testing is done in `test-www/index.html`. To run the test(s) yourself please copy the files from `test-www` (`index.html`, `qunit-1.5.0.js`, & `qunit-1.5.0.css`) into the `www` directory of your Android Cordova project and make sure you have SQLitePlugin completely installed (JS, Java, and plugin registered).

# Loading pre-populated database file

[Excellent directions for the Android version](http://www.raymondcamden.com/index.cfm/2012/7/27/Guest-Blog-Post-Shipping-a-populated-SQLite-DB-with-PhoneGap) have been posted recently, directions needed for iOS version. [General directions for Cordova/PhoneGap](http://gauravstomar.blogspot.com/2011/08/prepopulate-sqlite-in-phonegap.html) had been posted but seems out-of-date and does not specifically apply for this plugin.

# Contributing

- Testimonials of apps that are using this plugin would be especially helpful.
- Reporting issues to the [pgsqlite forum](http://groups.google.com/group/pgsqlite) can help improve the quality of this plugin.
- Patches with bug fixes are helpful, especially when submitted with test code.
- Other enhancements are very welcome, especially with test code. Increase of complexity should be avoided.
- All contributions may be reused by [@brodybits (Chris Brody)](https://github.com/brodybits) under another license in the future. Efforts will be taken to give credit for major contributions but it will not be guaranteed.

