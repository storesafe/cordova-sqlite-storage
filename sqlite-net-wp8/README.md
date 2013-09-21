sqlite-net-wp8
==============

A C++/CX wrapper for SQLite functions that [sqlite-net](https://github.com/praeclarum/sqlite-net) depends on.

This library can be used to directly call into sqlite3.dll on Windows Phone 8 from sqlite-net.

Requirements
============

* Visual Studio 2012
* Windows Phone 8.0 SDK
* SQLite for Windows Phone (install via the "Tools -> Extensions and Updates" menu item in Visual Studio).

Remarks
======

This library is intended to be used with [sqlite-net](https://github.com/praeclarum/sqlite-net).

However, sqlite-net currently won't work with this library as it has a dependency on [csharp-sqlite](http://code.google.com/p/csharp-sqlite/) (a reimplementation of SQLite in C#) instead of this library.

[Use my fork of sqlite-net](https://github.com/peterhuene/sqlite-net) that does depend on this library.  There is a pending pull request on the upstream sqlite-net for these changes,

Using sqlite-net-wp8
====================

* Clone or copy the sqlite-net-wp8 source files into your solution directory.
* Add the Sqlite.vcxproj project to your solution (File -> Add -> Existing Project).
* From your Windows Phone project, add a project reference to the Sqlite project (Project -> Add Reference -> Solution -> Projects).
* Clone or copy the [sqlite-net](https://github.com/peterhuene/sqlite-net) source files (src/SQLite.cs and src/SQLiteAsync.cs) into your Windows Phone project.
* Add "USE_WP8_NATIVE_SQLITE" as a conditional build symbol to your project containing the sqlite-net source files (without this, SQLite will use csharp-sqlite):
    * Project -> Properties
    * Click on the Build tab.
    * In the "Configuration" dropdown, select "All configurations".
    * In the "Platform" dropdown, select "All platforms".
    * Append ";USE_WP8_NATIVE_SQLITE" to the "Conditional compilation symbols" textbox.
* Use sqlite-net as you normally would.
