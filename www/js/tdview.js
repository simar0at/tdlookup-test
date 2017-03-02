!function($, params, URI) {
    var module = {};
    module.tdViewProto;
    module.failed = false;

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
                module.tdViewProto = $(jqXHR.responseText).find('#template');
                module.failed = (module.tdViewProto.length === undefined ||
                        module.tdViewProto.length !== 1);
                module.tdViewProto.find('.remove-for-production').remove();
                module.tdViewProto.removeAttr('id');
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
                    module.tagData[tagData.item['xml:id']] = tagData;
                } else if (tagData.person !== undefined) {
                    tagData = firstIfArray('person', tagData);
                    module.tagData[tagData.person['xml:id']] = tagData;
                } else if (tagData.place !== undefined) {
                    tagData = firstIfArray('place', tagData);
                    module.tagData[tagData.place['xml:id']] = tagData;
                }
            },
            complete: function() {
                whenDone();
            }
        });
    };

    function firstIfArray(dataType, tagData) {
        if (tagData.count !== '1') {
            console.log("Error: more than one annotation");
            tagData[dataType] = tagData[dataType][0];
        }
        console.log("Trace: loaded id "+tagData[dataType]['xml:id']+".");
        return tagData;        
    }

    var createTagLine = function(tagDataViewLine, label, text) {
        if (text === undefined)
            text = 'n.a.';
        tagDataViewLine.each(function(unused, element) {
            var $el = $(element);
            if ($el.is('.label'))
                $el.text(label);
            else if ($el.is('.text'))
                $el.text(text);
        });
        return tagDataViewLine;
    };

    // Note the somwhat unusual usage of this here!
    var createNameLine = function(name) {
        createTagLine(this.tagDataViewLine.clone(), 'Also known as (' + name['xml:lang'] + ')', name['#text'])
                .appendTo(this.tagDataView);
    };

    var createAndAttachTagData = function(tagRef, theTagged) {
        //create tag data view
        var tagDataView = module.tdViewProto.clone();
        var tagDataViewLine = $(module.tdViewProto.html());
        var data = module.tagData[tagRef];
        var type = Object.keys(data)[0];
        if (type === 'item') {
            var text = $.isArray(data.item.name) ? data.item.name[0]['#text'] : data.item.name['#text'];
            if (text === undefined)
                text = 'n.a.';
            tagDataView.find('.text').text(text);
            createTagLine(tagDataViewLine.clone(), 'Type', data.item.type)
                    .appendTo(tagDataView);
            if (data.item.cit.sense !== undefined) {
                var createSense = function(sense) {
                    if (sense['xml:lang'] === 'la') {
                        createTagLine(tagDataViewLine.clone(), 'Meaning (in latin)', sense['#text'])
                                .appendTo(tagDataView);
                    } else if (sense['xml:lang'] === 'en-UK') {
                        createTagLine(tagDataViewLine.clone(), 'Meaning (in english)', sense['#text'])
                                .appendTo(tagDataView);
                    }
                };
                $.isArray(data.item.cit.sense) ? data.item.cit.sense.forEach(createSense) : createSense(data.item.cit.sense);
            }
            if (data.item.ab !== undefined) {
                createTagLine(tagDataViewLine.clone(), 'Note', data.item.ab.note)
                        .appendTo(tagDataView);
            }
        } else if (type === 'person') {
            var text = $.isArray(data.person.persName) ? data.person.persName[0]['#text'] : data.person.persName['#text'];
            if (text === undefined)
                text = 'n.a.';
            tagDataView.find('.text').text(text);
            if ($.isArray(data.person.persName)) {
                var param = {
                    tagDataView: tagDataView,
                    tagDataViewLine: tagDataViewLine
                };
                data.person.persName.forEach(createNameLine, param); // TODO filter first/preferred
            }
            createTagLine(tagDataViewLine.clone(), 'Known for his work as', data.person.occupation)
                    .appendTo(tagDataView);
            createTagLine(tagDataViewLine.clone(), 'Died', data.person.death)
                    .appendTo(tagDataView);
            if (data.person.floruit !== undefined) {
                var text = '';
                if (data.person.floruit['to-custom'] !== undefined) {
                    text = 'From ' + data.person.floruit['from-custom'] + ' to ' + data.person.floruit['to-custom'];
                } else if (data.person.floruit['from-custom'] !== undefined) {
                    text = data.person.floruit['from-custom'];
                }
                createTagLine(tagDataViewLine.clone(), 'Most active (fl.)', text)
                        .appendTo(tagDataView);
            }
            if (data.person.note !== undefined) {
                createTagLine(tagDataViewLine.clone(), 'Note', data.person.note)
                        .appendTo(tagDataView);
            }
        } else if (type === 'place') {
            var text = data.place.placeName['#text']
            if (text === undefined)
                text = 'n.a.';
            tagDataView.find('.text').text(text);
            if (data.place.placeName.addName !== undefined) {
                var param = {
                    tagDataView: tagDataView,
                    tagDataViewLine: tagDataViewLine
                };
                if (Array.isArray(data.place.placeName.addName)) {
                    data.place.placeName.addName.forEach(createNameLine, param);
                } else {
                    createNameLine.call(param, data.place.placeName.addName);
                }
            }
            var type = 'place';
            try
            {
                type = Object.keys(data.place.location)[0];
                createTagLine(tagDataViewLine.clone(), 'This belongs today to the ' + type, data.place.location[type])
                        .appendTo(tagDataView);
            }
            catch (TypeError) {
            } // location is not specified
            if (data.place.note !== undefined) {
                createTagLine(tagDataViewLine.clone(), 'Note', data.place.note)
                        .appendTo(tagDataView);
            }
        } else
            return;
        tagDataView.find('br:last').remove();
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

    // publish
    this.TDView = module;
}(window.jQuery, params, URI);
