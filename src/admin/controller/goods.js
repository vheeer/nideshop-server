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
    const data = await this.model('goods').where({ category_id }).page(this.get('page'), 1000).countSelect();

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
    const data = await this.model('goods_gallery').where({ goods_id }).page(this.get('page'), 1000).countSelect();

    return this.success(data);
  }
  /**
   * postGoodsValuesAction action
   * @return {Promise} []
   */
  async postGoodsValuesAction() {
    const params = this.post();
    const { id, retail_price } = params;
    delete params.id;
    const model = this.model('goods');
    const result = await model.where({ id }).update(params);
    console.log(result);
    // 添加产品（临时）
    // const r = await this.model("goods").where({ category_id: ["IN", ["1036060", "1036065"]] }).select();
    // console.log("r", r);
    // for(const item of r) 
    // {
    //   const { id: sid, retail_price: xx } = item;
    //   console.log(sid);
    //   // 添加对应产品
    //   const lastInserProductId = await this.model("product").add({
    //     goods_id: sid,
    //     goods_number: 9999,
    //     goods_sn: sid,
    //     goods_specification_ids: "",
    //     retail_price: xx,
    //     add_time: parseInt(Date.now()/1000)
    //   });
    // }

    // 更改关联的产品价格（临时）
    try{
      if(retail_price)
        await this.model("product").where({ goods_id: id }).update({ retail_price });
    }catch(err){
      console.log("postGoods err: ", err);
      return this.fail(err);
    }
    return this.success(result);
  }
  /**
   * addGoods action
   * @return {Promise} []
   */
  async addGoodsAction() {
    const { category_id } = this.post();
    const model = this.model('goods');
    console.log(category_id);
    if(think.isEmpty(category_id)){
      return this.fail("未知分类");
    }
    // 添加时间
    const add_time = parseInt(new Date().getTime() / 1000);
    // 添加商品，返回ID
    const lastInserId = await model.add({ 
      name: "新商品", 
      category_id, 
      add_time
    });
    const result = await model.where({ id: lastInserId }).find();
    const { retail_price } = result; 

    // 添加对应产品
    const lastInserProductId = await this.model("product").add({ 
      goods_id: lastInserId,
      goods_number: 9999,
      goods_sn: lastInserId,
      goods_specification_ids: "",
      retail_price,
      add_time
    });
    // 修改商品的默认产品ID
    const result_1 = await model.where({ id: lastInserId }).update({ primary_product_id: lastInserProductId });
    
    return this.success(result);
  }
  /**
   * image action
   * @return {Promise} []
   */
  async addGalleryAction() {
    const { mch } = this.ctx.state;
    const { goodsId, column } = this.get();
    //储存
    const saveImgService = this.service('saveimg');
    const { save_path, url } = await saveImgService.saveToCloud(this.file(), mch);
    //入库
    const updateObj = {};
          updateObj[column] = url;
          updateObj["goods_id"] = goodsId;
          console.log(updateObj);
    const result = await this.model('goods_gallery').add(updateObj);
    
    return this.success(result);
  }
  /**
   * deleteGallery action
   * @return {Promise} []
   */
  async deleteGalleryAction() {
    const { galleryId } = this.post();

    const result = await this.model('goods_gallery').where({ id: galleryId }).delete();
    return this.success(result);
  }

  async infoAction() {
    const id = this.get('id');
    const model = this.model('goods');
    const data = await model.where({ id: id }).find();

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

  /**
   * image action
   * @return {Promise} []
   */
  async changeImageAction() {
    const { mch } = this.ctx.state;
    const { goodsId, column } = this.get();
    //储存
    const saveImgService = this.service('saveimg');
    const { save_path, url } = await saveImgService.saveToCloud(this.file(), mch);
    //入库
    const updateObj = {};
          updateObj[column] = url;
    const result = await this.model('goods').where({ id: goodsId }).update(updateObj);
    
    return this.success(result);
  }
  /**
   * delete request
   * @return {Promise}
   */
  async deletegoodsAction() {
    // return this.fail("can not delete");
    const postBody = this.post();
    const { goodsId: id } = postBody;

    if(!id)
      return this.fail("id is undefined");

    let data = await this.model('goods').where({ id }).delete();
    
    return this.success(data);
  }
};
