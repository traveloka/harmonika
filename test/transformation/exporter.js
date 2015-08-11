/**
 * Created by semmatabei on 8/11/15.
 */
var expect = require('chai').expect;
var
  Transformer = require('./../../lib/transformer'),
  exporterTransformation = require('./../../lib/transformation/exporter'),
  transformer = new Transformer({formatter: false});

function test(script) {
  var transformObj = {
    key:'generateExport',
    func:exporterTransformation,
    param: {filename : 'fileName'}
  };
  transformer.read(script);
  transformer.applyTransformation(transformObj);
  return transformer.out();
}

describe('Export transformation', function () {

  it('should export a as default', function () {
    var script = "var a = true;";

    var result = test(script);
    expect(result).to.include('export default');
    expect(result).to.include('var a = true;');
  });

  it('should export b as default and export everything else', function () {
    var script = "var b = true;\nvar a = true;";

    var result = test(script);
    expect(result).to.not.include('export default\nvar b = true;');
    expect(result).to.include('export var a = true;');
    expect(result).to.include('export default\nb;');
  });

  it('should export fileName as default', function () {
    var script = "var b = true;\nvar fileName = true;";

    var result = test(script);
    expect(result).to.include('export var b = true;');
    expect(result).to.include('export default\nfileName;');
  });

  it('should not export var if there is class', function () {
    var script = "var b = true;\nclass a{c(){}}";

    var result = test(script);
    expect(result).to.not.include('export var b = true;');
    expect(result).to.include('export default\nclass a');
  });

});