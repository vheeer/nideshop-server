const Base = require('./base.js');

module.exports = class extends Base {
	async listAction(){
		const cash = await this.model("cash").where({ user_id: think.userId }).select();
		return this.success(cash);
	}
}