module.exports = class extends think.Controller {
  async __before() {
    // 根据token值获取用户id
    console.log("base __before ________");
    const _this = this;
    console.log("this.get() ", this.get());
    const { mch } = this.get();
    think.token = this.ctx.header['x-nideshop-token'] || '';
    const tokenSerivce = think.service('token', 'api');
    think.userId = await tokenSerivce.getUserId();


    // 多商户
    this.model_1 = this.model;
    this.model = function(model_com){
      return function(name, model_spe, m){
        return _this.model_1(name, model_spe?model_spe:model_com, m);
      }
    }(mch);


    const publicController = this.config('publicController');
    const publicAction = this.config('publicAction');
    // 如果为非公开，则验证用户是否登录
    const controllerAction = this.ctx.controller + '/' + this.ctx.action;
    if (!publicController.includes(this.ctx.controller) && !publicAction.includes(controllerAction)) {
      if (think.userId <= 0) {
        return this.fail(401, '请先登录');
      }
    }
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
    return think.userId;
  }
};
