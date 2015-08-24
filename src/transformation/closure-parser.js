/**
 * Created by semmatabei on 7/30/15.
 */
/**
 * Capabilities :
 * 1. Detect goog.provide to determine filename and main object/class name
 * 2. Detect goog.require & inherits :
 * 2.a on goog.require : generate relative path and convert to es6 module import style
 * 2.b on goog.inherits : remove the expression since it's not much use
 * 3. providedAvailability : Check whether the provided name had been declared
 * 3.a If it's never declared : add new variable declaration after import statement
 */
import estraverse from './../utils/estraverse.js';
import ImportDefaultSpecifier from './../syntax/import-default-specifier.js';
import ExportDeclaration from './../syntax/export-declaration.js';
import ImportSpecifier from './../syntax/import-specifier.js';
import ImportDeclaration from './../syntax/import-declaration.js';
import Identifier from './../syntax/identifier.js';
import VariableDeclaration from './../syntax/variable-declaration.js';
import VariableDeclarator from './../syntax/variable-declarator.js';
import ObjectExpression from './../syntax/object-expression.js';
import LogicalExpression from './../syntax/logical-expression.js';
import BinaryExpression from './../syntax/binary-expression.js';
import UnaryExpression from './../syntax/unary-expression.js';
import Literal from './../syntax/literal.js';
import path from 'path';
import AnnotationTokenizer from './../utils/closure-annotation-tokenizer.js';
import * as babel from 'babel';

export default
function (ast, param, callback) {

  reset();

  estraverse.replace(ast, {
    enter: googProvideDetector
  });

  estraverse.replace(ast, {
    enter: googDetector
  });

  estraverse.traverse(ast, {
    enter: providedAvailability
  });

  estraverse.replace(ast, {
    enter: traverseAnnotation
  });



  if(!providedNameDefined && providedName){
    let className = new Identifier(providedName);

    let variableDeclarator = new VariableDeclarator();
    variableDeclarator.id = className;
    variableDeclarator.init = new ObjectExpression();

    let variableDeclaration = new VariableDeclaration();
    variableDeclaration.addDeclaration(variableDeclarator);

    for (let i=0; i<ast.body.length; i++){
      if(ast.body[i].type !== 'ImportDeclaration') {
        ast.body.splice(i, 0, variableDeclaration);
        break;
      }
    }

  }

  importType(ast);

  if(callback){
    callback(fileName);
  }
}

var fileName = null, providedName = null, providedNameDefined = false, annotationTokenizer = null;

function reset(){
  fileName = null;
  providedName = null;
  providedNameDefined = false;
  annotationTokenizer = new AnnotationTokenizer();
}

function importType(ast){
  // Import types
  let importedTypes = annotationTokenizer.importedTypes;
  let listImport = {};
  for (var type in importedTypes) {
    if (importedTypes.hasOwnProperty(type)) {
      // import type {Crayon, Marker} from 'WritingUtensils';
      let requirePath = namespaceToRelativePath(type);
      if(!listImport[requirePath.path]){
        listImport[requirePath.path] = [];
      }
      listImport[requirePath.path].push(requirePath.filename);
    }
  }

  for (var requirePath in listImport) {
    if (listImport.hasOwnProperty(requirePath)) {
      let types = listImport[requirePath];
      let specifiers = [];
      for(let i=0; i<types.length; i++){
        let specifier = new ImportSpecifier();
        specifier.setIdentifierName(types[i]);
        specifiers.push(specifier);
      }

      let importDeclaration = new ImportDeclaration();
      importDeclaration.specifiers = specifiers;
      importDeclaration.setLiteral(requirePath + '.js');
      importDeclaration.importKind = 'type';

      ast.body.unshift(importDeclaration);
    }
  }
}

function googProvideDetector(node){

  if(node.type === 'ExpressionStatement' && node.expression.type === 'CallExpression' && node.expression.callee.type === 'MemberExpression'){

    let callExpressionNode = node.expression;
    let calleeNode = callExpressionNode.callee;
    if(calleeNode.object.type === 'Identifier' && calleeNode.object.name === 'goog' && calleeNode.property.type === 'Identifier' && calleeNode.property.name === 'provide'){

      let argument = callExpressionNode.arguments[0].value;
      let argumentParts = argument.split('.');
      fileName = argumentParts.reduce( (part1, part2) => path.join(part1, part2) ) + '.js';
      providedName = argumentParts[argumentParts.length-1];

      this.remove();
    }

  }

}
// This is separated from googProvideDetector to ensure provide will always detected first because following functionality depends on provided name
function googDetector(node) {

  if(
    (node.type === 'ExpressionStatement' && node.expression.type === 'CallExpression' && node.expression.callee.type === 'MemberExpression') ||
    (node.type === 'CallExpression' && node.callee.type === 'MemberExpression')
  ){

    let callExpressionNode = node.expression || node;
    let calleeNode = callExpressionNode.callee;

    if(calleeNode.object.type === 'Identifier' && calleeNode.object.name === 'goog' && calleeNode.property.type === 'Identifier'){

      switch(calleeNode.property.name){
        case 'require' :
          let newNode = googRequireHandler(callExpressionNode);
          if(newNode) {
            return newNode;
          }
          break;
        case 'inherits' :
          googInheritsHandler(this, callExpressionNode);
          break;
        case 'isDefAndNotNull' :
          return isDefAndNotNullHandler(callExpressionNode);
      }

    }

  }

}

function isDefAndNotNullHandler(node){

  let identifier = node.arguments[0];

  let notNullCondition = new BinaryExpression(
    identifier,
    new Literal('null'),
    BinaryExpression.OP_NOT_EQUAL
  );

  let notDefinedCondition = new BinaryExpression(
    new UnaryExpression(true, UnaryExpression.TYPEOF, identifier),
    new Literal('undefined'),
    BinaryExpression.OP_NOT_EQUAL
  );

  return new LogicalExpression(notNullCondition, notDefinedCondition, LogicalExpression.OP_AND);
}

function googRequireHandler(callExpressionNode){

  let calleeNode = callExpressionNode.callee;
  if(calleeNode.property && calleeNode.property.type === 'Identifier'){

    // Get the relative path ../../
    let requirePath = namespaceToRelativePath(callExpressionNode.arguments[0].value);
    let relativePath = requirePath.path;
    let requireFileName = requirePath.filename;

    // Start creating new object to format -> import `requireFileName` from `relativePath`
    let specifier = new ImportDefaultSpecifier();
    specifier.setIdentifierName(requireFileName);

    let importDeclaration = new ImportDeclaration();
    importDeclaration.addSpecifier(specifier);
    importDeclaration.setLiteral(path.join(relativePath, requireFileName) + '.js');

    return importDeclaration;

  }

  return false;
}

function namespaceToRelativePath(namespace){
  let requireFile = (namespace).replace(/\./g, path.sep);
  let requirePath = path.dirname(requireFile);
  let requireFileName = path.basename(requireFile);

  let myPath = null;
  if(fileName){
    myPath = path.dirname(fileName);
  }else{
    myPath = requirePath;
  }


  // Get the relative path ../../
  let relativePath = path.relative(myPath, requirePath);

  return {filename: requireFileName, path: relativePath};
}

function googInheritsHandler(est){

  est.remove();

}


function providedAvailability(node) {

  if(node.type === 'ExpressionStatement' && node.expression.type === 'AssignmentExpression') {
    let expr = node.expression.left;
    if((expr.property && expr.property.name === providedName) || (expr.name && expr.name === providedName)) {
      providedNameDefined = true;
      this.break();
    }
  }else if(node.type === 'VariableDeclaration'){
    for(let declaration of node.declarations) {
      if(declaration.id.name === providedName) {
        providedNameDefined = true;
        this.break();
      }
    }
  }

}


function traverseAnnotation(node){
  if(node.leadingComments){
    let comments = node.leadingComments;
    let listAnnotation = null;
    for(let i=0; i<comments.length; i++){
      listAnnotation = annotationTokenizer.tokenize(comments[i].value, listAnnotation);
    }

    // There are annotations
    let classifiedAnnotation = listAnnotation.classifiedAnnotation;
    if(listAnnotation.token.length > 0){

      // Loop through all annotation
      let resultNode = null;
      for (let annotation in classifiedAnnotation) {
        if (classifiedAnnotation.hasOwnProperty(annotation)) {

          if(annotation === annotationTokenizer.ANNOTATION.TYPE){
            let maybeNode = getAnnotationForType(node, annotation, classifiedAnnotation[annotation].param1);
            if(maybeNode) {
              node = maybeNode;
              resultNode = node;
            }
          }

          if(annotation === annotationTokenizer.ANNOTATION.PARAM){
            let maybeNode = getAnnotationForParam(node, annotation, classifiedAnnotation[annotation]);
            if(maybeNode) {
              node = maybeNode;
              resultNode = node;
            }
          }

          if(annotation === annotationTokenizer.ANNOTATION.RETURN){
            let maybeNode = getAnnotationForReturn(node, annotation, classifiedAnnotation[annotation].param1);
            if(maybeNode) {
              node = maybeNode;
              resultNode = node;
            }
          }

          if(annotation === annotationTokenizer.ANNOTATION.TYPEDEF){
            let maybeNode = getAnnotationForTypeDef(node, annotation, classifiedAnnotation[annotation].param1);
            if(maybeNode) {
              node = maybeNode;
              resultNode = node;
            }
          }

        }
      }
      if(resultNode){
        return resultNode;
      }

    }

  }
}



function getAnnotationForType(node, annotation, param1){
  if(node.type === 'ExpressionStatement' && node.expression.type === 'AssignmentExpression'){
    let nodeExpression = node.expression;
    if(nodeExpression.left.type === 'Identifier'){
      node.expression.left.typeAnnotation = getTypeAst(annotation, param1);
      return node;
    }else if(nodeExpression.left.type === 'MemberExpression'){
      node.expression.left.property.typeAnnotation = getTypeAst(annotation, param1);
      return node;
    }
  }else if(node.type === 'VariableDeclaration'){
    if(node.declarations[0].id){
      node.declarations[0].id.typeAnnotation = getTypeAst(annotation, param1);
      return node;
    }else if(node.declarations[0].local){
      node.declarations[0].local.typeAnnotation = getTypeAst(annotation, param1);
      return node;
    }

  }

  return false;
}

function getAnnotationForReturn(node, annotation, param1){
  if(node.type === 'MethodDefinition'){
    node.returnType = getTypeAst(annotation, param1);
    return node;
  }else if(node.type === 'FunctionDeclaration'){
    node.returnType = getTypeAst(annotation, param1);
    return node;
  }else if(node.type === 'ExpressionStatement' && node.expression.type === 'AssignmentExpression' && node.expression.right.type === 'FunctionExpression'){
    node.expression.right.returnType = getTypeAst(annotation, param1);
    return node;
  }else if(node.type === 'VariableDeclaration' && node.declarations[0] && node.declarations[0].type === 'VariableDeclarator' && node.declarations[0].init.type === 'FunctionExpression'){
    node.declarations[0].init.returnType = getTypeAst(annotation, param1);
    return node;
  }
}

function getAnnotationForParam(node, annotation, paramTypes){
  if(node.type === 'MethodDefinition' && node.value.params.length > 0){
    node.value.params = getParamAst(node.value.params, annotation, paramTypes);
    return node;
  }else if(node.type === 'FunctionDeclaration' && node.params.length > 0){
    node.params = getParamAst(node.params, annotation, paramTypes);
    return node;
  }else if(node.type === 'ExpressionStatement' && node.expression.type === 'AssignmentExpression' && node.expression.right.type === 'FunctionExpression' && node.expression.right.params.length > 0){
    node.expression.right.params = getParamAst(node.expression.right.params, annotation, paramTypes);
    return node;
  }else if(node.type === 'VariableDeclaration' && node.declarations[0] && node.declarations[0].type === 'VariableDeclarator' && node.declarations[0].init.type === 'FunctionExpression' && node.declarations[0].init.params.length > 0){
    node.declarations[0].init.params = getParamAst(node.declarations[0].init.params, annotation, paramTypes);
    return node;
  }

  return false;
}

function getParamAst(params, annotation, paramTypes){
  for(let i=0; i<params.length; i++){
    let id = params[i].name;
    let type = paramTypes[id];
    if(type){
      params[i].typeAnnotation = getTypeAst(annotation, type);
    }
  }
  return params;
}

function getAnnotationForTypeDef(node, annotation, param1){
  let typeAlias = null;
  if(node.type === 'ExpressionStatement'){
    let expr = node.expression;
    if(expr.type === 'MemberExpression'){
      typeAlias = getTypeAst(annotation, param1, expr.property.name);
    }else if(expr.type === 'Identifier'){
      typeAlias = getTypeAst(annotation, param1, expr.name);
    }
  }

  if(typeAlias){
    let exportDeclaration = new ExportDeclaration();
    exportDeclaration.declaration = typeAlias;
    exportDeclaration.leadingComments = node.leadingComments;

    return exportDeclaration;
  }

  return false;
}

function getTypeAst(annotation, type, identifier /* optional */){

  let ast = null, dummyStr, dummyAst;

  switch(annotation){

    case annotationTokenizer.ANNOTATION.TYPE :
      dummyStr = 'var a : ' + type + ' = "";';
      dummyAst = babel.parse(dummyStr, {plugins : {flow : true}});
      ast = dummyAst.body[0].declarations[0].id.typeAnnotation;
      break;
    case annotationTokenizer.ANNOTATION.PARAM :
      dummyStr = 'function a (a : ' + type + '){}';
      dummyAst = babel.parse(dummyStr, {plugins : {flow : true}});
      ast = dummyAst.body[0].params[0].typeAnnotation;
      break;
    case annotationTokenizer.ANNOTATION.RETURN :
      dummyStr = 'function a (a) : ' + type + '{}';
      dummyAst = babel.parse(dummyStr, {plugins : {flow : true}});
      ast = dummyAst.body[0].returnType;
      break;
    case annotationTokenizer.ANNOTATION.TYPEDEF :
      dummyStr = 'type ' + identifier + ' = ' + type.replace(/,/g,';');
      dummyAst = babel.parse(dummyStr, {plugins : {flow : true}});
      ast = dummyAst.body[0];
      break;
  }

  return ast;

}