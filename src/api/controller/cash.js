const Base = require('./base.js');

module.exports = class extends Base {
	async listAction(){
		const cash = await this.model("cash_record").where({ user_id: this.ctx.state.userId }).select();
		return this.success(cash);
	}
}