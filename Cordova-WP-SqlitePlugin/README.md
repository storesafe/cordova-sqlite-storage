# Cordova/PhoneGap sqlitePlugin - Windows Phone 8+ version

Native interface to sqlite in a Cordova/PhoneGap plugin, working to follow the HTML5 Web SQL API as close as possible.
License for this version: MIT or Apache

## Highlights

 - Upgraded for cordova 3.0 and higher
 - Added support for installation through CLI

## Usage

- If used with cordova 3.0, the file SQLitePlugin.js must probably be adapted like this (if not done by plugman automatically):
	**cordova.define("ch.zhaw.sqlite.SqlitePlugin", function(require, exports, module) {﻿**
	*EXISTING CODE*
	**});**
otherwise the plugin will not be loaded correctly
	
Install plugin via CLI:
- cordova plugin add <urlToPlugin>
All necessary entries should be made in the config file, native C# code file and javascript file are automatically added

- Reference the SQLitePlugin.js in your index.html file (Normally it can be found under the following folder under www: plugins\ch.zhaw.sqlite\Cordova-WP-SqlitePlugin\www)

- Before the first use, make sure plugin is loaded:
if (!window.plugins.sqlitePlugin) 
{
	console.log("try load plugin...");
	window.plugins.sqlitePlugin = cordova.require("ch.zhaw.sqlite.SqlitePlugin");            
}

- After this you can access it either through window.plugins.sqlitePlugin.
- The window.openDatabase function is overwritten when the plugin is loaded, so you can also use window.openDatabase.

## Known Issues

 - Drop table is not working, looks like a bug in the native SQL library. To get around this we empty the tabe instead of dropping it.

## Support

If you have an issue with the plugin the best way to get help is by raising an issue. It is best to make post the simplest code necessary to demonstrate the issue.

## Apps using the plugin

http://getitdoneapp.com
