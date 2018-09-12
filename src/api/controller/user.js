const Base = require('./base.js');
const fs = require('fs');
const crypto = require('crypto');
const _ = require('lodash');

function WXBizDataCrypt(appId, sessionKey) {
  this.appId = appId
  this.sessionKey = sessionKey
}

WXBizDataCrypt.prototype.decryptData = function (encryptedData, iv) {

  console.log("sessionKey", this.sessionKey);
  console.log("encryptedData", encryptedData);
  console.log("iv", iv);
  // base64 decode
  var sessionKey = new Buffer(this.sessionKey, 'base64');
  encryptedData = new Buffer(encryptedData, 'base64');
  iv = new Buffer(iv, 'base64');

  try {
     // 解密
    var decipher = crypto.createDecipheriv('aes-128-cbc', sessionKey, iv)
    // 设置自动 padding 为 true，删除填充补位
    decipher.setAutoPadding(true)
    var decoded = decipher.update(encryptedData, 'binary', 'utf8')
    decoded += decipher.final('utf8')
    
    decoded = JSON.parse(decoded)

  } catch (err) {
    throw new Error('Illegal Buffer1', err);
  }

  if (decoded.watermark.appid !== this.appId) {
    throw new Error('Illegal Buffer2', err);
  }

  return decoded
}

module.exports = class extends Base {
  async infoAction() {
    const userInfo = await this.model('user').where({ mobile: '15989389319' }).find();
    delete userInfo.password;
    return this.json(userInfo);
  }
  async setrefereeAction() {
    let { referee } = this.post();
    console.log("推荐人", referee);
    const { is_auto_distributor } = await this.model('others').limit(1).find(); //是否直接成为分销商
    // 推荐人是自己的时候，将推荐人改为总店
    if(parseInt(referee) === parseInt(this.ctx.state.userId)){
      referee = 0;
    }
    const result = await this.model('user').where({ id: this.ctx.state.userId }).update({ referee, is_distributor: is_auto_distributor });
    return this.success(result);
  }
  async groupAction() {
    const that = this;
    const user_id = this.ctx.state.userId;
    const userInfo = await that.model("user").where({ id: user_id }).find(); //我的信息

    const group = [];
    // 递归函数
    const getUser = async (userInfo, depth = 1) => {
      console.log("当前递归用户：", userInfo.id);
      group.push({ depth, ...userInfo }); //添加下线用户
      const { id: user_id } = userInfo;
      const userInfos = await that.model("user").where({ referee: user_id }).select(); //下线们
      for(let userInfo of userInfos)
      {
        console.log("当前下线：", userInfo.id);
        await getUser(userInfo, depth + 1);
      }
    }
    await getUser(userInfo);

    return this.success(group);
  }
  /**
   * 保存用户头像
   * @returns {Promise.<void>}
   */
  async saveAvatarAction() {
    const avatar = this.file('avatar');
    if (think.isEmpty(avatar)) {
      return this.fail('保存失败');
    }

    const avatarPath = think.RESOURCE_PATH + '/static/user/avatar/1.' + _.last(_.split(avatar.path, '.'));

    fs.rename(avatar.path, avatarPath, function(res) {
      return this.success();
    });
  }
      /**
   * 解密手机号码
   * @returns {Promise.<void>}
   */
  async numberAction() {
    const user = this.model('user');
    const { userId, currentAccount } = this.ctx.state;
    const { encryptedData, iv, openid } = this.post();
    console.log("解密手机号码: post", this.post());
    const { appid } = await this.model("account", "mch").where({ acc: currentAccount }).find();

    const userInfo = await user.where({ id: userId }).find();
    const { session_key } = userInfo;

    const appId = appid;
    const sessionKey = session_key;
    
    console.log("appId", appId);
    console.log("sessionKey", sessionKey);
    console.log("encryptedData", encryptedData);
    console.log("iv", iv);

    var pc = new WXBizDataCrypt(appId, sessionKey);
    console.log("pc", pc);
    var data = pc.decryptData(encryptedData , iv);
    console.log("data", data);
    const { purePhoneNumber } = data;
    console.log('解密后 data: ', data);
    if(purePhoneNumber){
      const result = await user.where({ id: userId }).update({ mobile: purePhoneNumber });
      this.success(purePhoneNumber);
    }else{
      this.fail();
    }
  }

      /**
   * 获取支付的请求参数
   * @returns {Promise<PreventPromise|void|Promise>}
   */
  async prepayAction() {
    const that = this;
    console.log("post", this.post());
    const thisTime = Math.round(new Date().getTime()/1000);
    const { distributor_level, real_name } = this.post();
    const { userId } = this.ctx.state;

    const updateUser = await this.model('user').where({ id: userId }).update({ real_name, distributor_level });

    // 申请分销商费用
    let price
    if(distributor_level === '0' || distributor_level === 0) {
      price = 1800;
    }else if(distributor_level === '1' || distributor_level === 1) {
      price = 800;
    }

    const { weixin_openid: openid, referee } = await this.model('user').where({ id: userId }).find();

    if (think.isEmpty(openid)) {
      return this.fail('找不到openid，微信支付失败');
    }

    const { currentAccount } = this.ctx.state;
    const params = await this.model('account', 'mch').where({ acc: currentAccount }).find();

    const { is_sub } = params;
    let WeixinSerivce_params;
    if(is_sub === 1){
      // 服务商模式
      WeixinSerivce_params = {
        is_sub,
        appid: that.config("operator.appid"),
        mch_id: that.config("operator.mch_id"),
        partner_key: params.partner_key,
        sub_appid: params.appid,
        sub_mch_id: params.mch_id,
        sub_openid: openid
      }
    }else{
      WeixinSerivce_params = {
        // 非服务商模式
        is_sub,
        appid: params.appid,
        mch_id: params.mch_id, 
        partner_key: params.partner_key,
        openid
      }
    }
    const WeixinSerivce = this.service('weixin', 'api', WeixinSerivce_params);
    try {
      //统一下单
      const outTradeNo = Date.now() + "" + Math.round(new Date().getTime()/1000);
      const joinParams = {
        user_id: userId,
        pay_status: 1,
        distribute_level: parseInt(distributor_level),
        out_trade_no: outTradeNo,
        total_fee: price,
        referee,
        add_time: thisTime
      }
      const joinRes = await this.model("join").add(joinParams);
      const returnParams = await WeixinSerivce.createUnifiedOrder({
        body: '商户订单：' + outTradeNo,
        out_trade_no: outTradeNo,
        total_fee: price,
        spbill_create_ip: '',
        attach: "&account=" + currentAccount + "&is_sub=" + is_sub + "&type=1"
      });
      console.log("统一下单返回：", returnParams);


      return this.success(returnParams);
    } catch (err) {
      think.logger.warn('微信支付失败', err);
      return this.fail('微信支付失败');
    }
  }
};
