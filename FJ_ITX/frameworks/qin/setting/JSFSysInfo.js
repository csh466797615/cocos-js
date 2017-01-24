/**
 * JSFSysInfo.js
 * @authors Casper 
 * @date    2016/07/14
 * @version 1.0.0
 */
/**
 * jsf.SysInfo is a global object.
 */
(function() {
  'use strict';
  /**
   * The mthods of jsf.Setting.
   * @type {Function}
   */
  var Methods = {
    set: setter,
    get: getter
  };

  function setter (key, value) {
    if (!jsf.isString(key)) return;
    if (key.indexOf('sys:') > -1) {
      // No use
      // qin.settings.set(key, value === void 0 ? '' : value);
    } else {
      qin.data.setSystem(key, value === void 0 ? '' : value);
    }
  }

  function getter (key) {
    if (!jsf.isString(key)) return;
    if (key.indexOf('sys:') > -1) {
      return JSON.parse(qin.settings.get(key));
    } else {
      return qin.data.getSystem(key);
    }
  }

  var infoArray = ['serNo', 'hwVer', 'swVer', 'cfeVer', 'loaderVer', 'kernelVer', 'qinVer', 'qinAPIVer', 'swDate', 'cpu', 'ramSize', 'flashSize', 'hdcp', 'mac', 'sysVer'];
  var infoValues = qin.settings.get('sys:info:' + infoArray.toString());
  if (infoValues) {
    try {
      infoValues = JSON.parse(infoValues);
    } catch (e) {
      jsf.error(e + '(JSFSysInfo initialize)');
    }
  } else {
    infoValues = {};
  }

  var JSFSysInfo = {};
  jsf.each(infoArray, function (key) {
    jsf.defineValue(JSFSysInfo, key, infoValues[key] === void 0 ? '' : infoValues[key]);
  });
  jsf.defineReadOnlyProperties(JSFSysInfo, Methods);

  jsf.SysInfo = JSFSysInfo;
}());