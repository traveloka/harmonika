/**
 * Created by traveloka on 04/08/15.
 */
import estraverse from 'estraverse';
import Identifier from './../syntax/identifier.js';
import ImportDefaultSpecifier from './../syntax/import-default-specifier.js';
import Literal from './../syntax/literal.js';
import CallExpression from './../syntax/call-expression.js';
import ExpressionStatement from './../syntax/expression-statement.js';
import FunctionExpression from './../syntax/function-expression.js';

export default
  function (ast, specAst) {

    functions = [];

    estraverse.traverse(ast, {
      enter: functionDetector
    });

    estraverse.replace(specAst, {
      enter: contextReplace
    });

  }

var functions = [], className = null;

function functionDetector(node) {

  if(node.type === 'ClassDeclaration') {
    className = node.id.name;
  }

  if (node.type === 'MethodDefinition') {
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
    specifier.setIdentifierName(node.specifiers[0].id.name);

    node.specifiers[0] = specifier;

    return node;
  }
}

