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

class controller extends Base {
  async indexAction() {
    
    const { userName, password } = this.post();
    console.log("userName", userName, "password", password);
    const account = await this.model("account").where({ acc: userName, psd: password }).find();
    const id = account.id;
    if(id){
      this.header("Access-Control-Allow-Credentials", true);
        this.cookie('login', '99', { maxAge: 3600*24*1*1000 });
        this.cookie('userName', userName, { maxAge: 3600*24*1*1000 });
        this.cookie('id', "" + id, { maxAge: 3600*24*1*1000 });
        this.success({ mes: "success", data: { userName, id } });
    }else{
      this.header("Access-Control-Allow-Credentials", true);
        this.cookie('login', '10', { maxAge: 3600*24*1*1000 });
        this.cookie('userName', "userName", { maxAge: -3600*24*1*1000  });
        this.cookie('id', "id", { maxAge: -3600*24*1*1000 });
        this.fail("账号或密码错误");
    }
  }
}
Object.assign(controller.prototype, actions);
module.exports = controller;
