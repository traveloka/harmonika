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
    param: {filename : 'a.js'}
  };
  transformer.applyTransformation(transformObj);
  return transformer.out();
}

describe('Namespace removal', function () {

  it('should remove namespace from function definition if exist in namespacePrefix', function () {
    var script = 'tv.b.a = function(x, y, x) {};';

    expect(test(script)).to.equal('var a = function (x, y, x) {\n};');
  });

  it('should not remove static function namespace', function () {
    var script = 'c.b.a = function(x, y, x) {};\nc.b.a.x = function(x, y, x) {};';

    expect(test(script)).to.equal('var a = function (x, y, x) {\n};\na.x = function (x, y, x) {\n};');
  });

  it('should not remove namespace from function definition', function () {
    var script = 'var a = function() {};\nc.b.a.x = function(x, y, x) {};';

    expect(test(script)).to.equal('var a = function () {\n};\na.x = function (x, y, x) {\n};');
  });


  it('shouldn\'t change right function definition', function () {
    var script = 'var d = function (x, y, x) {\n};';

    expect(test(script)).to.equal(script);
  });

  it('shouldn\'t remove `prototype`', function () {
    var script = 'c.b.a.prototype.x = function(x, y, x) {};';

    expect(test(script)).to.equal('a.prototype.x = function (x, y, x) {\n};');
  });

  it('shouldn\'t change right `prototype`', function () {
    var script = 'var b = {};\nb.prototype.x = function(x, y, x) {};';

    expect(test(script)).to.equal('var b = {};\nb.prototype.x = function (x, y, x) {\n};');
  });

  it('should remove namespace from call', function () {
    var script = 'tv.b.a.call(this, x, y);';

    expect(test(script)).to.equal('a.call(this, x, y);');
  });

  it('should not remove this', function () {
    var script = 'this._getAPIUrl(this.API.PAX_VALIDATION);';

    expect(test(script)).to.equal('this._getAPIUrl(this.API.PAX_VALIDATION);');
  });

  it('should not remove namespace', function () {
    var script = 'var x = a.c();';

    expect(test(script)).to.equal(script);
  });

});