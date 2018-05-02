const assert = require('assert');
module.exports = function(modelName, columns) {return {
  /**
   * read request
   * @return {Promise}
   */
  async readAction() {
    console.log("this.get is ", this.get());
    try{
      const { id, key, value, page, pageSize, order } = this.get();
      let data;
      if(id && !value && !key) //按id查询
      {
        data = await this.model(modelName).field(columns).where({ id }).countSelect();
      }
      else if(!id && !value && !key) //批量查询
      {
        if(order) //按字段排序
        {
          data = await this.model(modelName).field(columns).order(order).page(page, pageSize).countSelect();
        }
        else if(!order) //默认排序
        {
          data = await this.model(modelName).field(columns).page(page, pageSize).countSelect();
        }
      }
      else if(!id && value && key) //按KV查询
      {
        //筛选规则
        const KV = {};
        switch(key)
        {
          case "nickname":
            //根据输入用户昵称查找用户id
            const keys = await this.model("user").field("id").where({'nickname': ['like', '%' + value + '%']}).select();
            
            if(keys.length === 0) //没有查到用户id
            {
              data = await this.model(modelName).field(columns).where("0").page(page, pageSize).countSelect();
            }
            else if(keys.length !== 0) //根据用户id再次查询
            {
              KV["user_id"] = ["in", []];
              keys.forEach(key => KV["user_id"][1].push(key["id"]));

              if(order) //按字段排序
              {
                data = await this.model(modelName).field(columns).where(KV).order(order).page(page, pageSize).countSelect();
              }
              else if(!order) //默认排序
              {
                data = await this.model(modelName).field(columns).where(KV).page(page, pageSize).countSelect();
              }
            }
            break;
          default:
            KV[key] = ['like', '%' + value + '%'];
            if(order) //按字段排序
            {
              data = await this.model(modelName).field(columns).where(KV).order(order).page(page, pageSize).countSelect();
            }
            else if(!order) //默认排序
            {
              data = await this.model(modelName).field(columns).where(KV).page(page, pageSize).countSelect();
            }
            break;
        }
      }
      if(data.data.length > 0 && typeof data.data[0].user_id === "number") //如果存在user_id就提取出昵称和头像
      {
        for(let item of data.data)
        {
          const user = await this.model("user").field("nickname, avatar").where({ id: item.user_id }).find();
          item.nickname = user.nickname;
          item.avatar = user.avatar;
        }
      }
      return this.success(data);
    }catch(e){
      console.log(e);
      return this.fail(e);
    }

  },

  /**
   * create request
   * @return {Promise}
   */
  async createAction() {
    // return this.fail("can not create");
    let result;
    
    result = await this.model(modelName).add({ 
      ...this.post(), 
      add_time: parseInt(new Date().getTime()/1000)
    });
    
    return this.success(result);
  },

  /**
   * update request
   * @return {Promise}
   */
  async updateAction() {
    console.log("this.post is ", this.post());
    const postBody = this.post();
    const { id } = postBody;
    delete postBody.id;

    let data = await this.model(modelName).where({ id }).update(postBody);
    
    return this.success(data);
  },

  /**
   * delete request
   * @return {Promise}
   */
  async deleteAction() {
    // return this.fail("can not delete");
    const postBody = this.post();
    const { id } = postBody;

    if(!id)
      return this.fail("id is undefined");

    let data = await this.model(modelName).where({ id }).delete();
    
    return this.success(data);
  },

  /**
   * image action
   * @return {Promise} []
   */
  async changeImageAction() {
    const { id, column } = this.get();
    //储存
    const saveImgService = this.service('saveImg');
    const { save_path, url } = saveImgService.save(this.file());
    //入库
    const updateObj = {};
          updateObj[column] = url;
    const result = await this.model(modelName).where({ id }).update(updateObj);
    
    return this.success('result');
  }
}};