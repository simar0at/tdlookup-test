!function(_, $, TDView) {
    m = {};

    _.assign(_.templateSettings, {
			escape: /\{\{-([\s\S]+?)\}\}/g,
			evaluate: /\{%([\s\S]+?)%\}/g,
			interpolate: /\{\{([\s\S]+?)\}\}/g 
		});
	
	$(document).ready(function (){
        TDView.attachTagData(function(){
        	console.log('attachTagData finished.');
        })
	});

	this.MainModule = m;
}(_, jQuery, TDView);