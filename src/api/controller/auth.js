const Base = require('./base.js');
const rp = require('request-promise');

module.exports = class extends Base {
  async loginByWeixinAction() {
    console.log("this.post(): ", this.post());
    const code = this.post('code');
    const { mch } = this.get();
    const fullUserInfo = this.post('userInfo');
    const userInfo = fullUserInfo.userInfo;
    const clientIp = ''; // 暂时不记录 ip

    const { app_secret, appid } = await this.model("account", "mch").where({ acc: mch }).limit(1).find();
    console.log("{ app_secret, appid }", app_secret, appid);

    // 获取openid
    const options = {
      method: 'GET',
      url: 'https://api.weixin.qq.com/sns/jscode2session',
      qs: {
        grant_type: 'authorization_code',
        js_code: code,
        secret: app_secret,
        appid
      }
    };

    let sessionData = await rp(options);
    sessionData = JSON.parse(sessionData);
    if (!sessionData.openid) {
      return this.fail('!openid登录失败');
    }

    // 验证用户信息完整性
    const crypto = require('crypto');
    const sha1 = crypto.createHash('sha1').update(fullUserInfo.rawData + sessionData.session_key).digest('hex');
    if (fullUserInfo.signature !== sha1) {
      return this.fail('fullUserInfo.signature !== sha1登录失败');
    }

    // 解释用户数据
    const WeixinSerivce = this.service('weixin', 'api', { app_secret, appid });
    console.log("WeixinSerivce", WeixinSerivce);
    console.log("typeof WeixinSerivce", typeof WeixinSerivce);
    const weixinUserInfo = await WeixinSerivce.decryptUserInfoData(sessionData.session_key, fullUserInfo.encryptedData, fullUserInfo.iv);
    if (think.isEmpty(weixinUserInfo)) {
      return this.fail('think.isEmpty(weixinUserInfo)登录失败');
    }

    // 根据openid查找用户是否已经注册
    let userId = await this.model('user').where({ weixin_openid: sessionData.openid }).getField('id', true);
    if (think.isEmpty(userId)) {
      // 注册
      userId = await this.model('user').add({
        username: '微信用户' + think.uuid(6),
        password: sessionData.openid,
        register_time: parseInt(new Date().getTime() / 1000),
        register_ip: clientIp,
        last_login_time: parseInt(new Date().getTime() / 1000),
        last_login_ip: clientIp,
        mobile: '',
        weixin_openid: sessionData.openid,
        avatar: userInfo.avatarUrl || '',
        gender: userInfo.gender || 1, // 性别 0：未知、1：男、2：女
        nickname: userInfo.nickName
      });
    }

    sessionData.user_id = userId;

    // 查询用户信息
    const newUserInfo = await this.model('user').field(['id', 'username', 'nickname', 'gender', 'avatar', 'birthday']).where({ id: userId }).find();

    // 更新登录信息
    userId = await this.model('user').where({ id: userId }).update({
      last_login_time: parseInt(new Date().getTime() / 1000),
      last_login_ip: clientIp
    });

    const TokenSerivce = this.service('token', 'api');
    const sessionKey = await TokenSerivce.create(sessionData);

    if (think.isEmpty(newUserInfo) || think.isEmpty(sessionKey)) {
      return this.fail('think.isEmpty(newUserInfo) || think.isEmpty(sessionKey)登录失败');
    }

    return this.success({ token: sessionKey, userInfo: newUserInfo });
  }

  async logoutAction() {
    return this.success();
  }
};
