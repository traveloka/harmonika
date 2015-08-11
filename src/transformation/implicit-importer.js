import estraverse from 'estraverse';
import ImportDefaultSpecifier from './../syntax/import-default-specifier.js';
import ImportDeclaration from './../syntax/import-declaration.js';
import _ from 'lodash';
import NodeDetector from './../utils/node-detector.js';

export default
  function (ast, callback) {

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
  identifiedIdentifier = ['Object', 'console', 'JSON', 'window'];
  defaultImportSource = {
    '$' : 'jquery'
  };
}

function importDetector(node) {

  if(node.type ==='ImportDeclaration') {

    let specifiers = node.specifiers;

    for(let i=0; i<specifiers.length; i++) {
      let specifier = specifiers[i];
      if(specifier.id.type === 'Identifier') {
        identifiedIdentifier.push(specifier.id.name);
      }
    }

  }

}

function identifierDetector(node) {

  if(node.type === 'MemberExpression' && !NodeDetector.calledByThis(node)) {

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