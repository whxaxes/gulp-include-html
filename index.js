var through = require("through2");
var path = require('path');
var parser = require("./parser");

//options，传入模板变量
module.exports = function(options) {
	options = (typeof options === "object") ? options : {};

	parser.config(options);

	var ignore = options.ignore;
	var type = Object.prototype.toString.call(ignore);
	var RE;
	switch (type) {
		case "[object Array]":
			ignore.forEach(function(p, i) {
				ignore[i] = path.resolve(p)
			});
			RE = new RegExp("^(?:" + formateRe(ignore.join("|")) + ")");
			break;
		case "[object String]":
			ignore = path.resolve(ignore);
			RE = new RegExp("^" + formateRe(ignore));
			break;
		case "[object RegExp]":
			RE = ignore;
			break;
		default:
			break;
	}

	return through.obj(function(file, enc, done) {
		var filepath = path.normalize(file.path);
		var filename = path.basename(filepath);

		if ((RE && RE.test(filepath) && !(RE.lastIndex = 0)) || filename.match(/^_/)) {
			done();
			return;
		}

		var result = parser.parse(filepath, options, file.contents.toString());

		if (result) {
			// console.log('\x1B[32mbuild '+filepath+'\x1B[0m');
			file.contents = new Buffer(result);
			this.push(file);
		}

		done();
	});
};

function formateRe(str) {
	return str.replace(/\\|\.|\+/g, function(m) {
		return '\\' + m
	});
}