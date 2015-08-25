var expect = require('chai').expect;
var AnnotationTokenizer = require('./../../lib/utils/closure-annotation-tokenizer');
var annotationTokenizer = new AnnotationTokenizer();

describe('AnnotationTokenizer', function () {

  describe('Method _handleMap', function () {

    it('should convert simple map', function () {
      var type = 'Object<string, string>';
      var type2 = 'Array< string, string>';
      var type3 = 'Array < string , string >';
      expect(annotationTokenizer._handleMap(type)).to.equal('{ [key : string]: string }');
      expect(annotationTokenizer._handleMap(type2)).to.equal('{ [key : string]: string }');
      expect(annotationTokenizer._handleMap(type3)).to.equal('{ [key : string]: string }');
    });



  });



});