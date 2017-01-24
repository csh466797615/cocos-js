/**
 * JSFPVRManager.js
 * @authors Casper 
 * @date    2016/08/02
 * @version 1.0.0
 */
/**
 * jsf.PVRManager is a global object.
 * @requires jsf.PVRFile
 */
(function() {
  'use strict';
  /**
   * The mthods of jsf.PVRManager.
   * @constant
   * @type {Function}
   */
  var Methods = {
    getPVRFiles: getter__get_pvr_files,
    setProgramInfo: setter__set_program_info,
    getProgramInfo: getter__get_program_info,
    listener: addListener,
    removeListener: removeListener
  };

  /**
   * Gets the pvr files under the specified path.
   * @param  {Array|String} path
   */
  function getter__get_pvr_files (path) {
    if (!path || jsf.isArray(path) && path.length === 0) return [];
    return JSON.parse(qin.pvr.getList(JSON.stringify({
      path: Array.prototype.concat.call([], path)
    }))).map(function (value) {
      return new jsf.PVRFile(value);
    });
  }

  /**
   * Gets the specified file information under the specified path.
   * @param  {jsf.PVRFile|String} obj
   * @param  {Array} params
   * @return {Null|Object}
   */
  function getter__get_program_info (obj, params) {
    if (!obj || !jsf.isArray(params) || params.length === 0) return null;
    var path = obj;
    if (jsf.isInstanceof(obj, jsf.PVRFile)) {
      var url = obj.url;
      path = url.substring(0, url.lastIndexOf('.'));
    }
    var info = qin.pvr.getProgramInfo(path, JSON.stringify(params));
    return info === '' ? null : JSON.parse(info);
  }

  /**
   * Sets the specified file information under the specified path.
   * @param  {jsf.PVRFile|String} obj
   * @param  {Object} params
   */
  function setter__set_program_info (obj, info) {
    if (!obj || !info) return;
    var path = obj;
    if (jsf.isInstanceof(obj, jsf.PVRFile)) {
      var url = obj.url;
      path = url.substring(0, url.lastIndexOf('.'));
    }
    qin.pvr.setProgramInfoEx(path, JSON.stringify(info));
  }

  var listeners = [];
  jsf.eventManager.addListener({
    event: jsf.EventListener.SYSTEM,
    eventType: jsf.EventSystem.TYPE_PVR,
    callback: function(event) {
      jsf.each(listeners, function(listener) {
        listener.callback.call(listener.context, event.getEventName(), event.getEventData());
      });
    }
  }, new jsf.Class());

  /**
   * Add a listener.
   * @param {Function} listener
   * @param {Object} *context
   */
  function addListener(listener, context) {
    listeners.push({
      callback: listener,
      context: context
    });
  }

  /**
   * Remove the previous listener.
   * @param {Function} *listener
   */
  function removeListener(listener) {
    if (listener) {
      for (var i = 0, j = listeners.length; i < j; i++) {
        if (listeners[i].callback === listener) {
          listeners.splice(i, 1);
          break;
        }
      }
    } else {
      listeners.length = 0;
    }
  }

  var JSFPVRManager = {};

  jsf.defineReadOnlyProperties(JSFPVRManager, Methods);

  jsf.PVRManager = JSFPVRManager;
}());