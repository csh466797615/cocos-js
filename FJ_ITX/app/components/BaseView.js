/**
 * Created by Casper on 2015/4/21.
 */
define(function(require, exports, module) {
  module.exports = Backbone.View.extend({
    initialize: function(options) {
      this.outClass = 'fadeOut';
      this.inClass = 'fadeIn';
      this.outClassNoAnimation = 'fadeOut-cancel';
      this.inClassNoAnimation = 'fadeIn-cancel';
      this.ensureSelf(options);
    },
    ensureSelf: function(options) {},
    beforeOut: function() {},
    out: function(cancalAnimation) {
      this.beforeOut(cancalAnimation);
      this.el.classList.remove(this.inClass);
      this.el.classList.remove(this.inClassNoAnimation);
      this.el.classList.add(cancalAnimation ? this.outClassNoAnimation : this.outClass);
    },
    afterOut: function() {},
    beforeIn: function(options) {},
    in : function(options, cancalAnimation) {
      this.el.classList.remove(this.outClass);
      this.el.classList.remove(this.outClassNoAnimation);
      this.el.classList.add(cancalAnimation ? this.inClassNoAnimation : this.inClass);
      this.beforeIn(options, cancalAnimation);
    },
    afterIn: function() {}
  });
});