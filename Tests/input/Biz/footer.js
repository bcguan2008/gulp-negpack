NEG.Module("Biz.Header",function(require){

	var rollOverMenu = require('NEG.Widge.RollOverMenu').Render;

	return {
		render: function(){
			window['Biz.Header'] = true;
		}
	}
});