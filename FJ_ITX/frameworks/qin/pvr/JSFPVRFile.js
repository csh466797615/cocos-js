/**
 * JSFPVRFile.js
 * @authors Casper 
 * @date    2016/08/03
 * @version 1.0.0
 */
/**
 * Used to describe a PVR file information.
 */
(function () {
  'use strict';
  /**
   * Sets a property from  a key-vlaue data for obj.
   * @param  {Object} obj
   * @param  {*} value
   * @param  {String} key
   */
  function setter__get_info_from_data (obj, value, key) {
    obj['_' + key] = value;
  }

  /**
   * Description of a pvr file information.
   * @class
   * @extends jsf.Class
   */
  var JSFPVRFile = jsf.Class.extend({
    ctor: function(data) {
      jsf.each(data, (function(value, key) {
        setter__get_info_from_data(this, value, key);
      }).bind(this));
    }
  });
  var pvrFilePrototype = JSFPVRFile.prototype;

  var __temp;
  jsf.each({
    logicNumber: {value: ''},
    channelName: {value: ''},
    programName: {value: ''},
    startTime: {value: '', transform: function (value) {return new Date(value.replace(/-/g, '/'));}},
    duration: {value: 0},
    url: {value: ''},
    fileSystem: {value: ''},
    recFlag: {value: 0},
    quality: {value: ''},
    frequency: {value: 0},
    serviceId: {value: 0},
    tsId: {value: 0},
    networkId: {value: 0, aliase: 'netWorkId'},
    encryption: {value: ''},
    rating: {value: 0, aliase: 'level'},
    size: {value: 0},
    bookMark: {value: 0},
    description: {value: '', aliase: 'epgContent'},
    seriesKey: {value: ''},
    episodeKey: {value: 0},
    auPidIndex: {value: 0},
    auPidNum: {value: 0},
    audioPidInfo: {value: []},
    isRead: {value: false, transform: function (value) {return !!value;}}
  }, function (prop, propName) {
    __temp = '_' + (prop.aliase || propName);
    jsf.defineValue(pvrFilePrototype, __temp, prop.value);
    jsf.defineGetterSetter(pvrFilePrototype, propName, jsf.createPropAssigner(__temp, prop.transform));
  });

  jsf.PVRFile = JSFPVRFile;
}());