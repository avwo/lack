# lack
whistle插件脚手架

### 安装
``` sh
npm i -g lack
```

### 使用
1. 新建插件目录 `whistle.xxx`，后进入目录。
2. 添加插件钩子Server：
    ``` sh
    lack init
    ```
3. 将插件链接到全局：
    ``` sh
    npm link
    ```
4. 监听插件变更时自动重启：
    ``` sh
    lack watch
    ```