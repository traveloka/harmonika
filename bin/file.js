var Transformer = require('./../lib/transformer');
var path = require("path");
var colors = require('colors');
var mkdirp = require('mkdirp');

module.exports = function (options) {
  var transOptions = {

  };


  if(!options.noClass) {
    transOptions.transformers.classes = false;
  }

  var transformer = new Transformer(transOptions);
  var sourceDir = transformer.getOptions().sourceDir, testDir = transformer.getOptions().testDir;

  for(var i=0; i<options.files.length; i++){
    var file = options.files[i];

    console.log(('Parsing "' + file + '"...'));
    transformer.readFile(file);
    transformer.applyTransformations();

    var outputFileName = transformer.fileName;
    var outputFile = '';
    if(!outputFileName){
      outputFileName = path.basename(file);
    }

    var sourceFileName = path.join(sourceDir, outputFileName);
    var dirname = path.dirname(sourceFileName);
    var completeDirName = path.join(options.outFolder, dirname);
    mkdirp.sync(completeDirName);


    outputFile = path.join(options.outFolder, sourceFileName);
    transformer.writeFile(outputFile);
    console.log(('done').green);

    if(transOptions.transformers && transOptions.transformers.generateTest) {
      var testFileName = path.join(testDir, outputFileName);
      var testDirname = path.dirname(testFileName);
      var completeTestDirName = path.join(options.outFolder, testDirname);
      mkdirp.sync(completeTestDirName);

      var outputTestFile = path.join(options.outFolder, testFileName);
      transformer.writeTestFile(outputTestFile);
    }


  }

};
