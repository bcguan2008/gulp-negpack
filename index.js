'use strict';
var through = require('through2');
var gutil=require('gulp-util');
var PluginError = gutil.PluginError;
var path = require('path');
var fs = require('fs');

var NEGPacker = require('./Lib/NEGPacker');

var PLUGIN_NAME = 'gulp-negpacker';

module.exports = function (options) {
	// returning the file stream
	return through.obj(function(file, enc, cb) {

		if (file.isBuffer()) {

			var negPacker = NEGPacker(options);

			negPacker.doParse(file.contents.toString());

			var packlst = negPacker.PackageList;

			var buffer = new Buffer('');

			for(var i = 0, length = packlst.length ; i< length ; i++ ){
				buffer = Buffer.concat([buffer ,packlst[i].buffer]);
			}

			file.contents = Buffer.concat([buffer, file.contents]);
		}

		if (file.isStream()) {
			this.emit('error', new PluginError(PLUGIN_NAME, 'Streams are not supported!'));
			this.cb(); 
		}

		this.push(file);

		return cb();
	});
};

