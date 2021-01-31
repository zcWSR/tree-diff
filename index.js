#!/usr/bin/env node

const os = require('os');
const path = require('path');
const { program } = require('commander');
const utils = require('./utils');
const config = require('./config');

const convertAlias = root => {
  if (typeof config.alias === 'function') {
    config.alias = config.alias(root);
    console.log(config.alias);
  }
};

const defaultOutputParams = { tree: true, list: true, useless: true };
const parseOutputParam = value => {
  if (!value) return defaultOutputParams;
  try {
    return value.split(',').reduce((result, curr) => {
      curr = curr.trim();
      if (curr) {
        result[curr] = true;
      }
      return result;
    }, {});
  } catch (e) {
    console.log(e);
    return defaultOutputParams;
  }
};

program
  .name('tree')
  .option('-r, --root <dir>', '待查找的根目录, 不写默认为当前目录')
  .option('-e, --entrance <file>', '入口文件, 不写默认为当前目录下的index.js')
  .option(
    '-o, --output <output>',
    '自定义输出内容: tree: 依赖树, list: 依赖列表, useless: 非依赖树, 不写默认全选'
  )
  .option('-s, --short', '精简模式, 直接输出diff结果');
program.parse(process.argv);

program.root = (program.root || process.cwd()).replace('~', os.homedir);
program.entrance = program.entrance || 'index.js';
program.output = parseOutputParam(program.output);

program.root = '/Users/zcwsr/my/blog-admin-v2.5';
program.entrance = './src/pages/entry.js';
program.output = { tree: true, list: true, useless: true };
const startPath = path.resolve(program.root, program.entrance);
convertAlias(program.root);
utils.addToTree(startPath, program.root);

if (program.short) {
  const uselessPathList = utils.getUselessPathList(program.root);
  uselessPathList.forEach(path => {
    console.log(path);
  });
  return;
}

if (program.output.tree) {
  console.log('// 依赖树');
  console.log(
    JSON.stringify(
      utils.pathTree,
      (key, value) => {
        if (!Object.keys(value).length) {
          return '';
        } else {
          return value;
        }
      },
      2
    )
  );
  console.log('\n\n');
}
if (program.output.list) {
  console.log('// 依赖列表');
  const list = Object.keys(utils.pathMap);
  console.log(JSON.stringify(list, null, 2));
  console.log(`文件数: ${list.length}`);
  console.log('\n\n');
}

if (program.output.useless) {
  console.log('// 非依赖树');
  const useless = utils.getUselessPathTree(program.root);
  console.log(
    JSON.stringify(
      useless,
      (key, value) => {
        if (!Object.keys(value).length) {
          return '';
        } else {
          return value;
        }
      },
      2
    )
  );
}
