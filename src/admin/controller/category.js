const Base = require('./base.js');

module.exports = class extends Base {
  /**
   * index action
   * @return {Promise} []
   */
  async indexAction() {
    const model = this.model('category');
    const data = await model.order("sort_order asc").select();
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
    const { parent_id } = this.post();
    const model = this.model('category');
    console.log(parent_id);
    let result;
    if(!think.isEmpty(parent_id)){
      const lastInserId = await model.add({ name: "新分类", parent_id, level: "L2" });
      result = await model.where({ id: lastInserId }).find();
    }else{
      const lastInserId = await model.add({ name: "新分类" });
      result = await model.where({ id: lastInserId }).find();
    }
    return this.success(result);
  }
  /**
   * image action
   * @return {Promise} []
   */
  async changeImageAction() {
    const { mch } = this.ctx.state;
    const { categoryId, column } = this.get();
    //储存
    const saveImgService = this.service('saveimg');
    const { save_path, url } = await saveImgService.saveToCloud(this.file(), mch);
    //入库
    const updateObj = {};
          updateObj[column] = url;
    const result = await this.model('category').where({ id: categoryId }).update(updateObj);
    
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
    const id = this.post('categoryId');
    const result = await this.model('category').where({ id: id }).limit(1).delete();
    // TODO 删除图片

    return this.success(result);
  }
};
