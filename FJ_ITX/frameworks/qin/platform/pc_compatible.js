/**
 * pc_compatible.js
 * @authors Casper 
 * @date    2016/06/13
 * @version 1.0.0
 */
var qin = {};
(function () {
  'use strict';
  var channels = [];
  var channelMap = {};
  var keys = ['indexProgram','systemId','tunerId','tunerType','networkId','tsId','frequency','serviceId','type','pmtPID','pcrPID','logicId','volume','soundChannel','status','freeCA','videoStreamType','videoPID','streamId','audioIndex','subtitleIndex','sdtVersion','patVersion','satelliteId','symbolRate','modulation','polarization','name','bat','pmtcrc','pmtlength','pmtsection','entitleStatus','autoHide','userHide','lock','favor','timeShift','number','pid','streamType','nName','bouquetId'];
  var values = [[2,0,0,'dvbc',40978,1,405000,2,1,6020,6021,2,15,'stereo',0,0,27,6021,65535,0,0,4,9,'',5217,'qam256','','bb快報','',2910012759,36,'',1,0,0,1,1,1,2,6022,3,'Barker Channel',801],
  [3,18946,0,'dvbc',40978,11,345000,5,1,6050,6051,5,15,'stereo',256,1,27,6051,65535,0,0,4,4,'',5217,'qam256','','CNN  International NAME AGE HH','',3739494869,43,'',1,0,0,0,0,0,5,6052,3,'SCTV PHIM TONG',802],//CNN International
  [4,18946,0,'dvbc',40978,7,369000,6,1,6060,6061,6,15,'stereo',576,1,27,6061,65535,0,0,4,0,'',5217,'qam256','','民視','',2827058531,65,'',1,0,0,0,0,0,6,6062,3,'FTV'],
  [5,18946,0,'dvbc',40978,7,369000,7,1,6070,6071,7,15,'stereo',1,1,27,6071,65535,0,0,4,0,'',5217,'qam256','','人間衛視','',2993024729,54,'',1,0,0,0,0,0,7,6072,3,'Beautiful Live TV',803],
  [6,18946,0,'dvbc',40978,7,369000,8,1,6080,6081,8,15,'stereo',576,1,27,6081,65535,0,0,4,0,'',5217,'qam256','','台視','',3871244622,65,'',1,0,0,0,0,0,8,6082,3,'TTV',804],
  [7,18946,0,'dvbc',40978,7,369000,9,1,6090,6091,9,15,'stereo',513,1,27,6091,65535,0,0,4,0,'',5217,'qam256','','大愛','',3904383685,65,'',1,0,0,0,0,0,9,6092,3,'Da-Ai',805],
  [8,0,0,'dvbc',40978,12,339000,11,1,6110,6111,11,15,'stereo',64,0,27,6111,65535,0,0,4,6,'',5217,'qam256','','霹靂台灣台','',2290434663,26,'',1,0,0,0,0,0,11,6112,3,'Pili',812],
  [9,18946,0,'dvbc',40978,6,375000,12,1,6120,6121,12,15,'stereo',576,1,27,6121,65535,0,0,4,12,'',5217,'qam256','','華視','',1736751262,65,'',1,0,0,0,0,0,12,6122,3,'CTS',812],
  [10,18946,0,'dvbc',40978,6,375000,13,2,6130,6131,13,15,'stereo',1,1,27,6131,65535,0,0,4,12,'',5217,'qam256','','公共電視','',3828756006,71,'',1,0,0,0,0,0,13,6132,3,'PTV',812],
  [11,18946,0,'dvbc',40978,6,375000,15,1,6150,6151,15,15,'stereo',513,1,27,6151,65535,0,0,4,12,'',5217,'qam256','','好消息','',3808240749,54,'',1,0,0,0,0,0,15,6152,3,'Good TV',812]];
  var channel;
  for (var i = 0, j = values.length; i < j; i++) {
    channel = {};
    for (var n = 0, m = keys.length; n < m; n++) {
      channel[keys[n]] = values[i][n];
    }
    channels.push(channel);
    jsf.log('create channel:' + channel.serviceId + '-' + channel.tsId);
    channelMap[channel.serviceId + '-' + channel.tsId] = channel;
  }
  var id = 1;
  var bookings = null;

  function createBookings () {
    if (bookings === null) {
      bookings = [];
      var day = jsf.dateFormat(new Date(), 'YYYY-MM-dd');
      var channel;
      var min = Math.floor((new Date()).getHours() / 2) + 1;
      var random;
      var booking;
      for (var i = 0; i < 7; i++) {
        random = Math.floor(Math.random() * 10);
        if (i === 0) {
          random = Math.max(min, random);
        } else {
          day = jsf.dateFormat(new Date(Date.now() + i * 24 * 3600 * 1000), 'YYYY-MM-dd');
        }
        for (var n = 0, m = channels.length; n < m; n++) {
          channel = channels[n];
          booking = {
            'id': id++,
            'type': Math.random() > 0.4 ? jsf.Booking.TYPE_EPG : jsf.Booking.TYPE_PVR,
            'programName': channel.name,
            'epgName': channel.name + random,
            'tsId': channel.tsId,
            'serviceId': channel.serviceId,
            'networkId': channel.networkId,
            'frequency': channel.frequency,
            'startDateTime': day + ' ' + random * 2 + ':11:00',
            'endDateTime': day + ' ' + (random + 1) * 2 + ':11:00'
          };
          jsf.log('create booking', booking);
          bookings.push(booking);
        }
      }
    }
  }

  qin.data = {
    set: function () {},
    query: function (db, sql) {
      createBookings();
      switch (true) {
        case db === 'program' && sql.indexOf('bouquetId') >= 0://ifnull
          return JSON.stringify(channels);
        case db === 'program' && sql.indexOf('program_stream') >= 0:
          return JSON.stringify([{
            audioIndex: 0,
            language: 'chi',
            pid: '1538',
            streamType: '4'
          }, {
            audioIndex: 1,
            language: 'eng',
            pid: '1539',
            streamType: '4'
          }]);
        case sql.indexOf('booking') >= 0:
          if (sql.indexOf('type=1 OR type=2') >= 0) {
            return JSON.stringify(bookings);
          }
          var result = (/type=(\d+).*startDateTime=\"(.*)\".*endDateTime=\"([\-\:\d\s]+)\".*tsId=(\d+).*serviceId=(\d+)/).exec(sql);
          var adds = [];
          if (result) {
            var serviceId = result[5];
            var tsId = result[4];
            var channel = channelMap[serviceId + '-' + tsId];
            adds.push({
              'id': id++,
              'type': Number(result[1]),
              'programName': channel.name,
              'epgName': channel.name + Math.floor((new Date(result[4].replace(/-/g, '/'))).getHours() / 2),
              'tsId': channel.tsId,
              'serviceId': channel.serviceId,
              'networkId': channel.networkId,
              'frequency': channel.frequency,
              'startDateTime': result[2],
              'endDateTime': result[3]
            });
          }
          return JSON.stringify(adds);
        case (db === 'others' || db === 'memory') && sql.indexOf('epgPF') >= 0:
          var result = (/serviceId=(\d+).*tsId=(\d+)/).exec(sql);
          var epgs = [];
          if (result) {
            var serviceId = result[1];
            var tsId = result[2];
            var channel = channelMap[serviceId + '-' + tsId];
            var day = jsf.dateFormat(new Date(), 'YYYY-MM-dd');
            var current = new Date().getHours();
            var startDateTime;
            var endDateTime;
            for (var i = current; i < current + 2; i++) {
              startDateTime = day + ' ' + i + ':00:00';
              if (i + 1 === 24) {
                endDateTime = day + ' 23:59:59';
              } else {
                endDateTime = day + ' ' + (i + 1) + ':00:00';
              }
              epgs.push({
                frequency: channel.frequency,
                tsId: channel.tsId,
                serviceId: channel.serviceId,
                pfFlag: 0,
                eventName: channel.name + i,
                startDateTime: startDateTime,
                endDateTime: endDateTime,
                duration: 100,
                parentRating: 18,
                languageLocal: 'chi',
                content: 'This is This is This is This is This is This is This is This is This is This is This is This is This is This is This is This isThis isThis isThis isThis isThis isThis isThis isThis isThis isThis isThis isThis isThis is' + channel.name + channel.name + channel.name,
                eventNameLocal: 'Ts China Za ' + channel.name + day + '-chi-' + i + '-' + startDateTime,
                eventNameSecond: 'Ts Eng Za ' + channel.name + day + '-eng-' + i + '-' + endDateTime,
                contentLocal: i % 2 === 0 ? 'This is This is This is This is This is This is This is This is This is This is This is This is This is This is This is This isThis isThis isThis isThis isThis isThis isThis isThis isThis isThis isThis isThis isThis is' + channel.name + channel.name + channel.name : '',
                contentSecond: i % 2 === 0 ? 'This is This is This is This is This is This is This is This is This is This is This is This is This is This is This is This isThis isThis isThis isThis isThis isThis isThis isThis isThis isThis isThis isThis isThis is' + channel.name + channel.name + channel.name : ''
              });
            }
          }
          return JSON.stringify(epgs);
        case (db === 'others' || db === 'memory') && sql.indexOf('epg') >= 0:
          var result = (/serviceId=(\d+).*tsId=(\d+).*startDateTime>=\"(.*)\".*startDateTime<=\"([:-\d\s]*)\"/).exec(sql);
          var epgs = [];
          if (result) {
            var serviceId = result[1];
            var tsId = result[2];
            var startTime = result[3];
            var channel = channelMap[serviceId + '-' + tsId];
            var day = jsf.dateFormat(new Date(startTime.replace(/-/g, '/')), 'YYYY-MM-dd');
            var startDateTime;
            var endDateTime;
            var booking;
            for (var i = new Date(startTime.replace(/-/g, '/')).getHours(); i < 24; i++) {
              startDateTime = day + ' ' + i + ':00:00';
              if (i + 1 === 24) {
                endDateTime = day + ' 23:59:59';
              } else {
                endDateTime = day + ' ' + (i + 1) + ':00:00';
              }
              epgs.push({
                frequency: channel.frequency,
                tsId: channel.tsId,
                serviceId: channel.serviceId,
                pfFlag: 0,
                eventName: channel.name + i,
                startDateTime: startDateTime,
                endDateTime: endDateTime,
                duration: 100,
                parentRating: 18,
                languageLocal: 'chi',
                content: 'This is This is This is This is This is This is This is This is This is This is This is This is This is This is This is This isThis isThis isThis isThis isThis isThis isThis isThis isThis isThis isThis isThis isThis is' + channel.name + channel.name + channel.name,
                eventNameLocal: 'Ts China Za ' + channel.name + day + '-chi-' + i + '-' + startDateTime,
                eventNameSecond: 'Ts Eng Za ' + channel.name + day + '-eng-' + i + '-' + endDateTime,
                contentLocal: i % 2 === 0 ? 'This is This is This is This is This is This is This is This is This is This is This is This is This is This is This is This isThis isThis isThis isThis isThis isThis isThis isThis isThis isThis isThis isThis isThis is' + channel.name + channel.name + channel.name : '',
                contentSecond: i % 2 === 0 ? 'This is This is This is This is This is This is This is This is This is This is This is This is This is This is This is This isThis isThis isThis isThis isThis isThis isThis isThis isThis isThis isThis isThis isThis is' + channel.name + channel.name + channel.name : '',
                extendString: ''
              });
            }
          }
          return JSON.stringify(epgs);
        default:
          return JSON.stringify([]);
      }
    },
    getStorage: function (key) {
      if (window.sessionStorage) {
        var result = sessionStorage.getItem(key);
        jsf.log('[getStorage]' + key + '=' + result);
        return result === null ? '' : result;
      } else {
        jsf.log('[getStorage]The browser doesnt support sessionStorage, so return empty string.');
        return '';
      }
    },
    setStorage: function (key, value) {
      jsf.log('[setStorage]' + key + '=' + value);
      var result = '';
      if (window.sessionStorage) {
        sessionStorage.setItem(key, value);
      }
    },
    getSystem: function (key) {
      if (window.localStorage) {
        var result = localStorage.getItem(key);
        jsf.log('[getLocalStorage]' + key + '=' + result);
        return result === null ? '' : result;
      } else {
        jsf.log('[getStorage]The browser doesnt support getLocalStorage, so return empty string.');
        return '';
      }
    },
    setSystem: function (key, value) {
      if (window.localStorage) {
        jsf.log('[setLocalStorage]' + key + '=' + value);
        localStorage.setItem(key, value);
      }
    },
    resume: function () {}
  };

  qin.evt = {
    setEventCallback: function (callback) {},
    debug: function (str) {
      console.debug(str);
    }
  };

  qin.epg = {
    request: function (type, playStatus, request) {
      setTimeout(function () {
        jsf.eventManager.dispatchEvent(new jsf.EventSystem(jsf.EventSystem.TYPE_EPG, type === 'pf' ? jsf.EventSystem.EPG_PF_CACHE : jsf.EventSystem.EPG_CACHE, JSON.parse(request)));
      }, 100);
    }
  };

  qin.settings = {
    get: function () {
      return '{"hwVer":"1.0","swVer":"2.1"}';
    }
  };

  qin.booking = {
    getSeconds: function () {
      return 15;
    },
    setBookingProgram: function () {
      return 0;
    },
    removeBookingByProgram: function () {},
    removeBookingById: function () {}
  };

  var media = null;
  var media_info = {
    duration: 0,
    position: 0
  };
  var rewindTimer = -1;
  var isLoading = false;
  var currentType = null;
  var Media = {
    play: function(url) {
      var type = url.indexOf('.mp3') >= 0 ? 'AUDIO' : 'VIDEO';
      if (currentType !== type) {
        if (currentType === 'VIDEO') {
          document.body.removeChild(media);
        }
        currentType = type;
        media = document.createElement(type);
        if (currentType === 'VIDEO') {
          media.setAttribute('style', 'position: absolute; width: 100%; height: 100%; left: 0; top: 0; z-index: -1;');
          document.body.appendChild(media);
        }
        media.preload = 'metadata';
        media.addEventListener('loadstart', function() {
          console.log('loadstart');
        });
        media.addEventListener('canplay', function() {
          console.log('canplay');
        }, false);
        media.addEventListener('canplaythrough', function() {
          console.log('canplaythrough');
          if (isLoading) {
            isLoading = false;
            media.play();
            jsf.eventManager.dispatchEvent(new jsf.EventSystem(jsf.EventSystem.TYPE_MEDIAPLAYER, jsf.EventSystem.MEDIAPLAYER_BUFFERING_START));
          }
        }, false);
        media.addEventListener('durationchange', function() {
          console.log('durationchange', media.duration);
          media_info.duration = media.duration;
        });
        media.addEventListener('timeupdate', function() {
          media_info.position = media.currentTime;
          console.log('timeupdate', media.currentTime);
        }, false);
        media.addEventListener('progress', function() {
          // media_info.position = media.currentTime;
          // console.log('progress', media.currentTime);
          // if (media.buffered.length) {
          //   for (var i = media.buffered.length - 1; i >= 0; i--) {
          //     console.log(media.buffered.start(i) + '-' + media.buffered.end(i));
          //     if (media.buffered.start(i) <= media.currentTime) {
          //       // vm.cache = media.buffered.end(i) / media.duration * 200;
          //       break;
          //     }
          //   }
          // }
        }, false);
        media.addEventListener('pause', function() {
          console.log('pause', media.duration);
          media_info.duration = media.duration;
        }, false);
        media.addEventListener('playing', function() {
          console.log('playing', media.duration);
        }, false);
        media.addEventListener('ended', function() {
          console.log('ended');
          jsf.eventManager.dispatchEvent(new jsf.EventSystem(jsf.EventSystem.TYPE_MEDIAPLAYER, jsf.EventSystem.MEDIAPLAYER_FINISH));
        }, false);
      }
      isLoading = true;
      clearInterval(rewindTimer);
      media.playbackRate = 1;
      media.src = url;
      media_info = {
        duration: 0,
        position: 0
      };
    },
    pause: function() {
      if (media) {
        media.pause();
        media.playbackRate = 1;
        clearInterval(rewindTimer);
      }
    },
    resume: function() {
      if (media) {
        clearInterval(rewindTimer);
        media.playbackRate = 1;
        media.play();
      }
    },
    seek: function(position) {
      if (media) {
        clearInterval(rewindTimer);
        media.playbackRate = 1;
        media.currentTime = position;
      }
    },
    rewind: function(rate) {
      if (media) {
        media.playbackRate = 1;
        clearInterval(rewindTimer);
        rewindTimer = setInterval(function() {
          var position = Math.max(0, media.currentTime - rate);
          if (position <= 0) {
            Media.seek(0);
            jsf.eventManager.dispatchEvent(new jsf.EventSystem(jsf.EventSystem.TYPE_MEDIAPLAYER, jsf.EventSystem.MEDIAPLAYER_BUFFERING_END));
          } else {
            media.currentTime = position;
          }
        }, 1000);
      }
    },
    forward: function(rate) {
      if (media) {
        clearInterval(rewindTimer);
        media.playbackRate = rate;
      }
    },
    get: function(param) {
      return media_info[param];
    }
  };
  qin.player = {
    create: function () {
      return 123;
    },
    start: function () {
      var params = JSON.parse(arguments[1]);
      if (params.type === 'file') {
        Media.play(params.url);
      }
      return 0;
    },
    destroy: function () {
      return 0;
    },
    stop: function () {
      Media.pause();
      return 0;
    },
    pause: function () {
      Media.pause();
      return 0;
    },
    resume: function () {
      Media.resume();
      return 0;
    },
    forward: function () {
      Media.forward(arguments[1]);
      return 0;
    },
    backward: function () {
      Media.rewind(arguments[1]);
      return 0;
    },
    get: function (handle, params) {
      var info = {};
      for (var i = 0, j = params.length; i < j; i++) {
        if (params[i] === 'duration') {
          info.duration = Media.get('duration');
        } else if (params[i] === 'position') {
          info.position = Media.get('position');
        } else if (params[i] === 'soundChannel') {
          info.soundChannel = qin.data.getSystem('currentAudio');
        }
      }
      return JSON.stringify(info);
    },
    set: function (handle, params) {
      var params = JSON.parse(params);
      for (var key in params) {
        if (key === 'soundChannel') {
          qin.data.setSystem('currentAudio', params[key]);
        }
      }
      return 0;
    },
    seek: function () {
      Media.seek(arguments[1]);
      return 0;
    },
    mute: function () {
      return 0;
    },
    unmute: function () {
      return 0;
    }
  };

  var devices = [{
    'mainDevice': 'Casper Usb',
    'serialNum': '546825',
    'deviceInfo': [{
      'label': 'C',
      'subdevice': '/dev/sda1',
      'mountPoint': 'media_test',
      'fileSystem': 'ntfs',
      'totalSize': 1000,
      'freeSize': 600,
      'usedSize': 0
    }, {
      'label': 'D',
      'subdevice': '/dev/sda2',
      'mountPoint': '/tmp/sda2',
      'fileSystem': 'ext3',
      'serialnum': '653221',
      'totalSize': 1000,
      'freeSize': 550,
      'usedSize': 0
    }]
  }, {
    'mainDevice': 'Casper Usb2',
    'serialNum': '546825',
    'deviceInfo': [{
      'label': 'C',
      'subdevice': '/dev/sdb1',
      'mountPoint': '/tmp/sdb1',
      'fileSystem': 'ntfs',
      'totalSize': 1000,
      'freeSize': 600,
      'usedSize': 0
    }, {
      'label': 'D',
      'subdevice': '/dev/sdb2',
      'mountPoint': '/tmp/sdb2',
      'fileSystem': 'ext3',
      'serialnum': '653221',
      'totalSize': 1000,
      'freeSize': 550,
      'usedSize': 0
    }]
  }];
  var deviceList = {};
  for (var i = 0, j = devices.length; i < j; i++) {
    for (var n = 0, m = devices[i].deviceInfo.length; n < m; n++) {
      if (n > 0) {
        deviceList[devices[i].deviceInfo[n].mountPoint] = [];
        continue;
      }
      var fileArray = [];
      for (var k = 0; k < 3; k++) {
        fileArray.push({
          name: k + '.png',
          type: 'FILE',
          size: 30
        });
        fileArray.push({
          name: k + '.mp4',
          type: 'FILE',
          size: 30
        });
        fileArray.push({
          name: k + '.mp3',
          type: 'FILE',
          size: 40
        });
        devices[i].deviceInfo[n].usedSize += 100;
      }
      deviceList[devices[i].deviceInfo[n].mountPoint] = fileArray;
      var path = devices[i].deviceInfo[n].mountPoint;
      for (var k = 0; k < 10; k++) {
        deviceList[path].push({
          name: 'this is a my dir' + k,
          type: 'DIR'
        });
        path += '/this is a my dir' + k;
        deviceList[path] = [];
      }
      if (Math.random() > .3) {
        deviceList[devices[i].deviceInfo[n].mountPoint].push({
          name: 'my dir',
          type: 'DIR'
        });
        fileArray = [];
        fileArray.push({
          name: '0.png',
          type: 'FILE',
          size: 30
        });
        fileArray.push({
          name: '0.mp4',
          type: 'FILE',
          size: 30
        });
        fileArray.push({
          name: '0.mp3',
          type: 'FILE',
          size: 40
        });
        devices[i].deviceInfo[n].usedSize += 100;
        deviceList[devices[i].deviceInfo[n].mountPoint + '/my dir'] = fileArray;
      }
      devices[i].deviceInfo[n].totalSize = devices[i].deviceInfo[n].usedSize + Math.floor(Math.random() * 500);
      devices[i].deviceInfo[n].freeSize = devices[i].deviceInfo[n].totalSize - devices[i].deviceInfo[n].usedSize;
    }
  }

  qin.local = {
    getDevice: function () {
      return JSON.stringify(devices);
    },
    getAvailableDevice: function(){
      return this.getDevice();
    },
    remove: function(){
      return 0;
    },
    getList: function (dir) {
      return JSON.stringify(deviceList[JSON.parse(dir).path]);
    }
  };

  qin.pvr = {
    _id: 1,
    start: function (parameter) {
      var id = this._id;
      setTimeout(function () {
        jsf.eventManager.dispatchEvent(new jsf.EventSystem(jsf.EventSystem.TYPE_PVR, jsf.EventSystem.PVR_REC_START_OK, [{
          pvrHandle: id
        }]));
      }, 500);
      return this._id++;
    },
    pause: function (handle) {
      return 0;
    },
    resume: function (handle) {
      return 0;
    },
    stop: function () {
      return 0;
    },
    getList: function (parameter) {
      return JSON.stringify([{
        'logicNumber': 2,
        'channelName': 'CCTV-2',
        'programName': 'NEWS 30',
        'startTime': '2014-12-11 18:00:00',
        'duration': 1800,
        'url': 'media_test/0.mp4',
        'netWorkId': 1,
        'tsId': 1,
        'frequency': 339000,
        'serviceId': 1,
        'level': 10,
        'size': 1213123,
        'recFlag': 0,
        'description': 'CCTV-2CCTV-2CCTV-2CCTV-2CCTV-2CCTV-2CCTV-2CCTV-2CCTV-2CCTV-2CCTV-2CCTV-2CCTV-2',
        'auPidIndex': 0,
        'auPidNum': 2,
        'audioPidInfo': [{
          'pid': 1,
          'decodeType': 1
        }, {
          'pid': 2,
          'decodeType': 3
        }],
        'isRead': 1
      }, {
        'logicNumber': 4,
        'channelName': 'CCTV-3',
        'programName': 'NEWS 33',
        'startTime': '2014-10-11 18:00:00',
        'duration': 1800,
        'url': 'media_test/1.mp4',
        'netWorkId': 1,
        'tsId': 1,
        'frequency': 339000,
        'serviceId': 2,
        'level': 8,
        'recFlag': 0,
        'size': 12123,
        'description': 'CCTV-2CCTV-2CCTV-2CCTV-2CCTV-2CCTV-2CCTV-2CCTV-2CCTV-2CCTV-2CCTV-2CCTV-2CCTV-2',
        'auPidIndex': 0,
        'auPidNum': 2,
        'audioPidInfo': [{
          'pid': 1,
          'decodeType': 1
        }, {
          'pid': 2,
          'decodeType': 3
        }],
        'isRead': 1
      }]);
    },
    setProgramInfo: function (handle, programName) {
      return 0;
    },
    changePID: function (handle, type, pid) {
      return 0;
    },
    getRecordingProgram: function () {
      return JSON.stringify([]);
    }
  };

  qin.wm = {
    create: function(_url) {
      return 100;
    },
    destroy: function() {},
    get: function(handle, param) {
      var rtn = {};
      if (param instanceof Array && param.length > 0) {
        for (var x = 0, y = param.length; x < y; x++) {
          rtn[param[x]] = x + 1000;
        }
        return JSON.stringify(rtn);
      }
    },
    set: function(handle, parameter) {
      return 0;
    },
    show: function() {},
    hide: function() {},
    focus: function() {},
    blur: function() {},
    broadcast: function() {},
    disableHomeKey: function() {},
    enableHomeKey: function() {},
    setMaximumDecodedImageSize: function() {}
  };

  qin.scan = {
    start: function () {
      setTimeout(function () {
        jsf.eventManager.dispatchEvent(new jsf.EventSystem(jsf.EventSystem.TYPE_SCAN, jsf.EventSystem.SCAN_FINISH, {allProgram: 10}));
      }, 1000);
    },
    cancel: function () {}
  };

  qin.ca = {
    CARefresh: function () {},
    getCAInfoRepertory: function () {
      return JSON.stringify({
        caName: {'caName': 'TongFang'},
        cardID: {'innerCardID': '560521', 'cardID': '8000020231658'},
        version: {'caLibVersion': 'CALIB-3.0', 'scSWVersion': 'SC-0.0', 'scHWVersion': 'SCHW-2.5'},
        caSystemID: [
            4102,
            4233
        ],
        provider: {provider: '深圳柠檬CA有限公司'},
        chipID: {chipID: '3F0399D3F4EAFF78'},
        cardExpireDate: {cardExpireDate: '2014-07-03 23:59:59'},
        cardNationality: {cardNationality: 'USA'},
        cardCustomizedInfo: {areaCode: 1235, reginCode: 4512, groupID: 4512},
        getRating: 13,
        getWorkTime: {startTime: '18:18:18', endTime: '08:18:18'}
      }); 
    },
    cardCustomizedInfo: function () {
      return JSON.stringify({
        areaCode: 1235,
        reginCode: 4512,
        groupID: 4512,
        casn: '10999',
        chipsetType: '99',
        chipsetRevision: '00io',
        cscMaxIndex: 35,
        projectInfo: '8877665',
        bouquetID: 1234,
        stbID: '10999',
        ACInfo: [1234567, 25106, 0, 20001, 0, 0, 0, 81226036, 10555614, 9, 10]
      });
    },
    getEmailNumInfo: function() {
      return JSON.stringify({
        emailSpaceNum: 100,
        emailNum: 3
      });
    },
    getEmailContent: function () {
      return 'Hello, World';
    },
    getEmails: function() {
      return JSON.stringify([{
        emailID: 8651,
        isNew: 0,
        priority: 0,
        senderID: '123456859',
        title: 'Welcome to Shenzhen0',
        sendTime: '2014-06-30 15:24:00'
      }, {
        emailID: 8652,
        isNew: 0,
        priority: 0,
        senderID: '123456859',
        title: 'Welcome to Shenzhen1',
        sendTime: '2014-06-29 15:24:00'
      },{
        emailID: 8654,
        isNew: 1,
        priority: 0,
        senderID: '3dssaadddsaasdads',
        title: 'Welcome to Shenzhen2',
        sendTime: '2014-06-30 15:24:00'
      }, {
        emailID: 8655,
        isNew: 1,
        priority: 0,
        senderID: '12341231131',
        title: 'Welcome to Shenzhen3',
        sendTime: '2014-06-29 15:24:00'
      }]);
    },
    lockEmail: function() {
      return 0;
    },
    unlockEmail: function() {
      return 0;
    },
    deleteEmail: function() {
      return 0;
    },
    deleteAll: function() {
      return 0;
    },
    cardStatus: function() {
      return '已插入';
    },
    getPairedStatus: function() {
      return JSON.stringify({
        pairedStatus: 1,
        pairedStbIDs: ['8000111222333', '8000111222334']
      });
    },
    setPaired: function(str) {
      return '配对成功';
    },
    checkPin: function(str) {
      return 0;
    },
    getRating: function() {
        return 8;
    },
    setRating: function() {
      return 0;
    },
    changePin: function(str) {
      return 0;
    },
    getWorkTime: function() {
      return JSON.stringify({
        startTime: '2014-03-17 18:18:18',
        endTime: '2014-03-18 08:18:18'
      });
    },
    setWorkTime: function(str) {
      return 1;
    },
    getOperators: function() {
      return JSON.stringify([{
        operatorID: 1,
        operatorInfo: 'shandong'
      }, {
        operatorID: 2,
        operatorInfo: 'shandong'
      }]);
    },
    getWallets: function() {
      return JSON.stringify([{
        operatorID: 1,
        walletID: 1,
        total: 100,
        balance: 80
      }, {
        operatorID: 1,
        walletID: 2,
        total: 230,
        balance: 180
      }]);
    },
    getEntitles: function() {
      return JSON.stringify([{
        operatorID: 1,
        producetID: 1,
        productName: 'CCTV1',
        startTime: '2014-06-30 12:24:09',
        endTime: '2015-06-30 12:24:09'
      }, {
        operatorID: 1,
        producetID: 2,
        productName: 'CCTV2',
        startTime: '2014-06-30 12:24:09',
        endTime: '2015-06-30 12:24:09'
      }, {
        operatorID: 1,
        producetID: 3,
        productName: 'CCTV3',
        startTime: '2014-06-30 12:24:09',
        endTime: '2015-06-30 12:24:09'
      }]);
    },
    getDetitleInfo: function() {
      return JSON.stringify({
        isRead: 1,
        detitleInfos: [{
          checkNum: 3
        }, {
          checkNum: 201
        }, {
          checkNum: 333
        }]
      });
    },
    delDetitle: function() {
      return 0;
    },
    getFeedDataInfo: function() {
      return JSON.stringify({
        isChild: 1,
        parentCardSN: '80000123456789',
        lastFeedTime: '2014-06-30 12:24:00',
        canFeed: 1,
        feedCycle: 0
      });
    },
    readFeedDataInfo: function() {
      return 0;
    },
    writeFeedDataInfo: function() {
      return 0;
    },
    getInquireIPP: function() {
      return JSON.stringify([{
        tsID: 1,
        networkID: 3,
        serviceID: 334,
        playHandle: 1,
        operatorID: 8652,
        productName: 1,
        sendTime: '2014-06-30 12:24:00',
        endTime: '2014-06-30 12:24:00',
        type: 0,
        price: '123456859'
      }]);
    },
    getViewedIPPs: function() {
      return JSON.stringify([{
        operatorID: 8652,
        walletID: 8652,
        productID: 8652,
        productName: 1,
        sendTime: '2014-06-30 12:24:00',
        endTime: '2014-06-30 12:24:00',
        type: 0,
        price: '123456859'
      }]);
    },
    book: function(str) {
      return 0;
    },
    cancelIPP: function(str) {
      return 0;
    }
  };

  qin.settings = {
    get: function () {
      return '{"hwVer":"1.0","swVer":"2.1","cpu":"BCM7584"}';
    }
  };

  qin.tuner = {
    lock: function(ts) {
      return true;
    },
    unlock: function(ts) {
      return true;
    },
    getStatus: function(ts) {
      var data = [{"networkType":"cable","status":"locked","frequency":"435000","symbolrate":"6875","qam":"qam64","strength":"48","quality":"44","ber":"0","snr":"44"}];
      ts = JSON.parse(ts);
      data[0].frequency = ts.frequency;
      return JSON.stringify(data);
    }
  };

  qin.network = {
    cache: {
      has: {
        "eth0": true,
        "wlan0": true
      },
      device: [{
        "type": "eth",
        "name": "eth0"
      }, {
        "type": "wlan",
        "name": "wlan0"
      }],
      netType: {
        "eth0": "dhcp",
        "wlan0": "dhcp"
      },
      pppoeInfo: {
        "eth0": {userName:'inspur',password:'123456'},
        "wlan0": {userName:'inspur',password:'123456'}
      },
      netInfo: {
        "eth0": {
          "ip": "10.8.8.10",
          "mask": "255.255.255.0",
          "gateway": "10.8.8.1",
          "dns1": "10.8.8.1",
          "dns2": "10.8.8.2",
          "mac": "00:14:85:84:a4:0b"
        },
        "wlan0": {
          "ip": "10.8.8.11",
          "mask": "255.255.255.0",
          "gateway": "10.8.8.1",
          "dns1": "10.8.8.1",
          "dns2": "10.8.8.2",
          "mac": "00:14:85:84:a4:0b"
        }
      },
      phyStatus: {
        "eth0": "connected",
        "wlan0": "disconnect"
      },
      wifiInfo: {},
      wifiMode: {
        "eth0": "ap",
        "wlan0": "wifi"
      },
      softAPInfo: {
        "eth0": '{"device": "eth0","ssid":"inspur","password":"0123456789", "encryptType":"wpa2psk", "broadcast":"on/off"," status":"on/off"}',
        "wlan0": '{"device": "wlan0","ssid":"inspur","password":"0123456789", "encryptType":"wpa2psk", "broadcast":"on/off"," status":"on/off"}'
      },
      apLinks: {
        "eth0": '[{"name":"pc1", "connectTime":"2014-08-12 14:31:00", "mac":"xx:xx:xx:xx:xx:xx","ip":"xxx.xxx.xxx.xxx"},{"name":"ipad", "connectTime":"2014-08-12 14:50:00", "mac":"xx:xx:xx:xx:xx:xx","ip":"xxx.xxx.xxx.xxx"}]',
        "wlan0": '[{"name":"pc2", "connectTime":"2014-08-12 14:31:00", "mac":"xx:xx:xx:xx:xx:xx","ip":"xxx.xxx.xxx.xxx"},{"name":"ipad", "connectTime":"2014-08-12 14:50:00", "mac":"xx:xx:xx:xx:xx:xx","ip":"xxx.xxx.xxx.xxx"}]'
      },
      cmInfos: {
        "mode": "on",
        "status": "online",
        "ds_info": [{
          "freq": "726000",
          "snr": "425",
          "ber": "0.000E-00",
          "power": "-53.3"
        }, {
          "freq": "734000",
          "snr": "425",
          "ber": "2.662E-04",
          "power": "-53.3"
        }],
        "us_info": [{
          "freq": "39000",
          "snr": "N/A",
          "ber": "N/A",
          "power": "497"
        }, {
          "freq": "39000",
          "snr": "N/A",
          "ber": "N/A",
          "power": "497"
        }]
      },

      lanDevices: [
        //裝置名稱長短不一的測試用數組
        {
          "name": "android-000000000000000",
          "mac": "d4:0b:1a:3c:b6:e6",
          "ip": "192.168.201.151"
        }, {
          "name": "android-11111111111111",
          "mac": "d4:0b:1a:3c:b6:e6",
          "ip": "192.168.201.152"
        }, {
          "name": "android-222222222222",
          "mac": "d4:0b:1a:3c:b6:e6",
          "ip": "192.168.201.151"
        }, {
          "name": "android-33333333333",
          "mac": "d4:0b:1a:3c:b6:e6",
          "ip": "192.168.201.152"
        }, {
          "name": "android-444444444444444",
          "mac": "d4:0b:1a:3c:b6:e6",
          "ip": "192.168.201.151"
        }, {
          "name": "android-555555555",
          "mac": "d4:0b:1a:3c:b6:e6",
          "ip": "192.168.201.152"
        }, {
          "name": "android-666666666666666",
          "mac": "d4:0b:1a:3c:b6:e6",
          "ip": "192.168.201.151"
        }, {
          "name": "android-777777777777",
          "mac": "d4:0b:1a:3c:b6:e6",
          "ip": "192.168.201.152"
        }, {
          "name": "android-888888888888888",
          "mac": "d4:0b:1a:3c:b6:e6",
          "ip": "192.168.201.151"
        }, {
          "name": "android-9999999999999",
          "mac": "d4:0b:1a:3c:b6:e6",
          "ip": "192.168.201.152"
        }, {
          "name": "android-aaaaaaa",
          "mac": "d4:0b:1a:3c:b6:e6",
          "ip": "192.168.201.152"
        }, {
          "name": "android-bbbbbbbbbbbbb",
          "mac": "d4:0b:1a:3c:b6:e6",
          "ip": "192.168.201.151"
        }, {
          "name": "android-ccccccccccccccc",
          "mac": "d4:0b:1a:3c:b6:e6",
          "ip": "192.168.201.152"
        }, {
          "name": "android-dddddddddddd",
          "mac": "d4:0b:1a:3c:b6:e6",
          "ip": "192.168.201.151"
        }, {
          "name": "android-eeeeeeeeeeeeeee",
          "mac": "d4:0b:1a:3c:b6:e6",
          "ip": "192.168.201.152"
        }
      ],

      lanInfo: {
        "gateway": "192.168.201.1"
      },
      wanInfo: {
        "ip": "10.8.8.10",
        "mask": "255.255.255.0",
        "gateway": "10.8.8.1",
        "dns1": "10.8.8.1",
        "dns2": "10.8.8.2",
        "mac": "00:14:85:84:a4:0b"
      }
    },
    getDevice: function() {
      return JSON.stringify(qin.network.cache.device);
    },
    getNetType: function(device) {
      return qin.network.cache.netType[device];
    },
    setNetType: function(device, netType) {
      qin.network.cache.netType[device] && (qin.network.cache.netType[device] = netType);
    },
    getPPPOEInfo: function(device) {
      return JSON.stringify(qin.network.cache.pppoeInfo[device]);
    },
    setPPPOEInfo: function(device, parameter) {
      qin.network.cache.pppoeInfo[device] = parameter;
    },
    setStaticInfo: function(device, parameter) {
      if (device.indexOf('eth') >= 0) {
        qin.network.cache.netType[device] !== 'static' && (qin.network.cache.netType[device] = 'static');
        jsf.inject(qin.network.cache.netInfo[device], JSON.parse(parameter));
      }
    },
    getNetInfo: function(device) {
      return JSON.stringify(qin.network.cache.netInfo[device]);
    },
    getMAC: function(device) {
      return qin.network.cache.netInfo[device] && qin.network.cache.netInfo[device].mac;
    },
    getPhyStatus: function(device) {
      if (qin.network.cache.phyStatus) {
        return qin.network.cache.phyStatus[device];
      } else {
        return "disconnect";
      }
    },
    scanAP: function() {
      setTimeout(function() {
        jsf.eventManager.dispatchEvent(new jsf.EventSystem(jsf.EventSystem.TYPE_NETWORK, jsf.EventSystem.NETWORK_SCAN_AP_SUCCESS, JSON.parse('[' +
          '{"device":"eth10","ssid":"inspur","encryptType":"wep","strength":"60"},' +
          '{"device":"eth10","ssid":"inspur1","encryptType":"none","strength":"30"},' +
          '{"device":"eth10","ssid":"inspur2","encryptType":"none","strength":"100"},' +
          '{"device":"eth10","ssid":"inspur4","encryptType":"","strength":"100"},' +
          '{"device":"eth10","ssid":"inspur5","encryptType":"wep","strength":"100"},' +
          '{"device":"eth10","ssid":"inspur6","encryptType":"wep","strength":"100"},' +
          '{"device":"eth10","ssid":"inspur7","encryptType":"wep","strength":"100"},' +
          '{"device":"eth10","ssid":"inspur8","encryptType":"wep","strength":"100"},' +
          '{"device":"eth10","ssid":"inspur9","encryptType":"wep","strength":"100"},' +
          '{"device":"eth10","ssid":"inspur10","encryptType":"wep","strength":"100"},' +
          '{"device":"eth10","ssid":"inspur11","encryptType":"wep","strength":"100"}]')));
      }, 500);
    },
    getWiFiInfo: function(device) {
      return qin.network.cache.wifiInfo[device];
    },
    setWiFiInfo: function(device, parameter) {
      qin.network.cache.has[device] && (qin.network.cache.phyStatus[device] = parameter);
      setTimeout(function() {
        jsf.eventManager.dispatchEvent(new jsf.EventSystem(jsf.EventSystem.TYPE_NETWORK, jsf.EventSystem.NETWORK_CONNECT_SUCCESS, {
          device: device
        }));
      }, 2000);

    },
    connect: function(device) {
      if (qin.network.cache.has[device]) {
        setTimeout(function() {
          jsf.eventManager.dispatchEvent(new jsf.EventSystem(jsf.EventSystem.TYPE_NETWORK, jsf.EventSystem.NETWORK_CONNECT_SUCCESS, {
            device: device
          }));
        }, 2000);
        return 0;
      }
      return 1;
    },
    disconnect: function(device) {
      if (qin.network.cache.has[device]) {
        return 0;
      }
      return 1;
    },
    ping: function(device, url) {
      if (qin.network.cache.has[device]) {
        setTimeout(function() {
          jsf.eventManager.dispatchEvent(new jsf.EventSystem(jsf.EventSystem.TYPE_NETWORK, jsf.EventSystem.NETWORK_PING_SUCCESS, {
            device: device,
            url: url
          }));
        }, 500);
      } else {
        setTimeout(function() {
          jsf.eventManager.dispatchEvent(new jsf.EventSystem(jsf.EventSystem.TYPE_NETWORK, jsf.EventSystem.NETWORK_PING_FAIL, {
            device: device,
            url: url
          }));
        }, 500);
      }
    },
    getWiFiMode: function(device) {
      return qin.network.cache.wifiMode[device];
    },
    setWiFiMode: function(device, mode) {
      qin.network.cache.has[device] && (qin.network.cache.wifiMode[device] = mode);
    },
    getSoftAPInfo: function(index, device) {
      return qin.network.cache.softAPInfo[device];
    },
    setSoftAPInfo: function(index, parameter) {
      var info = JSON.parse(parameter);
      qin.network.cache.has[info.device] && (qin.network.cache.softAPInfo[info.device] = parameter);
    },
    getSoftAPLinkingInfo: function(index, device) {
      return qin.network.cache.apLinks[device];
    },
    startSoftAP: function(index, device) {
      if (qin.network.cache.has[device]) {
        setTimeout(function() {
          jsf.eventManager.dispatchEvent(new jsf.EventSystem(jsf.EventSystem.TYPE_NETWORK, jsf.EventSystem.AP_OEPN_SUCCESS, {
            device: device
          }));
        }, 500);
        return 0;
      }
      return 1;
    },
    stopSoftAP: function(index, device) {
      if (qin.network.cache.has[device]) {
        setTimeout(function() {
          jsf.eventManager.dispatchEvent(new jsf.EventSystem(jsf.EventSystem.TYPE_NETWORK, jsf.EventSystem.AP_CLOSE_SUCCESS, {
            device: device
          }));
        }, 500);
        return 0;
      }
      return 1;
    },
    getNetStatus: function(device) {
      return "connected";
    },

    getCmInfo: function() {
      return JSON.stringify(qin.network.cache.cmInfos);
    },
    getCmMode: function() {
      return qin.network.cache.cmInfos.mode;
    },
    getLanDeviceInfo: function() {
      return JSON.stringify(qin.network.cache.lanDevices);
    },
    getLanInfo: function() { //CM20 CM30 dhcp gateway
      return JSON.stringify(qin.network.cache.lanInfo);
    },
    getWanInfo: function() {
      return JSON.stringify(qin.network.cache.wanInfo);
    },
    setCmInfo: function(mode) {
      qin.network.cache.cmInfos.mode = mode;
    },
    setLanInfo: function(parameter) {
      var info = JSON.parse(parameter);
      qin.network.cache.lanInfo.gateway = info.gateway;
    }
  };

  qin.subtitle = {
    start: function () {},
    stop: function () {}
  };

  qin.update = {
    menuStart: function (parameter) {}
  };

  qin.adv = {
    getTickerData: function() {
      return '';
    },
    getCNSAdvInfoByBlockName: function(blockName) {
      var data = {
        blockName: 'test',
        playModeType: 'interval',
        playModeValue: 2,
        pathPrefix: 'app/images/',
        assetType: {
          image: [{
            assetValue: 'back.png',
            actionType: 'image',
            actionValue: 'back.png'
          }]
        }
      };
      return JSON.stringify(data);
    }
  };

  qin.app = {
    getAppInfos: function() {
      var data = [{
        icon: 'app/images/home/icon/new_tv.png',
        name: ['電視頻道', ''],
        url: '#player/main/from=home',
        link_point: '1',
        launch_name: 'player',
        category: 2 //表示 from front end ;3,4表示back end
      }, {
        icon: 'app/images/home/icon/new_pvr.png',
        name: ['錄影', ''],
        children: [{
          icon: 'app/images/home/icon/second/epg.png',
          name: ['', ''],
          url: '#epg/main/type=pvr&from=2',
          link_point: '3-1',
          launch_name: 'epg_pvr',
          category: 2
        }, {
          icon: 'app/images/home/icon/second/new_timing_record.png',
          name: ['', ''],
          url: '#pvr_booking',
          link_point: '3-2',
          launch_name: 'pvr_booking',
          category: 2
        }, {
          icon: 'app/images/home/icon/second/new_recording_list.png',
          name: ['', ''],
          url: '#pvr_booking_mine',
          link_point: '3-3',
          launch_name: 'pvr_booking_mine',
          category: 2
        }, {
          icon: 'app/images/home/icon/second/new_recorded_list.png',
          name: ['', ''],
          url: '#pvr_recorded',
          link_point: '3-4',
          launch_name: 'pvr_recorded',
          category: 2
        }],
        link_point: '3',
        launch_name: 'pvr',
        category: 2
      }];
      return JSON.stringify(data);
    }
  };
}());