import Base from './base.js';
import Rest from './rest.js';
const namespace = "ad";
const actions = Rest(namespace);

class controller extends Base {
  /**
   * index action
   * @return {Promise} []
   */
  async indexAction(){
    //auto render template file index_index.htm
    const result = await this.model(namespace).limit(10).select();
    return this.success(result);
  }
}
Object.assign(controller.prototype, actions);
module.exports = controller;
