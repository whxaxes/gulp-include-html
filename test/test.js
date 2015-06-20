var gih = require("../");
var vfs = require("vinyl-fs");

vfs.src('./ref/test.html')
    .pipe(gih({
        public:"公共内容",

        baseDir:"./modules/"
    }))
    .pipe(vfs.dest("./dist/"));