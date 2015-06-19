var through = require("through2");
var ejs = require("ejs");
var url = require('url');
var fs = require('fs');

//options，传入模板变量，rejectRe：剔除的目录正则
module.exports = function(options , rejectRe){
    options = options||{};
    if(arguments.length==1 && options instanceof RegExp){
        rejectRe = options;
        options = {};
    }

    //匹配@@include("")
    var reg = /@@include\(\s*(?:"|').*\s*(?:"|')\s*(?:,\s*\{[\s\S]*?\})?\);?/g;

    //获取@@include("XXX")中的XXX字符
    var pathReg = /(?:"|')\s*(.*?)\s*(?:"|')/;

    //判断@@include中的json字符串
    var jsonReg = /\{[\S\s]*\}/g;

    //文件后缀
    var suffix = "html";

    //匹配变量，变量写法可以为@@key.value或@@{key.value}
    var argReg = /@{2}(?:\{|)[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*(?:\s|)(?:\}|)/g;

    var _transform = function(file , enc , done){
        var filepath = url.format(file.path);
        var filearr = filepath.split("/");
        var filename = filearr[filearr.length - 1];

        if (filename.match(/^_/) || ((rejectRe instanceof RegExp) && filepath.match(rejectRe))){
            done();
            return;
        }

        var json = deepCopy(options);

        //合并页面里的引用
        var template = combine(file , filepath , json);

        //解析页面内的模板变量
        var result = parse(template , json);

        file.contents = new Buffer(result);

        done(null , file);
    }

    //合并include的文件
    function combine(file , filePath , json){
        var str = (typeof file == "string")? file : file.contents.toString();
        var arrs = str.match(reg) || [];

        arrs.forEach(function(arr){
            var fileUrl = pathReg.test(arr) ? RegExp.$1 : "";

            if(!(typeof json.baseDir==="string") || /^\.{0,2}\//.test(fileUrl)){
                fileUrl = url.resolve(filePath, fileUrl);
            }else {
                fileUrl = json.baseDir + "/" + fileUrl;
            }

            fileUrl += (new RegExp("." + suffix + "$")).test(fileUrl) ? "" : "." + suffix;

            if(!fs.existsSync(fileUrl)){
                console.log("文件不存在：" + fileUrl);
                return;
            }

            var templateFile = fs.readFileSync(fileUrl).toString();

            //收集变量后面统一处理
            var objs = ((objs = arr.match(jsonReg)) && eval("(" + objs[0].replace(/\r\n/, '') + ")")) || {};

            extend(json , objs);

            str = str.replace(arr , combine(templateFile , fileUrl , json))
        });

        return str;
    }

    //变量解析
    function parse(str , json){
        //解析公共变量
        if(json.useEjs){
            str = ejs.render(str , json);
        }else {
            str = str.replace(argReg , function(reTxt){
                if (reTxt == "@@include")return reTxt;
                reValSync(reTxt, json, function (result) {
                    reTxt = result
                });
                return reTxt
            })
        }

        return str;
    }

    //变量更改方法
    function reValSync(reTxt , o , callback){
        var arg = ''.split.call(reTxt.replace(/@{2}|\{|\}|\s/g,''), '.');

        for (var i = 0; i < arg.length; i++) {
            if (!(arg[i] in o)) break;

            if ((i == arg.length - 1) && (typeof o[arg[i]]=='string'||'number')) {
                callback(o[arg[i]]);
                break;
            } else o = o[arg[i]];
        }
    }

    function deepCopy(source){
        var result = {};

        if((typeof source) !== "object") return source;

        if('splice' in source) return source.slice(0);

        for(var k in source){
            result[k] = deepCopy(source[k])
        }

        return result;
    }

    function extend(obj1 , obj2){
        for(var k in obj2){
            obj1[k] = deepCopy(obj2[k])
        }
    }

    return through.obj(_transform);
}