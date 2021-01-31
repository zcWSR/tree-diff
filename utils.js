const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const babelParser = require('@babel/parser');
const babelTraverse = require('@babel/traverse').default;
const t = require('@babel/types');
const config = require('./config');
const consts = require('./consts');

const excludeList = config.excludes || [];

const pathMap = {};
const pathTree = {};

// 引入路径的类型，相对、绝对、非用户路径
function getModuleType(module) {
  if (!module) return null;
  if (module.match(/^(\.)/)) return 'relative';
  if (module.match(/^\//)) return 'absolute';
  return 'module';
}

function isExclude(path) {
  return excludeList.some(exclude => !!path.match(exclude));
}

let aliasList = null;
function convertAlias(path) {
  if (!aliasList) {
    aliasList = Object.entries(config.alias || {});
  }
  return aliasList.reduce((result, alias) => result.replace(alias[0], alias[1]), path);
}

// 添加到树状图
function addToTreeMap(path, treeMap) {
  let temp = treeMap;
  path.split('/').forEach(path => {
    if (!path) return;
    if (!temp[path]) {
      temp[path] = {};
    }
    temp = temp[path];
  });
}

// 获取 require import 的文件路径
function getFullModulePath(relativeRoot, modulePath) {
  const fullPath = relativeRoot
    ? path.resolve(relativeRoot, '..', modulePath)
    : modulePath;

  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    return [fullPath];
  }
  const fullPathMightBeList = consts.regularSuffix.map(suffix => `${fullPath}${suffix}`);
  for (let pathMightBe of fullPathMightBeList) {
    if (fs.existsSync(pathMightBe)) {
      return [pathMightBe];
    }
  }

  consts.rareSuffix.map(suffix => `${fullPath}${suffix}`);
  const result = [];
  for (let rarePathMightBe of rareFullPathMightBeList) {
    if (fs.existsSync(rarePathMightBe)) {
      result.push(rarePathMightBe);
    }
  }
  return result;
}

// 生成依赖树
function addToTree(filePath, rootDir) {
  if (pathMap[filePath]) return;
  pathMap[filePath] = true;

  const relativePath = filePath.replace(rootDir, '');
  addToTreeMap(relativePath, pathTree);
  if (path.extname(filePath).match(/\.(js|ts)x?/)) {
    resolveFile(filePath, rootDir);
  }
}

// 核心逻辑, 文件解析
function resolveFile(filePath, rootDir) {
  try {
    const file = fs.readFileSync(filePath).toString();
    const ast = babelParser.parse(file, {
      sourceType: 'module',
      plugins: ['jsx', 'flow', 'classProperties', 'decorators-legacy']
    });
    // 遍历页面节点
    babelTraverse(ast, {
      enter(path) {
        let importedModule = '';
        if (t.isImportDeclaration(path.node)) {
          importedModule = path.node.source.value;
        }
        if (
          t.isCallExpression(path.node) &&
          path.node.callee.name === 'require' &&
          path.node.arguments.length
        ) {
          importedModule = path.node.arguments[0].value;
        }
        if (!importedModule) return null;

        importedModule = convertAlias(importedModule);
        const moduleType = getModuleType(importedModule);
        if (!moduleType || moduleType === 'module') return;

        let moduleFullPathList;
        if (moduleType === 'relative') {
          moduleFullPathList = getFullModulePath(filePath, importedModule);
        } else if (moduleType === 'absolute') {
          moduleFullPathList = getFullModulePath(null, importedModule);
        }
        if (!moduleFullPathList || !moduleFullPathList.length) return;
        moduleFullPathList.forEach(moduleFullPath => addToTree(moduleFullPath, rootDir));
      }
    });
  } catch (e) {
    console.log('error occurred at file: ', filePath);
    throw e;
  }
}

// diff后的文件列表
function getUselessPathList(rootDir) {
  const buffer = childProcess.execSync(
    `find ${rootDir} ! -path "**/node_modules/*" -name "*.js"`
  );
  const allFillPath = buffer.toString().split('\n');
  return allFillPath.filter(path => !pathMap[path] && !isExclude(path));
}

// diff后的文件树
function getUselessPathTree(rootDir) {
  const uselessPathList = getUselessPathList(rootDir);
  const tree = {};
  uselessPathList.forEach(path => {
    const relativePath = path.replace(rootDir, '');
    addToTreeMap(relativePath, tree);
  });
  return tree;
}

module.exports = {
  addToTree,
  getUselessPathList,
  getUselessPathTree,
  pathMap,
  pathTree,
  uselessPathTree: {}
};
