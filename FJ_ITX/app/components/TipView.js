/**
 * Tip.js
 * @authors Casper
 * @date    2015/07/14
 * @version 1.0.0
 */
define(function(require, exports, module) {
  module.exports = Backbone.View.extend({
    initialize: function(options) {
      this.hide = true;
      this.hideBySelf = true;
      this.outClass = 'fadeOut';
      this.inClass = 'fadeIn';
      this.timer = null;
      this.duration = 0;
      this.defaultDuration = 2000;
      this.ensureSelf(options);
      var self = this;
      this.el.addEventListener('webkitAnimationEnd', function() {
        if (event.target === this) {
          if (event.animationName === self.inClass) {
            self._timing();
            self.afterIn();
          } else if (event.animationName === self.outClass) {
            self.afterOut();
          }
        }
      });
    },
    ensureSelf: function(options) {},
    beforeOut: function() {},
    out: function() {
      this.beforeOut();
      if (!this.hide) {
        this.el.classList.remove(this.inClass);
        this.el.classList.add(this.outClass);
        this.hide = true;
      }
    },
    afterOut: function() {},
    beforeIn: function() {},
    in : function() {
      this.beforeIn();
      if (this.hide) {
        this.el.classList.remove(this.outClass);
        this.el.classList.add(this.inClass);
        this.hide = false;
      }
    },
    afterIn: function() {},
    show: function() {
      this._show.apply(this, Array.prototype.slice.call(arguments));
      this.hide ? this.in() : this._timing();
    },
    _timing: function() {
      clearTimeout(this.timer);
      if (this.hideBySelf) {
        var self = this;
        this.timer = setTimeout(function() {
          self.out();
        }, this.duration || this.defaultDuration);
      }
    },
    _show: function() {}
  });
});