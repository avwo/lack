const inquirer = require('inquirer');
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
/* eslint-disable no-sync */
const ASSETS_DIR = path.join(__dirname, '../assets');
const NAME_RE = /^(@[a-z\d_-]+\/)?(whistle\.)?([a-z\d_-]+)$/;
const NAME_TIPS = 'The plugin name can only contain a~z, 0~9, _ and -.';
const RULES_SERVERS = [
  'rulesServer',
  'tunnelRulesServer',
  'resRulesServer',
];
const STATS_SERVERS = [
  'statsServer',
  'resStatsServer',
];
const PIPE_SERVERS = [
  'server',
  'reqRead + reqWrite',
  'resRead + resWrite',
  'wsReqRead + wsReqWrite',
  'wsResRead + wsResWrite',
  'tunnelReqRead + tunnelReqWrite',
  'tunnelResRead + tunnelResWrite',
];
const RULES_FILES = [
  'rules.txt',
  '_rules.txt',
  'resRules.txt',
];
const UI_DEPS = {
  koa: '^2.7.0',
  'koa-bodyparser': '^4.2.1',
  'koa-onerror': '^4.1.0',
  'koa-router': '^7.4.0',
  'koa-static': '^5.0.0',
};

const getPackage = () => {
  let pkg;
  try {
    pkg = fse.readJSONSync('package.json');
  } catch (e) {}
  return Object.assign({}, pkg);
};

const selectUIServer = async () => {
  const { uiServer } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'uiServer',
      message: 'Do you need uiServer?',
    },
  ]);
  return uiServer && path.join(ASSETS_DIR, 'uiServer');
};

const selectRulesServers = async () => {
  const servers = {};
  const { rulesServers } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'rulesServers',
      message: 'Select rules servers:',
      choices: RULES_SERVERS,
    },
  ]);
  rulesServers.forEach((hook) => {
    servers[hook] = path.join(ASSETS_DIR, `${hook}.js`);
  });
  return servers;
};

const selectStatsServers = async () => {
  const servers = {};
  const { statsServers } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'statsServers',
      message: 'Select stats servers:',
      choices: STATS_SERVERS,
    },
  ]);
  statsServers.forEach((hook) => {
    servers[hook] = path.join(ASSETS_DIR, `${hook}.js`);
  });
  return servers;
};

const selectPipeServers = async () => {
  const servers = {};
  const { pipeServers } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'pipeServers',
      message: 'Select pipe servers:',
      choices: PIPE_SERVERS,
    },
  ]);
  pipeServers.join('+').split('+').forEach((hook) => {
    hook = hook.trim();
    if (hook) {
      servers[hook] = path.join(ASSETS_DIR, `${hook}.js`);
    }
  });
  return servers;
};

const selectRulesFiles = async () => {
  const result = {};
  const { rulesFiles } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'rulesFiles',
      message: 'Select rules files:',
      choices: RULES_FILES,
    },
  ]);
  rulesFiles.forEach((hook) => {
    result[hook] = hook;
  });
  return result;
};

const addMsg = (obj, msg, tips) => {
  const keys = Object.keys(obj);
  if (keys.length) {
    msg.push('\n');
    msg.push(tips);
    keys.forEach((key) => msg.push(`    ${key}`));
  }
};

const readIndexFile = () => {
  try {
    return fs.readFileSync('index.js', { encoding: 'utf8' });
  } catch (e) {}
  return '';
};

let done;
const ensureLibExist = () => {
  if (!done) {
    done = true;
    fse.ensureDirSync('lib');
  }
};

module.exports = async () => {
  const pkg = getPackage();
  let defaultName;
  if (/^@[a-z\d_-]+\/whistle\.[a-z\d_-]+$/.test(pkg.name)) {
    defaultName = pkg.name;
  } else if (NAME_RE.test(path.basename(process.cwd()))) {
    defaultName = `${RegExp.$1 || ''}${RegExp.$2 || 'whistle.'}${RegExp.$3}`;
  }
  console.log('\n\nFor help see https://github.com/avwo/lack\n\n'); // eslint-disable-line
  const { name } = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Plugin Name:',
      default: defaultName,
      validate: (input) => {
        return NAME_RE.test(input) || NAME_TIPS;
      },
    },
  ]);
  if (!NAME_RE.test(name)) {
    throw new Error(NAME_TIPS);
  }
  pkg.name = `${RegExp.$1 || ''}${RegExp.$2 || 'whistle.'}${RegExp.$3}`;
  pkg.version = pkg.version || '1.0.0';
  pkg.description = pkg.description || '';
  const uiServer = await selectUIServer();
  const rulesServers = await selectRulesServers();
  const statsServers = await selectStatsServers();
  const pipeServers = await selectPipeServers();
  const rulesFiles = await selectRulesFiles();
  const msg = [`\n\n\nPlugin Name: ${pkg.name}`];
  if (uiServer) {
    msg.push('\nUI Server: Yes');
  }
  addMsg(rulesServers, msg, 'Rules Servers:');
  addMsg(statsServers, msg, 'Stats Servers:');
  addMsg(pipeServers, msg, 'Pipe Servers:');
  addMsg(rulesFiles, msg, 'Rules Files:');
  msg.push('\nIs this ok?');
  const { ok } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'ok',
      message: msg.join('\n'),
    },
  ]);
  if (!ok) {
    return;
  }

  const exportsList = [];
  if (uiServer) {
    exportsList.push('exports.uiServer = require(\'./lib/uiServer\');');
    if (!fs.existsSync('lib/uiServer')) {
      ensureLibExist();
      fse.copySync(uiServer, 'lib/uiServer');
      pkg.dependencies = pkg.dependencies || {};
      Object.assign(pkg.dependencies, UI_DEPS);
    }
  }
  Object.keys(rulesFiles).forEach((file) => {
    file = rulesFiles[file];
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, '');
    }
  });
  const servers = Object.assign(rulesServers, statsServers, pipeServers);
  Object.keys(servers).forEach((server) => {
    exportsList.push(`exports.${server} = require('./lib/${server}');`);
    const destFile = `lib/${server}.js`;
    const srcFile = servers[server];
    if (!fs.existsSync(destFile)) {
      ensureLibExist();
      fse.copySync(srcFile, destFile);
    }
  });
  let indexFile = `${readIndexFile().trim()}\n`;
  exportsList.forEach((line) => {
    if (indexFile.indexOf(line) === -1) {
      indexFile = `${indexFile}${line}\n`;
    }
  });
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, '  '));
  if (indexFile) {
    fs.writeFileSync('index.js', indexFile);
  }
  console.log('\n\nFor help see https://github.com/avwo/lack\n\n'); // eslint-disable-line
};
