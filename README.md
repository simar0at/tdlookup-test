Annotation on demand loading isolated test setup
================================================

Install
-------

The usual: npm install, bower install.
Server uses expat for windows from source. Needs build utils for windows.
npm install --global --production windows-build-tools

Run
---

Run with node server.js. Serves a simple test bed on http://localhost:3000 .
Also serves a REST like JSON representation of indexes.uni.xml on
http://localhost:3000//indexes.xml/:list/:xmlid

Tests
-----

Tests are accessible using http://localhost:3000/js/tests/tdview/runner.html .
Mocha and Chai based BDD style.


