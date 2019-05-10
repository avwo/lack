const chokidar = require('chokidar');
const fs = require('fs');

module.exports = (dirs) => {
  const watchList = ['index.js', 'rules.txt', '_rules.txt', 'reqRules.txt', 'resRules.txt', 'lib'];
  if (dirs && typeof dirs === 'string') {
    dirs.split(',').forEach((dir) => {
      dir = dir.trim();
      if (dir && watchList.indexOf(dir) === -1) {
        watchList.push(dir);
      }
    });
  }
  let timer;
  console.log(`Watching: ${watchList.join()}`); // eslint-disable-line
  chokidar.watch(watchList, {
    ignored: /(^|[/\\])(\..|node_modules([/\\]|$))/,
  }).on('raw', (_, filename) => {
    if (filename === 'package.json') {
      return;
    }
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        console.log(`${filename} is changed.`); // eslint-disable-line
        const now = new Date();
        fs.utimesSync('package.json', now, now); // eslint-disable-line
      } catch (e) {}
    }, 1000);
  }).on('error', () => {});
};
