const net = require('net');
const { setProxy, enableProxy } = require('../index');

const PROXY_OPTIONS = {
  host: '127.0.0.1',
  port: 8899
};

// 动态设置代理
setProxy((options) => {
  return Object.assign(options, PROXY_OPTIONS);
});

// 设置固定代理
// setProxy(PROXY_OPTIONS);

(async () => {
  const socket = net.connect(await enableProxy({
    host: 'ke.qq.com',
    port: 80,
  }));
  socket.write([
    'GET / HTTP/1.1',
    'Host: ke.qq.com',
    '\r\n',
  ].join('\r\n'));
  socket.on('error', console.error); // eslint-disable-line
  socket.on('data', (data) => {
    console.log(`${data}`); // eslint-disable-line
  });
})();
