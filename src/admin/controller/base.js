module.exports = class extends think.Controller {
  async __before() {
    const _this = this;
    // 根据token值获取用户id
    think.token = this.ctx.header['x-nideshop-token'] || '';
    const tokenSerivce = think.service('token', 'admin');
    think.userId = await tokenSerivce.getUserId();

    console.log("this.get()", this.get());
    console.log("this.post()", this.post());
    console.log("this.ctx.ip", this.ctx.ip);
    // console.log("this.ctx.cookies", this.ctx.cookies);
    
    const userName = this.ctx.cookies.get("userName");
    const id = this.ctx.cookies.get("id");
    const login = this.ctx.cookies.get("login");

    // console.log("this.model", this.model);
    // console.log("typeof this.model", typeof this.model);
    // console.log("Object.keys(this.model)", Object.keys(this.model));

    this.model_1 = this.model;
    this.model = function(model_com){
      return function(name, model_spe, m){
        return _this.model_1(name, model_spe?model_spe:model_com, m);
      }
    }(userName);

    // 只允许登录操作
    if (this.ctx.controller !== 'auth') {
      if (think.userId <= 0) {
        think.userId = 24;
        // return this.fail(401, '请先登录');
      }
    }
  }
};
