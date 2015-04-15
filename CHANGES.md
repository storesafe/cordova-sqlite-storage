# Changes

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

