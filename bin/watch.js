const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
const os = require('os');
const fse = require('fs-extra');
/* eslint-disable no-sync */
const HOME_DIR_RE = /^[~～]\//;
const PLUGIN_NAME_RE = /^(?:@[\w-]+\/)?(whistle\.[a-z\d_-]+)$/;
const REL_RE = /^\.\.[\\/]+/;

const getWhistlePath = () => {
  const dir = process.env.WHISTLE_PATH;
  if (dir) {
    return HOME_DIR_RE.test(dir) ? path.join(os.homedir(), `.${dir.substring(1)}`) : dir;
  }
  return path.join(os.homedir(), '.WhistleAppData');
};

const DEV_PLUGINS = path.join(getWhistlePath(), 'dev_plugins');
const ROOT = process.cwd();
const pkgFile = path.join(ROOT, 'package.json');
const logFile = path.join(ROOT, '.console.log');
let start = 0;

const touch = () => {
  try {
    const now = new Date();
    fs.utimesSync('package.json', now, now); // eslint-disable-line
  } catch (e) {}
};

const register = () => {
  try {
    let { name } = fse.readJSONSync(pkgFile);
    if (PLUGIN_NAME_RE.test(name)) {
      name = RegExp.$1;
      fs.writeFileSync(path.join(DEV_PLUGINS, name), `${Date.now()}\n${ROOT}`);
    }
  } catch (e) {}
  setTimeout(register, 6000);
};

const getLogSize = () => {
  try {
    return fs.statSync(logFile).size;
  } catch (e) {
    if (e.code === 'ENOENT') {
      return 0;
    }
  }
  return -1;
};

const readLog = () => {
  if (start > 0) {
    const size = getLogSize();
    if (size >= 0 && start > size) {
      start = size;
    }
  }
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
  fse.ensureDirSync(DEV_PLUGINS);
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
  const paths = [];
  const cwd = process.cwd();
  const tips = watchList.map((name, i) => {
    paths.push(path.resolve(cwd, name));
    return `${i + 1}. ${name}`;
  }).join('\n');
  const len = paths.length;
  const inWatchList = (filename) => {
    for (let i = 0; i < len; i++) {
      if (!REL_RE.test(path.relative(paths[i], filename))) {
        return true;
      }
    }
  };
  console.log(`Watching the following files/folders changes:\n${tips}`); // eslint-disable-line
  console.log('\n*********************************************\n'); // eslint-disable-line
  chokidar.watch(watchList, {
    ignored: /(^|[/\\])(\..|node_modules([/\\]|$))/,
  }).on('raw', (_, filename) => {
    if (filename.includes('package.json') || filename.includes('.console.log') || !inWatchList(filename)) {
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
