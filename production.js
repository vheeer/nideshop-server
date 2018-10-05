const Application = require('thinkjs');

const instance = new Application({
  ROOT_PATH: __dirname,
  proxy: true, // use proxy
  env: 'production',
  port: '8361'
});

instance.run();
