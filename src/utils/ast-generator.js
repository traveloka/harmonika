import acorn from 'acorn';
import escodegen from 'escodegen';
import fs from 'fs';
import coffee from 'coffee-script';
import * as babel from "babel";

/**
 * This function reads a js file and transforms it into AST
 *
 * @author Mohamad Mohebifar
 * @param file
 * @param options
 * @returns {Object}
 */
export function readFile(file, options) {

  if (typeof options.coffee === 'undefined') {
    options.coffee = /\.coffee$/.test(file);
  }

  if (options.sync) {
    let js = fs.readFileSync(file, "utf8");
    return this.read(js, options);
  } else {
    fs.readFile(file, (js) => {
      if (options.callback) {
        options.callback(this.read(js, options));
      }
    });
  }

}

/**
 * This function reads a js string and transforms it into AST
 *
 * @author Mohamad Mohebifar
 * @param js
 * @param options
 * @returns {Object}
 */
export function read(js, options) {
  let comments = [];
  let tokens = [];

  options.ranges = true;
  options.onComment = comments;
  options.onToken = tokens;
  options.sourceType = 'module';

  //let ast = acorn.parse(js, options);
  //escodegen.attachComments(ast, comments, tokens);

  var parseOpts = {
    allowImportExportEverywhere: true,
    allowReturnOutsideFunction:  true,
    allowHashBang:               true,
    ecmaVersion:                 6,
    looseModules:                true,
    sourceType:                  'module',
    locations:                   true,
    plugins : {
      jsx : true,
      flow : true
    }
  };

  let ast = babel.parse(js, parseOpts);

  return ast;
}

export default {
  read: read,
  readFile: readFile
};
