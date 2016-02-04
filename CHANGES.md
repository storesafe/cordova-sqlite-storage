# Changes

## 0.x.x-xx

- Echo test function
- Remove extra runInBackground: step from iOS version
- Android-sqlite-connector (NDK) support removed from this version branch
- Windows version removed from this version branch
- Move Android version to io.sqlc package

## 0.7.2-common-dev

- All iOS operations are now using background processing (reported to resolve intermittent problems with cordova-ios@4.0.1)

## 0.7.1-common-dev

- REGEXP support removed from this version branch
- Rename Windows C++ Database close function to closedb to resolve conflict for Windows Store certification
- Pre-populated database support removed from this version branch
- Amazon Fire-OS support removed
- Fix conversion warnings in iOS version
- Fix to Windows "Universal" version to support big integers
- Implement database close and delete operations for Windows "Universal"
- Fix readTransaction to skip BEGIN/COMMIT/ROLLBACK
