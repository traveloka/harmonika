#!/usr/bin/env node
require('babel/polyfill');
var commander = require('commander');
var fs = require("fs");
var each = require("lodash/collection/each");
var keys = require("lodash/object/keys");
var pkg = require("../package.json");
var glob = require("glob");
var path = require("path");
var colors = require('colors');

var program = new commander.Command('cltofl');

program.option("-s, --source <file/folder>", "Source to convert from ES5 to ES6 i.e. cltofl -s src");
program.option("-o, --out-folder [out]", "output folder (ouput file will be the same name)");
program.option("--no-classes", "Don't convert function/prototypes into classes");
program.description(pkg.description);
program.version(pkg.version);
program.usage("[options] <file>");
program.parse(process.argv);

var sources = program.source;
var outFolder = program.outFolder;
var noClass = program.classes;


if (!sources) {
  return program.help();
}

var folderSearch = path.join(process.cwd(), sources, "/**/*.js");
var testFileName =  path.join(process.cwd(), sources);

var files = [];
if (testFileName.match(/\.js/g)) {
  files.push(testFileName);
}else{
  console.log("File pattern to search: " + folderSearch);
  files = glob.sync(folderSearch);
}

if (!files) {
  console.log("Error globbing files.".red);
  return program.help();
}

if (!files.length) {
  console.log("No files to convert.".yellow);
  return program.help();
}



if (!outFolder || outFolder === true)
  outFolder = 'output';

var outFolderName = path.join(path.dirname(files[0]), outFolder);
if(!fs.existsSync(outFolderName)){
  fs.mkdirSync(outFolderName);
}

console.log(("File will be saved on "+outFolderName).green);

var options = {
  files : files,
  outFolder : outFolderName,
  noClass : noClass || false
};

var fn = require('./file');
fn(options);
