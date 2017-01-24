/**
 * JSFPVR.js
 * @authors Casper 
 * @date    2016/08/02
 * @version 1.0.0
 */
/**
 * jsf.PVR is a global object.
 * @requires jsf.Channel, jsf.Program
 */
(function() {
  'use strict';
  /**
   * The type of pvr.
   * @constant
   * @type {String}
   */
  var Types = {
    TYPE_PVR: 'pvr',
    TYPE_TIMESHIFT: 'timeshift'
  };
  /**
   * The file system of pvr.
   * @constant
   * @type {String}
   */
  var FileSystem = {
    FILESYSTEM_NTFS: 'NTFS',
    FILESYSTEM_FAT32: 'FAT32',
  };
  /**
   * The encryption of pvr.
   * @constant
   * @type {String}
   */
  var Encryption = {
    ENCRYPTION_NONE: 'noEncryption',
    ENCRYPTION_CA: 'caEncryption',
    ENCRYPTION_STB: 'stbEncryption'
  };
  /**
   * The quality of pvr.
   * @constant
   * @type {String}
   */
  var Quality = {
    QUALITY_NORMAL: 'normal',
    QUALITY_LOW: 'low'
  };
  /**
   * The mthods of jsf.PVR.
   * @constant
   * @type {Function}
   */
  var Methods = {
    start: start,
    startByChannel: start__start_by_channel,
    startByProgram: start__start_by_program,
    pause: function (handle) {return !qin.pvr.pause(handle);},
    resume: function (handle) {return !qin.pvr.resume(handle);},
    stop: function (handle) {return !qin.pvr.stop(handle);}
  };

  function vaild (obj, opts) {
    var pass = true;
    jsf.each(obj, function (value, key) {
      if ((!value || jsf.isUndefined(opts[value])) && jsf.isUndefined(opts[key])) return (jsf.error('jsf.PVR vaild: ' + (value || key) + ' must have value'), pass = false);
      obj[key] = opts[value || key];
    });
    return pass;
  }

  function transform__transform_opts (opts) {
    if (!opts) return null;
    // The value of deviceInfo is from local device
    if (opts.deviceInfo) {
      opts.fileSystem = opts.deviceInfo.fileSystem;
      opts.filePath ? opts.filePath.indexOf(opts.deviceInfo.mountPoint) !== 0 && (opts.filePath = opts.deviceInfo.mountPoint + opts.filePath) : (opts.filePath = opts.deviceInfo.mountPoint);
    }
    var params = {};
    if (!vaild(params = {
      type: false,
      filePath: false,
      fileSystem: false
    }, opts)) return null;
    return params;
  }

  function start (params) {
    return qin.pvr.start(params);
  }

  function start__start_by_channel (channel, opts) {
    if (!jsf.isInstanceof(channel, jsf.Channel)) {
      jsf.error('jsf.PVR start__start_by_channel: error params.');
      return -1;
    }
    var params;
    if (!(params = transform__transform_opts(opts))) return -1;
    var pids = channel.getAudioPids();
    var array = [];
    for (var i = 0, j = pids.length; i < j; i++) {
      array.push({
        audioPID: pids[i].pid,
        audioDecodeType: pids[i].audioDecodeType,
        language: pids[i].name
      });
    }
    return start({
      type: params.type,
      time: opts.duration || jsf.PVR_DURATION,
      quality: opts.quality || jsf.PVR_QUALITY,
      encryption: opts.encryption || jsf.PVR_ENCRYPTION,
      frequency: channel.frequency,
      tsId: channel.tsId,
      serviceId: channel.serviceId,
      networkId: channel.networkId,
      symbolRate: channel.symbolRate,
      modulation: channel.modulation,
      videoPID: channel.videoPID,
      videoDecodeType: channel.videoDecodeType,
      audio: array,
      pcrPID: channel.PCRPID,
      pmtPID: channel.pmtPID,
      fileSystem: params.fileSystem,
      filePath: params.filePath,
      fileName: opts.fileName || channel.name,
      level: opts.rating || jsf.PVR_RATING
    });
  }

  function start__start_by_program (program, opts) {
    if (!jsf.isInstanceof(program, jsf.Program)) {
      jsf.error('jsf.PVR start__start_by_program: error params.');
      return -1;
    }
    var endTime = program.endTime.getTime();
    if (endTime >= Date.now()) {
      jsf.error('jsf.PVR start__start_by_program: program has expired.');
      return -1;
    }
    opts = opts || {};
    var maxDuration = Math.floor((endTime - Date.now()) / 1000);
    (jsf.isUndefined(opts.duration) || opts.duration > maxDuration) && (opts.duration = maxDuration);
    jsf.isUndefined(opts.fileName) && (opts.fileName = program.name);
    jsf.isUndefined(opts.rating) && (opts.rating = program.parentRating);
    return start__start_by_channel(program.getChannel(), opts);
  }

  var JSFPVR = {};

  jsf.defineReadOnlyProperties(JSFPVR, Types);
  jsf.defineReadOnlyProperties(JSFPVR, FileSystem);
  jsf.defineReadOnlyProperties(JSFPVR, Encryption);
  jsf.defineReadOnlyProperties(JSFPVR, Quality);
  jsf.defineReadOnlyProperties(JSFPVR, Methods);

  jsf.PVR = JSFPVR;
}());