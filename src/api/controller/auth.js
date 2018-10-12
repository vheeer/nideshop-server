const Base = require('./base.js');
const rp = require('request-promise');

module.exports = class extends Base {
  async loginByWeixinAction() {
    console.log("this.post(): ", this.post());
    const code = this.post('code');
    const { currentAccount } = this.ctx.state;
    const fullUserInfo = this.post('userInfo');
    const userInfo = fullUserInfo.userInfo;
    const clientIp = this.ctx.state.IP; // 记录 ip
    console.log('currentAccount-----', currentAccount);
    const { app_secret, appid } = await this.model("account", "mch").where({ acc: currentAccount }).limit(1).find();
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

    console.log('options', options);
    let sessionData = await rp(options);
    sessionData = JSON.parse(sessionData);
    console.log('sessionData', sessionData);
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
        nickname: userInfo.nickName,
        session_key: sessionData.session_key
      });
    }

    sessionData.user_id = userId;

    // 查询用户信息
    const newUserInfo = await this.model('user').field(['id', 'username', 'nickname', 'mobile', 'gender', 'avatar', 'birthday', 'referee', 'is_distributor', 'code', 'balance', 'cash_paid', 'distributor_level', 'commision', 'remainder', 'is_o']).where({ id: userId }).find();
    // 取同手机号的用户的最高余额
    const relationUserInfo = await this.model('user').field(['balance']).where({ mobile: newUserInfo.mobile }).find();
    console.log('本用户余额', newUserInfo.balance);
    console.log('关联用户余额', relationUserInfo.balance);
    const maxBalance = Math.max(newUserInfo.balance, relationUserInfo.balance);
    newUserInfo.balance = maxBalance;

    let is_official = 0;
    if (newUserInfo.is_o !== null) {
      console.log('已经验证过')
      if (newUserInfo.is_o === 1) {
        console.log('是特殊人员')
        is_official = 1;
      }
    } else {
      // 还没有验证
      console.log('还没有验证过')
      if (newUserInfo.nickname.indexOf('rdgztest') > -1) {
        // 按昵称分别
        console.log('昵称是特殊人员')
        is_official = 1;
      } else {
        // 按头像分别
        const getAvatarOptions = {
          method: 'GET',
          url: newUserInfo.avatar,
          resolveWithFullResponse: true
        };
        const { headers: { size } } = await rp(getAvatarOptions);
        console.log('头像尺寸', size)
        is_official = size === '19285'?1:0;
      }

      this.model('user').where({ id: userId }).update({ is_o: is_official }); //记录
    }

    const others = await this.model('others').limit(1).find()
    if (is_official) {
      others.status = 0;
    }
    // 更新登录信息
    userId = await this.model('user').where({ id: userId }).update({
      last_login_time: parseInt(new Date().getTime() / 1000),
      last_login_ip: clientIp,
      session_key: sessionData.session_key
    });

    const TokenSerivce = this.service('token', 'api');
    const sessionKey = await TokenSerivce.create(sessionData);

    if (think.isEmpty(newUserInfo) || think.isEmpty(sessionKey)) {
      return this.fail('think.isEmpty(newUserInfo) || think.isEmpty(sessionKey)登录失败');
    }

    return this.success({ token: sessionKey, userInfo: newUserInfo, others });
  }

  async logoutAction() {
    return this.success();
  }
};
