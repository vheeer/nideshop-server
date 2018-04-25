const fs = require('fs');
module.exports = class extends think.Service {
	save(imageFile) {
	    if (think.isEmpty(imageFile)) {
	      return this.fail('保存失败');
	    }
	    const that = this;

	    const filename = '/static/upload/brand/' + think.uuid(32) + '.jpg';
	    const save_path = think.ROOT_PATH + '/www' + filename;

	    const is = fs.createReadStream(imageFile.path);
	    const os = fs.createWriteStream(save_path);
	    console.log("in_path ", imageFile.path)
	    console.log("save_path ", save_path);

	    is.pipe(os);

	    return {
	      name: "image",
	      fileUrl: 'http://127.0.0.1:8360' + filename
	    };
	}
}