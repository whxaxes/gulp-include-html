var through = require("through2");
var url = require('url');
var crypto = require('crypto');

module.exports = function(options , matches){
    options = options||{};
    if(arguments.length==1 && options instanceof RegExp){
        matches = options;
        options = {};
    }

    //匹配@@include("")
    var reg = /@{2}include\(\s*["'].*\s*["']\s*(,\s*\{[\s\S]*?\})?\)/g;

    //获取@@include("XXX")中的"XXX"字符
    var pathReg = /["'] *.*? *["']/;

    //判断@@include中的json字符串
    var jsonReg = /\{[\S\s]*\}/g;

    //匹配变量，变量写法可以为@@key.value或@@{key.value}
    var argReg = /@{2}(\{|)[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)*(\s|)(\}|)/g;

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
            replace(file , filePath)

            var fileName = filePath.split("/")[filePath.split("/").length - 1];
            if (fileName.match(/^_+/g) || ((matches instanceof RegExp) && filePath.match(matches))) continue;

            this.push(file)
        }
        done();
    }

    function replace(file , filePath){
        var str = file.contents.toString();
        var arrs = str.match(reg) || [];
        if(!arrs.length && !str.match(argReg)){
            file.isDone = true;
            return;
        }
        str = str.replace(argReg , function(reTxt){
            if(reTxt=="@@include")return reTxt;
            reValSync(reTxt , options , function(result){
                reTxt = result
            })
            return reTxt
        })

        arrs.forEach(function(arr){
            var fileUrl = arr.match(pathReg)[0].replace(/"|'| /g, '');
            fileUrl = url.resolve(filePath, fileUrl);

            var txt = ""

            if(!(fileUrl in files)) return;

            if(!files[fileUrl].isDone){
                replace(files[fileUrl] , fileUrl)
            }

            txt  = files[fileUrl].contents.toString();

            var conContain = {
                content: txt,
                args: txt.match(argReg) || []
            }

            var json = arr.match(jsonReg);
            json = (json && eval("(" + json[0].replace(/\r\n/, '') + ")"))||{};
            for(var k in options){
                json[k] = json[k] || options[k]
            }

            //替换变量的值
            str = str.replace(arr, function (m) {
                var val = conContain.content;
                var args;

                if (!(args = [].slice.call(conContain.args)).length) return val;

                while (args.length) {
                    var reTxt = args.pop();

                    reValSync(reTxt , json , function(result){
                        val = val.replace(reTxt , result);
                    })
                }
                return val;
            }).replace(removeReg , '');
        })

        file.contents = new Buffer(str);
        file.isDone = true;
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

    return through.obj(_transform , _flush);
}