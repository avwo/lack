# lack
[![NPM version](https://img.shields.io/npm/v/lack.svg?style=flat-square)](https://npmjs.org/package/lack)
[![node version](https://img.shields.io/badge/node.js-%3E=_8-green.svg?style=flat-square)](http://nodejs.org/download/)
[![npm download](https://img.shields.io/npm/dm/lack.svg?style=flat-square)](https://npmjs.org/package/lack)
[![NPM count](https://img.shields.io/npm/dt/lack.svg?style=flat-square)](https://www.npmjs.com/package/lack)
[![License](https://img.shields.io/npm/l/lack.svg?style=flat-square)](https://www.npmjs.com/package/lack)

lack 为 [whistle](https://github.com/avwo/whistle) 的辅助模块，用来方便使用 whistle 或协助扩展 whistle 功能，如生成 whistle 插件的脚手架，给 Node 程序注入 HTTP 代理等。

> 如果不需要脚手架功能，且想要更小的安装包，可以用：https://www.npmjs.com/package/lack-proxy

### 安装
``` sh
npm i -g lack
```

### 使用
1. [插件脚手架](#插件脚手架)
2. [注入HTTP代理](#注入HTTP代理)

##### whistle插件脚手架
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

##### 注入HTTP代理
lack 可以给程序动态设置全局HTTP代理或根据请求参数设置（建议在程序入口设置）：
``` js
const lack = require('lack');
```
1. 设置全局HTTP代理：
    ``` js
    lack.proxy({
        host: '127.0.0.1',
        port: '8899',
        // servername, // 可选，参见Node的HTTPS文档，设置SNI
        // headers, // 可选，设置代理请求头
    });
    ```
    > 程序里面的所有web请求（HTTP、HTTPS、WebSocket）都会代理到本地的 `8899` 端口的代理服务
2. 根据请求参数动态设置
    ``` js
    lack.proxy((options) => {
        // 根据请求options动态设置代理
        return {
            host: '127.0.0.1',
            port: '8899',
            headers: options.headers,
            // servername, // 可选，参见Node的HTTPS文档，设置SNI
        };
    });
    ```

有关例子可以参见[测试用例](./test)。
