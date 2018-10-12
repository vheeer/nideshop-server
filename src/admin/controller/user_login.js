// const Base = require('./base.js');

// module.exports = class extends Base {
//   async indexAction() {
    
//     const { userName, password } = this.post();
//     console.log("userName", userName, "password", password);
//     const account = await this.model("account").where({ acc: userName, psd: password }).find();
    
//     if(think.isEmpty(account)){
//         this.cookie('login', '1', { maxAge: 3600*24*1*1000 });
//         this.cookie('userName', userName, { maxAge: 3600*24*1*1000 });
//         this.cookie('id', id, { maxAge: 3600*24*1*1000 });
//         this.success({ mes: "success", data: { userName, id } });
//     }else{
//         this.cookie('login', '0', { maxAge: 3600*24*1*1000 });
//         this.cookie('userName', "userName", { maxAge: -3600*24*1*1000  });
//         this.cookie('id', "id", { maxAge: -3600*24*1*1000 });
//         this.fail("账号或密码错误");
//     }
//   }
// };

import Base from './base.js';
import Rest from './rest.js';
const namespace = "account";
const actions = Rest(namespace);

class controller extends think.Controller {
  async indexAction() {
    
    const { userName, password } = this.post();
    const { ip } = this.ctx;
    console.log("userName", userName, "password", password);
    const account = await this.model("account", "mch").where({ acc: userName, psd: password }).find();
    const id = account.id;
      // this.ctx.set("Access-Control-Allow-Credentials", true);
    if(id){
        this.ctx.cookies.set('login', '1', { maxAge: 3600*24*3*1000, httpOnly: false });
        this.ctx.cookies.set('userName', userName, { maxAge: 3600*24*3*1000, httpOnly: false });
        this.ctx.cookies.set('id', "" + id, { maxAge: 3600*24*3*1000, httpOnly: false });
        try{
            const result = await this.model("admin_record", userName).add({
                username: userName,
                login_ip: ip,
                add_time: parseInt(Date.now()/1000),
                is_success: 1
            });
        }catch(e){
            console.log("add_admin_record err: ", e);
        }
        return this.success({ mes: "success", data: { userName, id }});
    }else{
        this.ctx.cookies.set('login', '0', { maxAge: 3600*24*1*1000, httpOnly: false });
        this.ctx.cookies.set('userName', "userName", { maxAge: -3600*24*1*1000, httpOnly: false });
        this.ctx.cookies.set('id', "id", { maxAge: -3600*24*1*1000, httpOnly: false });
        try{
            console.log();
            const result = await this.model("admin_record", userName).add({
                userName,
                login_ip: ip,
                add_time: parseInt(Date.now()/1000),
                is_success: 0
            });
        }catch(e){
            console.log("add_admin_record err: ", e);
        }
        return this.fail("账号或密码错误");
    }
  }
  async logoutAction() {
    this.ctx.cookies.set('login', '0', { maxAge: 3600*24*1*1000 });
    this.ctx.cookies.set('userName', "userName", { maxAge: -3600*24*1*1000 });
    this.ctx.cookies.set('id', "id", { maxAge: -3600*24*1*1000 });
    return this.success(1);
  }
  async registerAction() {
    const { userName, password } = this.post();
    const _insert = {
        acc: userName,
        psd: password
    }
    const result = await this.model('account', 'mch').insert(_insert);
    if(think.isEmpty(result)) {
        return fail;
    }

    connection.query(sql, arr, (err, rows, fields) => {
      if(err) {
        res.send({ mes: "fail" });
        throw err;
      }
      const { affectedRows, insertId } = rows;
      console.log('The solution is: ', rows);
      console.log('The fields is: ', fields);
      if(affectedRows == 1){
        connection.query("insert into mess (user_id)values(?);", [ insertId ], (err, rows, fields) => {
          if(err) {
            res.send({ mes: "fail" });
            throw err;
          }
          res.cookie('login', '1', { maxAge: 3600*24*1*1000 });
          res.cookie('userName', userName, { maxAge: 3600*24*1*1000 });
          res.cookie('id', insertId, { maxAge: 3600*24*1*1000 });
          res.send({ mes: "success", data: { id: insertId, userName: userName, password } });
        });
        
      }else{
        res.send({ mes: "fail" });
      }
    });
  }
}
Object.assign(controller.prototype, actions);
module.exports = controller;
