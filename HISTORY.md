# History

## Overall

@brodybits (Christopher J. Brody aka Chris Brody) assembled the project in April 2012
from the following parts:
- DroidGap SQLite Storage Java and Javascript parts
- Phonegap-SQLitePlugin for iOS by @davibe (Davide Bertola <dade@dadeb.it>) and
  @joenoon (Joe Noon <joenoon@gmail.com>)

@brodybits has been maintaining this project with a number of bug fixes and other improvements.

A number of contributions have been integrated. The most important contributors are explicitly
mentioned in AUTHORS.md.

## 2009-2010

DroidGap Storage Java and Javascript parts were initially added in December 2009.

## 2011

Phonegap-SQLitePlugin for iOS was started by @davibe in June 2011.

In September 2011 @joenoon rewrote the Javascript (using CoffeeScript) and added a
Lawnchair adapter.

## 2012

The original Phonegap-SQLitePlugin for iOS had a major deviation from the Web SQL API draft.
While the Web SQL API draft keeps the sql and the parameters array as separate parameters,
the original Phonegap-SQLitePlugin combined the sql and parameters in a single array.
This project as assembled by @brodybits keeps the sql and parameters array as separate
parameters to follow the Web SQL API draft more closely.

@marcucio (Mike Arcucio) contributed a major rework of the Android version to support
efficient batch processing.

For the first year the Javascript part was completely different for the iOS and
Android versions. @brodybits introduced a QUnit test suite, with some help from
the Lawnchair QUnit test suite as well as the usage sample by @joenoon and @davibe.

In October 2012 @ef4 (Edward Faulkner) reworked the Javascript for the iOS version
to implement the Web SQL failure-safe transaction semantics, along with some tests.

In December 2012 @brodybits split the project into separate Android and iOS parts
(merged back together in September 2013).

In December 2012 @marcucio (Mike Arcucio) made a WP8 version using CSharp-SQLite.

## 2013

In May 2013 @j3k0 (Jean-Christophe Hoelt <hoelt@fovea.cc>) contributed major changes
to the iOS version to work in Cordova 2.7 and support background processing.

In July 2013 @brodybits updated the Android version to use one background thread
per database and ported the failure-safe transaction semantics to work in the
Android version (with the help of CoffeeScript).

In August 2013 @brodybits fixed the iOS version to work with the Javascript from
the Android version.

In September 2013 @brodybits merged the Android version and iOS version to use the
same Javascript interface.

In September 2013 @brodybits published a fork of the WP8 version with a version
of the CSharp-SQLite source embedded.

Merge notes: The merged version from September 2013 has some of the early commits
repeated in history. This is because @brodybits removed the iOS sources from the
old Android version using the git filter-branch command.

## 2014

In July 2014 @Gillardo (Darren Gillard <darren.gillard81@gmail.com>) contributed an integration
of the WP8 version with background processing and improved transaction support.

Also in July 2014 @nolanlawson contributed a number of fixes and got this project
working with PouchDB. For example: introduction of nextTick to schedule actions to be taken
once the current HTML(5) event handler is finished.

In August 2014 Mark Oppenheim (<mark.oppenheim@mnetics.co.uk>) contributed the following:
- working open/close callbacks and repeated open/close/delete fixes for Android and WP8 versions
  (@brodybits fixed these for the iOS version);
- fixed WP8 version to use one thread per database.

NOTE: The WP8 version is currently supported in the Cordova-sqlite-legacy version.

## 2015

In January 2015 @aarononeal (Aaron Oneal <aaron.oneal@spicypixel.com>) raised PR #170 with a
number of fixes, including:
- Fix to prevent double marshaling of data.
- Fix test runner to use correct plugin id (subsequently broken by @brodybits).
- Fix database close conditions and unit test (reject attempt to close database
  the middle of a transaction).
- Propagate statement failures to transaction failures (in the case when a
  statement error handler does not return false).
- Fix transaction and statement errors to conform to SQLError.
- Fix warning regarding test runner viewport format.
- Fix executeSql to throw on finalized transactions.
- Reproduce & fix truncation in iOS query result string encoding
  (in case of UNICODE \u0000 character in the middle).

In addition, PR #170 includes a two-way SQL blob marshalling mechanism that is still under
consideration.

Other major changes by @brodybits in 2015:
- Porting of the existing test suite to work within the Jasmine framework.
- Introduction of workaround for Android locking bug.
- Introduction of Windows target version (Windows 8.0/Windows 8.1/Windows Phone 8.1),
  which is now available in cordova-sqlite-ext and Cordova-sqlite-legacy version projects.
- Introduction of lightweight Android-sqlite-connector database library, which is
  now available in cordova-sqlite-ext and Cordova-sqlite-legacy version projects.
- Use of Circle CI (Android version) and Travis CI (iOS version).
- Introduction of other version projects:
  - Cordova-sqlcipher-adapter
  - cordova-sqlite-ext with REGEXP and pre-populated database support
  - Enterprise version with memory fix and other enhancements,
    available under GPL or commercial licensing options
- react-native-sqlite-storage version for Android and iOS developed and maintained
  by @andpor (Andrzej Porebski <fkuciapa@yahoo.com>), based on this project

## Major changes 2016

New features:
- Echo self-test function
- Simple sql batch query interface

Installation changes
- Use of `before_plugin_install` hook to install external dependencies

New versions introduced
- Cordova-sqlite-evcore-extbuild-free with major performance and memory fixes for Android,
  available under GPL or commercial licensing options with support for PhoneGap Build
- Cordova-sqlite-evplus (legacy) versions with GPL or premium commercial licensing options

## Recent changes

See CHANGES.md
