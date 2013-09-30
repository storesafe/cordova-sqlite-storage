# Cordova/PhoneGap SQLitePlugin - Windows Phone

Native interface to sqlite in a Cordova/PhoneGap plugin, working to follow the HTML5 Web SQL API as close as possible.

License for this version: MIT or Apache

## Highlights

 - Keeps sqlite database in a user data location that is known and can be reconfigured
 - Drop-in replacement for HTML5 SQL API, the only change is window.openDatabase() --> sqlitePlugin.openDatabase()
 - batch processing optimizations
 - No 5MB maximum, more information at: http://www.sqlite.org/limits.html

## Known Issues

 - Drop table is not working, looks like a bug in the net or csharp sqlite library. To get around this we can empty the tabe instead of dropping it.

## Installation

TBD

## Support

If you have an issue with the plugin the best way to get help is by raising an issue. It is best to make post the simplest code necessary to demonstrate the issue.

If you have any questions please post to the [lite4cordova forum](http://groups.google.com/group/lite4cordova).

## Apps using the plugin

 - http://getitdoneapp.com

