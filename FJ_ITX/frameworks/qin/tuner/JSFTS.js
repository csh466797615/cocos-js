/**
 * JSFTS.js
 * @authors Casper 
 * @date    2016/08/01
 * @version 1.0.0
 */
/**
 * Used to describe a ts information.
 * @requires jsf.Tuner
 */
(function() {
  'use strict';
  /**
   * Description of a ts information.
   * @class
   * @extends jsf.Class
   */
  var JSFTS = jsf.Class.extend({
    ctor: function(data) {
      jsf.each(data, (function(value, key) {
        this[key] = value;
      }).bind(this));
    },
    lock: function() {
      jsf.Tuner.lock(this);
    },
    unlock: function() {
      jsf.Tuner.unlock(this);
    },
    getStatus: function() {
      var status = jsf.Tuner.getStatus(this);
      var info;
      for (var i = 0, j = status.length; i < j; i++) {
        info = status[i];
        if (this.type === info.networkType && this.frequency === Number(info.frequency) && this.symbolRate === Number(info.symbolrate) && this.modulation === info.qam) return info;
      }
      return {
        status: 'unlock'
      };
    },
    getInfo: function() {
      var info = {
        networkType: this.type,
        frequency: this.frequency,
        symbolRate: this.symbolRate,
        modulation: this.modulation
      };
      this.type !== jsf.Tuner.DVB_C && (info.polarization = this.polarization);
      return info;
    }
  });
  var tsPrototype = JSFTS.prototype;

  var __temp;
  jsf.each({
    type: {value: jsf.Tuner.DVB_C},
    frequency: {value: 0},
    symbolRate: {value: 0},
    modulation: {value: jsf.Tuner.MODULATION_QAM64},
    polarization: {value: ''} // not use for DVB_C
  }, function (prop, propName) {
    jsf.defineValue(tsPrototype, propName, prop.value);
  });

  jsf.TS = JSFTS;
}());