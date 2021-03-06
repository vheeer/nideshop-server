const _ = require('lodash');

module.exports = class extends think.Model {
  /**
   * 生成订单的编号order_sn
   * @returns {string}
   */
  generateOrderNumber() {
    const date = new Date();
    return date.getFullYear() + _.padStart(date.getMonth(), 2, '0') + _.padStart(date.getDay(), 2, '0') + _.padStart(date.getHours(), 2, '0') + _.padStart(date.getMinutes(), 2, '0') + _.padStart(date.getSeconds(), 2, '0') + _.random(100000, 999999);
  }

  /**
   * 获取订单可操作的选项
   * @param orderId
   * @returns {Promise.<{cancel: boolean, delete: boolean, pay: boolean, comment: boolean, delivery: boolean, confirm: boolean, return: boolean}>}
   */
  async getOrderHandleOption(orderId) {
    const handleOption = {
      cancel: false, // 取消操作
      delete: false, // 删除操作
      pay: false, // 支付操作
      comment: false, // 评论操作
      delivery: false, // 确认收货操作
      confirm: false, // 完成订单操作
      refund: false, // 退换货操作
      buy: false // 再次购买
    };

    const orderInfo = await this.where({id: orderId}).find();

    // 订单流程：下单成功－》支付订单－》发货－》收货－》评论
    // 订单相关状态字段设计，采用单个字段表示全部的订单状态
    // 1xx表示订单取消和删除等状态 0订单创建成功等待付款，101订单已取消，102订单已删除
    // 2xx表示订单支付状态,201订单已付款，等待发货
    // 3xx表示订单物流相关状态,300订单已发货，301用户确认收货
    // 4xx表示订单退换货相关的状态,401没有发货，退款402,已收货，退款退货,403退货退款完成
    // 如果订单已经取消或是已完成，则可删除和再次购买
    if (orderInfo.order_status === 101) {
      handleOption.delete = true;
      handleOption.buy = true;
    }

    // 如果订单没有被取消，且没有支付，则可支付，可取消
    if (orderInfo.order_status === 0) {
      handleOption.cancel = true;
      handleOption.pay = true;
    }

    // 如果订单已付款，没有发货，则可退款操作
    if (orderInfo.order_status === 201) {
      handleOption.refund = true;
    }

    // 如果订单已经发货，没有收货，则可收货操作和退款、退货操作
    if (orderInfo.order_status === 300) {
      handleOption.confirm = true;
      handleOption.refund = true;
    }

    // 如果订单已经支付，且已经收货，则可完成交易、评论和再次购买
    if (orderInfo.order_status === 301) {
      handleOption.delete = true;
      handleOption.comment = true;
      handleOption.buy = true;
      handleOption.refund = true;
    }

    return handleOption;
  }

  async getOrderStatusText(orderId) {
    const orderInfo = await this.where({id: orderId}).find();
    let statusText = '未付款';
    think.logger.debug('order status = ' + orderInfo.order_status);
    switch (orderInfo.order_status) {
      case 0:
        statusText = '未付款';
        break;
      case 101:
        statusText = '已取消';
        break;
      case 102:
        statusText = '已删除';
        break;
      case 201:
        statusText = '待发货';
        break;
      case 300:
        statusText = '已发货';
        break;
      case 301:
        statusText = '已收货';
        break;
      case 401:
        statusText = '退款申请中';
        break;
      case 403:
        statusText = '已退款';
        break;
    }

    return statusText;
  }

  /**
   * 更改订单支付状态
   * @param orderId
   * @param payStatus
   * @returns {Promise.<boolean>}
   */
  async updatePayStatus(orderId, payStatus = 0) {
    const orderStatus = payStatus === 2 ? 201 : 0;
    // return this.where({id: orderId}).limit(1).update({pay_status: parseInt(payStatus)});
    const thisTime = parseInt(Date.now() / 1000);
    return this.where({ id: orderId }).limit(1).update({ pay_status: parseInt(payStatus), order_status: orderStatus, pay_time: thisTime });
  }

  /**
   * 更改订单状态
   * @param orderId
   * @param orderStatus
   * @returns {Promise.<boolean>}
   */
  async updateOrderStatus(orderId, orderStatus) {
    if(orderId === undefined || orderStatus === undefined)
      return {};
    // return this.where({id: orderId}).limit(1).update({pay_status: parseInt(payStatus)});
    return this.where({ id: orderId }).limit(1).update({ order_status: orderStatus });
  }

  /**
   *取消订单
   * @param orderId
   * @returns {Promise.<number>}
   */
  async cancelOrder(orderId) {
    return this.where({ id: orderId }).limit(1).update({ order_status: 101 });
  }

  /**
   * 根据订单编号查找订单信息
   * @param orderSn
   * @returns {Promise.<Promise|Promise<any>|T|*>}
   */
  async getOrderByOrderSn(orderSn) {
    if (think.isEmpty(orderSn)) {
      return {};
    }
    return this.where({order_sn: orderSn}).find();
  }
};
