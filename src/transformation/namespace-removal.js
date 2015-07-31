/**
 * Created by semmatabei on 7/29/15.
 */
import estraverse from 'estraverse';
import Identifier from './../syntax/identifier.js';
import VariableDeclaration from './../syntax/variable-declaration.js';
import VariableDeclarator from './../syntax/variable-declarator.js';
import MemberExpression from './../syntax/member-expression.js';
import _ from 'lodash';

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

var namespaceList = [], matchNamespaceList = false;

function namespaceDetector(node, parent) {

  let newNode = null;

  if(node.type === 'ExpressionStatement' && node.expression.type === 'AssignmentExpression' && !leftNodeHasPrototype(node.expression)){

    newNode = assignmentExpressionHandler(node.expression, node);

  }else if (node.type === 'AssignmentExpression') {

    newNode = assignmentExpressionHandler(node, parent);

  }else if ( node.type === 'CallExpression' && node.callee.property && node.callee.property.type === 'Identifier' && node.callee.property.name === 'call'){

    newNode = baseClassCallerHandler(node);

  }

  if(newNode) {
    return newNode;
  }

}

function assignmentExpressionHandler(node, parent) {

  if(node.right.type === 'FunctionExpression'){

    if(namespaceList.length > 0){
      estraverse.traverseChildren(node, {
        enter: namespaceRootDetector
      });
    }else{
      matchNamespaceList = true;
    }

    if(matchNamespaceList){

      let leftNode = node.left;

      let functionName = new Identifier();
      functionName.name = leftNode.property.name;

      if(leftNode.object.property.name === 'prototype'){ // This is a prototype

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

      }else{

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

    }

  }

  return false;

}

function baseClassCallerHandler(node){

  let caller = node.callee;
  let baseClassName = caller.object.property.name;
  let baseClassIdentifier = new Identifier();
  baseClassIdentifier.name = baseClassName;

  caller.object = baseClassIdentifier;
  node.callee = caller;

  return node;

}

function namespaceRootDetector(node) {

  if (node.type === 'Identifier' && _.indexOf(namespaceList, node.name) !== -1) {
    matchNamespaceList = true;
    this.skip();
  }

}

function leftNodeHasPrototype(node){

  if(node.left.object.property && node.left.object.property.name === 'prototype') {
    return true;
  }

  return false;
}