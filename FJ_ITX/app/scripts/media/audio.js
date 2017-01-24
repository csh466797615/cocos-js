/**
 * audio.js
 * @authors Casper 
 * @date    2016/07/14
 * @version 1.0.0
 */
define(['view/media/audio.html'], function(require, exports, module) {
  var Broadcast = require('service/Broadcast'),
    Local = require('service/Local'),
    PlayController = require('service/PlayController');
  function parseLyric(lrc) {
    var lyrics = lrc.split("\n");
    var lrcObj = [];
    for (var i = 0; i < lyrics.length; i++) {
      var lyric = decodeURIComponent(lyrics[i]);
      var timeReg = /\[\d*:\d*((\.|\:)\d*)*\]/g;
      var timeRegExpArr = lyric.match(timeReg);
      if (!timeRegExpArr) continue;
      var clause = lyric.replace(timeReg, '');

      for (var k = 0, h = timeRegExpArr.length; k < h; k++) {
        var t = timeRegExpArr[k];
        var min = Number(String(t.match(/\[\d*/i)).slice(1)),
          sec = Number(String(t.match(/\:\d*/i)).slice(1));
        lrcObj.push({
          time: min * 60 + sec,
          txt: clause
        });
      }
    }
    return lrcObj;
  }
  var BaseView = require('component/BaseView'),
    MediaControllerBar = BaseView.extend({
      ensureSelf: function () {
        this.isDisplay = true;
        this.iconCursor = 1;
        this.cycleType = 0;
        this.isDragging = false;
        this.cd = this.$('#media-audio-cd')[0];
        this.sprites = this.$('.play-controller-icon');
        this.progress = this.$('#media-audio-controller-progress');
        this.progressPoint = this.$('#media-audio-controller-progress-point');
        this.fileName = this.$('#media-audio-controller-file-name');
        this.time = this.$('#media-audio-controller-time');
        this.status = this.$('#media-audio-controller-status');
        this.isFirstPlay = true;
        this.isWating = true;
        this.isShowLrc = false;
        this.preLine = -1;
        this.lrc = $('#media-audio-lrc');
        this.lrcBox = $('#media-audio-lrc-box');
        this.callback = (function(status, preStatus, data) {
          switch (status) {
            case PlayController.status.waiting:
              this.isWating = true;
              this.cd.className = '';
              this.sprites.eq(2).removeClass('pause');
              this.sprites.eq(2).addClass('play');
              this.status.css('display', 'none');
              this.progress.css('width', '0px');
              this.play();
              break;
            case PlayController.status.loading:
              this.isWating = false;
              this.cd.className = '';
              this.sprites.eq(2).removeClass('pause');
              this.sprites.eq(2).addClass('play');
              this.status.css('display', 'none');
              // this.loadLrc();
              break;
            case PlayController.status.pause:
              this.cd.className = '';
              this.sprites.eq(2).removeClass('pause');
              this.sprites.eq(2).addClass('play');
              this.status.css('display', 'block');
              break;
            case PlayController.status.rewind:
              this.cd.className = 'rewind speed_' + data;
              this.sprites.eq(2).removeClass('pause');
              this.sprites.eq(2).addClass('play');
              this.status.css('display', 'none');
              break;
            case PlayController.status.forward:
              this.cd.className = 'play speed_' + data;
              this.sprites.eq(2).removeClass('pause');
              this.sprites.eq(2).addClass('play');
              this.status.css('display', 'none');
              break;
            case PlayController.status.play:
              this.cd.className = 'play';
              this.sprites.eq(2).removeClass('play');
              this.sprites.eq(2).addClass('pause');
              this.status.css('display', 'none');
              break;
          }
        }).bind(this);
        this.progressCallback = (function(duration, position) {
          if (duration > 0) {
            if (position >= 0 && this.lrcs) {
              if (this.preLine === -1) {
                for (var i = 0, j = this.lrcs.length; i < j; i++) {
                  if (this.lrcs[i].time <= position && (i === j - 1 || this.lrcs[i + 1].time > position)) {
                    this.preLine = i;
                    this.lrcLines.eq(this.preLine).addClass('current');
                    this.lrcBox.css('top', 180 - i * 30 + 'px');
                    break;
                  }
                }
              } else if (this.preLine >= 0) {
                this.lrcLines.eq(this.preLine).removeClass('current');
                var time = this.lrcs.length;
                var start = this.preLine,
                  end = this.lrcs.length;
                if (position >= this.lrcs[this.preLine].time) {
                  for (var i = this.preLine, j = this.lrcs.length; i < j; i++) {
                    if (this.lrcs[i].time <= position && (i === j - 1 || this.lrcs[i + 1].time > position)) {
                      this.preLine = i;
                      this.lrcLines.eq(this.preLine).addClass('current');
                      this.lrcBox.css('top', 180 - i * 30 + 'px');
                      break;
                    }
                  }
                } else {
                  for (var i = this.preLine - 1; i >= 0; i--) {
                    if (this.lrcs[i].time <= position && this.lrcs[i + 1].time > position) {
                      this.preLine = i;
                      this.lrcLines.eq(this.preLine).addClass('current');
                      this.lrcBox.css('top', 180 - i * 30 + 'px');
                      break;
                    }
                  }
                }
                this.lrcLines.eq(this.preLine).addClass('current');
              }
            }
            this.progress.css('width', position / duration * 1030 + 'px');
            this.time.html(this._changeTime(position) + '/' + this._changeTime(duration));
          } else {
            this.progress.css('width', '0px');
            this.time.html('');
          }
        }).bind(this);
        Broadcast.on('audio:cursor', function (cursor) {
          if (cursor !== this.cursor) {
            this.play(cursor);
          }
        }, this);
      },
      loadLrc: function () {
        var self = this;
        this.lrcBox.html('');
        this.lrcBox.css('top', '180px');
        this.lrcs = null;
        this.preLine = -1;
        $.ajax({
          url: this.files[this.cursor].path.substring(0, this.files[this.cursor].path.lastIndexOf('.'))+ '.lrc',
          success: function(lrc) {
            self.lrcs = parseLyric(lrc);
            for (var i = 0, j = self.lrcs.length; i < j; i++) {
              self.lrcBox.append($('<div>' + self.lrcs[i].txt + '</div>'));
            }
            self.lrcLines = self.lrcBox.find('>div');
          },
          error: function(e) {
            self.lrcBox.html('<div class="current">No lyrics</div>');
          }
        });
      },
      _changeTime: function (time) {
        var minutes = Math.floor(time / 60) + '';
        var seconds = Math.floor(time % 60) + '';
        return (minutes.length <= 1 ? '0' + minutes : minutes) + ':' + (seconds.length <= 1 ? '0' + seconds : seconds);
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
        this.position = -1;
        PlayController.play(this.files[this.cursor].path);
        this.fileName.html(this.files[this.cursor].name);
        this.time.html('');
        Broadcast.trigger('audio:change', this.cursor);
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
        this.progress.css('width', '0px');
      },
      reset: function () {
        PlayController.release();
        this.cd.className = '';
        if (this.isDragging) {
          this.isDragging = false;
          this.progressPoint.removeClass('current');
        }
        if (this.iconCursor !== 1) {
          this.sprites.eq(this.iconCursor).removeClass('current');
          this.iconCursor = 1;
          this.sprites.eq(this.iconCursor).addClass('current');
        }
        this.sprites.eq(this.iconCursor).removeClass('pause');
        this.sprites.eq(this.iconCursor).addClass('play');
        if (this.cycleType !== 0) {
          this.sprites.eq(3).removeClass(this.getCycleTypeIconClass());
          this.cycleType = 0;
          this.sprites.eq(3).addClass(this.getCycleTypeIconClass());
        }
        this.resetInfo();
        this.isFirstPlay = true;
        this.isWating = false;
        this.preLine = -1;
        this.lrc.css('display', 'none');
        this.lrcs = null;
        this.isShowLrc = false;
      },
      show: function () {
        this.isDisplay = true;
        this.$el.css('display', 'block');
      },
      hide: function () {
        this.isDisplay = false;
        this.$el.css('display', 'none');
      },
      leftOrRight: function (offset) {
        if (this.isDragging) {
          PlayController.forwardOrRewind(10 * offset);
        } else {
          var next = this.iconCursor + offset;
          if (next >= 0 && next < this.sprites.length) {
            this.sprites.eq(this.iconCursor).removeClass('current');
            this.iconCursor = next;
            this.sprites.eq(this.iconCursor).addClass('current');
          }
        }
      },
      upOrDown: function (offset) {
        if (this.isDragging && offset > 0) {
          this.isDragging = false;
          this.progressPoint.removeClass('current');
          this.sprites.eq(this.iconCursor).addClass('current');
        } else if (!this.isDragging && offset < 0) {
          this.isDragging = true;
          this.progressPoint.addClass('current');
          this.sprites.eq(this.iconCursor).removeClass('current');
        }
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
        switch (this.iconCursor) {
          case 0:
            this.play((this.cursor - 1 + this.files.length) % this.files.length);
            return false;
          case 1:
            if (this.isWating) {
              this.play(this.cursor);
            } else {
              PlayController.resumeOrPause();
            }
            return false;
          case 2:
            this.play((this.cursor + 1) % this.files.length);
            return false;
          case 3:
            this.sprites.eq(this.iconCursor).removeClass(this.getCycleTypeIconClass());
            this.cycleType = (this.cycleType + 1) % 3;
            this.sprites.eq(this.iconCursor).addClass(this.getCycleTypeIconClass());
            return false;
          // case 4:
          //   this.lrc.css('display', (this.isShowLrc = !this.isShowLrc) ? 'block' : 'none');
          //   return false;
          case 4:
            return true;
        }
      }
    }),
    MediaAudioList = BaseView.extend({
      ensureSelf: function(options) {
        this.isDisplay = false;
        this.items = this.$('#media-audio-list-items>div');
        this.start = 0;
        this.cursor = 0;
        this.playing = -1;
        this.progress = this.$('#media-audio-list-progress');
        this.focus = this.$('#media-audio-list-focus');
        this.files = [];
        Broadcast.on('audio:change', function (cursor) {
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
        Broadcast.trigger('audio:cursor', this.start + this.cursor);
      }
    }),
    MediaAudioView = BaseView.extend({
      className: 'page animated audio-main',
      template: require('view/media/audio.html'),
      ensureSelf: function(options) {
        this.render();
        options.parent.append(this.el);
        this.controller = new MediaControllerBar({
          el: '#media-audio-controller-bar'
        });
        this.list = new MediaAudioList({
          el: '#media-audio-list'
        });
      },
      beforeIn: function(options) {
        Broadcast.trigger('media:stop');
        this.device = options.device;
        this.currentDir = options.dir;
        var data = this.device.dir[this.currentDir].children.audio;
        this.dataLength = data.length;
        this.controller.initParams(data, options.cursor);
        this.list.initParams(data);
      },
      afterIn: function() {
        Broadcast.on('event:usb', this.diskInOrOut, this);
      },
      beforeOut: function() {
        Broadcast.off('event:usb', this.diskInOrOut, this);
        PlayController.release();
        Broadcast.trigger('media:play');
      },
      afterOut: function() {
        this.device = null;
        this.currentDir = null;
        this.dataLength = 0;
        if (this.list.isDisplay) {
          this.controller.show();
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
          this.controller.show();
          this.list.hide();
        } else {
          var dirsMap = this.device.dir;
          var length = dirsMap[this.currentDir].children.dir.filter(function (value) {
            return !dirsMap[value.path] || dirsMap[value.path].audio;
          }).length;
          Broadcast.trigger('page:to', 'media-list', {
            device: this.device,
            currentDir: this.currentDir,
            cursor: length + (this.dataLength > 0 ? this.controller.cursor : length > 0 ? -1 : 0),
            type: 'audio'
          });
        }
      },
      keyEnter: function () {
        if (this.dataLength <= 0) return;
        if (this.list.isDisplay) {
          this.list.keyEnter();
        } else if (this.controller.isDisplay) {
          if (this.controller.keyEnter()) {
            this.controller.hide();
            this.list.show(this.controller.cursor);
          }
        } else {
          this.controller.show();
        }
      },
      upOrDown: function (offset) {
        if (this.list.isDisplay) {
          this.list.upOrDown(offset);
        } else {
          this.controller.upOrDown(offset);
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
        this._instance = new MediaAudioView({
          parent: app.$el
        });
      }
      return this._instance;
    }
  };
});