goog.provide('tv.jq');

/**
 * @enum {string}
 */
tv.jq.textStatus = {
  SUCCESS: "success",
  NOT_MODIFIED: "notmodified",
  ERROR: "error",
  TIMEOUT: "timeout",
  ABORT: "abort",
  PARSE_ERROR: "parsererror"
};

/**
 * @enum {number}
 */
tv.jq.ajaxResponseState = {
  SUCCESS: 1,
  ERROR: 2,
  OFFLINE: 3
};

/**
 * @typedef {function()}
 */
tv.jq.ajaxOfflineCallback;

/**
 * @typedef {function(jQuery.jqXHR, string)}
 */
tv.jq.ajaxErrorCallback;

/**
 * Analyzes the given jquery AJAX complete callback arguments to determine
 * whether the call ends successfully, error, or offline.
 *
 * @param {jQuery.jqXHR} jqXHR
 * @param {string} textStatus
 * @return {tv.jq.ajaxResponseState}
 */
tv.jq.analyzeAjaxResponseState = function(jqXHR, textStatus) {
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