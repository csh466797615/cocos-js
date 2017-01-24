/**
 * JSFEvent
 * @authors Casper 
 * @date    2015/09/15
 * @version 1.0.0
 */
/**
 * Base class of all kinds of events.
 * @class
 * @extends jsf.Class
 */
jsf.Event = jsf.Class.extend( /** @lends jsf.Event# */ {
  _type: 0, // Event type
  _isStopped: false, // whether the event has been stopped
  _currentTarget: null,

  ctor: function(type) {
    this._type = type;
  },

  /**
   * Gets the event type
   * @function
   * @returns {Number}
   */
  getType: function() {
    return this._type;
  },

  /**
   * Stops propagation for current event
   * @function
   */
  stopPropagation: function() {
    this._isStopped = true;
  },

  /**
   * Checks whether the event has been stopped
   * @function
   * @returns {boolean}
   */
  isStopped: function() {
    return this._isStopped;
  },

  /**
   * Gets listener id
   * @returns {*}
   */
  _getListenerID: function() {
    return '';
  },

  _setCurrentTarget: function (target) {
    this._currentTarget = target;
  },

  /**
   * <p>
   *     Gets current target of the event                                                            <br/>
   *     note: It only be available when the event listener is associated with node.                <br/>
   *          It returns 0 when the listener is associated with fixed priority.
   * </p>
   * @function
   * @returns {jsf.Class}  The target with which the event associates.
   */
  getCurrentTarget: function () {
    return this._currentTarget;
  }
});

//event type
/**
 * The type code of Keyboard event.
 * @constant
 * @type {number}
 */
jsf.Event.KEYBOARD = 1;
/**
 * The type code of Custom event.
 * @constant
 * @type {number}
 */
jsf.Event.CUSTOM = 2;

/**
 * The keyboard event
 * @class
 * @extends jsf.Event
 */
jsf.EventKeyboard = jsf.Event.extend( /** @lends jsf.EventKeyboard# */ {
  _keyCode: 0,
  _isPressed: false,
  ctor: function(keyCode, isPressed) {
    jsf.Event.prototype.ctor.call(this, jsf.Event.KEYBOARD);
    this._keyCode = keyCode;
    this._isPressed = isPressed;
  },

  /**
   * Gets listener id
   * @returns {*}
   */
  _getListenerID: function() {
    return jsf.EventListenerKeyboard.LISTENER_ID;
  }
});

/**
 * The Custom event
 * @class
 * @extends jsf.Event
 */
jsf.EventCustom = jsf.Event.extend( /** @lends jsf.EventCustom# */ {
  _eventName: null,
  _userData: null, // User data

  ctor: function(eventName) {
    jsf.Event.prototype.ctor.call(this, jsf.Event.CUSTOM);
    this._eventName = eventName || '';
  },

  /**
   * Sets user data
   * @param {*} data
   */
  setUserData: function(data) {
    this._userData = data;
  },

  /**
   * Gets user data
   * @returns {*}
   */
  getUserData: function() {
    return this._userData;
  },

  /**
   * Gets event name
   * @returns {String}
   */
  getEventName: function() {
    return this._eventName;
  },

  /**
   * Gets listener id
   * @returns {*}
   */
  _getListenerID: function() {
    return this._eventName;
  }
});