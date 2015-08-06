/**
 * Created by traveloka on 06/08/15.
 */
var analyzeAjaxResponseState = function(jqXHR, textStatus) {
  var responseState = tv.jq.ajaxResponseState;
  var textStatusEnum = tv.jq.textStatus;
  if (jqXHR.status == 200) {
    return responseState.SUCCESS;
  }

  // TODO: Better detection of online/offline.
  if (textStatus == textStatusEnum.TIMEOUT) {
    return responseState.OFFLINE;
  }

  return responseState.ERROR;
};