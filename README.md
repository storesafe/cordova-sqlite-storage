# Cordova/PhoneGap SQLitePlugin - Windows Phone 8+

Native interface to sqlite in a Cordova/PhoneGap plugin, working to follow the HTML5 Web SQL API as close as possible.

License for this version: MIT or Apache

## Highlights

 - Keeps sqlite database in a user data location that is known and can be reconfigured
 - Drop-in replacement for HTML5 SQL API, the only change is window.openDatabase() --> sqlitePlugin.openDatabase()
 - batch processing optimizations
 - No 5MB maximum, more information at: http://www.sqlite.org/limits.html
 - This version is using [sqlite-net-wp8](https://github.com/peterhuene/sqlite-net-wp8) wrapper to sqlite DLL, as described in [this article](http://wp.qmatteoq.com/working-with-sqlite-in-windows-phone-8-a-sqlite-net-version-for-mobile/)

## Known Issues

This was a problem with another .net library, TBD check if this is solved by using the sqlite dll:

 - Drop table is not working, looks like a bug in the native SQL library. To get around this we empty the tabe instead of dropping it.

## Installation

Simply copy the sample project under My Documents. It has a dependency on the framework and perhaps templates directories from the Cordova kit for WP8.

## Support

If you have an issue with the plugin the best way to get help is by raising an issue. It is best to make post the simplest code necessary to demonstrate the issue.

If you have any questions please post to the [pgsqlite forum](http://groups.google.com/group/pgsqlite).

## Apps using the plugin

 - http://getitdoneapp.com

