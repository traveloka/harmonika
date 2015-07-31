/**
 * Created by traveloka on 31/07/15.
 */
import BaseSyntax from './base.js';

/**
 * The class to define the ExportDeclaration syntax
 *
 * @class ExportDeclaration
 */
export default
class ExportDeclaration extends BaseSyntax {

  /**
   * The constructor of ExportDeclaration
   *
   * @constructor
   */
  constructor() {
    super('ExportDeclaration');

    this.declaration = null;
    this.default = true;
    this.specifiers = null;
    this.source = null;

  }

}