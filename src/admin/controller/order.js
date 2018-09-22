const Base = require('./base.js');
const Rest = require('./rest.js');
const { readAction, createAction, updateAction, deleteAction, changeImageAction } = Rest("order");
const wxPayment = require('wx-payment');

wxPayment.refund_promise = orderData => new Promise((resolve, reject) =>
  wxPayment.refund(orderData, function(err, result){
    if(err)
      reject(err);
    resolve(result);
  })
);

class top extends Base {
  async indexAction() {
    console.log("think.Model.relation", Object.keys(think.model));
    return this.success(Object.keys(think.Model));
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
        goods_specifition_ids: goodsItem.goods_specifition_ids,
        goods_unit: goodsItem.goods_unit
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
    const orderId = this.post('id');
    const orderInfo = this.model('order').where({ user_id: think.userId, id: orderId }).find();
    if(think.isEmpty(orderInfo)){
      return this.fail('订单不存在');
    }
    const order_result = await this.model('order').updateOrderStatus( orderId, 300 );
    const shipping_result = await this.model('order').where({ id: orderId }).update({ shipping_status: 1 });
    console.log("确认发货结果", shipping_result);
    if(order_result > 0 && shipping_result > 0)
      this.success({ mes: "success" });
    else
      this.fail({ mes: "fail" });
  }
   /**
   * 拒绝退款
   * @returns {Promise.<void>}
   */
  async refuserefundAction() {
    const orderId = this.post('id');
    const orderInfo = await this.model('order').where({ id: orderId }).find();
    if(think.isEmpty(orderInfo)){
      return this.fail('订单不存在');
    }

    const { shipping_status } = orderInfo;
    let order_status;
    switch(shipping_status)
    {
      case 0:
        order_status = 201;
        break;
      case 1:
        order_status = 300;
        break;
      case 2:
        order_status = 301;
        break;
      default:
        break;
    }
    const order_result = await this.model('order').where({ id: orderId }).update({ order_status });

    if(order_result > 0)
      this.success({ mes: "success" });
    else
      this.fail({ mes: "fail" });
  }

  /**
   * 同意退款
   * @returns {Promise.<void>}
   */
  async acceptrefundAction() {
    const _this = this;
    const { mch } = this.ctx.state;
    const orderId = this.post('id');
    const orderInfo = await this.model('order').where({ id: orderId }).find();
    const { appid, mch_id, partner_key } = await this.model('account', 'mch').where({ acc: mch }).limit(1).find();

    if(think.isEmpty(orderInfo)){
      return this.fail('订单不存在');
    }
    const thisTime = parseInt(Date.now() / 1000);
    const lastDays = thisTime - (3600 * 24 * 7);

    if (orderInfo.receive_time < lastDays) {
      return _this.fail('已超出退款期限')
    }

    wxPayment.init({
      appid,
      mch_id,
      apiKey: partner_key, //微信商户平台API密钥
      pfx: require('fs').readFileSync(this.config("cert_root") + mch + '/apiclient_cert.p12'), //微信商户平台证书 (optional，部分API需要使用)
    });

    const out_refund_no = parseInt(Date.now()) + Math.round(Math.random() * 1000);

    console.log('实际退款价格', (orderInfo.actual_price * 100).toFixed());

    const result = await wxPayment.refund_promise({
      out_refund_no,
      out_trade_no: orderInfo.out_trade_no,
      total_fee: (orderInfo.actual_price * 100).toFixed(),
      refund_fee: (orderInfo.actual_price * 100).toFixed(),
      op_user_id: orderInfo.user_id,
    });

    console.log('退款结果', result);

    if(result.result_code === "SUCCESS"){
      await _this.model('order').where({ id: orderId }).update({ order_status: 403, out_refund_no });
      _this.success(result.err_code_des);
    }else{
      _this.fail(result.err_code_des?result.err_code_des:'退款失败');
    }
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
    // 改变运单号
    if(typeof postBody["freight_id"] !== "undefined")
    {
      const thenUpdateResult = await this.model("order_express").where({ order_id: id }).thenUpdate({
        order_id: id,
        logistic_code: postBody["freight_id"],
        shipper_name: "邮政快递包裹",
        shipper_code: "YZPY"
      },{
        order_id: id
      });
      const latestExpressInfo = await this.model('order_express').getLatestOrderExpress(id);
    }
    return this.success(data);
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
top.prototype.readAction = readAction;
top.prototype.createAction = createAction;
// top.prototype.updateAction = updateAction;
top.prototype.deleteAction = deleteAction;
top.prototype.changeImageAction = changeImageAction;
module.exports = top;
