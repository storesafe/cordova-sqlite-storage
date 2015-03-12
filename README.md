# Cordova/PhoneGap SQLitePlugin

Native interface to sqlite in a Cordova/PhoneGap plugin for Android/iOS/WP(8), with API similar to HTML5/[Web SQL API](http://www.w3.org/TR/webdatabase/) 

License for Android & WP(8) versions: MIT or Apache 2.0

License for iOS version: MIT only

## Status

- [Available at PhoneGap build](https://build.phonegap.com/plugins/2097)

## Announcements

- [SQLCipher](https://www.zetetic.net/sqlcipher/) for Android & iOS is now supported by [brodysoft / Cordova-sqlcipher-adaptor](https://github.com/brodysoft/Cordova-sqlcipher-adaptor)
- New `openDatabase` and `deleteDatabase` `location` option to select database location (iOS *only*) and disable iCloud backup
- Pre-populated databases support for Android & iOS is now integrated, usage described below
- Fixes to work with PouchDB by [@nolanlawson](https://github.com/nolanlawson)

## Highlights

- Works with Cordova 3.x tooling and [available at PhoneGap build](https://build.phonegap.com/plugins/2097)
- Drop-in replacement for HTML5 SQL API, the only change should be `window.openDatabase()` --> `sqlitePlugin.openDatabase()`
- Failure-safe nested transactions with batch processing optimizations
- As described in [this posting](http://brodyspark.blogspot.com/2012/12/cordovaphonegap-sqlite-plugins-offer.html):
  - Keeps sqlite database in a user data location that is known, can be reconfigured, and iOS will be backed up by iCloud.
  - No 5MB maximum, more information at: http://www.sqlite.org/limits.html
- Android is supported back to SDK 10 (a.k.a. Gingerbread, Android 2.3.3); Support for older versions is available upon request.
- Pre-populated database option (usage described below)

## Some apps using Cordova/PhoneGap SQLitePlugin

- [Get It Done app](http://getitdoneapp.com/) by [marcucio.com](http://marcucio.com/)
- [KAAHE Health Encyclopedia](http://www.kaahe.org/en/index.php?option=com_content&view=article&id=817): Official health app of the Kingdom of Saudi Arabia.
- [Larkwire](http://www.larkwire.com/) (iOS version): Learn bird songs the fun way
- [Tangorin](https://play.google.com/store/apps/details?id=com.tangorin.app) (Android) Japanese Dictionary at [tangorin.com](http://tangorin.com/)

## Known issues

- Issue reported with PhoneGap Build Hydration.
- Using web workers is currently not supported and known to be broken on Android.
- Triggers are only supported for iOS, known to be broken on Android.
- INSERT statement that affects multiple rows (due to SELECT cause or using triggers, for example) does not report proper rowsAffected on Android.

## Other limitations

- The db version, display name, and size parameter values are not supported and will be ignored.
- The sqlite plugin will not work before the callback for the "deviceready" event has been fired, as described in **Usage**.
- The Android version cannot work with more than 100 open db files due to its threading model.
- UNICODE line separator (`\u2028`) is currently not supported and known to be broken in iOS version.
- UNICODE characters not working with WP(8) version

## Limited support (testing needed)

- Multi-page apps on WP(8)
- DB Triggers (as described above - known to be broken for Android)

## Other versions and related projects

- [brodysoft / Cordova-sqlcipher-adaptor](https://github.com/brodysoft/Cordova-sqlcipher-adaptor) - supports [SQLCipher](https://www.zetetic.net/sqlcipher/) for Android & iOS.
- [MetaMemoryT / websql-client](https://github.com/MetaMemoryT/websql-client) - provides the same API and connects to [websql-server](https://github.com/MetaMemoryT/websql-server) through WebSockets.
- Original version for iOS (with a different API): [davibe / Phonegap-SQLitePlugin](https://github.com/davibe/Phonegap-SQLitePlugin)

# Usage

The idea is to emulate the HTML5/[Web SQL API](http://www.w3.org/TR/webdatabase/) as closely as possible. The only major change is to use `window.sqlitePlugin.openDatabase()` (or `sqlitePlugin.openDatabase()`) instead of `window.openDatabase()`. If you see any other major change please report it, it is probably a bug.

## Opening a database

There are two options to open a database:
- Recommended: `var db = window.sqlitePlugin.openDatabase({name: "my.db", location: 1});`
- Classical: `var db = window.sqlitePlugin.openDatabase("myDatabase.db", "1.0", "Demo", -1);`

The new `location` option is used to select the database subdirectory location (iOS *only*) with the following choices:
- `0` (default): `Documents` - will be visible to iTunes and backed up by iCloud
- `1`: `Library` - backed up by iCloud, *NOT* visible to iTunes
- `2`: `Library/LocalDatabase` - *NOT* visible to iTunes and *NOT* backed up by iCloud

**IMPORTANT:** Please wait for the "deviceready" event, as in the following example:

```js
// Wait for Cordova to load
document.addEventListener("deviceready", onDeviceReady, false);

// Cordova is ready
function onDeviceReady() {
  var db = window.sqlitePlugin.openDatabase({name: "my.db"});
  // ...
}
```

**NOTE:** The database file name should include the extension, if desired.

### Workaround for Android db locking issue

An [issue was reported](https://github.com/brodysoft/Cordova-SQLitePlugin/issues/193), as observed by several people that on some newer versions of the Android, if the app is stopped or aborted without closing the db then:
- (sometimes) there is an unexpected db lock
- the data that was inserted before is lost.

It is suspected that this issue is caused by [this Android sqlite commit](https://github.com/android/platform_external_sqlite/commit/d4f30d0d1544f8967ee5763c4a1680cb0553039f), which references and includes the sqlite commit at: http://www.sqlite.org/src/info/6c4c2b7dba

The workaround is enabled by opening the database like:

```js
  var db = window.sqlitePlugin.openDatabase({name: "my.db", androidLockWorkaround: 1});
```

### Pre-populated database

For Android & iOS (*only*): put the database file in the `www` directory and open the database like:

```js
  var db = window.sqlitePlugin.openDatabase({name: "my.db", createFromLocation: 1});
```

**IMPORTANT NOTES:**

- Put the pre-populated database file in the `www` subdirectory. This should work well with using the Cordova CLI to support both Android & iOS versions.
- The pre-populated database file name must match **exactly** the file name given in `openDatabase`. The automatic extension has been completely eliminated.

## Background processing

The threading model depends on which version is used:
- For Android & WP(8), one background thread per db (always);
- for iOS, background processing using a thread pool (always).

# Sample with PRAGMA feature

This is a pretty strong test: first we create a table and add a single entry, then query the count to check if the item was inserted as expected. Note that a new transaction is created in the middle of the first callback.

```js
// Wait for Cordova to load
document.addEventListener("deviceready", onDeviceReady, false);

// Cordova is ready
function onDeviceReady() {
  var db = window.sqlitePlugin.openDatabase({name: "my.db"});

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
```

## Sample with transaction-level nesting

In this case, the same transaction in the first executeSql() callback is being reused to run executeSql() again.

```js
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
```

This case will also works with Safari (WebKit), assuming you replace window.sqlitePlugin.openDatabase with window.openDatabase.

## Delete a database

```js
window.sqlitePlugin.deleteDatabase({name: "my.db", location: 1}, successcb, errorcb);
```

`location` as described above for `openDatabase` (iOS *only*)

# Installing

**NOTE:** This plugin is now prepared to be installed using the `cordova` tool.

## Easy install with cordova tool

    npm install -g cordova # if you don't have cordova
    cordova create MyProjectFolder com.my.project MyProject && cd MyProjectFolder # if you are just starting
    cordova plugin add https://github.com/brodysoft/Cordova-SQLitePlugin

You can find more details at [this writeup](http://iphonedevlog.wordpress.com/2014/04/07/installing-chris-brodys-sqlite-database-with-cordova-cli-android/).

**IMPORTANT:** sometimes you have to update the version for a platform before you can build, like: `cordova prepare ios`

**NOTE:** If you cannot build for a platform after `cordova prepare`, you may have to remove the platform and add it again, such as:

    cordova platform rm ios
    cordova platform add ios

## Source tree

- `SQLitePlugin.coffee.md`: platform-independent (Literate coffee-script, can be read by recent coffee-script compiler)
- `www`: `SQLitePlugin.js` now platform-independent
- `src`: Java plugin code for Android; Objective-C plugin code for iOS; C-sharp code & DLLs for WP(8)
- `test-www`: simple testing in `index.html` using qunit 1.5.0
- `Lawnchair-adapter`: Lawnchair adaptor, based on the version from the Lawnchair repository, with the basic Lawnchair test suite in `test-www` subdirectory

## Manual installation - Android version

These installation instructions are based on the Android example project from Cordova/PhoneGap 2.7.0. For your first time please unzip the PhoneGap 2.7 zipball and use the `lib/android/example` subdirectory.

 - Install www/SQLitePlugin.js from this repository into assets/www subdirectory
 - Install src/android/org/pgsqlite/SQLitePlugin.java from this repository into src/org/pgsqlite subdirectory
 - Add the plugin element `<plugin name="SQLitePlugin" value="org.pgsqlite.SQLitePlugin"/>` to res/xml/config.xml

Sample change to res/xml/config.xml for Cordova/PhoneGap 2.x:

```diff
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
```

Before building for the first time, you have to update the project with the desired version of the Android SDK with a command like:

    android update project --path $(pwd) --target android-17

(assume Android SDK 17, use the correct desired Android SDK number here)

**NOTE:** using this plugin on Cordova pre-3.0 requires the following change to SQLitePlugin.java:

```diff
--- src/android/org/pgsqlite/SQLitePlugin.java	2013-09-10 21:36:20.000000000 +0200
+++ SQLitePlugin.java.old	2013-09-10 21:35:14.000000000 +0200
@@ -17,8 +17,8 @@
 
 import java.util.HashMap;
 
-import org.apache.cordova.CordovaPlugin;
-import org.apache.cordova.CallbackContext;
+import org.apache.cordova.api.CordovaPlugin;
+import org.apache.cordova.api.CallbackContext;
 
 import android.database.Cursor;
```

## Manual installation - iOS version

### SQLite library

In the Project "Build Phases" tab, select the _first_ "Link Binary with Libraries" dropdown menu and add the library `libsqlite3.dylib` or `libsqlite3.0.dylib`.

**NOTE:** In the "Build Phases" there can be multiple "Link Binary with Libraries" dropdown menus. Please select the first one otherwise it will not work.

### SQLite Plugin

Drag .h and .m files into your project's Plugins folder (in xcode) -- I always
just have "Create references" as the option selected.

Take the precompiled javascript file from build/, or compile the coffeescript
file in src/ to javascript WITH the top-level function wrapper option (default).

Use the resulting javascript file in your HTML.

Enable the SQLitePlugin in `config.xml` (Cordova/PhoneGap 2.x):

```diff
--- config.xml.old	2013-05-17 13:18:39.000000000 +0200
+++ config.xml	2013-05-17 13:18:49.000000000 +0200
@@ -39,6 +39,7 @@
     <content src="index.html" />
 
     <plugins>
+        <plugin name="SQLitePlugin" value="SQLitePlugin" />
         <plugin name="Device" value="CDVDevice" />
         <plugin name="Logger" value="CDVLogger" />
         <plugin name="Compass" value="CDVLocation" />
```

## Manual installation - WP(8) version

TODO

## Quick installation test

Make a change like this to index.html (or use the sample code) verify proper installation:

```diff
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
```

# Common traps & pitfalls

- The plugin class name starts with "SQL" in capital letters, but in Javascript the `sqlitePlugin` object name starts with "sql" in small letters.
- Attempting to open a database before receiving the "deviceready" event callback.

# Support

## Reporting issues

If you have an issue with the plugin please check the following first:
- You are using the latest version of the Plugin Javascript & platform-specific Java or Objective-C source from this repository.
- You have installed the Javascript & platform-specific Java or Objective-C correctly.
- You have included the correct version of the cordova Javascript and SQLitePlugin.js and got the path right.
- You have registered the plugin properly in `config.xml`.

If you still cannot get something to work:
- Make the simplest test program you can to demonstrate the issue, including the following characteristics:
  - it completely self-contained, i.e. it is using no extra libraries beyond cordova & SQLitePlugin.js;
  - if the issue is with *adding* data to a table, that the test program includes the statements you used to open the database and create the table;
  - if the issue is with *retrieving* data from a table, that the test program includes the statements you used to open the database, create the table, and enter the data you are trying to retrieve.

Then you can [raise the new issue](https://github.com/brodysoft/Cordova-SQLitePlugin/issues/new).

## Community forum

If you have any questions about the plugin please post it to the [Cordova-SQLitePlugin forum](http://groups.google.com/group/Cordova-SQLitePlugin).

**NOTE:** Please report all bugs at [brodysoft / Cordova-SQLitePlugin / issues](https://github.com/brodysoft/Cordova-SQLitePlugin/issues) so they can be tracked properly.

# Unit tests

Unit testing is done in `test-www/`.

## running tests from shell

To run the tests from \*nix shell, simply do either:
 
    ./bin/test.sh ios

or for Android:

    ./bin/test.sh android

To run then from a windows powershell do either

    .\bin\test.ps1 android

or for Windows Phone 8:

    .\bin\test.ps1 wp8

# Adapters

## Lawnchair Adapter

### Common adapter

Please look at the `Lawnchair-adapter` tree that contains a common adapter, which should also work with the Android version, along with a test-www directory.

### Included files

Include the following js files in your html:

-  lawnchair.js (you provide)
-  SQLitePlugin.js
-  Lawnchair-sqlitePlugin.js (must come after SQLitePlugin.js)

### Sample

The `name` option will determine the sqlite filename. Optionally, you can change it using the `db` option.

In this example, you would be using/creating the database at: *Documents/kvstore.sqlite3* (all db's in SQLitePlugin are in the Documents folder)

```coffee
kvstore = new Lawnchair { name: "kvstore" }, () ->
  # do stuff
```

Using the `db` option you can create multiple stores in one sqlite file. (There will be one table per store.)

```coffee
recipes = new Lawnchair {db: "cookbook", name: "recipes", ...}
ingredients = new Lawnchair {db: "cookbook", name: "ingredients", ...}
```

It also supports bgType argument:

```coffee
users = new Lawnchair {name: "users", bgType: 1, ...}
```

### PouchDB

The adapter is now part of [PouchDB](http://pouchdb.com/) thanks to [@nolanlawson](https://github.com/nolanlawson), see [PouchDB FAQ](http://pouchdb.com/faq.html).

# Contributing

**WARNING:** Please do NOT propose changes from your `master` branch. In general changes will be rebased using `git rebase` or `git cherry-pick` and not merged.

- Testimonials of apps that are using this plugin would be especially helpful.
- Reporting issues at [brodysoft / Cordova-SQLitePlugin / issues](https://github.com/brodysoft/Cordova-SQLitePlugin/issues) can help improve the quality of this plugin.
- Patches with bug fixes are helpful, especially when submitted with test code.
- Other enhancements welcome for consideration, when submitted with test code and will work for all supported platforms. Increase of complexity should be avoided.
- All contributions may be reused by [@brodybits (Chris Brody)](https://github.com/brodybits) under another license in the future. Efforts will be taken to give credit for major contributions but it will not be guaranteed.
- Project restructuring, i.e. moving files and/or directories around, should be avoided if possible. If you see a need for restructuring, it is best to ask first on the [Cordova-SQLitePlugin forum](http://groups.google.com/group/Cordova-SQLitePlugin) where alternatives can be discussed before reaching a conclusion. If you want to propose a change to the project structure:
  - Make a special branch within your fork from which you can send the proposed restructuring;
  - Always use `git mv` to move files & directories;
  - Never mix a move/rename operation and any other changes in the same commit.

## Major branches

- `common-src` - source for Android & iOS versions
- `master-src` - source for Android, iOS, & WP(8) versions
- `master-rc` - pre-release version, including source for CSharp-SQLite library classes
- `master` - version for release, will be included in PhoneGap build.
