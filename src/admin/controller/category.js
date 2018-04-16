const Base = require('./base.js');

module.exports = class extends Base {
  /**
   * 旧的index
   * index action
   * @return {Promise} []
   */
  // async indexAction() {
  //   const model = this.model('category');
  //   const data = await model.where({is_show: 1}).order(['sort_order ASC']).select();
  //   const topCategory = data.filter((item) => {
  //     return item.parent_id === 0;
  //   });
  //   const categoryList = [];
  //   topCategory.map((item) => {
  //     item.level = 1;
  //     categoryList.push(item);
  //     data.map((child) => {
  //       if (child.parent_id === item.id) {
  //         child.level = 2;
  //         categoryList.push(child);
  //       }
  //     });
  //   });
  //   return this.success(categoryList);
  // }

  /**
   * index action
   * @return {Promise} []
   */
  async indexAction() {
    const model = this.model('category');
    const data = await model.select();
    // const data = await model.where({ is_show: 1 }).select();
    return this.success(data);
  }
  /**
   * postCategoryValues action
   * @return {Promise} []
   */
  async postCategoryValuesAction() {
    const params = this.post();
    const id = params.id;
    delete params.id;
    const model = this.model('category');
    const result = await model.where({ id: id }).update(params);
    return this.success(result);
  }
  /**
   * addCategory action
   * @return {Promise} []
   */
  async addCategoryAction() {
    const params = this.post();
    const model = this.model('category');
    const lastInserId = await model.add({ name: "新增分类" });
    const result = await model.where({ id: lastInserId }).find();
    return this.success(result);
  }

  async topCategoryAction() {
    const model = this.model('category');
    const data = await model.where({ parent_id: 0 }).order(['id ASC']).select();

    return this.success(data);
  }

  async infoAction() {
    const id = this.get('id');
    const model = this.model('category');
    const data = await model.where({id: id}).find();

    return this.success(data);
  }

  async storeAction() {
    if (!this.isPost) {
      return false;
    }

    const values = this.post();
    const id = this.post('id');

    const model = this.model('category');
    values.is_show = values.is_show ? 1 : 0;
    if (id > 0) {
      await model.where({id: id}).update(values);
    } else {
      delete values.id;
      await model.add(values);
    }
    return this.success(values);
  }

  async destoryAction() {
    const id = this.post('id');
    await this.model('category').where({id: id}).limit(1).delete();
    // TODO 删除图片

    return this.success();
  }
};
