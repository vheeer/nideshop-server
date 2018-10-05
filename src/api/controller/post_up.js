const Base = require('./base.js');
const Rest = require('./rest.js');

const namespace = 'post_up';

const actions = Rest(namespace);

class Controller extends Base {
  async indexAction() {
    const result = await this.model(namespace).limit(100).select();
    return this.success(result);
  }
}
Object.assign(Controller.prototype, actions);
module.exports = Controller;