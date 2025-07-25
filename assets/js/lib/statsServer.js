export default (server, options) => {
  server.on('request', (req) => {
    const { originalReq } = req;
    console.log('Value:', originalReq.ruleValue);
    console.log('URL:', originalReq.fullUrl);
    console.log('Method:', originalReq.method);
    console.log('Request Headers:', originalReq.headers);
    // get request session
    req.getReqSession((reqSession) => {
      if (reqSession) {
        console.log('Request Body:', reqSession.req.body);
      }
    });
  });
};
