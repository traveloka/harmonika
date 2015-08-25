var expect = require('chai').expect;
var AnnotationTokenizer = require('./../../lib/utils/closure-annotation-tokenizer');
var annotationTokenizer = new AnnotationTokenizer();

describe('AnnotationTokenizer', function () {

  describe('Method _handleMap', function () {

    it('should convert simple object', function () {
      var type = 'Object<string, string>';
      var type2 = 'Array< string, ?string>';
      var type3 = 'Array < ?string , string >';
      expect(annotationTokenizer._handleMap(type)).to.equal('{ [key : string]: string }');
      expect(annotationTokenizer._handleMap(type2)).to.equal('{ [key : string]: ?string }');
      expect(annotationTokenizer._handleMap(type3)).to.equal('{ [key : ?string]: string }');
    });

    it('shouldn\'t convert complex object', function () {
      var type = 'Object<string, Object<string, string>>';
      var type2 = 'Object<string, Array<string>>';
      var type3 = 'Object<string, Object<string, Array<string>>>';
      expect(annotationTokenizer._handleMap(type)).to.equal('Object<string, { [key : string]: string }>');
      expect(annotationTokenizer._handleMap(type2)).to.equal('Object<string, Array<string>>');
      expect(annotationTokenizer._handleMap(type3)).to.equal('Object<string, Object<string, Array<string>>>');
    });


  });


  describe('Method _containNull', function () {

    it('should replace null with ?', function () {
      var type = 'string|null';
      var type2 = 'string|null|number';
      var type3 = '?string|null|?number';
      var type4 = '(string|null|number)';
      var type5 = 'null|(string|number)';
      var type6 = 'null|{apa : number}';
      var type7 = 'null|{ [ key: string ] : number}';
      expect(annotationTokenizer._containNull(type)).to.equal('?string');
      expect(annotationTokenizer._containNull(type2)).to.equal('?string|?number');
      expect(annotationTokenizer._containNull(type3)).to.equal('?string|?number');
      expect(annotationTokenizer._containNull(type4)).to.equal('(?string|?number)');
      expect(annotationTokenizer._containNull(type5)).to.equal('?(string|number)');
      expect(annotationTokenizer._containNull(type6)).to.equal('?{apa : number}');
      expect(annotationTokenizer._containNull(type7)).to.equal('?{ [ key: string ] : number}');
    });


  });


  describe('Method _removeNameSpace', function () {

    it('should remove namespace and save imported types', function () {
      var type = 'tv.a.b.typed';
      var type2 = '?tv.a.b.typed';
      expect(annotationTokenizer._removeNameSpace(type)).to.equal('typed');
      expect(annotationTokenizer._removeNameSpace(type2)).to.equal('?typed');
      expect(annotationTokenizer.importedTypes).to.eql({ 'tv.a.b.typed': 1 });

    });


  });

  describe('Method _replaceWithAny', function () {

    it('replace with any', function () {
      var type = '?';
      var type2 = '*';
      var type3 = '?*';
      var type4 = 'string';
      expect(annotationTokenizer._replaceWithAny(type)).to.equal('any');
      expect(annotationTokenizer._replaceWithAny(type2)).to.equal('any');
      expect(annotationTokenizer._replaceWithAny(type3)).to.equal('?any');
      expect(annotationTokenizer._replaceWithAny(type4)).to.equal('string');

    });


  });

  describe('Method _removeWrapBracket', function () {

    it('remove outer bracket', function () {
      var type = '{string}';
      var type2 = 'string';
      var type3 = '{string|{a: string}}';
      expect(annotationTokenizer._removeWrapBracket(type)).to.equal('string');
      expect(annotationTokenizer._removeWrapBracket(type2)).to.equal('string');
      expect(annotationTokenizer._removeWrapBracket(type3)).to.equal('string|{a: string}');

    });

  });

  describe('Method _removeGenericDot', function () {

    it('should remove .', function () {
      var type = 'Array.<string>';
      var type2 = 'Object.<string>';
      var type3 = 'Object.<string, Array.<string>>';
      expect(annotationTokenizer._removeGenericDot(type)).to.equal('Array<string>');
      expect(annotationTokenizer._removeGenericDot(type2)).to.equal('Object<string>');
      expect(annotationTokenizer._removeGenericDot(type3)).to.equal('Object<string, Array<string>>');

    });

  });

  describe('Method _replaceEqualToQuestionMark', function () {

    it('should replace = with ? in the front .', function () {
      var type = 'string=';
      var type2 = '?string=';
      expect(annotationTokenizer._replaceEqualToQuestionMark(type)).to.equal('?string');
      expect(annotationTokenizer._replaceEqualToQuestionMark(type2)).to.equal('?string');

    });

  });

  describe('Method _replaceFunctionType', function () {

    it('replace all function(...) to Function', function () {
      var type = 'function(a, b, c)';
      var type2 = 'function (a, b, c)';
      var type3 = 'function (Array<a>, b, c)';
      var type4 = 'function (Array<a>, b, c)|number';
      var type5 = 'function (Array<a>, {b}, c),number';
      expect(annotationTokenizer._replaceFunctionType(type)).to.equal('Function');
      expect(annotationTokenizer._replaceFunctionType(type2)).to.equal('Function');
      expect(annotationTokenizer._replaceFunctionType(type3)).to.equal('Function');
      expect(annotationTokenizer._replaceFunctionType(type4)).to.equal('Function|number');
      expect(annotationTokenizer._replaceFunctionType(type5)).to.equal('Function,number');

    });

  });







});