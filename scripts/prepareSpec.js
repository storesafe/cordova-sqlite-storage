require('shelljs/global');

rm('-rf', 'spec/myplugin');
rm('-rf', 'spec/plugins');
rm('-rf', 'spec/platforms');
mkdir('spec/myplugin')
cp('-R', 'package.json', 'plugin.xml', 'scripts', 'src', 'www', 'spec/myplugin');

cd('spec');

exec('cordova plugin add myplugin');
