/**
 * JSFBookingManager.js
 * @authors Casper 
 * @date    2016/04/11
 * @version 1.0.0
 */
/**
 * jsf.BookingManager is a global object. 
 * Manage booking related operations.
 * @requires jsf.Program, jsf.Channel, jsf.Booking
 */
(function() {
  'use strict';
  var concat = Array.prototype.concat;
  var WAITING = 0,
      EXPIRED = 1,
      CONFLICT = 2,
      RECORDING = 3;
  var WatingBookingSQL = ' AND isReported=0',
      AvailableBookingSQL = sql__create_on_normal([WAITING, RECORDING], 'isReported'),
      AvailableBookingLinkSQL = ' AND ' + AvailableBookingSQL,
      SinglePvrConflictTypeSQL = sql__create_on_normal([jsf.Booking.TYPE_PVR, jsf.Booking.TYPE_TIME_PVR, jsf.Booking.TYPE_MANUAL_PVR, jsf.Booking.TYPE_SERIES_PVR], 'type'),
      CyclePvrConflictTypeSQL = sql__create_on_normal([jsf.Booking.TYPE_PVR, jsf.Booking.TYPE_TIME_PVR, jsf.Booking.TYPE_SERIES_PVR], 'type'),
      GetterBookingsSQL = 'SELECT * FROM booking',
      GetterBookingsLinkSQL = 'SELECT * FROM booking WHERE',
      GetterIdsLinkSQL = 'SELECT id FROM booking WHERE',
      BookingStartAndEndInOneDaySQL = 'date(startDateTime)=date(endDateTime)',
      BookingStartAndEndInDiffDaySQL = 'date(startDateTime)<date(endDateTime)';
  /**
   * The result information after method is invoked.
   * @type {String}
   */
  var Msgs = {
    YES: 'YES',
    NO: 'NO',
    ADD_OK: 'ADD_OK',
    ADD_FAIL: 'ADD_FAIL',
    ADD_ERROR_INVALID_BOOKING: 'ADD_ERROR_INVALID_BOOKING',
    ADD_ERROR_TIME: 'ADD_ERROR_TIME',
    ADD_ERROR_SERVICE: 'ADD_ERROR_SERVICE',
    ADD_ERROR_MAXCOUNT: 'ADD_ERROR_MAXCOUNT',
    ADD_ERROR_EXIST: 'ADD_ERROR_EXIST',
    ADD_ERROR_CONFLICT: 'ADD_ERROR_CONFLICT',
    ADD_ERROR_CONFLICT_WHITH_MANUAL: 'ADD_ERROR_CONFLICT_WHITH_MANUAL'
  };
  /**
   * Print information.
   * @type {Function}
   */
  var LogInfos = {
    error__invalid_parameters__booking__delete: 'Invalid parameters, booking must has an id.(jsf.BookingManager)',
    error__invalid_parameters__booking__find_channel: 'Dont find the channel by booking.(jsf.BookingManager)',
    error__invalid_parameters__booking__expired: 'Invalid parameters, booking is expired.(jsf.BookingManager)',
    error__invalid_parameters__program: 'Invalid parameters, program must be an instance of jsf.Program.(jsf.BookingManager)',
    error__invalid_parameters__channel: 'Invalid parameters, channel must be an instance of jsf.Channel.(jsf.BookingManager)',
    error__invalid_parameters__date: 'Invalid parameters, the date is not a valid date.(jsf.BookingManager)',
    error__invalid_parameters__obj: 'Invalid parameters, obj must be an instance of Object.(jsf.BookingManager)',
    error__sql_query: 'Query error.(jsf.BookingManager)'
  };
  /**
   * Detection methods.
   * @type {Function}
   */
  var ValidMethods = {
    isValidBooking: valid__is_valid_booking,
    isExceeded: valid__the_total_number_of_booking_has_exceeded,
    isExpired: valid__booking_has_expired,
    isConflict: valid__booking_has_conflict,
    isBookingHasExisted: valid__booking_has_existed,
    isSeriesHasExisted: valid__series_has_existed,
    isAvailableService: valid__booking_has_valid_service,
    isManualRecording: valid__find_manual_pvr_by_time
  };
  /**
   * The mthods of jsf.BookingManager.
   * @type {Function}
   */
  var Methods = {
    add: add__add_booking,
    getConflicts: function () {
      getter__get_conflicts.apply(null, arguments).map(create__create_booking_by_data_base); 
    },
    getHistoryConflicts: getter__get_history_conflicts_by_booking,
    getAll: getter__get_all_bookings,
    getByType: getter__get_bookings_by_type,
    getByChannel: getter__get_bookings_by_channel,
    getByProgram: getter__get_bookings_by_program,
    deleteAll: delete__all,
    delete: delete__delete_by_booking,
    deleteByType: delete__delete_by_type,
    deleteByChannel: delete__delete_by_channel,
    deleteSeries: delete__delete_series,
    getRemindTime: getter__get_remind_time,
    setRemindTime: setter__set_remind_time
  };

  /**
   * Query database.
   * @param  {String} sql 
   * @return {Array}
   */
  function query (sql) {
    try {
      jsf.log(sql);
      return JSON.parse(qin.data.query('program', sql));
    } catch (e) {
      jsf.error(LogInfos.error__sql_query + e);
      return [];
    }
  }

  /**
   * Splices query statement by keyword and possible value.
   * @param  {*} value  The possible value of the query
   * @param  {String} key  The keyword for query
   * @return {String}  The query statement
   */
  function sql__create_on_normal (value, key) {
    !jsf.isArray(value) && (value = [value]);
    var values = [];
    jsf.each(value, function (value) {
      jsf.isNumber(value) ? values.push(key + '=' + value) : values.push(key + '="' + (jsf.isDate(value) ? transform__transform_booking_date_to_string(value) : value) + '"');
    });
    return values.length > 1 ? '(' + values.join(' OR ') + ')' : values.join('');
  }

  /**
   * Splices query statement by a jsf.Channel instance.
   * @param  {jsf.Channel} channel
   * @return {String}  The query statement
   */
  function sql__create_by_channel (channel) {
    return 'frequency=' + channel.frequency + ' AND tsId=' + channel.tsId + ' AND serviceId=' + channel.serviceId + ' AND networkId=' + channel.networkId;
  }

  /**
   * Splices query statement by a jsf.Program instance.
   * @param  {jsf.Program} program
   * @return {String}  The query statement
   */
  function sql__create_by_program (program) {
    var channel = program.getChannel();
    return 'startDateTime="' + transform__transform_booking_date_to_string(program.startTime) + '" AND endDateTime="' + transform__transform_booking_date_to_string(program.endTime) + '" AND rate=' + program.parentRating + ' AND seriesKey="' + program.seriesKey + '" AND episodeKey=' + program.episodeKey + (valid__is_channel(channel) ? ' AND ' + sql__create_by_channel(channel) : '');
  }

  /**
   * Splices query conditions.
   * @param  {Object} limists
   * @return {String}  The query statement
   */
  function sql__create_by_limits (limits) {
    var sql = [];
    limits.order && (sql.push('ORDER BY ' + concat.call([], limits.order)));
    limits.order && limits.sort && (sql.push(limits.sort));
    limits.count && (sql.push('LIMIT ' + limits.count));
    return sql.join(' ');
  }

  function sql__create_intersection_by_date_time (startDateTime, endDateTime) {
    startDateTime = transform__transform_date_to_string(startDateTime);
    endDateTime = transform__transform_date_to_string(endDateTime);
    return '(startDateTime>="' + startDateTime + '" AND startDateTime<="' + endDateTime + '" OR "' + startDateTime + '"<endDateTime AND "' + endDateTime + '">=endDateTime)';
  }

  function sql__create_intersection_by_time (startTime, endTime) {
    startTime = transform__transform_date_to_time_string(startTime);
    endTime = transform__transform_date_to_time_string(endTime);
    return '(time(startDateTime)>="' + startTime + '" AND time(startDateTime)<"' + endTime + '" OR "' + startTime + '"<time(endDateTime) AND "' + endTime + '">=time(endDateTime))';
  }

  function sql__create_intersection_by_time_in_diff_day (startTime, endTime) {
    startTime = transform__transform_date_to_time_string(startTime);
    endTime = transform__transform_date_to_time_string(endTime);
    return '(time(startDateTime)<"' + endTime + '" OR "' + startTime + '"<time(endDateTime))';
  }

  function sql__create_fuzzy_matching_by_week (week) {
    return 'repeat like "%' + week + '%"';
  }

  /**
   * Detects whether is a valid jsf.Booking instance.
   * If not, then print an error.
   * @param  {*} obj
   * @return {String}  The result information of detect, please refer to Msgs
   */
  function valid__is_valid_booking (obj) {
    if (!jsf.Booking.is(obj) || !obj.isValid()) {
      return Msgs.ADD_ERROR_INVALID_BOOKING;
    }
    if (!valid__booking_has_valid_service(obj)) {
      return Msgs.ADD_ERROR_SERVICE;
    }
    if (valid__booking_has_expired(obj)) {
      return Msgs.ADD_ERROR_TIME;
    }
    if (valid__the_total_number_of_booking_has_exceeded(obj)) {
      return Msgs.ADD_ERROR_MAXCOUNT;
    }
    if (valid__booking_has_existed(obj)) {
      return Msgs.ADD_ERROR_EXIST;
    }
    return Msgs.YES;
  }

  /**
   * Detects whether is a jsf.Program instance.
   * If not, then print an error(LogInfos.error__invalid_parameters__program).
   * @param  {*} obj
   * @return {Boolean}
   */
  function valid__is_program (obj) {
    if (jsf.isInstanceof(obj, jsf.Program)) return true;
    jsf.error(LogInfos.error__invalid_parameters__program);
    return false;
  }

  /**
   * Detects whether is a jsf.Channel instance.
   * If not, then print an error(LogInfos.error__invalid_parameters__channel).
   * @param  {*} obj
   * @return {Boolean}
   */
  function valid__is_channel (obj) {
    if (jsf.isInstanceof(obj, jsf.Channel)) return true;
    jsf.error(LogInfos.error__invalid_parameters__channel);
    return false;
  }

  /**
   * Detects whether is a date instance.
   * If not, then print an error(LogInfos.error__invalid_parameters__date).
   * @param  {*} obj
   * @return {Boolean}
   */
  function valid__is_date (obj) {
    if (jsf.isDate(obj)) return true;
    jsf.error(LogInfos.error__invalid_parameters__date);
    return false;
  }

  /**
   * Detects whether the total number of the current appointment has exceeded the limit.
   * @param  {jsf.Booking} booking
   * @return {Boolean}
   */
  function valid__the_total_number_of_booking_has_exceeded (booking) {
    jsf.log('[jsf.BookingManager isExceeded] will check a booking whose type is ' + booking.type);
    if (jsf.BOOKING_MAX_COUNT > 0 || jsf.BOOKING_TYPES_MAX_COUNT > 0) {
      jsf.log('[jsf.BookingManager isExceeded] jsf.BOOKING_MAX_COUNT is ' + jsf.BOOKING_MAX_COUNT + ' and jsf.BOOKING_TYPES_MAX_COUNT is ' + jsf.BOOKING_TYPES_MAX_COUNT);
      var notSeriesbookingCount = -1,
          seriesBookingCount = -1,
          bookingCount = -1;
      if (jsf.BOOKING_MAX_COUNT > 0) {
        notSeriesbookingCount = query('SELECT id FROM booking WHERE type!=' + jsf.Booking.TYPE_SERIES_PVR + AvailableBookingLinkSQL).length + seriesBookingCount;
        seriesBookingCount = query('SELECT DISTINCT seriesKey FROM booking WHERE seriesKey!="" AND type=' + jsf.Booking.TYPE_SERIES_PVR).length;
        jsf.log('[jsf.BookingManager isExceeded] number of the all bookings is ' + (notSeriesbookingCount + seriesBookingCount));
        if (notSeriesbookingCount + seriesBookingCount >= jsf.BOOKING_MAX_COUNT) return true;
      }
      if (jsf.BOOKING_TYPES_MAX_COUNT > 0) {
        switch (booking.type) {
          case jsf.Booking.TYPE_SERIES_PVR:
            bookingCount = seriesBookingCount >= 0 ? seriesBookingCount : query('SELECT DISTINCT seriesKey FROM booking WHERE seriesKey!="" AND type=' + booking.type + AvailableBookingLinkSQL).length;
            break;
          default:
            bookingCount = notSeriesbookingCount >= 0 ? notSeriesbookingCount : query('SELECT id FROM booking WHERE type=' + booking.type + AvailableBookingLinkSQL).length;
            break;
        }
        jsf.log('[jsf.BookingManager isExceeded] number of the bookings for the specified type is ' + (notSeriesbookingCount + seriesBookingCount));
        return bookingCount >= jsf.BOOKING_TYPES_MAX_COUNT;
      }
    }
    return false;
  }

  /**
   * Detects whether the booking has existed.
   * @param  {jsf.Booking} booking
   * @return {Boolean}
   */
  function valid__booking_has_existed (booking) {
    switch (booking) {
      case jsf.Booking.TYPE_SERIES_PVR:
        return query([GetterIdsLinkSQL, [AvailableBookingSQL, 'type=' + booking.type, 'repeat="' + booking._repeat + '"', 'frequency=' + booking.frequency, 'tsId=' + booking.tsId, 'serviceId=' + booking.serviceId, 'networkId=' + booking.networkId, 'seriesKey="' + booking.seriesKey + '"', 'episodeKey=' + booking.episodeKey, 'rate=' + booking.parentRating].join(' AND '), 'LIMIT 1'].join(' ')).length > 0;
      default:
        return query([GetterIdsLinkSQL, [AvailableBookingSQL, 'type=' + booking.type, 'repeat="' + booking._repeat + '"', 'frequency=' + booking.frequency, 'tsId=' + booking.tsId, 'serviceId=' + booking.serviceId, 'networkId=' + booking.networkId, 'startDateTime="' + transform__transform_booking_date_to_string(booking.startTime) + '"', 'endDateTime="' + transform__transform_booking_date_to_string(booking.endTime) + '"', 'seriesKey="' + booking.seriesKey + '"', 'episodeKey=' + booking.episodeKey, 'rate=' + booking.parentRating].join(' AND '), 'LIMIT 1'].join(' ')).length > 0;
    }
  }

  /**
   * Detects whether the booking has a valid service.
   * If not, then print an error(LogInfos.error__invalid_parameters__booking__find_channel).
   * @param  {jsf.Booking} booking
   * @return {Boolean}
   */
  function valid__booking_has_valid_service (booking) {
    switch (booking.type) {
      case jsf.Booking.TYPE_EPG:
      case jsf.Booking.TYPE_PVR:
      case jsf.Booking.TYPE_TIME_PVR:
      case jsf.Booking.TYPE_MANUAL_PVR:
          if(jsf.Channel.create(booking.frequency, booking.networkId, booking.tsId, booking.serviceId)) {
              return true;
          }
          jsf.error(LogInfos.error__invalid_parameters__booking__find_channel);
          return false;
      default:
          return true;
    }
  }

  /**
   * Detects whether the booking has expired.
   * If true, then print an error(LogInfos.error__invalid_parameters__booking__expired).
   * @param  {jsf.Booking} booking
   * @return {Boolean}
   */
  function valid__booking_has_expired (booking) {
    var isExpired = false;
    switch(booking.type) {
      case jsf.Booking.TYPE_EPG:
        isExpired = !valid__is_date(booking.startTime) || booking.startTime.getTime() - Date.now() < jsf.EPG_BOOKING_ADVANCE_QUANTITY;
        break;
      case jsf.Booking.TYPE_PVR:
      case jsf.Booking.TYPE_MANUAL_PVR:
        isExpired = !valid__is_date(booking.endTime) || booking.endTime.getTime() < Date.now();
        break;
      case jsf.Booking.TYPE_TIME_PVR:
        isExpired = !valid__is_date(booking.endTime) || booking.cycleType === jsf.Booking.CYCLE_SINGLE && booking.endTime.getTime() < Date.now();
        break;
      case jsf.Booking.TYPE_POWER_ON:
      case jsf.Booking.TYPE_POWER_OFF:
        isExpired = !valid__is_date(booking.startTime) || booking.startTime.getTime() < Date.now();
        break;
      default:
        break;
    }
    if (isExpired) {
      jsf.error(LogInfos.error__invalid_parameters__booking__expired);
    }
    return isExpired;
  }

  /**
   * Detects whether there is a manual pvr in the specified time period.
   * @param  {jsf.Booking} booking
   * @return {Boolean}
   */
  function valid__find_manual_pvr_by_time (startTime, endTime) {
    return query([GetterIdsLinkSQL, [AvailableBookingSQL, 'type=' + jsf.Booking.TYPE_MANUAL_PVR, sql__create_intersection_by_date_time(startTime, endTime)].join(' AND '), 'LIMIT 1'].join(' ')).length > 0;
  }

  /**
   * Detects whether series has existed.
   * @param  {String} seriesKey
   * @param  {Number} frequency
   * @param  {Number} serviceId
   * @param  {Number} tsId
   * @param  {Number} networkId
   * @return {Boolean}
   */
  function valid__series_has_existed (seriesKey, frequency, serviceId, tsId, networkId) {
    return query([GetterIdsLinkSQL, ['type=' + jsf.Booking.TYPE_SERIES_PVR, 'seriesKey="' + seriesKey + '"', 'frequency=' + frequency, 'serviceId=' + serviceId, 'tsId=' + tsId, 'networkId=' + networkId].join(' AND '), 'LIMIT 1'].join(' ')).length > 0;
  }

  /**
   * Detects whether there is a conflict whith the booking.
   * @param  {jsf.Booking} booking
   * @return {Boolean}
   */
  function valid__booking_has_conflict (booking) {
    switch (booking.type) {
      case jsf.Booking.TYPE_EPG:
      case jsf.Booking.TYPE_PVR:
      case jsf.Booking.TYPE_MANUAL_PVR:
      case jsf.Booking.TYPE_TIME_PVR:
      case jsf.Booking.TYPE_SERIES_PVR:
        return getter__get_conflicts(booking, {
          count: jsf.MAX_NUMBER_OF_SIMULTANEOUS_RECORDING
        }).length > 0;
      default:
        return getter__get_conflicts(booking, {
          count: 1
        }).length > 0;
    }
  }

  /**
   * Transform the date attribute of a jsf.Booking to string, the target format is YYYY-MM-dd hh:mm:ss.
   * @param  {Date} date
   * @return {String}
   */
  function transform__transform_booking_date_to_string (date) {
    return jsf.dateFormat(date, 'YYYY-MM-dd hh:mm:ss');
  }

  /**
   * Transform a date to string, the target format is YYYY-MM-dd hh:mm:ss.
   * @param  {Date} date
   * @return {String}
   */
  function transform__transform_date_to_string (date) {
    return jsf.isDate(date) ? jsf.dateFormat(date, 'YYYY-MM-dd hh:mm:ss') : date;
  }

  /**
   * Transform a date to string, the target format is YYYY-MM-dd.
   * @param  {Date} date
   * @return {String}
   */
  function transform__transform_date_to_day_string (date) {
    return jsf.isDate(date) ? jsf.dateFormat(date, 'YYYY-MM-dd') : date;
  }

  /**
   * Transform a date to string, the target format is hh:mm:ss.
   * @param  {Date} date
   * @return {String}
   */
  function transform__transform_date_to_time_string (date) {
    return jsf.isDate(date) ? jsf.dateFormat(date, 'hh:mm:ss') : date;
  }

  /**
   * Check whether the booking conflicts with itself.
   * @param  {jsf.Booking} booking
   * @return {Boolean}
   */
  function valid__confilct_whith_itself (booking) {
    jsf.log('[jsf.BookingManager valid__confilct_whith_itself] will check a booking whose cycleType is ' + booking.cycleType);
    if (booking.cycleType !== jsf.Booking.CYCLE_SINGLE) {
      var duration = Math.floor((booking.endTime.getTime() - booking.startTime.getTime()));
      if (duration > jsf.BOOKING_MAX_DURATION_MS) {
        var repeat = booking.repeat,
          overDays = duration / jsf.BOOKING_MAX_DURATION_MS;
        repeat += (Number(repeat.charAt(0)) + 7);
        jsf.log('[jsf.BookingManager valid__confilct_whith_itself] duration is ' + duration + ' and repeat is ' + repeat);
        for (var i = 0, j = repeat.length; i < j - 1; i++) {
          if (Number(repeat[i]) + overDays > Number(repeat[i + 1])) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Creates a jsf.Booking instance according to the data in the database.
   * @param  {Object} info
   * @return {jsf.Booking}
   */
  function create__create_booking_by_data_base (info) {
    return jsf.Booking.__createByInfo(info);
  }

  // The mapping table of keywords and query statement.
  var SQLMapping = {
    normal: {func: sql__create_on_normal, valid: function (value) {return jsf.isString(value) || jsf.isNumber(value) || jsf.isArray(value) || jsf.isDate(value);}},
    channel: {func: sql__create_by_channel, valid: valid__is_channel},
    program: {func: sql__create_by_program, valid: valid__is_program},
    limits: {valid: function () {return false;}},
    valid: {func: function () {return AvailableBookingSQL;}}
  };

  /**
   * Query according to the specified conditions.
   * @param  {Object} opts
   * @return {Array}
   */
  function getter__get_data_base_info_by_opts (opts) {
    var sqls = [],
        temp;
    jsf.each(opts, function (value, key) {
      temp = SQLMapping[key] || SQLMapping.normal;
      if (!temp.valid || temp.valid(value)) {
        sqls.push(temp.func(value, key));
      }
    });
    return query([sqls.length === 0 ? GetterBookingsSQL : GetterBookingsLinkSQL, sqls.join(' AND '), sql__create_by_limits(jsf.extend({}, opts.limits))].join(' '));
  }

  /**
   * Gets according to the specified conditions.
   * @param  {Object} opts
   * @return {Array<jsf.Booking>}
   */
  function getter__get_bookings_by_opts (opts) {
    return getter__get_data_base_info_by_opts(jsf.extend({}, opts)).map(create__create_booking_by_data_base);
  }

  /**
   * Gets all jsf.Booking objects.
   * @param  {Object} limits
   * @return {Array<jsf.Booking>}
   */
  function getter__get_all_bookings (limits) {
    return getter__get_bookings_by_opts({
      limits: limits
    });
  }

  /**
   * Gets all valid specified types of bookings.
   * @param  {Number|Array} type
   * @param  {Object} limits
   * @return {Array<jsf.Booking>}
   */
  function getter__get_bookings_by_type (type, limits) {
    return getter__get_bookings_by_opts({
      type: type,
      valid: true,
      limits: limits
    });
  }

  /**
   * Gets all valid bookings by a jsf.Channel instance.
   * @param  {jsf.Channel} channel
   * @param  {Number|Array} *type
   * @param  {Object} *limits
   * @return {Array<jsf.Booking>}
   */
  function getter__get_bookings_by_channel (channel, type, limits) {
    if (valid__is_channel(channel)) {
      if (jsf.isObject(type) && jsf.isUndefined(limits)) {
        limits = type;
        type = null;
      }
      return getter__get_bookings_by_opts({
        type: type,
        valid: true,
        channel: channel,
        limits: limits
      });
    }
  }

  /**
   * Gets all valid bookings by a jsf.Program instance.
   * @param  {jsf.Program} program
   * @param  {Number|Array} *type
   * @param  {Object} *limits
   * @return {Array<jsf.Booking>}
   */
  function getter__get_bookings_by_program (program, type, limits) {
    if (valid__is_program(program)) {
      if (jsf.isObject(type) && jsf.isUndefined(limits)) {
        limits = type;
        type = null;
      }
      return getter__get_bookings_by_opts(jsf.extend({
        type: type,
        valid: true,
        program: program,
        limits: limits
      }));
    }
    return [];
  }

  /**
   * According to the booking to obtain historical conflict records.
   * @param  {jsf.Booking} booking
   * @param  {Object} *limits
   * @return {Array}
   */
  function getter__get_history_conflicts_by_booking (booking, limits) {
    if (jsf.Booking.is(booking)) {
      return query([['SELECT * FROM timebooking WHERE isConflict=1', 'id=' + booking._id, 'startDateTime<="' + transform__transform_booking_date_to_string(booking.startTime)].join(' AND '), sql__create_by_limits(jsf.extend({}, limits))].join(' '));
    }
    return [];
  }

  /**
   * Gets all conflicts of a epg booking.
   * @param  {Date} startTime
   * @param  {Number} offset
   * @param  {Object} limits
   * @return {Array}
   */
  function getter__get_conflicts_for_epg (startTime, offset, limits) {
    var start = startTime.getTime(),
        max   = transform__transform_date_to_string(new Date(start + offset)),
        min   = transform__transform_date_to_string(new Date(start - offset));
    return query([GetterBookingsLinkSQL, [AvailableBookingSQL, 'type=' + jsf.Booking.TYPE_EPG, 'startDateTime>"' + min + '"', 'startDateTime<"' + max + '"'].join(' AND '), sql__create_by_limits(jsf.extend({}, limits))].join(' '));
  }

  /**
   * Gets all conflicts of a booking whose cycle type is jsf.Booking.CYCLE_SINGLE.
   * @param  {Date} startTime
   * @param  {Date} endTime
   * @param  {Object} limits
   * @return {Array}
   */
  function getter__get_conflicts_for_single_pvr (startTime, endTime, limits) {
    var dateInfo = info__get_date_info({
      startTime: startTime,
      endTime: endTime
    });
    var weekOfAdd = startTime.getDay();
    weekOfAdd === 0 && (weekOfAdd = 7);
    var preWeekOfAdd                = weekOfAdd === 1 ? 7 : weekOfAdd - 1;
    var nextWeekOfAdd               = dateInfo.isOverOne && (weekOfAdd === 7 ? 1 : weekOfAdd + 1);
    var dbSameDaySql                = dateInfo.isOverOne ? ('(repeat like "%' + weekOfAdd + '%" AND "' + dateInfo.startTime + '"<time(endDateTime) OR repeat like "%' + nextWeekOfAdd + '%" AND "' + dateInfo.endTime + '">time(startDateTime))') : ('repeat like "%' + weekOfAdd + '%" AND ' + sql__create_intersection_by_time(dateInfo.startTime, dateInfo.endTime));
    var dbDiffDaySql                = dateInfo.isOverOne ? ('repeat like "%' + weekOfAdd + '%"') : ('(repeat like "%' + weekOfAdd + '%" AND time(startDateTime)<"' + dateInfo.endTime + '" OR repeat like "%' + preWeekOfAdd + '%" AND "' + dateInfo.startTime + '"<time(endDateTime))');
    var toMatchCycleTypeIsSingle    = 'repeat="0" AND ' + sql__create_intersection_by_date_time(dateInfo.startDateTime, dateInfo.endDateTime);
    var toMatchCycleTypeIsNotSingle = 'repeat!="0" AND (' + BookingStartAndEndInOneDaySQL + ' AND ' + dbSameDaySql + ' OR ' + BookingStartAndEndInDiffDaySQL + ' AND ' + dbDiffDaySql + ')';
    return query([GetterBookingsLinkSQL, [AvailableBookingSQL, SinglePvrConflictTypeSQL, 'startDateTime<"' + dateInfo.endDateTime + '"', '(' + toMatchCycleTypeIsSingle + ' OR ' + toMatchCycleTypeIsNotSingle + ')'].join(' AND '), sql__create_by_limits(jsf.extend({}, limits))].join(' '));
  }

  /**
   * Gets all conflicts of a booking whose cycle type is jsf.Booking.CYCLE_DAILY.
   * @param  {Date} startTime
   * @param  {Date} endTime
   * @param  {Object} limits
   * @return {Array}
   */
  function getter__get_confilcts_for_daily_pvr (startTime, endTime, limits) {
    var dateInfo = info__get_date_info({
      startTime: startTime,
      endTime: endTime
    });
    var sameDayCompareSql = sql__create_intersection_by_time(dateInfo.startTime, dateInfo.endTime);
    var dbSameDaySql = dateInfo.isOverOne ? sql__create_intersection_by_time_in_diff_day(dateInfo.startTime, dateInfo.endTime) : sql__create_intersection_by_time(dateInfo.startTime, dateInfo.endTime);
    var dbDiffDaySql = dateInfo.isOverOne ?  '' : sql__create_intersection_by_time_in_diff_day(dateInfo.startTime, dateInfo.endTime);
    var toMatchSameDay = BookingStartAndEndInOneDaySQL + ' AND ' + dbSameDaySql;
    var toMatchDiffDay = BookingStartAndEndInDiffDaySQL + (dateInfo.isOverOne ? dbDiffDaySql : ' AND ' + dbDiffDaySql);
    return query([GetterBookingsLinkSQL, [AvailableBookingSQL, SinglePvrConflictTypeSQL, '(repeat!="0" OR "' + dateInfo.startDateTime + '"<endDateTime)', '(' + toMatchSameDay + ' OR ' + toMatchDiffDay + ')'].join(' AND '), sql__create_by_limits(jsf.extend({}, limits))].join(' '));
  }

  /**
   * Gets all conflicts of a booking whose cycle type is jsf.Booking.CYCLE_WEEKLY.
   * @param  {Date} startTime
   * @param  {Date} endTime
   * @param  {Array} repeat
   * @param  {Object} limits
   * @return {Array}
   */
  function getter__get_confilcts_for_weekly_pvr (startTime, endTime, repeat, limits) {
    var bookingRepeatStr = repeat.join('').replace(/\w/g, function(word, index, array) {
      return word === '0' ? '' : (index + 1);
    });
    var weekOfAdd = startTime.getDay() === 0 ? 7 : startTime.getDay();
    // Offset to the first valid date
    var offset = 0;
    for(var i = 0; i < 7; i++){
      if(repeat[(weekOfAdd - 1 + i) % 7]) {
        if (offset > 0) {
          startTime.setDate(startTime.getDate() + offset);
          endTime.setDate(endTime.getDate() + offset);
        }
        break;
      }
      offset++;
    }
    var dateInfo = info__get_date_info({
      startTime: startTime,
      endTime: endTime
    });
    var weeksStrByDateOfReal = bookingRepeatStr.replace(/7/g, 0);
    // +1 day, range of value is 0~6
    var weeksStrByDateOfForwardOffsetOneDay = weeksStrByDateOfReal.replace(/\w/g, function(word, index, array) {
      return word === '6' ? '0' : (Number(word) + 1);
    });
    // -1 day, range of value is 0~6
    var weeksStrByDateOfBackOffsetOneDay = weeksStrByDateOfReal.replace(/\w/g, function(word, index, array) {
      return word === '0' ? '6' : (Number(word) - 1);
    });
    var weeksOfReal = bookingRepeatStr.split('');
    // +1 day, range of value is 1~7
    var weeksOfForwardOffsetOneDay = bookingRepeatStr.replace(/\w/g, function(word, index, array) {
      return word === '7' ? '1' : (Number(word) + 1);
    }).split('');
    // -1 day, range of value is 1~7
    var weeksOfBackOffsetOneDay = bookingRepeatStr.replace(/\w/g, function(word, index, array) {
      return word === '1' ? '7' : (Number(word) - 1);
    }).split('');
    var sameDayCompareSql           = sql__create_intersection_by_time(dateInfo.startTime, dateInfo.endTime);
    var validDateSetsSql            = '("' + weeksStrByDateOfReal.split('').join('","') + '")';
    var validDateSetsOfForwardSql   = '("' + weeksStrByDateOfForwardOffsetOneDay.split('').join('","') + '")';
    var validDateSetsOfBackSql      = '("' + weeksStrByDateOfBackOffsetOneDay.split('').join('","') + '")';
    var weeksOfRealSql              = '(' + weeksOfReal.map(sql__create_fuzzy_matching_by_week).join(' OR ') + ')';
    var weeksOfForwardSql           = '(' + weeksOfForwardOffsetOneDay.map(sql__create_fuzzy_matching_by_week).join(' OR ') + ')';
    var weeksOfBackSql              = '(' + weeksOfBackOffsetOneDay.map(sql__create_fuzzy_matching_by_week).join(' OR ') + ')';
    var dbSameDayForSingleSql       = dateInfo.isOverOne ? ('(strftime("%w", startDateTime) in ' + validDateSetsSql + ' AND "' + dateInfo.startTime + '"<time(endDateTime) OR strftime("%w", startDateTime) in ' + validDateSetsOfForwardSql + ' AND "' + dateInfo.endTime + '">time(startDateTime))') : ('strftime("%w", startDateTime) in ' + validDateSetsSql + ' AND '+ sameDayCompareSql);
    var dbDiffDayForSingleSql       = dateInfo.isOverOne ? ('strftime("%w", startDateTime) in ' + validDateSetsSql) : ('(strftime("%w", startDateTime) in ' + validDateSetsSql + ' AND "' + dateInfo.endTime + '">time(startDateTime) OR strftime("%w", startDateTime) in ' + validDateSetsOfBackSql + 'AND "' + dateInfo.startTime + '"<time(endDateTime))');
    var dbSameDayForWeeklySql       = dateInfo.isOverOne ? ('(' + weeksOfRealSql + ' AND "' + dateInfo.startTime + '"<time(endDateTime) OR ' + weeksOfForwardSql + ' AND "' + dateInfo.endTime + '">time(startDateTime))') : (weeksOfRealSql + ' AND ' + sameDayCompareSql);
    var dbDiffDayForWeeklySql       = dateInfo.isOverOne ? weeksOfRealSql : ('(' + weeksOfRealSql + ' AND "' + dateInfo.endTime + '">time(startDateTime) OR ' + weeksOfBackSql + ' AND "' + dateInfo.startTime + '"<time(endDateTime)') + ')';
    var toMatchCycleTypeIsSingle    = 'repeat=0 AND "' + dateInfo.startDateTime + '"<endDateTime AND (' + BookingStartAndEndInOneDaySQL + ' AND ' + dbSameDayForSingleSql + ' OR ' + BookingStartAndEndInDiffDaySQL + ' AND ' + dbDiffDayForSingleSql + ')';
    var toMatchCycleTypeIsNotSingle = 'repeat!=0 AND (' + BookingStartAndEndInOneDaySQL + ' AND ' + dbSameDayForWeeklySql + ' OR ' + BookingStartAndEndInDiffDaySQL + ' AND ' + dbDiffDayForWeeklySql + ')';
    return query([GetterBookingsLinkSQL, [AvailableBookingSQL, SinglePvrConflictTypeSQL, '(' + toMatchCycleTypeIsSingle + ' OR ' + toMatchCycleTypeIsNotSingle + ')'].join(' AND '), sql__create_by_limits(jsf.extend({}, limits))].join(' '));
  }

  /**
   * Gets all conflicts of a series.
   * @param  {jsf.Booking} booking
   * @param  {Object} limits
   * @return {Array}
   */
  function getter__get_confilcts_for_all_series (booking, limits) {
    var series = getter__get_epg_by_series_booking(booking),
        count  = limits && limits.count || 0,
        length = 0,
        cache  = {},
        conflicts;
    limits && (delete limits.count);
    for (var i = 0, j = series.length; i < j; i++) {
      conflicts = conflicts.concat(getter__get_conflicts_for_single_pvr(new Date(series[i].startDateTime.replace(/-/g, "/")), new Date(series[i].endDateTime.replace(/-/g, "/")), limits));
      for (var n = conflicts.length - 1, m = length; n >= m; n--) {
        if (cache[conflicts[n].id]) {
          conflicts.splice(n, 1);
          n--;
          m--;
          continue;
        }
        cache[conflicts[n].id] = true;
      }
      length = conflicts.length;
      if (count > 0 && length >= count) {
        length > count && conflicts.splice(count, length - count);
        break;
      }
    }
    return conflicts;
  }

  /**
   * Gets all conflicts of a set in the series.
   * @param  {jsf.Booking} booking
   * @param  {Object} limits
   * @return {Array}
   */
  function getter__get_conflicts_for_single_series (booking, limits) {
    var params = info__get_booking_params_for_series(booking);
    return getter__get_conflicts_for_single_pvr(params.startTime, params.endTime, limits);
  }

  /**
   * Gets all conflicts of a series pvr booking.
   * @param  {jsf.Booking} booking
   * @param  {Object} limits
   * @return {Array}
   */
  function getter__get_confilcts_for_series_pvr (booking, limits) {
    if (valid__series_has_existed(booking.seriesKey, booking.frequency, booking.serviceId, booking.tsId, booking.networkId)) {
      return getter__get_conflicts_for_single_series(booking, limits);
    } else {
      return getter__get_confilcts_for_all_series(booking, limits);
    }
  }

  /**
   * Gets all conflicts of a jsf.Booking instance.
   * @param  {jsf.Booking} booking
   * @param  {Object} limits
   * @return {Array<jsf.Booking>}
   */
  function getter__get_conflicts (booking, limits) {
    switch (booking.type) {
      case jsf.Booking.TYPE_EPG:
        return getter__get_conflicts_for_epg(booking.startTime, jsf.EPG_BOOKING_ADVANCE_QUANTITY).map(create__create_booking_by_data_base);
      case jsf.Booking.TYPE_PVR:
      case jsf.Booking.TYPE_MANUAL_PVR:
        return getter__get_conflicts_for_single_pvr(booking.startTime, booking.endTime, limits).map(create__create_booking_by_data_base);
      case jsf.Booking.TYPE_TIME_PVR:
        if (booking.cycleType === jsf.Booking.CYCLE_SINGLE) return getter__get_conflicts_for_single_pvr(booking.startTime, booking.endTime, limits).map(create__create_booking_by_data_base);
        if (booking.cycleType === jsf.Booking.CYCLE_WEEKLY) return getter__get_confilcts_for_weekly_pvr(booking.startTime, booking.endTime, booking.repeat, limits).map(create__create_booking_by_data_base);
        if (booking.cycleType === jsf.Booking.CYCLE_DAILY) return getter__get_confilcts_for_daily_pvr(booking.startTime, booking.endTime, limits).map(create__create_booking_by_data_base);
        return [];
      case jsf.Booking.TYPE_SERIES_PVR:
        return getter__get_confilcts_for_series_pvr(booking, limits).map(create__create_booking_by_data_base);
      default:
        return query([GetterBookingsLinkSQL, [AvailableBookingSQL, 'type=' + booking.type, 'startDateTime="' + transform__transform_date_to_string(booking.startTime) + '"'].join(' AND '), sql__create_by_limits(jsf.extend({}, limits))].join(' ')).map(create__create_booking_by_data_base);
    }
  }

  /**
   * Gets all epg objects by a series pvr booking.
   * @param  {jsf.Booking} booking
   * @return {Object}
   */
  function getter__get_epg_by_series_booking (booking) {
    var episodeKeyCache  = {},
        epgSql = 'SELECT * FROM epg WHERE pfFlag=0 AND serviceId=' + booking.serviceId + ' AND tsId=' + booking.tsId + ' AND extendString="' + booking.seriesKey + '" AND startDateTime>="' + transform__transform_date_to_string(new Date()) + '" ORDER BY startDateTime ASC',
        epgs   = qin.data.query(jsf.Setting.getLocalStorage('epgDbSaveFlag') === '1' ? 'other' : 'memory', epgSql),
        result = [],
        epg;
    try {
      epgs = JSON.parse(epgs);
      jsf.log('[jsf.BookingManager getter__get_epg_by_series_booking] the number of epgs is ' + epgs.length);
      for (var i = 0, j = epgs.length; i < j; i++) {
        epg = epgs[i];
        if (epg.extendNumber1 in episodeKeyCache) {
            continue;
        }
        episodeKeyCache[epg.extendNumber1] = true;
        result.push(epg);
      }
    } catch(e) {
        jsf.error(LogInfos.error__sql_query + e);
    }
    return result;
  }

  /**
   * Gets a epg object whose startTime is the nearest to the present by a series pvr booking.
   * @param  {[type]} booking [description]
   * @return {[type]}         [description]
   */
  function getter__get_nearest_epg_by_series_booking (booking) {
    var epgSql = 'SELECT * FROM epg WHERE pfFlag=0 AND serviceId=' + booking.serviceId + ' AND tsId=' + booking.tsId + ' AND extendString="' + booking.seriesKey + '" AND extendNumber1=' + booking.episodeKey + ' AND startDateTime>="' + transform__transform_date_to_string(new Date()) + '" ORDER BY startDateTime ASC',
        epgs   = qin.data.query(jsf.Setting.getLocalStorage('epgDbSaveFlag') === '1' ? 'other' : 'memory', epgSql),
        epg    = null;
    try {
        epgs = JSON.parse(epgs);
        jsf.log('[jsf.BookingManager getter__get_nearest_epg_by_series_booking] the number of epgs is ' + epgs.length);
        if (epgs.length > 0) epg = epgs[0];
    } catch(e) {
        jsf.error(LogInfos.error__sql_query + e);
    }
    return epg;
  }


  /**
   * Gets the reminder time.
   * @return {Number}
   */
  function getter__get_remind_time () {
    var time = Number(qin.booking.getSeconds());
    return jsf.isNumber(time) ? time : 0;
  }

  /**
   * Sets the reminder time.
   * @param  {Number} time
   */
  function setter__set_remind_time (time) {
    time = Number(time);
    if (jsf.isNumber(time) && time >= 0) {
      qin.booking.setSeconds(time);
    }
  }

  /**
   * Gets the date info from a object.
   * @param  {Object} obj
   * @return {Object}
   */
  function info__get_date_info (obj) {
    var startTime = obj.startTime;
    var endTime = obj.endTime;
    return {
      isOverOne: transform__transform_date_to_day_string(startTime) !== transform__transform_date_to_day_string(endTime),
      startDateTime:  transform__transform_booking_date_to_string(startTime),
      endDateTime:  transform__transform_booking_date_to_string(endTime),
      startTime:  transform__transform_date_to_time_string(startTime),
      endTime:  transform__transform_date_to_time_string(endTime)
    };
  }

  /**
   * Packing the message information of result after add method is invoked.
   * @param  {String} msg
   * @param  {jsf.Booking} booking  Only useful when the msg is Msgs.ADD_ERROR_CONFLICT
   * @return {Object}
   */
  function info__get_add_msg (msg, booking) {
    return msg;
    // return {
    //   msg: msg,
    //   func: msg === Msgs.ADD_ERROR_CONFLICT ? function () {
    //     return info__get_add_msg(booking.type === jsf.Booking.TYPE_SERIES_PVR ? add__add_series_by_booking(booking) : add__normal(booking._toDataBaseJson()), booking);
    //   } : null
    // };
  }

  /**
   * Obtains relevant data for series pvr.
   * @param  {[type]} booking [description]
   * @return {[type]}         [description]
   */
  function info__get_booking_params_for_series (booking) {
    var info = getter__get_nearest_epg_by_series_booking(booking);
    return info ? {
      type: booking.type,
      startTime: new Date(info.startDateTime.replace(/-/g, "/")),
      endTime: new Date(info.endDateTime.replace(/-/g, "/")),
      frequency: booking.frequency,
      tsId: booking.tsId,
      serviceId: booking.serviceId,
      networkId: booking.networkId,
      _epg: info
    } : booking;
  }

  /**
   * Deletes all bookings.
   * @return {Boolean}
   */
  function delete__all () {
    jsf.log.d('[jsf.BookingManager delete__all] delete all bookings');
    qin.booking.removeAllBookings();
    return true;
  }

  /**
   * Deletes a booking by id.
   * @return {Boolean}
   */
  function delete__delete_by_id (id) {
    qin.booking.removeBookingById(id);
    return true;
  }

  /**
   * Manually delete a booking by id.
   * @return {Boolean}
   */
  function delete__manually_delete_by_id (id) {
    qin.booking.activeRemoveBookingById(id);
    return true;
  }

  /**
   * Deletes a specified type of bookings.
   * @param  {Number|Array} type
   * @return {Boolean}
   */
  function delete__delete_by_type (type) {
    !jsf.isArray(type) && (type = [type]);
    jsf.each(type, function (value) {
      delete__delete_by_params({
        type: type
      });
    });
    return true;
  }

  /**
   * Deletes the bookings according to the conditions.
   * @param  {Object} params
   * @return {Boolean}
   */
  function delete__delete_by_params (params) {
    if (jsf.isObject(params)) {
      params = JSON.stringify(params);
      jsf.log('[jsf.BookingManager delete__delete_by_params] delete__delete_by_params:' + params);
      qin.booking.removeBookingByProgram(params);
      return true;
    }
    jsf.error(LogInfos.error__invalid_parameters__obj);
    return false;
  }

  /**
   * Deletes a bookings.
   * @param  {jsf.Booking} booking
   * @param  {Boolean} manually
   * @return {Boolean}
   */
  function delete__delete_by_booking (booking, manually) {
    if (jsf.Booking.is(booking)) {
      var id = booking._id;
      if (id === 0) {
        jsf.error(LogInfos.error__invalid_parameters__booking__delete);
        return false;
      }
      manually = !!manually;
      jsf.log('[jsf.BookingManager delete__delete_by_booking] delete_by_booking:' + id + ', type is ' + booking.type + ', manually is ' + manually);
      if (booking.type === jsf.Booking.TYPE_SERIES_PVR) {
        if (manually) {
          return delete__manually_delete_by_id(id);
        } else {
          return delete__delete_by_id(id);
          // find next
        }
      } else {
        return delete__delete_by_id(id);
      }
    }
    return false;
  }

  /**
   * Deletes a series.
   * @param  {Object} obj
   * @return {Boolean}
   */
  function delete__delete_series (obj) {
    if (jsf.isObject(obj)) {
      return delete__delete_by_params({
        type: jsf.Booking.TYPE_SERIES_PVR,
        frequency: obj.frequency,
        networkId: obj.networkId,
        tsId: obj.tsId,
        serviceId: obj.serviceId,
        seriesKey: obj.seriesKey
      });
    }
    jsf.error(LogInfos.error__invalid_parameters__obj);
    return false;
  }

  /**
   * Deletes the bookings by a jsf.Channel instance.
   * @param  {jsf.Channel} channel
   * @param  {Number|Array} *type
   * @return {Boolean}
   */
  function delete__delete_by_channel (channel, type) {
    if (valid__is_channel(channel)) {
      var params = {
        frequency: channel.frequency,
        networkId: channel.networkId,
        tsId: channel.tsId,
        serviceId: channel.serviceId
      };
      !jsf.isArray(type) && (type = [type]);
      if (type.length === 0) {
        delete__delete_by_params(params);
      } else {
        jsf.each(type, function (value) {
          params.type = value;
          delete__delete_by_params(params);
        });
      }
      return true;
    }
    return false;
  }

  /**
   * Adds a data to the databse.
   * @param {obj} obj
   */
  function add__normal (obj) {
    jsf.log('[jsf.BookingManager add__normal] ' + (obj = JSON.stringify(obj)));
    return qin.booking.setBookingProgram(obj) === 0 ? Msgs.ADD_OK : Msgs.ADD_FAIL;
  }

  /**
   * Adds a booking.
   * @param {jsf.Booking} booking
   * @return {Object}
   */
  function add__add_booking (booking) {
    var msg = valid__is_valid_booking(booking);
    if (msg === Msgs.YES) {
      switch(booking.type) {
        case jsf.Booking.TYPE_PVR:
        case jsf.Booking.TYPE_MANUAL_PVR:
        case jsf.Booking.TYPE_TIME_PVR:
          if (booking.cycleType === jsf.Booking.CYCLE_SINGLE && valid__find_manual_pvr_by_time(booking.startTime, booking.endTime)) {
            return info__get_add_msg(Msgs.ADD_ERROR_CONFLICT_WHITH_MANUAL);
          }
          break;
        case jsf.Booking.TYPE_SERIES_PVR:
          return info__get_add_msg(add__add_series_by_booking(booking), booking);
        default:
          break;
      }
      return info__get_add_msg(valid__booking_has_conflict(booking) ? Msgs.ADD_ERROR_CONFLICT : add__normal(booking._toDataBaseJson()), booking);
    }
    return info__get_add_msg(msg);
  }

  /**
   * Adds a series.
   * @param {jsf.Booking} booking
   * @return {String}
   */
  function add__add_series (booking) {
    var series = getter__get_epg_by_series_booking(booking),
        info;
    for (var i = 0, j = series.length; i < j; i++) {
      info = series[i];
      add__normal({
        type: booking.type,
        repeat: '0',
        isReported: 0,
        rate: info.parentRating,
        frequency: booking.frequency,
        tsId: booking.tsId,
        serviceId: booking.serviceId,
        networkId: booking.networkId,
        logicNumber: booking.logicNumber,
        channelName: booking.channelName,
        epgName: info.languageLocal ? ((jsf.EPG.language === info.languageLocal) ? info.eventNameLocal : (info.eventNameSecond ? info.eventNameSecond : info.eventNameLocal)) : info.eventName,
        startDateTime: info.startDateTime,
        endDateTime: info.endDateTime,
        duration: info.duration,
        seriesKey: jsf.transformToSpecifiedType(info.extendString),
        episodeKey: info.extendNumber1,
        episodeStatus: info.extendNumber3
      });
    }
    return Msgs.ADD_OK;
  }

  /**
   * Adds a series pvr booking according a jsf.Booking instance.
   * @param {jsf.Booking} booking
   * @return {String}
   */
  function add__add_series_by_booking (booking) {
    if (valid__series_has_existed(booking.seriesKey, booking.frequency, booking.serviceId, booking.tsId)) {
      var params = info__get_booking_params_for_series(booking);
      if (valid__find_manual_pvr_by_time(params.startTime, params.endTime)) {
        return Msgs.ADD_ERROR_CONFLICT_WHITH_MANUAL;
      }
      return getter__get_conflicts_for_single_series(booking, {
        count: jsf.MAX_NUMBER_OF_SIMULTANEOUS_RECORDING
      }).length > 0 ? Msgs.ADD_ERROR_CONFLICT : add__add_series_booking(booking);
    } else {
      return getter__get_confilcts_for_all_series(booking, {
        count: jsf.MAX_NUMBER_OF_SIMULTANEOUS_RECORDING
      }).length > 0 ? Msgs.ADD_ERROR_CONFLICT : add__add_series(booking);
    }
  }

  /**
   * Adds a series pvr booking.
   * @param {jsf.Booking} booking
   * @return {String}
   */
  function add__add_series_booking (booking) {
    var info = getter__get_nearest_epg_by_series_booking(booking);
    return add__normal(info ? {
      type: booking.type,
      repeat: '0',
      isReported: 0,
      rate: info.parentRating,
      frequency: booking.frequency,
      tsId: booking.tsId,
      serviceId: booking.serviceId,
      networkId: booking.networkId,
      logicNumber: booking.logicNumber,
      channelName: booking.channelName,
      epgName: info.languageLocal ? ((jsf.EPG.language === info.languageLocal) ? info.eventNameLocal : (info.eventNameSecond ? info.eventNameSecond : info.eventNameLocal)) : info.eventName,
      startDateTime: info.startDateTime,
      endDateTime: info.endDateTime,
      duration: info.duration,
      seriesKey: jsf.transformToSpecifiedType(info.extendString, 'String'),
      episodeKey: info.extendNumber1,
      episodeStatus: info.extendNumber3
    } : booking._toDataBaseJson());
  }

  var BookingManager = {};
  jsf.defineReadOnlyProperties(BookingManager, Msgs);
  jsf.defineReadOnlyProperties(BookingManager, Methods);
  jsf.defineReadOnlyProperties(BookingManager, ValidMethods);

  jsf.BookingManager = BookingManager;
}());