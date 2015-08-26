goog.provide('tv.core.comm.context.TvContextProvider');

goog.require('tv.Url');
goog.require('tv.appContext');
goog.require('tv.cookie');
goog.require('tv.qs');
goog.require('tv.jq');
goog.require('tv.vars');
goog.require('goog.asserts');

/**
 * @constructor
 * @implements {tv.core.comm.context.ContextProvider.<tv.core.comm.context.TvContextProvider.context>}
 * @param {tv.appContext} appContext
 * @param {tv.Url} apiUrl
 * @param {string} interfaceType
 */
tv.core.comm.context.TvContextProvider = function(appContext, apiUrl, interfaceType) {
  /**
   * @type {tv.appContext}
   * @private
   */
  this._appContext = appContext;

  /**
   * @type {tv.Url}
   * @private
   */
  this._apiUrl = apiUrl;

  /**
   * @type {string}
   * @private
   */
  this._sessionPath = '/v1/user/session';

  /**
   * @type {string}
   * @private
   */
  this._contextPath = '/v1/user/context';

  /**
   * @type {?string}
   * @private
   */
  this._tvLifetime = null;

  /**
   * @type {?string}
   * @private
   */
  this._tvSession = null;

  /**
   * @type {string}
   * @private
   */
  this._interfaceType = interfaceType;

  /**
   * @type {number}
   * @private
   */
  this._lifetimeCookieDays = 3650;

  /**
   * @type {number}
   * @private
   */
  this._currencyCookieDays = 1;

  /**
   * @type {Array.<tv.core.comm.context.TvContextProvider.queuedCallbacks>}
   * @private
   */
  this._queuedFetchCallbacks = [];

  /**
   * @type {boolean}
   * @private
   */
  this._isFetching = false;
};

/**
 * @typedef {{
 *   tvLifetime: string,
 *   tvSession: string,
 *   tvInterface: string
 * }}
 */
tv.core.comm.context.TvContextProvider.context;

/**
 * @typedef {{
 *   successF: ?function(tv.core.comm.context.TvContextProvider.context),
 *   offlineF: ?tv.jq.ajaxOfflineCallback,
 *   errorF: ?tv.jq.ajaxErrorCallback
 * }}
 */
tv.core.comm.context.TvContextProvider.queuedCallbacks;

/**
 * @param {?function(tv.core.comm.context.TvContextProvider.context)=} successCallback
 * @param {?tv.jq.ajaxOfflineCallback=} offlineCallback
 * @param {?tv.jq.ajaxErrorCallback=} errorCallback
 */
tv.core.comm.context.TvContextProvider.prototype.get = function(
  successCallback, offlineCallback, errorCallback
) {

  var result = this._fetchFromCookie();
  if (goog.isDefAndNotNull(result)) {
    if (goog.isDefAndNotNull(this._tvLifetime) && goog.isDefAndNotNull(this._tvSession)) {
      if (this._tvLifetime != result.tvLifetime) this._tvLifetime = result.tvLifetime;
      if (this._tvSession != result.tvSession) this._tvSession = result.tvSession;
      if (this._interfaceType != result.tvInterface) this._interfaceType = result.tvInterface;

      if (goog.isDefAndNotNull(successCallback)) {
        successCallback({
          tvLifetime: this._tvLifetime,
          tvSession: this._tvSession,
          tvInterface: this._interfaceType
        });
      }
      return;
    }
    if (goog.isDefAndNotNull(successCallback)) {
      successCallback(result);
    }
    return;
  }

  var shouldFetchLifetime = goog.isDefAndNotNull(this._tvLifetime) == false;
  var path = shouldFetchLifetime ? this._contextPath : this._sessionPath;

  // Add first to queue.
  this._queuedFetchCallbacks.push({
    successF: successCallback,
    offlineF: offlineCallback,
    errorF: errorCallback
  });

  // If a fetching process is going on, callbacks will be run at the end of it.
  // If not, we fetch a new one.
  if (this._isFetching == false) {
    this._isFetching = true;
    this._fetchApi(path);
  }
};

/**
 * TODO: Add interface after merging with Oryza's code.
 *
 * @param {?} data
 * @param {?function(?)=} successCallback
 * @param {?tv.jq.ajaxOfflineCallback=} offlineCallback
 * @param {?tv.jq.ajaxErrorCallback=} errorCallback
 */
tv.core.comm.context.TvContextProvider.prototype.wrap = function(
  data, successCallback, offlineCallback, errorCallback
) {
  var self = this;

  /** @param {tv.core.comm.context.TvContextProvider.context} context */
  var wrapCallback = function(context) {
    var wrappedData = {
      data: data,
      context: {
        tvLifetime: context.tvLifetime,
        tvSession: context.tvSession
      },
      clientInterface: self._interfaceType
    };

    successCallback(wrappedData);
  };
  self.get(wrapCallback, offlineCallback, errorCallback);
};

/**
 * Try to fetch tvLifetime and tvSession from the given API result.
 * Will save to cookie if new values exist.
 *
 * @param {?} result
 * @param {boolean=} secure
 */
tv.core.comm.context.TvContextProvider.prototype.parse = function(result, secure) {
  if (
    $.isPlainObject(result) == false ||
    $.isPlainObject(result.context) == false
  ) {
    return;
  }

  var isChanged = false;
  if (goog.isString(result.context.tvLifetime)) {
    this._tvLifetime = result.context.tvLifetime;
    isChanged = true;
  }
  if (goog.isString(result.context.tvSession)) {
    this._tvSession = result.context.tvSession;
    isChanged = true;
  }
  this._persistAsCookies(secure);
};

/**
 * @private
 * @return {?tv.core.comm.context.TvContextProvider.context}
 */
tv.core.comm.context.TvContextProvider.prototype._fetchFromCookie = function() {
  var tvLifetime = tv.cookie.read(this._appContext.lifetimeCookieName);
  var tvSession = tv.cookie.read(this._appContext.sessionCookieName);
  if (goog.isDefAndNotNull(tvLifetime)) {
    this._tvLifetime = tvLifetime;
  }
  if (goog.isDefAndNotNull(tvSession)) {
    this._tvSession = tvSession;
  }

  if (goog.isDefAndNotNull(tvLifetime) && goog.isDefAndNotNull(tvSession)) {
    return this._getFromCurrentState();
  }

  return null;
};

/**
 * @param {string} path
 * @private
 */
tv.core.comm.context.TvContextProvider.prototype._fetchApi = function(path) {
  var urlString = this._apiUrl.path(path, {}, '', true);
  var requestData = this._constructApiRequestData();
  var responseState = tv.jq.ajaxResponseState;

  var self = this;
  var completeFunction = function(jqXHR, textStatus) {

    var state = tv.jq.analyzeAjaxResponseState(jqXHR, textStatus);
    if (state == responseState.SUCCESS) {
      var data = tv.vars.safeParseJson(jqXHR.responseText);
      self.parse(data);
    }
    // Fetching process done. New queue or fetch process may begin.
    self._isFetching = false;
    self._callQueuedCallbacks(state, jqXHR, textStatus);
  };

  // Last check before we ask for session and lifetime. We do this because
  // there's a remote possibility that we request lifetime/session values twice.
  if (this._tvLifetime != null && this._tvSession != null) {
    this._callQueuedCallbacks(responseState.SUCCESS, null, null);
    return;
  }

  $.ajax({
    url: urlString,
    type: 'POST',
    processData: false,
    dataType: 'json',
    contentType: 'application/json',
    data: JSON.stringify(requestData),
    complete: completeFunction
  });
};

/**
 * Runs all queued callbacks.
 *
 * @param {tv.jq.ajaxResponseState} state
 * @param {?jQuery.jqXHR} jqXHR
 * @param {?string} textStatus
 * @private
 */
tv.core.comm.context.TvContextProvider.prototype._callQueuedCallbacks = function(state, jqXHR, textStatus) {
  var oldQueue = this._queuedFetchCallbacks, i;
  this._queuedFetchCallbacks = [];

  if (oldQueue.length <= 0) {
    return;
  }

  // We have contextual data. Call success callbacks.
  if (this._tvLifetime != null && this._tvSession != null) {
    var context = this._getFromCurrentState();
    for (i in oldQueue) {
      if (oldQueue.hasOwnProperty(i) && oldQueue[i].successF != null) {
        oldQueue[i].successF(context);
      }
    }
    return;
  }

  var responseState = tv.jq.ajaxResponseState;

  if (state == responseState.ERROR) {
    if (goog.isDefAndNotNull(jqXHR) && goog.isDefAndNotNull(textStatus)) {
      for (i in oldQueue) {
        if (oldQueue.hasOwnProperty(i) && oldQueue[i].errorF != null) {
          oldQueue[i].errorF(jqXHR, textStatus);
        }
      }
    }
  }

  if (state == responseState.OFFLINE) {
    for (i in oldQueue) {
      if (oldQueue.hasOwnProperty(i) && oldQueue[i].offlineF != null) {
        oldQueue[i].offlineF();
      }
    }
  }
};

/**
 * Construct API request data, will add lifetime or session according to whether
 * or not they exist.
 *
 * TODO: Add interface after merge with Oryza's code.
 *
 * @return {Object}
 * @private
 */
tv.core.comm.context.TvContextProvider.prototype._constructApiRequestData = function() {
  // IMPORTANT: Since desktop web ALWAYS have lifetime/session cookies, it is
  // assumed that the client interface for Travelokacom app is always
  // MOBILE_WEB.
  var queryStringMap = tv.qs.parseQueryString();
  var finalRequestData = {
    data: {
      client: "MOBILE_WEB",
      query: queryStringMap
    },
    metadata: {},
    context: {
      tvLifetime: this._tvLifetime
    }
  };

  if (goog.isDefAndNotNull(this._tvSession)) {
    finalRequestData.tvSession = this._tvSession;
  }

  return finalRequestData;
};

/**
 * Persists the current tvLifetime and tvSession values as cookies.
 * @param {boolean=} secure
 * @private
 */
tv.core.comm.context.TvContextProvider.prototype._persistAsCookies = function(secure) {
  var isSecure = (secure === true);

  if (goog.isDefAndNotNull(this._tvLifetime)) {
    tv.cookie.write(
      this._appContext.lifetimeCookieName,
      this._tvLifetime,
      this._lifetimeCookieDays,
      this._appContext.cookieDomain,
      isSecure
    );
  }

  if (goog.isDefAndNotNull(this._tvSession)) {
    tv.cookie.write(
      this._appContext.sessionCookieName,
      this._tvSession,
      0,
      this._appContext.cookieDomain,
      isSecure
    );
  }
};

/**
 * @return {tv.core.comm.context.TvContextProvider.context}
 * @private
 */
tv.core.comm.context.TvContextProvider.prototype._getFromCurrentState = function() {
  goog.asserts.assertString(this._tvLifetime);
  goog.asserts.assertString(this._tvSession);
  return {
    tvLifetime: this._tvLifetime,
    tvSession: this._tvSession,
    tvInterface: this._interfaceType
  };
};

/**
 * Get new active currency from cookie
 * @return {string}
 * @public
 */
tv.core.comm.context.TvContextProvider.prototype.getActiveCurrency = function() {

  /** @type {string|null} */
  var currency = tv.cookie.read(this._appContext.currencyCookieName);
  if(goog.isDefAndNotNull(currency)) {
    return currency;
  }

  return this._appContext.currency || window.tvAppContext.currency;

};

/**
 * set numofdecimal point, this because a lot of element on page actually need decimal point but they don't have access to returned price from backend
 * @public
 */
tv.core.comm.context.TvContextProvider.prototype.setNumOfDecimalPoint = function(numOfDecimalPoint) {

  this._appContext.numOfDecimalPoint = numOfDecimalPoint;

};
/**
 * @return {number}
 * @public
 */
tv.core.comm.context.TvContextProvider.prototype.getNumOfDecimalPoint = function() {

  return this._appContext.numOfDecimalPoint || 0;

};

/**
 * @return {number}
 * @public
 */
tv.core.comm.context.TvContextProvider.prototype.getNumOfDecimalPointByCode = function(currencyCode) {

  var listCode = this._appContext.tvActiveCurrencyList;
  for(var i=0; i < listCode.length; i++){
    if(currencyCode === listCode[i]['currencyId']) return listCode[i]['numOfDecimalPoint'];
  }

  return 0;
};

/**
 *
 * @returns {tv.appContext}
 * @public
 */
tv.core.comm.context.TvContextProvider.prototype.getAppContext = function() {

  return this._appContext || window.tvAppContext;

};

/**
 *
 * @returns {tv.Url}
 * @public
 */
tv.core.comm.context.TvContextProvider.prototype.getApiURL = function(){
  return this._apiUrl;
};