import Base from './base.js';
import Rest from './rest.js';
const namespace = "distribute_apply";
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
  	// 查找申请人、一级推荐人
    const { user_id } = await this.model(namespace).field("user_id").where({ id }).find();
    const { referee: referee_1 } = await this.model("user").field("referee").where({ id: user_id }).find();


    let current_distributor;
    if(referee_1 === 0){
      // 一级推荐人是总店
      current_distributor = 0;
    }else{
      // 一级推荐人不是总店
      let current_user_id = referee_1;
      for(let i=1;i<100;i++)
      {
        console.log("向上查找推荐人", current_user_id, " 第" + i + "次");
        // 如果是总店的话，结束循环
        if(current_user_id === 0){
          current_distributor = 0;
          break;
        }

        const pre_user = await this.model("user").where({ id: current_user_id }).find();
        if(pre_user.is_distributor === 1){
          // 推荐人是分销商，结束循环
          current_distributor = pre_user.id;
          break;
        }else if(pre_user.is_distributor === 0){
          // 推荐人不是分销商，继续找推荐人的推荐人
          current_user_id = pre_user.referee;
        }else{
          // 不存在此用户
          console.log("不存在用户：", current_user_id);
          return this.fail("不存在用户：", current_user_id);
        }
      }
    }

    // 添加新分销商
    const result = await this.model("user").where({ id: user_id }).update({ is_distributor: 1, referee: current_distributor });
    // 删除分销商申请
    const delete_result = await this.model(namespace).where({ id }).delete();

    return this.success(result);
  }
}
Object.assign(controller.prototype, actions);
module.exports = controller;
