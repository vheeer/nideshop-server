const Base = require('./base.js');

module.exports = class extends Base {
  /**
   * index action
   * @return {Promise} []
   */
  async indexAction() {
    const page = this.get('page') || 1;
    const size = this.get('size') || 10;
    const name = this.get('name') || '';

    const model = this.model('goods');
    const data = await model.where({name: ['like', `%${name}%`]}).order(['id DESC']).page(page, size).countSelect();

    return this.success(data);
  }

  /**
   * getGoodsByCategory action
   * @return {Promise} []
   */
  async getGoodsByCategoryAction() {
    const category_id = this.get('category_id');
    if(!category_id)
      this.fail('can not get category_id');
    const data = await this.model('goods').where({ category_id }).countSelect();

    return this.success(data);
  }

  /**
   * getGalleryByGood action
   * @return {Promise} []
   */
  async getGalleryByGoodAction() {
    const goods_id = this.get('goods_id');
    if(!goods_id)
      this.fail('can not get goods_id');
    const data = await this.model('goods_gallery').where({ goods_id }).countSelect();

    return this.success(data);
  }
  /**
   * getGalleryByGood action
   * @return {Promise} []
   */
  async getGalleryByGoodAction() {
    const goods_id = this.get('goods_id');
    if(!goods_id)
      this.fail('can not get goods_id');
    const data = await this.model('goods_gallery').where({ goods_id }).countSelect();

    return this.success(data);
  }
  /**
   * postGoodsValuesAction action
   * @return {Promise} []
   */
  async postGoodsValuesAction() {
    const params = this.post();
    const id = params.id;
    delete params.id;
    const model = this.model('goods');
    const result = await model.where({ id: id }).update(params);
    return this.success(result);
  }

  async infoAction() {
    const id = this.get('id');
    const model = this.model('goods');
    const data = await model.where({id: id}).find();

    return this.success(data);
  }

  async storeAction() {
    if (!this.isPost) {
      return false;
    }

    const values = this.post();
    const id = this.post('id');

    const model = this.model('goods');
    values.is_on_sale = values.is_on_sale ? 1 : 0;
    values.is_new = values.is_new ? 1 : 0;
    values.is_hot = values.is_hot ? 1 : 0;
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
    await this.model('goods').where({id: id}).limit(1).delete();
    // TODO 删除图片

    return this.success();
  }
};
