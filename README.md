# gulp-include-html
[grunt-include-html](https://github.com/whxaxes/grunt-include-html)的gulp版

添加了ejs支持，options里添加：useEjs:true 即可

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
