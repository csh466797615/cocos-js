/**
 * JSFExtension.js
 * @authors Casper 
 * @date    2015/10/12
 * @version 1.0.0
 */
(function(global, factory) {
  factory(global);
}(jsf || window, function(global) {
  'use strict';
  var slice = Array.prototype.slice;

  var defineGetterSetterDescriptor = {
    enumerable: false,
    configurable: true
  };
  /**
   * Common getter setter configuration function
   * @param {Object}   proto        A class prototype or an object to config
   * @param {String}   propName     Property name
   * @param {Function} *getter      Getter function for the property
   * @param {Function} *setter      Setter function for the property
   */
  function defineGetterSetter (proto, propName, getter, setter) {
    defineGetterSetterDescriptor.configurable = !!setter;
    getter && (defineGetterSetterDescriptor.get = getter);
    setter && (defineGetterSetterDescriptor.set = setter);
    Object.defineProperty(proto, propName, defineGetterSetterDescriptor);
  }

  var defineValueDescriptor = {
    enumerable: false,
    configurable: true,
    writable: true
  };
  /**
   * Common value configuration function
   * @param {Object}   proto        A class prototype or an object to config
   * @param {String}   propName     Property name
   * @param {*}        *propValue   Property value
   */
  function defineValue (proto, propName, propValue) {
    defineValueDescriptor.value = propValue;
    Object.defineProperty(proto, propName, defineValueDescriptor);
  }

  var defineReadOnlyValueDescriptor = {
    enumerable: false,
    configurable: false,
    writable: false
  };
  /**
   * Common read only value configuration function
   * @param {Object}   proto        A class prototype or an object to config
   * @param {String}   propName     Property name
   * @param {*}        *propValue   Property value
   */
  function defineReadOnlyValue (proto, propName, propValue) {
    defineReadOnlyValueDescriptor.value = propValue;
    Object.defineProperty(proto, propName, defineReadOnlyValueDescriptor);
  }

  function defineProperties (proto, properties) {
    each(properties, function (propValue, propName) {
      if (propValue && (propValue.get || propValue.set)) {
        defineGetterSetter(proto, propName, propValue.get, propValue.set);
      } else {
        defineValue(proto, propName, propValue);
      }
    });
  }

  function defineReadOnlyProperties (proto, properties) {
    each(properties, function (propValue, propName) {
      if (propValue && (propValue.get || propValue.set)) {
        propValue.get && defineGetterSetter(proto, propName, propValue.get);
      } else {
        defineReadOnlyValue(proto, propName, propValue);
      }
    });
  }

  /**
   * Iterate over an object or an array, executing a function for each matched element.
   * @param {Object|Array} obj
   * @param {Function} iterator
   * @param {Object} [context]
   */
  function each (obj, iterator, context) {
    if (!obj)
      return;
    if (isArray(obj)) {
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
  }

  /**
   * Copy all of the properties in source objects to target object and return the target object.
   * @param {Object} target
   * @param {Object} *sources
   * @returns {Object}
   */
  function extend (target) {
    var sources = arguments.length >= 2 ? slice.call(arguments, 1) : [];

    each(sources, function(src) {
      if (src) {
        for (var key in src) {
          if (src.hasOwnProperty(key)) {
            target[key] = src[key];
          }
        }
      }
    });
    return target;
  }

  /**
   * Create a new object and copy all properties in an exist object to the new object
   * @param {Object|Array} obj The source object
   * @return {Array|Object} The created object
   */
  function clone (obj) {
    return isArray(obj) ? obj.slice() : isObject(obj) ? extend({}, obj) : obj;
  }

  function inject (destPrototype, srcPrototype) {
    if (srcPrototype) {
      for (var key in srcPrototype)
        destPrototype[key] = srcPrototype[key];
    }
    return destPrototype;
  }

  function nextTick (fn) {
    return setTimeout(fn, 4);
  }

  /**
   * Check whether the obj is a function
   * @param {*} obj
   * @returns {Boolean}
   */
  function isFunction (obj) {
    return typeof obj === 'function' || Object.prototype.toString.call(obj) === '[object Function]';
  }

  /**
   * Check whether the obj is a number
   * @param {*} obj
   * @returns {Boolean}
   */
  function isNumber (obj) {
    return (typeof obj === 'number' || Object.prototype.toString.call(obj) === '[object Number]') && isFinite(obj);
  }

  /**
   * Check whether the obj is a positive integer
   */
  function isPositiveInteger (obj) {
    return isNumber(obj) && obj > 0 && obj % 1 === 0;
  }

  /**
   * Check whether the obj is a string
   * @param {*} obj
   * @returns {Boolean}
   */
  function isString (obj) {
    return typeof obj === 'string' || Object.prototype.toString.call(obj) === '[object String]';
  }

  /**
   * Check whether the obj is an array
   * @param {*} obj
   * @returns {Boolean}
   */
  function isArray (obj) {
    return typeof obj === 'object' && Object.prototype.toString.call(obj) === '[object Array]';
  }

  /**
   * Check whether the obj is undefined
   * @param {*} obj
   * @returns {Boolean}
   */
  function isUndefined (obj) {
    return obj === void 0;
  }

  /**
   * Check whether the obj is an object
   * @param {*} obj
   * @returns {Boolean}
   */
  function isObject (obj) {
    return typeof obj === 'object' && Object.prototype.toString.call(obj) === '[object Object]';
  }

  /**
   * Check whether the obj is a valid date
   * @param {*} obj
   * @returns {Boolean}
   */
  function isDate (obj) {
    return (obj instanceof Date || Object.prototype.toString.call(obj) === '[object Date]') && !isNaN(obj.getTime());
  }

  /**
   * Check whether the instance is instanceof construct
   * @param {*} instance
   * @param {Function} construct
   * @returns {Boolean}
   */
  function isInstanceof (instance, construct) {
    return isFunction(construct) && instance instanceof construct;
  }

  function zeroFill (number, targetLength) {
    var absNumber = '' + Math.abs(number),
        zerosToFill = targetLength - absNumber.length,
        sign = number >= 0;
    return (sign ? '' : '-') + Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) + absNumber;
  }

  var formattingTokens = /(MM?|dd?|YYYY|YY|yyyy|yy|hh?|HH?|mm?|ss?|.)/g;
  var formatTokenFunctions = {};

  function addFormatToken (token, padded, callback) {
    var func = callback;
    if (isString(callback)) {
      func = function() {
        return this[callback]();
      };
    }
    if (token) {
      formatTokenFunctions[token] = func;
    }
    if (padded) {
      formatTokenFunctions[padded[0]] = function() {
        return zeroFill(func.apply(this, arguments), padded[1]);
      };
    }
  }

  addFormatToken(0, ['YY', 2], function() {
    return this.getFullYear() % 100;
  });
  addFormatToken(0, ['YYYY', 4], function() {
    return this.getFullYear();
  });
  addFormatToken(0, ['yy', 2], function() {
    return this.getFullYear() % 100;
  });
  addFormatToken(0, ['yyyy', 4], function() {
    return this.getFullYear();
  });
  addFormatToken('M', ['MM', 2], function() {
    return this.getMonth() + 1;
  });
  addFormatToken('d', ['dd', 2], function() {
    return this.getDate();
  });
  addFormatToken('h', ['hh', 2], function() {
    return this.getHours();
  });
  addFormatToken('H', ['HH', 2], function() {
    return this.getHours();
  });
  addFormatToken('m', ['mm', 2], function() {
    return this.getMinutes();
  });
  addFormatToken('s', ['ss', 2], function() {
    return this.getSeconds();
  });

  function makeFormatFunction (format) {
    var array = format.match(formattingTokens),
      i, length;

    for (i = 0, length = array.length; i < length; i++) {
      if (formatTokenFunctions[array[i]]) {
        array[i] = formatTokenFunctions[array[i]];
      }
    }

    return function (date) {
      var output = '';
      for (i = 0; i < length; i++) {
        output += isFunction(array[i]) ? array[i].call(date, format) : array[i];
      }
      return output;
    };
  }

  function transform__transform_date_to_specified_format (date, format) {
    if (isDate(date)) {
      return makeFormatFunction(format)(date);
    }
    return '';
  }

  /**
   * Add specified parameters
   * @param  {Function} func
   * @return {Function}
   */
  function create_create_assigner (func) {
    var args = slice.call(arguments, 1);
    return function () {
      return func.apply(null, args.concat(slice.call(arguments)));
    };
  }

  /**
   * Transform a object to specified type, if not return a default value.
   * @param  {Object} obj
   * @param  {String} *type
   * @return {Object}
   */
  function transform__transform_obj_to_specified_type (obj, type) {
    switch (type) {
      case 'String':
        !isString(obj) && (obj = '');
        break;
      case 'Number':
        !isNumber(obj) && (obj = 0);
        break;
      default:
        break;
    }
    return obj;
  }

  /**
   * An internal function for creating assigner functions.
   * Used to return the value of private property.
   * @param  {String}   propName  The private attribute name of the obj
   * @param  {Function} *transform  Indicate how to returns the attribute value
   * @param  {String}   *type  The primitive type of the value
   * @return {Function}
   */
  function create__create_prop_assigner (propName, transform, type) {
    if (jsf.isFunction(transform)) {
      return type ? function () {
        return transform.call(this, transform__transform_obj_to_specified_type(this[propName], type));
      } : function () {
        return transform.call(this, this[propName]);
      };
    }
    return type ? function () {
      return transform__transform_obj_to_specified_type(this[propName], type);
    } : function () {
      return this[propName];
    };
  }

  global.extend = extend;
  global.clone = clone;
  global.inject = inject;
  global.nextTick = nextTick;
  global.isFunction = isFunction;
  global.isNumber = isNumber;
  global.isString = isString;
  global.isArray = Array.isArray || isArray;
  global.isUndefined = isUndefined;
  global.isObject = isObject;
  global.isDate = isDate;
  global.isInstanceof = isInstanceof;
  global.defineGetterSetter = defineGetterSetter;
  global.defineValue = defineValue;
  global.defineReadOnlyValue = defineReadOnlyValue;
  global.defineProperties = defineProperties;
  global.defineReadOnlyProperties = defineReadOnlyProperties;
  global.zeroFill = zeroFill;
  global.dateFormat = transform__transform_date_to_specified_format;
  global.createAssigner = create_create_assigner;
  global.createPropAssigner = create__create_prop_assigner;
  global.transformToSpecifiedType = transform__transform_obj_to_specified_type;
}));