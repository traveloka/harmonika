goog.provide('tv.core.comm.context.ContextProvider');

goog.require('tv.jq');

/**
 * T = The context to be provided and parsed.
 *
 * @template T
 * @interface
 */
tv.core.comm.context.ContextProvider = function() {};

/**
 * Fetches context information from external sources (cookie, API).
 *
 * @param {?function(T)=} successCallback
 * @param {?tv.jq.ajaxOfflineCallback=} offlineCallback
 * @param {?tv.jq.ajaxErrorCallback=} errorCallback
 */
tv.core.comm.context.ContextProvider.prototype.get = function(
  successCallback, offlineCallback, errorCallback
) {};

/**
 * Wraps the given data into a ready to use context. The successCallback
 * will be called with the already wrapped data, ready for usage.
 *
 * @param {?} data
 * @param {?function(?)=} successCallback
 * @param {?tv.jq.ajaxOfflineCallback=} offlineCallback
 * @param {?tv.jq.ajaxErrorCallback=} errorCallback
 */
tv.core.comm.context.ContextProvider.prototype.wrap = function(
  data, successCallback, offlineCallback, errorCallback
) {};

/**
 * Gathers context information from the given result object (if any).
 *
 * @param {?} result
 * @param {boolean=} secure
 */
tv.core.comm.context.ContextProvider.prototype.parse = function(result, secure) {};