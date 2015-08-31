var gulp = require('gulp');
var gulpPacker = require('./index.js');

gulp.src("./Tests/input/Page.js")
	    .pipe(gulpPacker({
	        root:"./Tests/input/"
	    }))
	    .pipe(gulp.dest('./Tests/output/'));