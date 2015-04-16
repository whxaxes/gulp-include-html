var gih = require("../");
var vfs = require("vinyl-fs");

vfs.src('./ref/*.html')
    .pipe(gih({
        'public':"公共内容",
        'useEjs':true
    }))
    .pipe(vfs.dest("./dist/"));