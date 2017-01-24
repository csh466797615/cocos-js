/**
 * JSFEPG.js
 * @authors Casper 
 * @date    2016/07/01
 * @version 1.0.0
 */
/**
 * jsf.EPG is a global object.
 * @requires jsf.SysInfo, jsf.Setting, jsf.Program
 */
(function () {
  'use strict';
  /**
   * The mthods of jsf.EPG.
   * @type {Function}
   */
  var Methods = {
    requestSchedule: request__request_schedule,
    getSchedule: getter__get_schedule_by_channel,
    requestPF: request__request_pf,
    getPF: getter__get_pf_by_channel,
    cancel: cancel,
    changeLanguage: function (language) {this._language = language === void 0 ? null : language;},
    addListener: addListener,
    removeListener: removeListener
  };
  /**
   * Print information.
   * @type {String}
   */
  var LogInfos = {
    error__sql_query: 'Query error.(jsf.EPG)'
  };

  /**
   * Query database.
   * @param  {String} sql 
   * @return {Array}
   */
  var db = '';
  function query (sql) {
    if (db === '') {
      db = jsf.Setting.getLocalStorage('epgDbSaveFlag') === '1' ? 'other' : 'memory';
    }
    try {
      jsf.log(sql);
      return JSON.parse(qin.data.query(db, sql));
    } catch (e) {
      jsf.error(LogInfos.error__sql_query + e);
      return [];
    }
  }

  function transform__transform_channel_for_request (channel) {
    var request = {
      frequency: 0,
      serviceId: 0,
      tsId: 0
    };
    if (channel) {
      request.frequency = Number(channel.frequency) || 0;
      request.serviceId = Number(channel.serviceId) || 0;
      request.tsId = Number(channel.tsId) || 0;
    }
    return request;
  }

  /**
   * Creates a jsf.Programe instance according to the data in the database.
   * @param {Object} info
   * @return {jsf.Booking}
   */
  function create__create_program_by_data_base (info) {
    return new jsf.Program(info);
  }

  /**
   * Getter date.
   * @param {Number} offset
   * @return {Date}
   */
  var oneDay = 24 * 3600 * 1000;
  function getter__get_date_by_offset (offset) {
    return new Date(Date.now() + offset * oneDay);
  }

  /**
   * Getter pf information by channel.
   * @param {jsf.Channel like} channel
   * @return {Array<jsf.Program>} [presentProgram, followProgram]
   */
  function getter__get_pf_by_channel (channel) {
    return query('SELECT * FROM epgPF WHERE serviceId=' + channel.serviceId + ' AND tsId=' + channel.tsId + ' order by startDateTime ASC').map(create__create_program_by_data_base);
  }

  /**
   * Getter schedule information by channel.
   * @param {jsf.Channel like} channel
   * @param {Number} *dayOffset
   * @return {Array<jsf.Program>} [presentProgram, followProgram]
   */
  function getter__get_schedule_by_channel (channel, dayOffset) {
    dayOffset = jsf.isNumber(dayOffset) && dayOffset > 0 ? dayOffset : 0;
    var day = getter__get_date_by_offset(dayOffset);
    var dayStr = jsf.dateFormat(day, 'YYYY-MM-dd');
    var dayStartStr = dayOffset > 0 ? dayStr + ' 00:00:00' : jsf.dateFormat(day, 'YYYY-MM-dd hh:mm:ss');
    var dayEndStr = dayStr + ' 23:59:59';
    var daySql = 'startDateTime>="' + dayStartStr + '" AND startDateTime<="' + dayEndStr + '"';
    if (dayOffset === 0) {
      daySql += ' OR endDateTime>="' + dayStartStr + '" AND endDateTime<="' + dayEndStr + '"';
    }
    return query('SELECT * FROM epg WHERE pfFlag=0 AND serviceId=' + channel.serviceId + ' AND tsId=' + channel.tsId + ' AND (' + daySql + ') order by startDateTime ASC').map(create__create_program_by_data_base);
  }
  
  var request_cache = {
    pf: {handle: -1},
    schedule: {handle: -1}
  };
  function clear__clear_data (type) {
    if (type) {
      request_cache[type] = {handle: -1};
    } else {
      request_cache = {
        pf: {handle: -1},
        schedule: {handle: -1}
      };
    }
  }
  /**
   * Cancel request
   * @param {Number} handle
   * @returns {Number} 0 is success, 1 is failed
   */
  function cancel (handle) {
    if (jsf.isNumber(handle) && handle >= 0) {
      if (request_cache.pf.handle === handle) {
        clear__clear_data('pf');
      } else if (request_cache.schedule.handle === handle) {
        clear__clear_data('schedule');
      }
      qin.epg.cancel(handle);
    } else {
      if (request_cache.pf.handle >= 0) {
        qin.epg.cancel(request_cache.pf.handle);
      }
      if (request_cache.schedule.handle >= 0) {
        qin.epg.cancel(request_cache.schedule.handle);
      }
    }
  }

  /**
   * Request epg information of channel.
   * @param {String} type  Value is pf or schedule
   * @param {Boolean} playStatus
   * @param {jsf.Channel like} channel
   * @returns {Number}  The handle of request
   */
  function request__request_epg (type, playStatus, channel) {
    var request = transform__transform_channel_for_request(channel);
    request_cache[type] = {
      handle: qin.epg.request(type, playStatus ? 'play' : 'noplay', JSON.stringify(request)),
      request: request
    };
    return request_cache[type].handle;
  }

  /**
   * Request schedule information of channel.
   * @param {jsf.Channel like} channel
   * @param {Boolean} *playStatus  Default value is true
   * @returns {Number}  The handle of request
   */
  function request__request_schedule (channel, playStatus) {
    return request__request_epg('schedule', playStatus === void 0 ? true : !!playStatus, channel);
  }

  /**
   * Request pf information of channel.
   * @param {jsf.Channel like} channel
   * @param {Boolean} *playStatus  Default value is true
   * @returns {Number}  The handle of request
   */
  function request__request_pf (channel, playStatus) {
    return request__request_epg('pf', playStatus === void 0 ? true : !!playStatus, channel);
  }

  var listeners = [];
  jsf.eventManager.addListener({
    event: jsf.EventListener.SYSTEM,
    eventType: jsf.EventSystem.TYPE_EPG,
    callback: function (event) {
      switch (event.getEventName()) {
        case jsf.EventSystem.EPG_PF_ARRIVAL:
          var programs = event.getEventData();
          for (var i = 0, j = programs.length; i < j; i++) {
            jsf.eventManager.dispatchEvent(new jsf.EventSystem(jsf.EventSystem.TYPE_EPG, programs[i].pfType === 'present' ? jsf.EventSystem.EPG_PF_ARRIVAL_PRESENT : jsf.EventSystem.EPG_PF_ARRIVAL_FOLLOW, create__create_program_by_data_base(programs[i])));
          }
          break;
      }
      jsf.each(listeners, function (listener) {
        listener(event.getEventName(), event.getEventData());
      });
    }
  }, new jsf.Class());
  
  /**
   * Add a listener.
   * @param {Function} listener
   */
  function addListener (listener) {
    listeners.push(listener);
  }

  /**
   * Remove the previous listener.
   * @param {Function} *listener
   */
  function removeListener (listener) {
    if (listener) {
      var index = listeners.indexOf(listener);
      index >= 0 && listeners.splice(index, 1);
    } else {
      listeners.length = 0;
    }
  }

  var EPGManager = {
    _language: null,
  };
  jsf.defineGetterSetter(EPGManager, 'language', function () {
    if (this._language === null) {
      this._language = jsf.SysInfo.get('menuLanguage');
    }
    return this._language;
  });
  jsf.defineReadOnlyProperties(EPGManager, Methods);

  jsf.EPG = EPGManager;
}());