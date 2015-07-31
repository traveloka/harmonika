/**
 * Created by traveloka on 30/07/15.
 */

import BaseSyntax from './base.js';

/**
 * The class to define the Literal syntax
 *
 * @class Literal
 */
export default
class Literal extends BaseSyntax {

  /**
   * The constructor of Literal
   *
   * @constructor
   */
  constructor() {
    super('Literal');
    this.value = null;
    this.raw = null;
  }
}