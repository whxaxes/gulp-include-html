# gulp-include-html

自用gulp插件，可以分割html

目前添加了ejs支持，options里添加：useEjs:true 即可

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

编译前的index.html

    <div>
       @@include('_value.html' , {contents:'我是内容'})
    </div>
    
_value.html    

    <span>@@{contents}</span>
    
输出index.html：
    
    <div>
       <span>我是内容</span>
    </div>
    
如果想使用ejs模板引擎，则在上面的options中添加：useEjs:true <br>
则_value.html改成
    
    <span><%= contents%></span>

如果加入ejs则可以使用更丰富的js语法，ejs的具体用法请见ejs官网
