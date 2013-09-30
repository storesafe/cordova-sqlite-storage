# Cordova/PhoneGap SQLitePlugin - Windows Phone

Native interface to sqlite in a Cordova/PhoneGap plugin, working to follow the HTML5 Web SQL API as close as possible.

License for this version: MIT or Apache

## Status

 - Working with Cordova 3.0 tooling
 - Tested on WP8 (included libraries should also support WP7)
 - Next step is to integrate this version with the failure-safe transaction mechanism in [lite4cordova / Cordova-SQLitePlugin](https://github.com/lite4cordova/Cordova-SQLitePlugin)

## Highlights

 - Keeps sqlite database in a user data location that is known and can be reconfigured
 - Drop-in replacement for HTML5 SQL API, the only change is window.openDatabase() --> sqlitePlugin.openDatabase()
 - batch processing optimizations
 - No 5MB maximum, more information at: http://www.sqlite.org/limits.html

## Known Issues

 - Drop table is not working, looks like a bug in the net or csharp sqlite library. To get around this we can empty the tabe instead of dropping it.
 - A high number of features in csharp-sqlite were disabled to build when included by Cordova 3.0 CLI.
 - Missing failure-safe transaction mechanism
 - Not (yet) working with [SQLCipher](http://sqlcipher.net) for encryption

## Installation

Download & Windows version of node.js then follow normal instructions for Cordova CLI for WP8

Test in `wp-test` subdirectory

## Included dependencies

 - Modified version of SQLite.cs from [peterhuene / sqlite-net](https://github.com/peterhuene/sqlite-net) (MIT license)
 - Modified version of [csharp-sqlite](http://code.google.com/p/csharp-sqlite) version 3.7.7.1.71 (MIT license)

## Support

If you have an issue with the plugin the best way to get help is by raising an issue. It is best to make post the simplest code necessary to demonstrate the issue.

If you have any questions please post to the [lite4cordova forum](http://groups.google.com/group/lite4cordova).

## Apps using the plugin

 - http://getitdoneapp.com

