#! /usr/bin/env node
const program = require('commander');
const init = require('./init');
const watch = require('./watch');
const conf = require('../package.json');

let bingo;

program
  .version(conf.version)
  .command('init')
  .description('create whistle plugin project.')
  .action(() => {
    bingo = true;
    init();
  });

program
  .command('watch [dirs]')
  .description('enter watch mode, which reload plugin on file change.')
  .action((dirs) => {
    bingo = true;
    watch(dirs);
  });

program.parse(process.argv);

if (!bingo) {
  console.log(`Type '${conf.name} --help' for usage.`);  // eslint-disable-line
}
