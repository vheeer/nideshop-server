const crypto = require('crypto');
const md5 = require('md5');
const rp = require('request-promise');

module.exports = class extends think.Service {

  constructor(params) {
    super();
    console.log("params:-_----------------------", params);
    Object.assign(this, params);
  }
  /**
   * 解析微信登录用户数据
   * @param sessionKey
   * @param encryptedData
   * @param iv
   * @returns {Promise.<string>}
   */
  async decryptUserInfoData(sessionKey, encryptedData, iv) {
    // base64 decode
    const { appid } = this;
    const _sessionKey = Buffer.from(sessionKey, 'base64');
    encryptedData = Buffer.from(encryptedData, 'base64');
    iv = Buffer.from(iv, 'base64');
    let decoded = '';
    try {
      // 解密
      const decipher = crypto.createDecipheriv('aes-128-cbc', _sessionKey, iv);
      // 设置自动 padding 为 true，删除填充补位
      decipher.setAutoPadding(true);
      decoded = decipher.update(encryptedData, 'binary', 'utf8');
      decoded += decipher.final('utf8');

      decoded = JSON.parse(decoded);
    } catch (err) {
      return '';
    }

    if (decoded.watermark.appid !== appid) {
      return '';
    }

    return decoded;
  }

  /**
   * 统一下单
   * @param payInfo
   * @returns {Promise}
   */
  async createUnifiedOrder(payInfo) {
    const WeiXinPay = require('weixinpay');
    const { appid, app_secret, mch_id, partner_key } = this;
    // 参数
    const weixinpay = new WeiXinPay({
      appid, // 微信小程序appid
      openid: payInfo.openid, // 用户openid
      mch_id, // 商户帐号ID
      partner_key // 秘钥
    });
    console.log("params: ", {
      appid, // 微信小程序appid 
      openid: payInfo.openid, // 用户openid
      mch_id, // 商户帐号ID
      partner_key // 秘钥
    })
    return new Promise((resolve, reject) => {
      weixinpay.createUnifiedOrder({
        body: payInfo.body,
        out_trade_no: payInfo.out_trade_no,
        total_fee: payInfo.total_fee,
        spbill_create_ip: payInfo.spbill_create_ip,
        notify_url: think.config('weixin.notify_url'),
        trade_type: 'JSAPI'
      }, (res) => {
        if (res.return_code === 'SUCCESS' && res.result_code === 'SUCCESS') {
          const returnParams = {
            'appid': res.appid,
            'timeStamp': parseInt(Date.now() / 1000) + '',
            'nonceStr': res.nonce_str,
            'package': 'prepay_id=' + res.prepay_id,
            'signType': 'MD5'
          };
          const paramStr = `appId=${returnParams.appid}&nonceStr=${returnParams.nonceStr}&package=${returnParams.package}&signType=${returnParams.signType}&timeStamp=${returnParams.timeStamp}&key=` + partner_key;
          returnParams.paySign = md5(paramStr).toUpperCase();
          resolve(returnParams);
        } else { 
          reject(res);
        }
      });
    });
  }

  /**
   * 生成排序后的支付参数 query
   * @param queryObj
   * @returns {Promise.<string>}
   */
  buildQuery(queryObj) {
    const sortPayOptions = {};
    for (const key of Object.keys(queryObj).sort()) {
      sortPayOptions[key] = queryObj[key];
    }
    let payOptionQuery = '';
    for (const key of Object.keys(sortPayOptions).sort()) {
      payOptionQuery += key + '=' + sortPayOptions[key] + '&';
    }
    payOptionQuery = payOptionQuery.substring(0, payOptionQuery.length - 1);
    return payOptionQuery;
  }

  /**
   * 对 query 进行签名
   * @param queryStr
   * @returns {Promise.<string>}
   */
  signQuery(queryStr) {
    queryStr = queryStr + '&key=' + think.config('weixin.partner_key');
    const md5 = require('md5');
    const md5Sign = md5(queryStr);
    return md5Sign.toUpperCase();
  }

  /**
   * 处理微信支付回调
   * @param notifyData
   * @returns {{}}
   */
  payNotify(notifyData) {
    if (think.isEmpty(notifyData)) {
      return false;
    }

    const notifyObj = {};
    let sign = '';
    for (const key of Object.keys(notifyData)) {
      if (key !== 'sign') {
        notifyObj[key] = notifyData[key][0];
      } else {
        sign = notifyData[key][0];
      }
    }
    if (notifyObj.return_code !== 'SUCCESS' || notifyObj.result_code !== 'SUCCESS') {
      return false;
    }
    const signString = this.signQuery(this.buildQuery(notifyObj));
    if (think.isEmpty(sign) || signString !== sign) {
      return false;
    }
    return notifyObj;
  }

  /**
   * get_access_token
   * @param 
   * @returns {{}}
   */
  async get_access_token() {
    const options = {
      method: 'GET',
      url: 'https://api.weixin.qq.com/cgi-bin/token',
      qs: {
        grant_type: 'client_credential',
        secret: this.app_secret,
        appid: this.appid
      }
    };
    let result = await rp(options);
    console.log("获取的token: ", result);
    result = JSON.parse(result);
    const { access_token } = result;
    
    return access_token;
  }  

  /**
   * get_code
   * @param
   * @returns {{}}
   */
  async get_code(access_token) {
    const options = {
      method: 'POST',
      url: 'https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=' + access_token,
      body: {
        scene: "abcdef",
        auto_color: true
      },
      json: true // Automatically stringifies the body to JSON
    };
    let result = await rp(options);
    
    return result;
  }
};
