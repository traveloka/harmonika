import estraverse from 'estraverse';
import ImportDefaultSpecifier from './../syntax/import-default-specifier.js';
import ImportDeclaration from './../syntax/import-declaration.js';
import _ from 'lodash';

export default
  function (ast, callback) {

    unidentifiedIdentifier = [];

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
  identifiedIdentifier = ['Object', 'console'],
  defaultImportSource = {
    '$' : 'jQuery'
  };

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

  if(node.type === 'CallExpression' && node.callee.type === 'MemberExpression' && !calledByThis(node.callee)) {

    let calleeObjectName = getCalleeObject(node.callee.object);
    if(calleeObjectName && _.indexOf(identifiedIdentifier, calleeObjectName) === -1 && _.indexOf(unidentifiedIdentifier, calleeObjectName) === -1) {
      unidentifiedIdentifier.push(calleeObjectName);
    }

  }

}

function importGenerator(ast) {

  for(let i=0; i<unidentifiedIdentifier.length; i++) {

    let name = unidentifiedIdentifier[i];
    let source = defaultImportSource[name] || name;

    let specifier = new ImportDefaultSpecifier();
    specifier.setIdentifierName(name);

    let importDeclaration = new ImportDeclaration();
    importDeclaration.addSpecifier(specifier);
    importDeclaration.setLiteral(source);

    ast.body.unshift(importDeclaration);
  }

}

function getCalleeObject(callee) {

  if(callee.type === 'MemberExpression') {
    return getCalleeObject(callee.object);
  }else if(callee.type === 'Identifier'){
    return callee.name;
  }

  return false;

}


function calledByThis(callee) {

  let _calledByThis = false;

  estraverse.traverse(callee, {
    enter: function (node) {
      if(node.type === 'ThisExpression') {
        _calledByThis = true;
        this.break();
      }
    }
  });

  return _calledByThis;
}