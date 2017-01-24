/**
 * timeshift.js
 * @authors Casper 
 * @date    2016/07/16
 * @version 1.0.0
 */
define(['view/live/timeshift.html'], function(require, exports, module) {
  var Broadcast = require('service/Broadcast'),
    PlayController = require('service/PlayController'),
    Live = require('service/Live'),
    Rec = require('service/Rec'),
    Timer = require('service/Timer');
  var TipView = Backbone.View.extend({
      initialize: function() {
        this.isDisplay = false;
        Broadcast.on('page:change', this.hide, this);
      },
      show: function (txt) {
        if (!this.isDisplay) {
          this.isDisplay = true;
          this.$el.css('display', 'block');
        }
        this.$el.html(txt);
      },
      hide: function () {
        if (this.isDisplay) {
          this.isDisplay = false;
          this.$el.css('display', 'none');
        }
      }
    }),
    TimeshiftView = require('component/BaseView').extend({
    className: 'page animated timeshift-main',
    template: require('view/live/timeshift.html'),
    ensureSelf: function(options) {
      this.render();
      options.parent.append(this.el);
      this.controller = this.$('#timeshift-controller');
      this.channelNum = this.$('#timeshift-controller-channel-number');
      this.channelName = this.$('#timeshift-controller-channel-name');
      this.status = this.$('#timeshift-controller-status')[0];
      this.time = this.$('#timeshift-controller-time');
      this.progress = this.$('#timeshift-controller-progress'); // max 990px
      this.timer = Timer.get();
      this.untiming = false;
      this.tip = new TipView({
        el: '#timeshift-tip'
      });
      this.controllerIsDisplay = false;
      this.callback = (function(status, preStatus, data) {
        switch (status) {
          case PlayController.status.waiting:
            preStatus !== PlayController.status.waiting && Broadcast.trigger('page:to', 'live-live', {
              area: 'epg'
            });
            break;
          case PlayController.status.loading:
            this.status.className = 'pause';
            this.showController(true);
            break;
          case PlayController.status.pause:
            this.status.className = 'pause';
            this.showController(true);
            break;
          case PlayController.status.rewind:
            this.status.className = 'rewind_' + data;
            this.showController(true);
            break;
          case PlayController.status.forward:
            this.status.className = 'forward_' + data;
            this.showController(true);
            break;
          case PlayController.status.play:
            this.status.className = 'play';
            if (preStatus === PlayController.status.loading || preStatus === PlayController.status.waiting) {
              if (this.position.getTime() >= this.startTime.getTime() + 1000) {
                var seekTo = Math.floor((this.position.getTime() - this.startTime.getTime()) / 1000); 
                jsf.log('will seek to ' + seekTo);
                PlayController.forwardOrRewind(seekTo);
              }
              PlayController.resumeOrPause();
            } else {
              this.showController();
            }
            break;
        }
      }).bind(this);
      this.progressCallback = (function(duration, position) {
        if (duration > 0) {
          var now = new Date();
          if (duration >= Rec.MAX_TIMESHIFT_DURATION) {
            this.startTime = new Date(now.getTime() - duration * 1000);
          }
          this.progress.css('width', position / duration * 990 + 'px');
          this.time.html(jsf.dateFormat(new Date(this.startTime.getTime() + position * 1000), 'hh:mm:ss') + '/' + jsf.dateFormat(now, 'hh:mm:ss'));
        } else {
          this.progress.css('width', '0px');
          this.time.html('');
        }
      }).bind(this);
      this.successCallback = (function (channelInfo) {
        this.tip.hide();
        this.showController();
        this.startTime = channelInfo.startTime;
        jsf.log('start time is ' + jsf.dateFormat(this.startTime, 'hh:mm:ss') + ', position is ' + jsf.dateFormat(this.position, 'hh:mm:ss'));
        PlayController.play(jsf.sys.isSTB ? channelInfo.path : 'media_test/0.mp4');
      }).bind(this);
      this.errorCallback = (function (reason) {
        this.hideController();
        this.tip.show(reason.info);
      }).bind(this);
    },
    _changeTime: function (time) {
      var hours;
      if (time < 3600) {
        hours = '00';
      } else {
        hours = Math.floor(time / 3600) + '';
        time = time % 3600;
      }
      var minutes = Math.floor(time / 60) + '';
      var seconds = Math.floor(time % 60) + '';
      return (hours.length <= 1 ? '0' + hours : hours) + ':' + (minutes.length <= 1 ? '0' + minutes : minutes) + ':' + (seconds.length <= 1 ? '0' + seconds : seconds);
    },
    beforeIn: function(options) {
      Broadcast.trigger('media:stop:prevent');
      this.tip.show('loading...');
      this.position = options.position;
      var channel = Live.getCurrentChannel();
      this.channelNum.html(jsf.zeroFill(Live.getCurrentChannelIndex(), 3));
      this.channelName.html(channel.name);
      PlayController.initialize(this.callback, this.progressCallback);
    },
    afterIn: function(options) {
      Rec.startTimeShift(Live.getCurrentChannel(), this.successCallback, this.errorCallback);
    },
    beforeOut: function() {
      this.timer.clear();
      Rec.clearTimeShiftCallback();
      PlayController.release();
      Broadcast.trigger('media:play');
    },
    afterOut: function () {
      this.channelNum.html('');
      this.channelName.html('');
      this.progress.css('width', '0px');
      this.hideController();
    },
    render: function() {
      this.$el.html(_.template(this.template));
      return this;
    },
    timing: function () {
      this.timer.clear();
      this.timer.setTimeout(function () {
        this.hideController();
      }, 5000, this);
    },
    showController: function (untiming) {
      if (!this.controllerIsDisplay) {
        this.controllerIsDisplay = true;
        this.controller.css('display', 'block');
      }
      this.untiming = untiming;
      this.untiming ? this.timer.clear() : this.timing();
    },
    hideController: function () {
      if (this.controllerIsDisplay) {
        this.controllerIsDisplay = false;
        this.controller.css('display', 'none');
      }
      this.untiming = false;
    },
    onkeydown: function(keyCode) {
      if (this.tip.isDisplay) {
        if (keyCode === jsf.Event.KEY_BACK) {
          Broadcast.trigger('page:to', 'live-live', {
            area: 'epg'
          });
        }
        return;
      }
      switch (keyCode) {
        case jsf.Event.KEY_LEFT:
        case jsf.Event.KEY_RW:
          PlayController.forwardOrRewind(-10);
          break;
        case jsf.Event.KEY_RIGHT:
        case jsf.Event.KEY_FF:
          PlayController.forwardOrRewind(10);
          break;
        case jsf.Event.KEY_BACK:
          if (this.controllerIsDisplay && !this.untiming) {
            this.hideController();
          }
          Broadcast.trigger('tip:confirm', 'Are you sure to exit the thimeshif?', function () {
            Broadcast.trigger('page:to', 'live-live', {
              area: 'epg'
            });
          });
          break;
        case jsf.Event.KEY_PLAY_PAUSE:
        case jsf.Event.KEY_ENTER:
          PlayController.resumeOrPause();
          break;
        case jsf.Event.KEY_BLUE:
          PlayController.multipleRewind();
          break;
        case jsf.Event.KEY_GREEN:
          PlayController.multipleForward();
          break;
        case jsf.Event.KEY_INFO:
          !this.controllerIsDisplay && this.showController();
          break;
        default:
          break;
      }
    }
  });
  module.exports = {
    create: function(app) {
      if (!this._instance) {
        this._instance = new TimeshiftView({
          parent: app.$el,
          state: app.state
        });
      }
      return this._instance;
    }
  };
});