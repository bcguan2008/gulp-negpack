'use strict';
var through = require('through2');
var gutil=require('gulp-util');
var PluginError = gutil.PluginError;
var path = require('path');
var fs = require('fs');

var PLUGIN_NAME = 'gulp-negpacker';


module.exports = function (options) {
	var rootPath = options.root;
	var packlst = [];
	var depth = 0;

	packlst.exists = function(path){
		if(!path){
			return -1;
		}

		path = path.toLowerCase();

		var self = this; 

		for(var i = 0, length = self.length; i < length; i++ ){
			if(self[i] && self[i].modulePath && self[i].modulePath.toLowerCase() === path){
				return i;
			}
		}

		return -1;
	}

	packlst.addOrUpdate = function(path, depth, buffer){
		var self = this;
		var index = self.exists(path);

		if(self.exists(path) == -1 ){
			self.push({'modulePath':path,'depth':depth, 'buffer': buffer});
		}
		else{
			self[index].depth = depth;
		}

		return index;
	}

	var getFunctionBody = function(fnBody, type){
		var regexCode, 	//get the whole NEG code section
			regexFun;	//get the function by regex.
		
		switch(type){
			case "NEG.run":

				regexCode = /NEG\.run\(function\s*\(.*?\)\s*{.*?}\)/igm;
				regexFun = /NEG\.run\((.*)\)/igm;
				break;
			case "NEG.Module":
				regexCode = /NEG\.Module\(['\"](.*?)['\"],\s*function\s*\(.*?\)\s*{.*?}\)/igm;
				regexFun = /NEG\.Module\(['\"].*?['\"],(.*)\)/igm;
				break;
			default:
				break;
		}

		var functionList = [];
		var result = fnBody.match(regexCode);

		var resultLength =  result && result.length;

		if(resultLength<=0){
			return null;
		}
		for(var i =0; i < resultLength;i++){
			var m = result[i].replace(regexFun,function(fnBody, fun){
				//console.log(depth +":"+ fun);
				return fun;
			});
			functionList.push(m);
		}

		return functionList;
	}

	var getModuleFileList = function(functionList){
		
		var moduleFileList = [];
		
		if(!functionList || functionList.length == 0){
			return null;
		}
		
		for(var i = 0, length = functionList.length; i < length; i++ ){
			var fnBody = functionList[i];
			var requireName = fnBody.replace(/^\s*function\s*?\(\s*?([^,\)]+)[\w\W]*$/i, function(fnbody, reqName){
                              return reqName ;
                            }).replace(fnBody,'');

			var reg = requireName && new RegExp("\\b" + requireName + "\\s*\\(([^\\)]+)\\)","igm");
			

			reg && fnBody.replace(reg, function(requireString,nsPath){
				var moduleName = nsPath.replace(/['"]/g, '');
				var modulePath = path.join(rootPath, moduleName.split('.').join('/')+".js");

				moduleFileList.push(modulePath);
	        });

		}
		return moduleFileList;
	}
	

	var doParse = function(content){
		depth ++ ;


		var functionList = [];

		//remove multi-line comment
		var fnBody = content.replace(/(?!['"])\/\*[\w\W]*?\*\//igm, '')

		//remove single line comment
		fnBody = fnBody.replace(/(['"])[\w\W]*?\1|((['"])[\w\W]*?)\/\/[\w\W]*?\2|\/\/[\w\W]*?(\r|\n|$)/g, function (str, isString) {
            return isString ? str : ''
        });

        fnBody = fnBody.replace(/(\r|\n|$)/igm,'');


		var moduleFun = getFunctionBody(fnBody,"NEG.Module");
		var runFun = getFunctionBody(fnBody,"NEG.run");

		runFun && runFun.length && (functionList = functionList.concat(runFun));
		moduleFun && moduleFun.length && (functionList = functionList.concat(moduleFun));

		var moduleFileList = getModuleFileList(functionList);

		if(moduleFileList){
			for(var i = 0, length = moduleFileList.length; i < length; i++){
				var filePath = moduleFileList[i];

				if(packlst.exists(filePath) > -1 ){
					packlst.addOrUpdate(filePath,depth);
				}
				else{
					try{

						if(fs.existsSync(filePath)){
							var buffer = fs.readFileSync(filePath);

							packlst.addOrUpdate(filePath,depth,buffer);

							doParse(buffer.toString());
						}
						else{
							console.log("no file :"+ filePath);
						}
					}
					catch(ex){
						console.log(ex);
					}
				}
			}
		}

		return packlst;
	}

	// returning the file stream
	return through.obj(function(file, enc, cb) {

		if (file.isBuffer()) {
			doParse(file.contents.toString());

			packlst.sort(function(a,b){
				return b.depth - a.depth;
			});

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

