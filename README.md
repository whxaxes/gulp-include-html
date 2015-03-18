# gulp-include-html
[grunt-include-html](https://github.com/whxaxes/grunt-include-html)的gulp版

how to use:

    var gih = require("gulp-include-html");
    gulp.task('build-html' , function(){
    return gulp.src("./html-init/**/*.html")
        .pipe(gih({
            'public':"./public/bizapp" + version,
            'version':version
        } , /\/modules\//g))  //正则用于过滤最后输出的文件
        .pipe(gulp.dest("./dest"));
    });
