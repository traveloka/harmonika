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
  constructor(value) {
    super('Literal');
    if(value){
      this.value = value;
      this.raw = value;
    }else{
      this._constructor();
    }

  }

  _constructor() {
    this.value = null;
    this.raw = null;
  }
}