/**
 * Created by traveloka on 31/07/15.
 */
import BaseSyntax from './base.js';
import Identifier from './identifier.js';

/**
 * The class to define the ImportDefaultSpecifier syntax
 *
 * @class ImportDefaultSpecifier
 */
export default
class ImportDefaultSpecifier extends BaseSyntax {

  /**
   * The constructor of ImportDefaultSpecifier
   *
   * @constructor
   */
  constructor() {
    super('ImportDefaultSpecifier');

    this.default = true;
    this.id = new Identifier();
    this.name = null;
  }

  setIdentifierName(name) {
    this.id.name = name;
  }

}
