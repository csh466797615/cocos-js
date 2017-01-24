/**
 * Rec.js
 * @authors Casper 
 * @date    2016/07/16
 * @version 1.0.0
 */
define(['service/Local', 'service/Broadcast'], function(require, exports, module) {
  var Local = require('service/Local'),
    Broadcast = require('service/Broadcast'),
    timeShiftState = {
      state: 'none',
      code: 'error_not_start'
    },
    timeShiftWaitStopHandles = [],
    timeShiftHandle = -1,
    timeShiftMountPoint = null,
    timeShiftSuccessCallback = null,
    timeShiftErrorCallback = null,
    timeShiftInfo = {},
    listeners = [],
    recordingChannels = [],
    timeshiftDir = jsf.Setting.getLocalStorage('extendKey7'); //extendKey7 is TimeShift dir key

  if (timeshiftDir) {
    timeshiftDir = timeshiftDir.indexOf('/') === 0 ? timeshiftDir : ('/' + timeshiftDir);
  } else {
    timeshiftDir = '';
  }

  function triggerEvent(eventName, message) {
    for (var i = listeners.length - 1; i >= 0; i--) {
      try {
        listeners[i].callback.call(listeners[i].context || null, eventName, message);
      } catch (e) {
        jsf.log('[Rec] TriggerEvent error:' + e);
      }
    }
  }

  function getRecordingChannels() {
    var rec,
      channel,
      recArray = qin.pvr.getRecordingProgram();
    jsf.log('[Rec] qin.pvr.getRecordingProgram:' + recArray);
    recordingChannels = JSON.parse(recArray);
    jsf.log('[Rec] Get the recording channels length:' + recordingChannels.length);
  }

  function getMessage(code) {
    var message = {
        code: code,
        info: null
      },
      isEng = jsf.SysInfo.get('menuLanguage') !== 'chi';
    switch (code) {
      case Rec.CHECK_PASS:
        message.info = isEng ? 'Check pass' : '校驗通過';
        break;
      case Rec.ADD_SUCCESS:
        message.info = isEng ? 'Add success' : '添加預定成功';
        break;
      case Rec.START_SUCCESS:
        message.info = isEng ? 'Start success' : '啟動成功';
        break;
      case Rec.ERROR_START_FAIL:
        message.info = isEng ? 'Start fail' : '啟動失敗';
        break;
      case Rec.ERROR_NOT_START:
        message.info = isEng ? 'Not start' : '未啟動';
        break;
      case Rec.ERROR_NOT_OPEN_PVR:
        message.info = isEng ? 'Please contact Service Center to subscribe PVR function. (Code: PVR001)' : '您尚未購買錄影功能，請與客服中心聯絡。(代碼: PVR001)';
        break;
      case Rec.ERROR_NO_DISK:
        message.info = isEng ? 'Please make sure hard drive disk connected. (Code: PVR002)' : '請連接錄影用硬碟機。(代碼: PVR002)';
        break;
      case Rec.ERROR_NO_PAIRED_DISK:
        message.info = isEng ? 'Please make sure entitled hard drive disck connected. (Code: PVR003)' : '請連接已授權的錄影用硬碟機。(代碼: PVR003)';
        break;
      case Rec.ERROR_NOT_BUY_SPACE:
        message.info = isEng ? 'Please contact Service Center to subscribe disk sapce for PVR. (Code: PVR004)' : '您尚未訂購錄影空間，請與客服中心聯絡。(代碼: PVR004)';
        break;
      case Rec.ERROR_REC_START_ERROR:
        message.info = isEng ? 'Device is busy, please try again later. (Code: PVR005)' : '機上盒忙碌中，請稍後再嘗試錄影。(代碼: PVR005)';
        break;
      case Rec.ERROR_REC_STOP_ERROR:
        message.info = isEng ? 'Device is busy, please try again later. (Code: PVR006)' : '機上盒忙碌中，請稍後再嘗試取消錄影。(代碼: PVR006)';
        break;
      case Rec.ERROR_REC_ERROR:
        message.info = isEng ? 'Unknown causes error recording. (Code: PVR007)' : '不明原因導致錄製發生異常。(代碼: PVR007)';
        break;
      case Rec.ERROR_BUY_SPACE_FULL:
      case Rec.ERROR_DISK_FULL:
        message.info = isEng ? 'Disk is full, please delete out-of-date recordings. (Code: PVR008)' : '錄影空間已滿，請刪除過期影片以騰出空間。(代碼: PVR008)';
        break;
      case Rec.ERROR_TIMESHIFT_NO_DISK:
      case Rec.ERROR_TIMESHIFT_NO_PAIRED_DISK:
        message.info = isEng ? 'Please make sure hard drive disk connected. (Code: TS002)' : '請連接錄影用硬碟機。(代碼: TS002)';
        break;
      case Rec.ERROR_DISK_SPACE_NOT_ENOUGH:
        message.info = isEng ? 'Not enough space for PVR recording, please install at least 32GB hard drive disk. (Code: PVR014)' : '錄影裝置空間不足32GB，請安裝大於32GB的硬碟機。(代碼: PVR014)';
        break;
      case Rec.ERROR_TOO_MANY_DISK:
        message.info = isEng ? 'Only one recording device is supported, remove. (Code: PVR013)' : '僅支援一部錄製設備，請移除不必要裝置。(代碼: PVR013)';
        break;
      case Rec.ERROR_TIMESHIFT_REC_START_ERROR:
        message.info = isEng ? 'Device is busy, please try again later. (Code: TS005)' : '機上盒忙碌中，請稍後再嘗試時光平移。(代碼: TS005)';
        break;
      case Rec.ERROR_TIMESHIFT_REC_STOP_ERROR:
        message.info = isEng ? 'Device is busy, please try again later. (Code: TS006)' : '機上盒忙碌中，請稍後再嘗試取消時光平移。(代碼: TS006)';
        break;
      case Rec.ERROR_TIMESHIFT_REC_ERROR:
        message.info = isEng ? 'Unknown causes error recording. (Code: TS007)' : '不明原因導致錄製發生異常。(代碼: TS007)';
        break;
      case Rec.ERROR_INVALID_BOOKING:
        message.info = isEng ? 'The booking is invalid' : '無效預約，請進行正確的設置';
        break;
      case Rec.ERROR_NO_SERVICE:
        message.info = isEng ? 'Invalid program, the corresponding channel is not found' : '預約節目非法，未找到對應的頻道';
        break;
      case Rec.ERROR_MAXCOUNT:
        message.info = isEng ? 'The booking list is full' : '預約列表已滿';
        break;
      case Rec.ERROR_RECORDING_NOW:
        message.info = isEng ? 'The channel is recording now' : '該頻道正在錄製';
        break;
      case Rec.ERROR_OTHER_RECORDING_NOW:
        message.info = isEng ? 'A channel is recording now' : '其它頻道正在錄製';
        break;
      case Rec.ERROR_TIME_EXPIRED:
        message.info = isEng ? 'Program has expired' : '節目已過期';
        break;
      case Rec.ERROR_CONFLICT:
        message.info = isEng ? 'Conflict with other bookings' : '與其它預約衝突';
        break;
      case Rec.ERROR_EXIST:
        message.info = isEng ? 'Booking already exists' : '預約已存在';
        break;
      case Rec.ERROR_MANUAL_RECORDING_NOW:
        message.info = isEng ? 'A channel is recording now' : '有頻道正在錄製';
        break;
      default:
        message.info = code;
        break;
    }
    return message;
  }

  Broadcast.on('event:usb', function (eventName, data) {
    switch (eventName) {
      case jsf.EventSystem.USB_PLUGIN:
        Rec._pvrs = null;
        break;
      case jsf.EventSystem.USB_PLUGOUT:
        Rec._pvrs = null;
        if (timeShiftMountPoint !== null) {
          for (var i = 0, j = data.length; i < j; i++) {
            if (timeShiftMountPoint === data[i].mountPoint) {
              Rec.stopTimeShift('The usb is pulled out');
              break;
            }
          }
        }
        break;
    }
  });

  jsf.eventManager.addListener({
    event: jsf.EventListener.SYSTEM,
    eventType: jsf.EventSystem.TYPE_PVR,
    callback: function (event) {
      var eventName = event.getEventName();
      var data = event.getEventData();
      try {
        var findPvr = false,
          findTimeshift = false,
          message = '';
        switch (eventName) {
          case jsf.EventSystem.PVR_REC_START_OK:
            for (var i = data.length - 1; i >= 0; i--) {
              if (!findTimeshift && data[i].pvrHandle === timeShiftHandle) {
                findTimeshift = true;
                timeShiftState = {
                  state: Rec.START_SUCCESS
                };
                timeShiftInfo.startTime = new Date();
                jsf.log('[Rec] Listener find timeshift handle. Timeshift rec start ok, change startTime to ' + jsf.dateFormat(timeShiftInfo.startTime, 'yyyy/MM/dd hh:mm:ss'));
                try {
                  timeShiftSuccessCallback && timeShiftSuccessCallback(Rec.getTimeShiftInfo());
                } catch (e) {
                  jsf.log('[Rec] Timeshift PVR_REC_START_OK' + e);
                }
                timeShiftSuccessCallback = null;
                continue;
              }
              if (!findPvr) {
                jsf.log('[Rec] Listener find pvr handle. Rec start, so get recordingChannels.');
                findPvr = true;
                getRecordingChannels();
              }
              if (findPvr && findTimeshift) break;
            }
            break;
          case jsf.EventSystem.PVR_REC_ERROR:
            for (var i = data.length - 1; i >= 0; i--) {
              if (!findTimeshift && data[i].pvrHandle === timeShiftHandle) {
                jsf.log('[Rec] Listener find timeshift handle. Rec error, so will stop timeshift');
                findTimeshift = true;
                Rec.stopTimeShift(Rec.ERROR_TIMESHIFT_REC_ERROR);
                continue;
              }
              if (!findPvr) {
                jsf.log('[Rec] Listener find pvr handle. Rec error, so get recordingChannels.');
                findPvr = true;
                message = getMessage(Rec.ERROR_REC_ERROR).info;
                getRecordingChannels();
              }
              if (findPvr && findTimeshift) break;
            }
            break;
          case jsf.EventSystem.PVR_REC_STOP_OK:
            for (var i = data.length - 1; i >= 0; i--) {
              findTimeshift = false;
              if (timeShiftWaitStopHandles.length > 0) {
                for (var n = timeShiftWaitStopHandles.length - 1; n >= 0; n--) {
                  if (data[i].pvrHandle === timeShiftWaitStopHandles[n]) {
                    jsf.log('[Rec] Listener find timeshift wait handle, so remove the handle from timeShiftWaitStopHandles.');
                    timeShiftWaitStopHandles.splice(n, 1);
                    findTimeshift = true;
                    break;
                  }
                }
              }
              if (findTimeshift) continue;
              if (!findPvr) {
                jsf.log('[Rec] Listener find pvr handle. Rec stop, so get recordingChannels.');
                findPvr = true;
                getRecordingChannels();
                Rec._pvrs = null;
              }
              if (findPvr && findTimeshift) break;
            }
            break;
          case jsf.EventSystem.PVR_REC_DISKFULL:
            jsf.log('[Rec] Disk is full, so get recordingChannels.');
            findPvr = true;
            getRecordingChannels();
            jsf.log('[Rec] Disk is full, so will stop timeshift');
            Rec.stopTimeShift(Rec.ERROR_DISK_FULL);
            message = getMessage(Rec.ERROR_DISK_FULL).info;
            break;
          case jsf.EventSystem.PVR_BUY_SPACE_FULL:
            jsf.log('[Rec] Buy space is full, so get recordingChannels.');
            findPvr = true;
            getRecordingChannels();
            message = getMessage(Rec.ERROR_BUY_SPACE_FULL).info;
            break;
          case jsf.EventSystem.PVR_REC_START_ERROR:
            jsf.log('[Rec] Pvr start error, so get recordingChannels.');
            findPvr = true;
            getRecordingChannels();
            message = getMessage(Rec.ERROR_REC_START_ERROR).info;
            break;
          default:
            jsf.log('[Rec] Event:' + eventName);
            break;
        }
        findPvr && triggerEvent(eventName, message);
        findTimeshift && event.stopPropagation();
      } catch (e) {
        jsf.log('[Rec] Listener error:' + e);
      }
    }
  }, -1);
  getRecordingChannels();
  var Rec = {
    CHECK_PASS: 'check_pass',
    ADD_SUCCESS: 'add_success',
    START_SUCCESS: 'start_success',
    ERROR_START_FAIL: 'error_start_fail',
    ERROR_NO_DISK: 'error_no_disk',
    ERROR_TOO_MANY_DISK: 'error_too_many_disk',
    ERROR_DISK_SPACE_NOT_ENOUGH: 'error_disk_space_not_enough',
    ERROR_NO_PAIRED_DISK: 'error_no_paired_disk',
    ERROR_NOT_OPEN_PVR: 'error_not_open_pvr',
    ERROR_NOT_BUY_SPACE: 'error_not_buy_space',
    ERROR_NOT_START: 'error_not_start',
    ERROR_REC_START_ERROR: 'error_rec_start_error',
    ERROR_REC_ERROR: 'error_rec_error',
    ERROR_REC_STOP_ERROR: 'error_rec_stop_error',
    ERROR_TIMESHIFT_REC_START_ERROR: 'error_timeshift_rec_start_error',
    ERROR_TIMESHIFT_REC_ERROR: 'error_timeshift_rec_error',
    ERROR_TIMESHIFT_REC_STOP_ERROR: 'error_timeshift_rec_stop_error',
    ERROR_TIMESHIFT_NO_DISK: 'error_timeshift_no_disk',
    ERROR_TIMESHIFT_NO_PAIRED_DISK: 'error_no_timeshift_paired_dis',
    ERROR_INVALID_BOOKING: 'error_invalid_booking',
    ERROR_NO_SERVICE: 'error_no_service',
    ERROR_MAXCOUNT: 'error_maxcount',
    ERROR_RECORDING_NOW: 'error_recording_now',
    ERROR_OTHER_RECORDING_NOW: 'error_other_recording_now',
    ERROR_TIME_EXPIRED: 'error_time_expired',
    ERROR_CONFLICT: 'error_conflict',
    ERROR_EXIST: 'error_exist',
    ERROR_BUY_SPACE_FULL: 'error_buy_space_full',
    ERROR_DISK_FULL: 'error_disk_full',
    ERROR_MANUAL_RECORDING_NOW: 'error_manual_recording_now',
    MAX_TIMESHIFT_DURATION: 7200,
    checkDisk: function() {
      var result;
      if (Local.getDevices().length > 0) {
        result = this.CHECK_PASS;
      } else {
        jsf.log('[Rec] Error no disk');
        result = this.ERROR_NO_DISK;
      }
      return getMessage(result);
    },
    checkConditional: function(isTimeshift) {
      var result,
        devices = Local.getDevices(),
        devicesLength = devices.length;
      jsf.log('[Rec] devices length is ' + devicesLength);
      if (devicesLength > 0) {
        if (false/*!isTimeshift && Local.getMaxDeviceSize() < 32 * 1024*/) {
          result = this.ERROR_DISK_SPACE_NOT_ENOUGH;
        } else {
          result = this.CHECK_PASS;
        }
      } else {
        jsf.log('[Rec] Error no disk, isTimeshift is ' + !!isTimeshift);
        result = isTimeshift ? this.ERROR_TIMESHIFT_NO_DISK : this.ERROR_NO_DISK;
      }
      return getMessage(result);
    },
    start: function(program, discover) {
      jsf.log('[Rec] start instant rec');
      var code = this.checkConditional().code;
      if (code === this.CHECK_PASS) {
        if (program instanceof jsf.Program) {
          if (!this.isRecording(program.getChannel())) {
            if (!discover || !this.isRecording()) {
              var booking = jsf.Booking.create(jsf.Booking.TYPE_MANUAL_PVR, program);
              booking.startTime = new Date();
              jsf.log('[Rec] Change booking startTime to now:' + jsf.dateFormat(program.startTime, 'yyyy/MM/dd hh:mm:ss'));
              code = jsf.BookingManager.add(booking);
              jsf.log('[Rec] Add manual booking:' + code);
              switch (code) {
                case jsf.BookingManager.ADD_OK:
                  code = this.ADD_SUCCESS;
                  break;
                case jsf.BookingManager.ADD_FAIL:
                  code = this.ERROR_START_FAIL;
                  break;
                case jsf.BookingManager.ADD_ERROR_TIME:
                  code = this.ERROR_TIME_EXPIRED;
                  break;
                case jsf.BookingManager.ADD_ERROR_SERVICE:
                  code = this.ERROR_NO_SERVICE;
                  break;
                case jsf.BookingManager.ADD_ERROR_MAXCOUNT:
                  code = this.ERROR_MAXCOUNT;
                  break;
                case jsf.BookingManager.ADD_ERROR_INVALID_BOOKING:
                  code = this.ERROR_INVALID_BOOKING;
                  break;
                default:
                  var conflictArray = jsf.BookingManager.getConflict(booking);
                  jsf.log('[Rec] Conflicts and manuals length:' + conflictArray.length + ', discover:' + !!discover);
                  if (conflictArray.length > 0 && discover) {
                    code = this.ERROR_CONFLICT;
                  } else {
                    for (var i = 0, j = conflictArray.length; i < j; i++) {
                      if (conflictArray[i].cycleType === jsf.Booking.CYCEL_SINGLE) {
                        jsf.BookingManager.delete(conflictArray[i]);
                      }
                    }
                    code = jsf.BookingManager.addByNoCheck(booking);
                    jsf.log('[Rec] Add manual again:' + code);
                    code = code === jsf.BookingManager.ADD_OK ? this.ADD_SUCCESS : this.ERROR_START_FAIL;
                  }
                  break;
              }
            } else {
              jsf.log('[Rec] Error other is recording now');
              code = this.ERROR_OTHER_RECORDING_NOW;
            }
          } else {
            jsf.log('[Rec] Error is recording now');
            code = this.ERROR_RECORDING_NOW;
          }
        } else {
          jsf.log('[Rec] Invaild param, can not to start');
          code = this.ERROR_INVALID_BOOKING;
        }
      }
      return getMessage(code);
    },
    stop: function() {
      jsf.log('[Rec] RecordingChannels length:' + recordingChannels.length);
      if (recordingChannels.length > 0) {
        jsf.log('[Rec] qin.booking.stopBooking');
        qin.booking.stopBooking();
      }
    },
    startTimeShift: function(channel, success, error) {
      jsf.log('[Rec] Start timeshift, current status is ' + timeShiftState.state);
      if (channel === timeShiftInfo.channel) {
        if (success !== void 0 || error !== void 0) {
          this.setTimeShiftCallback(success, error);
        }
        return;
      }
      var code = this.checkConditional(true).code;
      if (code === this.CHECK_PASS) {
        this.stopTimeShift();
        var pids = channel.getAudioPids();
        var array = [];
        for (var i = 0, j = pids.length; i < j; i++) {
          array.push({
            'audioPID': pids[i].pid,
            'audioDecodeType': pids[i].audioDecodeType,
            'language': pids[i].name
          });
        }
        var deviceInfo = Local.getDevices()[0].deviceInfo[0],
          path = deviceInfo.mountPoint + timeshiftDir,
          params = JSON.stringify({
            'type': 'timeShift',
            'quality': 'normal',
            'encryption': jsf.PVR.ENCRYPTION_STB,
            'frequency': channel.frequency,
            'tsId': channel.tsId,
            'serviceId': channel.serviceId,
            'networkId': channel.networkId,
            'symbolRate': channel.symbolRate,
            'modulation': channel.modulation,
            'videoPID': channel.videoPID,
            'videoDecodeType': channel.videoDecodeType,
            'audio': array,
            'pcrPID': channel.PCRPID,
            'pmtPID': channel.pmtPID,
            'fileSystem': deviceInfo.fileSystem,
            'time': 7200,
            'filePath': path,
            'fileName': 'timeshift'
          });
        jsf.log('[Rec] Timeshift to start:' + params);
        timeShiftHandle = qin.pvr.start(params);
        jsf.log('[Rec] Timeshift handle:' + timeShiftHandle);
        if (timeShiftHandle >= 0) {
          timeShiftMountPoint = deviceInfo.mountPoint;
          timeShiftState = {
            state: 'none',
            code: this.ADD_SUCCESS
          };
          timeShiftSuccessCallback = success;
          timeShiftErrorCallback = error;
          timeShiftInfo = {
            channel: channel,
            startTime: new Date(),
            path: path + '/timeshift.ts'
          };
          code = this.ADD_SUCCESS;
        } else {
          code = this.ERROR_START_FAIL;
        }
      }
      var msg = getMessage(code);
      error && code !== this.ADD_SUCCESS && error(msg);
      return msg;
    },
    stopTimeShift: function(reason) {
      timeShiftInfo = {};
      jsf.log('[Rec] stopTimeShift: state is ' + timeShiftState.state + ', code is ' + timeShiftState.code + ', timeShiftHandle is ' + timeShiftHandle);
      if (timeShiftState.state === this.START_SUCCESS || timeShiftState.state === 'none' && timeShiftState.code === this.ADD_SUCCESS || timeShiftHandle >= 0) {
        if (timeShiftHandle >= 0) {
          jsf.log('[Rec] Stop timeshift, handle is ' + timeShiftHandle);
          qin.pvr.stop(timeShiftHandle);
          timeShiftWaitStopHandles.push(timeShiftHandle);
        } else {
          jsf.log('[Rec] Timeshift handle is -1, so do not need to stop');
        }
        timeShiftHandle = -1;
        timeShiftMountPoint = null;
        timeShiftSuccessCallback = null;
        if (reason) {
          try {
            timeShiftErrorCallback && timeShiftErrorCallback(getMessage(reason));
          } catch (e) {
            jsf.log('[Rec] Timeshift error callback:' + e);
          }
        }
        timeShiftErrorCallback = null;
        timeShiftState = {
          state: 'none',
          code: reason || this.ERROR_NOT_START
        };
      } else {
        jsf.log('[Rec] Timeshift do not need to stop');
      }
    },
    setTimeShiftPosition: function(date) {
      jsf.log('[Rec] Change timeshift position to now:' + date.format('yyyy/MM/dd hh:mm:ss'));
      timeShiftInfo.position = date;
    },
    getTimeShiftInfo: function() {
      if (!timeShiftInfo.position) {
        jsf.log('[Rec] Not set timeshift position, so set position value equal to startTime');
        timeShiftInfo.position = timeShiftInfo.startTime;
      }
      return timeShiftInfo;
    },
    getTimeShiftMountPoint: function() {
      return timeShiftMountPoint;
    },
    setTimeShiftCallback: function(success, error) {
      switch (timeShiftState.state) {
        case this.START_SUCCESS:
          success && success(this.getTimeShiftInfo());
          timeShiftErrorCallback = error;
          break;
        case 'none':
          if (timeShiftState.code === this.ADD_SUCCESS) {
            timeShiftSuccessCallback = success;
            timeShiftErrorCallback = error;
          } else {
            error && error(getMessage(timeShiftState.code));
          }
          break;
      }
    },
    clearTimeShiftCallback: function() {
      timeShiftSuccessCallback = null;
      timeShiftErrorCallback = null;
    },
    getRecording: function () {
      return recordingChannels;
    },
    isRecording: function(channel) {
      if (channel) {
        jsf.log('[Rec] The channel which logicnumber is ' + channel.logicNumber + ' will check whether in the recording. recordingChannels length is ' + recordingChannels.length);
        for (var i = 0, j = recordingChannels.length; i < j; i++) {
          if (channel.frequency === recordingChannels[i].frequency && channel.serviceId === recordingChannels[i].serviceId && channel.tsId === recordingChannels[i].tsId) {
            jsf.log('[Rec] recording channel');
            return true;
          }
        }
      } else {
        jsf.log('[Rec] No channel, so return whether recording. is recording now:' + (recordingChannels.length > 0));
        return recordingChannels.length > 0;
      }
      return false;
    },
    listener: function(callback, context) {
      listeners.push({
        callback: callback,
        context: context
      });
    },
    remove: function(callback) {
      for (var i = 0, j = listeners.length; i < j; i++) {
        if (listeners[i].callback === callback) {
          listeners.splice(i, 1);
          i--;
          j--;
        }
      }
    },
    removeByContext: function(context) {
      for (var i = 0, j = listeners.length; i < j; i++) {
        if (listeners[i].context === context) {
          listeners.splice(i, 1);
          i--;
          j--;
        }
      }
    },
    clearListener: function() {
      listeners = [];
    },
    _pvrs: null,
    getPvrs: function () {
      var devices;
      /*var devices = Local.getDevices();
      var has = false;
      if (this._pvrs && this._pvrs.length > 0 && devices.length > 0) {
        var filePath = this._pvrs[0].url;
        for (var i = devices.length - 1; i >= 0; i--) {
          for (var j = devices[i].deviceInfo.length - 1; j >= 0; j--) {
            if (filePath.indexOf(devices[i].deviceInfo[j].mountPoint) >= 0) {
              has = true;
              break;
            }
          }
        }
      }
      (!has || this._pvrs && (this._pvrs.length > 0 && devices.length === 0 || this._pvrs.length === 0 && devices.length > 0)) && (this._pvrs = null);*/
      if (this._pvrs === null && (devices = Local.getDevices()).length > 0) {
        this._pvrs = [];
        //extendKey8 is pvr dir key
        var pvrDir = jsf.Setting.getLocalStorage('extendKey8');
        if (pvrDir) {
          pvrDir = pvrDir.indexOf('/') === 0 ? pvrDir : ('/' + pvrDir);
        } else {
          pvrDir = '';
        }
        var paths = [];
        for (var i = devices.length - 1; i >= 0; i--) {
          for (var j = devices[i].deviceInfo.length - 1; j >= 0; j--) {
            paths.push(devices[i].deviceInfo[j].mountPoint + pvrDir);
          }
        }
        this._pvrs = jsf.PVRManager.getPVRFiles(paths);
        this._pvrs.sort(function(a, b) {
          return a.startTime > b.startTime ? -1 : a.startTime < b.startTime ? 1 : a.serviceId < b.serviceId ? -1 : 1;
        });
      }
      return this._pvrs || [];
    }
  };
  module.exports = Rec;
});