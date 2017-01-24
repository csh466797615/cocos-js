/**
 * JSFBoot.js
 * @authors Casper 
 * @date    2015/09/14
 * @version 1.0.0
 */
var jsf = jsf || {};

jsf.newElement = function(x) {
  return document.createElement(x);
};

jsf._addEventListener = function(element, type, listener, useCapture) {
  element.addEventListener(type, listener, useCapture);
};

jsf._removeEventListener = function(element, type, listener, useCapture) {
  element.removeEventListener(type, listener, useCapture);
};

/**
 * Iterate over an object or an array, executing a function for each matched element.
 * @param {object|array} obj
 * @param {function} iterator
 * @param {object} [context]
 */
jsf.each = function(obj, iterator, context) {
  if (!obj)
    return;
  if (obj instanceof Array) {
    for (var i = 0, li = obj.length; i < li; i++) {
      if (iterator.call(context, obj[i], i) === false)
        return;
    }
  } else {
    for (var key in obj) {
      if (iterator.call(context, obj[key], key) === false)
        return;
    }
  }
};

/**
 * Check the url whether cross origin
 * @param {String} url
 * @returns {boolean}
 */
jsf.isCrossOrigin = function(url) {
  if (!url) {
    jsf.log('invalid URL');
    return false;
  }
  var startIndex = url.indexOf('://');
  if (startIndex === -1)
    return false;

  var endIndex = url.indexOf('/', startIndex + 3);
  var urlOrigin = (endIndex === -1) ? url : url.substring(0, endIndex);
  return urlOrigin !== location.origin;
};

/**
 * Check the obj whether element
 * @param {Object} element
 * @returns {boolean}
 */
jsf.isElement = function(element) {
  return element instanceof HTMLElement || element === window || element === document;
};

//to make sure the jsf.log, jsf.warn, jsf.error and jsf.assert would not throw error before init by debugger mode.
jsf.log = jsf.warn = jsf.error = jsf.assert = function() {};

/**
 * Async Pool class, a helper of jsf.async
 * @param {Object|Array} srcObj
 * @param {Number} limit the limit of parallel number
 * @param {function} iterator
 * @param {function} onEnd
 * @param {object} target
 * @constructor
 */
jsf.AsyncPool = function(srcObj, limit, iterator, onEnd, target) {
  var self = this;
  self._srcObj = srcObj;
  self._limit = limit;
  self._pool = [];
  self._iterator = iterator;
  self._iteratorTarget = target;
  self._onEnd = onEnd;
  self._onEndTarget = target;
  self._results = srcObj instanceof Array ? [] : {};
  self._isErr = false;

  jsf.each(srcObj, function(value, index) {
    self._pool.push({
      index: index,
      value: value
    });
  });

  self.size = self._pool.length;
  self.finishedSize = 0;
  self._workingSize = 0;

  self._limit = self._limit || self.size;

  self.onIterator = function(iterator, target) {
    self._iterator = iterator;
    self._iteratorTarget = target;
  };

  self.onEnd = function(endCb, endCbTarget) {
    self._onEnd = endCb;
    self._onEndTarget = endCbTarget;
  };

  self._handleItem = function() {
    var self = this;
    if (self._pool.length === 0 || self._workingSize >= self._limit)
      return; //return directly if the array's length = 0 or the working size great equal limit number

    var item = self._pool.shift();
    var value = item.value,
      index = item.index;
    self._workingSize++;
    self._iterator.call(self._iteratorTarget, value, index,
      function(err) {
        if (self._isErr)
          return;

        self.finishedSize++;
        self._workingSize--;
        if (err) {
          self._isErr = true;
          if (self._onEnd)
            self._onEnd.call(self._onEndTarget, err);
          return;
        }

        var arr = Array.prototype.slice.call(arguments, 1);
        self._results[this.index] = arr[0];
        if (self.finishedSize === self.size) {
          if (self._onEnd)
            self._onEnd.call(self._onEndTarget, null, self._results);
          return;
        }
        self._handleItem();
      }, self);
  };

  self.flow = function() {
    var self = this;
    if (self._pool.length === 0) {
      if (self._onEnd)
        self._onEnd.call(self._onEndTarget, null, []);
      return;
    }
    for (var i = 0; i < self._limit; i++)
      self._handleItem();
  };
};

/**
 * @class
 */
jsf.async = {
  /**
   * Do tasks series.
   * @param {Array|Object} tasks
   * @param {function} [cb] callback
   * @param {Object} [target]
   * @return {jsf.AsyncPool}
   */
  series: function(tasks, cb, target) {
    var asyncPool = new jsf.AsyncPool(tasks, 1, function(func, index, cb1) {
      func.call(target, cb1);
    }, cb, target);
    asyncPool.flow();
    return asyncPool;
  },

  /**
   * Do tasks parallel.
   * @param {Array|Object} tasks
   * @param {function} cb callback
   * @param {Object} [target]
   * @return {jsf.AsyncPool}
   */
  parallel: function(tasks, cb, target) {
    var asyncPool = new jsf.AsyncPool(tasks, 0, function(func, index, cb1) {
      func.call(target, cb1);
    }, cb, target);
    asyncPool.flow();
    return asyncPool;
  },

  /**
   * Do tasks waterfall.
   * @param {Array|Object} tasks
   * @param {function} cb callback
   * @param {Object} [target]
   * @return {jsf.AsyncPool}
   */
  waterfall: function(tasks, cb, target) {
    var args = [];
    var asyncPool = new jsf.AsyncPool(tasks, 1,
      function(func, index, cb1) {
        args.push(function(err) {
          args = Array.prototype.slice.call(arguments, 1);
          cb1.apply(null, arguments);
        });
        func.apply(target, args);
      },
      function(err) {
        if (!cb)
          return;
        if (err)
          return cb.call(target, err);
        cb.apply(target, [null].concat(args));
      });
    asyncPool.flow();
    return asyncPool;
  },

  /**
   * Do tasks by iterator.
   * @param {Array|Object} tasks
   * @param {function|Object} iterator
   * @param {function} [callback]
   * @param {Object} [target]
   * @return {jsf.AsyncPool}
   */
  map: function(tasks, iterator, callback, target) {
    var locIterator = iterator;
    if (typeof(iterator) === 'object') {
      callback = iterator.cb;
      target = iterator.iteratorTarget;
      locIterator = iterator.iterator;
    }
    var asyncPool = new jsf.AsyncPool(tasks, 1, locIterator, callback, target);
    asyncPool.flow();
    return asyncPool;
  },

  /**
   * Do tasks by iterator limit.
   * @param {Array|Object} tasks
   * @param {Number} limit
   * @param {function} iterator
   * @param {function} cb callback
   * @param {Object} [target]
   */
  mapLimit: function(tasks, limit, iterator, cb, target) {
    var asyncPool = new jsf.AsyncPool(tasks, limit, iterator, cb, target);
    asyncPool.flow();
    return asyncPool;
  }
};

/**
 * @class
 */
jsf.path = {
  /**
   * Join strings to be a path.
   * @example
   * jsf.path.join('a', 'b.png');//-->'a/b.png'
   * jsf.path.join('a', 'b', 'c.png');//-->'a/b/c.png'
   * jsf.path.join('a', 'b');//-->'a/b'
   * jsf.path.join('a', 'b', '/');//-->'a/b/'
   * jsf.path.join('a', 'b/', '/');//-->'a/b/'
   * @returns {string}
   */
  join: function() {
    var l = arguments.length;
    var result = '';
    for (var i = 0; i < l; i++) {
      result = (result + (result === '' ? '' : '/') + arguments[i]).replace(/(\/|\\\\)$/, '');
    }
    return result;
  },

  /**
   * Get the ext name of a path.
   * @example
   * jsf.path.extname('a/b.png');//-->'.png'
   * jsf.path.extname('a/b.png?a=1&b=2');//-->'.png'
   * jsf.path.extname('a/b');//-->null
   * jsf.path.extname('a/b?a=1&b=2');//-->null
   * @param {string} pathStr
   * @returns {*}
   */
  extname: function(pathStr) {
    var temp = /(\.[^\.\/\?\\]*)(\?.*)?$/.exec(pathStr);
    return temp ? temp[1] : null;
  },

  /**
   * Get the main name of a file name
   * @param {string} fileName
   * @returns {string}
   */
  mainFileName: function(fileName) {
    if (fileName) {
      var idx = fileName.lastIndexOf('.');
      if (idx !== -1)
        return fileName.substring(0, idx);
    }
    return fileName;
  },

  /**
   * Get the file name of a file path.
   * @example
   * jsf.path.basename('a/b.png');//-->'b.png'
   * jsf.path.basename('a/b.png?a=1&b=2');//-->'b.png'
   * jsf.path.basename('a/b.png', '.png');//-->'b'
   * jsf.path.basename('a/b.png?a=1&b=2', '.png');//-->'b'
   * jsf.path.basename('a/b.png', '.txt');//-->'b.png'
   * @param {string} pathStr
   * @param {string} [extname]
   * @returns {*}
   */
  basename: function(pathStr, extname) {
    var index = pathStr.indexOf('?');
    if (index > 0) pathStr = pathStr.substring(0, index);
    var reg = /(\/|\\\\)([^(\/|\\\\)]+)$/g;
    var result = reg.exec(pathStr.replace(/(\/|\\\\)$/, ''));
    if (!result) return null;
    var baseName = result[2];
    if (extname && pathStr.substring(pathStr.length - extname.length).toLowerCase() === extname.toLowerCase())
      return baseName.substring(0, baseName.length - extname.length);
    return baseName;
  },

  /**
   * Get dirname of a file path.
   * @example
   * unix
   * jsf.path.driname('a/b/c.png');//-->'a/b'
   * jsf.path.driname('a/b/c.png?a=1&b=2');//-->'a/b'
   * jsf.path.dirname('a/b/');//-->'a/b'
   * jsf.path.dirname('c.png');//-->''
   * windows
   * jsf.path.driname('a\\b\\c.png');//-->'a\b'
   * jsf.path.driname('a\\b\\c.png?a=1&b=2');//-->'a\b'
   * @param {string} pathStr
   * @returns {*}
   */
  dirname: function(pathStr) {
    return pathStr.replace(/((.*)(\/|\\|\\\\))?(.*?\..*$)?/, '$2');
  },

  /**
   * Change extname of a file path.
   * @example
   * jsf.path.changeExtname('a/b.png', '.plist');//-->'a/b.plist'
   * jsf.path.changeExtname('a/b.png?a=1&b=2', '.plist');//-->'a/b.plist?a=1&b=2'
   * @param {string} pathStr
   * @param {string} [extname]
   * @returns {string}
   */
  changeExtname: function(pathStr, extname) {
    extname = extname || '';
    var index = pathStr.indexOf('?');
    var tempStr = '';
    if (index > 0) {
      tempStr = pathStr.substring(index);
      pathStr = pathStr.substring(0, index);
    }
    index = pathStr.lastIndexOf('.');
    if (index < 0) return pathStr + extname + tempStr;
    return pathStr.substring(0, index) + extname + tempStr;
  },
  /**
   * Change file name of a file path.
   * @example
   * jsf.path.changeBasename('a/b/c.plist', 'b.plist');//-->'a/b/b.plist'
   * jsf.path.changeBasename('a/b/c.plist?a=1&b=2', 'b.plist');//-->'a/b/b.plist?a=1&b=2'
   * jsf.path.changeBasename('a/b/c.plist', '.png');//-->'a/b/c.png'
   * jsf.path.changeBasename('a/b/c.plist', 'b');//-->'a/b/b'
   * jsf.path.changeBasename('a/b/c.plist', 'b', true);//-->'a/b/b.plist'
   * @param {String} pathStr
   * @param {String} basename
   * @param {Boolean} [isSameExt]
   * @returns {string}
   */
  changeBasename: function(pathStr, basename, isSameExt) {
    if (basename.indexOf('.') === 0) return this.changeExtname(pathStr, basename);
    var index = pathStr.indexOf('?');
    var tempStr = '';
    var ext = isSameExt ? this.extname(pathStr) : '';
    if (index > 0) {
      tempStr = pathStr.substring(index);
      pathStr = pathStr.substring(0, index);
    }
    index = pathStr.lastIndexOf('/');
    index = index <= 0 ? 0 : index + 1;
    return pathStr.substring(0, index) + basename + ext + tempStr;
  }
};

/**
 * Loader for resource loading process. It's a singleton object.
 * @class
 */
jsf.loader = {
  _jsCache: {}, //cache for js

  _noCacheRex: /\?/,

  /**
   * Get XMLHttpRequest.
   * @returns {XMLHttpRequest}
   */
  getXMLHttpRequest: function() {
    return window.XMLHttpRequest ? new window.XMLHttpRequest() : new ActiveXObject('MSXML2.XMLHTTP');
  },

  _getArgs4Js: function(args) {
    var a0 = args[0],
      a1 = args[1],
      a2 = args[2],
      a3 = args[3],
      results = ['', null, null, null];

    if (args.length === 1) {
      results[1] = a0 instanceof Array ? a0 : [a0];
    } else if (args.length === 2) {
      if (typeof a1 === 'function') {
        results[1] = a0 instanceof Array ? a0 : [a0];
        results[2] = a1;
      } else {
        results[0] = a0 || '';
        results[1] = a1 instanceof Array ? a1 : [a1];
      }
    } else if (args.length === 3) {
      if (typeof a1 === 'function') {
        results[1] = a0 instanceof Array ? a0 : [a0];
        results[2] = a1;
        results[3] = a2;
      } else {
        results[0] = a0 || '';
        results[1] = a1 instanceof Array ? a1 : [a1];
        results[2] = a2;
      }
    } else if (args.length === 4) {
      results[0] = a0 || '';
      results[1] = a1 instanceof Array ? a1 : [a1];
      results[2] = a2;
      results[3] = a3;
    } else throw 'arguments error to load js!';
    return results;
  },

  _createScript: function(jsPath, isAsync, cb) {
    var d = document,
      self = this,
      s = jsf.newElement('script');
    s.async = isAsync;
    self._jsCache[jsPath] = true;
    if (jsf.boot.CONFIG.noCache && typeof jsPath === 'string') {
      if (self._noCacheRex.test(jsPath))
        s.src = jsPath + '&_t=' + (new Date() - 0);
      else
        s.src = jsPath + '?_t=' + (new Date() - 0);
    } else {
      s.src = jsPath;
    }
    jsf._addEventListener(s, 'load', function() {
      s.parentNode.removeChild(s);
      this.removeEventListener('load', arguments.callee, false);
      cb();
    }, false);
    jsf._addEventListener(s, 'error', function() {
      s.parentNode.removeChild(s);
      cb('Load ' + jsPath + ' failed!');
    }, false);
    d.body.appendChild(s);
  },

  _loadJs5Dependency: function(baseDir, jsList, index, cb, progress) {
    if (index >= jsList.length) {
      progress && progress(index, jsList.length);
      if (cb) cb();
      return;
    }
    progress && progress(index, jsList.length);
    var self = this;
    self._createScript(jsf.path.join(baseDir, jsList[index]), false, function(err) {
      if (err) return cb(err);
      self._loadJs5Dependency(baseDir, jsList, index + 1, cb, progress);
    });
  },

  /**
   * Load js files.
   * If the third parameter doesn't exist, then the baseDir turns to be ''.
   *
   * @param {string} [baseDir]   The pre path for jsList or the list of js path.
   * @param {array} jsList    List of js path.
   * @param {function} [cb]  Callback function
   * @returns {*}
   */
  loadJs: function(baseDir, jsList, cb, progress) {
    var self = this,
      localJsCache = self._jsCache,
      args = self._getArgs4Js(arguments);

    var preDir = args[0],
      list = args[1],
      callback = args[2],
      progressCallback = args[3];
    if (navigator.userAgent.indexOf('Trident/5') > -1) { // ie9
      self._loadJs5Dependency(preDir, list, 0, callback, progressCallback);
    } else {
      var total = list.length,
        loadTotal = 0,
        mapCallback = function(func) {
          return function() {
            loadTotal++;
            progressCallback && progressCallback(loadTotal, total);
            func.apply(null, arguments);
          };
        };
      progressCallback && progressCallback(loadTotal, total);
      jsf.async.map(list, function(item, index, cb1) {
        var jsPath = jsf.path.join(preDir, item);
        if (localJsCache[jsPath]) return mapCallback(cb1)(null);
        self._createScript(jsPath, false, mapCallback(cb1));
      }, callback);
    }
  },

  /**
   * Load a single resource as txt.
   * @param {string} url
   * @param {function} [cb] arguments are : err, txt
   */
  loadTxt: function(url, cb) {
    var xhr = this.getXMLHttpRequest(),
      errInfo = 'load ' + url + ' failed!';
    xhr.open('GET', url, true);
    if (/msie/i.test(navigator.userAgent) && !/opera/i.test(navigator.userAgent)) {
      // IE-specific logic here
      xhr.setRequestHeader('Accept-Charset', 'utf-8');
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4)
          xhr.status === 200 ? cb(null, xhr.responseText) : cb(errInfo);
      };
    } else {
      if (xhr.overrideMimeType) xhr.overrideMimeType('text\/plain; charset=utf-8');
      xhr.onload = function() {
        if (xhr.readyState === 4)
          xhr.status === 200 ? cb(null, xhr.responseText) : cb(errInfo);
      };
    }
    xhr.send(null);
  },

  _loadTxtSync: function(url) {
    var xhr = this.getXMLHttpRequest();
    xhr.open('GET', url, false);
    if (/msie/i.test(navigator.userAgent) && !/opera/i.test(navigator.userAgent)) {
      // IE-specific logic here
      xhr.setRequestHeader('Accept-Charset', 'utf-8');
    } else {
      if (xhr.overrideMimeType) xhr.overrideMimeType('text\/plain; charset=utf-8');
    }
    xhr.send(null);
    if (xhr.readyState !== 4 || xhr.status !== 200) {
      return null;
    }
    return xhr.responseText;
  },

  /**
   * Load a single resource as json.
   * @param {string} url
   * @param {function} [cb] arguments are : err, json
   */
  loadJson: function(url, cb) {
    this.loadTxt(url, function(err, txt) {
      if (err) {
        cb(err);
      } else {
        try {
          cb(null, JSON.parse(txt));
        } catch (e) {
          throw 'parse json [' + url + '] failed : ' + e;
        }
      }
    });
  },
};

jsf._initSys = function() {
  jsf.sys = {};
  var sys = jsf.sys;
  var win = window,
    nav = win.navigator,
    doc = document,
    docEle = doc.documentElement;
  var ua = nav.userAgent.toLowerCase();
  var capabilities = jsf.sys.capabilities = {};
  if (docEle.ontouchstart !== undefined || doc.ontouchstart !== undefined || nav.msPointerEnabled)
    capabilities.touches = true;
  if (docEle.onmouseup !== undefined)
    capabilities.mouse = true;
  if (docEle.onkeyup !== undefined)
    capabilities.keyboard = true;
  sys.isSTB = nav.appVersion.indexOf('Win') === -1;
  /**
   * Indicate whether system is mobile system
   * @memberof jsf.sys
   * @name isMobile
   * @type {Boolean}
   */
  sys.isMobile = ua.indexOf('mobile') !== -1 || ua.indexOf('android') !== -1;
};

jsf.__setupExtension = [],
  jsf.__setupExtensionPromise = [];
jsf._setupExtension = function(func) {
  jsf.__setupExtension.push(func);
};
jsf._setupExtensionPromise = function(promise) {
  jsf.__setupExtensionPromise.push(promise);
};

jsf._setup = function(cb) {
  jsf.info(jsf.ENGINE_VERSION);
  jsf.info(JSON.stringify(jsf.sys));
  for (var i = jsf.__setupExtension.length - 1; i >= 0; i--) {
    jsf.__setupExtension[i]();
  }
  jsf.__setupExtension = null;

  jsf.Q.all(jsf.__setupExtensionPromise).then(function() {
    jsf.__setupExtensionPromise = null;
    if (jsf.sys.capabilities.keyboard) {
      jsf._addEventListener(document, 'keydown', function(event) {
        // jsf.log('keydown', event.keyCode);
        event.preventDefault();
        event.stopPropagation();
        jsf.eventManager.dispatchEvent(new jsf.EventKeyboard(event.keyCode || event.which, true));
      }, false);
      jsf._addEventListener(document, 'keyup', function(event) {
        // jsf.log('keyup', event.keyCode);
        event.preventDefault();
        event.stopPropagation();
        jsf.eventManager.dispatchEvent(new jsf.EventKeyboard(event.keyCode || event.which, false));
      }, false);
    }
    jsf.eventManager.setEnabled(true);
    cb();
  }, function(err) {
    jsf.error(err);
  });
};

jsf.boot = {
  DEBUG_MODE_NONE: 0,
  DEBUG_MODE_DEBUG: 1,
  DEBUG_MODE_INFO: 2,
  DEBUG_MODE_WARN: 3,
  DEBUG_MODE_ERROR: 4,

  _prepareCalled: false, //whether the prepare function has been called
  _prepared: false, //whether the engine has prepared

  /**
   * Key of config
   * @constant
   * @type {Object}
   */
  CONFIG_KEY: {
    engineDir: 'engineDir',
    debugMode: 'debugMode',
    mainData: 'mainData',
    jsList: 'jsList'
  },

  /**
   * Config of jsf.boot
   * @type {Object}
   */
  CONFIG: null,

  /**
   * Set config of jsf.boot
   * @param {Object} obj 
   */
  config: function(cfg) {
    if (!this._prepareCalled) {
      var CONFIG = this.CONFIG,
        CONFIG_KEY = this.CONFIG_KEY;
      if (cfg[CONFIG_KEY.engineDir] === void 0)
        cfg[CONFIG_KEY.engineDir] = CONFIG[CONFIG_KEY.engineDir];
      if (cfg[CONFIG_KEY.debugMode] === void 0)
        cfg[CONFIG_KEY.debugMode] = CONFIG[CONFIG_KEY.debugMode];
      if (cfg[CONFIG_KEY.mainData] === void 0)
        cfg[CONFIG_KEY.mainData] = CONFIG[CONFIG_KEY.mainData];
      this.CONFIG = cfg;
    }
    return cfg;
  },

  _initConfig: function() {
    jsf._addEventListener(window, 'load', this._run, false);

    var self = this,
      CONFIG_KEY = self.CONFIG_KEY;
    var _init = function(cfg) {
      cfg[CONFIG_KEY.engineDir] = cfg[CONFIG_KEY.engineDir] || 'frameworks';
      if (cfg[CONFIG_KEY.debugMode] == null)
        cfg[CONFIG_KEY.debugMode] = 0;
      return cfg;
    };
    try {
      var jsf_script = document.getElementsByTagName('script');
      for (var i = 0; i < jsf_script.length; i++) {
        var _t = jsf_script[i].getAttribute('jsf-main');
        if (_t === '' || _t) {
          var _src = jsf_script[i].src;
          self.CONFIG = _init({
            engineDir: jsf.path.dirname(_src),
            mainData: _t
          });
          break;
        }
        _t = jsf_script[i].getAttribute('jsf');
        if (_t === '' || _t) {
          var _src = jsf_script[i].src;
          self.CONFIG = _init({
            engineDir: jsf.path.dirname(_src)
          });
          break;
        }
      }
    } catch (e) {
      self.CONFIG = _init({});
    }
    jsf._initSys();
  },

  //cache for js and module that has added into jsList to be loaded.
  _jsAddedCache: {},
  _getJsListOfModule: function(moduleMap, moduleName, dir) {
    var jsAddedCache = this._jsAddedCache;
    if (jsAddedCache[moduleName]) return null;
    dir = dir || '';
    var jsList = [];
    var tempList = moduleMap[moduleName];
    if (!tempList) throw 'can not find module [' + moduleName + ']';
    var jsfPath = jsf.path;
    for (var i = 0, li = tempList.length; i < li; i++) {
      var item = tempList[i];
      if (jsAddedCache[item] || !item) continue;
      var extname = jsfPath.extname(item);
      if (!extname) {
        var arr = this._getJsListOfModule(moduleMap, item, dir);
        if (arr) jsList = jsList.concat(arr);
      } else if (extname.toLowerCase() === '.js') jsList.push(jsfPath.join(dir, item));
      jsAddedCache[item] = 1;
    }
    return jsList;
  },
  /**
   * Prepare game.
   * @param cb
   * @param pcb
   */
  prepare: function(cb, pcb) {
    var self = this;
    var config = self.CONFIG,
      CONFIG_KEY = self.CONFIG_KEY,
      engineDir = config[CONFIG_KEY.engineDir],
      loader = jsf.loader;
    self._prepareCalled = true;

    var jsList = config[CONFIG_KEY.jsList] || [];
    var modules = config.modules || [];
    var moduleMap = jsf.moduleConfig.module;
    var newJsList = [];
    if (modules.indexOf('core') < 0) modules.splice(0, 0, 'core');
    for (var i = 0, li = modules.length; i < li; i++) {
      var arr = self._getJsListOfModule(moduleMap, modules[i], engineDir);
      if (arr) newJsList = newJsList.concat(arr);
    }
    newJsList = newJsList.concat(jsList);
    jsf.loader.loadJs(newJsList, function(err) {
      if (err) throw err;
      jsf._setup(function() {
        self._prepared = true;
        if (cb) cb();
        jsf.boot.CONFIG.mainData && jsf.loader.loadJs(jsf.boot.CONFIG.mainData);
      });
    }, pcb);
  },

  _run: function() {
    jsf.boot.run();
  },

  /**
   * Run app
   */
  run: function(callback, progress) {
    var self = this;

    if (!self._prepareCalled) {
      window.removeEventListener('load', this._run, false);
    }

    var _run = function() {
      if (!self._prepareCalled) {
        self.prepare(callback, progress);
      }
    };
    document.body ?
      _run() :
      jsf._addEventListener(window, 'load', function() {
        this.removeEventListener('load', arguments.callee, false);
        _run();
      }, false);
  }
};

jsf.boot._initConfig();

jsf.moduleConfig = {
  'module': {
    'core': [
      'JSFDebugger.js',
      'jsf/core/platform/JSFClass.js',
      'jsf/core/platform/JSFCommon.js',
      'jsf/core/platform/JSFConfig.js',
      'jsf/core/platform/JSFTypes.js',
      'jsf/core/platform/JSFMarco.js',
      'jsf/core/platform/JSFExtension.js',
      'jsf/core/event-manager/JSFEvent.js',
      'jsf/core/event-manager/JSFEventListener.js',
      'jsf/core/event-manager/JSFEventManager.js',
      'jsf/core/extension/JSFQ.js',
      'jsf/core/extension/JSFMoment.js',
      'jsf/core/extension/locales.js'
    ],
    'qin': [
      'qin-core',
      'qin/extension-for-old.js',
      'qin-booking',
      'qin-channel',
      'qin-epg',
      'qin-mediaPlayer',
      'qin-setting',
      'qin-network',
      'qin-pvr',
      'qin-tuner',
      'qin-ca'
    ],
    'qin-core': [
      'core',
      jsf.sys.isSTB ? null : 'qin/platform/pc_compatible.js',//JSFMiddlewareSimulator
      'qin/platform/JSFConfig.js',
      'qin/JSFQinBoot.js',
      'qin/JSFQinDebugger.js',
      'qin/event-extension/JSFEventExtension.js'
    ],
    'qin-booking': [
      'qin-core',
      'qin/booking/JSFBooking.js',
      'qin/booking/JSFBookingManager.js',
    ],
    'qin-channel': [
      'qin-core',
      'qin-setting',
      'qin/channel/JSFChannel.js',
      'qin/channel/JSFChannelList.js',
      'qin/channel/JSFChannelManager.js'
    ],
    'qin-tuner': [
      'qin-core',
      'qin/tuner/JSFTuner.js',
      'qin/tuner/JSFTS.js',
      'qin/tuner/JSFScan.js',
      'qin/tuner/JSFUpdate.js',
    ],
    'qin-epg': [
      'core',
      'qin-setting',
      'qin-channel',
      'qin/epg/JSFEPG.js',
      'qin/epg/JSFProgram.js',
    ],
    'qin-setting': [
      'qin-core',
      'qin/setting/JSFSysInfo.js',
      'qin/setting/JSFSetting.js'
    ],
    'qin-mediaPlayer': [
      'qin-core',
      'qin-channel',
      'qin/mediaplayer/JSFMediaPlayer.js',
      'qin/mediaplayer/impl/MediaPlayer.js'
    ],
    'qin-widget': [
      'qin-core',
      'qin/widget/JSFWidget.js',
      'qin/widget/impl/Widget.js'
    ],
    'qin-ca': [
      'qin-core',
      'qin/ca/JSFCA.js',
      'qin/ca/JSFCARelated.js'
    ],
    'qin-network': [
      'qin-core',
      'qin/network/JSFNetworkRelated.js',
      'qin/network/JSFNetwork.js',
      'qin/network/JSFNetworkManager.js',
    ],
    'qin-pvr': [
      'qin-core',
      'qin-channel',
      'qin-epg',
      'qin/pvr/JSFPVR.js',
      'qin/pvr/JSFPVRFile.js',
      'qin/pvr/JSFPVRManager.js'
    ]
  }
};

Function.prototype.bind = Function.prototype.bind || function(oThis) {
  if (!jsf.isFunction(this)) {
    // closest thing possible to the ECMAScript 5
    // internal IsCallable function
    throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
  }

  var aArgs = Array.prototype.slice.call(arguments, 1),
    fToBind = this,
    fNOP = function() {},
    fBound = function() {
      return fToBind.apply(this instanceof fNOP && oThis ? this : oThis,
        aArgs.concat(Array.prototype.slice.call(arguments)));
    };

  fNOP.prototype = this.prototype;
  fBound.prototype = new fNOP();

  return fBound;
};