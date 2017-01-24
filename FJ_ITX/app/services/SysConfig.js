/**
 * SysConfig.js
 * @authors Casper
 * @date    2015/07/10
 * @version 1.0.0
 */
define(['service/Rec', 'service/Broadcast'], function(require, exports, module) {
  var Rec = require('service/Rec'),
    Broadcast = require('service/Broadcast');
  var nowRecording = Rec.getRecording().length;
  var config = {
    totalThread: 1,
    usedThread: nowRecording,
    remainingThread: 1 - nowRecording,
    isLocked: true
  };
  Broadcast.on('event:pvr', function(eventName) {
    nowRecording = Rec.getRecording().length;
    config.usedThread = nowRecording;
    config.remainingThread = config.totalThread - nowRecording;
    Broadcast.trigger('sys:pvr');
  });
  return {
    get: function(name) {
      return name in config ? config[name] : null;
    },
    set: function(name, value) {
      config[name] = value;
    }
  };
});