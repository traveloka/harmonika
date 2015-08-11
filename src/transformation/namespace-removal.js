/**
 * Created by semmatabei on 7/29/15.
 */
import estraverse from 'estraverse';
import Identifier from './../syntax/identifier.js';
import VariableDeclaration from './../syntax/variable-declaration.js';
import VariableDeclarator from './../syntax/variable-declarator.js';
import merge from 'lodash/object/merge.js';

export default

function (ast, param, callback) {

  reset();

  if(typeof param === 'object') {
    namespacePrefix = merge(namespacePrefix, param.namespacePrefix);
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

var namespacePrefix =[], identifiedObject = [];

function reset(){
  namespacePrefix = [];
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
  }
}

/**
 * Strip namespace if contain
 * @param node
 * @returns {*}
 */
function stripNamespace(node) {

  if(node.type === 'MemberExpression'){
    let containNamespace = false;
    estraverse.traverse(node, {
      enter: function(inNode) {
        if(inNode.type === 'Identifier' && namespacePrefix.indexOf(inNode.name) !== -1) {
          containNamespace = true;
          this.break();
        }
      }
    });

    if(containNamespace) {

      if(node.object.type === 'MemberExpression'){
        if(node.object.property.name === 'prototype' && node.object.object.type === 'MemberExpression'){
          node.object.object = node.object.object.property;
        }else{
          node.object = node.object.property;
        }
      }else{
        node = new Identifier(node.property.name);
      }

      return node;

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
      if(parent.leadingComments) {
        variableDeclaration.leadingComments = parent.leadingComments;
      }

      return variableDeclaration;
    }


  }

}

