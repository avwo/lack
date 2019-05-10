
module.exports = (server/* , options */) => {
  // handle http request
  server.on('request', (req, res) => {
    // do something
  });

  // handle websocket request
  server.on('upgrade', (req, socket) => {
    // do something
  });

  // handle tunnel request
  server.on('connect', (req, socket) => {
    // do something
  });
};
