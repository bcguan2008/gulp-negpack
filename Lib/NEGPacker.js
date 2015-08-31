var path = require('path');
var fs = require('fs');

var NEGPacker = function(options){
	var depth = 0, 
		rootPath = options &&  options.root;


	var utility = {
		merge: function(mainObj) {
            for (var index = 1; index < arguments.length; index++) {
                var sourceObj = arguments[index];
                for (var item in sourceObj) {
                    mainObj[item] = sourceObj[item];
                }
            }
            return mainObj;
        }
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

				moduleFileList.push({'moduleName':moduleName,'modulePath':modulePath});
	        });

		}
		return moduleFileList;
	}


	var _doParse = function(content){
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
				var filePath = moduleFileList[i].modulePath;
				var fileName = moduleFileList[i].moduleName;

				if(_packageList.exists(filePath) > -1 ){
					_packageList.addOrUpdate(filePath,depth);
				}
				else{
					try{

						if(fs.existsSync(filePath)){
							var buffer = fs.readFileSync(filePath);

							_packageList.addOrUpdate(filePath,depth,buffer,fileName);

							_doParse(buffer.toString());
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

		return _packageList;
	}

	var _packageList = [];

	utility.merge(_packageList,{
		exists: function(path){
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
		},
		addOrUpdate:function(path, depth, buffer,moduleName){
			var self = this;
			var index = self.exists(path);

			if(self.exists(path) == -1 ){
				self.push({
					'modulePath':path,
					'depth':depth, 
					'buffer': buffer,
					'moduleName':moduleName
				});
			}
			else{
				self[index].depth = depth;
			}

			return index;
		}
	})


	return {
		doParse:function(content){
			_doParse(content);

			_packageList.sort(function(a,b){
				return b.depth - a.depth;
			});
		},
		PackageList:_packageList
	}
}

module.exports = NEGPacker;