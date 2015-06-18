# Cordova/PhoneGap sqlite storage adapter

[![Join the chat at https://gitter.im/litehelpers/Cordova-sqlite-storage](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/litehelpers/Cordova-sqlite-storage?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
 
Native interface to sqlite in a Cordova/PhoneGap plugin for Android, iOS, Windows "Universal" (8.1), Amazon Fire-OS, and WP(7/8) with API similar to HTML5/[Web SQL API](http://www.w3.org/TR/webdatabase/).

License for Android, Windows "Universal" (8.1), Amazon Fire-OS, and WP(7/8) versions: MIT or Apache 2.0

License for iOS version: MIT only

|Android CI (full suite)|iOS CI (limited suite)|
|-----------------------|----------------------|
|[![Circle CI](https://circleci.com/gh/litehelpers/Cordova-sqlite-storage.svg?style=svg)](https://circleci.com/gh/litehelpers/Cordova-sqlite-storage)|[![Build Status](https://travis-ci.org/litehelpers/Cordova-sqlite-storage.svg?branch=master-rc)](https://travis-ci.org/litehelpers/Cordova-sqlite-storage)|

## Status

- Windows "Universal" (8.1) version is in an experimental/pre-alpha state:
  - Database close and delete operations not yet implemented
  - No background processing (for future consideration)
  - You *may* encounter issues with Cordova CLI due to [CB-8866](https://issues.apache.org/jira/browse/CB-8866); as a workaround you can install using [litehelpers / cordova-windows-nufix](https://github.com/litehelpers/cordova-windows-nufix) and `plugman` as described below.
  - In addition, problems with the Windows "Universal" version have been reported in case of a Cordova project using a Visual Studio template/extension instead of Cordova/PhoneGap CLI or `plugman`
  - Not tested with a Windows 10 (or Windows Phone 10) target; Windows 10 build is not expected to work with Windows Phone
- FTS3, FTS4, and R-Tree support is tested working OK in this version (for target platforms Android/iOS/Windows "Universal")
- Status for the other target platforms:
  - Android: now using the [sqlite4java](https://code.google.com/p/sqlite4java/) library (sqlite `3.8.7` embedded), supporting FTS3/FTS4 and R-Tree
  - iOS: sqlite `3.8.10.2` embedded
  - WP7: possible to build from C#, as specified by `plugin.xml` - **NOT TESTED**
  - WP8: performance/stability issues have been reported with the CSharp-SQLite library. Windows (universal) platform is recommended for the future. FTS3/FTS4/R-Tree are NOT supported for WP(7/8).
- Android is supported back to SDK 10 (a.k.a. Gingerbread, Android 2.3.3); support for older versions is available upon request.
- API to open the database may be changed somewhat to be more streamlined. Transaction and single-statement query API will NOT be changed.

## Announcements

- [Cordova sqlite storage (0.7.8) published](https://build.phonegap.com/plugins/3124) in PhoneGap Build
- Windows "Universal" version now supports both Windows 8.1 and Windows Phone 8.1
- Android version is now using the [sqlite4java](https://code.google.com/p/sqlite4java/) library by default configuration:
  - NDK part rebuilt with `-DSQLITE_TEMP_STORE=3` CFLAG to support UPDATE properly;
  - option to use the built-in Android database classes described below.
- iOS version is now fixed to override the correct pluginInitialize method and should work with recent versions of iOS
- Project has been renamed to prevent confusion with [davibe / Phonegap-SQLitePlugin](https://github.com/davibe/Phonegap-SQLitePlugin) (original version for iOS, with a different API)
- New project location (should redirect)
- The test suite is completely ported to Jasmine (2.2.0) and was used to verify the functionality of the new Windows version
- [SQLCipher](https://www.zetetic.net/sqlcipher/) for Windows (8.1) in addition to Android & iOS is now supported by [litehelpers / Cordova-sqlcipher-adapter](https://github.com/litehelpers/Cordova-sqlcipher-adapter)
- New `openDatabase` and `deleteDatabase` `location` option to select database location (iOS *only*) and disable iCloud backup
- Pre-populated databases support for Android, iOS, and Amazon Fire-OS is now integrated, usage described below
- Fixes to work with PouchDB by [@nolanlawson](https://github.com/nolanlawson)

## Highlights

- Drop-in replacement for HTML5 SQL API, the only change should be `window.openDatabase()` --> `sqlitePlugin.openDatabase()`
- Failure-safe nested transactions with batch processing optimizations
- As described in [this posting](http://brodyspark.blogspot.com/2012/12/cordovaphonegap-sqlite-plugins-offer.html):
  - Keeps sqlite database in a user data location that is known; can be reconfigured (iOS version); and synchronized to iCloud by default (iOS version; can be disabled as described below).
  - No 5MB maximum, more information at: http://www.sqlite.org/limits.html
- Pre-populated database option (usage described below)

## Some apps using this plugin

- [Get It Done app](http://getitdoneapp.com/) by [marcucio.com](http://marcucio.com/)
- [KAAHE Health Encyclopedia](http://www.kaahe.org/en/index.php?option=com_content&view=article&id=817): Official health app of the Kingdom of Saudi Arabia.
- [Larkwire](http://www.larkwire.com/) (iOS version): Learn bird songs the fun way
- [Tangorin](https://play.google.com/store/apps/details?id=com.tangorin.app) (Android) Japanese Dictionary at [tangorin.com](http://tangorin.com/)

## Known issues

- Issue reported with PhoneGap Build Hydration.
- For some reason, PhoneGap Build may fail to build the iOS version unless the name of the app starts with an uppercase and contains no spaces (see [#243](https://github.com/litehelpers/Cordova-sqlite-storage/issues/243); [Wizcorp/phonegap-facebook-plugin#830](https://github.com/Wizcorp/phonegap-facebook-plugin/issues/830); [phonegap/build#431](https://github.com/phonegap/build/issues/431)).
- Multi-page apps are not supported and known to be broken on Android and Amazon Fire-OS.
- Using web workers is currently not supported and known to be broken on Android and Amazon Fire-OS.
- Triggers have only been tested on iOS, known to be broken on Android (in case [sqlite4java](https://code.google.com/p/sqlite4java/) is disabled) and Amazon Fire-OS.
- INSERT statement that affects multiple rows (due to SELECT cause or using triggers, for example) does not report proper rowsAffected on Android (in case [sqlite4java](https://code.google.com/p/sqlite4java/) is disabled) or Amazon Fire-OS.
- On Windows "Universal" (8.1), rowsAffected can be wrong when there are multiple levels of nesting of INSERT statements.
- Memory issue observed when adding a large number of records on Android and Amazon Fire-OS, due to JSON implementation (ref: [#18](https://github.com/litehelpers/Cordova-sqlite-storage/issues/18))
- A stability issue was reported on the iOS version when in use together with [SockJS](http://sockjs.org/) client such as [pusher-js](https://github.com/pusher/pusher-js) at the same time (see [#196](https://github.com/litehelpers/Cordova-sqlite-storage/issues/196)). The workaround is to call sqlite functions and [SockJS](http://sockjs.org/) client functions in separate ticks (using setTimeout with 0 timeout).
- DROP table does not actually delete it in WP(7/8) version, due to limitations of CSharp-SQLite.

## Other limitations

- The db version, display name, and size parameter values are not supported and will be ignored.
- This plugin will not work before the callback for the "deviceready" event has been fired, as described in **Usage**. (This is consistent with the other Cordova plugins.)
- The Android and Amazon Fire-OS versions cannot work with more than 100 open db files (due to the threading model used).
- UNICODE line separator (`\u2028`) is currently not supported and known to be broken in iOS version.
- UNICODE characters not working in WP(7/8) version
- Blob type is currently not supported and known to be broken on multiple platforms.
- UNICODE `\u0000` (same as `\0`) character not working in Windows "Universal" (8.1) or WP(7/8) versions
- Case-insensitive matching and other string manipulations on Unicode characters, which is provided by optional ICU integration in the sqlite source and working with recent versions of Android, is not supported for any target platforms.
- iOS version uses a thread pool but with only one thread working at a time due to "synchronized" database access
- Large query result can be slow, also due to JSON implementation
- FTS3/FTS4 and R-Tree are not supported for iOS or Windows "Universal" (8.1).
- ATTACH another database file is not supported (due to path specifications, which work differently depending on the target platform)
- User-defined savepoints are not supported and not expected to be compatible with the transaction locking mechanism used by this plugin. In addition, the use of BEGIN/COMMIT/ROLLBACK statements is not supported.

## Limited support (testing needed)

- FTS3/FTS4 is not tested supported for Amazon Fire-OS or WP(7/8)
- R-Tree is not tested for Android (in case [sqlite4java](https://code.google.com/p/sqlite4java/) is disabled), Amazon Fire-OS or WP(7/8)
- DB Triggers (as described above - known to be broken for Amazon Fire-OS)
- UNICODE characters not fully tested in the Windows "Universal" (8.1) version
- JOIN needs to be tested more.

## Other versions

- [litehelpers / Cordova-sqlcipher-adapter](https://github.com/litehelpers/Cordova-sqlcipher-adapter) - supports [SQLCipher](https://www.zetetic.net/sqlcipher/) for Android, iOS, and Windows (8.1)
- Original version for iOS (with a different API): [davibe / Phonegap-SQLitePlugin](https://github.com/davibe/Phonegap-SQLitePlugin)

## Other SQLite adapter projects

- [EionRobb / phonegap-win8-sqlite](https://github.com/EionRobb/phonegap-win8-sqlite) - WebSQL add-on for Win8/Metro apps (perhaps with a different API), using an old version of the C++ library from [SQLite3-WinRT Component](https://github.com/doo/SQLite3-WinRT) (as referenced by [01org / cordova-win8](https://github.com/01org/cordova-win8))
- [SQLite3-WinRT Component](https://github.com/doo/SQLite3-WinRT) - C++ component that provides a nice SQLite API with promises for WinJS
- [01org / cordova-win8](https://github.com/01org/cordova-win8) - old, unofficial version of Cordova API support for Windows 8 Metro that includes an old version of the C++ [SQLite3-WinRT Component](https://github.com/doo/SQLite3-WinRT)
- [MSOpenTech / cordova-plugin-websql](https://github.com/MSOpenTech/cordova-plugin-websql) - Windows 8(+) and Windows Phone 8(+) WebSQL plugin versions in C#
- [MetaMemoryT / websql-client](https://github.com/MetaMemoryT/websql-client) - provides the same API and connects to [websql-server](https://github.com/MetaMemoryT/websql-server) through WebSockets.

# Usage

The idea is to emulate the HTML5/[Web SQL API](http://www.w3.org/TR/webdatabase/) as closely as possible. The only major change is to use `window.sqlitePlugin.openDatabase()` (or `sqlitePlugin.openDatabase()`) instead of `window.openDatabase()`. If you see any other major change please report it, it is probably a bug.

**NOTE:** If a sqlite statement in a transaction fails with an error, the error handler *must* return `false` in order to recover the transaction. This is correct according to the HTML5/[Web SQL API](http://www.w3.org/TR/webdatabase/) standard. This is different from the WebKit implementation of Web SQL in Android and iOS which recovers the transaction if a sql error hander returns a non-`true` value.

## Opening a database

There are two options to open a database:
- **Recommended:** `var db = window.sqlitePlugin.openDatabase({name: "my.db", location: 1});`
- **Classical:** `var db = window.sqlitePlugin.openDatabase("myDatabase.db", "1.0", "Demo", -1);`

The new `location` option is used to select the database subdirectory location (iOS *only*) with the following choices:
- `0` (default): `Documents` - visible to iTunes and backed up by iCloud
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

### Pre-populated database

For Android, iOS, and Amazon Fire-OS (*only*): put the database file in the `www` directory and open the database like:

```js
var db = window.sqlitePlugin.openDatabase({name: "my.db", createFromLocation: 1});
```

or to disable iCloud backup:

```js
db = sqlitePlugin.openDatabase({name: "my.db", location: 2, createFromLocation: 1});
```

**IMPORTANT NOTES:**

- Put the pre-populated database file in the `www` subdirectory. This should work well with using the Cordova CLI to support both Android & iOS versions.
- The pre-populated database file name must match **exactly** the file name given in `openDatabase`. The automatic extension has been completely eliminated.
- The pre-populated database file is ignored if the database file with the same name already exists in your database file location.

**TIP:** If you don't see the data from the pre-populated database file, completely remove your app and try it again!

### Android sqlite implementation

By default, this plugin uses [sqlite4java](https://code.google.com/p/sqlite4java/) which is more efficient than the built-in Android database classes. The  [sqlite4java](https://code.google.com/p/sqlite4java/) library consists of a Java part and a NDK part.

Unfortunately some app developers have encountered problems using [sqlite4java](https://code.google.com/p/sqlite4java/) with Ionic and Crosswalk. To use the built-in Android database classes instead:

```js
var db = window.sqlitePlugin.openDatabase({name: "my.db", androidDatabaseImplementation: 2});
```

### Workaround for Android db locking issue

[Issue #193](https://github.com/litehelpers/Cordova-sqlite-storage/issues/193) was reported (as observed by several app developers) that on some newer versions of the Android database classes, if the app is stopped or aborted without closing the database then:
- (sometimes) there is an unexpected database lock
- the data that was inserted is lost.

This issue is suspected to be caused by [this Android sqlite commit](https://github.com/android/platform_external_sqlite/commit/d4f30d0d1544f8967ee5763c4a1680cb0553039f), which references and includes the sqlite commit at: http://www.sqlite.org/src/info/6c4c2b7dba

There is an optional workaround that simply closes and reopens the database file at the end of every transaction that is committed. The workaround is enabled by opening the database with options as follows:

```js
var db = window.sqlitePlugin.openDatabase({name: "my.db", androidDatabaseImplementation: 2, androidLockWorkaround: 1});
```

This option is ignored if `androidDatabaseImplementation: 2` is not specified.

**IMPORTANT NOTE:** This workaround is *only* applied when using `db.transaction()` or `db.readTransaction()`, *not* applied when running `executeSql()` on the database object.

## Background processing

The threading model depends on which version is used:
- For Android, Amazon Fire-OS, and WP(7/8), one background thread per db;
- for iOS, background processing using a very limited thread pool (only one thread working at a time);
- for Windows "Universal" (8.1), no background processing (for future consideration).

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

**NOTE:** PRAGMA statements must be executed in `executeSql()` on the database object (i.e. `db.executeSql()`) and NOT within a transaction.

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

This case will also works with Safari (WebKit), assuming you replace `window.sqlitePlugin.openDatabase` with `window.openDatabase`.

## Delete a database

```js
window.sqlitePlugin.deleteDatabase({name: "my.db", location: 1}, successcb, errorcb);
```

`location` as described above for `openDatabase` (iOS *only*)

**NOTE:** not implemented for Windows "Universal" (8.1) version.

# Installing

## Windows "Universal" target platform

**IMPORTANT:** There are issues supporing certain Windows target platforms due to [CB-8866](https://issues.apache.org/jira/browse/CB-8866):
- When using Visual Studio, the default target ("Mixed Platforms") will not work
- Problems have been with the Windows "Universal" version case of a Cordova project using a Visual Studio template/extension instead of Cordova/PhoneGap CLI or `plugman`
As an alternative, which will support the ("Mixed Platforms") target, you can use `plugman` instead with [litehelpers / cordova-windows-nufix](https://github.com/litehelpers/cordova-windows-nufix), as described here.

### Using plugman to support "Mixed Platforms"

- make sure you have the latest version of `plugman` installed: `npm install -g plugman`
- Download the [cordova-windows-nufix 3.9.0-nufixpre-01 zipball](https://github.com/litehelpers/cordova-windows-nufix/archive/3.9.0-nufixpre-01.zip) (or you can clone [litehelpers / cordova-windows-nufix](https://github.com/litehelpers/cordova-windows-nufix) instead)
- Create your Windows "Universal" (8.1) project using [litehelpers / cordova-windows-nufix](https://github.com/litehelpers/cordova-windows-nufix):
  - `path.to.cordova-windows-nufix/bin/create.bat your_app_path your.app.id YourAppName`
- `cd your_app_path` and install plugin using `plugman`:
  - `plugman install --platform windows --project . --plugin cordova-sqlite-storage`
- Put your sql program in your project `www` (don't forget to reference it from `www\index.html` and wait for `deviceready` event)

Then your project in `CordovaApp.sln` should work with "Mixed Platforms" on both Windows 8.1 and Windows Phone 8.1.

## Easy install with plugman tool

```shell
plugman install --platform MYPLATFORM --project path.to.my.project.folder --plugin cordova-sqlite-storage
```

where MYPLATFORM is `android`, `ios`, `windows`, or `wp8`.

A posting how to get started developing on Windows host without the Cordova CLI tool (for Android target only) is available [here](http://brodybits.blogspot.com/2015/03/trying-cordova-for-android-on-windows-without-cordova-cli.html).

**NOTE:** You can substitute https://github.com/litehelpers/Cordova-sqlite-storage for `cordova-sqlite-storage` to get the latest version directly from github.

## Easy install with Cordova CLI tool

    npm install -g cordova # if you don't have cordova
    cordova create MyProjectFolder com.my.project MyProject && cd MyProjectFolder # if you are just starting
    cordova plugin add cordova-sqlite-storage

You can find more details at [this writeup](http://iphonedevlog.wordpress.com/2014/04/07/installing-chris-brodys-sqlite-database-with-cordova-cli-android/).

**WARNING:** as stated above, there are issues using Cordova CLI with Windows ("Universal") target platform due to [CB-8866](https://issues.apache.org/jira/browse/CB-8866). It is recommended to use `plugman` instead, as described above.

**IMPORTANT:** sometimes you have to update the version for a platform before you can build, like: `cordova prepare ios`

**NOTE:** If you cannot build for a platform after `cordova prepare`, you may have to remove the platform and add it again, such as:

    cordova platform rm ios
    cordova platform add ios

**EXTRA NOTE:** You can substitute https://github.com/litehelpers/Cordova-sqlite-storage for `cordova-sqlite-storage` to get the latest version directly from github.

## Source tree

- `SQLitePlugin.coffee.md`: platform-independent (Literate coffee-script, can be read by recent coffee-script compiler)
- `www`: `SQLitePlugin.js` platform-independent Javascript as generated from `SQLitePlugin.coffee.md` (and checked in!)
- `src`: platform-specific source code:
   - `external` - placeholder for external dependencies - *not required in this version*
   - `android` - Java plugin code for Android (along with sqlite4java library);
   - `android-classic` - Java plugin code for Amazon Fire-OS
   - `ios` - Objective-C plugin code for iOS;
   - `windows` - Javascript proxy code and SQLite3-WinRT project for Windows "Universal" (8.1);
   - `wp` - C-sharp code for WP(7/8)
- `spec`: test suite using Jasmine (2.2.0), ported from QUnit `test-www` test suite, working on all platforms
- `tests`: very simple Jasmine test suite that is run on Circle CI (Android version) and Travis CI (iOS version)
- `Lawnchair-adapter`: Lawnchair adaptor, based on the version from the Lawnchair repository, with the basic Lawnchair test suite in `test-www` subdirectory

## Manual installation - Android version

These installation instructions are based on the Android example project from Cordova/PhoneGap 2.7.0, using the `lib/android/example` subdirectory from the PhoneGap 2.7 zipball.

 - Install `SQLitePlugin.js` from `www` into `assets/www`
 - Install `SQLiteAndroidDatabase.java` and `SQLitePlugin.java` from `src/android/io/liteglue` into `src/io/liteglue` subdirectory
 - Install the `libs` subtree from `src/android/sqlite4java/libs` into your Android project
 - Add the plugin element `<plugin name="SQLitePlugin" value="io.liteglue.SQLitePlugin"/>` to `res/xml/config.xml`

Sample change to `res/xml/config.xml` for Cordova/PhoneGap 2.x:

```diff
--- config.xml.orig	2015-04-14 14:03:05.000000000 +0200
+++ res/xml/config.xml	2015-04-14 14:08:08.000000000 +0200
@@ -36,6 +36,7 @@
     <preference name="useBrowserHistory" value="true" />
     <preference name="exit-on-suspend" value="false" />
 <plugins>
+    <plugin name="SQLitePlugin" value="io.liteglue.SQLitePlugin"/>
     <plugin name="App" value="org.apache.cordova.App"/>
     <plugin name="Geolocation" value="org.apache.cordova.GeoBroker"/>
     <plugin name="Device" value="org.apache.cordova.Device"/>
```

Before building for the first time, you have to update the project with the desired version of the Android SDK with a command like:

    android update project --path $(pwd) --target android-19

(assuming Android SDK 19, use the correct desired Android SDK number here)

**NOTE:** using this plugin on Cordova pre-3.0 requires the following changes to `SQLiteAndroidDatabase.java` and `SQLitePlugin.java`:

```diff
--- Cordova-sqlite-storage/src/android/io/liteglue/SQLiteAndroidDatabase.java	2015-04-14 14:05:01.000000000 +0200
+++ src/io/liteglue/SQLiteAndroidDatabase.java	2015-04-14 14:15:23.000000000 +0200
@@ -24,7 +24,7 @@
 import java.util.regex.Matcher;
 import java.util.regex.Pattern;
 
-import org.apache.cordova.CallbackContext;
+import org.apache.cordova.api.CallbackContext;
 
 import org.json.JSONArray;
 import org.json.JSONException;
diff -u Cordova-sqlite-storage/src/android/io/liteglue/SQLitePlugin.java src/io/liteglue/SQLitePlugin.java
--- Cordova-sqlite-storage/src/android/io/liteglue/SQLitePlugin.java	2015-04-14 14:05:01.000000000 +0200
+++ src/io/liteglue/SQLitePlugin.java	2015-04-14 14:10:44.000000000 +0200
@@ -22,8 +22,8 @@
 import java.util.regex.Matcher;
 import java.util.regex.Pattern;
 
-import org.apache.cordova.CallbackContext;
-import org.apache.cordova.CordovaPlugin;
+import org.apache.cordova.api.CallbackContext;
+import org.apache.cordova.api.CordovaPlugin;
 
 import org.json.JSONArray;
 import org.json.JSONException;
```

## Manual installation - iOS version

### SQLite library

In the Project "Build Phases" tab, select the _first_ "Link Binary with Libraries" dropdown menu and add the library `libsqlite3.dylib` or `libsqlite3.0.dylib`.

**NOTE:** In the "Build Phases" there can be multiple "Link Binary with Libraries" dropdown menus. Please select the first one otherwise it will not work.

### SQLite Plugin

- Copy `SQLitePlugin.[hm]` from `src/ios` into your project Plugins folder and add them in XCode (I always just have "Create references" as the option selected).
- Copy `SQLitePlugin.js` from `www` into your project `www` folder
- Enable the SQLitePlugin in `config.xml`

Sample change to `config.xml` for Cordova/PhoneGap 2.x:

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

## Manual installation - Windows "Universal" (8.1) version

Described above.

## Manual installation - WP(7/8) version

TBD

## Quick installation test

Assuming your app has a recent template as used by the Cordova create script, add the following code to the `onDeviceReady` function, after `app.receivedEvent('deviceready');`:

```Javascript
  window.sqlitePlugin.openDatabase({ name: 'hello-world.db' }, function (db) {
    db.executeSql("select length('tenletters') as stringlength", [], function (res) {
      var stringlength = res.rows.item(0).stringlength;
      console.log('got stringlength: ' + stringlength);
      document.getElementById('deviceready').querySelector('.received').innerHTML = 'stringlength: ' + stringlength;
   });
  });
```

### Old installation test

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

Then you can [raise the new issue](https://github.com/litehelpers/Cordova-sqlite-storage/issues/new).

## Community forum

If you have any questions about the plugin:
- [![Join the chat at https://gitter.im/litehelpers/Cordova-sqlite-storage](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/litehelpers/Cordova-sqlite-storage?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge) [Join the chat at https://gitter.im/litehelpers/Cordova-sqlite-storage](https://gitter.im/litehelpers/Cordova-sqlite-storage)
- experimental discussion forum at [Ost.io / @litehelpers / Cordova-sqlite-storage](http://ost.io/@litehelpers/Cordova-sqlite-storage) (notifications not working)

## Professional support

Professional support is available, please contact <info@litehelpers.net>.

# Unit tests

Unit testing is done in `spec`.

## running tests from shell

To run the tests from \*nix shell, simply do either:
 
    ./bin/test.sh ios

or for Android:

    ./bin/test.sh android

To run then from a windows powershell do either

    .\bin\test.ps1 android

or for Windows (8.1):

    .\bin\test.ps1 windows

or for Windows Phone (7/8):

    .\bin\test.ps1 wp8

# Adapters

## Lawnchair Adapter

### Common adapter

Please look at the `Lawnchair-adapter` tree that contains a common adapter, which should also work with the Android version, along with a test-www directory.

### Included files

Include the following Javascript files in your HTML:

- `cordova.js` (don't forget!)
- `lawnchair.js` (you provide)
- `SQLitePlugin.js` (in case of Cordova pre-3.0)
- `Lawnchair-sqlitePlugin.js` (must come after `SQLitePlugin.js` in case of Cordova pre-3.0)

### Sample

The `name` option determines the sqlite database filename, *with no extension automatically added*. Optionally, you can change the db filename using the `db` option.

In this example, you would be using/creating a database with filename `kvstore`:

```Javascript
kvstore = new Lawnchair({name: "kvstore"}, function() {
  // do stuff
);
```

Using the `db` option you can specify the filename with the desired extension and be able to create multiple stores in the same database file. (There will be one table per store.)

```Javascript
recipes = new Lawnchair({db: "cookbook", name: "recipes", ...}, myCallback());
ingredients = new Lawnchair({db: "cookbook", name: "ingredients", ...}, myCallback());
```

**KNOWN ISSUE:** the new db options are *not* supported by the Lawnchair adapter. The workaround is to first open the database file using `sqlitePlugin.openDatabase()`.

## PouchDB

The adapter is now part of [PouchDB](http://pouchdb.com/) thanks to [@nolanlawson](https://github.com/nolanlawson), see [PouchDB FAQ](http://pouchdb.com/faq.html).

**NOTE:** For some reason, the PouchDB adapter does not pass all of its tests with the Android version of this plugin, unless you include `androidDatabaseImplementation: 2` in the `sqlitePlugin.openDatabase()` options as described above.

# Contributing

## Community

- Testimonials of apps that are using this plugin would be especially helpful.
- Reporting issues at [litehelpers / Cordova-sqlite-storage / issues](https://github.com/litehelpers/Cordova-sqlite-storage/issues) can help improve the quality of this plugin.

**WARNING:** Please do NOT propose changes from your `master` (`master-rc`) branch. In general, contributions are rebased using `git rebase` or `git cherry-pick` and not merged.

## Code

- Patches with bug fixes are helpful, especially when submitted with test code.
- Other enhancements welcome for consideration, when submitted with test code and are working for all supported platforms. Increase of complexity should be avoided.
- All contributions may be reused by [@brodybits (Chris Brody)](https://github.com/brodybits) under another license in the future. Efforts will be taken to give credit for major contributions but it will not be guaranteed.
- Project restructuring, i.e. moving files and/or directories around, should be avoided if possible.
- If you see a need for restructuring, it is better to first discuss it [in the Cordova-sqlite-storage gitter.im chat](https://gitter.im/litehelpers/Cordova-sqlite-storage) (or in a [new issue](https://github.com/litehelpers/Cordova-sqlite-storage/issues/new)) where alternatives can be discussed before reaching a conclusion. If you want to propose a change to the project structure:
  - Remember to make (and use) a special branch within your fork from which you can send the proposed restructuring;
  - Always use `git mv` to move files & directories;
  - Never mix a move/rename operation with any other changes in the same commit.

## Other

[@brodybits (Chris Brody)](https://github.com/brodybits) and others contribute their valuable time and expertise to maintain this project for the benefit of the mobile app community. Small consulting relationships can help strengthen the business viability of this project (see contact below).

## Major branches

- `cordova-sqlite-common` - source for Android (*not* using [sqlite4java](https://code.google.com/p/sqlite4java/)), iOS, Windows (8.1), and Amazon Fire-OS versions (shared with [litehelpers / Cordova-sqlcipher-adapter](https://github.com/litehelpers/Cordova-sqlcipher-adapter))
- `new-common-src` - source for Android (using [sqlite4java](https://code.google.com/p/sqlite4java/)), iOS, Windows (8.1), and Amazon Fire-OS versions
- `new-common-rc` - pre-release version for Android/iOS/Windows (8.1), including library dependencies for Android and Windows (8.1)
- `wp-src` - source for Android (*not* using [sqlite4java](https://code.google.com/p/sqlite4java/)), iOS, WP(7/8), and Amazon Fire-OS versions
- `wp-master-rc` - pre-release version for Android(*not* using [sqlite4java](https://code.google.com/p/sqlite4java/))/iOS/WP(7/8), including source for CSharp-SQLite (C#) library classes
- `master-rc` - pre-release version for all supported platforms, including library dependencies for Android, Windows (8.1), and WP(7/8)
- [FUTURE TBD] ~~`master` - version for release, to be included in PhoneGap build.~~

## Contact

<info@litehelpers.net>
