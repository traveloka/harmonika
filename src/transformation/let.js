import estraverse from 'estraverse';

export default
  function (ast, param, callback) {
    estraverse.traverse(ast, {
      enter: replaceVar
    });

    if(callback) {
      callback();
    }
  }

let declarations = {};

function replaceVar(node) {
  if (node.type === 'VariableDeclaration') {
    node.declarations.forEach(function(dec) {
      declarations[dec.id.name] = node;
      declarations[dec.id.name].kind = 'const';
    });
  }

  if (node.type === 'AssignmentExpression') {
    let left = node.left.name || node.left.property.name;

    if (declarations[left]) {
      declarations[left].kind = 'let';
    }
  }
}
