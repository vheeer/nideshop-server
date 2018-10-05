module.exports = function(modelName, columns) {
  return {
    async findAction() {
      const { id } = this.get();
      const data = await this.model(modelName).where({ id }).find();
      // 如果有关联查询，把查询结果扁平化（comment）
      const check = () => {
        let have_ = false;
        [data].forEach(row => {
          // 单条数据记录
          Object.keys(row).forEach(key => {
            // 单个字段
            if (row[key] instanceof Object) {
              have_ = true;
              // 对象字段
              Object.keys(row[key]).forEach(relationKey => {
                row[key + '_' + relationKey] = row[key][relationKey];
              });
              delete row[key];
            }
          });
        });
        return have_;
      };
      while (check()) {
        check();
      }
      return this.success(data);
    },
    /**
     * read request
     * @return {Promise}
     */
    async readAction() {
      think.logger.info('this.get is ', this.get());
      const { columns } = this.ctx.state;
      think.logger.info('columns', columns);

      const { id, key, value, page, pageSize, order } = this.get();
      let data;
      if (value && key) {
        // 按id查询
        data = await this.model(modelName).field(columns).where({ id }).countSelect();
      } else if (!id && !value && !key) {
        // 批量查询
        if (order) {
          // 按字段排序
          data = await this.model(modelName).field(columns).order(order).page(page, pageSize).countSelect();
        } else if (!order) {
          // 默认排序
          data = await this.model(modelName).field(columns).page(page, pageSize).countSelect();
        }
      }
      return this.success(data);
    },
    /**
     * 根据字段键值搜索
     * select request
     * @return {Promise}
     */
    async selectAction() {
      let params = this.get();
      const { _page, _pageSize, _sort, _limit, ..._where } = params;
      if (think.isEmpty(params)) {
        // 兼容where无参数情况
        params = 1;
      }

      const data = await this.model(modelName).field(columns).where(_where).limit(_limit).order(_sort).page(_page, _pageSize).countSelect();
      return this.success(data);
    },
    /**
     * 根据字段键值搜索
     * find request
     * @return {Promise}
     */
    async matchAction() {
      let params = this.get();
      const { _page, _pageSize, _sort, _limit, mch, ..._where } = params;
      if (think.isEmpty(params)) {
        // 兼容where无参数情况
        params = 1;
      }

      let whereStr = '';
      Object.keys(_where).forEach(key => {
        const value = _where[key];
        if (typeof value === 'undefined' || value === '') {
          return;
        }
        if (key.indexOf('_time') > -1) {
          const timestamp = _where[key] / 1000;
          whereStr += `DATE_FORMAT(FROM_UNIXTIME(${key}),'%Y-%m-%d') = DATE_FORMAT(FROM_UNIXTIME(${timestamp}),'%Y-%m-%d') and `;
        } else if (key.indexOf('is_') > -1) {
          whereStr += key + '=' + _where[key] + ' and ';
        } else {
          whereStr += key + ' like ' + '\'%' + _where[key] + '%\' and ';
        }
      });
      whereStr = whereStr.substr(0, whereStr.length - 5);
      const data = await this.model(modelName).field(columns).where(whereStr).limit(_limit).order(_sort).page(_page, _pageSize).countSelect();
      // 如果有关联查询，把查询结果扁平化（comment）
      const check = () => {
        let have_ = false;
        data.data.forEach(row => {
          // 单条数据记录
          Object.keys(row).forEach(key => {
            // 单个字段
            if (row[key] instanceof Object) {
              have_ = true;
              // 对象字段
              Object.keys(row[key]).forEach(relationKey => {
                row[key + '_' + relationKey] = row[key][relationKey];
              });
              delete row[key];
            }
          });
        });
        return have_;
      };
      while (check()) {
        check();
      }
      return this.success(data);
    },

    /**
     * create request
     * @return {Promise}
     */
    async createAction() {
      think.logger.debug(this.post());
      const { id, ...params } = this.post();
      Object.keys(params).forEach(key => {
        const value = params[key];
        if (value === false) {
          params[key] = 0
        } else if (value === true) {
          params[key] = 1
        }
      })
      let currentId = id;
      if (!id) {
        currentId = -1;
        params['add_time'] = parseInt(new Date().getTime() / 1000);
      }
      const result = await this.model(modelName).thenUpdate(params, { id: currentId });

      return this.success(result);
    },
    /**
     * createmul request
     * @return {Promise}
     */
    async createmulAction() {
      think.logger.debug(this.post());
      const { _count, ...params } = this.post();
      // 批量
      const singleData = {
        ...params,
        add_time: parseInt(new Date().getTime() / 1000)
      };
      const data = [];
      for (let i = 0; i < parseInt(_count); i++) {
        data.push(singleData);
      }
      const result = await this.model(modelName).addMany(data);
      return this.success(result);
    },
    /**
     * createmany request
     * @return {Promise}
     */
    async createmanyAction() {
      think.logger.debug(this.post());
      if (think.isEmpty(this.post()))
        return this.fail('empty')
      const data = this.post().map(item => {
        item.add_time = parseInt(new Date().getTime() / 1000)
        return item
      })
      const result = await this.model(modelName).addMany(data);
      return this.success(result);
    },
    /**
     * update request
     * @return {Promise}
     */
    async updateAction() {
      const { id, _ids, ...updateBody } = this.post();

      let result;

      if (id && !_ids) {
        result = await this.model(modelName).where({ id }).update(updateBody);
      } else if (!id && _ids) {
        result = await this.model(modelName).where('id in (' + _ids + ')').update(updateBody);
      } else if (!id && !_ids) {
        return this.fail('update requires id(s)');
      } else {
        return this.fail('can not update id');
      }

      return this.success(result);
    },

    /**
     * delete request
     * @return {Promise}
     */
    async deleteAction() {
      const { id, _ids } = this.post();
      let result;

      if (id && !_ids) {
        result = await this.model(modelName).where({ id }).delete();
      } else if (!id && _ids) {
        result = await this.model(modelName).where('id in (' + _ids + ')').delete();
      } else if (!id && !_ids) {
        return this.fail('delete requires id(s)');
      } else {
        return this.fail('can not set params both id and ids');
      }

      return this.success(result);
    },

    async testAction() {
      const service = this.service('saveimg', 'admin');
      return this.success('result');
    },
    /**
     * image action
     * @return {Promise} []
     */
    async changeimgAction() {
      const { id, column, mch } = this.get();
      // 储存
      const service = this.service('saveimg', 'admin');
      const { err, url } = await service.saveToCloud(this.file(), mch);
      if (err) 
        return this.fail('图片存储错误', err);
      console.log('url', url)

      if (!id && !column) {
        return this.success(url)
      }
      // 入库
      const updateObj = {};
      updateObj[column] = url;
      const result = await this.model(modelName).thenUpdate(updateObj, { id });

      return this.success(result);
    },
    /**
     * getcolumn action
     * @return {Promise} []
     */
    async readcolumnAction() {
      const model = this.model(modelName);
      const { tablePrefix } = model;
      const result = await model.query('desc ' + tablePrefix + modelName);
      return this.success(result);
    },
    /**
     * sortcolumn action
     * @return {Promise} []
     */
    async changecolumnAction() {
      const { id, column } = this.post();
      // 储存
      const service = this.service('saveimg', 'admin');
      const { save_path, url } = service.save(this.file());
      // 入库
      const updateObj = {};
      updateObj[column] = url;
      const result = await this.model(modelName).where({ id }).update(updateObj);

      return this.success(result);
    }
  };
};