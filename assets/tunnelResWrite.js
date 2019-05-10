
module.exports = (server/* , options */) => {
  server.on('request', (req, socket) => {
    socket.pipe(socket);
  });
};
