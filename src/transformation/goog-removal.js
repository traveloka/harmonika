/**
 * Created by semmatabei on 7/30/15.
 */
import estraverse from 'estraverse';
import ImportDefaultSpecifier from './../syntax/import-default-specifier.js';
import ImportDeclaration from './../syntax/import-declaration.js';
import path from 'path';

export default
function (ast, param, callback) {
  estraverse.replace(ast, {
    enter: googProvideDetector
  });

  estraverse.replace(ast, {
    enter: googDetector
  });

  if(callback){
    callback(fileName);
  }
}

var fileName = null;

function googProvideDetector(node){

  if(node.type === 'ExpressionStatement' && node.expression.type === 'CallExpression' && node.expression.callee.type === 'MemberExpression'){

    let callExpressionNode = node.expression;
    let calleeNode = callExpressionNode.callee;
    if(calleeNode.object.type === 'Identifier' && calleeNode.object.name === 'goog' && calleeNode.property.type === 'Identifier' && calleeNode.property.name === 'provide'){

      let argument = callExpressionNode.arguments[0].value;
      let argumentParts = argument.split('.');
      fileName = argumentParts.reduce( (part1, part2) => path.join(part1, part2) ) + '.js';

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

    // Start creating new object to format -> import ... form ...
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
