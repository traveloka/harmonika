goog.provide('tv.core.comm.context.TvUserContext');

goog.require('tv.appContext');
goog.require('tv.cookie');
goog.require('tv.jq');
goog.require('tv.vars');

/**
 * @param {tv.appContext} appContext
 * @param {tv.Url} apiUrl
 * @param {tv.core.comm.context.TvContextProvider} contextProvider
 * @param {Object} options
 * @constructor
 */
tv.core.comm.context.TvUserContext = function(appContext, apiUrl, contextProvider, options) {
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
   * @type {tv.core.comm.context.TvContextProvider}
   * @private
   */
  this._contextProvider = contextProvider;

  var defaultOpt = {
    onLoggedIn: null,
    onLoggedOut: null,
    onRaisedToMaxLevel: null,
    onChangedAccount: null,
    onChangedUser: null
  };

  /**
   * @private
   */
  this._callbacks = tv.vars.merge(defaultOpt, options);

  /**
   * @type {string}
   * @private
   */
  this._currentLoginPath = 'v1/user/whoami';

  /**
   * @type {string|null}
   * @private
   */
  this._context = null;

  /**
   * @type {tv.core.comm.context.TvUserContext.user|null}
   * @private
   */
  this._user = null;

  this._queuedFetchCallbacks = [];
  this._isFetching = false;
  this._userCookieDays = 0;
  this._minimumLoginLevel = tv.core.comm.context.TvUserContext.authorizationLevel.PARTIALLY_VERIFIED;
  this._maximumLoginLevel = tv.core.comm.context.TvUserContext.authorizationLevel.SECURELY_VERIFIED;
  this._init();
};

/**
 * @typedef {{
 *   profileId: number,
 *   firstName: string,
 *   lastName: string,
 *   loginId: string,
 *   loginMethod: tv.service.user.loginMethod,
 *   authorizationLevel: number,
 *   lastUpdated: number
 * }}
 */
tv.core.comm.context.TvUserContext.user;

/**
 * @enum {number}
 */
tv.core.comm.context.TvUserContext.authorizationLevel = {
  NOT_VERIFIED       : 100,
  IDENTIFIED         : 200,
  WEAKLY_VERIFIED    : 300,
  PARTIALLY_VERIFIED : 400,
  SECURELY_VERIFIED  : 500
};

/**
 * @enum {number}
 */
tv.core.comm.context.TvUserContext.compareAuthResultType = {
  RAISED    : 1,
  IDENTICAL : 0,
  LOWERED   : -1
};

/**
 * @private
 */
tv.core.comm.context.TvUserContext.prototype._init = function() {

};

//======================
// public method
//======================
/**
 * @param {function((tv.core.comm.context.TvUserContext.user|null))=} successCallback
 * @param {?tv.jq.ajaxOfflineCallback=} offlineCallback
 * @param {?tv.jq.ajaxErrorCallback=} errorCallback
 */
tv.core.comm.context.TvUserContext.prototype.getUser = function(
  successCallback, offlineCallback, errorCallback
) {
  var isChanged = this._fetchContextFromCookie();
  if (isChanged) {
    if (goog.isDefAndNotNull(this._context)) {
      this._queuedFetchCallbacks.push({
        successF : successCallback,
        offlineF : offlineCallback,
        errorF   : errorCallback
      });

      if (this._isFetching === false)
        this._fetchAPI(this._currentLoginPath);
    }
    else {
      // assumed that user has been logged out
      if (this._updateUser(null))
        successCallback(this._user);
    }
    return;
  }
  successCallback(this._user);
};

/**
 * @param {*} result
 * @param {function((tv.core.comm.context.TvUserContext.user|null))=} callback
 */
tv.core.comm.context.TvUserContext.prototype.parseUserContext = function(result, callback) {
  var self = this;
  /** @type {tv.core.comm.context.TvUserContext.user|null} user */
  var responseCallback = function(user) {
    var secure = self.isCurrentUserOnLoginState();
    self._contextProvider.parse(result, secure);
    self._call(callback, user);
  };

  this._persistAsCookie(result.userContext);

  this.getUser(responseCallback);
};

/**
 * @return {tv.core.comm.context.TvUserContext.user|null}
 */
tv.core.comm.context.TvUserContext.prototype.getCurrentUser = function() {
  return this._user;
};

/**
 * @return {boolean}
 */
tv.core.comm.context.TvUserContext.prototype.isCurrentUserOnLoginState = function() {
  return goog.isDefAndNotNull(this._user) && this._user.authorizationLevel >= this._minimumLoginLevel;
};

//======================
// internal method
//======================
/**
 * TODO: trigger event
 * @param {tv.core.comm.context.TvUserContext.user|null} user
 * @return {boolean}
 * @private
 */
tv.core.comm.context.TvUserContext.prototype._updateUser = function(user) {
  var isValid = true;

  if (goog.isDefAndNotNull(user)) {
    if (goog.isDefAndNotNull(this._user)) {
      if (this._user.profileId == user.profileId) {
        if (this._user.loginId == user.loginId && this._user.loginMethod == user.loginMethod) {
          // need to check user authorization level
          var compareResult = this._compareAuthorizationLevel(this._user.authorizationLevel, user.authorizationLevel);

          switch (compareResult) {
            case tv.core.comm.context.TvUserContext.compareAuthResultType.RAISED:
              if (user.authorizationLevel == this._maximumLoginLevel)
                this._call(this._callbacks.onRaisedToMaxLevel, user);
              else if (user.authorizationLevel >= this._minimumLoginLevel)
                this._call(this._callbacks.onLoggedIn, user);
              break;
            case tv.core.comm.context.TvUserContext.compareAuthResultType.LOWERED:
              if (user.authorizationLevel < this._minimumLoginLevel)
                this._call(this._callbacks.onLoggedOut, user);
              break;
//            case tv.core.comm.context.TvUserContext.compareAuthResultType.IDENTICAL:
//              break;
          }
          this._user = user;
        }
        else {
          // userLogin is different, no need to refresh or notify
          this._call(this._callbacks.onChangedAccount, user);
          this._user = user;
        }
      }
      else {
        // profile id is different, TRIGGER event user has been changed, need to refresh page
        if (this._user.authorizationLevel >= this._minimumLoginLevel) {
          this._call(this._callbacks.onChangedUser, user);
          isValid = false;
        }
        // is needed to TRIGGER onLoggedIn event ?
        this._user = user;
      }
    }
    else {
      if (user.authorizationLevel == this._maximumLoginLevel)
        this._call(this._callbacks.onRaisedToMaxLevel, user);
      else if (user.authorizationLevel >= this._minimumLoginLevel)
        this._call(this._callbacks.onLoggedIn, user);

      this._user = user;
    }
  }
  else {
    // we called as logged out
    this._call(this._callbacks.onLoggedOut, user);
    this._user = null;
  }
  return isValid;
};

/**
 * @param {number} a
 * @param {number} b
 * @return {tv.core.comm.context.TvUserContext.compareAuthResultType}
 * @private
 */
tv.core.comm.context.TvUserContext.prototype._compareAuthorizationLevel = function(a, b) {
  if (b == a)
    return tv.core.comm.context.TvUserContext.compareAuthResultType.IDENTICAL;
  if (b > a)
    return tv.core.comm.context.TvUserContext.compareAuthResultType.RAISED;
  return tv.core.comm.context.TvUserContext.compareAuthResultType.LOWERED;
};

/**
 * @param {?} responseData
 * @return {boolean}
 * @private
 */
tv.core.comm.context.TvUserContext.prototype._parse = function(responseData) {
  if ($.isPlainObject(responseData) === false)
    return true; // we just terminate process

  var result = responseData.data;
  if (result.authStatus === 'NOT_AUTHORIZED') {
    return this._updateUser(null);
  }

  this._context = responseData.userContext;
  this._persistAsCookie(this._context);

  var id, firstName, lastName, username, loginMethod, authorizationLevel = 0;

  if (goog.isDefAndNotNull(result.id))
    id = result.id;
  if (goog.isDefAndNotNull(result.firstName))
    firstName = result.firstName;
  if (goog.isDefAndNotNull(result.lastName))
    lastName = result.lastName;
  if (goog.isDefAndNotNull(result.username))
    username = result.username;
  if (goog.isDefAndNotNull(result.loginMethod))
    loginMethod = result.loginMethod;
  if (goog.isDefAndNotNull(result.authorizationLevel))
    authorizationLevel = parseInt(result.authorizationLevel, 10);

  return this._updateUser({
    profileId: id,
    firstName: firstName,
    lastName: lastName,
    loginId: username,
    loginMethod: loginMethod,
    authorizationLevel: authorizationLevel,
    lastUpdated: new Date().getTime()
  });
};

/**
 * Persists the current userContext value as cookie.
 * @param {?string} value
 * @private
 */
tv.core.comm.context.TvUserContext.prototype._persistAsCookie = function(value) {
  if (goog.isDefAndNotNull(value)) {
    tv.cookie.write(
      this._appContext.userCookieName,
      value,
      this._userCookieDays,
      this._appContext.cookieDomain
    );
  }
  else {
    tv.cookie.remove(
      this._appContext.userCookieName,
      this._appContext.cookieDomain
    );
  }
};

/**
 * Fetch user context from cookie and return if the value has been changed
 * @return {boolean}
 * @private
 */
tv.core.comm.context.TvUserContext.prototype._fetchContextFromCookie = function() {
  var contextCookie = tv.cookie.read(this._appContext.userCookieName);
  if (this._context != contextCookie) {
    this._context = contextCookie;
    return true;
  }
  return false;
};

/**
 * @param {string} relativeUrl
 * @private
 */
tv.core.comm.context.TvUserContext.prototype._fetchAPI = function(relativeUrl) {
  var self = this;
  var urlString     = this._apiUrl.pathAuto(relativeUrl);
  var wrapCallback = function(requestData) {
    var responseState = tv.jq.ajaxResponseState;

    var completeFunction = function(jqXHR, textStatus) {
      var state = tv.jq.analyzeAjaxResponseState(jqXHR, textStatus);
      var unblocked = true;
      if (state == responseState.SUCCESS) {
        var data = tv.vars.safeParseJson(jqXHR.responseText);
        unblocked = self._parse(data);
      }
      // Fetching process done. New queue or fetch process may begin.
      if (unblocked) {
        self._isFetching = false;
        self._callQueuedCallbacks(state, jqXHR, textStatus);
      }
    };

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
  var offlineCallback = function() {};
  this._contextProvider.wrap({}, wrapCallback, offlineCallback);
};

/**
 * Construct API request data, will add lifetime or session according to whether
 * or not they exist.
 *
 * @param {string} tvLifetime
 * @param {string} tvSession
 * @return {Object}
 * @private
 */
tv.core.comm.context.TvUserContext.prototype._constructApiRequestData = function(tvLifetime, tvSession) {
  var apiRequestData = {
    data: {},
    context: {
      tvLifetime: tvLifetime,
      tvSession: tvSession
    },
    clientInterface: ''
  };
  return apiRequestData;
};

/**
 * Runs all queued callbacks.
 *
 * @param {tv.jq.ajaxResponseState} state
 * @param {?jQuery.jqXHR} jqXHR
 * @param {?string} textStatus
 * @private
 */
tv.core.comm.context.TvUserContext.prototype._callQueuedCallbacks = function(state, jqXHR, textStatus) {
  var oldQueue = this._queuedFetchCallbacks, i;
  this._queuedFetchCallbacks = [];

  if (oldQueue.length <= 0)
    return;

  var responseState = tv.jq.ajaxResponseState;

  if (state == responseState.SUCCESS) {
    for (i in oldQueue) {
      if (oldQueue.hasOwnProperty(i) && goog.isDefAndNotNull(oldQueue[i].successF))
        oldQueue[i].successF(this._user);
    }
  }
  else if (state == responseState.ERROR) {
    if (goog.isDefAndNotNull(jqXHR) && goog.isDefAndNotNull(textStatus)) {
      for (i in oldQueue) {
        if (oldQueue.hasOwnProperty(i) && goog.isDefAndNotNull(oldQueue[i].errorF))
          oldQueue[i].errorF(jqXHR, textStatus);
      }
    }
  }
  else if (state == responseState.OFFLINE) {
    for (i in oldQueue) {
      if (oldQueue.hasOwnProperty(i) && goog.isDefAndNotNull(oldQueue[i].offlineF))
        oldQueue[i].offlineF();
    }
  }
};

/**
 * @param func
 * @param {...} args
 * @private
 */
tv.core.comm.context.TvUserContext.prototype._call = function(func, args) {
  var i, var_args = [];
  for (i=1; i < arguments.length; i++) {
    var_args.push(arguments[i]);
  }
  if (typeof func == 'function')
    func.apply(this, var_args);
};