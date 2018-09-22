// default config
const API_codeForSession_key = "https://api.weixin.qq.com/sns/jscode2session";
const API_prepay = "https://api.mch.weixin.qq.com/pay/unifiedorder";
const partner_key = "dapingkejidapingkejidapingkejida";
let appid = "wx837d9b849dd800b5";
let mch_id = "1502889921";
let notify_url = "https://www.yinmudianying.club/nideshop-mul-dev/api/pay/notify";
module.exports = {
  port: 8362, // server port生产模式下为8361
  default_module: 'api',
  default_controller: 'auth', 
  default_action: 'test',
  cert_root: '/var/certs/', //证书根目录
  file_path: "https://www.yinmudianying.club/nideshop-mul/files",
  bucket: "nideshop-admin-dva-1256171234",
  operator: {
    appid, //服务商服务号appid
    mch_id, //服务商商户id
    partner_key //服务商秘钥
  },
  weixin: {
    notify_url,// 微信支付异步通知
  },
  express: {
    // 快递物流信息查询使用的是快递鸟接口，申请地址：http://www.kdniao.com/
    appid: '1357105', // 对应快递鸟用户后台 用户ID
    appkey: '1a9fff6a-510a-495f-9f5f-468358c33852', // 对应快递鸟用户后台 API key
    request_url: 'http://api.kdniao.cc/Ebusiness/EbusinessOrderHandle.aspx'
  }
};