const fs = require('fs');
console.log(think.Service);
module.exports = class extends think.Service {
	save(imageFile) {
		//获取文件对象
		let file = null;
		for(const key in imageFile)
		{
			file = imageFile[key];
			break;
		}
	    if (think.isEmpty(file)) {
	      return this.fail('保存失败');
	    }
	    const { name, path } = file;
	    const type = name.split('.')[1];
	    //保存路径
	    const randValue = think.uuid(32);
	    const save_path = think.ROOT_PATH + '/www/static/upload/images/' + randValue + '.' + type;
	    const url = think.config("file_path") + '/upload/images/' + randValue + '.' + type;
	    console.log("save_path ", save_path);
	    console.log("url ", url);
	    //存储文件
	    const is = fs.createReadStream(path);
	    const os = fs.createWriteStream(save_path);
	    const pipeResult = is.pipe(os);
	    //返回保存路径
	    return { save_path, url };
	}
}