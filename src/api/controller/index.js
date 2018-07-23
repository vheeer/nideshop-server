const Base = require('./base.js');

module.exports = class extends Base {
  async indexAction() {
    const { type: type = "1" } = this.get(); //type 为1时，拉取顶级分类及其下的商品， type为2时，拉取一级分类, type默认值为1
    
    const banner = await this.model('ad').where({ ad_position_id: 1, enabled: 1 }).select();
    const channel = await this.model('channel').order({ sort_order: 'asc' }).select();
    const newGoods = await this.model('goods').field(['id', 'name', 'list_pic_url', 'retail_price']).where({is_new: 1, is_on_sale: 1}).limit(4).select();
    const hotGoods = await this.model('goods').field(['id', 'name', 'list_pic_url', 'retail_price', 'goods_brief']).where({is_hot: 1, is_on_sale: 1}).limit(3).select();
    const brandList = await this.model('brand').where({ is_show: 1 }).order({ new_sort_order: 'asc' }).limit(4).select();
    const tagList = await this.model('tag').where({ is_show: 1 }).order({ new_sort_order: 'asc' }).limit(4).select();
    const topicList = await this.model('topic').where({ is_show: 1 }).order({ sort_order: 'asc' }).limit(3).select();
    const others = await this.model('others').select();

    const categoryList = await this.model('category').where({parent_id: 0, name: ['<>', '推荐']}).order("show_index").select();
    let categoryGoodsList = [];
    let firstCategoryList = [];
    
      for (const categoryItem of categoryList) {  
        const childCategoryIds = await this.model('category').where({parent_id: categoryItem.id}).getField('id', 100);
        if(childCategoryIds.length === 0)
          continue;
        const categoryGoods = await this.model('goods').field(['id', 'name', 'list_pic_url', 'retail_price']).where({ category_id: ['IN', childCategoryIds], is_on_sale: 1 }).limit(7).select();
        categoryGoodsList.push({
          id: categoryItem.id,
          name: categoryItem.name,
          goodsList: categoryGoods
        });
      }
    
     for (const categoryItem of categoryList) {  
        const childCategorys = await this.model('category').where({parent_id: categoryItem.id}).limit(100).select();
        if(childCategorys.length === 0)
          continue;
        firstCategoryList.push(...childCategorys);
      }
    

    return this.success({
      banner: banner,
      channel: channel,
      newGoodsList: newGoods,
      hotGoodsList: hotGoods,
      brandList: brandList,
      tagList: tagList,
      topicList: topicList,
      categoryGoodsList,
      firstCategoryList,
      others
    });
  }
};
