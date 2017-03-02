const express = require('express'),
      http = require('http'),
      path = require('path'),
      fs = require('fs'),
      reload = require('reload'),
      xml2json = require('xml2json'),
      _ = require('lodash');

const publicDir = path.join(__dirname, 'www');
const teiDir = path.join(__dirname, 'TEI');

const app = express();
const server = http.createServer(app)

app.set('port', process.env.PORT || 3000);

app.use(express.static(publicDir));

var XMLasJSON = {};

function readIndexesXML() {
    fs.readFile(path.join(teiDir, 'indexes.uni.xml'), function(err, data) {
	if (err) {throw err;}
	XMLasJSON = xml2json.toJson(data, {object: 'true', alternateTextNode: '#text'});
    });
}

readIndexesXML();

app.get('/indexes.xml', function(req, res) {
    res.send(XMLasJSON.TEI.text.body);
}); 

app.get('/indexes.xml/:list/:xmlid', function(req, res) {
    var result = XMLasJSON.TEI.text.body[req.params.list] === undefined ?
        getByXmlIdOrGetList(req.params.xmlid) :
        filteredBody(req.params.xmlid)[req.params.list];
    res.send(result);
});

function getByXmlIdOrGetList (xmlid_or_list) {
    var result = XMLasJSON.TEI.text.body[xmlid_or_list];
    if (result === undefined) {
        var filteredList = filteredBody(xmlid_or_list),
            count = 0,
            itemName = "";
        filteredList = filteredList[Object.keys(filteredList)[0]]
        filteredList = (Array.isArray(filteredList) && filteredList.length === 1) ? filteredList[0] : filteredList;
        itemName = Object.keys(filteredList)[0];
        _.forEach(filteredList, function(item){
            count += Array.isArray(item) ? item.length : 1;
        });
        result = _.assign({},
           _.cloneDeepWith(filteredList, function(o){
               if (_.isArray(o) && o.length === 1) {
                   return o[0];
               } 
           })
           , {'count': String(count)});
        }
    return result;
}

app.get('/indexes.xml/:list_or_xmlid', function(req, res) {
    res.send(getByXmlIdOrGetList(req.params.list_or_xmlid));
});

function filteredBody(xmlid) {
    const body = _.cloneDeep(XMLasJSON.TEI.text.body)
    _.remove(body.listPerson.person, function(item) {return removeIfXmlIDNoMatch(item, xmlid)});
    _.remove(body.listPlace.place, function(item) {return removeIfXmlIDNoMatch(item, xmlid)});
    var list;
    for (list of body.list) {
        _.remove(list.item, function(item) {return removeIfXmlIDNoMatch(item, xmlid)});
    }
    _.remove(body.list, function(list) {return list.item.length === 0});
    var result = _.pickBy(body, function(o){
        if (o.person !== undefined) {return o.person.length > 0}
        if (o.place !== undefined) {return o.place.length > 0}
        else {
            for (list of o) {
                return list.item.length > 0
            }
        }
    });
    return (Array.isArray(result) && result.length === 1) ? result[0] : result;
}

function removeIfXmlIDNoMatch(item, xmlid) {
    return item["xml:id"] !== xmlid;
}

// Reload code here
reloadServer = reload(server, app);
fs.watch(publicDir, {recursive: true}, function (eventType, filename) {
    // Fire server-side reload event
    reloadServer.reload();
});

fs.watch(teiDir, {recursive: true}, function (eventType, filename) {
    if (filename === 'indexes.uni.xml') { readIndexesXML() };
});

server.listen(app.get('port'), function(){
  console.log("Web server listening on port " + app.get('port'));
});