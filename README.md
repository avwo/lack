# lack
[![NPM version](https://img.shields.io/npm/v/lack.svg?style=flat-square)](https://npmjs.org/package/lack)
[![node version](https://img.shields.io/badge/node.js-%3E=_8-green.svg?style=flat-square)](http://nodejs.org/download/)
[![npm download](https://img.shields.io/npm/dm/lack.svg?style=flat-square)](https://npmjs.org/package/lack)
[![NPM count](https://img.shields.io/npm/dt/lack.svg?style=flat-square)](https://www.npmjs.com/package/lack)
[![License](https://img.shields.io/npm/l/lack.svg?style=flat-square)](https://www.npmjs.com/package/lack)

生成 [whistle](https://github.com/avwo/whistle) 插件的脚手架。

### 安装
``` sh
npm i -g lack
```

### 使用
严格按以下步骤操作：
1. 新建插件目录 `whistle.xxx`（如果已存在忽略此步骤）
    > xxx 表示只包含 `a-z\d_-` 的任意字符串，具体参见帮助文档：[插件开发](https://wproxy.org/whistle/plugins.html)
2. 进入插件目录，执行 `lack init` 后根据需要选择插件的钩子
    > 有关插件钩子的功能参见帮助文档：[插件开发](https://wproxy.org/whistle/plugins.html)
3. 选择好插件所需钩子并确定后，如果需要修改或新增钩子，可以删除已存在的钩子，并执行上面步骤2
4. 【可选】配置eslint规则，参考：[eslint-config-imweb](https://github.com/imweb/eslint-config-imweb)
5. 安装依赖 `npm i`
6. 执行 `npm link` 将插件link到全局，这样可以在 whistle 界面的 Plugins 列表看到此插件
7. 开启 whistle 调试模式
    ``` sh
    w2 stop
    w2 run
    ```
    > 这样可以在控制台里面看到插件 `console.log` 输出的内容
8. 开启监听插件变更自动重启：
    ```sh
    lack watch
    ```
9. 更多帮助执行 `lack --help`

更多信息参考插件示例：[https://github.com/whistle-plugins/examples](https://github.com/whistle-plugins/examples)
