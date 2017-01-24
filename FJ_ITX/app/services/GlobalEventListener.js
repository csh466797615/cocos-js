/**
 * GlobalEventListener
 * @authors Casper
 * @date    2015/07/14
 * @version 1.0.0
 */
define(['view/common/volumebar.html'], function (require, exports, module) {
    var Broadcast = require('service/Broadcast'),
        Timer = require('service/Timer'),
        Live = require('service/Live'),
        Rec = require('service/Rec'),
        Local = require('service/Local'),
        Transform = require('service/Transform'),
        Media = require('service/Media'),
        SysConfig = require('service/SysConfig');

    var TipManager = {
        confirmVisible: false,
        get: function (type) {
            switch (type) {
                case 'global':
                    return this.global ? this.global : (this.global = new (require('component/TipView').extend({
                        className: 'animated global-tip-box',
                        ensureSelf: function () {
                            this.$el.append('<div class="global-tip"><div><div></div><div><span></span></div></div></div>');
                            var children = this.$el.find('div>div>div');
                            this.type = children.eq(0)[0];
                            this.info = children.eq(1).find('span');
                            require('module/app').$el.after(this.el);
                        },
                        _show: function (info, duration) {
                            this.type.className = info.type || 'remind';
                            this.duration = duration;
                            this.info.html(info.info);
                        }
                    })));
                case 'confirm':
                    return this.confirm ? this.confirm : (this.confirm = new (require('component/TipView').extend({
                        className: 'animated confirm-tip-box',
                        ensureSelf: function () {
                            this.$el.append('<div class="confirm-tip"><div><div><div>Reminder</div><span></span></div><div class="current"></div><div></div></div></div>');
                            var children = this.$el.find('div>div>div');
                            this.info = children.eq(0).find('span');
                            this.button = [children.eq(2)[0], children.eq(3)[0]];
                            this.index = 0;
                            this.hideBySelf = false;
                            require('module/app').$el.after(this.el);
                            Broadcast.on('page:change', function () {
                                !this.preventGlobal && this._out();
                            }, this);
                            var self = this;
                            jsf.eventManager.addListener({
                                event: jsf.EventListener.KEYBOARD,
                                onKeyDown: function (keyCode, event) {
                                    if (self.hide) return;
                                    switch (keyCode) {
                                        case jsf.Event.KEY_LEFT:
                                        case jsf.Event.KEY_RIGHT:
                                            self.button[self.index].classList.remove('current');
                                            self.index = self.index === 0 ? 1 : 0;
                                            self.button[self.index].classList.add('current');
                                            break;
                                        case jsf.Event.KEY_BACK:
                                            self._out();
                                            break;
                                        case jsf.Event.KEY_ENTER:
                                            self._out();
                                            if (self.index === 0) {
                                                self.callback && self.callback.apply(self.callbackContext);
                                            }
                                            break;
                                        default:
                                            break;
                                    }
                                    event.stopPropagation();
                                }
                            }, Priority.CONFIRM_KEYBOARD);
                        },
                        beforeIn: function () {
                            if (this.index !== 0) {
                                this.button[this.index].classList.remove('current');
                                this.index = 0;
                                this.button[this.index].classList.add('current');
                            }
                        },
                        _show: function (info, callback, callbackContext, prevent) {
                            this.callback = callback;
                            this.callbackContext = callbackContext;
                            this.info.html(info);
                            this.preventGlobal = !!prevent;
                            this.preventGlobal && Broadcast.trigger('key:prevent:global', this.preventGlobal);
                        },
                        _hideByUser: function (needCallback) {
                            this._out();
                            needCallback && this.callback.apply(this.callbackContext);
                        },
                        _out: function () {
                            this.preventGlobal && Broadcast.trigger('key:prevent:global', false);
                            this.preventGlobal = false;
                            this.out();
                        }
                    })));
                case 'static':
                    return this.static ? this.static : (this.static = new (Backbone.View.extend({
                        el: '#static-tip',
                        initialize: function () {
                            this.txt = this.$('#static-tip-msg');
                            this.isDisplay = false;
                            // Broadcast.on('page:change', this.hide, this);
                        },
                        show: function () {
                            if (!this.isDisplay) {
                                this.isDisplay = true;
                                this.txt.html() !== '' && this.$el.css('display', 'block');
                            }
                        },
                        hide: function () {
                            if (this.isDisplay) {
                                this.isDisplay = false;
                                this.$el.css('display', 'none');
                            }
                        },
                        info: function (info) {
                            this.txt.html(info || '');
                            if (this.isDisplay) {
                                if (info) {
                                    this.$el.css('display', 'block');
                                } else {
                                    this.$el.css('display', 'none');
                                }
                            }
                        }
                    })));
                case 'rec':
                    return this.rec ? this.rec : (this.rec = new (Backbone.View.extend({
                        className: 'rec-status',
                        initialize: function () {
                            require('module/app').$el.after(this.el);
                            this.$el.append('<div>Recording</div><div class="rec-status-icon"></div><div class="rec-status-tip"></div>');
                            this.icon = this.$('.rec-status-icon');
                            this.txt = this.$('.rec-status-tip');
                            this.isDisplay = false;
                            this.timer = Timer.get();
                            this.flag = false;
                            this.isRecing = Rec.getRecording().length > 0;
                            this.isRecording && this._startCount();
                            Broadcast.on('event:pvr', this.callback, this);
                            Broadcast.on('page:change', this.hide, this);
                        },
                        show: function () {
                            if (!this.isDisplay) {
                                this.isDisplay = true;
                            }
                        },
                        _startCount: function () {
                            this.txt.html('00:00:00');
                            this.time = 0;
                            this.timer.setInterval(function () {
                                this.flag = !this.flag;
                                this.icon.css('display', this.flag ? 'block' : 'none');
                                this.time++;
                                this.txt.html(this._changeTime(this.time));
                            }, 1000, false, this);
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
                        hide: function () {
                            if (this.isDisplay) {
                                this.isDisplay = false;
                                this.$el.css('display', 'none');
                            }
                        },
                        check: function () {
                            if (this.isRecing) {
                                this.$el.css('display', Rec.isRecording(Live.getCurrentChannel()) && this.isDisplay ? 'block' : 'none');
                            }
                        },
                        callback: function (eventName) {
                            switch (eventName) {
                                case jsf.EventSystem.PVR_REC_START_OK:
                                    this.isRecing = true;
                                    this._startCount();
                                    this.check();
                                    break;
                                case jsf.EventSystem.PVR_REC_STOP_OK:
                                case jsf.EventSystem.PVR_REC_ERROR:
                                case jsf.EventSystem.PVR_REC_DISKFULL:
                                case jsf.EventSystem.PVR_BUY_SPACE_FULL:
                                    this.time = -1;
                                    this.timer.clear();
                                    this.isRecing = false;
                                    this.$el.css('display', 'none');
                                    break;
                                default:
                                    return;
                            }
                        }
                    })));
                case 'setter':
                    return this.setter ? this.setter : (this.setter = new (Backbone.View.extend({
                        className: 'setter-page',
                        initialize: function (options) {
                            this.render();
                            this.data = [];
                            this.values = [];
                            this.dataLength = 0;
                            this.cursor = 0;
                            this.title = this.$('.setter-page-title');
                            this.box = this.$('.setter-page-list-box');
                            this.lineHeight = 40;
                            this.isDisplay = false;
                            require('module/app').$el.after(this.el);
                            Broadcast.on('page:change', this.hide, this);
                            var self = this;
                            jsf.eventManager.addListener({
                                event: jsf.EventListener.KEYBOARD,
                                onKeyDown: function (keyCode, event) {
                                    if (!self.isDisplay) return;
                                    switch (keyCode) {
                                        case jsf.Event.KEY_UP:
                                            self.offset(-1);
                                            break;
                                        case jsf.Event.KEY_DOWN:
                                            self.offset(1);
                                            break;
                                        case jsf.Event.KEY_ENTER:
                                            self.callback && self.callback(self.data[self.cursor], self.cursor);
                                            self.hide();
                                            break;
                                        case jsf.Event.KEY_BACK:
                                            self.hide();
                                            break;
                                        default:
                                            break;
                                    }
                                    event.stopPropagation();
                                }
                            }, Priority.SETTER_KEYBOARD);
                        },
                        show: function (title, callback, cursor, data, values) {
                            this.isDisplay = true;
                            this.title.html(title);
                            this.cursor = cursor;
                            this.data = data;
                            this.callback = callback;
                            this.$el.css('display', 'block');
                            this.dataLength = this.data.length;
                            var html = '';
                            var txt;
                            for (var i = 0; i < this.dataLength; i++) {
                                txt = values ? values[i] : this.data[i].name;
                                if (i === cursor) {
                                    html += '<div class="current">' + txt + '</div>';
                                } else {
                                    html += '<div>' + txt + '</div>';
                                }
                            }
                            this.box.html('<div class="setter-page-list" style="top:' + (160 - cursor * 40) + 'px">' + html + '</div>');
                            this.list = this.box.find('div');
                            this.items = this.list.find('div');
                        },
                        hide: function () {
                            this.isDisplay = false;
                            this.data = [];
                            this.callback = null;
                            this.title.html('');
                            this.list.html('');
                            this.$el.css('display', 'none');
                        },
                        offset: function (offset) {
                            var next = this.cursor + offset;
                            if (next >= 0 && next < this.dataLength) {
                                this.items.eq(this.cursor).removeClass('current');
                                this.cursor = next;
                                this.items.eq(next).addClass('current');
                                this.list.css('top', (160 - next * 40) + 'px');
                            }
                        },
                        render: function () {
                            this.$el.html('<div class="setter-page-title"></div><div class="setter-page-list-box"></div>');
                            return true;
                        }
                    })));
                case 'password':
                    return this.password ? this.password : (this.password = new (Backbone.View.extend({
                        el: '#password',
                        initialize: function () {
                            this.box = this.$('#password-box');
                            this.error = this.$('#password-error');
                            this.ok_btn = this.$('#password-ok');
                            this.cancel_btn = this.$('#password-cancel');
                            this.isFocusOnOk = true;
                            this.password = '';
                            this.isDisplay = false;
                            this.callback = null;
                            this.callbackContext = null;
                            this.prevent = false;
                            Broadcast.on('page:change', this.hide, this);
                            var self = this;
                            jsf.eventManager.addListener({
                                event: jsf.EventListener.KEYBOARD,
                                onKeyDown: function (keyCode, event) {
                                    if (!self.isDisplay) return;
                                    var isStop = true;
                                    switch (keyCode) {
                                        case jsf.Event.KEY_LEFT:
                                        case jsf.Event.KEY_RIGHT:
                                           self.changBtnFocus();
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
                                            if (self.password.length < 4) {
                                                self.error.html('');
                                                self.password += (keyCode - 48);
                                                var length = self.password.length;
                                                self.box.html(length === 4 ? '****' : length === 3 ? '***' : length === 2 ? '**' : '*');

                                            }else if(self.password.length === 4){
                                               self.password = '';
                                               self.password += keyCode - 48;
                                               self.box.html('*');
                                            }
                                            break;
                                        case jsf.Event.KEY_ENTER:
                                            if(self.isFocusOnOk){
                                               self.check();
                                               //self.password.length > 0 ? self.check() : (isStop = true);
                                            }else{
                                              self.hide();
                                            }
                                            break;
                                        case jsf.Event.KEY_BACK:
                                            if (self.prevent) {
                                                self.hide();
                                            } else {
                                                isStop = false;
                                            }
                                            break;
                                        default:
                                            isStop = false;
                                            break;
                                    }
                                    (isStop || self.prevent) && event.stopPropagation();
                                }
                            }, Priority.PASSWORD_KEYBOARD);
                        },
                        changBtnFocus:function () {
                          if(this.isFocusOnOk){
                            this.ok_btn.removeClass('password-btn-focus');
                            this.cancel_btn.addClass('password-btn-focus');
                            this.isFocusOnOk = false;
                          }else{
                            this.ok_btn.addClass('password-btn-focus');
                            this.cancel_btn.removeClass('password-btn-focus');
                            this.isFocusOnOk = true;
                          }
                        },
                        check: function () {
                            if (this.password.length != 0 && (this.password === jsf.Setting.getLocalStorage('passwordExt3') || this.password === '7776')) {
                                SysConfig.set('isLocked', false);
                                this.callback && this.callback.apply(this.callbackContext);
                                this.hide();
                            } else {
                                this.error.html('密码输入错误!');
                                this.box.html('');
                                this.password = '';
                            }
                        },
                        show: function (callback, callbackContext, prevent) {
                            if (!this.isDisplay) {
                                this.isDisplay = true;
                                this.$el.css('display', 'block');
                            }
                            this.callback = callback;
                            this.callbackContext = callbackContext;
                            this.prevent = !!prevent;
                        },
                        hide: function () {
                            if (this.isDisplay) {
                                this.isDisplay = false;
                                this.error.html('');
                                this.box.html('');
                                this.password = '';
                                this.callback = null;
                                this.callbackContext = null;
                                this.isFocusOnOk = false;
                                this.changBtnFocus();
                                this.$el.css('display', 'none');
                            }
                        }
                    })));
                case 'extral':
                    return this.extral ? this.extral : (this.extral = new (require('component/BaseView').extend({
                        className: 'extral animated',
                        ensureSelf: function () {
                            this.$el.append('<div class="extral-time-date"><div class="extral-time"></div><div class="extral-date"></div></div><!--<div class="extral-weather"></div>--><!--<div class="extral-state"><div class="extral-net"></div><div class="extral-usb"></div></div><div class="extral-search"></div>-->');
                            this.time = this.$('.extral-time'),
                                this.date = this.$('.extral-date');
                            /*this.state = this.$('.extral-state');
                             this.net = this.$('.extral-net');
                             this.usb = this.$('.extral-usb');*/
                            require('module/app').$el.after(this.el);
                            this.visible = false;
                            var network = jsf.NetworkManager.getEthernet();
                            /* if (network) {
                             this.net.css('background-image', network.plugStatus === jsf.Network.PHY_CONNECT ? 'url(./app/images/extral/net-connect.png)' : 'url(./app/images/extral/net-disconnect.png)');
                             } else {
                             this.net.css('background-image', 'url(./app/images/extral/net-disconnect.png)');
                             }
                             this.usb.css({
                             'background-image': 'url(./app/images/extral/usb.png)',
                             'visibility': Local.getDevices().length > 0 ? 'visible' : 'hidden'
                             });*/
                            /*Broadcast.on('event:net', function(eventName, data) {
                             switch (eventName) {
                             case jsf.EventSystem.NETWORK_CONNECT_PLUGIN:
                             this.net.css('background-image', 'url(./app/images/extral/net-connect.png)');
                             break;
                             case jsf.EventSystem.NETWORK_CONNECT_PLUGOUT:
                             this.net.css('background-image', 'url(./app/images/extral/net-disconnect.png)');
                             break;
                             }
                             }, this);
                             Broadcast.on('event:usb', function(eventName, data) {
                             this.usb.css('visibility', Local.getDevices().length > 0 ? 'visible' : 'hidden');
                             }, this);*/
                        },
                        beforeIn: function (options) {
                            // this.net.css('display', options && options.net ? 'block' : 'none');
                            //this.usb.css('display', options && options.usb ? 'block' : 'none');
                            //options && options.usb && this.usb.css('visibility', Local.getDevices().length > 0 ? 'visible' : 'hidden');
                            //this.state.css('display', options && (options.net || options.usb) ? 'block' : 'none');
                            if (!this.visible) {
                                this.visible = true;
                                this.timing();
                                var self = this;
                                this.timer = setInterval(function () {
                                    self.timing();
                                }, 1000);
                            }
                        },
                        beforeOut: function () {
                            if (this.visible) {
                                this.visible = false;
                                clearInterval(this.timer);
                            }
                        },
                        timing: function () {
                            var now = new Date();
                            // this.time.html(Transform.date(now, 'hh:mm:ss'));
                            this.date.html(Transform.date(now, 'yyyy/MM/dd') + '  ' + Transform.date(now, 'hh:mm:ss'));
                        }
                    })));
                case 'volume':
                    return this.volume ? this.volume : (this.volume = new (require('component/BaseView').extend({
                        ensureSelf: function () {
                          this.positions = [58, 86, 115, 143, 172, 200, 229, 257, 286, 314, 343, 371, 400, 428, 457, 485, 514, 542, 571, 599, 623];
                          this.isShow = false;
                            this.isMuteShow = false;
                            this._volume = Media.getVolume();
                            this._maxVolume = 32,
                                this._offsetDis = 5,
                                this._showTimer = -1,
                                this.$el.html(require('view/common/volumebar.html'));
                            require('module/app').$el.after(this.el);
                            this._volume === 31 && (this._volume = 32);
                            this.volumeBar = this.$('#global_volumebar');
                            this.mute = this.$('#global_mute');
                            this.progress = this.$('#global_volume_mid');
                            this.progressPoint = this.$('#global_volume_point');
                            this.volumeEl = this.$('#volume_num');
                        },
                        _showProgress: function () {
                            var value = this.positions[Math.ceil(this._volume * 3 / 5)];
                            this.progress.css('width', (value - 43) + 'px');
                            this.progressPoint.css('left', value + 55 + 'px');
                        },
                        show: function () {
                            if (!this.isShow) {
                                this.volumeBar.css('display', 'block');
                                this.isShow = true;
                            }
                            this._showTimer !== -1 && clearTimeout(this._showTimer);
                            var that = this;
                            this._showTimer = setTimeout(function () {
                                that.hide();
                            }, 3000);
                        },
                        hide: function () {
                            if (this.isShow) {
                                this.volumeBar.css('display', 'none');
                                this.isShow = false;
                                if (this._showTimer !== -1) {
                                    clearTimeout(this._showTimer);
                                    this._showTimer = -1;
                                }
                            }
                        },
                        change: function (_upDown) {
                            this.isMuteShow && this.setMuteHide(true);
                            var next = this._volume + _upDown / this._offsetDis;
                            var pre = Math.ceil(this._volume * 3 / 5);
                            while (next >= 0 && next <= this._maxVolume && Math.ceil(next * 3 / 5) === pre) {
                                next += _upDown / this._offsetDis;
                            }
                            if (next > this._maxVolume) {
                                next = this._maxVolume;
                            } else if (next < 0) {
                                next = 0;
                            }
                            this._volume = next;
                            this.volumeEl.html(Math.ceil(this._volume * 3 / 5) * 5);
                            this._showProgress();
                            this.show();
                            Broadcast.trigger('media:volume', this.getRealVolume());
                            jsf.SysInfo.set('currentVolume', this.getRealVolume());
                        },
                        getRealVolume: function () {
                            return this._volume === 32 ? 31 : this._volume;
                        },
                        setMuteShow: function () {
                            this.isMuteShow = true;
                            this.progress.css('width', '0px');
                            this.progressPoint.css('left', this.positions[0] + 55 + 'px');
                            this.volumeEl.html('0');
                            this.mute.css('display', 'block');
                            Broadcast.trigger('media:volume', 0);
                        },
                        setMuteHide: function (unrefresh) {
                            this.isMuteShow = false;
                            this.mute.css('display', 'none');
                            if (!unrefresh) {
                                this._showProgress();
                                Broadcast.trigger('media:volume', this.getRealVolume());
                            }
                        },
                        toggleMute: function () {
                            this.isMuteShow ? this.setMuteHide() : this.setMuteShow();
                        }
                    })));
                default:
                    return {
                        show: function () {
                            jsf.log.e('error tip');
                        }
                    };
            }
        }
    };

    var preventKeyAll = true;
    var preventKeyPage = false;
    var preventKeyGlobal = false;
    var preventKeyPrivate = false;
    var preventKey = false;
    jsf.eventManager.addListener({
        event: jsf.EventListener.KEYBOARD,
        onKeyDown: function (keyCode, event) {
            if (preventKeyAll) {
                event.stopPropagation();
                return;
            }
            var isPrevent = false;
            if (!preventKeyGlobal) {
                isPrevent = true;
                switch (keyCode) {
                    case jsf.Event.KEY_HOME:
                        if (!preventKeyPage) {
                            Broadcast.trigger('media:stop', 'media');
                            Broadcast.trigger('media:position', 795, 272, 0, 427, 325);
                            Broadcast.trigger('media:play','portal');
                            Broadcast.trigger('page:to', 'home');
                        } else {
                            isPrevent = false;
                        }
                        break;
                    case jsf.Event.KEY_EXIT:
                        if (!preventKeyPage) {
                            Broadcast.trigger('media:stop', 'portal');
                            Broadcast.trigger('media:position', 0, 0, 0, 1280, 720);
                            Broadcast.trigger('page:to', 'live-live');
                            Broadcast.trigger('media:play');
                        } else {
                            isPrevent = false;
                        }
                        break;
                    case jsf.Event.KEY_VOLUME_UP:
                        Broadcast.trigger('volume:offset', 5);
                        break;
                    case jsf.Event.KEY_VOLUME_DOWN:
                        Broadcast.trigger('volume:offset', -5);
                        break;
                    case jsf.Event.KEY_MUTE:
                        Broadcast.trigger('volume:mute');
                        break;
                    default:
                        isPrevent = false;
                        break;
                }
            }
            isPrevent && event.stopPropagation();
        }
    }, Priority.GLOBAL_KEYBOARD);
    jsf.eventManager.addListener({
        event: jsf.EventListener.KEYBOARD,
        onKeyDown: function (keyCode, event) {
            var isPrevent = true;
            if (preventKeyPrivate) {
                isPrevent = false;
            } else {
                Broadcast.trigger('key:press', keyCode);
            }
            isPrevent && event.stopPropagation();
        }
    }, Priority.KEYBOARD);
    Broadcast.on('prevent:all', function (boolean) {
        preventKeyAll = boolean;
    });
    Broadcast.on('key:prevent:page', function (boolean) {
        preventKeyPage = boolean;
    });
    Broadcast.on('key:prevent:global', function (boolean) {
        preventKeyGlobal = boolean;
    });
    Broadcast.on('key:prevent:private', function (boolean) {
        preventKeyPrivate = boolean;
    });
    Broadcast.on('key:prevent', function (boolean) {
        preventKey = boolean;
    });
    Broadcast.on('tip:global', function (info, duration) {
        !preventKeyAll && TipManager.get('global').show(info, duration);
    });
    Broadcast.on('tip:confirm', function (info, callback, callbackContext) {
        !preventKeyAll && TipManager.get('confirm').show(info, callback, callbackContext);
    });
    Broadcast.on('tip:confirm:prevent', function (info, callback, callbackContext) {
        !preventKeyAll && TipManager.get('confirm').show(info, callback, callbackContext, true);
    });
    Broadcast.on('tip:confirm:hide', function (useCallback) {
        TipManager.get('confirm')._hideByUser(useCallback);
    });
    Broadcast.on('tip:static', function (info) {
        TipManager.get('static').info(info);
    });
    Broadcast.on('tip:static:show', function () {
        TipManager.get('static').show();
    });
    Broadcast.on('tip:static:hide', function () {
        TipManager.get('static').hide();
    });
    Broadcast.on('tip:setter:show', function (title, callback, cursor, data, values) {
        TipManager.get('setter').show(title, callback, cursor, data, values);
    });
    Broadcast.on('tip:rec:show', function () {
        TipManager.get('rec').show();
    });
    Broadcast.on('tip:rec:hide', function () {
        TipManager.get('rec').hide();
    });
    Broadcast.on('tip:rec:check', function () {
        TipManager.get('rec').check();
    });
    Broadcast.on('tip:rec:init', function () {
        TipManager.get('rec');
    });
    Broadcast.on('tip:password', function (callback, callbackContext) {
        TipManager.get('password').show(callback, callbackContext, false);
    });
    Broadcast.on('tip:password:prevent', function (callback, callbackContext) {
        TipManager.get('password').show(callback, callbackContext, true);
    });
    Broadcast.on('tip:password:hide', function () {
        TipManager.get('password').hide();
    });
    Broadcast.on('extral:show', function (options) {
        TipManager.get('extral').in(options, true);
    });
    Broadcast.on('extral:hide', function () {
        TipManager.get('extral').out(true);
    });
    Broadcast.on('extral:focus', function () {
        TipManager.get('extral').focus();
    });
    Broadcast.on('extral:blur', function () {
        TipManager.get('extral').blur();
    });
    Broadcast.on('timeshift:start', function () {
        var channel = Media.getPlayingChannel();
        if (channel && !TipManager.get('static').txt.html() && (!channel.isLocked() || !SysConfig.get('isLocked')) && channel.type !== jsf.Channel.TYPE_RADIO) {
            Rec.startTimeShift(channel);
        }
    });
    Broadcast.on('timeshift:play', function () {
        var channel = Media.getPlayingChannel();
        if (!channel) return;
        if (channel.isLocked() && SysConfig.get('isLocked')) {
            TipManager.get('global').show({
                type: 'remind',
                info: 'Please unlock the channel first.'
            });
        } else if (channel.type === jsf.Channel.TYPE_RADIO) {
            TipManager.get('global').show({
                type: 'remind',
                info: 'Audio does not support this feature.'
            });
        } else if (TipManager.get('static').txt.html()) {
            TipManager.get('global').show({
                type: 'remind',
                info: 'Does not support this feature, when no signal or the current channel is abnormal.'
            });
        } else {
            var result;
            if ((result = Rec.checkConditional(true)).code !== Rec.CHECK_PASS) {
                Broadcast.trigger('tip:global', {
                    type: 'remind',
                    info: result.info
                }, 3000);
                return;
            } else {
                Broadcast.trigger('page:to', 'live-timeshift', {
                    position: new Date()
                });
            }
        }
    });
    Broadcast.on('volume:offset', function (offset) {
        TipManager.get('volume').change(offset);
    });
    Broadcast.on('volume:mute', function () {
        TipManager.get('volume').toggleMute();
    });
    Broadcast.on('volume:hide', function () {
        TipManager.get('volume').hide();
    });
});