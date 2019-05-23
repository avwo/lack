const http = require('http');
const https = require('https');

const { setProxy } = require('../lib');

const PROXY_OPTIONS = {
  host: '127.0.0.1',
  port: 8899,
};
// 动态设置代理
// setProxy((options) => {
//   return Object.assign(options, PROXY_OPTIONS);
// });

// 设置固定代理
setProxy(PROXY_OPTIONS);

const httpClient = http.request('http://ke.qq.com', (res) => {
  console.log(res.statusCode); // eslint-disable-line
});
httpClient.on('error', console.error); // eslint-disable-line
httpClient.end();

const httpsClient = https.request('https://ke.qq.com', (res) => {
  console.log(res.statusCode); // eslint-disable-line
});
httpsClient.on('error', console.error); // eslint-disable-line
httpsClient.end();
