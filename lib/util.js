const tunnel = require('hagent').agent;
const LRU = require('lru-cache');
const net = require('net');
const { ClientRequest } = require('http');

const IDLE_TIMEOU = 1000 * 60 * 3;
const agents = new LRU({ max: 360 });
const noop = () => {};
let emptyReq;

const removeIPV6Prefix = (ip) => {
  if (typeof ip !== 'string') {
    return '';
  }
  return ip.indexOf('::ffff:') === 0 ? ip.substring(7) : ip;
};

const getClientIp = ({ headers }) => {
  let val = headers && headers['x-forwarded-for'];
  if (!val || typeof val !== 'string') {
    return '';
  }
  const index = val.indexOf(',');
  if (index !== -1) {
    val = val.substring(0, index);
  }
  val = removeIPV6Prefix(val.trim());
  return net.isIP(val) ? val : '';
};

const getCacheKey = (options) => {
  const {
    isHttps,
    host,
    port,
  } = options;
  return [isHttps ? 'https' : 'http', host, port, getClientIp(options)].join(':');
};

const capitalize = str => (str && str[0].toUpperCase()) + str.substring(1);

const freeSocketErrorListener = () => {
  const socket = this;
  socket.destroy();
  socket.emit('agentRemove');
  socket.removeListener('error', freeSocketErrorListener);
};

const preventThrowOutError = (socket) => {
  socket.removeListener('error', freeSocketErrorListener);
  socket.on('error', freeSocketErrorListener);
};

const getEmptyReq = () => {
  if (!emptyReq) {
    emptyReq = new ClientRequest();
    emptyReq.on('error', noop);
  }
  return emptyReq;
};

const packHttpMessage = () => {
  if (!this._httpMessage) {
    emptyReq = getEmptyReq();
    emptyReq.socket = this;
    this._httpMessage = emptyReq;
  }
};

const packSocket = (socket) => {
  if (socket.listeners('close').indexOf(packHttpMessage) === -1) {
    socket.once('close', packHttpMessage);
  }
  return socket;
};

const getDomain = ({ servername, hostname, headers }) => {
  if (!servername) {
    const host = headers && headers.host;
    if (typeof host === 'string') {
      servername = host.split(':', 1)[0] || hostname;
    }
  }
  return servername;
};

exports.getAgent = (options, reqOpts) => {
  const key = getCacheKey(options);
  let agent = agents.get(key);
  let headers = Object.keys({}, options.headers);
  delete headers.upgrade;
  delete headers.connection;
  if (!agent) {
    const originProxyHeaders = {};
    headers['x-whistle-policy'] = 'intercept';
    Object.keys(headers).forEach((name) => {
      const rawKey = name.split('-').map(capitalize).join('-');
      originProxyHeaders[rawKey] = headers[name];
    });
    headers = originProxyHeaders;
    const type = options.isHttps ? 'httpsOverHttp' : 'httpOverHttp';
    agent = new tunnel[type]({
      proxy: options,
      rejectUnauthorized: false,
      servername: options.servername || getDomain(reqOpts),

    });
    agent.originProxyHeaders = headers;
    agents.set(key, agent);
    agent.on('free', preventThrowOutError);
    const { createSocket } = agent;
    agent.createSocket = function(opts, cb) {
      createSocket.call(this, opts, (socket) => {
        packSocket(socket);
        socket.setTimeout(IDLE_TIMEOU, () => {
          socket.destroy();
        });
        cb(socket);
      });
    };
  } else if (agent.originProxyHeaders) {
    if (headers['user-agent']) {
      agent.originProxyHeaders['User-Agent'] = headers['user-agent'];
    } else {
      delete agent.originProxyHeaders['User-Agent'];
    }
    if (headers['proxy-authorization']) {
      agent.originProxyHeaders['Proxy-Authorization'] = headers['proxy-authorization'];
    } else {
      delete agent.originProxyHeaders['Proxy-Authorization'];
    }
  }
  return agent;
};
