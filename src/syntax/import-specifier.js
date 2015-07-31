/**
 * Created by traveloka on 30/07/15.
 */
import BaseSyntax from './base.js';
import Identifier from './identifier.js';

/**
 * The class to define the ImportSpecifier syntax
 *
 * @class ImportSpecifier
 */
export default
class ImportSpecifier extends BaseSyntax {

  /**
   * The constructor of ImportSpecifier
   *
   * @constructor
   */
  constructor() {
    super('ImportSpecifier');

    this.default = true;
    this.id = new Identifier();
    this.name = null;
  }

  setIdentifierName(name) {
    this.id.name = name;
  }

}
