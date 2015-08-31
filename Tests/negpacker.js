var assert = require('assert');
var should = require('should');
var fs = require('fs');

var NEGPacker = require('../Lib/NEGPacker.js');

var negPacker = NEGPacker({
	root:'Tests/input/'
});

describe('Test Lib',function(){

	it('should be a class',function(){
		negPacker.should.be.ok;
		negPacker.should.have.properties(['doParse','PackageList']);
		negPacker.PackageList.should.have.properties('exists','addOrUpdate');
	});

	it('Pack page.js',function(){
		var filePath = 'Tests/input/Page.js';

		if(fs.existsSync(filePath)){
			var buffer = fs.readFileSync(filePath);
			negPacker.doParse(buffer.toString());
			negPacker.should.have.property('PackageList').with.lengthOf(4);

			negPacker.PackageList[0].moduleName.should.be.eql("NEG.Widge.RollOverMenu");
			negPacker.PackageList[1].moduleName.should.be.eql("Biz.Footer");
			negPacker.PackageList[2].moduleName.should.be.eql("Biz.Body");
			negPacker.PackageList[3].moduleName.should.be.eql("Biz.Header");
		}
		else{
			throw ('test faild, less of input files');
		}

	})
});