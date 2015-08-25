import merge from 'lodash/object/merge.js';

const ANNOTATION = {
  TYPEDEF : '@typedef',
  PARAM	: '@param',
  TYPE	: '@type',
  RETURN	: '@return'
};

const acceptedAnnotation = ['@typedef', '@param', '@type', '@return'];

const STATE = {
  NONE : 0,
  READING_ANNOTATION : 1,
  READING_PARAM1 : 2,
  READING_PARAM2 : 3,
  END_READING : 4
};

export default
class ClosureAnnotationTokenizer {

  constructor(){

    this.importedTypes = {};
    this.ANNOTATION = ANNOTATION;
    this.groupAnnotation = {};
  }

  tokenize(js, previousToken) {
    this.groupAnnotation = {};
    // '*\n * @param {string} a \n * @param {string} b \n *
    let lineToken = js.split('\n'); // Split each new line -> ['*',' * @param {string} a', ' * @param {string} b', '*']
    lineToken = lineToken.map(this._stripComment); // Remove * from start of every line -> ['', '@param {string} a', '@param {string} b', '']
    let flatLine = lineToken.join(' ').trim(); // Join back each new line, separate by whitespace -> '@param {string} a @param {string} b'
    let section = this._splitSection(flatLine); // Split each @ occurrence -> ['@param {string} a', '@param {string} b']
    let tokens = [];

    //Parse each line to get it's {annotation, param1, param2}
    for (let i = 0; i < section.length; i++) {
      let token = this._partExtractor(section[i]);
      if(token){
        tokens.push(token);
      }
    }

    // Remove/Replace character to ensure standardisation
    tokens = this._normalize(tokens);
    // Format result to desired format
    this._classifiedAnnotation(tokens);

    let result = {token : tokens, classifiedAnnotation: this.groupAnnotation};

    // Combine with previous result if provided
    if(previousToken){
      merge(previousToken, result);
    }
    return result;
  }

  _classifiedAnnotation(token){
    for (let i = 0; i < token.length; i++) {
      let tokenObject = token[i];
      if(!this.groupAnnotation.hasOwnProperty(tokenObject.annotation)){
        this.groupAnnotation[tokenObject.annotation] = {};
      }
      let id = 'param1', value = tokenObject.param1;
      if(tokenObject.annotation === '@param' ){
        if(tokenObject.param2 === ''){
          id = tokenObject.param1;
          value = 'any';
        }else{
          id = tokenObject.param2;
        }
      }

      this.groupAnnotation[tokenObject.annotation][id] = value;
    }
  }

  _stripComment(line) {
    let res = line.trim();
    if (res.indexOf('*') === 0) {
      res = res.substr(1, res.length);
    }
    return res.trim();
  }

  _splitSection(flatLine) {
    let indices = [], result = [];
    for (let i = 0; i < flatLine.length; i++) {
      if (flatLine[i] === '@') {
        indices.push(i);
      }
    }
    for (let i = 0; i < indices.length; i++) {
      let lastIndex = (i + 1 < indices.length) ? indices[i + 1] : flatLine.length;
      result[i] = flatLine.substring(indices[i], lastIndex).trim();
    }
    return result;
  }

  _partExtractor(section) {
    let pos = 0;
    let curState = STATE.NONE;
    let part = {annotation: '', param1: '', param2: ''};
    let bracketMemory = 0;

    while (pos < section.length && curState !== STATE.END_READING) {
      switch (section[pos]) {
        case '@'  :
          part.annotation = section[pos];
          curState = STATE.READING_ANNOTATION;
          break;
        case ' ' :
          if (curState === STATE.READING_ANNOTATION) {
            part.param1 = '';
            curState = STATE.READING_PARAM1;
          } else if (curState === STATE.READING_PARAM1 && part.param1 !== '' && bracketMemory === 0) {
            part.param2 = '';
            curState = STATE.READING_PARAM2;
          } else if (curState === STATE.READING_PARAM2 && part.param2 !== '' && bracketMemory === 0) {
            curState = STATE.END_READING;
          }
          break;
        default :
          if (section[pos] === '{' || section[pos] === '<' || section[pos] === '(') {
            bracketMemory++;
          } else if (section[pos] === '}' || section[pos] === '>' || section[pos] === ')') {
            bracketMemory--;
          }
          if (curState === STATE.READING_ANNOTATION) {
            part.annotation += section[pos];
          } else if (curState === STATE.READING_PARAM1) {
            part.param1 += section[pos];
          } else if (curState === STATE.READING_PARAM2) {
            part.param2 += section[pos];
          }
          break;
      }
      pos++;
    }

    // Make sure only pass accepted annotation
    if(acceptedAnnotation.indexOf(part.annotation) === -1){
      return null;
    }else{
      return part;
    }

  }

  _normalize(tokens){
    let _tokens = tokens;
    for(let i=0; i<_tokens.length; i++){
      _tokens[i].param1 = this._normalizeStr(_tokens[i].param1);
    }
    return _tokens;
  }

  _normalizeStr(str){
    let self = this;

    function _typeToken(type){

      type = self._replaceWithAny(type);
      type = self._removeNameSpace(type);

      return type;
    }

    let result = str;

    result = self._removeUnusedChar(result);
    result = self._removeWrapBracket(result);
    result = self._replaceEqualToQuestionMark(result);
    result = self._removeGenericDot(result);
    result = self._replaceFunctionType(result);

    let regExp = new RegExp(/([^{}|\s:,<>()]*)/g);
    result = result.replace(regExp, _typeToken);

    result = self._handleMap(result);
    result = self._containNull(result); // TODO : improve contain null, considered hacky

    result = self._specialCaseHandler(result); // TODO : hacky

    return result;
  }

  _specialCaseHandler(result){
    let regExpAny = new RegExp(/any\([a-z0-9]*\)/ig); // any(...)
    result = result.replace(regExpAny, (match, type) => '?' + type);

    let regExpTypedFunction = new RegExp(/(function)[\s]*:[\s]*[a-zA-Z0-9]*/ig); //function:boolean
    result = result.replace(regExpTypedFunction, (match, type) => type);

    let regExpAnyWraping = new RegExp(/any({[a-z:,<>()\s\|]*})/ig); //any{...}
    result = result.replace(regExpAnyWraping, (match, type) => '?' + type);

    let regExpBackQMark = new RegExp(/([a-z0-9]*)\?/ig); // ...?
    result = result.replace(regExpBackQMark, (match, type) => '?' + type);

    let regExpTypeGroup = new RegExp(/\([a-z,\s]*\)/ig); // (..., ..., ...)
    result = result.replace(regExpTypeGroup, (match) => 'any');

    let regExpComplexObject = new RegExp(/Object<[a-z0-9{}\[\],<>:\s]*>/ig); // Object<string,Object<string,Object<string,Array<string>>>>
    result = result.replace(regExpComplexObject, (match) => 'Object');

    if(result === ''){
      result = 'any';
    }

    return result;
  }

  _removeUnusedChar(str){
    let result = str.replace(/\!/g,'');
    return result;
  }

  _handleMap(type){
    let self = this;
    function replacerMap(match, open, key, separator, value, close){
      open = '{ ';
      close = ' }';
      key = self._containNull(key);
      value = self._containNull(value);
      key = '[key : ' + key + ']';
      separator = ': ';
      return [open, key, separator, value, close].join('');
    }

    let regExp = new RegExp(/[a-zA-Z0-9]*[\s]*(<)[\s]*([\|a-zA-Z0-9_\?]*)[\s]*(,)[\s]*([\|a-zA-Z0-9_\?]*)[\s]*(>)/g);
    return type.replace(regExp, replacerMap);
  }

  _replaceEqualToQuestionMark(type){
    let result = type;
    if(type.indexOf('=') !== -1){
      if(type !== '' && type.indexOf('?') === -1){
        result = '?'+result;
      }
      return result.replace(/=/g,'');
    }

    return result;
  }

  _replaceFunctionType(type){
    var keyword = 'function';
    var functionPos = type.indexOf(keyword);
    var lastIndex = type.length;
    var resultType = type;
    while(functionPos !== -1){
      var nextId = functionPos+keyword.length;
      var token = type.substring(functionPos, nextId);
      var bracketCount = 0;
      while(nextId < lastIndex){
        var w = type[nextId];
        token += w;
        if(w === '(' || w === '<' || w === '{'){
          bracketCount++;
        }else if(w === ')' || w === '>' || w === '}'){
          bracketCount--;
        }

        if((w === ',' || w === ' ' || w === ')' ) && bracketCount === 0 && token.trim() !== keyword){
          break;
        }
        nextId++;
      }
      resultType = resultType.replace(token, 'Function');
      functionPos = type.indexOf(keyword, nextId);
    }

    return resultType;
  }

  _removeGenericDot(type){
    return type.replace(/\.</g, '<');
  }

  _removeWrapBracket(type){
    if(type[0] === '{' && type[type.length-1] === '}'){
      return type.substring(1, type.length-1);
    }
    return type;
  }

  _replaceWithAny(type){
    if(type === '?' || type === '*'){
      return 'any';
    }else if(type === '?*'){
      return '?any';
    }
    return type;
  }

  _removeNameSpace(type){
    let hadQuestionMark = type.indexOf('?') !== -1;
    let cleanType = type.replace(/\?/g,'');
    let splitStr = cleanType.split('.');
    let result = type;
    if(splitStr.length > 1){
      this.importedTypes[cleanType] = 1;
      result = ((hadQuestionMark)?'?':'') + splitStr[splitStr.length-1];
    }

    return result;
  }

  _containNull(str){ //TODO : Error
    if(str.indexOf('null') !== -1){
      let regExp = new RegExp(/([^ \s:,{}<>()\[\]]*)/g);
      return str.replace(regExp, this._replaceNull);
    }
    return str;
  }

  _replaceNull(type){
    let alt = type.split('|');
    let result = [];
    let containNull = alt.indexOf('null') !== -1;
    result = alt.filter((s) => s !== 'null');
    if(containNull){
      result = result.map(function(s){

        if(s.indexOf('?') === -1){
          return '?'+s;
        }
        return s;

      });
    }

    return result.join('|');
  }

}