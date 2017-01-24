/**
 * JSFQinDebugger.js
 * @authors Casper 
 * @date    2016/04/12
 * @version 1.0.0
 */
(function() {
  var jsfBoot = jsf.boot;
  var mode = jsfBoot.CONFIG[jsfBoot.CONFIG_KEY.debugMode];
  if (mode === jsfBoot.DEBUG_MODE_NONE)
    return;
  var getNow = function() {
      var _time = new Date();
      return _time.getHours() + ":" + _time.getMinutes() + ":" + _time.getSeconds();
    },
    formatString = function(arg) {
      if (jsf.isObject(arg)) {
        try {
          return JSON.stringify(arg);
        } catch (err) {
          return "";
        }
      } else {
        return arg;
      }
    },
    slice = Array.prototype.slice;
  jsf.error = function(error) {
    if (!jsf.sys.isSTB ){
      throw error;
    }
    qin.evt.debug("[" + getNow() + "] jsf.error: " + (arguments.length > 1 ? slice.call(arguments).join(' ') : error));
  };
  jsf.assert = function(cond, msg) {
    if (!cond && msg) {
      for (var i = 2; i < arguments.length; i++)
        msg = msg.replace(/(%s)|(%d)/, formatString(arguments[i]));
      throw msg;
    }
  };
  if (mode <= jsfBoot.DEBUG_MODE_WARN) {
    jsf.warn = function(warn) {
      qin.evt.debug("[" + getNow() + "] jsf.warn: " + (arguments.length > 1 ? slice.call(arguments).join(' ') : warn));
    };
  }
  if (mode <= jsfBoot.DEBUG_MODE_INFO) {
    jsf.info = function(info) {
      qin.evt.debug("[" + getNow() + "] jsf.info: " + (arguments.length > 1 ? slice.call(arguments).join(' ') : info));
    };
  }
  if (mode <= jsfBoot.DEBUG_MODE_DEBUG) {
    jsf.log = function(log) {
      qin.evt.debug("[" + getNow() + "] jsf.log: " + (arguments.length > 1 ? slice.call(arguments).join(' ') : log));
    };
  }
})();