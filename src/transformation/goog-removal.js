/**
 * Created by semmatabei on 7/30/15.
 */
/**
 * Capabilities :
 * 1. Detect goog.provide to determine filename and main object/class name
 * 2. Detect goog.require & inherits :
 * 2.a on goog.require : generate relative path and convert to es6 module import style
 * 2.b on goog.inherits : remove the expression since it's not much use
 * 3. providedAvailability : Check whether the provided name had been declared
 * 3.a If it's never declared : add new variable declaration after import statement
 */
import estraverse from 'estraverse';
import ImportDefaultSpecifier from './../syntax/import-default-specifier.js';
import ImportDeclaration from './../syntax/import-declaration.js';
import Identifier from './../syntax/identifier.js';
import VariableDeclaration from './../syntax/variable-declaration.js';
import VariableDeclarator from './../syntax/variable-declarator.js';
import ObjectExpression from './../syntax/object-expression.js';
import LogicalExpression from './../syntax/logical-expression.js';
import BinaryExpression from './../syntax/binary-expression.js';
import UnaryExpression from './../syntax/unary-expression.js';
import Literal from './../syntax/literal.js';
import path from 'path';

export default
function (ast, param, callback) {

  reset();

  estraverse.replace(ast, {
    enter: googProvideDetector
  });

  estraverse.replace(ast, {
    enter: googDetector
  });

  estraverse.traverse(ast, {
    enter: providedAvailability
  });

  if(!providedNameDefined && providedName){
    let className = new Identifier(providedName);

    let variableDeclarator = new VariableDeclarator();
    variableDeclarator.id = className;
    variableDeclarator.init = new ObjectExpression();

    let variableDeclaration = new VariableDeclaration();
    variableDeclaration.addDeclaration(variableDeclarator);

    for (let i=0; i<ast.body.length; i++){
      if(ast.body[i].type !== 'ImportDeclaration') {
        ast.body.splice(i, 0, variableDeclaration);
        break;
      }
    }

  }

  if(callback){
    callback(fileName);
  }
}

var fileName = null, providedName = null, providedNameDefined = false;

function reset(){
  fileName = null;
  providedName = null;
  providedNameDefined = false;
}

function googProvideDetector(node){

  if(node.type === 'ExpressionStatement' && node.expression.type === 'CallExpression' && node.expression.callee.type === 'MemberExpression'){

    let callExpressionNode = node.expression;
    let calleeNode = callExpressionNode.callee;
    if(calleeNode.object.type === 'Identifier' && calleeNode.object.name === 'goog' && calleeNode.property.type === 'Identifier' && calleeNode.property.name === 'provide'){

      let argument = callExpressionNode.arguments[0].value;
      let argumentParts = argument.split('.');
      fileName = argumentParts.reduce( (part1, part2) => path.join(part1, part2) ) + '.js';
      providedName = argumentParts[argumentParts.length-1];

      this.remove();
    }

  }

}
// This is separated from googProvideDetector to ensure provide will always detected first because following functionality depends on provided name
function googDetector(node) {

  if(
    (node.type === 'ExpressionStatement' && node.expression.type === 'CallExpression' && node.expression.callee.type === 'MemberExpression') ||
    (node.type === 'CallExpression' && node.callee.type === 'MemberExpression')
  ){

    let callExpressionNode = node.expression || node;
    let calleeNode = callExpressionNode.callee;

    if(calleeNode.object.type === 'Identifier' && calleeNode.object.name === 'goog' && calleeNode.property.type === 'Identifier'){

      switch(calleeNode.property.name){
        case 'require' :
          let newNode = googRequireHandler(callExpressionNode);
          if(newNode) {
            return newNode;
          }
          break;
        case 'inherits' :
          googInheritsHandler(this, callExpressionNode);
          break;
        case 'isDefAndNotNull' :
          return isDefAndNotNullHandler(callExpressionNode);
      }

    }

  }

}

function isDefAndNotNullHandler(node){

  let identifier = node.arguments[0];

  let notNullCondition = new BinaryExpression(
    identifier,
    new Literal('null'),
    BinaryExpression.OP_NOT_EQUAL
  );

  let notDefinedCondition = new BinaryExpression(
    new UnaryExpression(true, UnaryExpression.TYPEOF, identifier),
    new Literal('undefined'),
    BinaryExpression.OP_NOT_EQUAL
  );

  return new LogicalExpression(notNullCondition, notDefinedCondition, LogicalExpression.OP_AND);
}

function googRequireHandler(callExpressionNode){

  let calleeNode = callExpressionNode.callee;
  if(calleeNode.property && calleeNode.property.type === 'Identifier'){

    let requireFile = (callExpressionNode.arguments[0].value).replace(/\./g, path.sep);
    let requirePath = path.dirname(requireFile);
    let requireFileName = path.basename(requireFile);

    let myPath = path.dirname(fileName);

    // Get the relative path ../../
    let relativePath = path.relative(myPath, requirePath);

    // Start creating new object to format -> import `requireFileName` from `relativePath`
    let specifier = new ImportDefaultSpecifier();
    specifier.setIdentifierName(requireFileName);

    let importDeclaration = new ImportDeclaration();
    importDeclaration.addSpecifier(specifier);
    importDeclaration.setLiteral(path.join(relativePath, requireFileName) + '.js');

    return importDeclaration;

  }

  return false;
}

function googInheritsHandler(est){

  est.remove();

}


function providedAvailability(node) {

  if(node.type === 'ExpressionStatement' && node.expression.type === 'AssignmentExpression') {
    let expr = node.expression.left;
    if(expr.property.name === providedName) {
      providedNameDefined = true;
      this.break();
    }
  }else if(node.type === 'VariableDeclaration'){
    for(let declaration of node.declarations) {
      if(declaration.id.name === providedName) {
        providedNameDefined = true;
        this.break();
      }
    }
  }

}