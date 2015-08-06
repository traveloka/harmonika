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

export default {
  leftNodeHasPrototype : leftNodeHasPrototype,
  calledByThis : calledByThis,
  getCalleeObject : getCalleeObject
};