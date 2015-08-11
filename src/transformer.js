import fs from 'fs';
import merge from 'lodash/object/merge.js';
import codeGenerator from './utils/escodegen.js';
import formatter from 'esformatter';
import astGenerator from './utils/ast-generator.js';
import path from 'path';

// Transformers
import namespaceRemovalTransformation from './transformation/namespace-removal.js';
import gooRemovalTransformation from './transformation/goog-removal.js';
import classTransformation from './transformation/classes.js';
import exporterTransformation from './transformation/exporter.js';
import templateStringTransformation from './transformation/template-string.js';
import arrowFunctionTransformation from './transformation/arrow-functions.js';
import letTransformation from './transformation/let.js';
import defaultArgsTransformation from './transformation/default-arguments.js';
import objectMethodsTransformation from './transformation/object-methods.js';
import implicitImporterTransformation from './transformation/implicit-importer.js';
import generateTest from './transformation/generate-test.js';

export default
class Transformer {

  /**
   * @constructor
   */
  constructor(options = {}) {

    this.ast = {};
    this.astTest = {};
    this.options = merge(this.constructor.defaultOptions, options);
    this.transformations = [];
    this.fileName = null;

    this.prepareTransformations();

  }

  /**
   * Prepare transformations array by give options
   */
  prepareTransformations() {

    let self = this;

    let shouldTransform = (key) => {
      return typeof this.options.transformers[key] !== 'undefined' && this.options.transformers[key];
    };

    let doTransform = (key, transformation, param, callback) => {
      if(shouldTransform(key)) {
        let obj = {key:key, func:transformation};
        if(param) {
          obj.param = param;
        }
        if(callback) {
          obj.callback = callback;
        }
        this.transformations.push(obj);
      }
    };

    doTransform('googRemoval', gooRemovalTransformation, {}, function(fileName){
      if(fileName) {
        self.fileName = fileName;
      }
    });

    doTransform('namespaceRemoval', namespaceRemovalTransformation, {namespacePrefix : this.options.namespacePrefix});
    doTransform('implicitImporter', implicitImporterTransformation);
    doTransform('classes', classTransformation);
    doTransform('stringTemplates', templateStringTransformation);
    doTransform('arrowFunctions', arrowFunctionTransformation);
    doTransform('let', letTransformation);
    doTransform('defaultArguments', defaultArgsTransformation);
    doTransform('objectMethods', objectMethodsTransformation);
    doTransform('generateExport', exporterTransformation);
  }

  /**
   * Prepare the abstract syntax tree for given file
   *
   * @param filename
   */
  readFile(filename) {

    let filenameParts = filename.split(path.sep);
    this.fileName = filenameParts[filenameParts.length-1];

    this.ast = astGenerator.readFile(filename, this.options);

  }

  /**
   * Prepare an abstract syntax tree for given code in string
   *
   * @param string
   */
  read(string) {

    this.ast = astGenerator.read(string, this.options);

  }

  /**
   * Apply a transformation on the AST
   *
   * @param transformation
   */
  applyTransformation(transformation) {

    if(typeof transformation === 'object'){
      let func = transformation.func;
      let callback = transformation.callback;
      let param = {filename: this.fileName};
      if(transformation.param){
        param = merge(param, transformation.param);
      }

      func(this.ast, param, callback);
    }else{
      transformation(this.ast);
    }

  }

  /**
   * Apply All transformations
   */
  applyTransformations() {

    for (let i = 0; i < this.transformations.length; i++) {
      let transformation = this.transformations[i];
      this.applyTransformation(transformation);

    }

  }

  /**
   * Returns the code string
   *
   * @returns {Object}
   */
  out() {
    let result;
    result = codeGenerator.generate(this.ast, this.options.escodegenOptions);

    if(this.options.formatter !== false) {
      result = formatter.format(result, this.options.formatter);
    }

    return result;
  }

  /**
   * Returns the test code string
   *
   * @returns {Object}
   */
  outTest() {
    let result;
    result = codeGenerator.generate(this.astTest, this.options.escodegenOptions);

    return result;
  }

  /**
   * Writes the code on file
   *
   * @param filename
   * @param callback
   */
  writeFile(filename, callback) {

    const code = this.out();

    if(typeof callback === 'function') {
      fs.writeFile(filename, code, callback);
    } else {
      fs.writeFileSync(filename, code);
    }

  }

  /**
   * Writes the test file
   *
   * @param filename
   * @param callback
   */
  writeTestFile(filename, callback) {

    if(!this.options.transformers.generateTest) {
      return;
    }

    this.astTest = astGenerator.readFile(this.options.testTemplate, {
      sync: true,
      ecmaVersion: 6
    });

    generateTest(this.ast, {specAst: this.astTest}, '../'+ this.options.sourceDir + '/' +this.fileName);

    const code = this.outTest();

    if(typeof callback === 'function') {
      fs.writeFile(filename, code, callback);
    } else {
      fs.writeFileSync(filename, code);
    }

  }

  get fileName () { return this._fileName; }
  set fileName (name) { this._fileName = name; }

  getOptions () { return this.options; }

}

Transformer.defaultOptions = {
  transformers: {
    classes: true,
    stringTemplates: true,
    arrowFunctions: true,
    let: true,
    defaultArguments: true,
    objectMethods: true,
    namespaceRemoval : true,
    googRemoval : true,
    implicitImporter: true,
    generateTest : false,
    generateExport : true
  },
  namespacePrefix : [],
  testTemplate : './src/tpl/spec.js',
  formatter: false,
  escodegenOptions: {
    format: {
      indent: {
        adjustMultilineComment: true
      }
    },
    comment: true
  },
  sourceDir : 'src',
  testDir : 'test',
  sync: true,
  ecmaVersion: 6
};
