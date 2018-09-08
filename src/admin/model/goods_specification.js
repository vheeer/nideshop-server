const _ = require('lodash');

export default class extends think.Model {
  get relation() {
    return {
      specification: {
        model: 'specification',
        type: think.Model.BELONG_TO,
        key: 'specification_id',
        field: "id, name"
      }
    };
  }
};
