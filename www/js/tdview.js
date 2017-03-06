!function($, params, URI, _) {
    var module = {},
	    mustacheLikeTemplate = {
			escape: /\{\{-([\s\S]+?)\}\}/g,
			evaluate: /\{%([\s\S]+?)%\}/g,
			interpolate: /\{\{([\s\S]+?)\}\}/g			
		};
    module.tdViewProtoPerson = function(data){return ""};
    module.tdViewProtoPlace = function(data){return ""};
    module.tdViewProtoItem = function(data){return ""};
    module.failed = false;
	
	// Add an outerHTML() to jQuery. Used below.
	// see https://css-tricks.com/snippets/jquery/outerhtml-jquery-plugin/
	$.fn.outerHTML = function(){
 
      // IE, Chrome & Safari will comply with the non-standard outerHTML, all others (FF) will have a fall-back for cloning
      return (!this.length) ? this : (this[0].outerHTML || (
        function(el){
            var div = document.createElement('div');
            div.appendChild(el.cloneNode(true));
            var contents = div.innerHTML;
            div = null;
            return contents;
        })(this[0]));
    }

    if (URI === undefined) {
        module.failed = true;
    } else {
        $.ajax(params.templateLocation + "tdview.tpl.html", {
            async: false,
            dataType: 'html',
            error: function() {
                module.failed = true;
            },
            success: function(unused, unused2, jqXHR) {
				var responseDOM = $(jqXHR.responseText),
                    tdViewPersonDOM = responseDOM.find('#template_person'),
                    tdViewPlaceDOM = responseDOM.find('#template_place'),
                    tdViewItemDOM = responseDOM.find('#template_item');
                module.failed = (tdViewPersonDOM.length === undefined ||
                        tdViewPersonDOM.length !== 1||
                        tdViewPlaceDOM.length === undefined ||
                        tdViewPlaceDOM.length !== 1||
                        tdViewItemDOM.length === undefined ||
                        tdViewItemDOM.length !== 1                     
                        );
                if (module.failed) {return;}
                tdViewPersonDOM.find('.remove-for-production').remove();
                tdViewPersonDOM.removeAttr('id');
                tdViewPlaceDOM.find('.remove-for-production').remove();
                tdViewPlaceDOM.removeAttr('id');
                tdViewItemDOM.find('.remove-for-production').remove();
                tdViewItemDOM.removeAttr('id');						
                module.tdViewProtoPerson = _.template(tdViewPersonDOM.outerHTML(), mustacheLikeTemplate);
                module.tdViewProtoPlace = _.template(tdViewPlaceDOM.outerHTML(), mustacheLikeTemplate);
                module.tdViewProtoItem = _.template(tdViewItemDOM.outerHTML(), mustacheLikeTemplate);
            }
        });
    }

    module.tagData = {}; // Map

    /**
     * Asynchroinously fetches an explain object to derive the keys for the context
     * encoded in the uri given.
     * 
     * @param {uri} url A uri where a JSON object can be found that conforms to 
     * one of the data formats used for persons, places or other things.
     * @param {type} whenDone A function to be called when the request finishes.
     * @returns {undefined}
     */
    module.fetchTagsDecl = function(url, whenDone) {
        if (module.failed)
            return;
        var uri = new URI(url);
        uri.normalize();
        $.ajax(uri.href(), {
            dataType: 'json',
            error: function() {
                module.tagData[uri.segmentCoded(-1)] = {};
            },
            success: function(unused, unused2, jqXHR) {
                //does not work in jQuery 1.8.3, there was no responseJSON
                //var explain = jqXHR.responseJSON;
                var tagData = $.parseJSON(jqXHR.responseText);
                if (tagData.item === undefined && tagData.person === undefined && tagData.place === undefined)
                    return;
                if (tagData.item !== undefined) {
                    tagData = firstIfArray('item', tagData);
                } else if (tagData.person !== undefined) {
                    tagData = firstIfArray('person', tagData);
                } else if (tagData.place !== undefined) {
                    tagData = firstIfArray('place', tagData);
                }
				amendLangAndTypeProperties(tagData);
                module.tagData[tagData[tagData.dataType]['xml:id']] = tagData;
            },
            complete: function() {
                whenDone();
            }
        });
    };

    function firstIfArray(dataType, tagData) {
        if (tagData.count !== '1' && Array.isArray(tagData[dataType])) {
            console.log("Error: more than one annotation");
            tagData[dataType] = tagData[dataType][0];
        }
        tagData.dataType = dataType;
        console.log("Trace: loaded id "+tagData[dataType]['xml:id']+".");
        return tagData;        
    }

    // Note the somwhat unusual usage of this here!
    var createNameLine = function(name) {
        createTagLine(this.tagDataViewLine.clone(), 'Also known as (' + name['xml:lang'] + ')', name['#text'])
                .appendTo(this.tagDataView);
    };

    var createAndAttachTagData = function(tagRef, theTagged) {
        //create tag data view
        var tagDataView = {},
            data = module.tagData[tagRef]
        if (data.dataType === 'item') {
            tagDataView = $(module.tdViewProtoItem(data));
        } else if (data.dataType === 'person') {
            tagDataView = $(module.tdViewProtoPerson(data));
            // clean
        } else if (data.dataType === 'place') {
            tagDataView = $(module.tdViewProtoPlace(data));
        } else
            return;
        tagDataView.appendTo(theTagged);
    };

    var tagsToFetch = 0;

    var syncAndTag = function(taggedWords, whenDone) {
        setTimeout(function() {
            if (tagsToFetch !== 0) {
                syncAndTag(taggedWords, whenDone);
            } else {
                taggedWords.each(function(unused, element) {
                    var theTagged = $(element);
                    //sanity checks
                    var pidAndTagRef = theTagged.data("tag-ref");
                    var tagRef = pidAndTagRef.substr(pidAndTagRef.indexOf('/') + 1);
                    if (module.tagData[tagRef] !== undefined)
                        createAndAttachTagData(tagRef, theTagged);
                    else
                        console.log("Error: id "+tagRef+" was not loaded!");
                });
                whenDone();
            }
        }, 5);
    };

    /**
     * 
     * @returns {undefined}
     */
    module.attachTagData = function(whenDone) {
        if (module.failed)
            return;
        var taggedWords = $(".tagged-data");
        tagsToFetch = 0;
        taggedWords.each(function(unused, element) {
            var theTagged = $(element);
            //sanity checks
            var pidAndTagRef = theTagged.data("tag-ref");
            var tagRef = pidAndTagRef.substr(pidAndTagRef.indexOf('/') + 1);
            var existingTagData = $(theTagged.find(".tdview"));
            if (existingTagData.length > 0) {
                return;
            }
            if (pidAndTagRef === undefined)
                return;
            if (module.tagData[tagRef] === undefined) {
                tagsToFetch++;
                module.fetchTagsDecl(params.tdLookupEndpoint + '/' + pidAndTagRef, function() {
                    tagsToFetch--;
                });
            }
        });
        syncAndTag(taggedWords, whenDone);
    };

    // easy the templating

    function amendLangAndTypeProperties(object) {
        var xml_langs = getAllPossibleValuesForKeyDeep(object, 'xml:lang'),
            types = getAllPossibleValuesForKeyDeep(object, 'type');
        _.forEach(xml_langs, function(filterValue){
            injectGetterDeep(object, 'xml:lang', filterValue);            
        });
        _.forEach(types, function(filterValue){
            injectGetterDeep(object, 'type', filterValue);            
        }); 
    }
    

    function getAllPossibleValuesForKeyDeep(object, keyName) {
        var values = [];
        _.map(object, function(value, key) {
           if (_.isObject(value)) {
               values.push(getAllPossibleValuesForKeyDeep(value, keyName)) 
           } else if (key === keyName) {
               values.push(value);
           }
        });
        return _.uniq(_.flatten(values));
    }

    function injectGetterDeep(object, filterKey, filterValue) {
        _.map(object, function(value, key) {
            if (_.isObject(value)) {
                addGetterProperty(value, filterValue, _.bind(returnFilteredArrayOrItem, this, key, value, filterKey, filterValue))
                injectGetterDeep(value, filterKey, filterValue);
            } 
        });        
    }

    function addGetterProperty(object, propertyName, getter) {
        Object.defineProperty(object, propertyName, {
            get: getter
        })
    }

    function returnFilteredArrayOrItem(objectName, object_or_array, filterKey, filterValue) {
        if (_.isArray(object_or_array)) {
            var filteredArray = _.filter(object_or_array, function(value) {
                return value[filterKey] === filterValue; 
            });
            if (filteredArray.length === 1) {return filteredArray[0];}
            if (filteredArray.length > 1) {return _.reduce(filteredArray, function(objValue,srcValue) {               
                _.forEach(_.keys(srcValue), function(key) {
                    if (objValue[key] === undefined) {objValue[key] = [];}
                    objValue[key] = _.concat(objValue[key], srcValue[key]);
                });
                return objValue;
            }, {});
            }
        } else if (object_or_array[filterKey] === filterValue) {
            return object_or_array;
        }
        //undefined
    }

    module.amendLangAndTypeProperties = amendLangAndTypeProperties;

    // publish
    this.TDView = module;
}(window.jQuery, params, URI, _);
