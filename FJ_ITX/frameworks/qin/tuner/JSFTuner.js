/**
 * JSFTuner.js
 * @authors Casper 
 * @date    2016/08/01
 * @version 1.0.0
 */
/**
 * jsf.Tuner is a global object.
 */
(function() {
  'use strict';
  /**
   * The network type of tuner.
   * @constant
   * @type {String}
   */
  var NetworkTypes = {
    DVB_C: 'cable',
    DVB_S: 'satellite',
    DVB_T: 'terrestrial',
  };
  /**
   * The modulation type of tuner.
   * @constant
   * @type {String}
   */
  var Modulations = {
    MODULATION_QAM16: 'qam16',
    MODULATION_QAM32: 'qam32',
    MODULATION_QAM64: 'qam64',
    MODULATION_QAM128: 'qam128',
    MODULATION_QAM256: 'qam256',
    MODULATION_QAM512: 'qam512',
    MODULATION_QAM1024: 'qam1024',
    MODULATION_APSK: 'apsk',
    MODULATION_8QPSK: '8qpsk'
  };
  /**
   * The polarization type of tuner.
   * Not use for DVB_C.
   * For DVB_S is delivery polarization type.
   * For DVB_T is transmission mode.
   * @constant
   * @type {String}
   */
  var Polarizations = {
    POLARIZATION_HORIZONTAL: 'horizontal',
    POLARIZATION_VERTICAL: 'vertical'
  };
  /**
   * The mthods of jsf.Tuner.
   * @type {Function}
   */
  var Methods = {
    lock: lock,
    unlock: unlock,
    getStatus: getter__get_sutatus,
    listener: addListener,
    removeListener: removeListener
  };

  function vaild (obj, ts) {
    var pass = true;
    jsf.each(obj, function (value, key) {
      if ((!value || jsf.isUndefined(ts[value])) && jsf.isUndefined(ts[key])) return (jsf.error('jsf.Tuner vaild: ' + (value || key) + ' must have value'), pass = false);
      obj[key] = ts[value || key];
    });
    return pass;
  }

  /**
   * Lock specified frequency point.
   * @param  {jsf.TS like} ts
   */
  function lock (ts) {
    if (!ts) return;
    var request;
    if (!vaild(request = {
      networkType: 'type',
      frequency: false,
      symbolRate: false,
      modulation: false
    }, ts)) return;
    request.networkType !== NetworkTypes.DVB_C && (request.polarization = ts.polarization || Polarizations.POLARIZATION_HORIZONTAL);
    jsf.log('jsf.Tuner lock:' + (request = JSON.stringify(request)));
    qin.tuner.lock(request);
  }

  /**
   * Unlock specified frequency point.
   * @param  {jsf.TS like} ts
   */
  function unlock (ts) {
    if (!ts) return;
    var request;
    if (!vaild(request = {
      networkType: 'type',
      frequency: false
    }, ts)) return;
    request.networkType !== NetworkTypes.DVB_C && (request.polarization = ts.polarization || Polarizations.POLARIZATION_HORIZONTAL);
    jsf.log('jsf.Tuner unlock:' + (request = JSON.stringify(request)));
    qin.tuner.unlock(request);
  }

  /**
   * Gets the tuner parameter for the specified condition.
   * @param  {jsf.TS like} *ts
   * @return {Array}
   */
  function getter__get_sutatus (ts) {
    if (!ts) return JSON.parse(qin.tuner.getStatus({networkType: 'all'}));
    var request;
    if (!vaild(request = {
      networkType: 'type',
      frequency: false
    }, ts)) return;
    request.networkType !== NetworkTypes.DVB_C && (request.polarization = ts.polarization || Polarizations.POLARIZATION_HORIZONTAL);
    jsf.log('jsf.Tuner status:' + (request = JSON.stringify(request)));
    return JSON.parse(qin.tuner.getStatus(request));
  }

  var listeners = [];
  jsf.eventManager.addListener({
    event: jsf.EventListener.SYSTEM,
    eventType: jsf.EventSystem.TYPE_TUNER,
    callback: function (event) {
      jsf.each(listeners, function (listener) {
        listener.callback.call(listener.context, event.getEventName(), event.getEventData());
      });
    }
  }, new jsf.Class());
  
  /**
   * Add a listener.
   * @param {Function} listener
   * @param {Object} *context
   */
  function addListener (listener, context) {
    listeners.push({
      callback: listener,
      context: context
    });
  }

  /**
   * Remove the previous listener.
   * @param {Function} *listener
   */
  function removeListener (listener) {
    if (listener) {
      for (var i = 0, j = listeners.length; i < j; i++) {
        if (listeners[i].callback === listener) {
          listeners.splice(i, 1);
          break;
        }
      }
    } else {
      listeners.length = 0;
    }
  }

  var JSFTuner = {};
  jsf.defineReadOnlyProperties(JSFTuner, NetworkTypes);
  jsf.defineReadOnlyProperties(JSFTuner, Modulations);
  jsf.defineReadOnlyProperties(JSFTuner, Polarizations);
  jsf.defineReadOnlyProperties(JSFTuner, Methods);

  jsf.Tuner = JSFTuner;
}());