#!/bin/bash
#
# Automated cordova tests.  Installs the correct cordova platform,
# installs the plugin, installs the test app, and then runs it on
# a device or emulator.
#
# usage: ./bin/test.sh [android|ios]
#

# N.B. if you functionally change this script you _must_ change ./bin/test.ps1 too.

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

# take the last part of coffee -v which is the version number
version="${$(coffee -v)##* }"

# compare version to 1.7.0 which supports the --no-header option
# the trick here is to make a string comparison by removing the dot
# if version is 1.6.3 then ${version//\./} will equal 163
if [[ "${version//\./}" -lt "170" ]]; then
  echo "you have an older version (<1.7.0) of coffeescript which does not support --no-header option"
  echo "Upgrade your coffeescript:"
  echo "npm install -g coffee-script"
  exit 1
fi

if [[ ! -x $(which cordova) ]]; then
  echo "you need cordova. please install with:"
  echo "npm install -g cordova"
  exit 1
fi

cd test-www
if [[ $? != 0 ]]; then # run from the bin/ directory
  cd ../test-www
fi

# compile coffeescript
coffee --no-header -cl -o ../www ../SQLitePlugin.coffee.md

if [[ $? != 0 ]]; then
  echo "coffeescript compilation failed"
  exit 1
fi
echo "compiled coffeescript to javascript"

# move everything to a temp folder to avoid infinite recursion errors
rm -fr ../.plugin
mkdir -p ../.plugin
cp -r ../src ../plugin.xml ../www ../.plugin

# update the plugin, run the test app
cordova platform add $platform
cordova plugin rm com.phonegap.plugins.sqlite
cordova plugin add ../.plugin
cordova run $platform
