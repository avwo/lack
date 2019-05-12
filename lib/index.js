const http = require('http');
const https = require('https');
const { parse: urlParse } = require('url');
const util = require('util');
const net = require('net');
const tls = require('tls');
const assert = require('assert');
const { getAgent } = require('./util');

const { ClientRequest } = http;
const HOST_RE = /^\s*[\w.-]+\s*$/;
const CONNECT_RE = /^\s*connect\s*$/i;
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

const getProxy = (options, isHttps) => {
  if (!options || !globalProxy || typeof globalProxy !== 'function') {
    return globalProxy;
  }
  const proxy = formatProxy(globalProxy(options));
  if (proxy) {
    proxy.headers = proxy.headers || {};
    if (!proxy.headers.host) {
      let { host } = options;
      if (typeof host === 'string') {
        host = host.split(':', 1)[0];
        if (host) {
          proxy.headers.host = `${host}:${options.port || (isHttps ? 443 : 80)}`;
        }
      }
    }
  }
  return proxy;
};

const checkMethod = (opts) => {
  return opts && CONNECT_RE.test(opts.method);
};

function ClientRequestProxy(uri, options, cb, isHttps) {
  if (!globalProxy || checkMethod(uri) || checkMethod(options)) {
    return ClientRequest.call(this, uri, options, cb);
  }

  const origUri = uri;
  const origOpts = options;
  const origCb = cb;
  if (typeof uri === 'string') {
    uri = urlParse(uri);
  }
  if (typeof options === 'function') {
    cb = options;
    options = uri;
  } else {
    options = Object.assign(uri, options);
  }
  const proxy = getProxy(options, isHttps);
  if (!proxy) {
    return ClientRequest.call(this, origUri, origOpts, origCb);
  }
  proxy.isHttps = isHttps;
  options.agent = getAgent(proxy);
  if (isHttps) {
    options._defaultAgent = https.globalAgent;
  }
  ClientRequest.call(this, options, cb);
}

util.inherits(ClientRequestProxy, ClientRequest);

http.ClientRequest = ClientRequestProxy;
http.request = function(url, options, cb) {
  return new ClientRequestProxy(url, options, cb);
};
http.get = function get(url, options, cb) {
  const req = new ClientRequestProxy(url, options, cb);
  req.end();
  return req;
};

https.request = function(url, options, cb) {
  return new ClientRequestProxy(url, options, cb, true);
};
https.get = function get(url, options, cb) {
  const req = new ClientRequestProxy(url, options, cb, true);
  req.end();
  return req;
};

exports.setProxy = (proxy) => {
  globalProxy = formatProxy(proxy);
};

exports.getProxy = getProxy;

exports.removeProxy = () => {
  globalProxy = null;
};

const createConnection = (options) => {
  const proxy = getProxy(options);
  if (!proxy) {
    return new Promise((resolve, reject) => {
      const socket = net.connect(options, () => resolve(socket));
      socket.on('error', reject);
    });
  }

  const headers = options.headers || {};
  const path = `${options.host}:${options.port}`;
  headers.host = path;
  const proxyOpts = {
    method: 'CONNECT',
    agent: false,
    host: proxy.host,
    port: proxy.port,
    path,
    headers,
  };
  return new Promise((resolve, reject) => {
    const req = http.request(proxyOpts, (res, socket) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Tunneling socket could not be established, statusCode=${res.statusCode}`));
      }
      resolve(socket);
    });
    req.on('error', reject);
    req.end();
  });
};

exports.createConnection = createConnection;

exports.createTlsConnection = (options) => {
  return createConnection(options).then((socket) => {
    return tls.connect({
      socket,
      rejectUnauthorized: false,
      servername: options.servername || options.host,
    });
  });
};