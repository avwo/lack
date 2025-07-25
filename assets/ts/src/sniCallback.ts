// sniCallback plugin handler - Dynamically controls TLS tunneling behavior based on request URL
export default async (req: Whistle.PluginSNIRequest, options: Whistle.PluginOptions) => {
  /**
  const { fullUrl } = req;
  // Preserve TLS encryption for specific domains (skip MITM decryption)
  if (fullUrl === 'https://tunnel.example.com') {
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
