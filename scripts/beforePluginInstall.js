// Adapted from:
// https://github.com/AllJoyn-Cordova/cordova-plugin-alljoyn/blob/master/scripts/beforePluginInstall.js

const path = require('path');
const exec = require('child_process').exec;

const packageName = require('../package.json').name;

module.exports = function () {
    return new Promise(function (resolve, reject) {
        console.log('installing external dependencies via npm');
        console.log('for package name: ' + packageName);

        exec('npm install', { cwd: path.join('plugins', packageName) },
            function (error, stdout, stderr) {
                if (error !== null) {
                    console.log('npm install of external dependencies failed with error message: ' + error.message);
                    reject();
                } else {
                    console.log('npm install of external dependencies ok');
                    resolve();
                }
            }
        );
    });
};
