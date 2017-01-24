/**
 * JSFChannelList.js
 * @authors Casper 
 * @date    2016/07/04
 * @version 1.0.0
 */
/**
 * A collection of jsf.Channel.
 * @requires jsf.Channel
 */
(function() {
  'use strict';
  /**
   * Sort types.
   * @constant
   * @type {String}
   */
  var Sorts = {
    SORTKEY_SERVICE: 'serviceId',
    SORTKEY_TS: 'tsId',
    SORTKEY_LOGIC: 'logicNumber',
    SORTKEY_NUMBER: 'number',
    SORTKEY_NAME: 'name',
    SORTKEY_TYPE: 'type'
  };
  /**
   * The mthods of jsf.ChannelList.
   * @constant
   * @type {Function}
   */
  var Methods = {
    get: create__create_assigner(getter__get_by_cursor),
    getByLogicNumber: create__create_assigner(getter__get_by_logic),
    getByNumber: create__create_assigner(getter__get_by_number),
    getByServiceId: create__create_assigner(getter__get_by_service_id),
    delete: create__create_assigner(delete__delete_by_cursor),
    find: create__create_assigner(getter__get_cursor_by_channel),
    sort: function (sortKey, sortType) {
      // Default value of sortType is jsf.SORT_ASC.
      this._sortInfo = {
        sortKey: sortKey,
        sortType: sortType === jsf.SORT_DESC ? jsf.SORT_DESC : jsf.SORT_ASC
      };
      this._channels = slice.call(this._origin);
      sort__sort_channels_by_opt(this._channels, this._sortInfo.sortKey, this._sortInfo.sortType);
    },
    swap: create__create_assigner(setter__swap_places)
  };

  var slice = Array.prototype.slice;
  function create__create_assigner (func) {
    return function () {
      return func.apply(this, [this._channels].concat(slice.call(arguments)));
    };
  }

  /**
   * Gets a channel based on the specified index.
   * @param  {Array<jsf.Channel>} channels
   * @param  {Number} cursor
   * @return {jsf.Channel}
   */
  function getter__get_by_cursor (channels, cursor) {
    if (cursor >= 0 && cursor < channels.length) {
      return channels[cursor];
    }
    return null;
  }

  /**
   * Gets a channel based on the specified attribute value.
   * @param  {Array<jsf.Channel>} channels
   * @param  {Number} cursor
   * @return {jsf.Channel}
   */
  function getter__get_by_specified_attribute_value (channels, attribute, value) {
    var channel = null;
    for (var i = 0, j = channels.length; i < j; i++) {
      if (channels[i][attribute] === value) {
        channel = channels[i];
        break;
      }
    }
    return channel;
  }

  /**
   * Gets a channel based on the specified logic number.
   * @param  {Array<jsf.Channel>} channels
   * @param  {Number} logicNumber
   * @return {jsf.Channel}
   */
  function getter__get_by_logic (channels, logicNumber) {
    return getter__get_by_specified_attribute_value(channels, 'logicNumber', logicNumber);
  }

  /**
   * Gets a channel based on the specified number.
   * @param  {Array<jsf.Channel>} channels
   * @param  {Number} number
   * @return {jsf.Channel}
   */
  function getter__get_by_number (channels, number) {
    return getter__get_by_specified_attribute_value(channels, 'number', number);
  }

  /**
   * Gets a channel based on the specified service id.
   * @param  {Array<jsf.Channel>} channels
   * @param  {Number} serviceId
   * @return {jsf.Channel}
   */
  function getter__get_by_service_id (channels, serviceId) {
    return getter__get_by_specified_attribute_value(channels, 'serviceId', serviceId);
  }

  /**
   * Gets the cursor of a specified channel.
   * @param  {Array<jsf.Channel>} channels
   * @param  {jsf.Channel} channel
   * @return {Number}
   */
  function getter__get_cursor_by_channel (channels, channel, equal) {
    var cursor = -1;
    if (jsf.isInstanceof(channel, jsf.Channel)) {
      var tmp;
      for (var i = 0, j = channels.length; i < j; i++) {
        tmp = channels[i];
        if (equal ? tmp === channel : channel.symbolRate === tmp.symbolRate && channel.modulation === tmp.modulation && channel.frequency === tmp.frequency && channel.networkId === tmp.networkId && channel.tsId === tmp.tsId && channel.serviceId === tmp.serviceId) {
          cursor = i;
          break;
        }
      }
    }
    return cursor;
  }

  /**
   * Deletes a channel based on the specified index.
   * @param  {Array<jsf.Channel>} channels
   * @param  {Number} cursor
   * @return {Boolean}
   */
  function delete__delete_by_cursor (channels, cursor) {
    if (cursor >= 0 && cursor < channels.length) {
      channels.splice(cursor, 1);
      return true;
    }
    return false;
  }

  /**
   * Sorts the channels based on the specified rule.
   * @param  {Array<jsf.Channel>} channels
   * @param  {String} sortKey
   * @param  {Number} *sortType  Default value is jsf.SORT_ASC
   */
  function sort__sort_channels_by_opt (channels, sortKey, sortType) {
    var less = sortType === jsf.SORT_DESC ? 1 : -1;
    var greater = sortType === jsf.SORT_DESC ? -1 : 1;
    var tmpA, tmpB;
    channels.sort(function (a, b) {
      tmpA = a[sortKey];
      tmpB = b[sortKey];
      return tmpA === tmpB ? -1 : tmpA < tmpB ? less : greater;
    });
  }

  function setter__swap_places (channels, cursorA, cursorB) {
    var length = channels.length;
    if (cursorA < 0 || cursorB < 0 || cursorA >= length || cursorB >= length || cursorA === cursorB) return;
    var channelA = channels[cursorA];
    var channelB = channels[cursorB];
    channels[cursorA] = channelB;
    channels[cursorB] = channelA;
    jsf.ChannelManager.swap(channelA, channelB);
  }

  /**
   * Description of a channel collection.
   * @class
   * @extends jsf.Class
   */
  var JSFChannelList = jsf.Class.extend({
    _channels: null,
    ctor: function(channels, sortInfo) {
      this._sortType = sortInfo || {
        sortKey: 'unknown',
        sortType: 'unknown'
      };
      this._origin = channels || [];
      this._channels = slice.call(this._origin);
    }
  });
  var channelListPrototype = JSFChannelList.prototype;
  jsf.each({
    length: {value: 0, transform: function () {return this._channels.length;}},
    sortInfo: {value: null}
  }, function (prop, propName) {
    jsf.defineGetterSetter(channelListPrototype, propName, jsf.createPropAssigner('_' + propName, prop.transform));
  });
  jsf.defineReadOnlyProperties(channelListPrototype, Methods);
  jsf.defineReadOnlyProperties(JSFChannelList, Sorts);

  jsf.ChannelList = JSFChannelList;
}());