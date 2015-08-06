var expect = require('chai').expect;
var
  Transformer = require('./../../lib/transformer'),
  namespaceRemovalTransformation = require('./../../lib/transformation/namespace-removal'),
  transformer = new Transformer({formatter: false});

function test(script) {
  transformer.read(script);
  transformer.applyTransformation(namespaceRemovalTransformation);
  return transformer.out();
}

describe('Namespace removal', function () {

  it('should remove namespace from function definition', function () {
    var script = 'a.b.c.d = function(x, y, x) {};';

    expect(test(script)).to.equal('var d = function (x, y, x) {\n};');
  });


  it('shouldn\'t change right function definition', function () {
    var script = 'var d = function (x, y, x) {\n};';

    expect(test(script)).to.equal(script);
  });

  it('shouldn\'t remove `prototype`', function () {
    var script = 'a.b.c.prototype.d = function(x, y, x) {};';

    expect(test(script)).to.equal('c.prototype.d = function (x, y, x) {\n};');
  });

  it('shouldn\'t change right `prototype`', function () {
    var script = 'c.prototype.d = function(x, y, x) {};';

    expect(test(script)).to.equal('c.prototype.d = function (x, y, x) {\n};');
  });

  it('should remove namespace from call', function () {
    var script = 'a.b.c.call(this, x, y);';

    expect(test(script)).to.equal('c.call(this, x, y);');
  });

  it('should not remove this', function () {
    var script = 'this._getAPIUrl(this.API.PAX_VALIDATION);';

    expect(test(script)).to.equal('this._getAPIUrl(this.API.PAX_VALIDATION);');
  });

});