Phonegap SQLitePlugin
=====================

I have been developing Phonegap applications that required big databases.
WebKitSQLite HTML5 database has hardcoded quota limitations so I decided to write
this plugin to open my own sqlite files from javascript.

Currently the plugin supports basic open, close, executeSQL and has no support 
for transactions.

I also started writing a js wrapper that exposes an HTML5-like interface but
it is unfinished yet (see sqlite-html5.js)

Later I found out that I could actually use this plugin to open the same database 
file WebKit uses to store HTML5 dbs and change their quota limits (see sqlite.js).
This way I was able to store up to 1Gb using HTML5 WebKitSQLite.
