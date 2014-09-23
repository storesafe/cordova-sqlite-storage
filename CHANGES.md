# Changes

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

