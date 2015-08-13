/**
 * Created by semmatabei on 8/14/15.
 */
import BaseSyntax from './base.js';

/**
 * The class to define the UnaryExpression syntax
 *
 * @class UnaryExpression
 */
export default
class UnaryExpression extends BaseSyntax {

  /**
   * The constructor of UnaryExpression
   *
   * @constructor
   */
  constructor(prefix, operator, argument) {
    super('UnaryExpression');

    this.prefix = prefix;
    this.operator = operator;
    this.argument = argument;
  }

  static get TYPEOF() { return 'typeof'; }

}
