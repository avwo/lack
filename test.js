const https = require('https');
const http = require('http');
const { setProxy } = require('./lib');

setProxy((options) => {
  return Object.assign({}, options, {
    host: '127.0.0.1',
    port: 8888,
  });
});

const request = (isHttps) => {
  const req = (isHttps ? https : http).request(`http${isHttps ? 's' : ''}://www.qq.com/`, (res) => {
    console.log(res.statusCode, res.headers);
  });
  req.on('error', e => console.log(e, '-------------'));
  req.end();
};

request();
request(true);
