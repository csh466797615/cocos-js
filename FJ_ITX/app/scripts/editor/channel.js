/**
 * channel.js
 * @authors Casper 
 * @date    2016/07/18
 * @version 1.0.0
 */
define(['view/editor/channel.html'], function(require, exports, module) {
  var Transform = require('service/Transform'),
    Live = require('service/Live'),
    Broadcast = require('service/Broadcast'),
    SysConfig = require('service/SysConfig'),
    Event = {
      changeView: 'view-changed',
      changeMenu: 'menu-changed'
    },
    State = new Backbone.Model({}),
    FavChanged = false,
    MoveChannel = false;
  var BaseView = require('component/BaseView'),
    MenuListView = BaseView.extend({
      ensureSelf: function () {
        this.items = this.$('div');
        this.cursor = 0;
      },
      reset: function () {
        if (this.cursor !== 0) {
          this.offset();
        }
      },
      offset: function () {
        this.items.eq(this.cursor).removeClass('current');
        this.cursor = this.cursor === 0 ? 1 : 0;
        this.items.eq(this.cursor).addClass('current');
      },
      out: function () {
        this.$el.removeClass('current');
      },
      in: function () {
        this.$el.addClass('current');
      },
      onkeydown: function(keyCode) {
        switch (keyCode) {
          case jsf.KEY.backspace:
            Broadcast.trigger('page:to', 'setting');
            break;
          case jsf.KEY.right:
            State.trigger(Event.changeView, this.cursor === 0 ? 'channelEditor' : 'passwordEditor');
            break;
          case jsf.KEY.up:
          case jsf.KEY.down:
            this.offset();
            State.trigger(Event.changeMenu, this.cursor);
            break;
          default:
            break;
        }
      }
    }),
    ChannelEditorListView = BaseView.extend({
      ensureSelf: function () {
        this.max = 6;
        this.focus = this.$('#channel-editor-list-item-focus');
        this.items = this.$('.channel-editor-list>.channel-editor-list-item');
        this.nums = this.$('.channel-editor-list-item-num');
        this.names = this.$('.channel-editor-list-item-name');
        this.progress = this.$('#channel-editor-list-preogress'); // max 350
        this.dataLength = 0;
        this.isMove = false;
      },
      refresh: function (data) {
        this.isMove = false;
        this.data = data;
        this.cursor = 0;
        this.focusCursor = 0;
        this.dataLength = data.length;
        this.focus.css('top', '0px');
        this.showData();
        this.progress.css('display', this.dataLength > 1 ? 'block' : 'none');
        this.progress.css('top', '0px');
      },
      showData: function () {
        for (var i = 0; i < this.max; i++) {
          this.refreshItem(i, this.data.get(this.cursor + i));
        }
      },
      refreshItem: function (index, channel) {
        var className = 'channel-editor-list-item';
        if (channel) {
          if (channel.isFav()) {
            className += ' fav';
          }
          if (channel.isLocked()) {
            className += ' lock';
          }
          this.items.eq(index)[0].className = className;
          this.nums.eq(index).html(Transform.number(channel.logicNumber, 3));
          this.names.eq(index).html(channel.name);
        } else {
          this.items.eq(index)[0].className = 'channel-editor-list-item';
          this.nums.eq(index).html('');
          this.names.eq(index).html('');
        }
      },
      offset: function (offset, force) {
        if (this.dataLength < 2) return;
        MoveChannel = true;
        this.items.eq(this.focusCursor).removeClass('current');
        var next = this.focusCursor + offset;
        var min = Math.min(this.dataLength - 1, this.max - 1);
        if (next < 0) {
          if (this.cursor > 0) {
            this.cursor--;
          } else {
            this.focusCursor = min;
            this.cursor = this.dataLength - 1 - min;
          }
          (force || this.dataLength > this.max) && this.showData();
        } else if (next > min) {
          if (this.cursor + this.focusCursor === this.dataLength - 1) {
            this.cursor = 0;
            this.focusCursor = 0;
            (force || this.dataLength > this.max) && this.showData();
          } else {
            this.cursor++;
            this.showData();
          }
        } else {
          this.focusCursor = next;
          force && this.showData();
        }
        this.items.eq(this.focusCursor).addClass('current');
        this.focus.css('top', 70 * this.focusCursor + 'px');
        this.progress.css('top', (this.cursor + this.focusCursor) / (this.dataLength - 1) * 350 + 'px');
      },
      move: function (offset) {
        if (this.dataLength < 2) return;
        this.items.eq(this.focusCursor).removeClass('move');
        var currentCursor = this.cursor + this.focusCursor;
        var next = (currentCursor + offset + this.dataLength) % this.dataLength;
        this.data.swap(currentCursor, next);
        this.offset(offset, true);
        this.items.eq(this.focusCursor).addClass('move');
      },
      reset: function () {
        this.data = null;
        this.dataLength = 0;
        for (var i = 0; i <= this.max; i++) {
          this.refreshItem(i, null);
        }
        this.progress.css('display', 'none');
      },
      in: function () {
        if (this.dataLength > 0) {
          this.items.eq(this.focusCursor).addClass('current');
          this.dataLength > 0 && this.focus.css('display', 'block');
        } else {
          State.trigger(Event.changeView, 'menu');
        }
      },
      out: function () {
        this.items.eq(this.focusCursor).removeClass('current');
        if (this.dataLength > 0) {
          this.focus.css('display', 'none');
        }
      },
      check: function (channel) {
        if (channel === Live.getCurrentChannel()) {
                    Broadcast.trigger('media:play', 'live', channel);
        }
      },
      onkeydown: function(keyCode) {
        switch (keyCode) {
          case jsf.KEY.backspace:
            Broadcast.trigger('page:to', 'setting');
            break;
          case jsf.KEY.left:
            !this.isMove && State.trigger(Event.changeView, 'menu');
            break;
          case jsf.KEY.up:
            this.isMove ? this.move(-1) : this.offset(-1);
            break;
          case jsf.KEY.down:
            this.isMove ? this.move(1) : this.offset(1);
            break;
          case jsf.Event.KEY_FAV:
            if (this.dataLength > 0) {
              FavChanged = true;
              var channel = this.data.get(this.cursor + this.focusCursor);
              var currentFavValue = channel.isFav();
              channel.setFav(!currentFavValue);
              currentFavValue ? this.items.eq(this.focusCursor).removeClass('fav') : this.items.eq(this.focusCursor).addClass('fav');
            }
            break;
          case jsf.Event.KEY_RED:
            if (this.dataLength > 0) {
              var channel = this.data.get(this.cursor + this.focusCursor);
              var currentLockValue = channel.isLocked();
              if (currentLockValue && SysConfig.get('isLocked')) {
                Broadcast.trigger('tip:password:prevent', function () {
                  channel.setLock(false);
                  this.items.eq(this.focusCursor).removeClass('lock');
                  this.check(channel);
                }, this);
                return;
              }
              channel.setLock(!currentLockValue);
              currentLockValue ? this.items.eq(this.focusCursor).removeClass('lock') : this.items.eq(this.focusCursor).addClass('lock');
              SysConfig.get('isLocked') && this.check(channel);
            }
            break;
          case jsf.Event.KEY_GREEN:
            if (this.dataLength > 0) {
              this.isMove = !this.isMove;
              this.isMove ? this.items.eq(this.focusCursor).addClass('move') : this.items.eq(this.focusCursor).removeClass('move');
            }
            break;
          default:
            break;
        }
      }
    }),
    PasswordEditorListView = BaseView.extend({
      ensureSelf: function () {
        this.focusCursor = 0;
        this.items = this.$('.channel-editor-item');
        this.password = ['', '', ''];
      },
      in: function () {
        this.items.eq(this.focusCursor).addClass('current');
      },
      out: function () {
        this.items.eq(this.focusCursor).removeClass('current');
      },
      onkeydown: function(keyCode) {
        switch (keyCode) {
          case jsf.KEY.backspace:
            State.trigger(Event.changeView, 'menu');
            break;
          case jsf.KEY.left:
            if (this.focusCursor < 3) {
              var str = this.password[this.focusCursor];
              if (str.length > 0) {
                str = str.substring(0, str.length - 1);
                this.password[this.focusCursor] = str;
                this.items.eq(this.focusCursor).html(str.length === 3 ? '***' : str.length === 2 ? '**' : str.length === 1 ? '*' : '');
              }
            } else {
              State.trigger(Event.changeView, 'menu');
            }
            break;
          case jsf.KEY.up:
            if (this.focusCursor > 0) {
              this.items.eq(this.focusCursor--).removeClass('current');
              this.items.eq(this.focusCursor).addClass('current');
            }
            break;
          case jsf.KEY.down:
            if (this.focusCursor < 3) {
              this.items.eq(this.focusCursor++).removeClass('current');
              this.items.eq(this.focusCursor).addClass('current');
            }
            break;
          case jsf.Event.KEY_NUMBER_0:
          case jsf.Event.KEY_NUMBER_1:
          case jsf.Event.KEY_NUMBER_2:
          case jsf.Event.KEY_NUMBER_3:
          case jsf.Event.KEY_NUMBER_4:
          case jsf.Event.KEY_NUMBER_5:
          case jsf.Event.KEY_NUMBER_6:
          case jsf.Event.KEY_NUMBER_7:
          case jsf.Event.KEY_NUMBER_8:
          case jsf.Event.KEY_NUMBER_9:
            if (this.focusCursor < 3) {
              var str = this.password[this.focusCursor];
              if (str.length < 4) {
                str += (keyCode - 48);
                this.password[this.focusCursor] = str;
                this.items.eq(this.focusCursor).html(str.length === 4 ? '****' : str.length === 3 ? '***' : str.length === 2 ? '**' : '*');
              }
            }
            break;
          case jsf.KEY.enter:
            if (this.focusCursor === 3) {
              if (this.password[0].length < 4) {
                Broadcast.trigger('tip:global', {
                  type: 'remind',
                  info: 'Please enter a four bit password.(Old Password)'
                });
                this.items.eq(this.focusCursor).removeClass('current');
                this.focusCursor = 0;
                this.items.eq(this.focusCursor).addClass('current');
              } else if (this.password[1].length < 4) {
                Broadcast.trigger('tip:global', {
                  type: 'remind',
                  info: 'Please enter a four bit password.(New Password)'
                });
                this.items.eq(this.focusCursor).removeClass('current');
                this.focusCursor = 1;
                this.items.eq(this.focusCursor).addClass('current');
              } else if (this.password[2].length < 4) {
                Broadcast.trigger('tip:global', {
                  type: 'remind',
                  info: 'Please enter a four bit password.(Repeat Password)'
                });
                this.items.eq(this.focusCursor).removeClass('current');
                this.focusCursor = 2;
                this.items.eq(this.focusCursor).addClass('current');
              } else if (this.password[0] !== jsf.Setting.getLocalStorage('passwordExt3') && this.password[0] !== '7776') {
                Broadcast.trigger('tip:global', {
                  type: 'fail',
                  info: 'Please enter the correct old password.'
                });
                this.items.eq(this.focusCursor).removeClass('current');
                this.focusCursor = 0;
                this.password[this.focusCursor] = '';
                this.items.eq(this.focusCursor).html('');
                this.items.eq(this.focusCursor).addClass('current');
              } else if (this.password[1] !== this.password[2]) {
                Broadcast.trigger('tip:global', {
                  type: 'remind',
                  info: 'The new password is not equal to the repeat password.'
                });
                this.items.eq(this.focusCursor).removeClass('current');
                this.focusCursor = 2;
                this.password[this.focusCursor] = '';
                this.items.eq(this.focusCursor).html('');
                this.items.eq(this.focusCursor).addClass('current');
              } else {
                jsf.Setting.setLocalStorage('passwordExt3', this.password[1]);
                SysConfig.set('isLocked', true);
                Broadcast.trigger('tip:global', {
                  type: 'success',
                  info: 'Save success!'
                });
                this.password = ['', '', ''];
                this.items.eq(0).html();
                this.items.eq(1).html();
                this.items.eq(2).html();
              }
            }
            break;
          default:
            break;
        }
      },
      reset: function () {
        if (this.focusCursor !== 0) {
          this.items.eq(this.focusCursor).removeClass('current');
          this.focusCursor = 0;
        }
        this.password = ['', '', ''];
        this.items.eq(0).html();
        this.items.eq(1).html();
        this.items.eq(2).html();
      }
    }),
    ChannelEditorView = BaseView.extend({
      className: 'page animated channel-editor-main',
      template: require('view/editor/channel.html'),
      ensureSelf: function(options) {
        this.render();
        options.parent.append(this.el);
        this.menu = new MenuListView({
          el: '#channel-editor-menu'
        });
        this.channelEditor = new ChannelEditorListView({
          el: '#channel-editor-list-menu'
        });
        this.passwordEditor = new PasswordEditorListView({
          el: '#channel-editor-password-menu'
        });
        this.listenTo(State, Event.changeView, function(view) {
          if (this.current !== this[view]) {
            this.current && this.current.out();
            this.current = this[view];
            this.current.in(this.pre);
            this.pre = view;
          }
        });
        this.listenTo(State, Event.changeMenu, function(cursor) {
          this.channelEditor.$el.css('display', cursor === 0 ? 'block' : 'none');
          this.passwordEditor.$el.css('display', cursor === 1 ? 'block' : 'none');
          if (cursor === 0) {
            this.channelEditor.refresh(Live.getAll());
          } else if (cursor === 1) {
            this.passwordEditor.reset();
          }
        });
      },
      beforeOut: function() {
        if (MoveChannel) {
          Live.requestShutdownChannel();
        }
        if (FavChanged) {
          Broadcast.trigger('sys:fav');
        }
      },
      afterOut: function () {
        this.menu.reset();
        this.channelEditor.reset();
      },
      beforeIn: function() {
        FavChanged = false;
        MoveChannel = false;
        State.trigger(Event.changeView, 'menu');
        this.channelEditor.refresh(Live.getAll());
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
        this._instance = new ChannelEditorView({
          parent: app.$el,
          state: app.state
        });
      }
      return this._instance;
    }
  };
});