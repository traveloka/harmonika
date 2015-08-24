/**
 * Created by traveloka on 11/08/15.
 */
import ExportDeclaration from './../syntax/export-declaration.js';
import Identifier from './../syntax/identifier.js';
import GenericTypeAnnotation from './../syntax/generic-type-annotation.js';
import TypeAlias from './../syntax/type-alias.js';

export default
  function (ast, param, callback) {

    reset();

    if(typeof param === 'object' && param.filename) {
      definedExportName = ((param.filename).split('.'))[0];
    }

    for(let i=0; i<ast.body.length; i++){
      ast.body[i] = findClassAndGlobalVariable(ast.body[i]);
    }

    for(let i=0; i<ast.body.length; i++){
      let replaced = replaceClassAndGlobalVariable(ast.body[i]);
      if(replaced){
        ast.body[i] = replaced;
      }
    }

    if(itemToDefaultExport){


      let exportDeclaration = new ExportDeclaration();
      let identifierToExp = new Identifier(itemToDefaultExport);
      exportDeclaration.default = true;
      exportDeclaration.declaration = identifierToExp;
      ast.body.push(exportDeclaration);
    }

    if(itemToExportAsAlias.length > 0){
      for(let i=0; i<itemToExportAsAlias.length; i++){
        let exportDeclaration = new ExportDeclaration();
        exportDeclaration.declaration = itemToExportAsAlias[i];
        ast.body.push(exportDeclaration);
      }
    }

    if(callback){
      callback();
    }
  }

var definedExportName = null, defaultExported = false, nodeTypeCounter = {}, definedExportNameMatch = null, itemToDefaultExport = null, itemToExportAsAlias = [];

function reset(){
  definedExportName = null;
  defaultExported = false;
  nodeTypeCounter = {};
  definedExportNameMatch = null;
  itemToDefaultExport = null;
  itemToExportAsAlias = [];
}

function checkMatchFileName(name){
  if(name === definedExportName){
    definedExportNameMatch = definedExportName;
    return true;
  }
  return false;
}

function findClassAndGlobalVariable(node){
  let match = false;

  if(node.type === 'VariableDeclaration') {

    for(let i=0; i<node.declarations.length; i++){

      node.declarations[i].matchExportName = checkMatchFileName(node.declarations[i].id.name);
      if(!match){
        match = node.declarations[i].matchExportName;
      }
    }

  }else if(node.type === 'ClassDeclaration') {
    match = checkMatchFileName(node.id.name);
  }else if(node.type === 'FunctionDeclaration') {
    match = checkMatchFileName(node.id.name);
  }

  node.matchExportName = match;

  if(!nodeTypeCounter[node.type]) {
    nodeTypeCounter[node.type] = 0;
  }
  nodeTypeCounter[node.type]++;

  return node;
}

function replaceClassAndGlobalVariable(node){

  if(
    ((node.type === 'VariableDeclaration' || node.type === 'FunctionDeclaration') && (nodeTypeCounter.ClassDeclaration <= 0 || nodeTypeCounter.ClassDeclaration === undefined)) ||
    (node.type === 'ClassDeclaration' && nodeTypeCounter.ClassDeclaration > 0) ||
    node.matchExportName
  ){

    let exportDeclaration = new ExportDeclaration();

    if(!defaultExported && definedExportNameMatch && node.matchExportName){ // If matchExportName true, then whatever it's, it should be default

      defaultExported = true;
      exportDeclaration.default = true;

      if(node.type === 'VariableDeclaration'){
        for(let i=0; i<node.declarations.length; i++){
          if(node.declarations[i].matchExportName){
            itemToDefaultExport = node.declarations[i].id.name;
            return false;
          }
        }
      }

    }else if(!defaultExported && !definedExportNameMatch){

      if(
        (node.type === 'VariableDeclaration' && (nodeTypeCounter.ClassDeclaration <= 0 || nodeTypeCounter.ClassDeclaration === undefined)) || // Default export first var/let/const if no class found
        (node.type === 'ClassDeclaration') // Default export first class
      ){

        exportDeclaration.default = true;
        defaultExported = true;

        if(node.type === 'VariableDeclaration'){
          itemToDefaultExport = node.declarations[0].id.name;
          return false;
        }else if(node.type === 'ClassDeclaration'){
          let annotation = new GenericTypeAnnotation(node.id.name);
          let typeAlias = new TypeAlias(node.id.name, annotation);
          itemToExportAsAlias.push(typeAlias);
        }

      }

    }

    let leadingComments = node.leadingComments;
    node.leadingComments = null;
    exportDeclaration.declaration = node;
    exportDeclaration.leadingComments = leadingComments;
    return exportDeclaration;
  }

  return false;

}