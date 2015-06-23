# gulp-include-html

#### 可以在前端中使用include，引用公共html，同时传入相应参数修改模板中的内容
#### 模板语法使用[ejs](https://github.com/mde/ejs)

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
<span><%= contents%></span>
```   
输出index.html：
```
<div>
   <span>我是内容</span>
</div>
```

## API

###### 下面参数均像模板参数那样传：`gih({xxx:xxx})`

### baseDir

模板的base位置，如果设置了这个，在页面引用的时候就会统一以这个base位置为标准来引入文件。<br>
比如我设置 `baseDir:"html/module/"` <br>
我在页面上写：`@@include('test');` <br>
那么在模块里文件路径就会被解析为：`html/module/test.html`

### include
include的名称，如果设成：`include:'__include__'`，那么上面的`@@include()`则改成`__include__()`

### ignore
忽略的文件、该值可以为字符串、数组、正则，比如我设置：`ignore:"./html-init/modules"`，则`modules`下的文件将会不输出<br>
也可以写为：`ignore:["./html-init/modules" , "./html-init/modules_2"]` 或 `ignore:/\.\/html-init\/\w+/g`

### ejs
该参数用于设置ejs的参数，比如设成：
```
gih({
    ejs : {
        delimiter:"$"
    }
})
```
写ejs模板时即写成 `<$= content$>`
