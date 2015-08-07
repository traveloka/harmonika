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

  namespacePrefix = [];
  if(typeof param === 'object') {
    namespacePrefix = merge(namespacePrefix, param.namespacePrefix);
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

var namespacePrefix =[];
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
        let idn = new Identifier();
        idn.name = node.property.name;
        node = idn;
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
  if(node.type === 'ExpressionStatement' && node.expression.type === 'AssignmentExpression' && node.expression.left.type === 'Identifier' && node.expression.right.type === 'FunctionExpression'){

    let leftNode = node.expression.left;

    let className = new Identifier();
    className.name = leftNode.name;

    let variableDeclarator = new VariableDeclarator();
    variableDeclarator.id = className;
    variableDeclarator.init = node.expression.right;

    let variableDeclaration = new VariableDeclaration();
    variableDeclaration.addDeclaration(variableDeclarator);
    if(parent.leadingComments) {
      variableDeclaration.leadingComments = parent.leadingComments;
    }

    return variableDeclaration;
  }

}

