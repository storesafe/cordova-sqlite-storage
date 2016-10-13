#!/bin/bash
#
# Automated cordova tests.  Installs the correct cordova platform,
# installs the plugin, installs the test app, and then runs it on
# a device or emulator.
#
# usage: ./bin/test.sh [android|ios]
#
# N.B. if you functionally change this script you _must_ change .\bin\test.sh too.
#

platform=$1

if [[ -z $platform ]]; then
  echo "usage: ./bin/test.sh [android|ios]"
  exit 1
fi

if [[ ! -x $(which coffee) ]]; then
  echo "you need coffeescript. please install with:"
  echo "npm install -g coffee-script"
  exit 1
fi

if [[ ! -x $(which cordova) ]]; then
  echo "you need cordova. please install with:"
  echo "npm install -g cordova"
  exit 1
fi

cd spec
if [[ $? != 0 ]]; then # run from the bin/ directory
  cd ../spec
fi

# compile coffeescript
coffee --no-header -cl -o ../www ../SQLitePlugin.coffee.md

if [[ $? != 0 ]]; then
  echo "coffeescript compilation failed"
  exit 1
fi
echo "compiled coffeescript to javascript"

# move everything to a temp folder to avoid infinite recursion errors
rm -fr myplugin
mkdir -p myplugin
cp -r ../scripts ../src ../plugin.xml ../package.json ../www myplugin

# cleanup old test
rm -fr plugins platforms

# update the plugin, run the test app
cordova platform add $platform
#cordova plugin rm com.brodysoft.sqlitePlugin
cordova plugin add myplugin
cordova run $platform
