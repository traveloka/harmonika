/**
 * Convert any function with prototype to class with method
 *
 *
 * Step :
 * 1. functionDetector : Traverse and save all function on `functions` (exclude prototype function)
 * 2. classMaker : Find all prototype assignment and static object member
 * 2.a When found prototype assignment, call createClass to create new class declaration with the constructor method from `functions` which have the same identifier
 * 2.a.1 Find `call` function call inside constructor to determine whether this is a child class or not
 * 2.a.2 Add this constructor to new created class
 * 2.a.3 save new created class node to .class and node._class attribute of the original function (function saved on `functions`)
 * 2.b Save current prototype assignment to new created class body and add ._remove attribute to the parent (ExpressionStatement in this case)
 * 2.c Detect getter-setter on es5 (which utilize Object.defineProperty) and convert to es6 getter-setter, add to class(with same identifier) and add ._remove to the parent
 * 3. classReplacement :
 * 3.a Remove all node with ._remove
 * 3.b Replace all node with its ._class
 * 3.c Replace all node with ._replace with its ._replace._class
 */

import estraverse from './../utils/estraverse.js';
import MethodDefinition from './../syntax/method-definition.js';
import ClassDeclaration from './../syntax/class-declaration.js';
import Identifier from './../syntax/identifier.js';
import ThisExpression from './../syntax/this-expression.js';
import MemberExpression from './../syntax/member-expression.js';
import CallExpression from './../syntax/call-expression.js';
import ReturnStatement from './../syntax/return-statement.js';
import VariableDeclaration from './../syntax/variable-declaration.js';
import VariableDeclarator from './../syntax/variable-declarator.js';
import union from 'lodash/array/union.js';

export default
  function (ast, param, callback) {

    reset();

    estraverse.traverse(ast, {
      enter: functionDetector
    });

    estraverse.traverse(ast, {
      enter: classMaker
    });

    estraverse.replace(ast, {
      enter: classReplacement
    });

    if(containClass && superClass) {

      estraverse.replace(ast, {
        enter: callParentMethodDetector
      });

    }

    if(externalData.length > 0){
      for(let data of externalData){
        ast.body.push(data);
      }
    }


    if(callback){
      callback();
    }
  }

var
  functions = [],
  containClass = false,
  superClass = null,
  externalData = [];

function reset(){
  functions = [];
  containClass = false;
  superClass = null;
  externalData = [];
}

function createClass(_function) {
  if (typeof _function.class === 'undefined') {
    let createdClass = new ClassDeclaration();
    createdClass.name = _function.id.name;

    let constructor = new MethodDefinition();
    constructor.name = 'constructor';
    constructor.body = _function.node.body;
    constructor.leadingComments = union(_function.parent.leadingComments, _function.node.leadingComments);
    constructor.params =  _function.node.params;

    let superClassName = detectInheritance(constructor.body);
    if(superClassName) {
      createdClass.superClass = superClassName;
      superClass = superClassName;
    }

    _function.class = createdClass;
    _function.node._class = createdClass;

    createdClass.body.addMethod(constructor, true);
    containClass = true;
  }
}

function detectInheritance(_constructorBody) {

  let superClassName = null;

  estraverse.replace(_constructorBody, {
    enter: function (node) {

      if(node.type === 'CallExpression' && hasCallIdentifier(node.callee)) {

        let callArguments = node.arguments;
        callArguments.shift();

        let callSuper = new CallExpression();
        callSuper.callee = new Identifier('super');
        callSuper.arguments = callArguments;

        // Search super class name
        superClassName = new Identifier(node.callee.object.name);

        return callSuper;

      }

    }
  });

  return superClassName;
}

function hasCallIdentifier(node) {

  var hasCall = false;

  estraverse.traverse(node, {
    enter: function(member) {
      if(member.type === 'Identifier' && member.name === 'call') {
        hasCall = true;
        this.break();
      }
    }
  });

  return hasCall;

}

function callParentMethodDetector(node){
  if(node.type === 'CallExpression') {
    let callee = node.callee;
    if(callee.type === 'MemberExpression' && callee.object.type === 'Identifier' && callee.object.name === superClass.name) {
      callee.object.name = 'super';
      node.callee = callee;
      return node;
    }
  }
}

function functionDetector(node, parent) {

  if (node.type === 'FunctionDeclaration') {
    let id = node.id;
    functions.push({
      id: id,
      parent: parent,
      node: node
    });
  } else if (node.type === 'VariableDeclarator' && node.init && node.init.type === 'FunctionExpression') {
    parent._replace = node.init;
    let id = node.id;
    functions.push({
      id: id,
      parent: parent,
      node: node.init
    });
  }

}

/**
 * Checking whether variable; which call the prototype, exist on `functions`
 * @param identifierName
 * @returns {boolean}
 */
function classDefined(identifierName) {
  if(identifierName.type === 'Identifier') {
    for (let _function of functions) {
      if (_function.id.name === identifierName.name) {
        return true;
      }
    }
  }

  return false;
}

function classMaker(node, parent) {

  if (node.type === 'AssignmentExpression') {

    let staticMethodCandidate = node.left.object && classDefined(node.left.object);
    if (node.left.property && node.left.property.name === 'constructor') {
      parent._remove = true;
    } else if (node.left.object && ((node.left.object.property && node.left.object.property.name === 'prototype') || staticMethodCandidate)) {

      let functionName = null;
      if(staticMethodCandidate) {
        functionName = node.left.object.name;
      }else {
        functionName = node.left.object.object.name;
      }

      for (let _function of functions) {

        if (_function.id.name === functionName) {
          createClass(_function);

          if (!(node.left.property && node.left.property.type === 'Identifier' && node.left.property.name === 'prototype')) {
            let method = node.right;
            let createdMethod = new MethodDefinition();
            createdMethod.leadingComments = parent.leadingComments;
            if(method.returnType){
              createdMethod.returnType = method.returnType;
            }

            if (method.type === 'Identifier') {

              createdMethod.body =
                new ReturnStatement(
                  new CallExpression(
                    new MemberExpression(
                      node.right,
                      new Identifier('apply')
                    ), [
                      new ThisExpression(),
                      new Identifier('arguments')
                    ]
                  )
                );

            } else if(method.type !== 'FunctionExpression'){
              let localIdentifier = new Identifier('_'+node.left.property.name);
              createdMethod.kind = 'get';
              createdMethod.body = new ReturnStatement(localIdentifier);

              let variableDeclarator = new VariableDeclarator();
              variableDeclarator.id = localIdentifier;
              variableDeclarator.init = node.right;

              let variableDeclaration = new VariableDeclaration();
              variableDeclaration.addDeclaration(variableDeclarator);
              externalData.push(variableDeclaration);

            }else {
              createdMethod.body = method.body;
              createdMethod.params = method.params;
            }

            createdMethod.name = node.left.property.name;
            if(staticMethodCandidate) {
              createdMethod.static = true;
            }

            _function.class.body.addMethod(createdMethod);



          }
          parent._remove = true;
          this.skip();
        }


      }

    }

  } else if (
    node.type === 'CallExpression' && node.callee &&
    node.callee.type === 'MemberExpression' && node.callee.object.name === 'Object' &&
    node.callee.property.name === 'defineProperty' && node.arguments[0].type === 'MemberExpression' &&
    node.arguments[0].property.name === 'prototype' && node.arguments[1].type === 'Literal' &&
    node.arguments[2].type === 'ObjectExpression'
  ) {

    let functionName = node.arguments[0].object.name;

    for (let i = 0; i < functions.length; i++) {
      let _function = functions[i];

      if (_function.id.name === functionName) {
        createClass(_function);
        let properties = node.arguments[2].properties;

        for (var j = 0; j < properties.length; j++) {
          let property = properties[j];

          if (property.key.name !== 'get' && property.key.name !== 'set') {
            continue;
          }

          let createdMethod = new MethodDefinition();

          createdMethod.body = property.value.body;
          createdMethod.params = property.value.params;
          createdMethod.name = node.arguments[1].value;
          createdMethod.kind = property.key.name;

          _function.class.body.addMethod(createdMethod);
        }

        parent._remove = true;

        this.skip();
      }
    }
  }

}

function classReplacement(node) {
  if (node._class) {
    return node._class;
  } else if (node._remove) {
    this.remove();
  } else if (node._replace) {
    return node._replace._class;
  }
}
