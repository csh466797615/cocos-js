/**
 * video.js
 * @authors Casper 
 * @date    2016/07/14
 * @version 1.0.0
 */
define(['view/media/video.html'], function(require, exports, module) {
  var Broadcast = require('service/Broadcast'),
    Timer = require('service/Timer'),
    Local = require('service/Local'),
    PlayController = require('service/PlayController');
  var BaseView = require('component/BaseView'),
    MediaControllerBar = BaseView.extend({
      ensureSelf: function () {
        this.isDisplay = true;
        this.iconCursor = 2;
        this.cycleType = 0;
        this.isDragging = false;
        this.sprites = this.$('.play-controller-icon');
        this.progress = this.$('#media-video-controller-progress');
        this.progressPoint = this.$('#media-video-controller-progress-point');
        this.fileName = this.$('#media-video-controller-file-name');
        this.time = this.$('#media-video-controller-time');
        this.status = this.$('#media-video-controller-status');
        this.statusIcon = this.$('#media-video-controller-status>div').eq(0)[0];
        this.speedIcon = this.$('#media-video-controller-status>div>div').eq(0)[0];
        this.isFirstPlay = true;
        this.isWating = true;
        this.canHide = false;
        this.timer = Timer.get();
        this.callback = (function(status, preStatus) {
          this.timer.clear();
          this.canHide = false;
          switch (status) {
            case PlayController.status.waiting:
              this.isWating = true;
              this.sprites.eq(2).removeClass('pause');
              this.sprites.eq(2).addClass('play');
              this.status.css('display', 'none');
              this.progress.css('width', '0px');
              this.play();
              break;
            case PlayController.status.loading:
              this.isWating = false;
              this.sprites.eq(2).removeClass('pause');
              this.sprites.eq(2).addClass('play');
              this.status.css('display', 'none');
              break;
            case PlayController.status.pause:
              this.statusIcon.className = 'pause';
              this.sprites.eq(2).removeClass('pause');
              this.sprites.eq(2).addClass('play');
              this.status.css('display', 'block');
              break;
            case PlayController.status.rewind:
              this.statusIcon.className = 'rewind';
              this.sprites.eq(2).removeClass('pause');
              this.sprites.eq(2).addClass('play');
              this.status.css('display', 'block');
              break;
            case PlayController.status.forward:
              this.statusIcon.className = 'forward';
              this.sprites.eq(2).removeClass('pause');
              this.sprites.eq(2).addClass('play');
              this.status.css('display', 'block');
              break;
            case PlayController.status.play:
              this.sprites.eq(2).removeClass('play');
              this.sprites.eq(2).addClass('pause');
              this.status.css('display', 'none');
              this.canHide = true;
              this.timing();
              break;
          }
        }).bind(this);
        this.progressCallback = (function(duration, position) {
          if (duration > 0) {
            this.progress.css('width', position / duration * 1030 + 'px');
            this.time.html(this._changeTime(position) + '/' + this._changeTime(duration));
          } else {
            this.progress.css('width', '0px');
            this.time.html('');
          }
        }).bind(this);
        Broadcast.on('video:cursor', function (cursor) {
          if (cursor !== this.cursor) {
            this.play(cursor);
          }
        }, this);
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
      play: function (cursor) {
        if (cursor !== void 0) {
          this.cursor = cursor;
        } else {
          if (!this.isFirstPlay) {
            switch (this.cycleType) {
              case 0:
                this.cursor = (this.cursor + 1) % this.files.length;
                break;
              case 1:
                break;
              case 2:
                if (this.cursor === this.files.length - 1) return;
                this.cursor++;
                break;
            }
          }
        }
        this.isFirstPlay = false;
        PlayController.play(this.files[this.cursor].path);
        this.fileName.html(this.files[this.cursor].name);
        this.time.html('');
        Broadcast.trigger('video:change', this.cursor);
      },
      initParams: function (files, cursor) {
        this.files = files;
        this.cursor = cursor;
        PlayController.initialize(this.callback, this.progressCallback);
      },
      resetInfo: function () {
        this.fileName.html('');
        this.time.html('');
        this.status.css('display', 'none');
        this.statusIcon.className = 'pause';
        this.progress.css('width', '0px');
      },
      reset: function () {
        PlayController.release();
        if (this.iconCursor !== 2) {
          this.sprites.eq(this.iconCursor).removeClass('current');
          this.iconCursor = 2;
          this.sprites.eq(this.iconCursor).addClass('current');
        }
        this.sprites.eq(this.iconCursor).removeClass('pause');
        this.sprites.eq(this.iconCursor).addClass('play');
        if (this.cycleType !== 0) {
          this.sprites.eq(5).removeClass(this.getCycleTypeIconClass());
          this.cycleType = 0;
          this.sprites.eq(5).addClass(this.getCycleTypeIconClass());
        }
        this.resetInfo();
        this.isFirstPlay = true;
        this.isWating = false;
        this.canHide = false;
        this.timer.clear();
      },
      show: function () {
        this.isDisplay = true;
        this.$el.css('opacity', 1);
        this.timing();
      },
      hide: function () {
        this.isDisplay = false;
        this.$el.css('opacity', 0);
        this.timer.clear();
      },
      leftOrRight: function (offset) {
        var next = this.iconCursor + offset;
        if (next >= 0 && next < 7) {
          this.sprites.eq(this.iconCursor).removeClass('current');
          this.iconCursor = next;
          this.sprites.eq(this.iconCursor).addClass('current');
        }
        this.timing();
      },
      getCycleTypeIconClass: function () {
        switch (this.cycleType) {
          case 0:
            return 'loop';
          case 1:
            return 'single-loop';
          case 2:
            return 'orderly';
        }
      },
      keyEnter: function () {
        if (this.files.length === 0) return;
        if (this.isDragging) return;
        this.timing();
        switch (this.iconCursor) {
          case 0:
            this.play((this.cursor - 1 + this.files.length) % this.files.length);
            return false;
          case 1:
            this.speedIcon.className = 'speed_' + PlayController.multipleRewind();
            return false;
          case 2:
            if (this.isWating) {
              this.play(this.cursor);
            } else {
              PlayController.resumeOrPause();
            }
            return false;
          case 3:
            this.speedIcon.className = 'speed_' + PlayController.multipleForward();
            return false;
          case 4:
            this.play((this.cursor + 1) % this.files.length);
            return false;
          case 5:
            this.sprites.eq(5).removeClass(this.getCycleTypeIconClass());
            this.cycleType = (this.cycleType + 1) % 3;
            this.sprites.eq(5).addClass(this.getCycleTypeIconClass());
            return false;
          case 6:
            return true;
        }
      },
      timing: function () {
        this.timer.clear();
        if (this.isDisplay && !this.isDragging && this.canHide) {
          var self = this;
          this.timer.setTimeout(function() {
            self.hide();
          }, 3000);
        }
      }
    }),
    MediaVideoList = BaseView.extend({
      ensureSelf: function(options) {
        this.isDisplay = false;
        this.items = this.$('#media-video-list-items>div');
        this.start = 0;
        this.cursor = 0;
        this.playing = -1;
        this.progress = this.$('#media-video-list-progress');
        this.focus = this.$('#media-video-list-focus');
        this.files = [];
        Broadcast.on('video:change', function (cursor) {
          this.current = cursor;
          if (this.isDisplay && this.start <= cursor && this.start + 7 >= cursor) {
            this.refreshItems();
          }
        }, this);
      },
      show: function (cursor) {
        this.isDisplay = true;
        this.$el.css('display', 'block');
        this.items.eq(this.cursor).removeClass('focus');
        if (cursor < 8) {
          this.start = 0;
          this.cursor = cursor;
        } else if (cursor + 7 < this.files.length){
          this.start = cursor;
          this.cursor = 0;
        } else {
          this.cursor = 7;
          this.start = cursor - 7;
        }
        this.items.eq(this.cursor).addClass('focus');
        this.focus.css('top', 120 + 68 * this.cursor + 'px');
        if (this.files.length > 1) {
          this.progress.css('top', 120 + 460 * (this.start + this.cursor) / (this.files.length - 1) + 'px');
        }
        this.progress.css('display', this.files.length ? 'block' : 'none');
        this.current = cursor;
        this.refreshItems();
      },
      hide: function () {
        this.isDisplay = false;
        this.$el.css('display', 'none');
        this.focus.css('top', '120px');
      },
      initParams: function (files) {
        this.files = files;
      },
      refreshItems: function () {
        var file;
        if (this.playing >= 0) {
          this.items.eq(this.playing).removeClass('playing');
          this.playing = -1;
        }
        for (var i = 0; i < 8; i++) {
          file = this.files[i + this.start];
          if (file) {
            this.items.eq(i).html(file.name);
            if (i + this.start === this.current) {
              this.playing = i;
              this.items.eq(i).addClass('playing');
            }
          } else {
            this.items.eq(i).html('');
          }
        }
      },
      upOrDown: function (offset) {
        var next = this.cursor + offset;
        var pre = this.cursor;
        if (next < 0) {
          if (this.start === 0) {
            if (this.files.length <= 8) {
              this.cursor = this.files.length - 1;
            } else {
              this.cursor = 7;
              this.start = this.files.length - 8;
              this.refreshItems();
            }
          } else {
            this.start--;
            this.refreshItems();
          }
        } else if (next > 7 || next >= this.files.length) {
          if (this.start + this.cursor === this.files.length - 1) {
            this.cursor = 0;
            if (this.files.length > 8) {
              this.start = 0;
              this.refreshItems();
            }
          } else {
            this.start++;
            this.refreshItems();
          }
        } else {
          this.cursor = next;
        }
        if (pre !== this.cursor) {
          this.items.eq(pre).removeClass('focus');
          this.items.eq(this.cursor).addClass('focus');
          this.focus.css('top', 120 + 68 * this.cursor + 'px');
          if (this.files.length > 1) {
            this.progress.css('top', 120 + 460 * (this.start + this.cursor) / (this.files.length - 1) + 'px');
          }
        }
      },
      keyEnter: function () {
        Broadcast.trigger('video:cursor', this.start + this.cursor);
      }
    }),
    MediaVideoView = BaseView.extend({
      className: 'page animated video-main',
      template: require('view/media/video.html'),
      ensureSelf: function(options) {
        this.render();
        options.parent.append(this.el);
        this.controller = new MediaControllerBar({
          el: '#media-video-controller-bar'
        });
        this.list = new MediaVideoList({
          el: '#media-video-list'
        });
      },
      beforeIn: function(options) {
        Broadcast.trigger('media:stop');
        var data;
        if (options.device) {
          this.device = options.device;
          this.currentDir = options.dir;
          data = this.device.dir[this.currentDir].children.video;
        } else {
          data = options.videoList;
        }
        this.backToRecord = !!options.recorded;
        this.dataLength = data.length;
        this.controller.initParams(data, options.cursor);
        this.list.initParams(data);
      },
      afterIn: function() {
        Broadcast.on('event:usb', this.diskInOrOut, this);
      },
      beforeOut: function() {
        Broadcast.off('event:usb', this.diskInOrOut, this);
        this.controller.timer.clear();
        PlayController.release();
        Broadcast.trigger('media:play');
      },
      afterOut: function() {
        this.device = null;
        this.currentDir = null;
        this.dataLength = 0;
        if (this.list.isDisplay) {
          this.controller.$el.css('display', 'block');
          this.list.hide();
        } else if (!this.controller.isDisplay) {
          this.controller.show();
        }
        this.controller.reset();
      },
      diskInOrOut: function (eventName, eventData) {
        switch (eventName) {
          case jsf.EventSystem.USB_PLUGOUT:
            Local.has(this.device, eventData) && Broadcast.trigger('page:to', 'media');
            break;
        }
      },
      render: function() {
        this.$el.html(_.template(this.template));
        return this;
      },
      leftOrRight: function (offset) {
        if (this.list.isDisplay) return;
        if (this.controller.isDisplay) {
          this.controller.leftOrRight(offset);
        }
      },
      keyBack: function () {
        if (this.list.isDisplay) {
          this.controller.$el.css('display', 'block');
          this.list.hide();
        } else if (this.controller.isDisplay && this.dataLength > 0) {
          this.controller.hide();
        } else {
          if (this.backToRecord) {
            Broadcast.trigger('page:to', 'media-recorded');
          } else {
            var dirsMap = this.device.dir;
            var length = dirsMap[this.currentDir].children.dir.filter(function (value) {
              return !dirsMap[value.path] || dirsMap[value.path].video;
            }).length;
            Broadcast.trigger('page:to', 'media-list', {
              device: this.device,
              currentDir: this.currentDir,
              cursor: length + (this.dataLength > 0 ? this.controller.cursor : length > 0 ? -1 : 0),
              type: 'video'
            });
          }
        }
      },
      keyEnter: function () {
        if (this.dataLength <= 0) return;
        if (this.list.isDisplay) {
          this.list.keyEnter();
        } else if (this.controller.isDisplay) {
          if (this.controller.keyEnter()) {
            this.controller.timer.clear();
            this.controller.$el.css('display', 'none');
            this.list.show(this.controller.cursor);
          }
        } else {
          this.controller.show();
        }
      },
      upOrDown: function (offset) {
        if (this.list.isDisplay) {
          this.list.upOrDown(offset);
        }
      },
      onkeydown: function(keyCode) {
        switch (keyCode) {
          case jsf.KEY.left:
            this.leftOrRight(-1);
            break;
          case jsf.KEY.right:
            this.leftOrRight(1);
            break;
          case jsf.KEY.up:
            this.upOrDown(-1);
            break;
          case jsf.KEY.down:
            this.upOrDown(1);
            break;
          case jsf.KEY.backspace:
            this.keyBack();
            break;
          case jsf.KEY.enter:
            this.keyEnter();
            break;
          default:
            break;
        }
      }
    });
  module.exports = {
    create: function(app) {
      if (!this._instance) {
        this._instance = new MediaVideoView({
          parent: app.$el
        });
      }
      return this._instance;
    }
  };
});