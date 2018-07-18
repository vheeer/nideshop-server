const fs = require('fs');
// 引入模块
var COS = require('cos-nodejs-sdk-v5');
// 创建实例
var cos = new COS({
    SecretId: 'AKIDPhniS2UceT6XnqrWFqJagcMuIYcTcar6',
    SecretKey: 'DGNODsLdjeOvFOQHyVs44sVx35zjHeq5',
});

// 上传单个文件
const upload_p = (bucket, file, target) => new Promise((resolve, reject) => {
	// 分片上传
	cos.sliceUploadFile({
	    Bucket: bucket,
	    Region: 'ap-beijing',
	    Key: target,
	    FilePath: file
	}, function (err, data) {
		if(err)
			reject(err);
	    resolve({ err, data });
	});
});

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
	async saveToCloud(imageFile, mch) {
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
	    // 保存路径
	    const randValue = think.uuid(32);
	    const save_path = "/" + mch + "/upload/images/" + randValue + '.' + type;
	    const { err, data } = await upload_p("nideshop-admin-dva-1256171234", path, save_path);
	    if(err)
	    	return { err };
		//返回保存路径
	   	let { Location: url } = data;
	   	url = "https://" + url;
	    return { url };
	}
}