const express = require('express'),
      http = require('http'),
  	  path = require('path'),
	  fs = require('fs'),
	  reload = require('reload');

const publicDir = path.join(__dirname, 'www');

const app = express();
const server = http.createServer(app)

app.set('port', process.env.PORT || 3000);

app.use(express.static(publicDir));

// Reload code here
reloadServer = reload(server, app);
fs.watch(publicDir, {recursive: true}, function (eventType, filename) {
    // Fire server-side reload event
    reloadServer.reload();
});

server.listen(app.get('port'), function(){
  console.log("Web server listening on port " + app.get('port'));
});
