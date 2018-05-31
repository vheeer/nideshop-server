const Base = require('./base.js');

import WechatPayment from "wx-payment";
import fs from "fs";

module.exports = class extends Base {
  async indexAction() {
  	const { mch } = this.get();
  	const notify_url = this.config("weixin.notify_url");
  	const certRoot = this.config("cert_root"); //证书根目录
  	const pfx = fs.readFileSync(certRoot + mch + '/apiclient_cert.p12'); //证书文件

  	const { appid, partner_key, mch_id } = await this.model("account", "mch").where({ acc: mch }).limit(1).find();
  	const { weixin_openid: openid } = await this.model("user").where({ id: think.userId }).limit(1).find();

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
	  re_user_name: '张济哲',
	  amount: 101,
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

	// WechatPayment.transfers_promise(orderData)
	// .then(result => {
	// 	console.log("退款结果", result);
 //    	return this.success("success");
	// })
	// .catch(err => {
	// 	console.log("错误：", err);
 //    	return this.success("success");
 //    });
	
	const result = await WechatPayment.transfers_promise(orderData);
	console.log(result);
	return this.success("success");
	// ES6
	// wechatPaymentInstance.transfers(orderData)
	// .then(result=>{
	//   console.log("result", result);
	// })
	// .catch(err=>{
	//   console.log("err", err);
	// });

  }
}