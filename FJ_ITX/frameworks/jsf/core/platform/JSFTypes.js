/**
 * JSFType.js
 * @authors Casper 
 * @date    2015/09/16
 * @version 1.0.0
 */
/**
 * Point class
 * @param  {Number} x
 * @return {Number} y
 */
jsf.Point = function(x, y) {
  this.x = x;
  this.y = y;
};

jsf.point = function(obj) {
  if (arguments.length === 1) {
    var obj = arguments[0];
    if (obj instanceof MouseEvent) {
      if (obj.pageX || obj.pageY)
        return {
          x: obj.pageX,
          y: obj.pageY
        };
      return {
        x: obj.clientX + document.body.scrollLeft - document.body.clientLeft,
        y: obj.clientY + document.body.scrollTop - document.body.clientTop
      };
    } else if (obj) {
      return {
        x: obj.x || 0,
        y: obj.y || 0
      };
    }
  } else if (arguments.length === 2) {
    return {
      x: arguments[0],
      y: arguments[1]
    };
  } else {
    return {
      x: 0,
      y: 0
    };
  }
};