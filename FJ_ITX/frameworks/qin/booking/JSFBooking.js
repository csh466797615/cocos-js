/**
 * JSFBooking.js
 * @authors Casper 
 * @date    2015/10/12
 * @version 1.0.0
 */
/**
 * Used to describe a booking information.
 * @requires jsf.Program, jsf.Channel
 */
(function () {
  'use strict';
  var booking_regexp__repeat = /^(0|[1-7]+)$/g, // To match the cycle attribute field of jsf.Booking.
      booking_regexp__repeat_cycle = /[1-7]/g; // To match which day of the week. 
  var slice = Array.prototype.slice;
  /**
   * The type of booking.
   * @constant
   * @type {Number}
   */
  var Types = {
    TYPE_NONE: 0, //invalid
    TYPE_EPG: 1, //play
    TYPE_PVR: 2, //pvr
    TYPE_NVOD: 3, //nvod
    TYPE_POWER_ON: 4, //boot
    TYPE_POWER_OFF: 5, //shut down
    TYPE_TIME_PVR: 6, //timing booking
    TYPE_MANUAL_PVR: 7, //timely booking   Uniqueness   The highest priority
    TYPE_PLAY_CONTROL: 8, //program control
    TYPE_SERIES_PVR: 9 //series recording
  };
  /**
   * The cycle type of booking.
   * @constant
   * @type {String}
   */
  var CycleTypes = {
    CYCLE_SINGLE: 'SINGLE',
    CYCLE_WEEKLY: 'WEEKLY',
    CYCLE_DAILY: 'DAILY'
  };
  /**
   * The mthods of jsf.Booking.
   * @constant
   * @type {Function}
   */
  var Methods = {
    create: create__instance,
    __createByInfo: create__create_by_info,
    createReminder: jsf.createAssigner(create__create_for_normal_by_program, Types.TYPE_EPG),
    createPvr: jsf.createAssigner(create__create_for_normal_by_program, Types.TYPE_PVR),
    createTimePvr: create__create_for_time_pvr,
    createManualPvr: jsf.createAssigner(create__create_for_normal_by_program, Types.TYPE_MANUAL_PVR),
    createSeries: create__create_for_series,
    createPowerOn: jsf.createAssigner(create__create_for_standby, Types.TYPE_POWER_ON),
    createPowerOff: jsf.createAssigner(create__create_for_standby, Types.TYPE_POWER_OFF),
    is: valid__is_booking
  };
  /**
   * Print information.
   * @constant
   * @type {String}
   */
  var LogInfos = {
    error__invalid_parameters__booking: 'Invalid parameters, booking must be an instance of jsf.Booking.(jsf.Booking)',
    error__invalid_parameters__program: 'Invalid parameters, program must be an instance of jsf.Program.(jsf.Booking)',
    error__invalid_parameters__program2: 'Dont find the channel by program.(jsf.Booking)',
    error__invalid_parameters__program3: 'Invalid parameters, the seriesKey of program must not be an empty string.(jsf.Booking)',
    error__invalid_parameters__channel: 'Invalid parameters, channel must be an instance of jsf.Channel.(jsf.Booking)',
    error__invalid_parameters__date: 'Invalid parameters, the date is not a valid date.(jsf.Booking)',
    error__instance__create: 'Invalid parameters.(jsf.Booking)',
    warn__instance__create: 'Deprecated, please use new construction instead.(jsf.Booking)'
  };

  /**
   * Creates a specified array base on the cycle type of jsf.Booking.
   * @param  {String} cycleType  The cycle type of jsf.Booking
   * @return {Array}
   */
  function create__create_booking_repeat__array (cycleType) {
    switch (cycleType) {
      case CycleTypes.CYCLE_DAILY:
        return [1, 1, 1, 1, 1, 1, 1];
      default:
        return [0, 0, 0, 0, 0, 0, 0];
    }
  }

  /**
   * Converts an object to a date.
   * @param  {*} date  An object 
   * @return {*}
   */
  function transform__transform_obj_to_date (date) {
    return jsf.isString(date) ? new Date(date.replace(/-/g, '/')) : date;
  }

  function transform__transform_string_to_array_for_repeat (repeat) {
    var result = repeat.match(booking_regexp__repeat);
    if (result) {
      result = result[0];
      if (result !== '0') {
        result = result.match(booking_regexp__repeat_cycle);
        var array = create__create_booking_repeat__array(CycleTypes.CYCLE_SINGLE);
        for (var i = 0, j = result.length; i < j; i++) {
          array[result[i] - 1] = 1;
        }
        return array;
      }
    }
    return create__create_booking_repeat__array(CycleTypes.CYCLE_SINGLE);
  }

  /**
   * Transform a repeat attribute array to string.
   * @param  {Array} repeat
   * @return {String}
   */
  function transform__transform_repeat_to_string (repeat) {
    return (repeat = repeat.join('').replace(/\w/g, function(word, index, array) {
      return word === '0' ? '' : (index + 1);
    })) === '' ? '0' : repeat;
  }

  /**
   * Transform a date to string, the target format is YYYY-MM-dd hh:mm:ss.
   * @param  {Date} date
   * @return {String}
   */
  function transform__transform_date_to_string (date) {
    return jsf.dateFormat(date, 'YYYY-MM-dd hh:mm:ss');
  }

  /**
   * Detects whether is a jsf.Booking instance.
   * If not, then print an error(LogInfos.error__invalid_parameters__booking).
   * @param  {*} obj
   * @return {Boolean}
   */
  function valid__is_booking (obj) {
    if (jsf.isInstanceof(obj, JSFBooking)) {
      return true;
    }
    jsf.error(LogInfos.error__invalid_parameters__booking);
    return false;
  }

  /**
   * Detects whether is a jsf.Program instance.
   * If not, then print an error(LogInfos.error__invalid_parameters__program).
   * @param  {*} obj
   * @return {Boolean}
   */
  function valid__is_program (obj) {
    if (!jsf.isInstanceof(obj, jsf.Program)) {
      jsf.error(LogInfos.error__invalid_parameters__program);
      return false;
    }
    if (!valid__is_date(transform__transform_obj_to_date(obj.startTime)) || !valid__is_date(transform__transform_obj_to_date(obj.endTime))) {
      return false;
    }
    return true;
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
   * Detects whether is a series reservation.
   * If not, then print an error(LogInfos.error__invalid_parameters__program3).
   * @param  {*} obj
   * @return {Boolean}
   */
  function valid__is_series (obj) {
    if (valid__is_program(obj)) {
      if(obj.seriesKey !== '') return true;
      jsf.error(LogInfos.error__invalid_parameters__program3);
    }
    return false;
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
   * Sets a set of properties frome a jsf.Channel instance for obj.
   * @param  {Object} obj
   * @param  {jsf.Chanel} channel
   */
  function setter__get_info_from_channel (obj, channel) {
    obj._programName = channel.name;
    obj._logicNumber = channel.logicNumber;
    obj._frequency   = channel.frequency;
    obj._tsId        = channel.tsId;
    obj._serviceId   = channel.serviceId;
    obj._networkId   = channel.networkId;
  }

  /**
   * Sets a set of properties frome a jsf.Program instance for obj.
   * @param  {Object} obj
   * @param  {jsf.Program} program
   */
  function setter__get_info_from_program (obj, program) {
    obj._epgName          = program.name;
    obj._startDateTime = transform__transform_date_to_string(program.startTime);
    obj._endDateTime   = transform__transform_date_to_string(program.endTime);
    obj._rate  = program.parentRating;
    obj._seriesKey     = program.seriesKey;
    obj._episodeKey    = program.episodeKey;
    obj._episodeStatus = program.episodeLast;
    obj._duration      = Math.floor(program.endTime.getTime() / 1000) - Math.floor(program.startTime.getTime() / 1000);
  }

  /**
   * Sets the repeat property and the cycleType property for jsf.Booking.
   * Set the cycle property when the conversion is successful.
   * @param  {jsf.Booking} booking
   * @param  {Array} repeatObj
   */
  function setter__set_booking_repeat (booking, repeatObj) {
    if (jsf.isArray(repeatObj) && repeatObj.length === 7) {
      var num = 0,
        repeat = '';
      for (var i = 0, j = repeatObj.length; i < j; i++) {
        if (repeatObj[i] === 1) {
          num++;
          repeat += (i + 1);
        }
      }
      booking._cycleType = num === 0 ? CycleTypes.CYCLE_SINGLE : num === 7 ? CycleTypes.CYCLE_DAILY : CycleTypes.CYCLE_WEEKLY;
      num === 0 && (repeat = '0');
      booking._repeat = repeat;
    }
  }

  /**
   * Gets a jsf.Channel instance instance from a jsf.Program instance.
   * If can't get the instance, then print an error(LogInfos.error__invalid_parameters__program2).
   * @param  {jsf.Program} program
   * @return {jsf.Channel|null}
   */
  function getter__get_channel_from_program (program) {
    if (valid__is_program(program)) {
      var channel = program.getChannel();
      if (valid__is_channel(channel)) {
        return channel;
      }
      jsf.error(LogInfos.error__invalid_parameters__program2);
    }
    return null;
  }

  /**
   * Creates a booking whith a JSON format data.
   * @param  {Object} info
   * @return {jsf.Booking}
   */
  function create__create_by_info (info) {
    var booking = create__create_a_empty_booking();
    jsf.each(info, function (value, key) {
      setter__get_info_from_data(booking, value, key);
    });
    return booking;
  }

  /**
   * Allocates a booking through a jsf.Program instance.
   * Creates a booking whith type and a jsf.Program instance.
   * @param  {Number} type  The valid type of jsf.Booking, please refer to Types
   * @param  {jsf.Program} program
   * @return {jsf.Booking|null}
   */
  function create__create_by_program (type, program) {
    switch (type) {
      case Types.TYPE_EPG:
      case Types.TYPE_PVR:
      case Types.TYPE_MANUAL_PVR:
        return create__create_for_normal_by_program(type, program);
      case Types.TYPE_SERIES_PVR:
        return create__create_for_series(program);
      default:
        return create__create_a_empty_booking();
    }
  }

  /**
   * Allocates a booking through a jsf.Channel instance.
   * @param  {Number} type  The valid type of jsf.Booking, please refer to Types
   * @param  {jsf.Channel} channel
   * @param  {Date} startTime
   * @param  {Date} endTime
   * @param  {Array} *repeat
   * @param  {Number} *parentRating
   * @return {jsf.Booking}
   */
  function create__create_by_channel (type, channel, startTime, endTime, repeat, parentRating) {
    switch (type) {
      case Types.TYPE_TIME_PVR:
        return create__create_for_time_pvr(channel, startTime, endTime, repeat, parentRating);
      default:
        return create__create_a_empty_booking();
    }
  }

  /**
   * Creates a booking by a jsf.Program instance.
   * @param  {Number} type  The valid type of jsf.Booking, please refer to Types
   * @param  {jsf.Program} program
   * @return {jsf.Booking}
   */
  function create__create_for_normal_by_program (type, program) {
    var booking = create__create_a_empty_booking();
    var channel = getter__get_channel_from_program(program);
    if (channel) {
      booking._type = type;
      setter__get_info_from_program(booking, program);
      setter__get_info_from_channel(booking, channel);
    }
    return booking;
  }

  /**
   * Creates a booking by a jsf.Channel instance.
   * @param  {Number} type  The valid type of jsf.Booking, please refer to Types
   * @param  {jsf.Channel} channel
   * @param  {Date} startTime
   * @param  {Date} endTime
   * @return {jsf.Booking}
   */
  function create__create_for_normal_by_channel (type, channel, startTime, endTime) {
    var booking = create__create_a_empty_booking();
    if (valid__is_channel(channel)) {
      if (valid__is_date(startTime = transform__transform_obj_to_date(startTime)) && valid__is_date(endTime = transform__transform_obj_to_date(endTime))) {
        booking._type          = type;
        booking._epgName       = channel.name;
        booking._startDateTime = transform__transform_date_to_string(startTime);
        booking._endDateTime   = transform__transform_date_to_string(endTime);
        booking._duration      = Math.floor(endTime.getTime() / 1000) - Math.floor(startTime.getTime() / 1000);
        setter__get_info_from_channel(booking, channel);
      }
    }
    return booking;
  }

  /**
   * Creates a time pvr type booking.
   * @param  {jsf.Channel} channel
   * @param  {Date} startTime
   * @param  {Date} endTime
   * @param  {Array} *repeat
   * @param  {Number} *parentRating
   * @return {jsf.Booking}
   */
  function create__create_for_time_pvr (channel, startTime, endTime, repeat, parentRating) {
    var booking = create__create_for_normal_by_channel(Types.TYPE_TIME_PVR, channel, startTime, endTime);
    if (jsf.isNumber(repeat) && jsf.isUndefined(parentRating)) {
      booking._rate = repeat;
    } else {
      setter__set_booking_repeat(booking, repeat);
      jsf.isNumber(parentRating) && (booking._rate = parentRating);
    }
    return booking;
  }

  /**
   * Creates a series pvr type booking.
   * @param  {jsf.Program} program
   * @return {jsf.Booking}
   */
  function create__create_for_series (program) {
    return valid__is_series(program) ? create__create_for_normal_by_program(Types.TYPE_SERIES_PVR, program) : create__create_a_empty_booking();
  }


  /**
   * Creates a standby type booking.
   * @param  {Number} type  The valid type of jsf.Booking, please refer to Types
   * @param  {Date} time  Time triggered
   * @param  {Array} *repeat
   * @return {jsf.Booking}
   */
  function create__create_for_standby (type, time, repeat) {
    var booking = create__create_a_empty_booking();
    if (valid__is_date(time = transform__transform_obj_to_date(time))) {
      booking._type          = type;
      booking._startDateTime = transform__transform_date_to_string(time);
      setter__set_booking_repeat(booking, repeat);
    }
    return booking;
  }

  /**
   * Creates an instance based on the condition.
   * @return {jsf.Booking}
   */
  function create__instance () {
    jsf.warn(LogInfos.warn__instance__create);
    if (arguments.length === 0) return null;
    var args = slice.call(arguments),
        argsLength = args.length;
    switch(true) {
      case argsLength === 1:
        return create__create_by_info(arguments[0]);
      case argsLength >= 4 && jsf.isInstanceof(args[1], jsf.Channel):
        return create__create_by_channel.apply(null, args);
      case argsLength >= 2:
        return jsf.isInstanceof(args[1], jsf.Program) ? create__create_by_program.apply(null, args) : create__create_for_standby.apply(null, args);
      default:
        jsf.error(LogInfos.error__instance__create);
        return create__create_a_empty_booking();  
    }
  }

  /**
   * Create a jsf.Booking instance.
   * @return {jsf.Booking}
   */
  function create__create_a_empty_booking () {
    return new JSFBooking();
  }

  var WatingBookingSQL = ' AND isReported=0',
      AvailableBookingSQL = '(isReported=0 OR isReported=3)',
      AvailableBookingLinkSQL = ' AND ' + AvailableBookingSQL;

  /**
   * Description of a booking information.
   * @class
   * @extends jsf.Class
   */
  var JSFBooking = jsf.Class.extend({
    /**
     * Converts the booking's attribute value to the data format in the database.
     * @return {Object}
     */
    _toDataBaseJson: function () {
      return {
        type: this.type,
        repeat: this._repeat,
        isReported: this.isReported,
        frequency: this.frequency,
        tsId: this.tsId,
        serviceId: this.serviceId,
        networkId: this.networkId,
        logicNumber: this.logicNumber,
        channelName: this.channelName,
        epgName: this.name,
        startDateTime: this._startDateTime,
        endDateTime: this._endDateTime,
        rate: this.parentRating,
        duration: this.duration,
        seriesKey: this.seriesKey,
        episodeKey: this.episodeKey,
        episodeStatus: this.episodeStatus
      };
    },
    /**
     * Returns if the booking is valid.
     * @return {Boolean}
     */
    isValid: function () {
      return this._type !== Types.TYPE_NONE;
    }
  });
  var bookingPrototype = JSFBooking.prototype;

  var __temp;
  jsf.each({
    id: {value: 0, private: true},
    type: {value: Types.TYPE_NONE},
    isReported: {value: 0}, // 0: waiting, 1: expired, 2: conflict, 3: recording
    logicNumber: {value: 0},
    name: {value: '', aliase: 'epgName'},
    channelName: {value: '', aliase: 'programName'},
    startTime: {value: '', transform: transform__transform_obj_to_date, aliase: 'startDateTime'},
    endTime: {value: '', transform: transform__transform_obj_to_date, aliase: 'endDateTime'},
    duration: {value: 0},
    repeat: {value: '0', transform: transform__transform_string_to_array_for_repeat}, // An array of length seven. From Monday to Sunday. 
    cycleType: {value: CycleTypes.CYCLE_SINGLE, transform: function () {return this._repeat === '0' ? CycleTypes.CYCLE_SINGLE : this._repeat === '1234567' ? CycleTypes.CYCLE_DAILY : CycleTypes.CYCLE_WEEKLY;}},
    frequency: {value: 0},
    tsId: {value: 0},
    serviceId: {value: 0},
    networkId: {value: 0},
    playUrl: {value: ''}, // No effect
    parentRating: {value: 0, aliase: 'rate'},
    seriesKey: {value: ''},
    episodeKey: {value: 0},
    episodeStatus: {value: 0}
  }, function (prop, propName) {
    __temp = '_' + (prop.aliase || propName);
    jsf.defineValue(bookingPrototype, __temp, prop.value);
    !prop.private && jsf.defineGetterSetter(bookingPrototype, propName, jsf.createPropAssigner(__temp, prop.transform));
  });

  jsf.defineReadOnlyProperties(JSFBooking, Types);
  jsf.defineReadOnlyProperties(JSFBooking, CycleTypes);
  jsf.defineReadOnlyProperties(JSFBooking, Methods);

  jsf.Booking = JSFBooking;
}());