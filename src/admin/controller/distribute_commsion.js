import Base from './base.js';
import Rest from './rest.js';
const namespace = "distribute_commision";
const actions = Rest(namespace);

class controller extends Base {
  /**
   * index action
   * @return {Promise} []
   */
  async indexAction(){
    const result = await this.model(namespace).limit(10).select();
    return this.success(result);
  }

  /**
   * accept action 同意分销商申请
   * @return {Promise} []
   */
  async acceptAction(){
  	const id = this.post("id");
  	// 查找申请人、推荐人
    const { user_id, referee } = await this.model(namespace).field("user_id,referee").where({ id }).find();
    // 添加新分销商
    const result = await this.model("user").where({ id: user_id }).update({ is_distributor: 1, referee });
    // 删除分销商申请
    const delete_result = await this.model(namespace).where({ id }).delete();

    return this.success(result);
  }
}
Object.assign(controller.prototype, actions);
module.exports = controller;
