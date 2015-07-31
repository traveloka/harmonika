/**
 * Created by semmatabei on 7/29/15.
 */
import BaseSyntax from './base.js';

/**
 * The class to define the VariableDeclaration syntax
 *
 * @class VariableDeclaration
 */
export default
class VariableDeclaration extends BaseSyntax {

  /**
   * The constructor of VariableDeclaration
   *
   * @constructor
   */
  constructor() {
    super('VariableDeclaration');

    this.declarations = [];
    this.kind = 'var';
  }

  addDeclaration(declaration) {
    this.declarations.push(declaration);
  }
}