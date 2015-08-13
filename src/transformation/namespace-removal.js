/**
 * Created by semmatabei on 7/29/15.
 */
import estraverse from 'estraverse';
import Identifier from './../syntax/identifier.js';
import VariableDeclaration from './../syntax/variable-declaration.js';
import VariableDeclarator from './../syntax/variable-declarator.js';
import union from 'lodash/array/union.js';
import path from 'path';

export default

function (ast, param, callback) {

  reset();

  if(typeof param === 'object' && param.filename) {
    let filename = (param.filename).split(path.sep);
    let object = filename[filename.length-1].split('.');
    identifiedObject.push(object[0]);
  }

  for(let itm of ast.body){
    getIdentifiedObject(itm);
  }

  estraverse.replace(ast, {
    enter: stripNamespace
  });

  estraverse.replace(ast, {
    enter: variableDeclaratorHandler
  });

  if(callback){
    callback();
  }
}

var identifiedObject = [];

function reset(){
  identifiedObject = [];
}

function getIdentifiedObject(node) {
  if(node.type === 'ExpressionStatement' && node.expression.type === 'AssignmentExpression') {
    let expr = node.expression.left;
    if(expr.type === 'MemberExpression') {
      identifiedObject.push(node.expression.left.property.name);
    }else if(expr.type === 'Identifier'){
      identifiedObject.push(node.expression.left.name);
    }

  }else if(node.type === 'VariableDeclaration'){
    for(let declaration of node.declarations) {
      identifiedObject.push(declaration.id.name);
    }
  }else if(node.type === 'ImportDeclaration'){
    for(let specifier of node.specifiers) {
      identifiedObject.push(specifier.id.name);
    }
  }
}

/**
 * Strip namespace if contain
 * @param node
 * @returns {*}
 */
function stripNamespace(node) {

  if(node.type === 'MemberExpression' && (identifiedObject.indexOf(node.property.name) !== -1 || node.property.name === 'prototype')) {

    if(
      (node.object.type === 'MemberExpression' && identifiedObject.indexOf(node.object.property.name) === -1 && node.object.property.name !== 'prototype') ||
      node.object.type !== 'MemberExpression' && identifiedObject.indexOf(node.object.name) === -1 ){
      return new Identifier(node.property.name);
    }

  }

}


/**
 * Convert
 *    a.b.c = function() {}
 * to
 *    var c = function() {}
 * @param node
 * @param parent
 * @returns {*}
 */
function variableDeclaratorHandler(node, parent) {
  if(node.type === 'ExpressionStatement' && node.expression.type === 'AssignmentExpression' && node.expression.right.type === 'FunctionExpression'){

    let leftNode = node.expression.left;

    let leftMostName = null;
    if(leftNode.type === 'MemberExpression') {
      if(leftNode.object.type === 'Identifier' && identifiedObject.indexOf(leftNode.object.name) === -1){
        leftMostName = leftNode.property.name;
      }
    }else if(leftNode.type === 'Identifier'){
      leftMostName = leftNode.name;
    }

    if(leftMostName) {

      let variableDeclarator = new VariableDeclarator();
      variableDeclarator.id = new Identifier(leftMostName);
      variableDeclarator.init = node.expression.right;

      let variableDeclaration = new VariableDeclaration();
      variableDeclaration.addDeclaration(variableDeclarator);
      if(parent.leadingComments || node.leadingComments) {
        variableDeclaration.leadingComments = union(parent.leadingComments, node.leadingComments);
      }

      return variableDeclaration;
    }


  }

}

