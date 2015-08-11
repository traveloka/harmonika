/**
 * Created by traveloka on 11/08/15.
 */
import estraverse from 'estraverse';

export default
  function (ast, callback) {

    estraverse.traverse(ast, {
      enter: findClassAndGlobalVariable
    });

    if(callback){
      callback();
    }
  }

function findClassAndGlobalVariable(node){

}