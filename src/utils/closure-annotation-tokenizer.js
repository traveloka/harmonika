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

  constructor(options){

    this.options = merge(this.constructor.defaultOptions, options);
    this.importedTypes = {};

    this.ANNOTATION = ANNOTATION;

    this.groupAnnotation = {};
    this.normalizer = this.constructor.normalizerMethod(this.importedTypes);

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
      let id = (tokenObject.annotation === '@param' )?tokenObject.param2:'param1';
      this.groupAnnotation[tokenObject.annotation][id] = tokenObject.param1;
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
          if (section[pos] === '{') {
            bracketMemory++;
          } else if (section[pos] === '}') {
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
      _tokens[i].param2 = this._normalizeStr(_tokens[i].param2);
    }
    return _tokens;
  }

  _normalizeStr(str){
    let result = str;
    let normalizer = this.options.normalizer;

    result = this.normalizer.handleOptional(result);
    // Force return 'Function' if found function type
    let replaceFunctionType = this.normalizer.replaceFunctionType(result);
    if(replaceFunctionType){
      return replaceFunctionType;
    }

    if(normalizer.removeGenericTypeDot){
      result = this.normalizer.removeGenericTypeDot(result);
    }

    if(normalizer.removeWrapBracket){
      result = this.normalizer.removeWrapBracket(result);
    }

    if(normalizer.removeNamespace){
      result = this.normalizer.removeNamespace(result);
    }

    return result;
  }

}

ClosureAnnotationTokenizer.defaultOptions = {
  normalizer : {
    removeGenericTypeDot : true,
    removeWrapBracket : true,
    removeNamespace : true
  }
};

ClosureAnnotationTokenizer.normalizerMethod = function(importedTypes){

  let handleOptional = function(str){
    if(str.indexOf('=') !== -1){
      let alt = str.replace('/\=/g', '');
      alt = alt.split('|');
      alt = alt.map((s) => '?'+s );
      str = alt.join('|');
    }

    return str;
  };

  let replaceFunctionType = function(str){
    if(str.indexOf('function') !== -1) {
      return ((str.indexOf('?') !==-1 )?'?':'')+'Function';
    }else{
      return false;
    }
  };

  let removeGenericTypeDot = function(str){
    return str.replace(/\.</g, '<');
  };

  let removeWrapBracket = function(str){
    if(str[0] === '{' && str[str.length-1] === '}'){
      return str.substring(1, str.length-1);
    }else{
      return str;
    }
  };

  let replaceStar = function(str){
    return str.replace(/\*/g, 'any');
  };

  let removeNamespace = function(str){
    // Only get proceed if dot char have been normalized
    let noDotStr = removeGenericTypeDot(str);

    let newStr = noDotStr.replace(/([^ :,{}<>]*)/g, replacer);
    newStr = replaceStar(newStr);

    return newStr;
  };

  //Also replace null with ?
  function replacer(match) {
    let alt = match.split('|');
    let result = [];
    let containNull = false;
    for(let i=0; i<alt.length; i++){
      let splitStr = alt[i].split('.');
      if(splitStr.length > 1){
        importedTypes[alt[i]] = 1;
        result.push(splitStr[splitStr.length-1]);
      }else{
        if(alt[i] === 'null') {
          containNull = true;
        }
        result.push(alt[i]);
      }
    }
    if(containNull){
      result = result.filter((s) => s !== 'null');
      result = result.map((s) => '?'+s );
    }

    return result.join('|');
  }

  return {
    removeGenericTypeDot : removeGenericTypeDot,
    removeWrapBracket : removeWrapBracket,
    removeNamespace : removeNamespace,
    importedTypes : importedTypes,
    replaceFunctionType : replaceFunctionType,
    handleOptional : handleOptional
  };
};