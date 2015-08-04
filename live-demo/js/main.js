/**
 * Created by traveloka on 03/08/15.
 */
var Transformer = require('../../lib/transformer');

var editor = ace.edit("es5");
editor.getSession().setMode("ace/mode/javascript");
editor.setTheme("ace/theme/monokai");

var transpileTimeout = setTimeout(transpile, 1000);

editor.getSession().on('change', function(){
  window.clearTimeout(transpileTimeout);
  transpileTimeout = setTimeout(transpile, 1000);
});

function transpile(){
  var es6Wrap = $('#es6');

  var transformer = new Transformer();
  transformer.read(editor.getSession().getValue());
  transformer.applyTransformations();
  var result = '<code>'+transformer.out()+'</code>';
  es6Wrap.html(result);
  es6Wrap.find('code').each(function(i, block) {
    hljs.highlightBlock(block);
  });
}