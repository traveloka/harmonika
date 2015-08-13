import BaseSyntax from './base.js';

/**
 * The class to define the LogicalExpression syntax
 *
 * @class LogicalExpression
 */
export default
class LogicalExpression extends BaseSyntax {

  /**
   * The constructor of LogicalExpression
   *
   * @constructor
   */
  constructor(left, right, operator) {
    super('LogicalExpression');

    this.left = left;
    this.right = right;
    this.operator = operator;
  }

  static get OP_AND() { return '&&'; }
  static get OP_OR() { return '||'; }

}