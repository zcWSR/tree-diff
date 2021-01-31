# tree-diff

基于babel的文件依赖树diff工具

## before all

请手动 link
```bash
npm link
```


## 使用方式

自己看 `tree-diff --help` 

```
> tree-diff --help
Usage: tree [options]

Options:
  -r, --root <dir>       待查找的根目录, 不写默认为当前目录
  -e, --entrance <file>  入口文件, 不写默认为当前目录下的index.js
  -o, --output <output>  自定义输出内容: tree: 依赖树, list: 依赖列表, useless: 非依赖树, 不写默认全选
  -s, --short            精简模式, 直接输出diff结果
```

## 其他用法

可结合管道实现自动化

例如, 自动删除diff结果文件

```
tree-diff -s | xargs rm
```