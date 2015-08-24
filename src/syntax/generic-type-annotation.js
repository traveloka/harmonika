import BaseSyntax from './base.js';
import Identifier from './identifier.js';

/**
 * The class to define the GenericTypeAnnotation syntax
 *
 * @class GenericTypeAnnotation
 */
export default
class GenericTypeAnnotation extends BaseSyntax {

  /**
   * The constructor of GenericTypeAnnotation
   *
   * @constructor
   */
  constructor(name) {
    super('GenericTypeAnnotation');

    this.id = new Identifier(name);

  }

}