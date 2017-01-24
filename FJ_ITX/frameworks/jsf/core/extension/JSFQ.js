/**
 * JSFQ
 * @authors Casper 
 * @date    2015/09/17
 * @version 1.0.0
 */
/**
 * Q
 * @description
 * A service that helps you run functions asynchronously, and use their return values (or exceptions)
 * when they are done processing.
 */
(function(global, factory) {
  global.Q = factory();
}(jsf || window, function() {
  'use strict';
  var nextTick = typeof setTimeout !== 'undefined' ? function(fn) {
    setTimeout(fn, 4);
  } : function(fn) {
    fn();
  };

  var exceptionHandler = jsf.error || function(e) {};

  function Promise() {
    this.$$state = {
      status: 0
    };
  }

  extend(Promise.prototype, {
    then: function(onFulfilled, onRejected, progressBack) {
      if (isUndefined(onFulfilled) && isUndefined(onRejected) && isUndefined(progressBack)) return this;
      var result = defer();
      this.$$state.pending = this.$$state.pending || [];
      this.$$state.pending.push([result, onFulfilled, onRejected, progressBack]);
      if (this.$$state.status > 0) scheduleProcessQueue(this.$$state);
      return result.promise;
    },
    'catch': function(callback) {
      return this.then(null, callback);
    },
    'finally': function(callback, progressBack) {
      return this.then(function(val) {
        return handleCallback(val, true, callback);
      }, function(err) {
        return handleCallback(err, false, callback);
      }, progressBack);
    },
    release: function() {
      this.$$state.suatus = -2;
    }
  });

  function Deferred() {
    this.promise = new Promise();
    this.resolve = simpleBind(this, this.resolve);
    this.reject = simpleBind(this, this.reject);
    this.notify = simpleBind(this, this.notify);
  }

  extend(Deferred.prototype, {
    resolve: function(val) {
      if (this.promise.$$state.status) return;
      if (val === this.promise) {
        this.$$reject('Expected promise to be resolved with value other than itself');
      } else {
        this.$$resolve(val);
      }
    },
    $$resolve: function(val) {
      var fns, then;

      fns = callOnce(this, this.$$resolve, this.$$reject);
      try {
        if ((isObject(val) || isFunction(val))) then = val && val.then;
        if (isFunction(then)) {
          this.promise.$$state.status = -1;
          then.call(val, fns[0], fns[1], this.notify);
        } else {
          this.promise.$$state.value = val;
          this.promise.$$state.status = 1;
          scheduleProcessQueue(this.promise.$$state);
        }
      } catch (e) {
        this.$$reject(e);
      }
    },
    reject: function(reason) {
      if (this.promise.$$state.status) return;
      this.$$reject(reason);
    },
    $$reject: function(reason) {
      this.promise.$$state.value = reason;
      this.promise.$$state.status = 2;
      scheduleProcessQueue(this.promise.$$state);
    },
    notify: function(progress) {
      var callbacks = this.promise.$$state.pending;

      if ((this.promise.$$state.status <= 0) && callbacks && callbacks.length) {
        nextTick(function() {
          var callback, result;
          for (var i = 0, j = callbacks.length; i < j; i++) {
            result = callbacks[i][0];
            callback = callbacks[i][3];
            try {
              result.notify(isFunction(callback) ? callback(progress) : progress);
            } catch (e) {
              exceptionHandler(e);
            }
          }
        });
      }
    },
    release: function() {
      this.promise.$$state.suatus = -2;
    }
  });

  function isUndefined(obj) {
    return obj === void 0;
  }

  function isObject(value) {
    return value !== null && typeof value === 'object';
  }

  function isFunction(value) {
    return typeof value === 'function';
  }

  function isPromiseLike(obj) {
    return obj && isFunction(obj.then);
  }

  function extend(dst) {
    var objs = Array.prototype.slice.call(arguments, 1),
      obj, keys, key;
    for (var i = objs.length - 1; i >= 0; i--) {
      obj = objs[i];
      keys = Object.keys(obj);
      for (var j = keys.length - 1; j >= 0; j--) {
        key = keys[j];
        dst[key] = obj[key];
      }
    }
  }

  function simpleBind(context, fn) {
    return function(value) {
      fn.call(context, value);
    };
  }

  function callOnce(self, resolveFn, rejectFn) {
    var called = false;

    function wrap(fn) {
      return function(value) {
        if (called) return;
        called = true;
        fn.call(self, value);
      };
    }

    return [wrap(resolveFn), wrap(rejectFn)];
  }

  function makePromise(value, resolved) {
    var result = defer();
    if (resolved) {
      result.resolve(value);
    } else {
      result.reject(value);
    }
    return result.promise;
  }

  function handleCallback(value, isResolved, callback) {
    var callbackOutput = null;
    try {
      if (isFunction(callback)) callbackOutput = callback();
    } catch (e) {
      return makePromise(e, false);
    }
    if (isPromiseLike(callbackOutput)) {
      return callbackOutput.then(function() {
        return makePromise(value, isResolved);
      }, function(error) {
        return makePromise(error, false);
      });
    } else {
      return makePromise(value, isResolved);
    }
  }

  function processQueue(state) {
    var fn, deferred, pending;

    pending = state.pending;
    state.processScheduled = false;
    state.pending = undefined;

    for (var i = 0, j = pending.length; i < j; i++) {
      deferred = pending[i][0];
      fn = pending[i][state.status];
      try {
        if (isFunction(fn)) {
          deferred.resolve(fn(state.value));
        } else if (state.status === 1) {
          deferred.resolve(state.value);
        } else {
          deferred.reject(state.value);
        }
      } catch (e) {
        deferred.reject(e);
        exceptionHandler(e);
      }
    }
  }

  function scheduleProcessQueue(state) {
    if (state.processed || !state.pending) return;
    state.processed = true;
    processQueue(state);
  }

  /**
   * Creates a `Deferred` object which represents a task which will finish in the future.
   * @return {Deffered} Returns a new instance of deferred.
   */
  function defer() {
    return new Deferred();
  }

  /**
   * Wraps an object that might be a value or a (3rd party) then-able promise into a $q promise.
   * This is useful when you are dealing with an object that might or might not be a promise, or if
   * the promise comes from a source that can't be trusted.
   *
   * @param {*} value Value or a promise
   * @param {Function=} successCallback
   * @param {Function=} errorCallback
   * @param {Function=} progressCallback
   * @returns {Promise} Returns a promise of the passed value or promise
   */
  function when(value, callback, errback, progressBack) {
    var result = new Deferred();
    result.resolve(value);
    return result.promise.then(callback, errback, progressBack);
  }

  /**
   * Combines multiple promises into a single promise that is resolved when all of the input promises are resolved.
   * @param {Array.<Promise>|Object.<Promise>} promises An array or hash of promises
   * @returns {Promise}
   */
  function all(promises) {
    var deferred = new Deferred(),
      counter = 0,
      results = {};

    for (var key in promises) {
      counter++;
      when(promises[key]).then(function(value) {
        if (results.hasOwnProperty(key)) return;
        results[key] = value;
        if (!(--counter)) deferred.resolve(results);
      }, function(reason) {
        if (results.hasOwnProperty(key)) return;
        deferred.reject(reason);
      });
    }

    if (counter === 0) {
      deferred.resolve(results);
    }

    return deferred.promise;
  }

  var JSFQ = function Q(resolver) {
    if (!isFunction(resolver))
      throw 'resolver must be a function';

    if (!(this instanceof Q))
      return new Q(resolver);

    var deferred = new Deferred();

    function resolveFn(value) {
      deferred.resolve(value);
    }

    function rejectFn(reason) {
      deferred.reject(reason);
    }

    try {
      resolver(resolveFn, rejectFn);
    } catch (e) {
      deferred.reject(e);
    }

    return deferred.promise;
  };

  var reject = function(reason) {
    var result = new Deferred();
    result.reject(reason);
    return result.promise;
  };

  JSFQ.defer = defer;
  JSFQ.resolve = when;
  JSFQ.reject = reject;
  JSFQ.when = when;
  JSFQ.all = all;

  return JSFQ;
}));