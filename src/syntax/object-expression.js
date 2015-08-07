import BaseSyntax from './base.js';

/**
 * The class to define the ObjectExpression syntax
 *
 * @class ObjectExpression
 */
export default
class ObjectExpression extends BaseSyntax {

  /**
   * The constructor of ObjectExpression
   *
   * @constructor
   */
  constructor() {
    super('ObjectExpression');
    this.properties = [];
  }

  addProperty(property){
    this.properties.push(property);
  }

}