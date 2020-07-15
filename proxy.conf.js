const PROXY_CONFIG = [
  {
    context: ['/api'],
    target: 'http://35.245.92.162',
    secure: false,
    pathRewrite: { '^/api': '' }
  }
];

module.exports = PROXY_CONFIG;
