var through = require("through2");
var ejs = require("ejs");
var url = require('url');
var fs = require('fs');
var crypto = require('crypto');

module.exports = function(options , matches){
    options = options||{};
    if(arguments.length==1 && options instanceof RegExp){
        matches = options;
        options = {};
    }

    //匹配@@include("")
    var reg = /@{2}include\(\s*["'].*\s*["']\s*(?:,\s*\{[\s\S]*?\})?\)/g;

    //获取@@include("XXX")中的"XXX"字符
    var pathReg = /["'] *.*? *["']/;

    //判断@@include中的json字符串
    var jsonReg = /\{[\S\s]*\}/g;

    //匹配变量，变量写法可以为@@key.value或@@{key.value}
    var argReg = /@{2}(?:\{|)[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*(?:\s|)(?:\}|)/g;

    //匹配<!--#remove-->****<!--/remove-->，并且删除****中的内容
    var removeReg = /<!-*#remove-*>[\s\S]*?<!-*\/remove-*>/g

    var files = []
    var _transform = function(file , enc , done){
        var filepath = url.format(file.path);
        files[filepath] = file;
        done()
    }
    var _flush = function(done){
        for(var filePath in files){
            var file = files[filePath]
            var fileName = filePath.split("/")[filePath.split("/").length - 1];
            if (fileName.match(/^_+/g) || ((matches instanceof RegExp) && filePath.match(matches))) continue;

            var json = json = deepCopy(options);
            //合并页面里的引用
            var template = combine(file , filePath , json);
            //解析页面内的模板变量
            var result = parse(template , json);

            file.contents = new Buffer(result);

            this.push(file)
        }
        done();
    }

    function combine(file , filePath , json){
        var str = (typeof file == "string")? file : file.contents.toString();
        var arrs = str.match(reg) || [];

        var txt,conContain,args;
        arrs.forEach(function(arr){
            var fileUrl = arr.match(pathReg)[0].replace(/"|'| /g, '');
            fileUrl = url.resolve(filePath, fileUrl);

            var txt = "";
            var templateFile = files[fileUrl];

            if(!templateFile){
                try {
                    templateFile = fs.readFileSync(fileUrl).toString()
                } catch (e) {
                    console.log(e)
                    return;
                }
            }

            //收集变量后面统一处理
            var objs = ((objs = arr.match(jsonReg)) && eval("(" + objs[0].replace(/\r\n/, '') + ")"))||{};
            extend(json , objs)

            str = str.replace(arr , combine(templateFile , fileUrl , json))
        })

        return str;
    }

    function parse(str , json){
        //解析公共变量
        if(json.useEjs){
            try{
                str = ejs.render(str , json);
            }catch(e){console.log(e)}
        }else {
            str = str.replace(argReg , function(reTxt){
                if(reTxt=="@@include")return reTxt;
                reValSync(reTxt , json , function(result){
                    reTxt = result
                })
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

    return through.obj(_transform , _flush);
}