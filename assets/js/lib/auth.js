
module.exports = async (req, options) => {
  req.setHeader('x-whistle-custom-header', 'lack');
  return true; // false 直接返回 403
};
