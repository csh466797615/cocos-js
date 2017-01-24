/**
 * recorded.js
 * @authors Casper 
 * @date    2015/08/04
 * @version 1.0.0
 */
define(['view/media/recorded.html', 'service/Broadcast', 'service/Transform', 'service/SysConfig', 'service/Timer', 'service/Local', 'service/Rec', 'service/Live'], function(require, exports, module) {
  var Broadcast = require('service/Broadcast'),
    Transform = require('service/Transform'),
    SysConfig = require('service/SysConfig'),
    Timer = require('service/Timer'),
    Local = require('service/Local'),
    Rec = require('service/Rec'),
    Live = require('service/Live');
  var BaseView = require('component/BaseView'),
    ListView = require('component/ListView'),
    RecordedItem = BaseView.extend({
      template: '<div></div><div><span></span></div><div><span></span></div><div></div><div></div>',
      ensureSelf: function(options) {
        this.$el.html(this.template);
        var items = this.$('>div');
        this.status = items.eq(0);
        this.program = items.eq(1).find('span');
        this.channel = items.eq(2).find('span');
        this.size = items.eq(3);
        this.time = items.eq(4);
        this.el.className = options.className;
        var self = this;
        this.el.addEventListener('webkitTransitionEnd', function(event) {
          if (event.target === this && event.propertyName === 'transform') {
            self.remove();
          }
        }, false);
      },
      showData: function(data, recordings) {
        if (data) {
          var size;
          if (data instanceof jsf.Booking) {
            this.status[0].className = data.id in recordings ? 'recording' : 'waiting';
            this.program.html(data.name);
            size = (data.endTime - data.startTime) / 1000 * 0.5;
          } else {
            this.status[0].className = 'recorded';
            this.program.html(data.programName);
            size = data.size;
          }
          this.status.css('visibility', 'visible');
          this.channel.html(data.channelName);
          if (size < 1024) {
            this.size.html(size + 'M');
          } else {
            this.size.html((size / 1024).toFixed(1) + 'G');
          }
          this.time.html(jsf.dateFormat(data.startTime, 'yyyy.MM.dd hh:mm:ss'));
        } else {
          this.status.css('visibility', 'hidden');
          this.program.html('');
          this.channel.html('');
          this.size.html('');
          this.time.html('');
        }
      }
    }),
    RecordedView = ListView.extend({
      className: 'page animated pvr-recorded',
      template: require('view/media/recorded.html'),
      ensureSelf: function(options) {
        this.render();
        options.parent.append(this.el);
        this.available = this.$('#recorded-thread-info-available');
        this.total = this.$('#recorded-thread-info-total');
        this.cursor = this.$('.recorded-item-list-progress-cursor');
        this.focus = this.$('.recorded-item-list-focus')[0];
        this.isCycle = false;
        this.max = 11;
        this.itemClass = 'recorded-item-';
        this.mid = 1;
        this.currentMid = 1;
        this.focusIndex = this.mid;
        this.minFocusIndex = this.mid;
        this.maxFocusIndex = this.max - 2;
        this.timer = Timer.get();
        this.scrollTimer = Timer.get();
        this.isScrollProgram = false;
        this.isScrollChannel = false;
        this.items = [];
        this.itemList = this.$('.recorded-item-list');
        for (var i = 0; i < this.max; i++) {
          this.items.push(new RecordedItem({
            className: this.itemClass + i
          }));
          this.itemList.append(this.items[i].el);
        }
        this.items[this.currentMid].el.classList.add('current');
      },
      getItem: function(itemIndex) {
        return this.items[itemIndex].el;
      },
      showData: function(itemIndex, index) {
        this.items[itemIndex].showData(this.data[index], this.recordings);
      },
      _startScroll: function() {
        var self = this;
        this.scrollTimer.setTimeout(function() {
          self._scroll();
        }, 800);
      },
      _unscroll: function() {
        this.scrollTimer.clear();
        if (this.isScrollProgram) {
          this.items[(this.currentMid + this.focusIndex - this.minFocusIndex) % this.max].program.unwrap();
          this.isScrollProgram = false;
        }
        if (this.isScrollChannel) {
          this.items[(this.currentMid + this.focusIndex - this.minFocusIndex) % this.max].channel.unwrap();
          this.isScrollChannel = false;
        }
      },
      _scroll: function() {
        var scrollItemIndex = (this.currentMid + this.focusIndex - this.minFocusIndex) % this.max;
        if (this.items[scrollItemIndex].program.width() > 300) {
          this.items[scrollItemIndex].program.wrap('<marquee></marquee>');
          this.isScrollProgram = true;
        }
        if (this.items[scrollItemIndex].channel.width() > 200) {
          this.items[scrollItemIndex].channel.wrap('<marquee></marquee>');
          this.isScrollChannel = true;
        }
      },
      _offset: function(offset) {
        this.dataIndex += offset;
        this.items[(this.currentMid + (this.focusIndex - this.minFocusIndex)) % this.max].el.classList.remove('current');
        if (offset < 0 && this.focusIndex === this.minFocusIndex || offset > 0 && this.focusIndex === this.maxFocusIndex) {
          this.offset(offset);
        } else {
          this.focusIndex = (this.focusIndex + offset + this.max) % this.max;
          this.focus.className = this.itemClass + this.focusIndex;
        }
        this.items[(this.currentMid + (this.focusIndex - this.minFocusIndex)) % this.max].el.classList.add('current');
      },
      _prevent: function(keyCode) {
        switch (keyCode) {
          case jsf.Event.KEY_UP:
          case jsf.Event.KEY_DOWN:
            if (this._preventKey) {
              return true;
            } else {
              this._preventKey = true;
              var self = this;
              this.timer.setTimeout(function() {
                self._preventKey = false;
              }, 200);
            }
            return false;
          default:
            return false;
        }
      },
      refreshPVRInfo: function() {
        this.available.html(SysConfig.get('remainingThread'));
        this.total.html(SysConfig.get('totalThread'));
      },
      refreshList: function() {
        var startItem = (this.currentMid - this.mid + this.max) % this.max;
        for (var i = 0; i < this.max; i++) {
          this.showData((startItem + i) % this.max, this.index + (i - this.mid));
        }
      },
      removePvr: function () {
        this._unscroll();
        var url = this.data[this.dataIndex].url;
        this.pvrs.splice(this.dataIndex - this.bookingLength, 1);
        qin.local.remove('DIR', url.substring(0, url.lastIndexOf('/')));
        this._remove();
      },
      removeBooking: function() {
        this._unscroll();
        var booking = this.data[this.dataIndex];
        if (booking.type === jsf.Booking.TYPE_PVR) {
          Live.removeBooking(this.data[this.dataIndex]);
        } else {
          jsf.BookingManager.delete(booking);
        }
        this.bookingLength--;
        this._remove();
      },
      _remove: function () {
        this.data.splice(this.dataIndex, 1);
        var current = (this.currentMid + (this.focusIndex - this.minFocusIndex)) % this.max;
        this.items[current].el.classList.add('recorded-item-remove');
        if ((this.dataIndex === this.dataLength - 1 || this.dataIndex + (this.maxFocusIndex - this.focusIndex) >= this.dataLength - 1) && this.dataIndex - (this.focusIndex - this.minFocusIndex) > 0) {
          var start = (this.currentMid - this.mid + this.max) % this.max,
            i = 0,
            target = start;
          while (target !== current) {
            i++;
            this.items[target].el.className = this.itemClass + i;
            target = (target + 1) % this.max;
          }
          this.items.splice(start, 0, new RecordedItem({
            className: this.itemClass + 0
          }));
          this.itemList.append(this.items[start].el);
          if (current < start) {
            this.items.splice(current, 1);
            start--;
            this.currentMid = (start + this.mid) % this.max;
          } else {
            this.items.splice(current + 1, 1);
          }
          this.index--;
          this.dataIndex--;
          this.showData(start, this.index - this.mid);
        } else {
          var end = (this.currentMid - this.mid + (this.max - 1)) % this.max,
            i = this.max - 1,
            target = end;
          while (target !== current) {
            i--;
            this.items[target].el.className = this.itemClass + i;
            target = (target - 1 + this.max) % this.max;
          }
          this.items.splice(end + 1, 0, new RecordedItem({
            className: this.itemClass + (this.max - 1)
          }));
          this.itemList.append(this.items[end + 1].el);
          if (current < end) {
            this.items.splice(current, 1);
          } else {
            this.items.splice(current + 1, 1);
            this.currentMid = (this.currentMid + 1) % this.max;
            end++;
          }
          if (this.dataIndex === this.dataLength - 1) {
            this.dataIndex--;
            if (this.focusIndex > this.minFocusIndex) {
              this.focusIndex--;
              this.focus.className = this.itemClass + this.focusIndex;
            }
          }
          this.showData(end, this.index + (this.max - 1 - this.mid));
        }
        this.dataLength--;
        this.items[(this.currentMid + (this.focusIndex - this.minFocusIndex)) % this.max].el.classList.add('current');
        if (this.dataLength > 0) {
          this._startScroll();
        } else {
          this.focus.style.display = 'none';
        }
        if (this.dataLength > this.max - 2) {
          this.cursor.css('left', this.dataIndex / (this.dataLength - 1) * 400 + 'px');
        } else {
          this.cursor.css('display', 'none');
        }
      },
      usbChanged: function (eventName) {
        switch (eventName) {
          case jsf.EventSystem.USB_PLUGOUT:
            if (this.pvrs.length > 0) {
              Broadcast.on('tip:confirm:hide');
              this._unscroll();
              this.afterIn();
            }
            break;
        }
      },
      beforeIn: function(options) {
        this.from = options && options.from;
        this.refreshPVRInfo();
        Broadcast.on('sys:pvr', this.refreshPVRInfo, this);
        Broadcast.on('event:usb', this.usbChanged, this);
      },
      _getRecordingsInfo: function () {
        var recordingsInfo = {},
          recordings = Rec.getRecording(),
          now = new Date(),
          recording,
          booking;
        for (var i = recordings.length - 1; i >= 0; i--) {
          recording = recordings[i];
          for (var j = 0; j < this.data.length; j++) {
            booking = this.data[j];
            if (booking.startTime <= now && booking.endTime >= now && recording.tsId === booking.tsId && recording.serviceId === booking.serviceId && recording.frequency === booking.frequency) {
              recordingsInfo[booking.id] = true;
              break;
            }
          }
        }
        return recordingsInfo;
      },
      afterIn: function() {
        this.data = jsf.BookingManager.getByType([jsf.Booking.TYPE_TIME_PVR]).concat(Live.getBookingByType(jsf.Booking.TYPE_PVR));
        var recordingsInfo = this._getRecordingsInfo();
        this.data.sort(function(a, b) {
          return a.id in recordingsInfo && b.id in recordingsInfo || !(a.id in recordingsInfo) && !(b.id in recordingsInfo) ? a.startTime < b.startTime ? -1 : a.startTime > b.startTime ? 1 : a.serviceId < b.serviceId ? -1 : 1 : a.id in recordingsInfo ? -1 : 1;
        });
        this.recordings = recordingsInfo;
        this.bookingLength = this.data.length;
        this.pvrs = Rec.getPvrs();
        this.data = this.data.concat(this.pvrs);
        this.index = 0;
        this.dataIndex = 0;
        this.dataLength = this.data.length;
        this.dataLength > this.max - 2 && this.cursor.css('display', 'block');
        this.dataLength >= 1 && (this.focus.style.display = 'block');
        this.refreshList();
        this._startScroll();
      },
      beforeOut: function() {
        this.timer.clear();
        this._unscroll();
        Broadcast.off('sys:pvr', this.refreshPVRInfo, this);
        Broadcast.off('event:usb', this.usbChanged, this);
      },
      afterOut: function() {
        this.data = [];
        this.index = 0;
        this.dataIndex = 0;
        this.refreshList();
        if (this.focusIndex !== this.minFocusIndex) {
          this.items[(this.currentMid + (this.focusIndex - this.minFocusIndex)) % this.max].el.classList.remove('current');
          this.focusIndex = this.minFocusIndex;
          this.focus.className = this.itemClass + this.focusIndex;
          this.items[(this.currentMid + (this.focusIndex - this.minFocusIndex)) % this.max].el.classList.add('current');
        }
        this.cursor.css('display', 'none');
        this.focus.style.display = 'none';
        this.cursor.css('left', '0px');
      },
      render: function() {
        this.$el.html(_.template(this.template));
        return this;
      },
      onkeydown: function(keyCode) {
        if (this._prevent(keyCode)) return;
        switch (keyCode) {
          case jsf.Event.KEY_UP:
            if (this.dataLength > 1) {
              this._unscroll();
              if (this.dataIndex > 0) {
                this._offset(-1);
              } else {
                this.items[(this.currentMid + (this.focusIndex - this.minFocusIndex)) % this.max].el.classList.remove('current');
                this.dataIndex = this.dataLength - 1;
                this.focusIndex = this.dataLength > this.maxFocusIndex ? this.maxFocusIndex : this.dataLength;
                this.index = this.dataIndex - (this.focusIndex - this.minFocusIndex);
                this.items[(this.currentMid + (this.focusIndex - this.minFocusIndex)) % this.max].el.classList.add('current');
                this.focus.className = this.itemClass + this.focusIndex;
                this.dataLength > this.maxFocusIndex && this.refreshList();
              }
              this._startScroll();
              this.cursor.css('left', this.dataIndex / (this.dataLength - 1) * 400 + 'px');
            }
            break;
          case jsf.Event.KEY_DOWN:
            if (this.dataLength > 1) {
              this._unscroll();
              if (this.dataIndex < this.dataLength - 1) {
                this._offset(1);
              } else {
                this.items[(this.currentMid + (this.focusIndex - this.minFocusIndex)) % this.max].el.classList.remove('current');
                this.dataIndex = 0;
                this.index = 0;
                this.focusIndex = this.minFocusIndex;
                this.items[(this.currentMid + (this.focusIndex - this.minFocusIndex)) % this.max].el.classList.add('current');
                this.focus.className = this.itemClass + this.focusIndex;
                this.dataLength > this.maxFocusIndex && this.refreshList();
              }
              this._startScroll();
              this.cursor.css('left', this.dataIndex / (this.dataLength - 1) * 400 + 'px');
            }
            break;
          case jsf.Event.KEY_BACK:
            if (this.from && this.from === 'booking') {
              Broadcast.trigger('page:to', 'media-booking', {
                view: 'info'
              });
            } else {
              Broadcast.trigger('page:to', 'media');
            }
            break;
          case jsf.Event.KEY_RED:
            if (this.dataLength > 0) {
              var data = this.data[this.dataIndex];
              if (data instanceof jsf.Booking) {
                Broadcast.trigger('tip:confirm', 'Are you sure to delete this booking?', this.removeBooking, this);
              } else {
                Broadcast.trigger('tip:confirm', 'Are you sure to delete this file?', this.removePvr, this);
              }
            }
            break;
          case jsf.Event.KEY_ENTER:
            if (this.dataLength > 0) {
              var data = this.data[this.dataIndex];
              if (data instanceof jsf.Booking) {
              } else {
                var files = [],
                  pvr;
                for (var i = 0; i < this.pvrs.length; i++) {
                  pvr = this.pvrs[i];
                  files.push({
                    name: pvr.programName || pvr.channelName,
                    path: pvr.url
                  });
                }
                Broadcast.trigger('page:to', 'media-video', {
                  videoList: files,
                  cursor: this.dataIndex - (this.dataLength - this.pvrs.length),
                  recorded: true
                });
              }
            }
            break;
          default:
            break;
        }
      }
    });
  module.exports = {
    create: function(app) {
      if (!this._instance) {
        this._instance = new RecordedView({
          parent: app.$el
        });
      }
      return this._instance;
    }
  };
});