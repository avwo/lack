
module.exports = async (req: Whistle.PluginAuthRequest/*, options: Whistle.PluginOptions*/) => {
  req.set('x-whistle-custom-header', 'lack');
  return true; // false 直接返回 403
};
