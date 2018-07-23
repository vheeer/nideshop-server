const Base = require('./base.js');
const Rest = require('./rest.js');
const { readAction, createAction, updateAction, deleteAction, changeimgAction } = Rest("tag");

class top extends Base {
  /**
   * index action
   * @return {Promise} []
   */
  async indexAction() {
    const page = this.get('page') || 1;
    const size = this.get('size') || 10;
    const name = this.get('name') || '';

    const model = this.model('tag');
    const data = await model.limit(10).select();

    return this.success(data);
  }
};
top.prototype.readAction = readAction;
top.prototype.createAction = createAction;
top.prototype.updateAction = updateAction;
top.prototype.deleteAction = deleteAction;
top.prototype.changeimgAction = changeimgAction;
module.exports = top;
