const Base = require('./base.js');
const fs = require('fs');
const _ = require('lodash');

module.exports = class extends Base {
  async infoAction() {
    const userInfo = await this.model('user').where({ mobile: '15989389319' }).find();
    delete userInfo.password;
    return this.json(userInfo);
  }
  async setrefereeAction() {
    const { referee } = this.post();
    let result;
    // 推荐人不能是自己
    if(parseInt(result) !== parseInt(think.userId))
      result = await this.model('user').where({ id: think.userId }).update({ referee });
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
};
