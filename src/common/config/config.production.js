// production config, it will load in production enviroment
module.exports = {
  workers: 0,
  port: 8361,
  file_path: "https://www.yinmudianying.club/nideshop-mul/files",
  weixin: {
    notify_url: "https://www.yinmudianying.club/nideshop-mul-dev/api/pay/notify"// 微信支付异步通知
  }
};
