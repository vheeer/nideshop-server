const Base = require('./base.js');

module.exports = class extends Base {
	async listAction(){
		const cash = await this.model("cash").where({ user_id: this.ctx.state.userId }).select();
		return this.success(cash);
	}
}