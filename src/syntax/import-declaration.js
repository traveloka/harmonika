/**
 * Created by traveloka on 30/07/15.
 */
import BaseSyntax from './base.js';
import Literal from './literal.js';

/**
 * The class to define the ImportDeclaration syntax
 *
 * @class ImportDeclaration
 */
export default
class ImportDeclaration extends BaseSyntax {

  /**
   * The constructor of ImportDeclaration
   *
   * @constructor
   */
  constructor() {
    super('ImportDeclaration');

    this.source = new Literal();
    this.specifiers = [];

  }

  addSpecifier(specifier) {
    this.specifiers.push(specifier);
  }

  setLiteral(value) {
    this.source.value = this.source.raw = value;
  }

}
