# lack
[![NPM version](https://img.shields.io/npm/v/lack.svg?style=flat-square)](https://npmjs.org/package/lack)
[![node version](https://img.shields.io/badge/node.js-%3E=_8-green.svg?style=flat-square)](http://nodejs.org/download/)
[![npm download](https://img.shields.io/npm/dm/lack.svg?style=flat-square)](https://npmjs.org/package/lack)
[![NPM count](https://img.shields.io/npm/dt/lack.svg?style=flat-square)](https://www.npmjs.com/package/lack)
[![License](https://img.shields.io/npm/l/lack.svg?style=flat-square)](https://www.npmjs.com/package/lack)

[中文](./README.md) · English

A scaffolding tool for rapid [Whistle](https://github.com/avwo/whistle) plugin development.

### Installation
```sh
npm i -g lack
```

### Usage
1. Create plugin directory
    ```sh
    mkdir whistle.your-plugin-name
    cd whistle.your-plugin-name
    ```
    > Note: Plugin name must follow `whistle.xxx` or `@scope/whistle.xxx` format where `xxx` can only contain `a-z`, `0-9`, `-` and `_` (underscore not recommended)

2. Initialize project
   - Interactive mode: `lack init`
      > Prompts to select required plugin hooks (multiple selection supported)
   - Quick command (`lack init hook1,hook2...`): [Plugin Development](https://wproxy.org/docs/extensions/dev.html)

3. Install dependencies
    ```sh
    npm i
    ```

4. [Optional] Code style setup
    ```sh
    npx install-peerdeps --dev eslint-config-airbnb
    ```
    > Configuration reference: https://www.npmjs.com/package/eslint-config-airbnb

5. Development mode
    ```sh
    lack watch
    ```
    Features:
    - Auto-reloads plugin into running Whistle instance
    - Automatically reloads on code changes
    - Displays plugin `console.xxx` output in terminal

6. View help
    ```sh
    lack --help
    ```

Complete development guide: [Plugin Development](https://wproxy.org/docs/extensions/dev.html)
