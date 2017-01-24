/**
 * PlayController.js
 * @authors Casper 
 * @date    2016/07/13
 * @version 1.0.0
 */
define(['service/Media'], function (require, exports, module) {
  var Media = require('service/Media');
  var MediaStatus = {
    waiting: 'waiting',
    loading: 'loading',
    play: 'play',
    pause: 'pause',
    drag: 'drag',
    forward: 'forward',
    rewind: 'rewind'
  };
  var prevent = true;
  var handle = -1;
  var duration = 0;
  var position = 0;
  var isPlaying = false;
  var multiple = 0;
  var generalSpeed = 1;
  var maxSpeed = 32;
  var timer = -1;
  var manualSeekTimer = -1;
  var currentStatus = MediaStatus.waiting;
  var status_callback = null;
  var playing_progress = null;

  function getter__get_parameter (params) {
    var rtn = qin.player.get(handle, params);
    if (rtn !== '' && rtn !== null) {
        return JSON.parse(rtn);
    }
    return {};
  }

  function getter__get_position () {
    var parameter = getter__get_parameter(['duration', 'position']);
    duration = parameter.duration || 0;
    position = parameter.position || 0;
    playing_progress && playing_progress(duration, position);
    return position;
  }

  jsf.eventManager.addListener({
    event: jsf.EventListener.SYSTEM,
    eventType: jsf.EventSystem.TYPE_MEDIAPLAYER,
    callback: function (event) {
      if (prevent) return;
      switch (event.getEventName()) {
        case jsf.EventSystem.MEDIAPLAYER_PLAYER_TIMESHIFT_HEAD:
        case jsf.EventSystem.MEDIAPLAYER_BUFFERING_START:
        case jsf.EventSystem.MEDIAPLAYER_BUFFERING_END:
          changeStatus(MediaStatus.play);
          break;
        case jsf.EventSystem.MEDIAPLAYER_PLAYER_TIMESHIFT_TAIL:
        case jsf.EventSystem.MEDIAPLAYER_PLAYER_STREAM_END:
        case jsf.EventSystem.MEDIAPLAYER_FINISH:
          changeStatus(MediaStatus.waiting);
          break;
      }
    }
  });

  function reset__reset_parameters () {
    isPlaying = false;
    multiple = generalSpeed;
    duration = 0;
    position = 0;
    clearInterval(timer);
    stopMultipleSeek();
  }

  function timing () {
    clearInterval(timer);
    getter__get_position();
    timer = setInterval(getter__get_position, 1000);
  }

  function stopMultipleSeek () {
    clearInterval(manualSeekTimer);
    manualSeekTimer = -1;
  }

  function multipleSeek () {
    if(duration <= position + multipleSpeed){
      changeStatus(MediaStatus.waiting);
      return;
    } else if (position + multipleSpeed <= 0) {
      qin.player.seek(handle, 0);
      changeStatus(MediaStatus.play);
      return;
    }
    qin.player.seek(handle, Math.max(0, position + multipleSpeed));
  }

  var multipleSpeed = 1;
  function changeStatus (status, data, manual) {
    var preStatus = currentStatus;
    currentStatus = status;
    switch (true) {
      case status === MediaStatus.waiting:
        reset__reset_parameters();
        stop();
        break;
      case status === MediaStatus.loading:
        reset__reset_parameters();
        stop();
        qin.player.start(handle, JSON.stringify({
          type: 'file',
          url: data
        }));
        break;
      case status === MediaStatus.play:
        if (preStatus === MediaStatus.loading) {
          isPlaying = true;
          timing();
        } else {
          stopMultipleSeek();
          if (preStatus === MediaStatus.pause) {
            qin.player.resume(handle);
          } else if (preStatus === MediaStatus.rewind || preStatus === MediaStatus.forward) {
            multiple = generalSpeed;
            qin.player.resume(handle);
          }
        }
        break;
      case status === MediaStatus.pause:
        stopMultipleSeek();
        qin.player.pause(handle);
        break;
      case status === MediaStatus.rewind || status === MediaStatus.forward:
        if (preStatus === MediaStatus.pause) {
          qin.player.resume(handle);
        }
        jsf.log('multipleForwardOrRewind: ' + MediaStatus.rewind + ', speed is ' + data);
        if (manual) {
          multipleSpeed = status === MediaStatus.rewind ? -data : data;
          if (manualSeekTimer === -1) {
            manualSeekTimer = setInterval(multipleSeek, 1000);
          }
          break;
        }
        status === MediaStatus.rewind ? qin.player.backward(handle, data) : qin.player.forward(handle, data);
        break;
    }
    status_callback && status_callback(status, preStatus, data);
  }

  function stop () {
    jsf.log('stop: handle is ' + handle);
    qin.player.stop(handle);
  }

  function resumeOrPause () {
    switch (true) {
      case !isPlaying:
        break;
      default:
        changeStatus(currentStatus === MediaStatus.play ? MediaStatus.pause : MediaStatus.play);
        break;
    }
  }

  function pause () {
    switch (true) {
      case !isPlaying:
        break;
      default:
        changeStatus(MediaStatus.pause);
        break;
    }
  }

  function resume () {
    switch (true) {
      case !isPlaying:
        break;
      default:
        changeStatus(MediaStatus.play);
        break;
    }
  }

  function forwardOrRewind (offset) {
    switch (true) {
      case !isPlaying:
        break;
      default:
        jsf.log('forwardOrRewind: current duration is ' + duration + ', position is ' + position + ', offset is ' + offset);
        if(duration <= position + offset){
          changeStatus(MediaStatus.waiting);
          return;
        }
        (offset > 0 || position > 0) && qin.player.seek(handle, Math.max(0, position + offset));
        changeStatus(MediaStatus.play);
        break;
    }
  }

  function multipleForwardOrRewind (status, manual) {
    switch (true) {
      case !isPlaying:
        return 0;
      default:
        if(currentStatus !== status){
          multiple = generalSpeed * 2;
        } else if (multiple < maxSpeed){
          multiple *= 2;
        } else {
          return multiple;
        }
        changeStatus(status, multiple, manual);
        return multiple;
    }
  }

  return {
    initialize: function (callback, progress) {
      handle = Media.getHandle();
      prevent = false;
      status_callback = callback;
      playing_progress = progress;
      playing_progress && playing_progress(duration, position);
      status_callback && status_callback(currentStatus, currentStatus);
    },
    release: function () {
      prevent = true;
      status_callback = null;
      playing_progress = null;
      reset__reset_parameters();
      changeStatus(MediaStatus.waiting);
    },
    play: function (url) {
      changeStatus(MediaStatus.loading, url);
    },
    pause: pause,
    resume: resume,
    resumeOrPause: resumeOrPause,
    forwardOrRewind: forwardOrRewind,
    multipleRewind: function (manual) {
      return multipleForwardOrRewind(MediaStatus.rewind, manual);
    },
    multipleForward: function (manual) {
      return multipleForwardOrRewind(MediaStatus.forward, manual);
    },
    status: MediaStatus
  };
});