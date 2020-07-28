const PROXY_CONFIG = [
  {
    context: ['/api'],
    target: 'http://35.194.76.64',
    secure: false,
    pathRewrite: { '^/api': '' }
  }
];

module.exports = PROXY_CONFIG;
