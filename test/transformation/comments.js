var expect = require('chai').expect;
var
  Transformer = require('./../../lib/transformer'),
  transformer = new Transformer({
    formatter: false,
    transformers:{
      generateExport:false
    }
  });

function test(script) {
  transformer.read(script);
  transformer.applyTransformations();
  return transformer.out();
}

describe('Comments', function () {

  it("shouldn't convert comment line", function (done) {
    var script = '// comment line\nvar x = 42;';

    expect(test(script)).to.equal('// comment line\nvar x = 42;');
    done();
  });

  it("should remove trailing comment", function (done) {
    var script = 'var x = 42;    // trailing comment\n';

    expect(test(script)).to.equal('var x = 42;');
    done();
  });

});
