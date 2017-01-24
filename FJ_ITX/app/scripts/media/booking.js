/**
 * booking.js
 * @authors Casper
 * @date    2015/07/15
 * @version 1.0.0
 */
define(['view/media/booking.html'], function(require, exports, module) {
  var Broadcast = require('service/Broadcast'),
    Transform = require('service/Transform'),
    SysConfig = require('service/SysConfig'),
    Rec = require('service/Rec'),
    Timer = require('service/Timer'),
    Live = require('service/Live'),
    Event = {
      changeView: 'view-changed',
      changeGroup: 'group-changed',
      changeChannel: 'channel-changed',
      changeDate: 'date-changed',
      changeTime: 'time-changed',
      changePlaying: 'playing-changed',
      reset: 'reset'
    },
    State = new Backbone.Model({});
  var BaseView = require('component/BaseView'),
    ListView = require('component/ListView'),
    InfoView = BaseView.extend({
      ensureSelf: function(options) {},
      out: function() {
        this.el.classList.remove('focus');
      },
      in : function() {
        this.el.classList.add('focus');
      },
      onkeydown: function(keyCode) {
        switch (keyCode) {
          case jsf.Event.KEY_DOWN:
            State.trigger(Event.changeView, 'group');
            break;
          case jsf.Event.KEY_BACK:
            Broadcast.trigger('page:to', 'media', {
              area: 1
            });
            break;
          case jsf.Event.KEY_ENTER:
            Broadcast.trigger('page:to', 'media-recorded', {
              from: 'booking'
            });
            break;
          default:
            break;
        }
      }
    }),
    GroupList = ListView.extend({
      ensureSelf: function(options) {
        this.items = this.$('div:not(last-child)');
        this.itemClass = 'pvr-booking-group-item-';
        this.max = 7;
        this.mid = 1;
        this.currentMid = 1;
        this.index = -1;
      },
      out: function() {
        this.el.classList.remove('focus');
      },
      in : function() {
        this.el.classList.add('focus');
      },
      refresh: function() {
        this.index = 0;
        this.data = Live.getGroups();
        this.dataLength = this.data.length;
        var startItem = (this.currentMid - this.mid + this.max) % this.max;
        for (var i = 0; i < this.max; i++) {
          this.showData((startItem + i) % this.max, (this.index + (i - this.mid) + this.dataLength) % this.dataLength);
        }
        State.trigger(Event.changeGroup, this.data[this.index].list);
      },
      getItem: function(itemIndex) {
        return this.items.eq(itemIndex)[0];
      },
      showData: function(itemIndex, index) {
        var group = this.data[index];
        this.items.eq(itemIndex).html(group ? group.name : '');
      },
      afterOffset: function() {
        State.trigger(Event.changeGroup, this.data[this.index].list);
      },
      onkeydown: function(keyCode) {
        switch (keyCode) {
          case jsf.Event.KEY_LEFT:
            this.offset(-1);
            break;
          case jsf.Event.KEY_RIGHT:
            this.offset(1);
            break;
          case jsf.Event.KEY_BACK:
            Broadcast.trigger('page:to', 'media', {
              area: 1
            });
            break;
          case jsf.Event.KEY_UP:
            State.trigger(Event.changeView, 'info');
            break;
          case jsf.Event.KEY_DOWN:
          case jsf.Event.KEY_ENTER:
            this.dataLength > 1 && this.data[this.index].list.length > 0 && State.trigger(Event.changeView, 'channel');
            break;
          default:
            break;
        }
      }
    }),
    ChannelView = ListView.extend({
      ensureSelf: function(options) {
        this.items = [];
        var items = this.$('.pvr-booking-channel-item-list>div'),
          item,
          children;
        for (var i = 0, j = items.length; i < j; i++) {
          item = items.eq(i);
          this.items.push({
            box: item,
            num: item.find('>div:first'),
            name: item.find('span')
          });
        }
        this.isCycle = false;
        this.max = 11;
        this.itemClass = 'pvr-booking-channel-item-';
        this.mid = 1;
        this.currentMid = 1;
        this.scrollTimer = Timer.get();
        this.isScroll = false;
        this.cursor = this.$('.pvr-booking-channel-item-list-progress-cursor');
        this.focus = this.$('.pvr-booking-channel-item-list-focus')[0];
        this.focusIndex = this.mid;
        this.minFocusIndex = this.mid;
        this.maxFocusIndex = this.max - 3;
        this.timer = Timer.get();
        this.listenTo(State, Event.changeGroup, function(list) {
          this.refresh(list);
        });
        this.listenTo(State, Event.reset, function(unrefresh) {
          !unrefresh && this.refresh(this.channels);
        });
      },
      getItem: function(itemIndex) {
        return this.items[itemIndex].box[0];
      },
      showData: function(itemIndex, index) {
        var channel = this.channels.get(index);
        if (channel) {
          this.items[itemIndex].num.html(Transform.number(channel.logicNumber, 3));
          this.items[itemIndex].name.html(channel.name);
        } else {
          this.items[itemIndex].num.html('');
          this.items[itemIndex].name.html('');
        }
      },
      refresh: function(list) {
        this.channels = list;
        this.index = 0;
        this.dataLength = this.channels.length;
        if (this.focusIndex !== this.minFocusIndex) {
          this.items[(this.currentMid + (this.focusIndex - this.minFocusIndex)) % this.max].box[0].classList.remove('current');
          this.focusIndex = this.minFocusIndex;
          this.focus.className = this.itemClass + this.focusIndex;
          this.items[(this.currentMid + (this.focusIndex - this.minFocusIndex)) % this.max].box[0].classList.add('current');
        }
        this.dataIndex = this.index + (this.focusIndex - this.minFocusIndex);
        this.cursor.css('display', this.dataLength <= this.max - 3 ? 'none' : 'block');
        this.cursor.css('left', '0px');
        this.refreshList();
        State.trigger(Event.changeChannel, this.channels.get(this.dataIndex));
      },
      refreshList: function() {
        var startItem = (this.currentMid - this.mid + this.max) % this.max;
        for (var i = 0; i < this.max; i++) {
          this.showData((startItem + i) % this.max, this.index + (i - this.mid));
        }
      },
      out: function() {
        this.focus.style.visibility = 'hidden';
        this.el.classList.remove('focus');
        this._unscroll();
        this.timer.clear();
      },
      in : function() {
        this._preventKey = false;
        this.focus.style.visibility = 'visible';
        this.el.classList.add('focus');
        this._startScroll();
      },
      _offset: function(offset) {
        this.dataIndex += offset;
        this.items[(this.currentMid + (this.focusIndex - this.minFocusIndex)) % this.max].box[0].classList.remove('current');
        if (offset < 0 && this.focusIndex === this.minFocusIndex || offset > 0 && this.focusIndex === this.maxFocusIndex) {
          this.offset(offset);
        } else {
          this.focusIndex = (this.focusIndex + offset + this.max) % this.max;
          this.focus.className = this.itemClass + this.focusIndex;
        }
        this.items[(this.currentMid + (this.focusIndex - this.minFocusIndex)) % this.max].box[0].classList.add('current');
        State.trigger(Event.changeChannel, this.channels.get(this.dataIndex));
      },
      _startScroll: function() {
        var self = this;
        this.scrollTimer.setTimeout(function() {
          self._scroll();
        }, 800);
      },
      _unscroll: function() {
        this.scrollTimer.clear();
        if (this.isScroll) {
          this.items[(this.currentMid + this.focusIndex - this.minFocusIndex) % this.max].name.unwrap();
          this.isScroll = false;
        }
      },
      _scroll: function() {
        var scrollItemIndex = (this.currentMid + this.focusIndex - this.minFocusIndex) % this.max;
        if (this.items[scrollItemIndex].name.width() > 180) {
          this.items[scrollItemIndex].name.wrap('<marquee></marquee>');
          this.isScroll = true;
        }
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
      onkeydown: function(keyCode) {
        if (this._prevent(keyCode)) return;
        switch (keyCode) {
          case jsf.Event.KEY_UP:
            if (this.dataLength > 1) {
              this._unscroll();
              if (this.dataIndex === 0) {
                this.items[(this.currentMid + (this.focusIndex - this.minFocusIndex)) % this.max].box[0].classList.remove('current');
                this.dataIndex = this.dataLength - 1;
                this.focusIndex = this.dataLength > this.maxFocusIndex ? this.maxFocusIndex : this.dataLength;
                this.index = this.dataIndex - (this.focusIndex - this.minFocusIndex);
                this.items[(this.currentMid + (this.focusIndex - this.minFocusIndex)) % this.max].box[0].classList.add('current');
                this.focus.className = this.itemClass + this.focusIndex;
                this.dataLength > this.maxFocusIndex && this.refreshList();
                State.trigger(Event.changeChannel, this.channels.get(this.dataIndex));
              } else {
                this._offset(-1);
              }
              this._startScroll();
              this.cursor.css('left', this.dataIndex / (this.dataLength - 1) * 400 + 'px');
            }
            break;
          case jsf.Event.KEY_DOWN:
            if (this.dataLength > 1) {
              this._unscroll();
              if (this.dataIndex === this.dataLength - 1) {
                this.refresh(this.channels);
              } else {
                this._offset(1);
              }
              this._startScroll();
              this.cursor.css('left', this.dataIndex / (this.dataLength - 1) * 400 + 'px');
            }
            break;
          case jsf.Event.KEY_RIGHT:
            State.trigger(Event.changeView, 'epg');
            break;
          case jsf.Event.KEY_BACK:
            State.trigger(Event.changeView, 'group');
            State.trigger(Event.reset);
            break;
          default:
            break;
        }
      }
    }),
    EpgInfoView = BaseView.extend({
      ensureSelf: function() {
        var children = this.$el.find('>div');
        this.arrow = children.eq(0);
        this.name = children.eq(1);
        this.description = children.eq(2).find('p');
        this.progress = this.$el.find('.pvr-booking-epg-info-progress');
        this.cursor = this.$el.find('.pvr-booking-epg-info-cursor');
        this.positionIndex = 1;
        this.timer = Timer.get();
      },
      display: function(focusIndex, epg) {
        this.el.classList.remove('pvr-booking-epg-info-' + this.positionIndex);
        this.positionIndex = focusIndex;
        this.el.classList.add('pvr-booking-epg-info-' + this.positionIndex);
        this.name.html(epg.name);
        this.description.html(epg.description);
        if (this.description.height() > 120) {
          var self = this,
            offset = this.description.height() - 120,
            time = offset / 24 * 1.5;
          this.description.css({
            'transition-duration': time + 's'
          });
          this.cursor.css({
            'transition-duration': time + 's'
          });
          this.timer.setTimeout(function() {
            self.description.css({
              'margin-top': -offset + 'px'
            });
            self.cursor.css({
              'left': '70px'
            });
            self.timer.setTimeout(function() {
              self.description.css({
                'transition-duration': '1s',
                'margin-top': '0px'
              });
              self.cursor.css({
                'transition-duration': '1s',
                'left': '0px'
              });
            }, time * 1000 + 2000);
          }, 1000);
          this.progress.css('display', 'block');
        } else {
          this.progress.css('display', 'none');
        }
        if (!this.visible) {
          this.visible = true;
          this.in();
        }
      },
      disappear: function() {
        if (this.visible) {
          this.visible = false;
          this.out();
          this.timer.clear();
          this.description.css({
            'transition-duration': '0s',
            'margin-top': '0px'
          });
          this.cursor.css({
            'transition-duration': '0s',
            'left': '0px'
          });
        }
      }
    }),
    EpgItemView = BaseView.extend({
      ensureSelf: function(options) {
        this.$el.html('<div></div><div></div><div><span></span></div><div></div><div></div><div></div><div></div>');
        var children = this.$el.find('>div');
        this.playing = children.eq(0);
        this.time = children.eq(1);
        this.name = children.eq(2).find('span');
        this.info = children.eq(3);
        this.single = children.eq(4);
        this.remind = children.eq(5);
        this.progress = children.eq(6);
      },
      show: function(epg) {
        this.stopListening(State);
        this.epg = epg;
        if (epg) {
          var now = new Date();
          var startTime = epg.startTime;
          var endTime = epg.endTime;
          var isPlaying = false;
          if (now >= startTime && now < endTime || now < startTime) {
            isPlaying = now >= startTime;
            this.startTime = startTime.getTime();
            this.endTime = endTime.getTime();
            this.duration = this.endTime - this.startTime;
            this.listenTo(State, Event.timeChange, this._refreshProgress);
            this._refreshProgress();
          }
          this.playing.css('visibility', isPlaying ? 'visible' : 'hidden');
          this.progress.css('display', isPlaying ? 'block' : 'none');
          this.time.html(Transform.date(startTime, 'hh:mm') + ' - ' + Transform.date(endTime, 'hh:mm'));
          this.name.html(epg.name);
          this.info.css('display', epg.description ? 'block' : 'none');
          this.single.css('display', Live.isBooking(epg, jsf.Booking.TYPE_PVR) ? 'block' : 'none');
          this.remind.css('display', Live.isBooking(epg, jsf.Booking.TYPE_EPG) ? 'block' : 'none');
        } else {
          this.time.html('');
          this.name.html('');
          this.playing.css('visibility', 'hidden');
          this.info.css('display', 'none');
          this.single.css('display', 'none');
          this.remind.css('display', 'none');
          this.progress.css('display', 'none');
        }
      },
      _refreshProgress: function() {
        var now = Date.now();
        if (now >= this.endTime) {
          this.stopListening(State);
          State.trigger(Event.changePlaying);
        } else if (now < this.startTime) {
          return;
        }else {
          this.progress.width(750 * (Date.now() - this.startTime) / this.duration);
        }
      }
    }),
    EpgView = ListView.extend({
      ensureSelf: function(options) {
        this.isCycle = false;
        this.max = 11;
        this.itemClass = 'pvr-booking-epg-item-';
        this.mid = 1;
        this.currentMid = 1;
        this.scrollTimer = Timer.get();
        this.isScroll = false;
        this.cursor = this.$('.pvr-booking-epg-item-list-progress-cursor');
        this.focus = this.$('.pvr-booking-epg-item-list-focus')[0];
        this.focusIndex = this.mid;
        this.minFocusIndex = this.mid;
        this.maxFocusIndex = this.max - 2;
        this.timer = Timer.get();
        this.descriptionTimer = Timer.get();
        this.items = [];
        this.description = new EpgInfoView({
          el: this.$('.pvr-booking-epg-info')
        });
        var list = this.$('.pvr-booking-epg-item-list');
        for (var i = 0; i < this.max; i++) {
          this.items.push(new EpgItemView({
            className: this.itemClass + i + (i === this.mid ? ' current' : '')
          }));
          list.append(this.items[i].el);
        }
        this.listenTo(State, Event.changeChannel, function(channel) {
          channel && jsf.EPG.requestSchedule(channel, (!channel.isLocked() || !SysConfig.get('isLocked')) && channel ===  Live.getCurrentChannel());
          this.currentChannel = channel;
          this.refreshEpgs();
        });
        this.listenTo(State, Event.changeDate, function(dayIndex, refreshNow) {
          this.dayIndex = dayIndex;
          refreshNow && this.refreshEpgs();
        });
        this.listenTo(State, Event.changePlaying, function() {
          this.refresh(this.epgs.slice(1));
          if (this.dataLength > 0) {
            var isShowDesc = this.description.visible;
            this.description.disappear();
            isShowDesc && !this.descByManual && this.showDescriptionByAuto();
          } else {
            State.trigger(Event.changeView, 'channel');
          }
        });
        this.listenTo(State, Event.reset, function(unrefresh) {
          unrefresh && (this.currentChannel = null);
        });
        this.descByManual = true;
      },
      refreshEpgs: function() {
        if (this.currentChannel) {
          // var epgs = Live.getEpgs(this.currentChannel, this.dayIndex);
          // if (this.dayIndex === 0) {
          //   var now = new Date();
          //   for (var i = epgs.length - 1; i >= 0; i--) {
          //     if (epgs[i].startTime <= now && epgs[i].endTime > now || epgs[i].endTime < now) {
          //       epgs = epgs.slice(i);
          //       break;
          //     }
          //   }
          // }
          this.refresh(Live.getEpgs(this.currentChannel, this.dayIndex));
        } else {
          this.refresh([]);
        }
      },
      refresh: function(epgs) {
        this.epgs = epgs;
        this.index = 0;
        this.dataLength = this.epgs.length;
        if (this.focusIndex !== this.minFocusIndex) {
          this.items[(this.currentMid + (this.focusIndex - this.minFocusIndex)) % this.max].el.classList.remove('current');
          this.focusIndex = this.minFocusIndex;
          this.focus.className = this.itemClass + this.focusIndex;
          this.items[(this.currentMid + (this.focusIndex - this.minFocusIndex)) % this.max].el.classList.add('current');
        }
        this.dataIndex = this.index + (this.focusIndex - this.minFocusIndex);
        this.cursor.css('display', this.dataLength <= this.max - 3 ? 'none' : 'block');
        this.cursor.css('left', '0px');
        this.refreshList();
      },
      refreshList: function() {
        var startItem = (this.currentMid - this.mid + this.max) % this.max;
        for (var i = 0; i < this.max; i++) {
          this.showData((startItem + i) % this.max, this.index + (i - this.mid));
        }
      },
      epgChanged: function (info, isShowDesc) {
        if (this.currentChannel && this.dataLength === 0) {
          if (info.frequency === this.currentChannel.frequency && info.serviceId === this.currentChannel.serviceId && info.tsId === this.currentChannel.tsId) {
            this.hideDescription();
            var data = Live.getEpgs(this.currentChannel, this.dayIndex);
            this.refresh(data);
            isShowDesc && !this.descByManual && this.showDescriptionByAuto();
            if (data.length === 0) {
              State.trigger(Event.changeView, 'channel');
            }
          }
        }
      },
      getItem: function(itemIndex) {
        return this.items[itemIndex].el;
      },
      showData: function(itemIndex, index) {
        this.items[itemIndex].show(this.epgs[index]);
      },
      out: function() {
        this.focus.style.visibility = 'hidden';
        this.el.classList.remove('focus');
        this._unscroll();
        this.timer.clear();
        this.hideDescription();
      },
      in : function(pre) {
        if (this.dataLength > 0) {
          this._preventKey = false;
          this.focus.style.visibility = 'visible';
          this.el.classList.add('focus');
          this._startScroll();
          !this.descByManual && this.showDescriptionByAuto();
        } else {
          setTimeout(function() {
            if (pre === 'channel') {
              State.trigger(Event.changeView, 'date');
            } else {
              State.trigger(Event.changeView, 'channel');
            }
          }, 0);
        }
      },
      showDescriptionByAuto: function() {
        this.hideDescription();
        var self = this;
        this.epgs[this.dataIndex].description && this.descriptionTimer.setTimeout(function() {
          self.showDescription();
        }, 3500);
      },
      showDescription: function () {
        this.descriptionTimer.clear();
        this.description.display(this.focusIndex, this.epgs[this.dataIndex]);
      },
      hideDescription: function() {
        this.descriptionTimer.clear();
        this.description.visible && this.description.disappear();
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
      _startScroll: function() {
        var self = this;
        this.scrollTimer.setTimeout(function() {
          self._scroll();
        }, 800);
      },
      _unscroll: function() {
        this.scrollTimer.clear();
        if (this.isScroll) {
          this.items[(this.currentMid + this.focusIndex - this.minFocusIndex) % this.max].name.unwrap();
          this.isScroll = false;
        }
      },
      _scroll: function() {
        var scrollItemIndex = (this.currentMid + this.focusIndex - this.minFocusIndex) % this.max;
        if (this.items[scrollItemIndex].name.width() > 350) {
          this.items[scrollItemIndex].name.wrap('<marquee></marquee>');
          this.isScroll = true;
        }
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
      checkBooking: function (type) {
        if (this.currentChannel && this.currentChannel.isLocked() && SysConfig.get('isLocked')) {
          Broadcast.trigger('tip:password:prevent', function () {
            this.addBooking(type);
          }, this);
          return;
        }
        this.addBooking(type);
      },
      addBooking: function (type) {
        var item = this.items[(this.currentMid + (this.focusIndex - this.minFocusIndex)) % this.max],
          epg = this.epgs[this.dataIndex],
          icon = type === jsf.Booking.TYPE_EPG ? item.remind : item.single;
        if (!epg) return;
        if (Live.isBooking(epg, type)) {
          Live.removeBookingByEpgAndType(epg, type);
          Broadcast.trigger('tip:global', {
            type: 'success',
            info: 'Cancel success !'
          });
          icon.css('display', 'none');
        } else {
          if (type === jsf.Booking.TYPE_PVR) {
            var result;
            if ((result = Rec.checkConditional()).code !== Rec.CHECK_PASS) {
              Broadcast.trigger('tip:global', {
                type: 'remind',
                info: result.info
              }, 3000);
              return;
            }
          }
          var result = jsf.BookingManager.add(type === jsf.Booking.TYPE_PVR ? jsf.Booking.createPvr(epg) : jsf.Booking.createReminder(epg)),
            message = {};
          switch (result) {
            case jsf.BookingManager.ADD_FAIL:
              message.info = 'Booking fail';
              message.type = 'fail';
              break;
            case jsf.BookingManager.ADD_ERROR_TIME:
              message.info = 'Booking has expired';
              message.type = 'remind';
              break;
            case jsf.BookingManager.ADD_ERROR_SERVICE:
              message.info = 'Invalid booking, the corresponding channel is not found';
              message.type = 'remind';
              break;
            case jsf.BookingManager.ADD_ERROR_MAXCOUNT:
              message.info = 'The booking list is full';
              message.type = 'remind';
              break;
            case jsf.BookingManager.ADD_ERROR_INVALID_BOOKING:
              message.info = 'The booking is invalid';
              message.type = 'remind';
              break;
            case jsf.BookingManager.ADD_ERROR_MANUAL_RECORD_NOW:
              message.info = 'Conflict with instant record';
              message.type = 'remind';
              break;
            case jsf.BookingManager.ADD_ERROR_CONFLICT:
              message.info = 'Conflict with other bookings';
              message.type = 'remind';
              break;
            case jsf.BookingManager.ADD_ERROR_EXIST:
              message.info = 'Booking already exists';
              message.type = 'remind';
              break;
            default:
              var add = jsf.BookingManager.getByProgram(epg, type);
              if (add.length > 0) {
                message.info = 'Booking success !';
                message.type = 'success';
                Live.addBooking(add[0]);
                icon.css('display', 'block');
              } else {
                message.info = 'Booking fail';
                message.type = 'fail';
              }
              break;
          }
          Broadcast.trigger('tip:global', message);
        }
      },
      onkeydown: function(keyCode) {
        if (this._prevent(keyCode)) return;
        switch (keyCode) {
          case jsf.Event.KEY_INFO:
            if (this.descByManual) {
              this.description.visible ? this.description.disappear() : this.epgs[this.dataIndex].description && this.showDescription();
            }
            break;
          case jsf.Event.KEY_UP:
            if (this.dataLength > 1) {
              this._unscroll();
              if (this.dataIndex === 0) {
                this.items[(this.currentMid + (this.focusIndex - this.minFocusIndex)) % this.max].el.classList.remove('current');
                this.dataIndex = this.dataLength - 1;
                this.focusIndex = this.dataLength > this.maxFocusIndex ? this.maxFocusIndex : this.dataLength;
                this.index = this.dataIndex - (this.focusIndex - this.minFocusIndex);
                this.items[(this.currentMid + (this.focusIndex - this.minFocusIndex)) % this.max].el.classList.add('current');
                this.focus.className = this.itemClass + this.focusIndex;
                this.dataLength > this.maxFocusIndex && this.refreshList();
              } else {
                this._offset(-1);
              }
              this._startScroll();
              this.cursor.css('left', this.dataIndex / (this.dataLength - 1) * 400 + 'px');
              this.descByManual ? this.hideDescription() : this.showDescriptionByAuto();
            }
            break;
          case jsf.Event.KEY_DOWN:
            if (this.dataLength > 1) {
              this._unscroll();
              if (this.dataIndex === this.dataLength - 1) {
                this.refresh(this.epgs);
              } else {
                this._offset(1);
              }
              this._startScroll();
              this.cursor.css('left', this.dataIndex / (this.dataLength - 1) * 400 + 'px');
              this.descByManual ? this.hideDescription() : this.showDescriptionByAuto();
            }
            break;
          case jsf.Event.KEY_LEFT:
            State.trigger(Event.changeView, 'channel');
            break;
          case jsf.Event.KEY_RIGHT:
            State.trigger(Event.changeView, 'date');
            break;
          case jsf.Event.KEY_ENTER:
          case jsf.Event.KEY_RED:
            this.addBooking(keyCode === jsf.Event.KEY_ENTER ? jsf.Booking.TYPE_EPG : jsf.Booking.TYPE_PVR);
            break;
          case jsf.Event.KEY_BACK:
            State.trigger(Event.changeView, 'group');
            State.trigger(Event.reset);
            break;
          default:
            break;
        }
      }
    }),
    DateView = BaseView.extend({
      ensureSelf: function(options) {
        this.items = [];
        var items = this.$('.pvr-booking-date-item-list>div');
        for (var i = 0, j = items.length; i < j; i++) {
          this.items.push({
            box: items.eq(i),
            name: items.eq(i).find('>div')
          });
        }
        this.focus = this.$('.pvr-booking-date-item-list-focus')[0];
        this.itemClass = 'pvr-booking-date-item-';
        this.index = 0;
        this.preIndex = this.index;
        this.listenTo(State, Event.reset, function(unrefresh) {
          if (this.index !== 0) {
            this.items[this.index].box[0].classList.remove('current');
            this.index = 0;
            this.items[this.index].box[0].classList.add('current');
            this.focus.className = this.itemClass + this.index;
            !unrefresh && this.choose();
          }
        });
      },
      refresh: function() {
        this.days = Live.getDays();
        if (this.days[0].date !== this.startDay) {
          this.startDay = this.days[0].date;
          this.todayIndex = 0;
          this.validLength = 7 - this.todayIndex;
          if (this.index !== 0) {
            this.items[this.index].box[0].classList.remove('current');
            this.index = 0;
            this.items[this.index].box[0].classList.add('current');
            this.focus.className = this.itemClass + this.index;
          }
          for (var i = this.days.length - 1; i >= 0; i--) {
            this.items[i].name.html(Transform.date(this.days[i].date, 'MM/dd,k'));
            if (i >= this.validLength) {
              this.items[i].box[0].classList.add('invaild');
            } else {
              this.items[i].box[0].classList.remove('invaild');
            }
          }
          this.days = this.days.slice(0, this.validLength);
          this.dataLength = this.days.length;
          State.trigger(Event.changeDate, this.todayIndex + this.index, false);
        }
      },
      out: function() {
        this.focus.style.visibility = 'hidden';
        this.el.classList.remove('focus');
      },
      in : function() {
        this.focus.style.visibility = 'visible';
        this.el.classList.add('focus');
      },
      offset: function(offset) {
        this.items[this.index].box[0].classList.remove('current');
        this.index = (this.index + offset + this.dataLength) % this.dataLength;
        this.focus.className = this.itemClass + this.index;
        this.items[this.index].box[0].classList.add('current');
      },
      choose: function() {
        if (this.preIndex !== this.index) {
          this.preIndex = this.index;
          State.trigger(Event.changeDate, this.todayIndex + this.index, true);
        }
      },
      onkeydown: function(keyCode) {
        switch (keyCode) {
          case jsf.Event.KEY_UP:
            if (this.dataLength > 1) {
              this.offset(-1);
            }
            break;
          case jsf.Event.KEY_DOWN:
            if (this.dataLength > 1) {
              this.offset(1);
            }
            break;
          case jsf.Event.KEY_LEFT:
            State.trigger(Event.changeView, 'epg');
            break;
          case jsf.Event.KEY_BACK:
            State.trigger(Event.changeView, 'group');
            State.trigger(Event.reset);
            break;
          case jsf.Event.KEY_ENTER:
            this.choose();
            break;
          default:
            break;
        }
      }
    }),
    BookingView = BaseView.extend({
      className: 'page animated pvr-booking',
      template: require('view/media/booking.html'),
      ensureSelf: function(options) {
        this.render();
        this.info = new InfoView({
          el: this.$('.pvr-booking-info')
        });
        this.group = new GroupList({
          el: this.$('.pvr-booking-group')
        });
        this.epg = new EpgView({
          el: this.$('.pvr-booking-epg')
        });
        this.channel = new ChannelView({
          el: this.$('.pvr-booking-channel')
        });
        this.date = new DateView({
          el: this.$('.pvr-booking-date')
        });
        this.appointment = this.$('.pvr-booking-info-appointment');
        this.conflict = this.$('.pvr-booking-info-conflict');
        this.current = null;
        options.parent.append(this.el);
        this.listenTo(State, Event.changeView, function(view) {
          if (this.current !== this[view]) {
            this.current && this.current.out();
            this.current = this[view];
            this.current.in(this.pre);
            this.pre = view;
          }
        });
      },
      beforeOut: function() {
        var channel = this.epg.currentChannel,
          current = Live.getCurrentChannel();
        current && channel !== current && jsf.EPG.requestSchedule(current, (!current.isLocked() || !SysConfig.get('isLocked')));
        clearInterval(this.timer);
        this.current.out();
        this.current = null;
        State.trigger(Event.reset, true);
        Broadcast.trigger('extral:hide');
        Broadcast.off('sys:pvr', this.refreshPVRInfo, this);
        Broadcast.off('epg:schedule', this.epgChanged, this);
      },
      refreshPVRInfo: function() {
        this.appointment.html(SysConfig.get('usedThread'));
        this.conflict.html(SysConfig.get('totalThread'));
      },
      beforeIn: function(options) {
        Broadcast.off('epg:schedule', this.epgChanged, this);
        Broadcast.trigger('extral:show', {
          usb: true
        });
        State.trigger(Event.changeView, options && options.view ? options.view : 'group');
        this.refreshPVRInfo();
        this.date.refresh();
        this.group.refresh();
        Broadcast.on('sys:pvr', this.refreshPVRInfo, this);
        Broadcast.on('epg:schedule', this.epgChanged, this);
      },
      epgChanged: function (data) {
        this.epg.epgChanged(data, this.pre === 'epr');
      },
      afterIn: function() {
        this.timer = setInterval(function() {
          State.trigger(Event.timeChange);
        }, 1000);
      },
      render: function() {
        this.$el.html(_.template(this.template));
        return this;
      },
      onkeydown: function(keyCode) {
        this.current && this.current.onkeydown(keyCode);
      }
    });
  module.exports = {
    create: function(app) {
      if (!this._instance) {
        State.off();
        this._instance = new BookingView({
          parent: app.$el,
          state: app.state
        });
      }
      return this._instance;
    }
  };
});