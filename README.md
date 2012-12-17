# Cordova/PhoneGap SQLitePlugin - Android version

Native interface to sqlite in a Cordova/PhoneGap plugin, working to follow the HTML5 Web SQL API as close as possible.

Extracted from DroidGap by @brodyspark (Chris Brody)

Nested transaction callback support by @marcucio

License for this version: MIT or Apache

## Announcements

 - [Improvements in the form of PRAGMAs & multiple database files (bug fix)](http://brodyspark.blogspot.com/2012/12/improvements-to-phonegap-sqliteplugin.html).
 - The Android version is now maintained in this location as [announced here](http://brodyspark.blogspot.com/2012/12/phonegap-sqliteplugin-for-ios-android.html).
 
## Highlights

 - Keeps sqlite database in a user data location that is known and can be reconfigured
 - Drop-in replacement for HTML5 SQL API, the only change is window.openDatabase() --> sqlitePlugin.openDatabase()
 - batch processing optimizations
 - No 5MB maximum, more information at: http://www.sqlite.org/limits.html

This SQLitePlugin can also be used with SQLCipher to provide encryption. This was already described on my old blog:
 - [Android version with rebuilding SQLCipher from source](http://mobileapphelp.blogspot.com/2012/08/rebuilding-sqlitesqlcipher-for-android.html)
 - [Android version tested with SQLCipher for database encryption](http://mobileapphelp.blogspot.com/2012/08/trying-sqlcipher-with-cordova.html), working with a few changes to SQLitePlugin.java
Updated instructions will be posted on my [new blog](http://brodyspark.blogspot.com/) sometime in the near future.

## Apps using Cordova/PhoneGap SQLitePlugin (Android version)

 - [Get It Done app](http://getitdoneapp.com/) by [marcucio.com](http://marcucio.com/)
 - Upcoming (under development): Arbiter disastery recovery app by [LMN Solutions](http://lmnsolutions.com/)

I would like to gather some more real-world examples, please send to chris.brody@gmail.com and I will post them.

## Known limitations

 - `rowsAffected` field in the response to UPDATE and DELETE is not working
 - The db version, display name, and size parameter values are not supported and ignored.

Usage
=====

The idea is to emulate the HTML5 SQL API as closely as possible. The only major change is to use window.sqlitePlugin.openDatabase() (or sqlitePlugin.openDatabase()) instead of window.openDatabase(). If you see any other major change please report it, it is probably a bug.

## Sample with PRAGMA feature

This is a pretty strong test: first we create a table and add a single entry, then query the count to check if the item was inserted as expected. Note that a new transaction is created in the middle of the first callback.

    // Wait for Cordova to load
    //
    document.addEventListener("deviceready", onDeviceReady, false);

    // Cordova is ready
    //
    function onDeviceReady() {
      var db = window.sqlitePlugin.openDatabase("Database", "1.0", "Demo", -1);

      db.transaction(function(tx) {
        tx.executeSql('DROP TABLE IF EXISTS test_table');
        tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)');

        // demonstrate PRAGMA:
        db.executePragmaStatement("pragma table_info (test_table);", function(res) {
          alert("PRAGMA res: " + JSON.stringify(res));
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
    //
    document.addEventListener("deviceready", onDeviceReady, false);

    // Cordova is ready
    //
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

 - `Android`: new version by @marcucio, with improvements for batch transaction processing, testing seems OK
 - `test-www`: simple testing in `index.html` using qunit 1.5.0

## Android

These installation instructions are based on the Android example project from Cordova/PhoneGap 2.2.0. For your first time please unzip the PhoneGap 2.2 zipball and use the `lib/android/example` subdirectory.

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

# Support

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

Then please raise an issue with the test program included in the description.

# Unit test(s)

Unit testing is done in `test-www/index.html`. To run the test(s) yourself please copy the files from `test-www` (`index.html`, `qunit-1.5.0.js`, & `qunit-1.5.0.css`) into the `www` directory of your Android Cordova project and make sure you have SQLitePlugin completely installed (JS, Java, and plugin registered).

# Loading pre-populated database file

[Excellent directions for the Android version](http://www.raymondcamden.com/index.cfm/2012/7/27/Guest-Blog-Post-Shipping-a-populated-SQLite-DB-with-PhoneGap) have been posted recently, directions needed for iOS version. [General directions for Cordova/PhoneGap](http://gauravstomar.blogspot.com/2011/08/prepopulate-sqlite-in-phonegap.html) had been posted but seems out-of-date and does not specifically apply for this plugin.

# Contributing

- Testimonials of apps that are using this plugin would be especially helpful.
- Issue reports can help improve the quality of this plugin.
- Patches with bug fixes are helpful, especially when submitted with test code.
- Other enhancements will be considered if they do not increase the complexity of this plugin.
- All contributions may be reused by @brodyspark under another license in the future. Efforts will be taken to give credit to major contributions but will not be guaranteed.

