const { prototype } = require('net').Socket;
const assert = require('assert');

const { connect } = prototype;
const HOST_RE = /^\s*[\w.-]+\s*$/;
const STATUS_RE = /^\s*HTTP\/1.1\s+(\d+)/i;
const noop = () => {};
let globalProxy;

const checkHost = host => HOST_RE.test(host);
const checkPort = port => port > 0 && port <= 65535;

const formatProxy = (proxy) => {
  if (!proxy || typeof proxy === 'function') {
    return proxy;
  }
  const { host, port, headers } = proxy;
  assert(checkHost(host), 'Enter the correct host.');
  assert(checkPort(port), 'Enter the correct port.');
  return { host, port, headers };
};

const getProxy = (options) => {
  if (!options || !globalProxy || typeof globalProxy !== 'function') {
    return globalProxy;
  }
  return formatProxy(globalProxy(options));
};

const getConnectData = (options, proxy) => {
  const { host, port } = options;
  if (!proxy || !checkHost(host) || !checkPort(port)) {
    return;
  }
  const result = [`CONNECT ${host}:${port} HTTP/1.1`];
  const headers = Object.keys({}, proxy.headers);
  headers['x-whistle-policy'] = options.pathname ? 'intercept' : 'tunnel';
  Object.keys(headers).forEach((name) => {
    const value = headers[name];
    if (value == null) {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(val => result.push(`${name}: ${val}`));
    } else {
      result.push(`${name}: ${value}`);
    }
  });
  result.push('\r\n');
  return result.join('\r\n');
};

const toNumber = (x) => {
  x = Number(x);
  return x >= 0 ? x : false;
};


const isPipeName = s => (typeof s === 'string' && toNumber(s) === false);

function getOptions(args) {
  if (args.length === 0) {
    return;
  }
  const arg0 = args[0];
  const options = {};
  if (typeof arg0 === 'object' && arg0 !== null) {
    Object.assign(options, arg0);
  } else if (isPipeName(arg0)) {
    options.path = arg0;
  } else {
    options.port = arg0;
    if (args.length > 1 && typeof args[1] === 'string') {
      options.host = args[1];
    }
  }
  return options;
}

const handleConnect = (socket, cb) => {
  const { write } = socket;
  let buffer = [];
  let connected;

  socket.write = function(...args) {
    if (connected) {
      socket.write = write;
      socket.resume();
      socket.write(...args);
    } else {
      buffer.push(args);
    }
  };
  const handleData = (data) => {
    socket.pause();
    socket.removeListener('data', handleData);
    connected = true;
    const code = (STATUS_RE.test(`${data}`) && RegExp.$1) || 'unknown';
    if (code !== '200') {
      socket.emit('error', new Error(`Tunneling socket could not be established, statusCode=${code}`));
    } else {
      socket.write = write;
      buffer.forEach(args => socket.write(...args));
    }
    buffer = null;
    setTimeout(cb, 10);
  };
  socket.on('data', handleData);
};

prototype.connect = function(...args) {
  args = Array.isArray(args[0]) ? args[0] : args;
  const options = getOptions(args);
  const cb = typeof args[1] === 'function' ? args[1] : noop;
  const proxy = getProxy(options);
  const connData = getConnectData(options, proxy);
  const socket = this;
  return connect.call(this, connData ? proxy : options, () => {
    if (!connData) {
      return cb();
    }
    socket.write(connData);
    handleConnect(socket, cb);
  });
};

exports.setProxy = (proxy) => {
  globalProxy = formatProxy(proxy);
};
