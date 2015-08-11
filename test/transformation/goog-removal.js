/**
 * Created by semmatabei on 7/31/15.
 */
var expect = require('chai').expect;
var
  Transformer = require('./../../lib/transformer'),
  googRemovalTransformation = require('./../../lib/transformation/goog-removal'),
  transformer = new Transformer({formatter: false});

function test(script) {
  transformer.read(script);
  transformer.applyTransformation(googRemovalTransformation);
  return transformer.out();
}

function testFileName(script) {
  var fileName = null;
  transformer.read(script);
  transformer.applyTransformation({
    func:googRemovalTransformation,
    callback: function(name){
      fileName = name;
    }
  });
  return fileName;
}

describe('Goog removal', function () {

  it('should remove goog.inherits', function () {
    var script = 'goog.inherits("a")';

    expect(test(script)).to.be.empty;
  });

  it('should provide right filename', function () {
    var script = 'goog.provide("a.b")';

    expect(testFileName(script)).to.be.equal('a/b.js');
  });

  it('should remove goog.provide', function () {
    var script = 'goog.provide("a.b")';

    expect(test(script)).to.be.empty;
  });

  it('should change goog.require to import', function () {
    var script = 'goog.provide("a.b.c.d"); goog.require("a.b.e.f");';

    expect(testFileName(script)).to.be.equal('a/b/c/d.js');
    expect(test(script)).to.be.equal('import f from \'../e/f.js\';');
  });

});