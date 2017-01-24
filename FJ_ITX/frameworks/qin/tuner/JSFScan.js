/**
 * JSFScan.js
 * @authors Casper 
 * @date    2016/08/01
 * @version 1.0.0
 */
/**
 * jsf.Scan is a global object.
 * @requires jsf.Tuner
 */
(function() {
  'use strict';
  /**
   * The type of scan.
   * @constant
   * @type {String}
   */
  var Types = {
    TYPE_ALL: 'allFrequency',
    TYPE_SINGLE: 'single',
    TYPE_REGION: 'region',
    TYPE_NIT: 'nitAuto',
    TYPE_BAT: 'batAuto'
  };
  /**
   * The mthods of jsf.Scan.
   * @constant
   * @type {Function}
   */
  var Methods = {
    full: scan__scan_by_full_frequency,
    single: scan__scan_by_single_frequency,
    region: scan__scan_by_region_frequency,
    nit: scan__scan_by_nit,
    bat: scan__scan_by_bat,
    start: start,
    stop: function () {qin.scan.cancel();},
    listener: addListener,
    removeListener: removeListener
  };

  function vaild (obj, ts) {
    var pass = true;
    jsf.each(obj, function (value, key) {
      if ((!value || jsf.isUndefined(ts[value])) && jsf.isUndefined(ts[key])) return (jsf.error('jsf.Scan vaild: ' + (value || key) + ' must have value'), pass = false);
      obj[key] = ts[value || key];
    });
    return pass;
  }

  function scan (opts) {
    jsf.log('jsf.Scan opts:' + (opts = JSON.stringify(opts)));
    qin.scan.start(opts);
  }

  /**
   * Start scan according to the corresponding parameters.
   * @param  {String} scanType  re.Types
   * @param  {Array<jsf.TS like>} tsArray
   */
  function start (scanType, tsArray) {
    if (!scanType || !tsArray || tsArray.length === 0) return;
    switch (scanType) {
      case Types.TYPE_ALL:
        scan__scan_by_full_frequency(tsArray[0].type);
        break;
      case Types.TYPE_SINGLE:
        scan__scan_by_single_frequency(tsArray[0]);
        break;
      case Types.TYPE_REGION:
        scan__scan_by_region_frequency(tsArray[0], tsArray[1] ? tsArray[1].frequency : tsArray[0].frequency);
        break;
      case Types.TYPE_NIT:
        scan__scan_by_nit(tsArray[0]);
        break;
      case Types.TYPE_BAT:
        scan__scan_by_bat(tsArray[0]);
        break;
    }
  }

  /**
   * Search according to the specified parameters.
   * @param  {String} type  re.Types
   * @param  {jsf.TS like} ts
   */
  function scan__scan_by_opts (type, ts) {
    if (!type || !ts) return;
    var request;
    if (!vaild(request = {
      networkType: 'type',
      frequency: false,
      symbolRate: false,
      modulation: false
    }, ts)) return;
    request.scanType = type;
    request.networkType !== jsf.Tuner.DVB_C && (request.polarization = ts.polarization || jsf.Tuner.POLARIZATION_HORIZONTAL);
    scan(request);
  }

  /**
   * Full frequency point search.
   * @param  {String} networkType  Values of jsf.Tuner.DVB_C or jsf.Tuner.DVB_S or jsf.Tuner.DVB_T
   */
  function scan__scan_by_full_frequency (networkType) {
    if (!networkType) return;
    scan({
      scanType: Types.TYPE_ALL,
      networkType: networkType
    });
  }

  /**
   * Single frequency point search.
   * @param  {jsf.TS like} ts
   */
  function scan__scan_by_single_frequency (ts) {
    scan__scan_by_opts(Types.TYPE_SINGLE, ts);
  }

  /**
   * Regional search.
   * @param  {jsf.TS like} ts
   * @param  {Number} *extendFrequency  If the value is not passed, then use the extendFrequency of ts or the frequency of ts
   */
  function scan__scan_by_region_frequency (ts, extendFrequency) {
    if (!ts) return;
    var request;
    if (!vaild(request = {
      networkType: 'type',
      frequency: false,
      symbolRate: false,
      modulation: false
    }, ts)) return;
    request.scanType = Types.TYPE_SINGLE;
    request.extendFrequency = extendFrequency || ts.extendFrequency || ts.frequency;
    request.networkType !== jsf.Tuner.DVB_C && (request.polarization = ts.polarization || jsf.Tuner.POLARIZATION_HORIZONTAL);
    scan(request);
  }

  /**
   * Nit search.
   * @param  {jsf.TS like} ts
   */
  function scan__scan_by_nit (ts) {
    scan__scan_by_opts(Types.TYPE_NIT, ts);
  }

  /**
   * Bat search.
   * @param  {jsf.TS like} ts
   */
  function scan__scan_by_bat (ts) {
    scan__scan_by_opts(Types.TYPE_BAT, ts);
  }

  var listeners = [];
  jsf.eventManager.addListener({
    event: jsf.EventListener.SYSTEM,
    eventType: jsf.EventSystem.TYPE_SCAN,
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

  var JSFScan = {};
  jsf.defineReadOnlyProperties(JSFScan, Types);
  jsf.defineReadOnlyProperties(JSFScan, Methods);

  jsf.Scan = JSFScan;
}());