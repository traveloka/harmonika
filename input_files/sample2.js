class ArrowExpression extends BaseSyntax {
  constructor() {
    super('ArrowFunctionExpression');
  }
}

goog.provide('tv.service.flight.FlightBookingService');

goog.require('tv.service.TvServiceBase');

/**
 *
 * @param {tv.core.comm.context.TvContextProvider} contextProvider
 * @param {tv.core.comm.context.TvUserContext} userContext
 * @param {Object} options
 * @extends {tv.service.TvServiceBase}
 * @constructor
 */
tv.service.flight.FlightBookingService = function(contextProvider, userContext, options) {
  tv.service.TvServiceBase.call(this, contextProvider, userContext);

  /**
   *
   * @type {tv.Url}
   * @private
   */
  this._apiUrl = options.apiUrl;

  /**
   *
   * @type {string}
   * @private
   */
  this._agentId = options.agentId;

  /**
   *
   * @type {string}
   * @private
   */
  this._token = options.bookingToken;

  /**
   *
   * @enum {string}
   */
  this.API = {
    USER_VALIDATION: 'contact',
    PAX_VALIDATION: 'isPaxValid',
    SOCIOMANTIC: 'monitor/sociomantic',
    BOOKING: 'booking'
  };
};

goog.inherits(tv.service.flight.FlightBookingService, tv.service.TvServiceBase);

/**
 *
 * @param {string} url
 * @returns {string}
 * @private
 */
tv.service.flight.FlightBookingService.prototype._getAPIUrl = function(url) {
  var apiUrl = '/partner/' + this._agentId + '/' + url;
  var queryString = {
    token: this._token
  };

  return this._apiUrl.pathAuto(apiUrl, queryString);
};

/**
 * This is returns because we use promise
 *
 * @param data
 * @returns {jQuery.jqXHR}
 */
tv.service.flight.FlightBookingService.prototype.validateUser = function(data) {
  return $.ajax({
    url : this._getAPIUrl(this.API.USER_VALIDATION),
    data : JSON.stringify(data),
    timeout: 120000
  });
};

/**
 *
 * @param data
 * @param successCallback
 * @param errorCallback
 */
tv.service.flight.FlightBookingService.prototype.getSociomanticData = function(data, successCallback, errorCallback) {
  $.ajax({
    url: this._getAPIUrl(this.API.SOCIOMANTIC),
    data: JSON.stringify(data),
    success: successCallback,
    timeout: 120000,
    error: errorCallback
  });
};

/**
 *
 * @param data
 * @param beforeSendCallback
 * @returns {jQuery.jqXHR}
 */
tv.service.flight.FlightBookingService.prototype.bookFlight = function(data, beforeSendCallback) {
  return $.ajax({
    url: this._getAPIUrl(this.API.BOOKING),
    data: JSON.stringify(data),
    beforeSend: beforeSendCallback,
    timeout: 300000
  });
};

/**
 *
 * @param data
 */
tv.service.flight.FlightBookingService.prototype.validatePax = function(data) {
  var dataString = JSON.stringify(data);

  return $.ajax({
    url: this._getAPIUrl(this.API.PAX_VALIDATION),
    data: dataString
  });
};
