const fs = require('fs');
// 引入模块
var COS = require('cos-nodejs-sdk-v5');
// 创建实例
var cos = new COS({
    SecretId: 'AKIDPhniS2UceT6XnqrWFqJagcMuIYcTcar6',
    SecretKey: 'DGNODsLdjeOvFOQHyVs44sVx35zjHeq5',
});

// 上传单个文件
const upload_p = (bucket, path, save_path) => new Promise((resolve, reject) => {
	console.log('分片上传bucket, path, save_path', bucket, path, save_path);
	// 分片上传
	cos.sliceUploadFile({
	    Bucket: bucket,
	    Region: 'ap-beijing',
	    Key: save_path,
	    FilePath: path
	}, function (err, data) {
		console.log('分片上传err, data', { err, data })
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
	    const typeArr = name.split('.');
	    const type = typeArr[typeArr.length - 1];
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
		console.log('云储存，imageFile, mch', imageFile, mch);
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
	    const typeArr = name.split('.');
	    const type = typeArr[typeArr.length - 1];
	    console.log('{ name, path }', { name, path });
	    // 保存路径
	    const randValue = think.uuid(32);
	    const save_path = "/" + mch + "/upload/images/" + randValue + '.' + type;
	    console.log('对象储存路径', save_path);
	    const { err, data } = await upload_p("nideshop-admin-dva-1256171234", path, save_path);
	    console.log('分片上传data', data);
	    if(err){
	    	console.log('上传错误：', err)
	    	return { err };
	    }
		//返回保存路径
	   	let { Location: url } = data;
	   	url = "https://" + url;
	    return { url };
	}
}