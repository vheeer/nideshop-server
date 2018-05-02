const Base = require('./base.js');
const Rest = require('./rest.js');
//指定需要查询的字段
const columns = ["id", "username", "gender", "birthday", "register_time", "last_login_time", "last_login_ip", "user_level_id", "nickname", "mobile", "register_ip", "avatar"];
const { readAction, createAction, updateAction, deleteAction, changeImageAction } = Rest("user", columns);

class top extends Base {
  /**
   * index action
   * @return {Promise} []
   */
  async indexAction() {
    const page = this.get('page') || 1;
    const size = this.get('size') || 10;
    const name = this.get('name') || '';

    const model = this.model('topic');
    const data = await model.where({title: ['like', `%${name}%`]}).order(['id DESC']).page(page, size).countSelect();

    return this.success(data);
  }

  async infoAction() {
    const id = this.get('id');
    const model = this.model('topic');
    const data = await model.where({id: id}).find();

    return this.success(data);
  }

  async storeAction() {
    if (!this.isPost) {
      return false;
    }

    const values = this.post();
    const id = this.post('id');

    const model = this.model('topic');
    values.is_show = values.is_show ? 1 : 0;
    values.is_new = values.is_new ? 1 : 0;
    if (id > 0) {
      await model.where({id: id}).update(values);
    } else {
      delete values.id;
      await model.add(values);
    }
    return this.success(values);
  }

  async destoryAction() {
    const id = this.post('id');
    await this.model('topic').where({id: id}).limit(1).delete();
    // TODO 删除图片

    return this.success();
  }
};
top.prototype.readAction = readAction;
top.prototype.createAction = createAction;
top.prototype.updateAction = updateAction;
top.prototype.deleteAction = deleteAction;
top.prototype.changeImageAction = changeImageAction;
module.exports = top;

/*
  alter table         nideshop_ad                   add add_time int(11) unsigned not null default 0;
  alter table         nideshop_ad_position          add add_time int(11) unsigned not null default 0;
  alter table         nideshop_address              add add_time int(11) unsigned not null default 0;
  alter table         nideshop_admin                add add_time int(11) unsigned not null default 0;
  alter table         nideshop_attribute            add add_time int(11) unsigned not null default 0;
  alter table         nideshop_attribute_category   add add_time int(11) unsigned not null default 0;
  alter table         nideshop_brand                add add_time int(11) unsigned not null default 0;
  alter table         nideshop_cart                 add add_time int(11) unsigned not null default 0;
  alter table         nideshop_category             add add_time int(11) unsigned not null default 0;
  alter table         nideshop_channel              add add_time int(11) unsigned not null default 0;
  alter table         nideshop_collect              add add_time int(11) unsigned not null default 0;
  alter table         nideshop_comment              add add_time int(11) unsigned not null default 0;
  alter table         nideshop_comment_picture      add add_time int(11) unsigned not null default 0;
  alter table         nideshop_coupon               add add_time int(11) unsigned not null default 0;
  alter table         nideshop_feedback             add add_time int(11) unsigned not null default 0;
  alter table         nideshop_footprint            add add_time int(11) unsigned not null default 0;
  alter table         nideshop_goods                add add_time int(11) unsigned not null default 0;
  alter table         nideshop_goods_attribute      add add_time int(11) unsigned not null default 0;
  alter table         nideshop_goods_gallery        add add_time int(11) unsigned not null default 0;
  alter table         nideshop_goods_issue          add add_time int(11) unsigned not null default 0;
  alter table         nideshop_goods_specification  add add_time int(11) unsigned not null default 0;
  alter table         nideshop_keywords             add add_time int(11) unsigned not null default 0;
  alter table         nideshop_order                add add_time int(11) unsigned not null default 0;
  alter table         nideshop_order_express        add add_time int(11) unsigned not null default 0;
  alter table         nideshop_order_goods          add add_time int(11) unsigned not null default 0;
  alter table         nideshop_product              add add_time int(11) unsigned not null default 0;
  alter table         nideshop_region               add add_time int(11) unsigned not null default 0;
  alter table         nideshop_related_goods        add add_time int(11) unsigned not null default 0;
  alter table         nideshop_search_history       add add_time int(11) unsigned not null default 0;
  alter table         nideshop_shipper              add add_time int(11) unsigned not null default 0;
  alter table         nideshop_specification        add add_time int(11) unsigned not null default 0;
  alter table         nideshop_topic                add add_time int(11) unsigned not null default 0;
  alter table         nideshop_topic_category       add add_time int(11) unsigned not null default 0;
  alter table         nideshop_user                 add add_time int(11) unsigned not null default 0;
  alter table         nideshop_user_coupon          add add_time int(11) unsigned not null default 0;
  alter table         nideshop_user_level           add add_time int(11) unsigned not null default 0;
  */