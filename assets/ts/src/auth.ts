
export default async (req: Whistle.PluginAuthRequest, options: Whistle.PluginOptions) => {
  /**
  const { fullUrl } = req;
  // Returns 403 Forbidden status code if URL contains '/test/forbidden'
  if (fullUrl.includes('/test/forbidden')) {
    return false;
  }
  // Returns 403 status code with custom HTML message if URL contains '/test/message/forbidden'
  if (fullUrl.includes('/test/message/forbidden')) {
    req.setHtml('<strong>Access Denied</strong>');
    return false;
  }

  // Requires username/password authentication if URL contains '/test/login'
  if (fullUrl.includes('/test/login')) {
    const auth = req.headers.authorization || req.headers['proxy-authorization'];
    if (auth) {
      // TODO: Validate username and password - return true if valid, false otherwise
      return true;
    }
    req.setLogin(true); // Triggers basic auth prompt
    return false;
  }

  // Returns 302 redirect if URL contains '/test/redirect'
  if (fullUrl.includes('/test/redirect')) {
    req.setRedirect('https://www.example.com/test');
    return false;
  }

  // All other requests are allowed by default
  // Custom headers can be added using `req.setHeader`
  // Only headers prefixed with 'x-whistle-' are supported
  // Example: req.setHeader('x-whistle-xxx', 'value');
  req.setHeader('x-whistle-custom-header', 'lack');
  **/
  return true;
};
