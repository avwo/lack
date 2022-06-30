const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');

const logFile = path.join(process.pwd(), '.console.log');

const touch = () => {
  try {
    const now = new Date();
    fs.utimesSync('package.json', now, now); // eslint-disable-line
  } catch (e) {}
};

const register = () => {
  setTimeout(register, 30000);
};

const showLog = () => {
  setTimeout(showLog, 100);
};

module.exports = (dirs) => {
  const watchList = ['index.js', 'rules.txt', '_rules.txt', 'reqRules.txt', 'resRules.txt', 'lib', 'dist'];
  if (dirs && typeof dirs === 'string') {
    dirs.split(',').forEach((dir) => {
      dir = dir.trim();
      if (dir && watchList.indexOf(dir) === -1) {
        watchList.push(dir);
      }
    });
  }
  let timer;
  console.log(`Watching the following files/folders changes:\n${watchList.join('\n')}\n`); // eslint-disable-line
  chokidar.watch(watchList, {
    ignored: /(^|[/\\])(\..|node_modules([/\\]|$))/,
  }).on('raw', (_, filename) => {
    if (filename.includes('package.json')) {
      return;
    }
    clearTimeout(timer);
    timer = setTimeout(() => {
      console.log(`${filename} is changed.`); // eslint-disable-line
      touch();
    }, 1000);
  }).on('error', () => {});
  try {
    fs.unlinkSync(logFile); // eslint-disable-line
  } catch (e) {}
  touch();
  register();
  setTimeout(showLog, 100);
};
