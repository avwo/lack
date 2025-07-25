// sniCallback plugin handler - Dynamically controls TLS tunneling behavior based on request URL
module.exports = async (req, options) => {
  /**
  const { fullUrl, originalReq } = req;
  // Preserve TLS encryption for specific domains (skip MITM decryption)
  if (fullUrl === 'https://tunnel.example.com' || originalReq.sniValue === 'tunnel') {
    return false;
  }

  // Use custom certificate for targeted decryption
  // Supports .crt, .pem, .cer certificate formats
  if (fullUrl === 'https://custom.example.com') {
    return { key, cert };
  }
  **/
  // Default behavior: Decrypt TLS using Whistle's built-in certificate
  return true;
};
