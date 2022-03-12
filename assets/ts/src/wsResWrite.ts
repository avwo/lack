
export default (server: Whistle.PluginServer, options: Whistle.PluginOptions) => {
  server.on('connect', (req: Whistle.PluginRequest, socket: Whistle.PluginSocket) => {
    socket.pipe(socket);
  });
};
