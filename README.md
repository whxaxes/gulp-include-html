# gulp-include-html

自用gulp插件，可以分割html

目前添加了ejs支持，options里添加：`useEjs:true` 即可

## Install
```
npm install gulp-include-html
```

## Usage:
```
var gih = require("gulp-include-html");
gulp.task('build-html' , function(){
    return gulp.src("./html-init/**/*.html")
        .pipe(gih({
            'public':"./public/bizapp" + version,
            'version':version
        } , /\/modules\//g))  //正则用于过滤最后输出的文件
        .pipe(gulp.dest("./dest"));
});
```

编译前的index.html
```
<div>
   @@include('./_value.html' , {contents:'我是内容'})
</div>
```
    
_value.html    
```
<span>@@{contents}</span>
```   
输出index.html：
    
    <div>
       <span>我是内容</span>
    </div>

## API

####### 下面参数均像模板参数那样传：`gih({xxx:xxx})`

### useEjs

如果在传入useEjs:true，模板引擎则会使用ejs进行解析<br>
则_value.html改成
```
<span><%= contents%></span>
```

ejs的具体用法请见[ejs官网](http://www.embeddedjs.com/)

###baseDir

模板的base位置，如果设置了这个，在页面引用的时候就会统一以这个base位置为标准来引入文件。<br>
比如我设置 `baseDir:"html/module/"` <br>
我在页面上写：`@@include('test');` <br>
那么在模块里文件路径就会被解析为：`html/module/test.html`
