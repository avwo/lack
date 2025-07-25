
module.exports = (server, options) => {
  server.on('request', (req, res) => {
    // rules & values
    // res.end(JSON.stringify({
    //   rules: '',
    //   values: {},
    // }));

    // rules
    res.end('');
  });
};
