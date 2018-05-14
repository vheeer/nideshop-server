// default config
const API_codeForSession_key = "https://api.weixin.qq.com/sns/jscode2session";
const API_prepay = "https://api.mch.weixin.qq.com/pay/unifiedorder";
const wxKey = "192006250b4c09247ec02edce69f6a2d";
const myIp = "111.30.252.31";

const partner_key = "dapingkejiviewdapingkejiviewdapi";
let appid = "wx2578c0e9c48ef707";
// let secret = "c7923d89128f6f5deb4c039d1a1a254f";
let secret = "bb60d9806b8d352ea66b8b7982ddb051"; //汽车
let mch_id = "1503544101";
let notify_url = "https://www.yinmudianying.club/nideshop/api/pay/notify";
module.exports = {
  default_module: 'api',
  default_controller: 'auth', 
  default_action: 'test',
  file_path: "https://www.yinmudianying.club/nideshop/files",
  weixin: {
    appid, // 小程序 appid
    secret, // 小程序密钥
    mch_id, // 商户帐号ID
    partner_key, // 微信支付密钥
    notify_url,// 微信异步通知，例：https://www.nideshop.com/api/pay/notify
  },
  express: {
    // 快递物流信息查询使用的是快递鸟接口，申请地址：http://www.kdniao.com/
    appid: '', // 对应快递鸟用户后台 用户ID
    appkey: '', // 对应快递鸟用户后台 API key
    request_url: 'http://api.kdniao.cc/Ebusiness/EbusinessOrderHandle.aspx'
  }
};
