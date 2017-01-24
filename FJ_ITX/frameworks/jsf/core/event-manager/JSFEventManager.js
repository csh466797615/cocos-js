/**
 * JSFEventManager.js
 * @authors Casper 
 * @date    2015/09/15
 * @version 1.0.0
 */
/**
 * @ignore
 */
jsf._EventListenerVector = jsf.Class.extend({
  _fixedListeners: null,
  _internalListeners: null,

  ctor: function () {
      this._fixedListeners = [];
      this._internalListeners = [];
  },

  size: function () {
      return this._fixedListeners.length + this._internalListeners.length;
  },

  empty: function () {
      return (this._fixedListeners.length === 0) && (this._internalListeners.length === 0);
  },

  push: function (listener) {
    if (listener._getInternalElement() === null)
      this._fixedListeners.push(listener);
    else
      this._internalListeners.push(listener);
  },

  clearFixedPriorityListeners: function () {
    this._fixedListeners.length = 0;
  },
  
  clearInternalListeners: function () {
    this._internalListeners.length = 0;
  },

  clear: function () {
    this._internalListeners.length = 0;
    this._fixedListeners.length = 0;
  },

  getFixedPriorityListeners: function () {
    return this._fixedListeners;
  },

  getInternalListeners: function () {
    return this._internalListeners;
  }
});

/**
 * <p>
 *  jsf.eventManager is a singleton object which manages event listener subscriptions and event dispatching. <br/>
 *                                                                                                           <br/>
 *  The EventListener list is managed in such way so that event listeners can be added and removed           <br/>
 *  while events are being dispatched.
 * </p>
 * @class
 * @name jsf.eventManager
 */
jsf.eventManager = /** @lends jsf.eventManager# */ {
  //Priority dirty flag
  DIRTY_NONE: 0,
  DIRTY_FIXED: 1 << 0,
  DIRTY_INTERNAL: 1 << 1,
  DIRTY_ALL: 3,

  _listenersMap: {},
  _internalListenersMap: {},
  _priorityDirtyFlagMap: {},
  _toAddedListeners: [],
  _toRemovedListeners: [],
  _inDispatch: 0,
  _isEnabled: false,

  /**
   * Whether to enable dispatching events
   * @param {boolean} enabled
   */
  setEnabled: function(enabled) {
    this._isEnabled = enabled;
  },

  /**
   * Checks whether dispatching events is enabled
   * @returns {boolean}
   */
  isEnabled: function() {
    return this._isEnabled;
  },

  _setDirty: function(listenerID, flag) {
    var locDirtyFlagMap = this._priorityDirtyFlagMap;
    if (locDirtyFlagMap[listenerID] == null)
      locDirtyFlagMap[listenerID] = flag;
    else
      locDirtyFlagMap[listenerID] = flag | locDirtyFlagMap[listenerID];
  },

  /**
   * <p>
   * Adds a event listener for a specified event.                                                                                                            <br/>
   * </p>
   * @param {jsf.EventListener|Object} listener The listener of a specified event or a object of some event parameters.
   * @param {Object|Number} priority The priority of the listener is based on the internal elemnt or fixedPriority The fixed priority of the listener.
   * @return {jsf.EventListener} Return the listener. Needed in order to remove the event from the dispatcher.
   */
  addListener: function(listener, priority) {
    jsf.isUndefined(priority) && (priority = 0);
    jsf.assert(listener && (priority || jsf.isNumber(priority)), jsf._LogInfos.eventManager_addListener);
    if (!(listener instanceof jsf.EventListener)) {
      listener = jsf.EventListener.create(listener);
    } else {
      if (listener._isRegistered()) {
        jsf.log(jsf._LogInfos.eventManager_addListener_2);
        return;
      }
    }

    if (!listener.checkAvailable())
      return;

    if (jsf.isNumber(priority)) {
      listener._setInternalElement(null);
      listener._setFixedPriority(priority);
    } else {
      listener._setInternalElement(priority);
      listener._setFixedPriority(0);
    }
    listener._setRegistered(true);
    this._addListener(listener);

    return listener;
  },

  /**
   * Adds a Custom event listener. It will use a priority of 0 for default.
   * @param {string} eventName
   * @param {function} callback
   * @param {Object} priority
   * @return {jsf.EventListener} the generated event. Needed in order to remove the event from the dispatcher
   */
  addCustomListener: function(eventName, callback, priority) {
    return this.addListener(new jsf.EventListenerCustom(eventName, callback), priority);
  },

  _addListener: function(listener) {
    if (this._inDispatch === 0)
      this._forceAddEventListener(listener);
    else
      this._toAddedListeners.push(listener);
  },

  _associateElementAndEventListener: function (elemnt, listener) {
    var listeners = this._internalListenersMap[elemnt.__instanceId];
    if (!listeners) {
      listeners = [];
      this._internalListenersMap[elemnt.__instanceId] = listeners;
    }
    listeners.push(listener);
  },

  _dissociateElementAndEventListener: function (elemnt, listener) {
    var listeners = this._internalListenersMap[elemnt.__instanceId];
    if (listeners) {
      jsf.arrayRemoveObject(listeners, listener);
      if (listeners.length === 0)
        delete this._internalListenersMap[elemnt.__instanceId];
    }
  },

  _forceAddEventListener: function(listener) {
    var listenerID = listener._getListenerID();
    var listeners = this._listenersMap[listenerID];
    if (!listeners) {
      listeners = new jsf._EventListenerVector();
      this._listenersMap[listenerID] = listeners;
    }
    listeners.push(listener);

    if (listener._getInternalElement() === null) {
      this._setDirty(listenerID, this.DIRTY_FIXED);
    } else {
      this._setDirty(listenerID, this.DIRTY_INTERNAL);
      this._associateElementAndEventListener(listener._getInternalElement(), listener);
    }
  },

  _getListeners: function(listenerID) {
    return this._listenersMap[listenerID];
  },

  _removeListener: function(listeners, index) {
    listeners[index]._release();
    listeners.splice(index, 1);
  },

  _removeListenerInVector: function(listeners, listener) {
    if (listeners == null)
      return false;

    for (var i = 0, len = listeners.length; i < len; i++) {
      var selListener = listeners[i];
      if (selListener === listener) {
        selListener._setRegistered(false);
        if (selListener._getInternalElement() !== null){
          this._dissociateElementAndEventListener(selListener._getInternalElement(), selListener);
          selListener._setInternalElement(null);
        }
        if (this._inDispatch === 0)
          this._removeListener(listeners, i);
        else
          this._toRemovedListeners.push(selListener);
        return true;
      }
    }
    return false;
  },

  _removeAllListenersInVector: function(listeners) {
    if (!listeners)
      return;
    var selListener;
    for (var i = 0; i < listeners.length;) {
      selListener = listeners[i];
      selListener._setRegistered(false);

      if (selListener._getInternalElement() !== null){
        this._dissociateElementAndEventListener(selListener._getInternalElement(), selListener);
        selListener._setInternalElement(null);
      }

      if (this._inDispatch === 0)
        this._removeListener(listeners, i);
      else
        ++i;
    }
  },

  _removeListenersForListenerID: function(listenerID, filter) {
    var listeners = this._listenersMap[listenerID],
      i;
    if (listeners) {
      var fixedListeners = listeners.getFixedPriorityListeners();
      if (filter) {
        var locToAddedListeners = this._toAddedListeners,
          listener, i;
        for (i = 0; i < fixedListeners.length;) {
          listener = fixedListeners[i];
          if (listener && filter(listener)) {
            if (this._inDispatch === 0)
              this._removeListener(fixedListeners, i);
            else
              ++i;
          } else {
            ++i;
          }
        }
        for (i = 0; i < locToAddedListeners.length;) {
          listener = locToAddedListeners[i];
          if (listener && listener._getListenerID() === listenerID && filter(listener))
            locToAddedListeners.splice(i, 1);
          else
            ++i;
        }
      } else {
        this._removeAllListenersInVector(fixedListeners);

        // Remove the dirty flag according the 'listenerID'.
        // No need to check whether the dispatcher is dispatching event.
        delete this._priorityDirtyFlagMap[listenerID];

        if (!this._inDispatch) {
          listeners.clearFixedPriorityListeners();
        }
      }
      var locToAddedListeners = this._toAddedListeners,
        listener;
      for (i = 0; i < locToAddedListeners.length;) {
        listener = locToAddedListeners[i];
        if (listener && listener._getListenerID() === listenerID)
          locToAddedListeners.splice(i, 1);
        else
          ++i;
      }
    }
  },

  /**
   * Remove a listener
   * @param {jsf.EventListener} listener an event listener
   */
  removeListener: function(listener) {
    if (!listener || !(listener instanceof jsf.EventListener))
      return;

    var isFound, locListener = this._listenersMap;
    for (var selKey in locListener) {
      var listeners = locListener[selKey];
      var fixedListeners = listeners.getFixedPriorityListeners(),
        internalListeners = listeners.getInternalListeners();

      isFound = this._removeListenerInVector(fixedListeners, listener);
      if (isFound) {
        // Dirty flag need to be updated after listeners were removed.
        this._setDirty(listener._getListenerID(), this.DIRTY_FIXED);
      } else {
        isFound = this._removeListenerInVector(internalListeners, listener);
        if (isFound)
          this._setDirty(listener._getListenerID(), this.DIRTY_INTERNAL);
      }

      if (listeners.empty()) {
        delete this._priorityDirtyFlagMap[listener._getListenerID()];
        delete locListener[selKey];
      }

      if (isFound)
        break;
    }

    if (!isFound) {
      var locToAddedListeners = this._toAddedListeners;
      for (var i = 0, len = locToAddedListeners.length; i < len; i++) {
        var selListener = locToAddedListeners[i];
        if (selListener === listener) {
          locToAddedListeners.splice(i, 1);
          selListener._setRegistered(false);
          break;
        }
      }
    }
  },

  /**
   * Removes all listeners with the same event listener type or removes all listeners of a jsf.Class
   * @param {Object} listenerType listenerType
   * @param {Object} listenerTypeDescription listenerTypeDescription
   */
  removeListeners: function(listenerType, listenerTypeDescription) {
    var _t = this;
    if (listenerType instanceof jsf.Class) {
      var listeners = _t._internalListenersMap[listenerType.__instanceId], i;
      if (listeners) {
        var listenersCopy = jsf.copyArray(listeners);
        for (i = 0; i < listenersCopy.length; i++)
          _t.removeListener(listenersCopy[i]);
        listenersCopy.length = 0;
      }
      var locToAddedListeners = _t._toAddedListeners;
      for (i = 0; i < locToAddedListeners.length; ) {
        var listener = locToAddedListeners[i];
        if (listener._getInternalElement() === listenerType) {
          listener._setInternalElement(null);
          listener._setRegistered(false);
          locToAddedListeners.splice(i, 1);
        } else
          ++i;
      }
    } else {
      if (listenerType === jsf.EventListener.KEYBOARD)
        _t._removeListenersForListenerID(jsf.EventListenerKeyboard.LISTENER_ID);
      else if (listenerType in jsf.EventListener.__inject)
        _t._removeListenersForListenerID(jsf.EventListener.__inject[listenerType].listenerID, jsf.EventListener.__inject[listenerType].filterFunc && jsf.EventListener.__inject[listenerType].filterFunc(listenerTypeDescription));
      else if (listenerType in this._listenersMap)
        _t._removeListenersForListenerID(listenerType);
      else
        jsf.log(jsf._LogInfos.eventManager_removeListeners);
    }
  },

  /**
   * Removes all listeners
   */
  removeAllListeners: function() {
    var locListeners = this._listenersMap;
    for (var selKey in locListeners) {
      this._removeListenersForListenerID(selKey);
    }
  },

  _sortListenersOfPriority: function(listeners) {
    if (!listeners || listeners.length === 0)
      return;
    listeners.sort(this._sortListenersOfPriorityAsc);
  },

  _sortListenersOfPriorityAsc: function(l1, l2) {
    return l1._getFixedPriority() - l2._getFixedPriority();
  },

  _sortEventListeners: function(listenerID) {
    var dirtyFlag = this.DIRTY_NONE,
      locFlagMap = this._priorityDirtyFlagMap;
    if (locFlagMap[listenerID])
      dirtyFlag = locFlagMap[listenerID];

    if (dirtyFlag !== this.DIRTY_NONE) {
      // Clear the dirty flag first, if `rootNode` is null, then set its dirty flag of scene graph priority
      locFlagMap[listenerID] = this.DIRTY_NONE;

      var listeners = this._listenersMap[listenerID];
      if (!listeners)
        return;

      if (dirtyFlag & this.DIRTY_FIXED)
        this._sortListenersOfPriority(listeners.getFixedPriorityListeners());

      // if (dirtyFlag & this.DIRTY_INTERNAL) {
      //   this._sortListenersOfPriority(listeners.getInternalListeners());
      // }
    }
  },

  _onListenerCallback: function(listener, event) {
    event._setCurrentTarget(listener._getInternalElement());
    try {
      listener._onEvent && listener._onEvent(event);
    } catch (e) {
      jsf.error(e);
    }
    return event.isStopped();
  },

  _dispatchEventToListeners: function(listeners, onEvent, eventOrArgs) {
    var shouldStopPropagation = false;
    var fixedListeners = listeners.getFixedPriorityListeners();
    var internalListeners = listeners.getInternalListeners();

    var i, j, selListener;
    if (internalListeners) {
      for (i = 0, j = internalListeners.length; i < j; i++) {
        selListener = internalListeners[i];
        if (selListener.isEnabled() && selListener._isRegistered() && onEvent(selListener, eventOrArgs)) {
          shouldStopPropagation = true;
          break;
        }
      }
    }

    if (fixedListeners && !shouldStopPropagation) {
      for (i = 0, j = fixedListeners.length; i < j; i++) {
        selListener = fixedListeners[i];
        if (selListener.isEnabled() && selListener._isRegistered() && onEvent(selListener, eventOrArgs)) {
          shouldStopPropagation = true;
          break;
        }
      }
    }
  },

  _onUpdateListeners: function(listenerID) {
    var listeners = this._listenersMap[listenerID];
    if (!listeners)
      return;

    var fixedListeners = listeners.getFixedPriorityListeners();
    var internalListeners = listeners.getInternalListeners();
    var i, selListener, idx, toRemovedListeners = this._toRemovedListeners;

    if (internalListeners) {
      for (i = 0; i < internalListeners.length;) {
        selListener = internalListeners[i];
        if (!selListener._isRegistered()) {
          internalListeners.splice(i, 1);
          // if item in toRemove list, remove it from the list
          idx = toRemovedListeners.indexOf(selListener);
          if(idx !== -1)
            toRemovedListeners.splice(idx, 1);
        } else
          ++i;
      }
    }

    if (fixedListeners) {
      for (i = 0; i < fixedListeners.length;) {
        selListener = fixedListeners[i];
        if (!selListener._isRegistered()) {
          fixedListeners.splice(i, 1);
          // if item in toRemove list, remove it from the list
          idx = toRemovedListeners.indexOf(selListener);
          if(idx !== -1)
            toRemovedListeners.splice(idx, 1);
        }
        else
          ++i;
      }
    }

    if (internalListeners && internalListeners.length === 0)
      listeners.clearInternalListeners();

    if (fixedListeners && fixedListeners.length === 0)
      listeners.clearFixedPriorityListeners();
  },

  _updateListeners: function(event) {
    var locInDispatch = this._inDispatch;
    jsf.assert(locInDispatch > 0, jsf._LogInfos.EventManager__updateListeners);

    if (locInDispatch > 1)
      return;

    if (event.isStopped())
      return;

    this._onUpdateListeners(event._getListenerID());

    jsf.assert(locInDispatch === 1, jsf._LogInfos.EventManager__updateListeners_2);
    var locListenersMap = this._listenersMap,
      locPriorityDirtyFlagMap = this._priorityDirtyFlagMap;
    for (var selKey in locListenersMap) {
      if (locListenersMap[selKey].empty()) {
        delete locPriorityDirtyFlagMap[selKey];
        delete locListenersMap[selKey];
      }
    }

    var locToAddedListeners = this._toAddedListeners;
    if (locToAddedListeners.length !== 0) {
      for (var i = 0, len = locToAddedListeners.length; i < len; i++)
        this._forceAddEventListener(locToAddedListeners[i]);
      this._toAddedListeners.length = 0;
    }

    if(this._toRemovedListeners.length !== 0)
      this._cleanToRemovedListeners();
  },

  //Remove all listeners in _toRemoveListeners list and cleanup
  _cleanToRemovedListeners: function() {
    var toRemovedListeners = this._toRemovedListeners;
    var selListener;
    var listeners;
    var idx;
    var fixedPriorityListeners;
    var internalListeners;
    for (var i = 0; i < toRemovedListeners.length; i++) {
      selListener = toRemovedListeners[i];
      listeners = this._listenersMap[selListener._getListenerID()];
      if (!listeners)
        continue;

      fixedPriorityListeners = listeners.getFixedPriorityListeners();
      internalListeners = listeners.getInternalListeners();

      if (internalListeners) {
        idx = internalListeners.indexOf(selListener);
        if (idx !== -1) {
          internalListeners.splice(idx, 1);
        }
      }
      if (fixedPriorityListeners) {
        idx = fixedPriorityListeners.indexOf(selListener);
        if (idx !== -1) {
          fixedPriorityListeners.splice(idx, 1);
        }
      }
    }
    toRemovedListeners.length = 0;
  },

  /**
   * Dispatches the event, also removes all EventListeners marked for deletion from the event dispatcher list.
   * @param {jsf.Event} event
   */
  dispatchEvent: function(event) {
    if (!this._isEnabled)
      return;

    if (!event || !event.getType)
      throw 'event is undefined';
    this._inDispatch++;

    var listenerID = event._getListenerID();
    this._sortEventListeners(listenerID);
    var selListeners = this._listenersMap[listenerID];
    if (selListeners != null)
      this._dispatchEventToListeners(selListeners, this._onListenerCallback, event);

    this._updateListeners(event);
    this._inDispatch--;
  },

  /**
   * Dispatches a Custom Event with a event name an optional user data
   * @param {string} eventName
   * @param {*} optionalUserData
   */
  dispatchCustomEvent: function(eventName, optionalUserData) {
    var ev = new jsf.EventCustom(eventName);
    ev.setUserData(optionalUserData);
    this.dispatchEvent(ev);
  }
};