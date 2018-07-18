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
    const result = await this.model('user').where({ id: think.userId }).update({ referee, is_distributor: is_auto_distributor });
    return this.success(result);
  }
  async groupAction() {
    const that = this;
    const user_id = think.userId;
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
    const { mch } = this.get();
    const { userId } = this.ctx.state;
    const { encryptedData, iv, openid } = this.post();
    console.log("解密手机号码: post", this.post());
    const { appid } = await this.model("account", "mch").where({ acc: mch }).find();

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
};
