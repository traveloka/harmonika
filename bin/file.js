var Transformer = require('./../lib/transformer');
var path = require("path");
var colors = require('colors');
var mkdirp = require('mkdirp');

module.exports = function (options) {
  var transOptions = {
    transformers: {}
  };

  if(!options.noClass) {
    transOptions.transformers.classes = false;
  }

  var transformer = new Transformer(transOptions);

  for(var i=0; i<options.files.length; i++){
    var file = options.files[i];


    transformer.readFile(file);
    transformer.applyTransformations();

    var outputFileName = transformer.fileName;
    var outputFile = '';
    if(!outputFileName){
      outputFile = path.join(options.outFolder, path.basename(file));
    }else{
      var dirname = path.dirname(outputFileName);
      var completeDirName = path.join(options.outFolder, dirname);
      mkdirp.sync(completeDirName);
      outputFile = path.join(options.outFolder, outputFileName);
    }

    transformer.writeFile(outputFile);

    console.log(('The file "' + outputFile + '" has been written.').green);
  }

};
