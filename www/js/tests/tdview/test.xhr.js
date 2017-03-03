var xhr, requests;

function loadFixture(htmlFile) {
	var ret = $.ajax({
		    url: 'fixtures/' + htmlFile,
            dataType: 'html',
            success: function(unused, unused2, jqXHR) {
                $('#fixture').html($(jqXHR.responseText));
            }
        });
    return ret;
}

function loadJSON(htmlFile) {
	var ret = $.ajax({
		    url: 'fixtures/' + htmlFile,
            dataType: 'json'
        });
    return ret;
}

function stubAjax() {
    xhr = sinon.useFakeXMLHttpRequest();
    requests = [];
    xhr.onCreate = function (req) {
    	requests.push(req);
    };
}

afterEach(function () {
    // Like before we must clean up when tampering with globals.
    if (xhr !== undefined) {xhr.restore();}
    xhr = undefined;
    $('#fixture').html('');
    requests = [];
});

describe("TDView", function(){
	it("should load without error", function(){
		TDView.failed.should.to.be.false;
	});
	describe("Amend JSON representation of the XML annotations", function() {
		it("should provide only the preferred names if persName['preferred'] is selected", function(done) {
			loadJSON('muhammed.json').done(function(jsonData){
				TDView.amendLangAndTypeProperties(jsonData);
				jsonData.person.persName['preferred']['#text'].should.equal('Muḥammed');
				done(); 
			});
		});
		it("should provide an array of variants if persName['variant'] is selected", function(done) {
			loadJSON('muhammed.json').done(function(jsonData){
				TDView.amendLangAndTypeProperties(jsonData);
				var variants = jsonData.person.persName['variant'];
				variants['#text'].should.be.a('Array');
				jsonData.person.persName['variant']['#text'][1].should.equal('Maḥmūd');
				done(); 
			});
		});
		it("should provide the english placeName if placeName['en-UK'] is selected", function(done) {
			loadJSON('mekka.json').done(function(jsonData){
				TDView.amendLangAndTypeProperties(jsonData);
				jsonData.place.placeName['en-UK']['#text'].should.equal('Mecca, Makkah');
				done();
			});
		});
		it("should provide the english sense if sense['en-UK'] is selected", function(done) {
			loadJSON('syrup.json').done(function(jsonData){
				TDView.amendLangAndTypeProperties(jsonData);
				jsonData.item.cit.sense['en-UK']['#text'].should.equal('syrup');
				done();
			});
		});
		it("should provide the latin sense if sense['la'] is selected", function(done) {
			loadJSON('syrup.json').done(function(jsonData){
				TDView.amendLangAndTypeProperties(jsonData);
				jsonData.item.cit.sense['la']['#text'].should.equal('sirupus');
				done(); 
			});
		});
	});
	describe("Get a person's name", function(){
		it("should load the fixture for Daniyal", function(done){
			loadFixture('daniyal.html').done(function(){
				$('.tagged-data.persName').should.exist;
				done();
			});
		});
		it("should attach a person annotation", function(done){
			loadFixture('daniyal.html').done(function(){
				stubAjax();
				$('.tagged-data.persName > .tdview').should.not.exist;
				TDView.attachTagData(function(){
					$('.tagged-data.persName > .tdview').should.exist;
			    	done();					
				});
				requests[0].respond(200, {
					"Content-Type": "application/json" 
					},
                    '{ "person" : { "xml:id" : "uni_sima_d27e1921", "persName" : [{ "xml:lang" : "ota-Latn-t", "type" : "variant", "#text" : "Daniyāl peyġamber" }, { "xml:lang" : "ota-Latn-t", "type" : "preferred", "#text" : "Dāniyāl" }], "occupation" : "Prophet", "death" : "n.a.", "floruit" : { "from-custom" : "n.a." }, "note" : "Daniel; “two biblical characters bearing the same Daniel, the sage of ancient times mentioned by Ezekiel (…) and the visionary who lived at the time of the captivity in Babylon” [Cf. EI2, s.v. Dāniyāl]" }, "count" : "1" }');
			});								
		})
	});
	describe("Get a place's name", function(){
		it("should load the fixture for Mekka", function(done){
			loadFixture('mekka.html').done(function(){
				$('.tagged-data.placeName').should.exist;
				done();
			});
		});
		it("should attach a person annotation", function(done){
			loadFixture('mekka.html').done(function(){
				stubAjax();
				$('.tagged-data.placeName > .tdview').should.not.exist;
				TDView.attachTagData(function(){
					$('.tagged-data.placeName > .tdview').should.exist;
			    	done();					
				});
				requests[0].respond(200, {
					"Content-Type": "application/json" 
					},
                    '{ "place" : { "xml:id" : "uni_sieverek_d27e6597", "type" : "town", "placeName" : [{ "xml:lang" : "ota-Latn-t", "type" : "variant", "#text" : "Mekke" }, { "xml:lang" : "ota-Latn-t", "type" : "variant", "#text" : "Makka" }, { "xml:lang" : "en-UK", "#text" : "Mecca, Makkah" }], "location" : { "country" : "Saudi Arabia" } }, "count" : "1" }');
			});								
		})
	});
	describe("Get some substance or item name", function(){
		it("should load the fixture for zamad", function(done){
			loadFixture('zamad.html').done(function(){
				$('.tagged-data.name').should.exist;
				done();
			});
		});
		it("should attach an item annotation", function(done){
			loadFixture('zamad.html').done(function(){
				stubAjax();
				$('.tagged-data.name > .tdview').should.not.exist;
				TDView.attachTagData(function(){
					$('.tagged-data.name > .tdview').should.exist;
			    	done();					
				});
				requests[0].respond(200, {
					"Content-Type": "application/json" 
					},
                    '{ "person" : { "xml:id" : "uni_darling_d27e198437", "persName" : [{ "xml:lang" : "ota-Latn-t", "type" : "variant", "#text" : "Dānyāl" }, { "xml:lang" : "ota-Latn-t", "type" : "preferred", "#text" : "Dāniyāl" }], "occupation" : "n.a.", "death" : "n.a.", "floruit" : { "from-custom" : "n.a." }, "note" : "Daniel; “two biblical characters bearing the same Daniel, the sage of ancient times mentioned by Ezekiel (…) and the visionary who lived at the time of the captivity in Babylon”; cf. EI2, II, s.v. Dāniyāl." }, "count" : "1" }');
				requests[1].respond(200, {
					"Content-Type": "application/json" 
					},
                    '{ "item" : { "xml:id" : "uni_darling_d27e198398", "name" : { "xml:lang" : "ota-Latn-t", "type" : "variant", "#text" : "żamad" }, "cit" : { "type" : "translation", "sense" : { "xml:lang" : "en-UK", "#text" : "bandage; medical application; ointment" } }, "note" : "correct version: żımād" }, "count" : "1" }');
			});								
		})
	});
});