/**
 * Created by semmatabei on 7/29/15.
 */
import estraverse from 'estraverse';
import Identifier from './../syntax/identifier.js';
import VariableDeclaration from './../syntax/variable-declaration.js';
import VariableDeclarator from './../syntax/variable-declarator.js';
import MemberExpression from './../syntax/member-expression.js';
import NodeDetector from './../utils/node-detector.js';

export default

function (ast, param, callback) {

  if(typeof param === 'object' && param.namespace) {
    namespaceList = param.namespace;
  }

  estraverse.replace(ast, {
    enter: namespaceDetector
  });

  if(callback){
    callback();
  }
}

var namespaceList = [];

function namespaceDetector(node) {

  let newNode = null;

  if(node.type === 'ExpressionStatement' && node.expression.type === 'AssignmentExpression' && !NodeDetector.leftNodeHasPrototype(node.expression)){

    newNode = constructorHandler(node.expression, node);

  }else if (node.type === 'AssignmentExpression' && NodeDetector.leftNodeHasPrototype(node)) {

    newNode = prototypeHandler(node);

  }else if ( node.type === 'MemberExpression' && node.object.type === 'MemberExpression' && node.object.property.name !== 'prototype' && !NodeDetector.calledByThis(node)) {

    newNode = identifierChainHandler(node);

  }

  if(newNode) {
    return newNode;
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
function constructorHandler(node, parent) {
  if(node.right.type === 'FunctionExpression'){

    let leftNode = node.left;

    let functionName = new Identifier();
    functionName.name = leftNode.property.name;

    let variableDeclarator = new VariableDeclarator();
    variableDeclarator.id = functionName;
    variableDeclarator.init = node.right;

    let variableDeclaration = new VariableDeclaration();
    variableDeclaration.addDeclaration(variableDeclarator);
    if(parent.leadingComments) {
      variableDeclaration.leadingComments = parent.leadingComments;
    }

    return variableDeclaration;
  }

  return false;
}

/**
 * Convert
 *    a.b.c.prototype.d = function() {}
 * to
 *    c.prototype.d = function() {}
 * @param node
 * @returns {*}
 */
function prototypeHandler(node) {

  if(node.right.type === 'FunctionExpression'){

      let leftNode = node.left;

      let functionName = new Identifier();
      functionName.name = leftNode.property.name;

      let className = new Identifier();
      className.name = leftNode.object.object.name || leftNode.object.object.property.name;

      let prototypeIdentifier = new Identifier();
      prototypeIdentifier.name = 'prototype';

      let prototypeNode = new MemberExpression();
      prototypeNode.object = className;
      prototypeNode.property = prototypeIdentifier;

      let functionNode = new MemberExpression();
      functionNode.object = prototypeNode;
      functionNode.property = functionName;

      node.left = functionNode;
      return node;

  }

  return false;

}

/**
 * Convert
 *    a.b.c.call();
 *    x = a.b.c;
 * to
 *    c.call();
 *    x = b.c;
 * @param node
 * @returns {*}
 */
function identifierChainHandler(node){

  node.object = node.object.property;

  return node;

}