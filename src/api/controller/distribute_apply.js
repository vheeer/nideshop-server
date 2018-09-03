import Base from './base.js';

class controller extends Base {
  /**
   * index action
   * @return {Promise} []
   */
  async indexAction(){
    const result = await this.model(namespace).limit(10).select();
    return this.success(result);
  }


  async applyAction(){
    const userId = this.ctx.state.userId; //申请人Id
    const { real_name, mobile, distributor_level } = this.post();

    const apply_record = await this.model("distribute_apply").where({ user_id: userId }).find();

    if(!think.isEmpty(apply_record))
      return this.fail(1);

    // 添加申请记录
    const add_result = await this.model("distribute_apply").thenUpdate({
      user_id: userId,
      real_name,
      add_time: parseInt(Date.now()/1000)
    },{
      user_id: userId
    });
    // 成为分销商
    // const update_referee = await this.model("user").where({ id: userId }).update({ is_distributor: 1, referee: current_distributor });

    return this.success(add_result);
  }
}
module.exports = controller;
