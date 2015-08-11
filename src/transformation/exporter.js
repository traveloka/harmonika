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
      ast.body[i] = findClassAndGlobalVariable(ast.body[i]);
    }

    for(let i=0; i<ast.body.length; i++){
      let replaced = replaceClassAndGlobalVariable(ast.body[i]);
      if(replaced){
        ast.body[i] = replaced;
      }
    }

    if(lastExportItem){
      let exportDeclaration = new ExportDeclaration();
      exportDeclaration.default = true;
      exportDeclaration.declaration = lastExportItem;
      ast.body.push(exportDeclaration);
    }

    if(callback){
      callback();
    }
  }

var definedExportName = null, defaultExported = false, nodeTypeCounter = {}, definedExportNameMatch = null, lastExportItem = null;

function reset(){
  definedExportName = null;
  defaultExported = false;
  nodeTypeCounter = {};
  definedExportNameMatch = null;
  lastExportItem = null;
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
            lastExportItem = node.declarations[i].id;
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
          lastExportItem = node.declarations[0].id;
          return false;
        }
      }

    }

    exportDeclaration.declaration = node;
    exportDeclaration.leadingComments = node.leadingComments;
    return exportDeclaration;
  }

  return false;

}