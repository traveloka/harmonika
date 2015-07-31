import estraverse from 'estraverse';

export default
  function (ast, param, callback) {
    estraverse.replace(ast, {
      enter: functionToMethod
    });

    if(callback){
      callback();
    }
  }

function functionToMethod(node) {

  if (node.type === 'ObjectExpression' && typeof node.properties === 'object') {
    for (let i = 0; i < node.properties.length; i++) {
      let property = node.properties[i];

      if (property.value.type === 'FunctionExpression') {
        property.method = true;
        property.shorthand = false;
        property.computed = false;
      }
    }

    this.skip();
  }

}