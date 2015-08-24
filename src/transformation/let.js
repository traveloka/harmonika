import estraverse from './../utils/estraverse.js';

export default
  function (ast, param, callback) {

    reset();

    estraverse.traverse(ast, {
      enter: replaceVar
    });

    if(callback) {
      callback();
    }
  }

var declarations = {};

function reset(){
  declarations = {};
}

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
    containName(node.left);
  }
}

function containName(node){
  let name = null;
  if(node.type === 'MemberExpression'){
    name = node.property.name;
    containName(node.object);
  }else if(node.type === 'Identifier'){
    name = node.name;
  }

  if (name && declarations[name]) {
    declarations[name].kind = 'let';
  }
}
