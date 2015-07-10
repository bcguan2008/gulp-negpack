# gulp-negpacker

gulp-negpacker 是NEG的工程化工具，负责打包压缩NEG代码模块。

## How?
类似Webpacker 于RequireJs，gulp-negpacker是NEG.JS的打包工具（基于gulp)

1.	NEG是通过require('moduleName')来调用模块，所以整个打包工具建立在require的使用上
2.  设计一个深度的概念，来解决嵌套引用问题，并且可以按照深度来排序，保证JS的加载顺序

## Installation:

```shell
npm install gulp-negpacker --save-dev
```

**NEG lib**:https://github.com/bcguan2008/NEG.git

## Sample:
```javascript
var gulp = require('gulp');

gulp.task("pack",function(){

	gulp.src("HomePage.js")
		.pipe(negpack({
			root:"../Lib/"
		}))
		.pipe(rename(function(path){
			path.extname= '.min.js';
		}))
		.pipe(gulp.dest('/build/'));

});
```
