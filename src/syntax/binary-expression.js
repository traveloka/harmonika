import BaseSyntax from './base.js';

/**
 * The class to define the BinaryExpression syntax
 *
 * @class BinaryExpression
 */
export default
class BinaryExpression extends BaseSyntax {

  /**
   * The constructor of BinaryExpression
   *
   * @constructor
   */
  constructor(left, right, operator) {
    super('BinaryExpression');

    this.left = left;
    this.right = right;
    this.operator = operator;
  }

  static get OP_NOT_EQUAL() { return '!=='; }
  static get OP_EQUAL() { return '==='; }

}