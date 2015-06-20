var ejs = require("ejs");
var url = require('url');
var fs = require('fs');

//匹配("" , {xx:xx});
var INC_RE_STR = '\\(\\s*(?:"|\')[\\w\\/.-]*\\s*(?:"|\')\\s*(?:,\\s*\\{[\\s\\S]*?\\})?\\);?';

//获取@@include("XXX")中的XXX字符
var PATH_RE = /(?:"|')\s*(.*?)\s*(?:"|')/;

//判断@@include中的json字符串
var JSON_RE = /\{[\S\s]*\}/g;

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

module.exports = {
    config : function(options){
        options = options || {};

        if(options.ejs){
            for(var k in options.ejs){
                ejs[k] = options.ejs[k];
            }
        }

        suffix = options.suffix || suffix;
        include = options.include || include;
        baseDir = options.baseDir;

        INC_RE = new RegExp(include + INC_RE_STR , 'g');
        inited = true;
    },

    //filepath：文件路径，options包括模板变量及部分参数，content:文件内容
    parse : function(filepath , options , content){
        if(!inited){this.config()}

        if(arguments.length===2 && (typeof options ==="string")){
            content = options;
            options = {};
        }

        content = content || getFileString(filepath);
        options = options || {};

        if(!content) return "";

        return combine(content , filepath , options);
    }
};

//将@@include替换成相应文件
function combine(content , filePath , opt){
    var fileUrl ,   //include的文件地址
        templateFile;  //include的文件内容

    opt = opt || {};

    var result = ejs.render(content , opt);

    result = result.replace(INC_RE , function(msg){
        var obj , nobj;

        fileUrl = PATH_RE.test(msg) ? RegExp.$1 : "";

        if(!(typeof baseDir==="string") || NOBASE_RE.test(fileUrl)){
            fileUrl = url.resolve(filePath, fileUrl);
        }else {
            fileUrl = baseDir + "/" + fileUrl;
        }

        //如果文件没有文件类型扩展名，则加上
        fileUrl += (new RegExp("." + suffix + "$")).test(fileUrl) ? "" : ("." + suffix);

        if(!(templateFile = getFileString(fileUrl))) return msg;

        //获取@@include里传入的参数，并转成对象
        try{
            obj = ((obj = msg.match(JSON_RE)) && eval("(" + obj[0].replace(/\r\n/, '') + ")")) || {};
        }catch(e){
            obj = {};
        }

        //将参数对象拷贝，并且与include里传入的参数合并
        nobj = deepCopy(opt);

        for(var k in obj){ nobj[k] = obj[k]; }

        return combine(templateFile , fileUrl , nobj);
    });

    return result;
}

//获取文件字符串
function getFileString(filepath){
    if(/(?:\/|\\)$/.test(filepath) || !fs.existsSync(filepath)){
        console.log("\x1B[31mfile is not exist：" + filepath + "\x1B[0m");
        return null;
    }else {
        return fs.readFileSync(filepath).toString()
    }
}

//深度拷贝
function deepCopy(obj){
    var result = {};
    var type = toString.call(obj);

    if(!obj || (type === "[object RegExp]") || typeof obj !== "object")
        return obj;

    if(type === "[object Array]")
        return slice.call(obj);

    for(var k in obj){
        result[k] = deepCopy(obj[k])
    }

    return result;
}