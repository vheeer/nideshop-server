// production config, it will load in production enviroment
module.exports = {
  workers: 0,
  port: 8365,
  file_path: "https://www.yinmudianying.club/onshop/files",
  weixin: {
    notify_url: "https://www.yinmudianying.club/onshop/api/pay/notify"// 微信支付异步通知
  }
};
