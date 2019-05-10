const { Socket } = require('net');
const tls = require('tls');
const assert = require('assert');

const { prototype } = Socket;
const { connect } = prototype;
const tlsConnect = tls.connect;
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

const isHttp = (options) => {
  return options.pathname || options.href || options._agentKey
    || options.protocol || options.headers;
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
  headers['x-whistle-policy'] = isHttp(options) ? 'intercept' : 'tunnel';
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

function normalizeArgs(args) {
  if (Array.isArray(args[0])) {
    return args[0];
  }
  if (args.length === 0) {
    return [{}, null];
  }
  const arg0 = args[0];
  let options = {};
  if (typeof arg0 === 'object' && arg0 !== null) {
    options = arg0;
  } else if (isPipeName(arg0)) {
    options.path = arg0;
  } else {
    options.port = arg0;
    if (args.length > 1 && typeof args[1] === 'string') {
      options.host = args[1];
    }
  }
  const cb = args[args.length - 1];
  return [options, typeof cb === 'function' ? cb : null];
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
  args = normalizeArgs(args);
  const options = args[0];
  const proxy = getProxy(options);
  if (!proxy) {
    return connect.apply(this, args);
  }
  const cb = typeof args[1] === 'function' ? args[1] : noop;
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

function normalizeConnectArgs(listArgs) {
  const args = normalizeArgs(listArgs);
  const options = args[0];
  const cb = args[1];
  if (listArgs[1] !== null && typeof listArgs[1] === 'object') {
    Object.assign(options, listArgs[1]);
  } else if (listArgs[2] !== null && typeof listArgs[2] === 'object') {
    Object.assign(options, listArgs[2]);
  }

  return cb ? [options, cb] : [options];
}

tls.connect = function(...args) {
  args = normalizeConnectArgs(args);
  const options = args[0];
  const proxy = getProxy(options);
  if (!proxy) {
    return connect.apply(this, args);
  }
  if (isHttp(options)) {
    options.rejectUnauthorized = false;
  }
  const socket = new Socket();
  options.socket = socket;
  const tlsSocket = tlsConnect(options, args[1]);
  socket.connect(options);
  socket.on('error', err => tlsSocket.emit('error', err));
  return tlsSocket;
};

exports.setProxy = (proxy) => {
  globalProxy = formatProxy(proxy);
};

exports.removeProxy = () => {
  globalProxy = null;
};
