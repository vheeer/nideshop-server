/* eslint-disable no-multi-spaces */
const Base = require('./base.js');

module.exports = class extends Base {
  /**
   * 获取支付的请求参数
   * @returns {Promise<PreventPromise|void|Promise>}
   */
  async prepayAction() {
    const that = this;
    const { orderId } = this.get();
    const { currentAccount } = this.ctx.state;
    console.log(this.ctx.state);
    const params = await this.model("account", "mch").where({ acc: currentAccount }).limit(1).find();

    const orderInfo = await this.model('order', params.model).where({ id: orderId }).find();

    if (think.isEmpty(orderInfo)) {
      return this.fail(400, '订单已取消');
    }
    if (parseInt(orderInfo.pay_status) !== 0) {
      return this.fail(400, '订单已支付，请不要重复操作');
    }
    const openid = await this.model('user', params.model).where({ id: orderInfo.user_id }).getField('weixin_openid', true);
    if (think.isEmpty(openid)) {
      think.logger.warn('找不到openid');
      return this.fail('微信支付失败');
    }


    const { is_sub } = params;
    let WeixinSerivce_params;
    if(is_sub === 1){
      // 服务商模式
      WeixinSerivce_params = {
        is_sub,
        appid: that.config("operator.appid"),
        mch_id: that.config("operator.mch_id"),
        partner_key: params.partner_key,
        sub_appid: params.appid,
        sub_mch_id: params.mch_id, 
        sub_openid: openid
      }
    }else{
      WeixinSerivce_params = {
        // 非服务商模式
        is_sub,
        appid: params.appid,
        mch_id: params.mch_id, 
        partner_key: params.partner_key,
        openid
      }
    }
    const WeixinSerivce = this.service('weixin', 'api', WeixinSerivce_params);
    try {
      //统一下单
      const outTradeNo = orderInfo.order_sn + "" + Math.round(new Date().getTime()/1000);
      const returnParams = await WeixinSerivce.createUnifiedOrder({
        body: '商户订单：' + orderInfo.order_sn,
        out_trade_no: outTradeNo,
        total_fee: Math.round((orderInfo.actual_price * 100).toFixed(2)),
        spbill_create_ip: '',
        attach: "account=" + currentAccount + "&is_sub=" + is_sub  //临时
      });
      console.log("统一下单返回：", returnParams);
      const result = await this.model("order", params.model).where({ id: orderId }).update({ out_trade_no: outTradeNo }); //更新out_trade_no
      return this.success(returnParams);
    } catch (err) {
      think.logger.warn('微信支付失败', err);
      return this.fail('微信支付失败');
    }
  }

  async notifyAction_new() {
    console.log("----------------weixin notify----------------");
    //获取字节流函数 @return promise
    function parsePostData(http) {
      return new Promise((resolve, reject) => {
        let postdata = "";
        try{
          http.req.addListener('data', data => postdata += data);
          http.req.addListener("end", () => resolve(postdata));
        }catch(err) {
          reject(err);
        }
      })
    }
    //XML字符串转对象函数 @return promise
    const xml2obj = xmlStr => new Promise((resolve, reject) => 
      parseString(xmlStr, (err, result) => resolve(result))
    );
    //验证返回结果是否正常服务
    const WeixinSerivce = this.service('weixin', 'api');
    const WS = WeixinSerivce;
    // 获取兼容ctx
    const ctx = this.ctx || this.http;
    console.log("http.req", ctx.req);
    // 获取字节流（字符串）
    const string = await parsePostData(ctx);
    console.log("notify string: ", string);
    // 字符串转对象
    const obj = await xml2obj(string);
    console.log("notify obj: ", obj);
    // 检验是否成功支付
    const result = WS.payNotify(obj['xml']);
    console.log("notify result: ", result);
      console.log("result", result);
    // 结果未通过检验
    if(!result)
      return this.success(`<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[支付失败]]></return_msg></xml>`);
    
    // 查找订单对应产品信息
    const { out_trade_no } = result;
    console.log("result.out_trade_no is ", result.out_trade_no);
    const productInfo = await this.model("product").where({ order_sn: out_trade_no }).find();
    
    // 如果已经收到支付成功该信息则返回错误
    if(productInfo.is_pay === 1){
      console.log("已经支付成功");
      return this.success(`<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[已经支付成功]]></return_msg></xml>`);
    }
    
    // 不存在则返回错误
    if (think.isEmpty(productInfo)) 
      return this.success(`<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[订单不存在]]></return_msg></xml>`);
    
    // 更新支付状态
    const update_result = await this.model("order").where({ order_sn: out_trade_no }).update({ is_pay: 1});
    if(!update_result);
      return this.success(`<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[订单不存在]]></return_msg></xml>`);
    
    return this.success(`<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>`);
  }

  async notifyAction() {
    console.log("----------------weixin notify----------------");
    let WeixinSerivce = this.service('weixin', 'api');
    console.log("this.post('xml')", this.post('xml'));
    
    const result = await WeixinSerivce.payNotify(this.post('xml'), this);

    console.log("notify post XML", result);
    if (!result) {
      return `<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[支付失败]]></return_msg></xml>`;
    }
    
    const { account, is_sub, type, out_trade_no, attach } = result;
    console.log('account', account);
    const { model: currentModel } = await this.model("account", "mch").where({ acc: account }).limit(1).find();

    console.log("currentModel: ", currentModel);

    const thisTime = parseInt(Date.now() / 1000);

    // 申请分销支付
    if(type === '1'){
      console.log('申请分销支付');
      const userModel = this.model("user", currentModel);
      const othersModel = this.model("others", currentModel);
      const distribute_commisionModel = this.model("distribute_commision", currentModel);
      const joinModel = this.model('join', currentModel);
      const { id: join_id, user_id, referee: referee_join, total_fee, distributor_level, pay_status } = await joinModel.where({ out_trade_no }).find();
      if (think.isEmpty(join_id)) {
        return `<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[订单不存在]]></return_msg></xml>`;
      }
      if (pay_status === 2) {
        console.log("已经支付成功");
        return `<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[已经支付成功]]></return_msg></xml>`;
      }
      const changePayStatus = await joinModel.where({ id: join_id }).update({ pay_status: 2, result: JSON.stringify(result), attach });
      // 成为分销商
      const distributorRes = await userModel.where({ id: user_id }).update({ is_distributor: 1, distributor_level });
      // 分销佣金处理
      const { is_distribute, dream_first_commision, dream_second_commision, angle_first_commision, angle_second_commision } = await othersModel.limit(1).find(); // 佣金比例
      let first_commision = distribute_level === 0?dream_first_commision:(distribute_level === 1?angle_first_commision:null);
      let second_commision = distribute_level === 0?dream_second_commision:(distribute_level === 1?angle_second_commision:null);
      if (is_distribute === 1) {
        // 关闭分销功能--不返佣
        if(referee_join === null || referee_join === 0){
          // 订单不参与分销或一级推荐人是总店--不返佣
          console.log('订单不参与分销或一级推荐人是总店--不返佣')
        }else{
          const { is_distributor: referee_1_is_distributor, referee: referee_2, balance: balance_1 } = await userModel.where({ id: referee_join }).find(); //一级推荐人
          if(referee_1_is_distributor === 0){
            // 一级推荐人不是分销商--不返佣
            console.log('一级推荐人不是分销商--不返佣')
          }else if(referee_1_is_distributor === 1){
            // 一级推荐人是分销商--一级返佣
            console.log('一级推荐人是分销商--一级返佣')
            const add_commsion_1 = parseFloat(((total_fee / 100) * (first_commision / 100)).toFixed(2));
            const new_balance_1 = parseFloat((balance_1 + add_commsion_1).toFixed(2));
            const add_balance_result_1 = await userModel.where({ id: referee_join }).update({ balance: new_balance_1 }); //返佣
            const add_commsion_result_1 = await distribute_commisionModel.add({
              user_id: referee_join,
              commision_price: add_commsion_1,
              level: 1,
              join_id,
              type: 1,
              add_time: thisTime
            }); //返佣记录
            console.log('add_balance_result_1', add_balance_result_1);
            if(referee_2 === 0){
              // 二级推荐人是总店--不返佣
              console.log( '二级推荐人是总店--不返佣')
            }else{
              const { is_distributor: referee_2_is_distributor, referee: referee_3, balance: balance_2 } = await userModel.where({ id: referee_2 }).find(); //二级推荐人
              if(referee_2_is_distributor === 0){
                // 二级推荐人不是分销商（不可能发生）--不返佣
                console.log( '二级推荐人不是分销商（不可能发生）--不返佣')
              }else if(referee_2_is_distributor === 1){
                // 二级推荐人是分销商--二级返佣
                console.log( '二级推荐人是分销商--二级返佣')
                const add_commsion_2 = parseFloat(((total_fee / 100) * (second_commision / 100)).toFixed(2));
                const new_balance_2 = parseFloat((balance_2 + add_commsion_2).toFixed(2));
                const add_balance_result_2 = await userModel.where({ id: referee_2 }).update({ balance: new_balance_2 }); //返佣
                const add_commsion_result_2 = await distribute_commisionModel.add({
                  user_id: referee_2, 
                  commision_price: add_commsion_2, 
                  level: 2, 
                  add_time: thisTime,
                  join_id,
                  type: 1
                }); //返佣记录
              }
            }
          }
        }
      }
      console.log('result ', result);
      return;
    }

    // 已确定的商户模型
    const orderModel = this.model('order', currentModel);
    const userModel = this.model('user', currentModel);
    const othersModel = this.model('others', currentModel);
    const distribute_commisionModel = this.model('distribute_commision', currentModel);

    const orderSn = out_trade_no.substring(0, 20);
    const orderInfo = await orderModel.getOrderByOrderSn(orderSn);

    think.logger.debug("out_trade_no is ", out_trade_no);
    think.logger.debug("orderInfo is ", orderInfo);    // 如果已经收到支付成功该信息则返回错误


    if (think.isEmpty(orderInfo)) {
      return `<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[订单不存在]]></return_msg></xml>`;
    }
    
    if (orderInfo.pay_status === 2) {
      console.log("已经支付成功");
      return `<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[已经支付成功]]></return_msg></xml>`;
    }

    orderInfo.pay_status == 1;

    if (orderModel.updatePayStatus(orderInfo.id, 2)) {
    } else {
      return `<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[订单不存在]]></return_msg></xml>`;
    }

    // 分销佣金处理
    const { id: order_id, referee: referee_order, actual_price } = orderInfo;
    const { is_distribute, first_commision, second_commision } = await othersModel.limit(1).find(); //佣金比例
    console.log('{ is_distribute, first_commision, second_commision }', { is_distribute, first_commision, second_commision });
    if (is_distribute === 1)
    {
      // 关闭分销功能--不返佣
      if(referee_order === null || referee_order === 0){
        // 订单不参与分销或一级推荐人是总店--不返佣
        console.log('订单不参与分销或一级推荐人是总店--不返佣')
      }else{
        const { is_distributor: referee_1_is_distributor, referee: referee_2, balance: balance_1 } = await userModel.where({ id: referee_order }).find(); //一级推荐人
        if(referee_1_is_distributor === 0){
          // 一级推荐人不是分销商--不返佣
          console.log( '一级推荐人不是分销商--不返佣')
        }else if(referee_1_is_distributor === 1){
          // 一级推荐人是分销商--一级返佣
          console.log('一级推荐人是分销商--一级返佣')
          const add_commsion_1 = parseFloat((actual_price * (first_commision/100)).toFixed(2));
          // 延期返佣
          // const new_balance_1 = parseFloat((balance_1 + add_commsion_1).toFixed(2));
          // const add_balance_result_1 = await userModel.where({ id: referee_order }).update({ balance: new_balance_1 }); //返佣
          const add_commsion_result_1 = await distribute_commisionModel.add({
            user_id: referee_order, 
            commision_price: add_commsion_1, 
            level: 1, 
            add_time: thisTime,
            order_id
          }); //返佣记录
          // console.log('add_balance_result_1', add_balance_result_1);
          if(referee_2 === 0){
            // 二级推荐人是总店--不返佣
            console.log( '二级推荐人是总店--不返佣')
          }else{
            const { is_distributor: referee_2_is_distributor, referee: referee_3, balance: balance_2 } = await userModel.where({ id: referee_2 }).find(); //二级推荐人
            if(referee_2_is_distributor === 0){
              // 二级推荐人不是分销商（不可能发生）--不返佣
              console.log( '二级推荐人不是分销商（不可能发生）--不返佣')
            }else if(referee_2_is_distributor === 1){
              // 二级推荐人是分销商--二级返佣
              console.log( '二级推荐人是分销商--二级返佣')
              const add_commsion_2 = parseFloat((actual_price * (second_commision/100)).toFixed(2));
              // 延期返佣
              // const new_balance_2 = parseFloat((balance_2 + add_commsion_2).toFixed(2));
              // const add_balance_result_2 = await userModel.where({ id: referee_2 }).update({ balance: new_balance_2 }); //返佣
              const add_commsion_result_2 = await distribute_commisionModel.add({
                user_id: referee_2, 
                commision_price: add_commsion_2, 
                level: 2, 
                add_time: thisTime,
                order_id
              }); //返佣记录
            }
          }
        }
      }
    }
    return `<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>`;
  }

};
