#!/bin/bash
#
# Automated cordova tests.  Installs the correct cordova platform,
# installs the plugin, installs the test app, and then runs it on
# a device or emulator.
#
# usage: ./bin/test.sh [android|ios]
#

platform=$1

if [[ -z $platform ]]; then
  echo "usage: ./bin/test.sh [android|ios]"
  exit 1
fi

cd test-www
if [[ $? != 0 ]]; then
  cd ../test-www
fi

cordova platform add $platform
cordova plugin rm com.phonegap.plugins.sqlite
cordova plugin add ../plugin
cordova run $platform
