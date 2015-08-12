/**
 * Import every undefined Object
 */
import estraverse from 'estraverse';
import ImportDefaultSpecifier from './../syntax/import-default-specifier.js';
import ImportDeclaration from './../syntax/import-declaration.js';
import _ from 'lodash';
import NodeDetector from './../utils/node-detector.js';

export default
  function (ast, param, callback) {

    reset();

    estraverse.traverse(ast, {
      enter: importDetector
    });

    estraverse.traverse(ast, {
      enter: identifierDetector
    });

    importGenerator(ast);

    if(callback){
      callback();
    }
  }

var unidentifiedIdentifier = [],
  identifiedIdentifier = [],
  defaultImportSource = {};


function reset(){
  unidentifiedIdentifier = [];
  identifiedIdentifier = ["this", "Object", "Function", "Boolean", "Symbol", "Error", "EvalError", "InternalError", "RangeError", "ReferenceError", "SyntaxError", "TypeError", "URIError", "Number", "Math", "Date", "String", "RegExp", "Array", "Int8Array", "Uint8Array", "Uint8ClampedArray", "Int16Array", "Uint16Array", "Int32Array", "Uint32Array", "Float32Array", "Float64Array", "Map", "Set", "WeakMap", "WeakSet", "SIMD", "SIMD.Float32x4", "SIMD.Float64x2", "SIMD.Int8x16", "SIMD.Int16x8", "SIMD.Int32x4", "ArrayBuffer", "DataView", "JSON", "Promise", "Generator", "GeneratorFunction", "Reflect", "Proxy", "Intl", "Intl.Collator", "Intl.DateTimeFormat", "Intl.NumberFormat", "Iterator", "ParallelArray", "StopIteration", 'console', 'window'];
  defaultImportSource = {
    '$' : 'jquery'
  };
}

function importDetector(node) {

  if(node.type ==='ImportDeclaration') {

    let specifiers = node.specifiers;

    for(let i=0; i<specifiers.length; i++) {
      let specifier = specifiers[i];
      if(specifier.id && specifier.id.type === 'Identifier') {
        identifiedIdentifier.push(specifier.id.name);
      }else if(specifier.local && specifier.local.type === 'Identifier'){
        identifiedIdentifier.push(specifier.local.name);
      }
    }

  }

}

function identifierDetector(node) {

  if(node.type === 'MemberExpression') {

    let calleeObjectName = NodeDetector.getCalleeObject(node.object);
    if(calleeObjectName && _.indexOf(unidentifiedIdentifier, calleeObjectName) === -1) {
      unidentifiedIdentifier.push(calleeObjectName);
    }

  }else if( node.type === 'FunctionExpression' ) {

    let params = node.params;
    for(let idn of params) {
      if(idn.type === 'Identifier') {
        identifiedIdentifier.push(idn.name);
      }
    }

  }else if ( node.type === 'MethodDefinition' ){

    let params = node.value.params;
    for(let idn of params) {
      if(idn.type === 'Identifier') {
        identifiedIdentifier.push(idn.name);
      }
    }

  }else if ( node.type === 'VariableDeclarator' ) {

    if(node.id.type === 'Identifier') {
      identifiedIdentifier.push(node.id.name);
    }

  }else if ( node.type === 'AssignmentExpression' ) {

    if(node.left.type === 'Identifier') {
      identifiedIdentifier.push(node.left.name);
    }else if(node.left.type === 'MemberExpression') { // Only allowed until 2 level dot chain

      var mostLeft = NodeDetector.getCalleeObject(node.left);
      identifiedIdentifier.push(mostLeft);

    }

  }

}


function importGenerator(ast) {

  for(let i=0; i<unidentifiedIdentifier.length; i++) {

    let name = unidentifiedIdentifier[i];

    if(identifiedIdentifier.indexOf(name) !== -1) {
      continue;
    }

    let source = defaultImportSource[name] || name;

    let specifier = new ImportDefaultSpecifier();
    specifier.setIdentifierName(name);

    let importDeclaration = new ImportDeclaration();
    importDeclaration.addSpecifier(specifier);
    importDeclaration.setLiteral(source);

    ast.body.unshift(importDeclaration);
  }

}