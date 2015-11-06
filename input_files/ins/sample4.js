var Timer = function () {
  this._ctr = 0;
};
Timer.prototype.reset = function() {
  this._ctr = 0;
};
Timer.prototype.tick = function() {
  return ++this._ctr;
};

// Class CustomTimer extend Timer --------------------------------------
var CustomTimer = function (initial) {
  Timer.call(this);
  this._ctr = initial;
};
// Create a CustomTimer.prototype object that inherits from Timer.prototype
CustomTimer.prototype = Object.create(Timer.prototype);
// Set the "constructor" property to refer to CustomTimer
CustomTimer.prototype.constructor = CustomTimer;