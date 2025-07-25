
export default (server: Whistle.PluginServer, options: Whistle.PluginOptions) => {
  server.on('request', (req: Whistle.PluginRequest, res: Whistle.PluginResponse) => {
    // rules & values
    // res.end(JSON.stringify({
    //   rules: '',
    //   values: {},
    // }));

    // rules
    res.end('');
  });
};
