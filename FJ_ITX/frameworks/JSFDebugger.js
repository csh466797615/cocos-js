/**
 * JSFDebugger.js
 * @authors Casper 
 * @date    2015/09/14
 * @version 1.0.0
 */
jsf._LogInfos = {
  EventListener_create: "Invalid parameter.",

  _EventListenerKeyboard_checkAvailable: "jsf.EventListenerKeyboard.checkAvailable(): Invalid EventListenerKeyboard!",

  eventManager__forceAddEventListener: "Invalid priority!",
  eventManager_removeListeners: "Invalid listener type!",
  eventManager_setPriority: "Can't set fixed priority with scene graph based listener.",
  eventManager_addListener: "Invalid parameters.",
  eventManager_addListener_2: "The listener has been registered, please don't register it again.",

  EventManager__updateListeners: "If program goes here, there should be event in dispatch.",
  EventManager__updateListeners_2: "_inDispatch should be 1 here."
};

jsf._initDebugSetting = function(mode) {
  var jsfBoot = jsf.boot;
  if (mode === jsfBoot.DEBUG_MODE_NONE)
    return;

  if (console && console.log.apply) { //console is null when user doesn't open dev tool on IE9
    var formatString = function (arg) {
      if (jsf.isObject(arg)) {
        try {
          return JSON.stringify(arg);
        } catch (err) {
          return "";
        }
      } else {
        return arg;
      }
    };
    //log to console
    jsf.error = function() {
      return console.error.apply(console, arguments);
    };
    jsf.assert = function(cond, msg) {
      if (!cond && msg) {
        for (var i = 2; i < arguments.length; i++)
          msg = msg.replace(/(%s)|(%d)/, formatString(arguments[i]));
        throw msg;
      }
    };
    if (mode <= jsfBoot.DEBUG_MODE_WARN) {
      jsf.warn = function() {
        console.warn.apply(console, arguments);
      };
    }
    if (mode <= jsfBoot.DEBUG_MODE_INFO) {
      jsf.info = function() {
        console.info.apply(console, arguments);
      };
    }
    if (mode <= jsfBoot.DEBUG_MODE_DEBUG) {
      jsf.log = function() {
        console.log.apply(console, arguments);
      };
    }
  }
};
jsf._initDebugSetting(jsf.boot.CONFIG[jsf.boot.CONFIG_KEY.debugMode] || 0);