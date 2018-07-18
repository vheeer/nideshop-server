const _ = require('lodash');

export default class extends think.Model {
  get relation() {
    return {
      referee_user: {
        model: 'user',
        type: think.Model.BELONG_TO,
        key: 'referee',
        field: "nickname"
      }
    }
  }
};