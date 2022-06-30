const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');

const ROOT = process.cwd();
const logFile = path.join(ROOT, '.console.log');
let start = 0;

const touch = () => {
  try {
    const now = new Date();
    fs.utimesSync('package.json', now, now); // eslint-disable-line
  } catch (e) {}
};

const register = () => {
  setTimeout(register, 30000);
};

const readLog = () => {
  let reader = fs.createReadStream(logFile, { start });
  const onEnd = () => {
    if (!reader) {
      return;
    }
    reader = null;
    setTimeout(readLog, 100);
  };
  reader.on('data', (chunk) => {
    start += chunk.length;
    process.stdout.write(chunk);
  });
  reader.once('end', onEnd);
  reader.on('error', onEnd);
};

module.exports = (dirs) => {
  try {
    fs.unlinkSync(logFile); // eslint-disable-line
  } catch (e) {}
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
    if (filename.includes('package.json') || filename.includes('.console.log')) {
      return;
    }
    clearTimeout(timer);
    timer = setTimeout(() => {
      console.log(''); // eslint-disable-line
      console.log(`${filename} is changed.`); // eslint-disable-line
      touch();
    }, 1000);
  }).on('error', () => {});
  touch();
  register();
  setTimeout(readLog, 100);
};
