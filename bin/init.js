const inquirer = require('inquirer');
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
/* eslint-disable no-sync */
let type = 'ts';
let srcDir = 'src';
const ROOT = path.join(__dirname, '../');
const NAME_RE = /^(@[a-z\d_-]+\/)?(whistle\.)?([a-z\d_-]+)$/;
const NAME_TIPS = 'The plugin name can only contain [a~z0~9_-].';
const TS_PKG = fse.readJSONSync(path.join(ROOT, 'assets/ts/package.json'));
const JS_PKG = fse.readJSONSync(path.join(ROOT, 'assets/js/package.json'));
const TEMPLATES = [
  'TypeScript',
  'JavaScript',
];
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

const getPackage = () => {
  let pkg;
  try {
    pkg = fse.readJSONSync('package.json');
  } catch (e) {}
  return Object.assign({}, pkg);
};

const copySync = (src, dest) => {
  dest = dest || src;
  if (!fs.existsSync(dest)) {
    fse.copySync(path.join(ROOT, src), dest);
  }
};

const initReadme = (pkg) => {
  if (!fs.existsSync('README.md')) {
    const title = pkg.name.substring(pkg.name.indexOf('/') + 1);
    fs.writeFileSync('README.md', `# ${title}\n`);
  }
};

const readIndexFile = () => {
  try {
    const text = fs.readFileSync('index.js', { encoding: 'utf8' }).trim();
    return text && `${text}\n`;
  } catch (e) {}
  return '';
};

const selectTemplate = async () => {
  const { template } = await inquirer.prompt([
    {
      type: 'list',
      name: 'template',
      message: 'Select template:',
      choices: TEMPLATES,
    },
  ]);
  if (template === 'TypeScript') {
    return template;
  }
  type = 'js';
  srcDir = 'lib';
  return 'JavaScript';
};

const selectAuth = async () => {
  const { auth } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'auth',
      message: 'Do you need auth function?',
    },
  ]);
  return auth && `${srcDir}/auth.${type}`;
};

const selectSni = async () => {
  const { sni } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'sni',
      message: 'Do you need sniCallback function?',
    },
  ]);
  return sni && `${srcDir}/sniCallback.${type}`;
};

const selectUIServer = async () => {
  const { uiServer } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'uiServer',
      message: 'Do you need uiServer?',
    },
  ]);
  return uiServer && `${srcDir}/uiServer`;
};

const setHookFile = (hooks) => {
  const servers = {};
  hooks.forEach((hook) => {
    servers[hook] = `${srcDir}/${hook}.${type}`;
  });
  return servers;
};

const selectRulesServers = async () => {
  const { rulesServers } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'rulesServers',
      message: 'Select rules servers:',
      choices: RULES_SERVERS,
    },
  ]);
  return setHookFile(rulesServers);
};

const selectStatsServers = async () => {
  const { statsServers } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'statsServers',
      message: 'Select stats servers:',
      choices: STATS_SERVERS,
    },
  ]);
  return setHookFile(statsServers);
};

const selectPipeServers = async () => {
  const { pipeServers } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'pipeServers',
      message: 'Select pipe servers:',
      choices: PIPE_SERVERS,
    },
  ]);
  const hooks = [];
  pipeServers.join('+').split('+').forEach((hook) => {
    hook = hook.trim();
    if (hook) {
      hooks.push(hook);
    }
  });
  return setHookFile(hooks);
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
    msg.push('');
    msg.push(tips);
    keys.forEach((key) => msg.push(`    ${key}`));
  }
};

const setPackage = (pkg, hasUIServer) => {
  const newPkg = type === 'js' ? JS_PKG : TS_PKG;
  const keys = ['scripts', 'devDependencies'];
  if (hasUIServer) {
    keys.push('dependencies');
  }
  keys.forEach((key) => {
    const value = pkg[key];
    const newValue = newPkg[key];
    if (!newValue) {
      return;
    }
    if (!value) {
      pkg[key] = newValue;
      return;
    }
    Object.keys(newValue).forEach((name) => {
      if (!value[name]) {
        value[name] = newValue[name];
      }
    });
  });
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

  const template = await selectTemplate();
  const uiServer = await selectUIServer();
  const authFn = await selectAuth();
  const sniCallback = await selectSni();
  const rulesServers = await selectRulesServers();
  const statsServers = await selectStatsServers();
  const pipeServers = await selectPipeServers();
  const rulesFiles = await selectRulesFiles();
  const msg = [`\n\n\nPlugin Name: ${pkg.name}`, `\nTemplate: ${template}`];
  if (authFn) {
    msg.push('\nAuth function: Yes');
  }
  if (sniCallback) {
    msg.push('\nSNI Callback function: Yes');
  }
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

  initReadme(pkg);
  copySync('.editorconfig');
  copySync('.gitignore');
  copySync('.npmignore');

  Object.keys(rulesFiles).forEach((file) => {
    copySync(`assets/${file}`, file);
  });

  const exportHooks = {};
  const lib = type === 'js' ? 'lib' : 'dist';
  if (uiServer) {
    exportHooks.uiServer = `./${lib}/uiServer`;
    copySync(`assets/${type}/${uiServer}`, uiServer);
    copySync('assets/public/index.html', 'public/index.html');
  }
  if (authFn) {
    exportHooks.auth = `./${lib}/auth`;
    copySync(`assets/${type}/${authFn}`, authFn);
  }
  if (sniCallback) {
    exportHooks.sniCallback = `./${lib}/sniCallback`;
    copySync(`assets/${type}/${sniCallback}`, sniCallback);
  }
  const servers = Object.assign(rulesServers, statsServers, pipeServers);
  Object.keys(servers).forEach((server) => {
    exportHooks[server] = `./${lib}/${server}`;
    const file = servers[server];
    copySync(`assets/${type}/${file}`, file);
  });

  let indexFile = readIndexFile();
  let hasChanged;
  Object.keys(exportHooks).forEach((hook) => {
    const line = `exports.${hook} = require('${exportHooks[hook]}');\n`;
    if (indexFile.indexOf(line) === -1) {
      hasChanged = true;
      indexFile = `${indexFile || '\n'}${line}`;
    }
  });
  if (hasChanged) {
    fs.writeFileSync('index.js', indexFile);
  }
  setPackage(pkg, uiServer);
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, '  '));
  console.log('\n\nFor help see https://github.com/avwo/lack\n\n'); // eslint-disable-line
};
