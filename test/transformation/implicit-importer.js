/**
 * Created by traveloka on 03/08/15.
 */
var expect = require('chai').expect;
var
  Transformer = require('./../../lib/transformer'),
  implicitImporterTransformation = require('./../../lib/transformation/implicit-importer'),
  transformer = new Transformer({formatter: false});

function test(script) {
  transformer.read(script);
  transformer.applyTransformation(implicitImporterTransformation);
  return transformer.out();
}

describe('Implicit Importer', function () {

  it('should import $ from jquery', function () {
    var script = '$.ajax({});';

    expect(test(script)).to.be.equal('import $ from \'jquery\';\n$.ajax({});');
  });

  it('should import _', function () {
    var script = '_.api.ajax();';

    expect(test(script)).to.be.equal('import _ from \'_\';\n_.api.ajax();');
  });

  it('should not import this', function () {
    var script = 'this.ajax({});';

    expect(test(script)).to.be.equal('this.ajax({});');
  });

  it('should not import this', function () {
    var script = 'this._api.ajax({});';

    expect(test(script)).to.be.equal('this._api.ajax({});');
  });

});