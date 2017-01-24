/**
 * Broadcast.js
 * @authors Casper
 * @date    2015/07/10
 * @version 1.0.0
 */
define([], function(require, exports, module) {
  var model = new Backbone.Model();
  return {
    on: function() {
      model.on.apply(model, arguments);
    },
    off: function() {
      model.off.apply(model, arguments);
    },
    trigger: function() {
      jsf.log.d('[Broadcast] trigger ' + arguments[0]);
      model.trigger.apply(model, arguments);
    }
  };
});