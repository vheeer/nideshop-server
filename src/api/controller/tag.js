const Base = require('./base.js');

module.exports = class extends Base {
  async listAction() {
    const model = this.model('tag');
    const data = await model.limit(10).select();

    return this.success(data);
  }

  async detailAction() {
    const model = this.model('tag');
    const data = await model.where({id: this.get('id')}).find();

    return this.success({tag: data});
  }
};
