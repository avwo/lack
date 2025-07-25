const inquirer = require('inquirer');
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
/* eslint-disable no-sync */
let type = 'ts';
let srcDir = 'src';
let curHooks = {};
let curType;
let hasHooks;
const ROOT = path.join(__dirname, '../');
const NAME_RE = /^(@[a-z\d_-]+\/)?(whistle\.)?([a-z\d_-]+)$/;
const NAME_TIPS = 'Plugin name must match either \'whistle.[a-z0-9_-]+\' or \'@scope/whistle.[a-z0-9_-]+\'';
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
  return { ...pkg };
};

const copySync = (src, dest) => {
  const d = dest || src;
  if (!fs.existsSync(d)) {
    fse.copySync(path.join(ROOT, src), d);
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
  const template = curType ? TEMPLATES[curType === 'ts' ? 0 : 1] : (await inquirer.prompt([
    {
      type: 'list',
      name: 'template',
      default: fs.existsSync('lib') ? TEMPLATES[1] : TEMPLATES[0],
      message: 'Select template:',
      choices: TEMPLATES,
    },
  ])).template;
  if (template === 'TypeScript') {
    return template;
  }
  type = 'js';
  srcDir = 'lib';
  return 'JavaScript';
};

const selectAuth = async () => {
  let { auth } = curHooks;
  if (!hasHooks) {
    auth = (await inquirer.prompt([
      {
        type: 'confirm',
        name: 'auth',
        default: false,
        message: 'Do you need auth function?',
      },
    ])).auth;
  }
  return auth && `${srcDir}/auth.${type}`;
};

const selectSni = async () => {
  let { sni } = curHooks;
  if (!hasHooks) {
    sni = (await inquirer.prompt([
      {
        type: 'confirm',
        name: 'sni',
        default: false,
        message: 'Do you need sniCallback function?',
      },
    ])).sni;
  }
  return sni && `${srcDir}/sniCallback.${type}`;
};

const selectUIServer = async () => {
  let { uiServer } = curHooks;
  if (!hasHooks) {
    uiServer = (await inquirer.prompt([
      {
        type: 'confirm',
        name: 'uiServer',
        default: false,
        message: 'Do you need uiServer?',
      },
    ])).uiServer;
  }
  return uiServer && `${srcDir}/uiServer`;
};

const setHookFile = (hooks) => {
  const servers = {};
  if (hooks) {
    hooks.forEach((hook) => {
      servers[hook] = `${srcDir}/${hook}.${type}`;
    });
  }
  return servers;
};

const selectRulesServers = async () => {
  let { rulesServers } = curHooks;
  if (!hasHooks) {
    rulesServers = (await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'rulesServers',
        message: 'Select rules servers:',
        choices: RULES_SERVERS,
      },
    ])).rulesServers;
  }
  return setHookFile(rulesServers);
};

const selectStatsServers = async () => {
  let { statsServers } = curHooks;
  if (!hasHooks) {
    statsServers = (await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'statsServers',
        message: 'Select stats servers:',
        choices: STATS_SERVERS,
      },
    ])).statsServers;
  }
  return setHookFile(statsServers);
};

const selectPipeServers = async () => {
  let { pipeServers } = curHooks;
  if (!hasHooks) {
    pipeServers = (await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'pipeServers',
        message: 'Select pipe servers:',
        choices: PIPE_SERVERS,
      },
    ])).pipeServers;
  }
  const hooks = [];
  if (pipeServers) {
    pipeServers.join('+').split('+').forEach((hook) => {
      const h = hook.trim();
      if (h) {
        hooks.push(h);
      }
    });
  }
  return setHookFile(hooks);
};

const selectRulesFiles = async () => {
  let { rulesFiles } = curHooks;
  if (!hasHooks) {
    rulesFiles = (await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'rulesFiles',
        message: 'Select rules files:',
        choices: RULES_FILES,
      },
    ])).rulesFiles;
  }
  const result = {};
  if (rulesFiles) {
    rulesFiles.forEach((hook) => {
      result[hook] = hook;
    });
  }
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

const setPackage = (pkg, hasUIServer, hasJs) => {
  const newPkg = type === 'js' ? JS_PKG : TS_PKG;
  const keys = hasJs ? ['scripts', 'devDependencies'] : [];
  if (hasUIServer) {
    keys.push('dependencies', 'tsTypes');
  }
  keys.forEach((key) => {
    const newValue = newPkg[key];
    const k = key === 'tsTypes' ? 'devDependencies' : key;
    const value = pkg[k];
    if (!newValue) {
      return;
    }
    if (!value) {
      pkg[k] = newValue;
      return;
    }
    Object.keys(newValue).forEach((name) => {
      value[name] = value[name] || newValue[name];
    });
  });
};

const trim = (str) => (typeof str === 'string' ? str.trim() : str);

const getHooks = (hook) => {
  const result = {};
  const hooks = typeof hook === 'string' ? hook.trim().toLowerCase() : null;
  if (!hooks) {
    return result;
  }
  const addItem = (prop, name) => {
    const list = result[prop] || [];
    result[prop] = list;
    if (list.indexOf(name) === -1) {
      list.push(name);
    }
  };
  hooks.split(/[^._a-z]/i).forEach((name) => {
    const h = name.trim();
    if (h === 'empty' || h === 'blank' || h === 'none') {
      result.empty = true;
      return;
    }
    if (h === 'ts' || h === 'typescript') {
      curType = 'ts';
      return;
    }
    if (h === 'js' || h === 'javascript') {
      curType = 'js';
      return;
    }
    if (h === 'rules' || h === 'rules.txt') {
      addItem('rulesFiles', 'rules.txt');
      return;
    }
    if (h === '_rules' || h === '_rules.txt' || h === 'reqrules' || h === 'reqrules.txt') {
      addItem('rulesFiles', '_rules.txt');
      return;
    }
    if (h === 'resrules' || h === 'resrules.txt') {
      addItem('rulesFiles', 'resRules.txt');
      return;
    }

    if (h === 'uiserver') {
      result.uiServer = true;
      return;
    }

    if (h === 'auth' || h === 'verify') {
      result.auth = true;
      return;
    }

    if (h === 'snicallback' || h === 'sni') {
      result.sni = true;
      return;
    }

    if (h === 'server') {
      addItem('pipeServers', 'server');
      return;
    }

    if (h === 'rulesserver') {
      addItem('rulesServers', 'rulesServer');
      return;
    }

    if (h === 'tunnelrulesserver') {
      addItem('rulesServers', 'tunnelRulesServer');
      return;
    }

    if (h === 'resrulesserver') {
      addItem('rulesServers', 'resRulesServer');
      return;
    }
    if (h === 'statsserver') {
      addItem('statsServers', 'statsServer');
      return;
    }
    if (h === 'resstatsserver') {
      addItem('statsServers', 'resStatsServer');
      return;
    }

    const isPipe = h === 'pipe';
    const pipeTunnel = h === 'pipetunnel' || h === 'tunnelpipe';
    const pipeHtttp = h === 'pipehttp' || h === 'httppipe';
    const pipeWs = h === 'pipews' || h === 'wspipe';

    if (isPipe || pipeTunnel || h === 'pipetunnelreq' || h === 'tunnelreqpipe' || h === 'tunnelreqread' || h === 'tunnelreqwrite') {
      addItem('pipeServers', 'tunnelReqRead');
      addItem('pipeServers', 'tunnelReqWrite');
    }
    if (isPipe || pipeTunnel || h === 'pipetunnelres' || h === 'tunnelrespipe' || h === 'tunnelresread' || h === 'tunnelreswrite') {
      addItem('pipeServers', 'tunnelResRead');
      addItem('pipeServers', 'tunnelResWrite');
    }

    if (isPipe || pipeHtttp || h === 'pipereq' || h === 'reqpipe' || h === 'reqread' || h === 'reqwrite') {
      addItem('pipeServers', 'reqRead');
      addItem('pipeServers', 'reqWrite');
    }
    if (isPipe || pipeHtttp || h === 'piperes' || h === 'respipe' || h === 'resread' || h === 'reswrite') {
      addItem('pipeServers', 'resRead');
      addItem('pipeServers', 'resWrite');
    }

    if (isPipe || pipeWs || h === 'pipewsreq' || h === 'wsreqpipe' || h === 'wsreqread' || h === 'wsreqwrite') {
      addItem('pipeServers', 'wsReqRead');
      addItem('pipeServers', 'wsReqWrite');
    }
    if (isPipe || pipeWs || h === 'pipewsres' || h === 'wsrespipe' || h === 'wsresread' || h === 'wsreswrite') {
      addItem('pipeServers', 'wsResRead');
      addItem('pipeServers', 'wsResWrite');
    }
  });
  return result;
};

module.exports = async (hooks) => {
  const isBlank = hooks === 'blank' || hooks === 'empty';
  curHooks = isBlank ? {} : getHooks(hooks);
  hasHooks = isBlank || Object.keys(curHooks).length > 0;
  const pkg = getPackage();
  let defaultName;
  if (hasHooks && !curType) {
    curType = fs.existsSync('lib') ? 'js' : 'ts';
  }
  if (/^@[a-z\d_-]+\/whistle\.[a-z\d_-]+$/.test(pkg.name)) {
    defaultName = pkg.name;
  } else if (NAME_RE.test(path.basename(process.cwd()))) {
    defaultName = `${RegExp.$1 || ''}${RegExp.$2 || 'whistle.'}${RegExp.$3}`;
  }
  console.log('\nFor help see https://github.com/avwo/lack\n'); // eslint-disable-line
  const name = hasHooks ? defaultName : (await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Plugin Name:',
      default: defaultName,
      validate: (input) => NAME_RE.test(input) || NAME_TIPS,
    },
  ])).name;
  if (!NAME_RE.test(name)) {
    throw new Error(NAME_TIPS);
  }
  pkg.name = `${RegExp.$1 || ''}${RegExp.$2 || 'whistle.'}${RegExp.$3}`;
  const defaultVersion = pkg.version || '1.0.0';
  let version;
  let description;
  if (!hasHooks) {
    version = (await inquirer.prompt([
      {
        type: 'input',
        name: 'version',
        message: 'Version:',
        default: defaultVersion,
      },
    ])).version;
    description = (await inquirer.prompt([
      {
        type: 'input',
        name: 'description',
        message: 'Description:',
        default: pkg.description || null,
      },
    ])).description;
  }
  pkg.version = trim(version) || defaultVersion;
  pkg.description = trim(description) || pkg.description || '';
  pkg.whistleConfig = pkg.whistleConfig || {};

  const template = await selectTemplate();
  const uiServer = await selectUIServer();
  const authFn = await selectAuth();
  const sniCallback = await selectSni();
  const rulesServers = await selectRulesServers();
  const statsServers = await selectStatsServers();
  const pipeServers = await selectPipeServers();
  const rulesFiles = await selectRulesFiles();
  const msg = [`Plugin Name: ${pkg.name}`, `\nVersion: ${pkg.version}`,
    `\nDescription: ${pkg.description}`, `\nTemplate: ${template}`];
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
  const len = msg.length;
  if (len < 4) {
    return;
  }
  if (len === 4) {
    msg.pop();
  }
  let ok = hasHooks;
  if (!ok) {
    msg.push('\nIs this ok?');
    ok = (await inquirer.prompt([
      {
        type: 'confirm',
        name: 'ok',
        message: msg.join('\n'),
      },
    ])).ok;
    if (!ok) {
      return;
    }
  } else {
    console.log(msg.join('\n')); // eslint-disable-line
  }

  initReadme(pkg);
  copySync('assets/editorconfig', '.editorconfig');
  copySync('assets/gitignore', '.gitignore');
  copySync('assets/npmignore', '.npmignore');

  Object.keys(rulesFiles).forEach((file) => {
    copySync(`assets/${file}`, file);
  });

  const exportHooks = {};
  const isJs = type === 'js';
  const lib = isJs ? 'lib' : 'dist';
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
    const line = `exports.${hook} = require('${exportHooks[hook]}')${isJs ? '' : '.default'};\n`;
    if (indexFile.indexOf(line) === -1) {
      hasChanged = true;
      indexFile = `${indexFile || '\n'}${line}`;
    }
  });
  if (hasChanged) {
    fs.writeFileSync('index.js', indexFile);
  }
  setPackage(pkg, uiServer, hasChanged);
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, '  '));
  let showInstall = uiServer;
  if (!isJs && (hasChanged || !fs.existsSync('assets/ts/src/types'))) {
    showInstall = true;
    copySync('assets/ts/src/types/base.d.ts', 'src/types/base.d.ts');
    copySync('assets/ts/src/types/global.d.ts', 'src/types/global.d.ts');
    copySync('assets/ts/tsconfig.json', 'tsconfig.json');
  }
  if (showInstall) {
    console.log(`\nRun \`npm i\` to install dependencies\n`); // eslint-disable-line
  } else {
    console.log(); // eslint-disable-line
  }
};
