/**
 * JSFUpdate.js
 * @authors Casper 
 * @date    2016/08/03
 * @version 1.0.0
 */
/**
 * jsf.Update is a global object.
 * @requires jsf.Ts, jsf.Tuner
 */
(function() {
  'use strict';
  /**
   * The mthods of jsf.Update.
   * @type {Function}
   */
  var Methods = {
    start: start,
    userSelect: user_select
  };

  function vaild (obj, ts) {
    var pass = true;
    jsf.each(obj, function (value, key) {
      if ((!value || jsf.isUndefined(ts[value])) && jsf.isUndefined(ts[key])) return (jsf.error('jsf.Update vaild: ' + (value || key) + ' must have value'), pass = false);
      obj[key] = ts[value || key];
    });
    return pass;
  }

  /**
   * Manual trigger OTA upgrade according to the corresponding parameters.
   * @param  {Object} params
   *   networkType: the network type
   *   frequency: delivery frequency
   *   symbolRate: delivery symbolrate
   *   modulation: delivery qam modulation type
   *   polarization: not use for dvb-c, for dvb-s is delivery polarization type, for dvb-t is transmission mode
   *   pid: the pid of update stream
   *   tableId: the table Id of update stream
   *   maxSectionNum: max section number of update data
   *   maxLength: max length of update data
   * @return {Boolean}
   */
  function start (params) {
    if (!params) return false;
    var request;
    jsf.isInstanceof(params.ts, jsf.TS) && jsf.inject(params, params.ts.getInfo());
    if (!vaild(request = {
      networkType: 'type',
      frequency: false,
      symbolRate: false,
      modulation: false,
      pid: false,
      tableId: false,
      maxSectionNum: false,
      maxLength: false
    }, params)) return false;
    request.networkType !== jsf.Tuner.DVB_C && (request.polarization = params.polarization || jsf.Tuner.POLARIZATION_HORIZONTAL);
    jsf.log('jsf.Update opts:' + (request = JSON.stringify(request)));
    return !qin.update.menuStart(request);
  }

  /**
   * User select status in OTA upgrade
   * @param  {Number} status  0: user cancel the OTA upgrade, 1: user select the OTA upgreade
   * @return {Boolean}
   */
  function user_select (status) {
    if (status !== 0 && status !== 1) return false;
    return !qin.update.userSelect(status);
  }

  var JSFUpdate = {};
  jsf.defineReadOnlyProperties(JSFUpdate, Methods);

  jsf.Update = JSFUpdate;
}());