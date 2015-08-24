var Tokenizer = require('./../lib/utils/closure-annotation-tokenizer');

var closureTokenizer = new Tokenizer();
var js = '*\n * @typedef {{\n *   profileId: ?,\n *   firstName: string,\n *   lastName: string,\n *   loginId: string,\n *   loginMethod: tv.service.user.loginMethod,\n *   authorizationLevel: number,\n *   lastUpdated: number\n * }}\n * @param {string} name \n @typedef  Array.<tv.string> @return {string}';
var token = closureTokenizer.tokenize(js);
console.log(JSON.stringify(token));