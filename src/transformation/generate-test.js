/**
 * Created by traveloka on 04/08/15.
 */
import estraverse from './../utils/estraverse.js';
import Identifier from './../syntax/identifier.js';
import ImportDefaultSpecifier from './../syntax/import-default-specifier.js';
import ImportDeclaration from './../syntax/import-declaration.js';
import Literal from './../syntax/literal.js';
import CallExpression from './../syntax/call-expression.js';
import ExpressionStatement from './../syntax/expression-statement.js';
import FunctionExpression from './../syntax/function-expression.js';

export default
  function (ast, param, mainFileLocation) {

    reset();
    let specAst = param.specAst;

    estraverse.traverse(ast, {
      enter: functionDetector
    });

    estraverse.replace(specAst, {
      enter: contextReplace
    });

    importClass(specAst, mainFileLocation);

  }

var functions = [], className = null;

function reset(){
  functions = [];
  className = null;
}

function importClass(ast, mainFileLocation) {

  let specifier = new ImportDefaultSpecifier();
  specifier.setIdentifierName(className);

  let importDeclaration = new ImportDeclaration();
  importDeclaration.addSpecifier(specifier);
  importDeclaration.setLiteral(mainFileLocation);

  ast.body.unshift(importDeclaration);
}

function functionDetector(node) {

  if(node.type === 'ClassDeclaration') {
    className = node.id.name;
  }

  if (node.type === 'MethodDefinition' && node.key.name !== 'constructor') {
    functions.push(node.key.name);
  }

}

function contextReplace(node) {

  if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === 'describe') {

    let describeText = new Literal();
    describeText.value = describeText.raw = 'Describe ' + className;
    node.arguments [0] = describeText;

    for (let i = 0; i < functions.length; i++) {

      let callee = new Identifier();
      callee.name = 'it';

      let args = [];

      let taskName = new Literal();
      taskName.value = taskName.raw = 'Evaluate ' + functions[i];

      let functionBlock = new FunctionExpression();

      args.push(taskName);
      args.push(functionBlock);

      let callExpression = new CallExpression();
      callExpression.callee = callee;
      callExpression.arguments = args;

      let functionEval = new ExpressionStatement();
      functionEval.expression = callExpression;

      node.arguments[1].body.body.push(functionEval);
    }

    return node;

  }else if(node.type === 'ImportDeclaration' && node.specifiers.length === 1) {

    let specifier = new ImportDefaultSpecifier();
    let specifierName = (node.specifiers[0].id)? node.specifiers[0].id.name : node.specifiers[0].local.name;
    specifier.setIdentifierName(specifierName);

    node.specifiers[0] = specifier;

    return node;
  }
}

