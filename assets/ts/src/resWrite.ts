
module.exports = (server: Whistle.PluginServer/*, options: Whistle.PluginOptions*/) => {
  server.on('request', (req: Whistle.PluginRequest, res: Whistle.PluginResponse) => {
    req.pipe(res);
  });
};
