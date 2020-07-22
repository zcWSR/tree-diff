const childProcess = require('child_process');
const fs = require('fs');
const path = require('path')
const babelParser = require('@babel/parser');
const babelTraverse = require('@babel/traverse').default;
const t = require('@babel/types');
const excludeList = require('./exclude');

const pathMap = {};
const pathTree = {};

// 是否为用户路径引入
function isCustomModule(module) {
  return module && module.match(/^\./);
}

function isExclude(path) {
  return excludeList.some(exclude => !!path.match(exclude));
}

// 添加到树状图
function addToTreeMap(path, treeMap) {
  let temp = treeMap;
  path.split('/').forEach((path) => {
    if (!path) return;
    if (!temp[path]) {
      temp[path] = {};
    }
    temp = temp[path];
  });
}

// 获取 require import 的文件路径
function getFullModulePath(relativeRoot, modulePath) {
  const fullPath = path.resolve(relativeRoot, '..', modulePath);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    return [fullPath];
  }
  const fullPathMightBeList = [
    `${fullPath}.js`,
    `${fullPath}/index.js`
  ];
  for (let pathMightBe of fullPathMightBeList) {
    if (fs.existsSync(pathMightBe)) {
      return [pathMightBe];
    }
  }

  const rareFullPathMightBeList = [
    `${fullPath}.ios.js`,
    `${fullPath}.android.js`,
    `${fullPath}/index.ios.js`,
    `${fullPath}/index.android.js`
  ];
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
  resolveFile(filePath, rootDir);
}

// 核心逻辑, 文件解析
function resolveFile(filePath, rootDir) {
  try {
    const file = fs.readFileSync(filePath).toString();
    const ast = babelParser.parse(file, { sourceType: 'module', plugins: ['jsx', 'flow', 'classProperties', 'decorators-legacy'] });
    // 遍历页面节点
    babelTraverse(ast, {
      enter(path) {
        let importedModule = '';
        if (t.isImportDeclaration(path.node)) {
          importedModule = path.node.source.value;
        }
        if (t.isCallExpression(path.node) && path.node.callee.name === 'require' && path.node.arguments.length) {
          importedModule = path.node.arguments[0].value;
        }
        if (!isCustomModule(importedModule)) return;
        const moduleFullPathList = getFullModulePath(filePath, importedModule);
        if (!moduleFullPathList || !moduleFullPathList.length) return;
        moduleFullPathList.forEach(moduleFullPath => addToTree(moduleFullPath, rootDir))
      }
    });
  } catch (e) {
    console.log('error occurred at file: ', filePath);
    throw e;
  }
};

// diff后的文件列表
function getUselessPathList(rootDir) {
  const buffer = childProcess.execSync(`find ${rootDir} ! -path "**/node_modules/*" -name "*.js"`);
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
  })
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
