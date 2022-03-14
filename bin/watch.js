const chokidar = require('chokidar');
const fs = require('fs');

const touch = () => {
  try {
    const now = new Date();
    fs.utimesSync('package.json', now, now); // eslint-disable-line
  } catch (e) {}
};

module.exports = (dirs) => {
  let watchList = ['index.js', 'rules.txt', '_rules.txt', 'reqRules.txt', 'resRules.txt', 'lib'];
  if (dirs && typeof dirs === 'string') {
    dirs.split(',').forEach((dir) => {
      dir = dir.trim();
      if (dir && watchList.indexOf(dir) === -1) {
        watchList.push(dir);
      }
    });
  }
  watchList = watchList.filter((file) => {
    try {
      // eslint-disable-next-line no-sync
      fs.statSync(file);
      return true;
    } catch (error) {
    }
    return false;
  });
  // 如果watchList为空，就监听整个目录
  if (watchList.length === 0) {
    watchList = ['.'];
  }
  let timer;
  console.log(`Watching: ${watchList.join()}`); // eslint-disable-line
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
  touch();
};
