/**
 * JSFProgram.js
 * @authors Casper 
 * @date    2016/07/01
 * @version 1.0.0
 */
/**
 * Used to describe a program information.
 * @requires jsf.ChannelManage
 */
(function () {
  'use strict';
  /**
   * Converts an object to a date.
   * @param  {*} date  An object 
   * @return {*}
   */
  function program_date__convert (date) {
    return jsf.isString(date) ? new Date(date.replace(/-/g, '/')) : date;
  }

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
   * Description of a program information.
   * @class
   * @extends jsf.Class
   */
  var JSFProgram = jsf.Class.extend({
    ctor: function (data) {
      jsf.each(data, (function (value, key) {
        setter__get_info_from_data(this, value, key);
      }).bind(this));
    },
    /**
     * Get the channel by the program.
     * @return {jsf.Channel|Null}
     */
    getChannel: function () {
      var channelList = jsf.ChannelManage.getChannelList([jsf.ChannelManage.FILTER_KEY_CHANNELTYPE, jsf.ChannelManage.FILTER_KEY_CHANNELTYPE], [jsf.Channel.TYPE_TV, jsf.Channel.TYPE_RADIO], 0);
      var channel;
      for (var i = 0; i < channelList.length; i++) {
        channel = channelList.get(i);
        if (channel.serviceId === this.serviceId && channel.tsId === this.tsId) {
          return channel;
        }
      }
      return null;
    }
  });
  var programPrototype = JSFProgram.prototype;

  var __temp;
  jsf.each({
    name: {value: '', transform: function () {return jsf.EPG.language && (jsf.EPG.language === this._languageLocal && this._eventNameLocal || jsf.EPG.language === this._languageSecond && this._eventNameSecond) || this._eventNameLocal || this._eventNameSecond || this._eventName;}},
    startTime: {value: '', transform: function (value) {return new Date(value.replace(/-/g, '/'));}, aliase: 'startDateTime'},
    endTime: {value: '', transform: function (value) {return new Date(value.replace(/-/g, '/'));}, aliase: 'endDateTime'},
    description: {value: '', transform: function () {return jsf.EPG.language && (jsf.EPG.language === this._languageLocal && this._contentLocal || jsf.EPG.language === this._languageSecond && this._contentSecond) || this._contentLocal || this._contentSecond || this._content;}},
    frequency: {value: 0},
    serviceId: {value: 0},
    tsId: {value: 0},
    networkId: {value: 0},
    seriesKey: {type: 'String', value: '', aliase: 'extendString'},
    episodeKey: {value: 0, aliase: 'extendNumber1'},
    episodeStatus: {value: 0, aliase: 'extendNumber2'},
    episodeLast: {value: 0, aliase: 'extendNumber3'},
    parentRating: {value: 0},
    isRemindBooking: {value: false},
    isPvrBooking: {value: false}
  }, function (prop, propName) {
    __temp = '_' + (prop.aliase || propName);
    jsf.defineValue(programPrototype, __temp, prop.value);
    jsf.defineGetterSetter(programPrototype, propName, jsf.createPropAssigner(__temp, prop.transform, prop.type));
  });

  jsf.Program = JSFProgram;
}());