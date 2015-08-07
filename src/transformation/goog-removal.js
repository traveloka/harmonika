/**
 * Created by semmatabei on 7/30/15.
 */
import estraverse from 'estraverse';
import ImportDefaultSpecifier from './../syntax/import-default-specifier.js';
import ImportDeclaration from './../syntax/import-declaration.js';
import Identifier from './../syntax/identifier.js';
import VariableDeclaration from './../syntax/variable-declaration.js';
import VariableDeclarator from './../syntax/variable-declarator.js';
import ObjectExpression from './../syntax/object-expression.js';
import ExportDeclaration from './../syntax/export-declaration.js';
import path from 'path';

export default
function (ast, param, callback) {

  estraverse.replace(ast, {
    enter: googProvideDetector
  });

  estraverse.replace(ast, {
    enter: googDetector
  });

  estraverse.traverse(ast, {
    enter: providedAvailability
  });

  if(!providedNameDefined){
    let className = new Identifier();
    className.name = providedName;

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

    let exportDeclaration = new ExportDeclaration();
    exportDeclaration.declaration = className;
    ast.body.push(exportDeclaration);
  }

  if(callback){
    callback(fileName);
  }
}

var fileName = null, providedName = null, providedNameDefined = false;;

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

function googDetector(node) {

  if(node.type === 'ExpressionStatement' && node.expression.type === 'CallExpression' && node.expression.callee.type === 'MemberExpression'){

    let callExpressionNode = node.expression;
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
      }

    }

  }

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