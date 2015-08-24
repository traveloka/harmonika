import BaseSyntax from './base.js';
import Identifier from './identifier.js';

/**
 * The class to define the TypeAlias syntax
 *
 * @class TypeAlias
 */
export default
class TypeAlias extends BaseSyntax {

  /**
   * The constructor of TypeAlias
   *
   * @constructor
   */
  constructor(name, right) {
    super('TypeAlias');

    this.id = new Identifier(name);
    this.right = right;

  }

}