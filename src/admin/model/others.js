const _ = require('lodash');

export default class extends think.Model {
  get relation() {
    return {
      default_country_text: {
        model: 'region',
        type: think.Model.BELONG_TO,
        key: 'default_country_id',
        where: "type=0",
        field: "id, name"
      },
      default_province_text: {
        model: 'region',
        type: think.Model.BELONG_TO,
        key: 'default_province_id',
        where: 'type=1',
        field: "id, name"
      },
      default_city_text: {
        model: 'region',
        type: think.Model.BELONG_TO,
        key: 'default_city_id',
        where: 'type=2',
        field: "id, name"
      },
      default_district_text: {
        model: 'region',
        type: think.Model.BELONG_TO,
        key: 'default_district_id',
        where: 'type=3',
        field: "id, name"
      }
    };
  }
};