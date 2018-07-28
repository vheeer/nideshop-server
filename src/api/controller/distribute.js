const Base = require('./base.js');

import WechatPayment from "wx-payment";
import fs from "fs";
const request = require('request');


module.exports = class extends Base {
  async withdrawAction() {
  	const { currentAccount } = this.ctx.state;
    const { real_name, amount } = this.post();
    const user_id = this.ctx.state.userId;
  	const notify_url = this.config("weixin.notify_url");
  	const certRoot = this.config("cert_root"); //证书根目录
  	const pfx = fs.readFileSync(certRoot + currentAccount + '/apiclient_cert.p12'); //证书文件

  	const { appid, partner_key, mch_id } = await this.model("account", "mch").where({ acc: currentAccount }).limit(1).find();
  	const { weixin_openid: openid } = await this.model("user").where({ id: user_id }).limit(1).find();

  	//微信支付参数
  	let options = {
  	  appid,
  	  mch_id,
  	  notify_url,
  	  pfx, //微信商户平台证书 (optional，部分API需要使用)
  	  apiKey: partner_key, //微信商户平台API密钥
  	  trade_type: 'JSAPI' //APP, JSAPI, NATIVE etc.
  	};
  	console.log("微信支付参数: ", options);

  	WechatPayment.init(options);

  	let orderData = {
  	  partner_trade_no: parseInt(Math.random() * 100000000), //商户订单号，需保持唯一性
  	  openid,
  	  check_name: 'OPTION_CHECK',
  	  re_user_name: real_name,
  	  amount,
  	  desc: '付款',
  	  spbill_create_ip: '192.168.0.1'
  	}
  	console.log("退款订单：", orderData);

  	// ES6
  	WechatPayment.transfers_promise = orderData => new Promise((resolve, reject) =>
  		WechatPayment.transfers(orderData, function(err, result){
  		  if(err)
  		  	reject(err);
  		  resolve(result);
  		})
  	);
  	const result = await WechatPayment.transfers_promise(orderData);
  	console.log(result);
  	return this.success("success");
  }
/*
  async applyAction(){
    const userId = think.userId; //申请人Id
    let current_distributor; //我的分销商

    const { referee: me_referee } = await this.model("user").where({ id: userId }).find(); //我的信息

    if(me_referee === 0){
      // 我的推荐人是总店
      current_distributor = 0;
    }else{
      // 我的推荐人不是总店
      let current_user_id = me_referee;
      for(const i=0;i<100000;i++)
      {
        // 如果是总店的话，结束循环
        if(current_user_id === 0){
          current_distributor = 0;
          break;
        }

        const pre_user = await this.model("user").where({ id: current_user_id }).find();
        if(pre_user.is_distributor === 1){
          // 推荐人是分销商，结束循环
          current_distributor = pre_user.id;
          break;
        }else if(pre_user.is_distributor === 0){
          // 推荐人不是分销商，继续找推荐人的推荐人
          current_user_id = pre_user.referee;
        }
      }
    }
    // 我成为分销商
    const update_referee = await this.model("user").where({ id: userId }).update({ is_distributor: 1, referee: current_distributor });

    return this.success(update_referee);
  }
*/
  async detailAction() {
    const { currentAccount } = this.ctx.state;
  	const userId = this.ctx.state.userId;
  	const user_info = await this.model("user").where({ id: userId }).limit(1).find();
    const referee_user_info = await this.model("user").where({ id: user_info.referee }).limit(1).find();
  	const { id, balance, cash_paid } = user_info;
    let { code } = user_info;
  	// 佣金总额
  	const cash_total = parseFloat((balance + cash_paid).toFixed(2));
  	// 团队人数
  	const my_team = new Set();
  	const before = await this.model("user").field("id").where({ referee: userId }).select(); //查询我的代理商

  	before.forEach(({ id: father_id }) => my_team.add(father_id));

    // 分享背景图
    const { share_background } = await this.model("others").limit(1).find();

    if(think.isEmpty(code)){
    	// 获取access_token
      const params = await this.model("account", "mch").where({ acc: currentAccount }).limit(1).find();
    	const service = this.service("weixin", params);
      const access_token = await service.get_access_token();
      // 获取二维码
      const result = await service.get_code(access_token);
      
      const randValue = think.uuid(32);
    	var postData = {  
    		scene: "vheeer_" + id
    	};
    	postData = JSON.stringify(postData);  
    	request({
    		method: 'POST',
    		url: 'https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=' + access_token,
    		body: postData
    	})
    	.pipe(fs.createWriteStream(think.ROOT_PATH + '/www/static/upload/share/' + randValue + '.png')); //将返回的数据流保存为图片   

      const url = think.config("file_path") + '/upload/share/' + randValue + '.' + 'png'; //url
      code = url;

      const update_result = await this.model("user").where({ id: userId }).update({ code: url });
    }
    
  	return this.success({
  		...user_info,
      // referee_user_info,
  		cash_total, 
      code,
      share_background,
  		my_team: my_team.size
  	});
  }
  async listAction() {
    const user_id = this.ctx.state.userId;
    const userInfo = await this.model("user").where({ id: user_id }).find();
    const commisions = await this.model("distribute_commision").alias("a").join({ table: "order", on: ['order_id', 'id'] }).where("a.user_id=" + user_id).select();

    return this.success(commisions)
  }

  async get_access_token() {}
}