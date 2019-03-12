const path = require('path');

const fs = require('fs-extra');

const spawn = require('cross-spawn');

console.info('Removing any old artifacts from spec');

fs.removeSync('spec/myplugin');
fs.removeSync('spec/plugins');
fs.removeSync('spec/platforms');

const myplugin = path.join('spec', 'myplugin');

console.info('Copying plugin artifacts into ' + myplugin);

fs.ensureDirSync(myplugin);

['package.json', 'plugin.xml'].forEach((src) => {
  const dest = path.join(myplugin, src);
  fs.copySync(src, dest);
});

['scripts', 'src', 'www'].forEach((src) => {
  const dest = path.join(myplugin, src);
  fs.ensureDirSync(dest);
  fs.copySync(src, dest);
});

const args = 'plugin add myplugin';

console.log('Spawning Cordova CLI in `spec` with the following arguments: ' + args);

spawn.sync('cordova', args.split(' '), {
  cwd: 'spec',
  stdio: 'inherit',
});

console.info('The spec is now ready to test a copy of this plugin.');
console.info('Please do `cd spec` and then use `cordova platform add` to add each desired platform.');
