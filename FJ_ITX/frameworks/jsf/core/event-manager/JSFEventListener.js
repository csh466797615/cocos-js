/**
 * JSFEventListener.js
 * @authors Casper 
 * @date    2015/09/15
 * @version 1.0.0
 */
/**
 * <p>
 *     The base class of event listener.                                                                        <br/>
 *     If you need custom listener which with different callback, you need to inherit this class.               <br/>
 *     For instance, you could refer to, EventListenerKeyboard, EventListenerCustom.
 * </p>
 * @class
 * @extends jsf.Class
 */
jsf.EventListener = jsf.Class.extend( /** @lends jsf.EventListener# */ {
  _onEvent: null, // Event callback function
  _type: 0, // Event listener type
  _listenerID: null, // Event listener ID
  _priority: 0, // The higher the number, the higher the priority, 0 is for base priority
  _registered: false, // Whether the listener has been added to dispatcher.
  _enabled: true, // Whether the listener is enabled
  _internalElement: null, // The internal element

  /**
   * Initializes event with type and callback function
   * @param {number} type
   * @param {string} listenerID
   * @param {function} callback
   */
  ctor: function(type, listenerID, callback) {
    this._type = type || 0;
    this._listenerID = listenerID || '';
    this._onEvent = callback;
  },

  /**
   * Enables or disables the listener
   * @note Only listeners with `enabled` state will be able to receive events.
   *       When an listener was initialized, it's enabled by default.
   *       An event listener can receive events when it is enabled and is not paused.
   *       paused state is always false when it is a fixed priority listener.
   * @param {boolean} enabled
   */
  setEnabled: function(enabled) {
    this._enabled = enabled;
  },

  /**
   * Checks whether the listener is enabled
   * @returns {boolean}
   */
  isEnabled: function() {
    return this._enabled;
  },

  /**
   * Sets the priority for this listener
   * @param {Number} priority
   * @private
   */
  _setFixedPriority: function(priority) {
    this._priority = priority;
  },

  /**
   * Gets the priority of this listener
   * @returns {Number} non-null for the listener
   * @private
   */
  _getFixedPriority: function() {
    return this._priority;
  },

  /**
   * Marks the listener was registered by EventDispatcher
   * @param {boolean} registered
   * @private
   */
  _setRegistered: function(registered) {
    this._registered = registered;
  },

  /**
   * Checks whether the listener was registered by EventDispatcher
   * @returns {boolean}
   * @private
   */
  _isRegistered: function() {
    return this._registered;
  },

  /**
   * Set the internal element for listener
   * @param {jsf.Class} internalElement
   */
  _setInternalElement: function(internalElement) {
    this._internalElement = internalElement;
  },

  /**
   * Get the of internal element listener
   * @returns {jsf.Class}
   */
  _getInternalElement: function() {
    return this._internalElement;
  },

  /**
   * Checks whether the listener is available.
   * @returns {boolean}
   */
  checkAvailable: function() {
    return this._onEvent !== null;
  },

  /**
   *  Gets the listener ID of this listener
   *  When event is being dispatched, listener ID is used as key for searching listeners according to event type.
   * @returns {string}
   * @private
   */
  _getListenerID: function() {
    return this._listenerID;
  },

  /**
   * Release
   */
  _release: function() {}
});

// event listener type
/**
 * The type code of unknown event listener.
 * @constant
 * @type {number}
 */
jsf.EventListener.UNKNOWN = 0;
/**
 * The type code of keyboard event listener.
 * @constant
 * @type {number}
 */
jsf.EventListener.KEYBOARD = 1;
/**
 * The type code of custom event listener.
 * @constant
 * @type {number}
 */
jsf.EventListener.CUSTOM = 2;

jsf.EventListenerKeyboard = jsf.EventListener.extend({
  onKeyDown: null,
  onKeyUp: null,

  ctor: function() {
    var selfPointer = this;
    var listener = function(event) {
      if (event._isPressed) {
        if (selfPointer.onKeyDown)
          selfPointer.onKeyDown(event._keyCode, event);
      } else {
        if (selfPointer.onKeyUp)
          selfPointer.onKeyUp(event._keyCode, event);
      }
    };
    jsf.EventListener.prototype.ctor.call(this, jsf.EventListener.KEYBOARD, jsf.EventListenerKeyboard.LISTENER_ID, listener);
  },

  checkAvailable: function() {
    if (this.onKeyDown === null && this.onKeyUp === null) {
      jsf.log(jsf._LogInfos._EventListenerKeyboard_checkAvailable);
      return false;
    }
    return true;
  }
});

jsf.EventListenerKeyboard.LISTENER_ID = '__jsf_keyboard';

jsf.EventListenerCustom = jsf.EventListener.extend({
  _onCustomEvent: null,
  ctor: function(listenerId, callback) {
    this._onCustomEvent = callback;
    var selfPointer = this;
    var listener = function(event) {
      if (selfPointer._onCustomEvent !== null)
        selfPointer._onCustomEvent(event);
    };
    jsf.EventListener.prototype.ctor.call(this, jsf.EventListener.CUSTOM, listenerId, listener);
  },

  checkAvailable: function() {
    return (jsf.EventListener.prototype.checkAvailable.call(this) && this._onCustomEvent !== null);
  }
});

/**
 * Create a EventListener object by json object
 * @function
 * @static
 * @param {object} argObj a json object
 * @returns {jsf.EventListener}
 * todo: It should be the direct use new
 * @example
 * jsf.EventListener.create({
 *   event: jsf.EventListener.KEYBOARD,
 *   onKeyDown: function (event) {
 *     //do something
 *   }
 * });
 */
jsf.EventListener.create = function(argObj) {

  jsf.assert(argObj && argObj.event, jsf._LogInfos.EventListener_create);

  var listenerType = argObj.event;
  delete argObj.event;

  var listener = null;
  if (listenerType === jsf.EventListener.CUSTOM) {
    listener = new jsf.EventListenerCustom(argObj.eventName, argObj.callback);
    delete argObj.eventName;
    delete argObj.callback;
  } else if (listenerType === jsf.EventListener.KEYBOARD) {
    listener = new jsf.EventListenerKeyboard();
  } else if (listenerType in this.__inject) {
    return this.__inject[listenerType].construction(argObj);
  } else {
    return listener;
  }

  for (var key in argObj) {
    listener[key] = argObj[key];
  }

  return listener;
};

jsf.EventListener.__inject = {};
jsf.EventListener.inject = function(listenerType, construction, listenerID, filterFunc) {
  this.__inject[listenerType] = {
    construction: construction,
    listenerID: listenerID,
    filterFunc: filterFunc
  };
};