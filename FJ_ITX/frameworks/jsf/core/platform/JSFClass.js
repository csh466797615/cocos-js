/**
 * JSFCLass.js
 * @authors Casper 
 * @date    2015/09/14
 * @version 1.0.0
 */
var jsf = jsf || {};
/* Managed JavaScript Inheritance
 * Based on John Resig's Simple JavaScript Inheritance http://ejohn.org/blog/simple-javascript-inheritance/
 * MIT Licensed.
 */
(function(global, factory) {
  global.Class = factory();
}(jsf, function() {
  'use strict';
  /**
   * @namespace
   * @name ClassManager
   */
  var ClassManager = {
    id: (0 | (Math.random() * 998)),
    instanceId: (0 | (Math.random() * 998)),
    getNewID: function() {
      return this.id++;
    },
    getNewInstanceId: function() {
      return this.instanceId++;
    }
  };

  var fnTest = /\b_super\b/;

  /**
   * The base Class implementation (does nothing)
   * @class
   */
  var BaseClass = function() {
    this.__instanceId = ClassManager.getNewInstanceId();
  };

  /**
   * Create a new Class that inherits from this Class
   * @static
   * @param {object} props
   * @return {function}
   */
  BaseClass.extend = function(props) {
    var _super = this.prototype;

    // Instantiate a base Class (but only create the instance,
    // don't run the init constructor)
    var prototype = Object.create(_super);

    var classId = ClassManager.getNewID();
    ClassManager[classId] = _super;
    // Copy the properties over onto the new prototype. We make function
    // properties non-eumerable as this makes typeof === 'function' check
    // unnecessary in the for...in loop used 1) for generating Class()
    // 2) for jsf.clone and perhaps more. It is also required to make
    // these function properties cacheable in Carakan.
    var desc = { writable: true, enumerable: false, configurable: true };

    prototype.__instanceId = null;

    // The dummy Class constructor
    function Class() {
      this.__instanceId = ClassManager.getNewInstanceId();
      // All construction is actually done in the init method
      if (this.ctor)
        this.ctor.apply(this, arguments);
    }

    Class.id = classId;
    // desc = { writable: true, enumerable: false, configurable: true, value: XXX }; Again, we make this non-enumerable.
    desc.value = classId;
    Object.defineProperty(prototype, '__pid', desc);

    // Populate our constructed prototype object
    Class.prototype = prototype;

    // Enforce the constructor to be what we expect
    desc.value = Class;
    Object.defineProperty(Class.prototype, 'constructor', desc);

    for (var idx = 0, li = arguments.length; idx < li; ++idx) {
      var prop = arguments[idx];
      for (var name in prop) {
        var isFunc = (typeof prop[name] === 'function');
        var override = (typeof _super[name] === 'function');
        var hasSuperCall = fnTest.test(prop[name]);

        if (isFunc && override && hasSuperCall) {
          desc.value = (function(name, fn) {
            return function() {
              var tmp = this._super;

              // Add a new ._super() method that is the same method
              // but on the super-Class
              this._super = _super[name];

              // The method only need to be bound temporarily, so we
              // remove it when we're done executing
              var ret = fn.apply(this, arguments);
              this._super = tmp;

              return ret;
            };
          })(name, prop[name]);
          Object.defineProperty(prototype, name, desc);
        } else if (isFunc) {
          desc.value = prop[name];
          Object.defineProperty(prototype, name, desc);
        } else {
          prototype[name] = prop[name];
        }
      }
    }

    // And make this Class extendable
    Class.extend = BaseClass.extend;

    //add implementation method
    Class.implement = function(prop) {
      for (var name in prop) {
        prototype[name] = prop[name];
      }
    };
    return Class;
  };

  return BaseClass;
}));