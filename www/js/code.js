!function(_, $) {
    m = {};

    _.assign(_.templateSettings, {
			escape: /\{\{-([\s\S]+?)\}\}/g,
			evaluate: /\{%([\s\S]+?)%\}/g,
			interpolate: /\{\{([\s\S]+?)\}\}/g 
		});
	
	window.MainModule = m;
}(_, jQuery);