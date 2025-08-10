# lack
[![NPM version](https://img.shields.io/npm/v/lack.svg?style=flat-square)](https://npmjs.org/package/lack)
[![node version](https://img.shields.io/badge/node.js-%3E=_8-green.svg?style=flat-square)](http://nodejs.org/download/)
[![npm download](https://img.shields.io/npm/dm/lack.svg?style=flat-square)](https://npmjs.org/package/lack)
[![NPM count](https://img.shields.io/npm/dt/lack.svg?style=flat-square)](https://www.npmjs.com/package/lack)
[![License](https://img.shields.io/npm/l/lack.svg?style=flat-square)](https://www.npmjs.com/package/lack)

中文 · [English](./README-en_US.md)

用于快速生成 [Whistle](https://github.com/avwo/whistle) 插件的脚手架工具。

### 安装
``` sh
npm i -g lack
```

### 使用
1. 创建插件目录
    ``` sh
    mkdir whistle.your-plugin-name
    cd whistle.your-plugin-name
    ```
    > 注意：插件名必须符合 `whistle.xxx` 或 `@scope/whistle.xxx` 格式，其中 `xxx` 只能包含 `a-z`、`0-9`、`-` 和 `_`（下划线不推荐使用）
2. 初始化项目
   - 手动选择：`lack init`
      > 该命令会交互式询问你需要哪些插件钩子（支持多选），按需选择即可
   - 快捷命令（`lack init hook1,hook2...`）：[插件开发](https://wproxy.org/docs/extensions/dev.html)
3. 安装依赖
      ``` sh
      npm i
      ```
4. 【可选】代码规范配置
    ``` sh
    npx install-peerdeps --dev eslint-config-airbnb
    ```
    > 详细配置参考：https://www.npmjs.com/package/eslint-config-airbnb
5. 开发模式
    ``` sh
    lack watch
    ```
    该命令的功能：
    - 自动重新加载插件到运行的 Whistle 实例
    - 插件代码变更时会自动重新加载
    - 可以在命令行查看插件 `console.xxx` 输出的日志
6. 查看帮助
    ``` sh
    lack --help
    ```

完整插件开发流程参考文档：[插件开发](https://wproxy.org/docs/extensions/dev.html)
