var ejs = require("ejs");
var url = require('url');
var fs = require('fs');
var path = require('path');

//匹配("" , {xx:xx});
var INC_RE_STR = '\\(\\s*(?:"|\')([\\w\\/.-]*\\s*)(?:"|\')\\s*(?:,\\s*(\\{[\\s\\S]*?\\}))?\\);?';

//如果匹配该正则，则说明是./或者../的文件，不需使用baseDir
var NOBASE_RE = /^\.{0,2}\//;

//默认文件后缀
var suffix = "html";

var toString = Object.prototype.toString;
var slice = Array.prototype.slice;

var include = "@@include";
var INC_RE;
var baseDir;
var inited = false;
var configName;

module.exports = {
  config: function (options) {
    options = options || {};

    if (options.ejs) {
      for (var k in options.ejs) {
        ejs[k] = options.ejs[k];
      }
    }

    suffix = options.suffix || suffix;
    include = options.include || include;
    baseDir = options.baseDir;
    configName = options.configName || "config.js";

    INC_RE = new RegExp("([ \\t]*)" + include + INC_RE_STR, 'g');
    inited = true;
  },

  //filepath：文件路径，options包括模板变量及部分参数，content:文件内容
  parse: function (filepath, options, content) {
    if (!inited) {
      this.config()
    }

    if (arguments.length === 2 && (typeof options === "string")) {
      content = options;
      options = {};
    }

    content = content || getFileString(filepath);
    options = options || {};

    if (!content) return "";

    return combine(content, filepath, options);
  }
};

//将@@include替换成相应文件
function combine(content, filePath, opt) {
  var fileUrl, //include的文件地址
    templateFile; //include的文件内容

  //如果文件目录下存在config.js，则将以ejs模板的形式包装
  var configPath = path.dirname(filePath) + path.sep + configName;
  if (fs.existsSync(configPath)) {
    var delimiter = ejs.delimiter || "%";
    var configFile = "<" + delimiter + fs.readFileSync(configPath).toString() + delimiter + ">";
    content = configFile + content;
  }

  opt = opt || {};

  try {
    var result = ejs.render(content, opt);
  } catch (e) {
    console.log("\x1B[31mbuild " + filePath + " fail\x1B[0m");
    console.log("\x1B[31mEjs error：" + e.message + "\x1B[0m");
    return;
  }

  result = result.replace(INC_RE, function (msg) {
    var obj, nobj;
    var space = RegExp.$1;

    fileUrl = RegExp.$2;
    obj = RegExp.$3 || "{}";

    if (!(typeof baseDir === "string") || NOBASE_RE.test(fileUrl)) {
      fileUrl = url.resolve(filePath, fileUrl);
    } else {
      fileUrl = baseDir + "/" + fileUrl;
    }

    //如果文件没有文件类型扩展名，则加上
    fileUrl += (new RegExp("." + suffix + "$")).test(fileUrl) ? "" : ("." + suffix);

    if (!(templateFile = getFileString(fileUrl))) return msg;

    //获取@@include里传入的参数，并转成对象
    try {
      obj = eval("(" + obj.replace(/\r\n/, '') + ")");
    } catch (e) {
      obj = {};
    }

    //将参数对象拷贝，并且与include里传入的参数合并
    nobj = deepCopy(opt);

    for (var k in obj) {
      nobj[k] = obj[k];
    }

    // 用于保证格式
    var result = combine(templateFile, fileUrl, nobj);
    var lines = result.split(/\r?\n/g);

    result = space + lines.join("\n" + space);

    return result;
  });

  return result;
}

//获取文件字符串
function getFileString(filepath) {
  if (/(?:\/|\\)$/.test(filepath) || !fs.existsSync(filepath)) {
    console.log("\x1B[31mfile is not exist：" + filepath + "\x1B[0m");
    return null;
  } else {
    return fs.readFileSync(filepath).toString()
  }
}

//深度拷贝
function deepCopy(obj) {
  var result = {};
  var type = toString.call(obj);

  if (!obj || (type === "[object RegExp]") || typeof obj !== "object")
    return obj;

  if (type === "[object Array]")
    return slice.call(obj);

  for (var k in obj) {
    result[k] = deepCopy(obj[k])
  }

  return result;
}