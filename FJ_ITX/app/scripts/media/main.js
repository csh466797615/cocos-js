/**
 * media
 * @authors Casper
 * @date    2015/07/21
 * @version 1.0.0
 */
define(['view/media/media.html'], function(require, exports, module) {
  var Broadcast = require('service/Broadcast'),
    Transform = require('service/Transform'),
    SysConfig = require('service/SysConfig'),
    Rec = require('service/Rec'),
    Timer = require('service/Timer'),
    Local = require('service/Local');
  var BaseView = require('component/BaseView'),
    PVRInfoView = BaseView.extend({
      ensureSelf: function(options) {
        this.recording = this.$('.media-pvr-info-recording-count');
        this.completed = this.$('.media-pvr-info-completed-count');
        this.used = this.$('.media-pvr-info-used-thread');
        this.total = this.$('.media-pvr-info-total-thread');
      },
      out: function() {
        this.el.classList.remove('focus');
      },
      in : function() {
        this.el.classList.add('focus');
      },
      refresh: function() {
        this.recording.html(SysConfig.get('usedThread'));
        this.completed.html(Rec.getPvrs().length);
        this.used.html(SysConfig.get('usedThread'));
        this.total.html(SysConfig.get('totalThread'));
      }
    }),
    PVRCreateView = BaseView.extend({
      ensureSelf: function(options) {
        this.remaining = this.$('.media-pvr-info-remaining-thread');
        this.total = this.$('.media-pvr-info-total-thread');
      },
      out: function() {
        this.el.classList.remove('focus');
      },
      in : function() {
        this.el.classList.add('focus');
      },
      refresh: function() {
        this.remaining.html(SysConfig.get('remainingThread'));
        this.total.html(SysConfig.get('totalThread'));
      }
    }),
    DiskView = BaseView.extend({
      ensureSelf: function(options) {
        this.infoBox = this.$('.media-disk-info');
        this.empty = this.$('.media-disk-empty-info');
        this.items = this.$('.media-disk-file-list>div');
        this.progress = this.$('.media-disk-used-progress');
        this.cursor = 0;
      },
      out: function() {
        this.items.eq(this.cursor)[0].classList.remove('current');
        this.cursor = 0;
      },
      in : function() {
        this.items.eq(this.cursor)[0].classList.add('current');
      },
      setDevice: function (device, type) {
        this.device = device;
        if (this.device) {
          this.deviceInfo = Local.scanDevice(device);
          this.infoBox.css('display', 'block');
          this.empty.css('display', 'none');
          this.progress.css('width', this.deviceInfo.used / this.deviceInfo.total * 1023 + 'px');
          this.cursor = type === 'audio' ? 1 : type === 'pic' ? 2 : 0;
        } else {
          this.deviceInfo = null;
          this.infoBox.css('display', 'none');
          this.empty.css('display', 'block');
        }
      },
      reset: function () {
        this.device = null;
        this.infoBox.css('display', 'none');
        this.empty.css('display', 'none');
        this.progress.css('width', '0px');
        this.items.eq(this.cursor)[0].classList.remove('current');
        this.cursor = 0;
      },
      offset: function (offset) {
        var next = this.cursor + offset;
        if (next < 0 || next >= this.items.length) return;
        this.items.eq(this.cursor)[0].classList.remove('current');
        this.cursor = next;
        this.items.eq(this.cursor)[0].classList.add('current');
      },
      refresh: function () {
        this.device && this.setDevice(this.device);
      }
    }),
    MediaView = BaseView.extend({
      className: 'page animated media',
      template: require('view/media/media.html'),
      ensureSelf: function(options) {
        this.render();
        this.loading = this.$('#media-disk-loading');
        this.loadingTimer = Timer.get();
        this.info = new PVRInfoView({
          el: this.$('.media-pvr-info-1')
        });
        this.create = new PVRCreateView({
          el: this.$('.media-pvr-info-2')
        });
        this.disk = new DiskView({
          el: this.$('.media-disk-box')
        });
        options.parent.append(this.el);
        this.deviceInfo = {};

        this.areaCursor = 0;
      },
      refreshPVRInfo: function() {
        this.info.refresh();
        this.create.refresh();
      },
      beforeOut: function() {
        this.loadingTimer.clear();
        Broadcast.off('sys:pvr', this.refreshPVRInfo, this);
        Broadcast.off('event:usb', this.diskInOrOut, this);
      },
      afterOut: function() {
        this.disk.reset();
        this.hideLoading();
      },
      beforeIn: function(options) {
        Broadcast.on('sys:pvr', this.refreshPVRInfo, this);
        Broadcast.on('event:usb', this.diskInOrOut, this);
        this.initOptions = options;
      },
      willLoading: function () {
        this.prevent = true;
        this.loading.css('display', 'block');
      },
      hideLoading: function () {
        this.prevent = false;
        this.loading.css('display', 'none');
      },
      afterIn: function() {
        var locals = Local.getDevices();
        var cursor = -1;
        this.areaCursor = this.initOptions ? this.initOptions.area : 0;
        if (this.areaCursor === 2 && this.initOptions && this.initOptions.device && locals.length > 0) {
          for (var i = 0, j = locals.length; i < j && i < 2; i++) {
            if (locals[i].mainDevice === this.initOptions.device.unique) {
              cursor = i;
              break;
            }
          }
          if (cursor === -1) {
            cursor = 0;
            this.areaCursor = 0;  
          }
        } else {
          this.areaCursor === 2 && (this.areaCursor = 0);
          cursor = 0;
        }
        this.willLoading();
        this.loadingTimer.setTimeout(function () {
          this.refreshPVRInfo();
          this.disk.setDevice(locals[cursor], this.initOptions && this.initOptions.type);
          this.setArea(this.areaCursor);
          this.hideLoading();
        }, 200, this);
      },
      diskInOrOut: function(eventName) {
        var locals = Local.getDevices();
        if (locals.length > 0) {
          this.willLoading();
          this.loadingTimer.setTimeout(function () {
            this.info.refresh();
            this.disk.setDevice(locals[0]);
            this.hideLoading();
          }, 200, this);
        } else {
          this.info.refresh();
          this.disk.setDevice(null);
          this.areaCursor === 2 && this.upOrDown(-1);
        }
      },
      render: function() {
        this.$el.html(_.template(this.template));
        return this;
      },
      onkeydown: function(keyCode) {
        if (this.prevent) true;
        switch (keyCode) {
          case jsf.KEY.up:
            this.upOrDown(-1);
            break;
          case jsf.KEY.down:
            this.upOrDown(1);
            break;
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
          case jsf.KEY.menu:
            this.keyMenu();
            break;
        }
      },
      keyBack: function () {
        Broadcast.trigger('page:to', 'home');
      },
      keyEnter: function () {
        switch (this.areaCursor) {
          case 0:
            Broadcast.trigger('page:to', 'media-recorded');
            break;
          case 1:
            Broadcast.trigger('page:to', 'media-booking');
            break;
          case 2:
            var deviceInfo = this.disk.deviceInfo;
            if (!deviceInfo) return;
            var cursor = this.disk.cursor;
            if (cursor === 0) {
              Broadcast.trigger('page:to', 'media-list', {
                device: deviceInfo,
                type: 'video'
              });
            } else if (cursor === 1) {
              Broadcast.trigger('page:to', 'media-list', {
                device: deviceInfo,
                type: 'audio'
              });
            } else if (cursor === 2) {
              Broadcast.trigger('page:to', 'media-list', {
                device: deviceInfo,
                type: 'pic'
              });
            }
            break;
        }
      },
      keyMenu: function () {
        if (this.areaCursor === 2) {
          this.willLoading();
          this.loadingTimer.setTimeout(function () {
            this.disk.refresh();
            this.hideLoading();
          }, 200, this);
        }
      },
      clearArea: function () {
        switch (this.areaCursor) {
          case 0:
            this.info.out();
            break;
          case 1:
            this.create.out();
            break;
          case 2:
            this.disk.out();
            break;
          default:
            break;
        }
      },
      setArea: function (index) {
        if (index < 0 || index > 2) return;
        switch (index) {
          case 0:
            this.info.in();
            break;
          case 1:
            this.create.in();
            break;
          case 2:
            if (!this.disk.device) return;
            this.disk.in();
            break;
          default:
            break;
        }
        if (this.areaCursor === index) return;
        this.clearArea();
        this.areaCursor = index;
      },
      upOrDown: function (offset) {
        this.setArea(this.areaCursor + offset);
      },
      leftOrRight: function (offset) {
        this.areaCursor === 2 && this.disk.offset(offset);
      }
    });
  module.exports = {
    create: function(app) {
      if (!this._instance) {
        this._instance = new MediaView({
          parent: app.$el,
          state: app.state
        });
      }
      return this._instance;
    }
  };
});