/**
 * Created by traveloka on 11/08/15.
 */
import ExportDeclaration from './../syntax/export-declaration.js';

export default
  function (ast, param, callback) {

    reset();

    if(typeof param === 'object' && param.filename) {
      definedExportName = ((param.filename).split('.'))[0];
    }

    for(let i=0; i<ast.body.length; i++){
      ast.body[i].matchExportName = findClassAndGlobalVariable(ast.body[i]);
    }

    for(let i=0; i<ast.body.length; i++){
      let replaced = replaceClassAndGlobalVariable(ast.body[i]);
      if(replaced){
        ast.body[i] = replaced;
      }
    }

    if(callback){
      callback();
    }
  }

var definedExportName = null, defaultExported = false, nodeTypeCounter = {}, definedExportNameMatch = null;

function reset(){
  definedExportName = null;
  defaultExported = false;
  nodeTypeCounter = {};
  definedExportNameMatch = null;
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

    for(let vars of node.declarations){
      if(!match){
        match = checkMatchFileName(vars.id.name);
      }
    }

  }else if(node.type === 'ClassDeclaration') {
    match = checkMatchFileName(node.id.name);
  }else if(node.type === 'FunctionDeclaration') {
    match = checkMatchFileName(node.id.name);
  }

  if(!nodeTypeCounter[node.type]) {
    nodeTypeCounter[node.type] = 0;
  }
  nodeTypeCounter[node.type]++;

  return match;
}

function replaceClassAndGlobalVariable(node){

  if(
    ((node.type === 'VariableDeclaration' || node.type === 'FunctionDeclaration') && (nodeTypeCounter.ClassDeclaration <= 0 || nodeTypeCounter.ClassDeclaration === undefined)) ||
    (node.type === 'ClassDeclaration' && nodeTypeCounter.ClassDeclaration > 0) ||
    node.matchExportName
  ){

    let exportDeclaration = new ExportDeclaration();

    if(!defaultExported && definedExportNameMatch && node.matchExportName){ // If matchExportName true, then whatever it's, it should be default
      exportDeclaration.default = true;
      defaultExported = true;
    }else if(!defaultExported && !definedExportNameMatch){

      if(
        (node.type === 'VariableDeclaration' && (nodeTypeCounter.ClassDeclaration <= 0 || nodeTypeCounter.ClassDeclaration === undefined)) || // Default export first var/let/const if no class found
        (node.type === 'ClassDeclaration') // Default export first class
      ){
        exportDeclaration.default = true;
        defaultExported = true;
      }

    }

    exportDeclaration.declaration = node;
    exportDeclaration.leadingComments = node.leadingComments;
    return exportDeclaration;
  }

  return false;

}