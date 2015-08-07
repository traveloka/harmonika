import estraverse from 'estraverse';

/**
 * Check if there is `prototype` on the left hand assignment
 * @param node
 * @returns {boolean}
 */
function leftNodeHasPrototype(node){

  let _hasPrototype = false;

  estraverse.traverse(node, {
    enter: function (inNode) {
      if(inNode.type === 'Identifier' && inNode.name === 'prototype') {
        _hasPrototype = true;
        this.break();
      }
    }
  });

  return _hasPrototype;

}

/**
 * check if node match this.something
 * @param callee
 * @returns {boolean}
 */
function calledByThis(callee) {

  let _calledByThis = false;

  estraverse.traverse(callee, {
    enter: function (node) {
      if(node.type === 'ThisExpression') {
        _calledByThis = true;
        this.break();
      }
    }
  });

  return _calledByThis;
}

/**
 * Get left most identifier on dot chain, a.b.c would return a
 * @param callee
 * @returns {*}
 */
function getCalleeObject(callee) {

  if(callee.type === 'MemberExpression') {
    return getCalleeObject(callee.object);
  }else if(callee.type === 'Identifier'){
    return callee.name;
  }

  return false;

}

function getNodeObject(node, identifiers) {

  if(node.object.type === 'MemberExpression' && identifiers.indexOf(node.object.property.name) !== -1 ) {
    node.object = node.object.property;
  }else if(node.object.type === 'MemberExpression'){
   getNodeObject(node.object, identifiers);
  }

}

function getStripedIdentifier(node, identifiers) {

  if(node.type === 'MemberExpression' && node.object.type === 'MemberExpression' && node.object.property.name !== 'prototype' && !calledByThis(node)) {
    getNodeObject(node, identifiers);
    return node;
  }

  return false;
}

export default {
  leftNodeHasPrototype : leftNodeHasPrototype,
  calledByThis : calledByThis,
  getCalleeObject : getCalleeObject,
  getStripedIdentifier : getStripedIdentifier
};