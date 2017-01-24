/**
 * picture.js
 * @authors Casper 
 * @date    2016/07/06
 * @version 1.0.0
 */
define(['view/media/picture.html'], function(require, exports, module) {
  var Broadcast = require('service/Broadcast'),
    Timer = require('service/Timer'),
    Local = require('service/Local');
  var BaseView = require('component/BaseView'),
    MediaPicController = BaseView.extend({
      ensureSelf: function () {
        this.isDisplay = true;
        this.cursor = 0;
        this.icons = [{
          selected: './app/images/media/play/pic/zoom.png',
          normal: './app/images/media/play/pic/zoom-normal.png'
        }, {
          selected: './app/images/media/play/pic/lessen.png',
          normal: './app/images/media/play/pic/lessen-normal.png'
        }, {
          selected: './app/images/media/play/pic/turn-left.png',
          normal: './app/images/media/play/pic/turn-left-normal.png'
        }, {
          selected: './app/images/media/play/pic/turn-right.png',
          normal: './app/images/media/play/pic/turn-right-normal.png'
        }, {
          selected: './app/images/media/play/pic/full.png',
          normal: './app/images/media/play/pic/full-normal.png'
        }];
        this.sprites = this.$('.picture-controller-icon');
        this.scalePercent = this.$('#picture-scale-percent');
        this.fileName = this.$('#picture-file-name');
        this.progress = this.$('#picture-progress');
        this.statusCursor = this.icons.length - 1;
      },
      show: function () {
        if (!this.isDisplay){
          this.isDisplay = true;
          this.$el.css('opacity', 1);
        }
      },
      hide: function () {
        if (this.isDisplay){
          this.isDisplay = false;
          this.$el.css('opacity', 0);
        }
      },
      keyEnter: function () {
        switch (this.cursor) {
          case 0:
            if (this.isFull) {
              this.isFull = false;
              this.icons[this.statusCursor] = {
                selected: './app/images/media/play/pic/full.png',
                normal: './app/images/media/play/pic/full-normal.png'
              };
              this.sprites.eq(this.statusCursor).attr('src', this.icons[this.statusCursor].normal);
            }
            this.scale_rate < 3 && (this.scale_rate += .1);
            this.scalePercent.html(Math.floor(this.scale_rate * 100) + '%');
            break;
          case 1:
            this.isFull = false;
            this.scale_rate >= .2 && (this.scale_rate -= .1);
            this.scalePercent.html(Math.floor(this.scale_rate * 100) + '%');
            break;
          case 2:
            this.rotate_rate -= 90;
            break;
          case 3:
            this.rotate_rate += 90;
            break;
          case 4:
            this.isFull = !this.isFull;
            this.icons[this.cursor] = {
              selected: this.isFull ? './app/images/media/play/pic/fix.png' : './app/images/media/play/pic/full.png',
              normal: this.isFull ? './app/images/media/play/pic/fix-normal.png' : './app/images/media/play/pic/full-normal.png'
            };
            this.sprites.eq(this.cursor).attr('src', this.icons[this.cursor].selected);
            this.scale_rate = 1;
            this.scalePercent.html(this.isFull ? 'Full Screen' : '100%');
            if (this.isFull) {
              return {
                full: true
              };
            } else {
              return {
                fix: true
              };
            }
            break;
        }
        return {
          scale: this.scale_rate,
          rotation: this.rotate_rate
        };
      },
      offset: function (offset) {
        this.sprites.eq(this.cursor).attr('src', this.icons[this.cursor].normal);
        this.cursor = (this.cursor + offset + this.icons.length) % this.icons.length;
        this.sprites.eq(this.cursor).attr('src', this.icons[this.cursor].selected);
      },
      refresh: function (file, cursor, total) {
        this.scale_rate = 1;
        this.rotate_rate = 0;
        if (this.isFull) {
          this.isFull = false;
          this.icons[this.statusCursor] = {
            selected: './app/images/media/play/pic/full.png',
            normal: './app/images/media/play/pic/full-normal.png'
          };
          this.sprites.eq(this.cursor).attr('src', this.cursor === this.statusCursor ? this.icons[this.cursor].selected : this.icons[this.cursor].normal);
        }
        this.scalePercent.html('100%');
        this.fileName.html(file ? file.name : '');
        this.progress.html(total > 0 ? (cursor + 1) + '/' + total : '0/0');
      }
    }),
    MediaPictureView = BaseView.extend({
      className: 'page animated picture-main',
      template: require('view/media/picture.html'),
      ensureSelf: function(options) {
        this.render();
        options.parent.append(this.el);
        this.controller = new MediaPicController({
          el: '#picture-controller'
        });
        this.pre = this.$('#picture-pre-icon');
        this.next = this.$('#picture-next-icon');
        this.static = this.$('#picture-static');
        this.timer = Timer.get();
        this.sprite = this.$('#media-picture-item');
      },
      beforeIn: function(options) {
        qin.wm.setMaximumDecodedImageSize(1024 * 1024 * 60);
        Broadcast.trigger('media:stop');
        this.device = options.device;
        this.currentDir = options.dir;
        this.data = this.device.dir[this.currentDir].children.pic;
        this.dataLength = this.data.length;
        this.cursor = options.cursor;
        this.refresh();
      },
      afterIn: function() {
        Broadcast.on('event:usb', this.diskInOrOut, this);
        this.timing();
      },
      beforeOut: function() {
        qin.wm.setMaximumDecodedImageSize(1024 * 1024 * 4);
        Broadcast.off('event:usb', this.diskInOrOut, this);
        this.timer.clear();
        Broadcast.trigger('media:play');
      },
      afterOut: function() {
        this.sprite.attr('src', null);
        this.device = null;
        this.currentDir = null;
        this.data = null;
        this.dataLength = 0;
        this.cursor = 0;
        if (!this.controller.isDisplay) {
          this.controller.show();
          this.static.css('display', 'none');
        }
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
      _toggle: function () {
        if (this.controller.isDisplay) {
          this.timer.clear();
          this.controller.hide();
          this.static.css('display', 'block');
        } else {
          this.controller.show();
          this.static.css('display', 'none');
          this.timing();
        }
      },
      timing: function () {
        this.timer.clear();
        if (this.controller.isDisplay) {
          var self = this;
          this.timer.setTimeout(function() {
            self._toggle();
          }, 3000);
        }
      },
      leftOrRight: function (offset) {
        if (this.controller.isDisplay) {
          this.timing();
          this.controller.offset(offset);
        } else if (this.dataLength > 1) {
          this.cursor = (this.cursor + offset + this.dataLength) % this.dataLength;
          this.controller.refresh(this.data[this.cursor], this.cursor, this.dataLength);
          this._refreshSprite();
        }
      },
      refresh: function () {
        this.pre.css('display', this.dataLength > 1 ? 'block' : 'none');
        this.next.css('display', this.dataLength > 1 ? 'block' : 'none');
        this.controller.refresh(this.data[this.cursor], this.cursor, this.dataLength);
        this._refreshSprite();
      },
      keyBack: function () {
        if (this.controller.isDisplay && this.dataLength > 0) {
          this._toggle();
        } else {
          var dirsMap = this.device.dir;
          var length = dirsMap[this.currentDir].children.dir.filter(function (value) {
            return !dirsMap[value.path] || dirsMap[value.path].pic;
          }).length;
          Broadcast.trigger('page:to', 'media-list', {
            device: this.device,
            currentDir: this.currentDir,
            cursor: length + (this.dataLength > 0 ? this.cursor : length > 0 ? -1 : 0),
            type: 'pic'
          });
        }
      },
      _resetPrameter: function () {
        this.parameter = {
          scale: 1,
          rotation: 0,
          full: false
        };
      },
      _refreshParameter: function () {
        var transform = 'translate(-50%, -50%) rotate(' + this.parameter.rotation + 'deg)';
        if (this.parameter.full) {
          this.sprite.addClass('full-picture');
        } else {
          this.sprite.removeClass('full-picture');
          transform += ' scale(' + this.parameter.scale.toFixed(1) + ')';
        }
        this.sprite.css('-webkit-transform', transform);
        this.sprite.css('transform', transform);
      },
      _refreshSprite: function () {
        this._resetPrameter();
        this._refreshParameter();
        if (this.dataLength === 0) {
          this.sprite.attr('src', null);
        } else {
          this.sprite.attr('src', (jsf.sys.isSTB ? 'file://' : '') + this.data[this.cursor].path);
        }
      },
      _remove: function () {
        var file = this.data[this.cursor];
        Local.remove(this.device, file, 'pic');
        this.dataLength--;
        this.refresh();
        this.timing();
      },
      keyEnter: function () {
        if (this.dataLength <= 0) return;
        if (this.controller.isDisplay) {
          this.timing();
          var result = this.controller.keyEnter();
          if (result.del) {
            this._remove();
          } else if (result.full) {
            this.parameter.scale = 1;
            this.parameter.full = true;
            this._refreshParameter();
          } else if (result.fix) {
            this.parameter.scale = 1;
            this.parameter.full = false;
            this._refreshParameter();
          } else {
            if (this.parameter.scale !== result.scale) {
              this.parameter.scale = result.scale;
              this.parameter.full = false;
            }
            this.parameter.rotation = result.rotation;
            this._refreshParameter();
          }
        } else {
          this._toggle();
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
          case jsf.KEY.backspace:
            this.keyBack();
            break;
          case jsf.KEY.enter:
            this.keyEnter();
            break;
          default:
            this.timing();
            break;
        }
      }
    });
  module.exports = {
    create: function(app) {
      if (!this._instance) {
        this._instance = new MediaPictureView({
          parent: app.$el
        });
      }
      return this._instance;
    }
  };
});