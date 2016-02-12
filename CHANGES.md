# Changes

## 0.8.2

- Workaround fix for empty readTransaction issue (litehelpers/Cordova-sqlite-storage#409)
- Split spec/www/spec/legacy.js into db-open-close-delete-test.js & tx-extended.js

## 0.8.0

- Simple sql batch transaction function
- Echo test function
- Remove extra runInBackground: step from iOS version
- Android-sqlite-connector (NDK) support removed from this version branch
- Windows version removed from this version branch
- Java source of Android version now using io.sqlc package

## 0.7.15-pre

- All iOS operations are now using background processing (reported to resolve intermittent problems with cordova-ios@4.0.1)

## 0.7.14

- REGEXP support completely removed from this version branch
- Remove src/android/libs/.gitignore (inadvertently added in 0.7.13)

## 0.7.13

- REGEXP support partially removed from this version branch
- Rename Windows C++ Database close function to closedb to resolve conflict for Windows Store certification
- Android version with sqlite `3.8.10.2` embedded (with error messages fixed)
- Pre-populated database support removed from this version branch
- Amazon Fire-OS support removed
- Fix conversion warnings in iOS version

## 0.7.12

- Fix to Windows "Universal" version to support big integers
- Implement database close and delete operations for Windows "Universal"
- Fix readTransaction to skip BEGIN/COMMIT/ROLLBACK

## 0.7.11

- Fix plugin ID in plugin.xml to match npm package ID
- Unpacked sqlite-native-driver.so libraries from jar
- Fix conversion of INTEGER type (iOS version)
- Disable code to read BLOB as Base-64 due to https://issues.apache.org/jira/browse/CB-9638

## 0.7.10

- Use Android-sqlite-connector instead of sqlite4java

## 0.7.9

- Build iOS and Windows versions with sqlite 3.8.10.2 embedded
- Fix plugin id to match npm package id

## 0.7.8

- Support FTS3/FTS4 and R-Tree in iOS and Windows "Universal" (8.1) versions
- Build ARM target with Function Level Linking ref: http://www.monkey-x.com/Community/posts.php?topic=7739
- SQLite3.Windows.vcxproj and SQLite3.WindowsPhone.vcxproj in their own directories to avoid problems due to temporary files

## 0.7.7

- include build of sqlite4java for Android x86_64 and arm-64
- clean publish to plugins.cordova.io

## 0.7.6

- Small fix to plugin id
- Disable use of gethostuuid() in sqlite3.c (only used in iOS version)
- published to plugins.cordova.io - [BUG] published extra junk in workarea, causing problems with Windows (Universal) version

## 0.7.5

- Windows (Universal) version now supports both Windows 8.1 and Windows Phone 8.1
- iOS and Windows versions are now built with sqlite 3.8.9 embedded
- Improved locking style and other optimizations applied for iOS version

## 0.7.4

- iOS and Windows (8.1) versions built to keep non-essential temporary sqlite files in memory
- Option to use legacy Android database library, with Android locking/closing issue (BUG #193) workaround included again

## 0.7.3

- insertId & rowsAffected implemented for Windows (8.1)
- plugin id changed

## 0.7.2

- Android version with sqlite4java (sqlite 3.8.7 embedded), which solves BUG #193: Android closing/locking issue (ICU-UNICODE integration is now missing)
- iOS version fixed to override the correct pluginInitialize method and built with sqlite 3.8.8.3 embedded

## 0.7.1

- Project renamed
- Initial version for Windows (8.1) [with sqlite 3.8.8.3 embedded]
- Abort initially pending transactions for db handle (due to incorrect password key, for example) [from Cordova-sqlcipher-storage]
- WP7 build enabled (NOT TESTED)

## 1.0.6

- Proper handling of transactions that may be requested before the database open operation is completed
- Report an error upon attempt to close a database handle object multiple times.

## 1.0.5

- Workaround for Android db locking/closing issue
- Fix double-precision REAL values in result (iOS version)
- Fix query result truncation in case of NULL character (\0 or \u0000) (iOS version)
- Convert array SQL parameters to string, according to match Web SQL spec
- Fix closing of Android database
- Some fixes for SQL API error handling to be consistent with Web SQL

## 1.0.4

- Pre-populated database option (Android/iOS)
- Option to select database location to disable iCloud backup (iOS ONLY)
- Safeguard against closing of database while transaction is pending
- Fix to prevent double marshaling of data

## 1.0.3

- Fixed issue with multi-page apps on Android (due to problem when closing & re-opening app)

## 1.0.2

- Workaround for issue with multiple UPDATE statements WP(8) (#128)

## 1.0.1

- Support Cordova 3.3.0/3.4.0 to support Amazon-FireOS
- Fixes for WP(8):
  - use one thread per db to solve open/close/delete issues
  - fix integer data binding
- Fix open/close callbacks Android & WP(8)
- Resolve issue with INSERT OR IGNORE (Android)
