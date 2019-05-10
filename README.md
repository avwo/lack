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

# TODOs
1. [ ] 优化脚手架tips
2. [ ] 完善脚手架功能
3. [ ] 支持通过注入的方式给Node服务统一设置HTTP[s]、Socket请求代理
4. [ ] 完善文档
