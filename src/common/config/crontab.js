module.exports = [{
  interval: '3600s',
  immediate: false,
  handle: async () => {
    console.log('开启定时任务，佣金定时转入余额');
    const models = ['river', 'star', 'shangxun']
    models.forEach(async model => {
      const userModel = think.model('user', model);
      const distributeCommisionModel = think.model('distribute_commision', 'river');
      const thisTime = parseInt(Date.now() / 1000);
      const lastDays = thisTime - (3600 * 24 * 7);

      // const commisions = await distributeCommisionModel.where(`is_transferred = 0 and add_time < ${lastDays} and type = 0`).select();
      const commisions = await distributeCommisionModel
      .field('nideshop_distribute_commision.id as id, nideshop_distribute_commision.user_id, nideshop_distribute_commision.commision_price')
      .join({
        table: 'order',
        join: 'inner', //join 方式，有 left, right, inner 3 种方式
        as: 'order', // 表别名
        on: ['order_id', 'id'] //ON 条件
      }).where(`is_transferred = 0 and order.receive_time < ${lastDays} and order.receive_time > 0 and type = 0`).select();
      console.log(commisions);
      
      commisions.forEach(async function(commision) {
        const { id, user_id, commision_price } = commision;
        console.log('佣金', commision_price)
        const { nickname, balance, commision: userCommision } = await userModel.where({ id: user_id }).find();
        console.log('用户名 - 余额', nickname, balance)
        const new_balance = parseFloat((balance + commision_price).toFixed(2));
        const new_commision = parseFloat((userCommision + commision_price).toFixed(2));
        const add_balance_result = await userModel.where({ id: user_id }).update({ balance: new_balance, commision: new_commision }); //返佣
        if (!think.isEmpty(add_balance_result)) {
          console.log('id', id)
          const res = await distributeCommisionModel.where({ id }).update({ is_transferred: 1 });
          console.log(res);
          if (!think.isEmpty(res)) {
            console.log(nickname + ' 成功返佣金 ' + commision_price);
          }
        }
      })
    })
  }
}, {
  cron: '* * * * *',
  handle: 'src/common/service/cron',
  type: 'all'
}]