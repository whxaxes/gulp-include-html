var through = require("through2");
var path = require('path');
var parser = require("./parser");

//options，传入模板变量，rejectRe：剔除的目录正则
module.exports = function(options , rejectRe){
    options = options || {};

    if(arguments.length==1 && options instanceof RegExp){
        rejectRe = options;
        options = {};
    }

    parser.config(options);

    return through.obj(function(file , enc , done){
        var filepath = path.normalize(file.path);
        var filearr = filepath.split(path.sep);
        var filename = filearr[filearr.length - 1];

        if (filename.match(/^_/) || ((rejectRe instanceof RegExp) && filepath.match(rejectRe))){
            done();
            return;
        }

        var result = parser.parse(filepath , options , file.contents.toString());

        file.contents = new Buffer(result);

        done(null , file);
    });
};