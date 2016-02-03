# gulp-include-html

### gulp plugin, it was used to include html

You can use include to reference the public html,at the mean time input the corresponding parameter to modify the content of module. The module grammar is based on [ejs](https://github.com/mde/ejs).

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
            'version':version,
            
            baseDir:'./html/modules/',
            ignore:\/modules\/
        }))
        .pipe(gulp.dest("./dest"));
});
```

Before compile.
```
<div>
   @@include('./_value.html' , {
        contents:'I am so smart'
   })
</div>
```
    
_value.html    
```
<span><%= contents%></span>
```   

After compile：
```
<div>
   <span>I am so smart</span>
</div>
```

## API

The following parameters are all input like `gih({xxx:xxx})`.

### suffix

file's extend name, default is 'html'

### baseDir

It's the base position of module,if you set up this, you will input all your file in this seted up base position as the standard.<br>
For example, when I setting like this : `baseDir:"html/module/"`. <br>
My code is : `@@include('test');`. <br>
And then the file path will be explain as: `html/module/test.html`.

### include
If you set it as: `include:'__include__'`  the above  `@@include()` should change to  `__include__() `.

### ignore
The ignore file. This value can be string、array、regular.<br> 
For example ：`ignore:"./html-init/modules"`，then the file of modules wouldn't be export.<br>
And it also can be written like this: 
```
ignore:["./html-init/modules" , "./html-init/modules_2"]
```
or
```
ignore:/\.\/html-init\/\w+/g
```

### ejs
It's the options of ejs.
```
gih({
    ejs : { delimiter:"$" }
})
```
Ejs tag will be `<$= content$>`.
