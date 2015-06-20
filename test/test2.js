var gih = require("../");
var vfs = require("vinyl-fs");

vfs.src('./ref/test2.html')
    .pipe(gih({
        public:"公共内容",

        baseDir:"./modules/",
        include:"__include__",
        ejs:{
            delimiter:"$"
        }
    }))
    .pipe(vfs.dest("./dist/"));