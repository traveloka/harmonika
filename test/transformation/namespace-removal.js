var expect = require('chai').expect;
var
  Transformer = require('./../../lib/transformer'),
  namespaceRemovalTransformation = require('./../../lib/transformation/namespace-removal'),
  transformer = new Transformer({formatter: false});

function test(script) {
  transformer.read(script);
  var transformObj = {
    key:'namespace-removal',
    func:namespaceRemovalTransformation,
    param: {namespacePrefix : ['tv']}
  };
  transformer.applyTransformation(transformObj);
  return transformer.out();
}

describe('Namespace removal', function () {

  it('should remove namespace from function definition if exist in namespacePrefix', function () {
    var script = 'tv.c.d = function(x, y, x) {};';

    expect(test(script)).to.equal('var d = function (x, y, x) {\n};');
  });

  it('should not remove static function namespace', function () {
    var script = 'tv.c.d = function(x, y, x) {};\ntv.c.d.e = function(x, y, x) {};';

    expect(test(script)).to.equal('var d = function (x, y, x) {\n};\nd.e = function (x, y, x) {\n};');
  });

  it('should not remove namespace from function definition', function () {
    var script = 'var c = function() {};\ntv.b.c.d = function(x, y, x) {};';

    expect(test(script)).to.equal('var c = function () {\n};\nc.d = function (x, y, x) {\n};');
  });


  it('shouldn\'t change right function definition', function () {
    var script = 'var d = function (x, y, x) {\n};';

    expect(test(script)).to.equal(script);
  });

  it('shouldn\'t remove `prototype`', function () {
    var script = 'tv.b.c.prototype.d = function(x, y, x) {};';

    expect(test(script)).to.equal('c.prototype.d = function (x, y, x) {\n};');
  });

  it('shouldn\'t change right `prototype`', function () {
    var script = 'c.prototype.d = function(x, y, x) {};';

    expect(test(script)).to.equal('c.prototype.d = function (x, y, x) {\n};');
  });

  it('should remove namespace from call', function () {
    var script = 'tv.b.c.call(this, x, y);';

    expect(test(script)).to.equal('c.call(this, x, y);');
  });

  it('should not remove this', function () {
    var script = 'this._getAPIUrl(this.API.PAX_VALIDATION);';

    expect(test(script)).to.equal('this._getAPIUrl(this.API.PAX_VALIDATION);');
  });

  it('should remove property namespace', function () {
    var script = 'var a = tv.c()';

    expect(test(script)).to.equal('var a = c();');
  });

});