module.exports = class extends think.Controller {
  async __before() {
    // 根据token值获取用户id
    think.logger.info("API before ________________________");
    const _this = this;
    // 指定URL跳过前置操作
    const ingoreURL = [ '/api/pay/notify' ];
    const { url } = this.ctx.req;
    if (ingoreURL.indexOf(url) > -1) {
      return;
    }
    // 用户Id
    think.token = this.ctx.header['x-nideshop-token'] || '';
    const tokenSerivce = think.service('token', 'api');
    const userId = await tokenSerivce.getUserId();
    this.ctx.state.userId = userId;
    console.log('----------------userId--------------', userId);

    // 如果为非公开，则验证用户是否登录
    const publicController = this.config('publicController');
    const publicAction = this.config('publicAction');
    const controllerAction = this.ctx.controller + '/' + this.ctx.action;
    if (!publicController.includes(this.ctx.controller) && !publicAction.includes(controllerAction)) {
      if (userId <= 0) {
        return this.fail(401, '请先登录');
      }
    }
    // 商户账号
    const { mch: account } = this.get();
    //临时
    let currentAccount = account;
    if(account === 'haina')
      currentAccount = 'bainachuan';
    this.ctx.state["currentAccount"] = currentAccount;
    think.logger.debug('account', account);
    // 商户模型
    const { model: currentModel } = await this.model('account', 'mch').where({ acc: currentAccount }).find(); 
    this.ctx.state["currentModel"] = currentModel;
    think.logger.debug('currentModel', currentModel);
    // Controller 商户模型
    this.model_1 = this.model;
    this.model = function(model_com){
      return function(name, model_spe, m){
        return _this.model_1(name, model_spe?model_spe:model_com, m);
      }
    }(currentModel);
  }

  /**
   * 获取时间戳
   * @returns {Number}
   */
  getTime() {
    return parseInt(Date.now() / 1000);
  }

  /**
   * 获取当前登录用户的id
   * @returns {*}
   */
  getLoginUserId() {
    return this.ctx.state.userId;
  }
};
