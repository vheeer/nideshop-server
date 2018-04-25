const Base = require('./base.js');

module.exports = class extends Base {
  async indexAction() {
    console.log("this.ctx: ", this.ctx);
    console.log("this: ", this.get('id'));
    return this.success("success to option");
  }

  /**
   * read request
   * @return {Promise}
   */
  async readAction() {
    console.log("this.get is ", this.get());

    const { id, page, pageSize, order } = this.get();
    let data;
    if(id) //按id查询
    {
      data = await this.model("order").where({ id }).select();
    }
    else if(!id) //批量查询
    {
      if(order) //按字段排序
      {
        data = await this.model("order").order(order).page(page, pageSize).countSelect();
      }
      else if(!order) //默认排序
      {
        data = await this.model("order").page(page, pageSize).countSelect();
      }
    }
    return this.success(data);
  }  

  /**
   * read request
   * @return {Promise}
   */
  async createAction() {
    console.log("this.post is ", this.post());
    console.log("{...this.post()}", {...this.post()});
    let result;
    
    result = await this.model("order").add(this.post());
    
    return this.success(result);
  } 

  /**
   * update request
   * @return {Promise}
   */
  async updateAction() {
    console.log("this.post is ", this.post());
    const postBody = this.post();
    const { id } = postBody;
    delete postBody.id;

    let data = await this.model("order").where({ id }).update(postBody);
    
    return this.success(data);
  }

  /**
   * delete request
   * @return {Promise}
   */
  async deleteAction() {
    console.log("this.post is ", this.post());
    const postBody = this.post();
    const { id } = postBody;

    if(!id)
      return this.fail("id is undefined");

    let data = await this.model("order").where({ id }).delete();
    
    return this.success(data);
  }





  /**
   * index action
   * @return {Promise} []


  async infoAction() {
    const id = this.get('id');
    const model = this.model('order');
    const data = await model.where({id: id}).find();

    return this.success(data);
  }

  async storeAction() {
    if (!this.isPost) {
      return false;
    }

    const values = this.post();
    const id = this.post('id');

    const model = this.model('order');
    values.is_show = values.is_show ? 1 : 0;
    values.is_new = values.is_new ? 1 : 0;
    if (id > 0) {
      await model.where({id: id}).update(values);
    } else {
      delete values.id;
      await model.add(values);
    }
    return this.success(values);
  }

  /**
   * 订单提交
   * @returns {Promise.<void>}
   */
  async submitAction() {
    // 获取收货地址信息和计算运费
    const addressId = this.post('addressId');
    const checkedAddress = await this.model('address').where({ id: addressId }).find();
    if (think.isEmpty(checkedAddress)) {
      return this.fail('请选择收货地址');
    }
    const freightPrice = 0.00;

    // 获取要购买的商品
    const checkedGoodsList = await this.model('cart').where({ user_id: think.userId, session_id: 1, checked: 1 }).select();
    if (think.isEmpty(checkedGoodsList)) {
      return this.fail('请选择商品');
    }

    // 统计商品总价
    let goodsTotalPrice = 0.00;
    for (const cartItem of checkedGoodsList) {
      goodsTotalPrice += parseFloat((cartItem.number * cartItem.retail_price).toFixed(2));
    }

    // 获取订单使用的优惠券
    const couponId = this.post('couponId');
    const couponPrice = 0.00;
    if (!think.isEmpty(couponId)) {

    }

    // 订单价格计算
    const orderTotalPrice = goodsTotalPrice + freightPrice - couponPrice; // 订单的总价
    const actualPrice = orderTotalPrice - 0.00; // 减去其它支付的金额后，要实际支付的金额
    const currentTime = parseInt(this.getTime() / 1000);

    const orderInfo = {
      order_sn: this.model('order').generateOrderNumber(),
      user_id: think.userId,

      // 收货地址和运费
      consignee: checkedAddress.name,
      mobile: checkedAddress.mobile,
      province: checkedAddress.province_id,
      city: checkedAddress.city_id,
      district: checkedAddress.district_id,
      address: checkedAddress.address,
      freight_price: 0.00,

      // 留言
      postscript: this.post('postscript'),

      // 使用的优惠券
      coupon_id: 0,
      coupon_price: couponPrice,

      add_time: currentTime,
      goods_price: goodsTotalPrice,
      order_price: orderTotalPrice,
      actual_price: actualPrice
    };

    // 开启事务，插入订单信息和订单商品
    const orderId = await this.model('order').add(orderInfo);
    orderInfo.id = orderId;
    if (!orderId) {
      return this.fail('订单提交失败');
    }

    // 统计商品总价
    const orderGoodsData = [];
    for (const goodsItem of checkedGoodsList) {
      orderGoodsData.push({
        order_id: orderId,
        goods_id: goodsItem.goods_id,
        goods_sn: goodsItem.goods_sn,
        product_id: goodsItem.product_id,
        goods_name: goodsItem.goods_name,
        list_pic_url: goodsItem.list_pic_url,
        market_price: goodsItem.market_price,
        retail_price: goodsItem.retail_price,
        number: goodsItem.number,
        goods_specifition_name_value: goodsItem.goods_specifition_name_value,
        goods_specifition_ids: goodsItem.goods_specifition_ids
      });
    }

    await this.model('order_goods').addMany(orderGoodsData);
    await this.model('cart').clearBuyGoods();

    return this.success({ orderInfo: orderInfo });
  }

   /**
   * 确认发货
   * @returns {Promise.<void>}
   */
  async shippedAction() {
    const orderId = this.post('orderId');
    const orderInfo = this.model('order').where({ user_id: think.userId, id: orderId }).find();
    if(think.isEmpty(orderInfo)){
      return this.fail('订单不存在');
    }
    const result = await this.model('order').updateOrderStatus( orderId, 300 );
    if(result > 0)
      this.success({ mes: "success" });
    else
      this.fail({ mes: "fail" });
  }

  async destoryAction() {
    const id = this.post('id');
    await this.model('order').where({id: id}).limit(1).delete();

    // 删除订单商品
    await this.model('order_goods').where({order_id: id}).delete();

    // TODO 事务，验证订单是否可删除（只有失效的订单才可以删除）

    return this.success();
  }
};
