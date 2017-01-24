/**
 * live.js
 * @authors Casper
 * @date    2016/07/22
 * @version 1.0.0
 */
define(['view/live/live.html', 'view/live/pf.html', 'view/live/pf-bar.html', 'view/live/list.html'], function (require, exports, module) {
    var Live = require('service/Live'),
        Rec = require('service/Rec'),
        Transform = require('service/Transform'),
        Timer = require('service/Timer'),
        Broadcast = require('service/Broadcast'),
        SysConfig = require('service/SysConfig'),
        Media = require('service/Media'),
        Event = {
            pageChanged: 'page_changed',
            checkChannelStatus: 'check_channel_status'
        };
    var BaseView = require('component/BaseView'),
        ListView = require('component/ListView');
    var ListGroupView = BaseView.extend({
            ensureSelf: function (options) {
                this.items = this.$('>div');
                this.max = 20;
                this.cursor = 0;
                this.focusCursor = 0;
                this.dataLength = 0;
                this.data = [];
            },
            showData: function () {
                for (var i = 0; i < this.max; i++) {
                    this.items.eq(i).html(this.data[this.cursor + i] ? this.data[this.cursor + i].name : '');
                }
            },
            refresh: function (data, index) {
                this.data = data;
                this.dataLength = this.data.length;
                this.dataIndex = index ? index : 0;
                this.cursor = index ? index : 0;
                if (this.focusCursor !== 0) {
                    this.items.eq(this.focusCursor).removeClass('current');
                    this.focusCursor = 0;
                    this.items.eq(this.focusCursor).addClass('current');
                }
                this.showData();
            },
            offset: function (offset, force) {
                if (this.dataLength < 2) return;
                this.dataIndex = (this.dataIndex + offset + this.dataLength) % this.dataLength;
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
                    (force || this.dataLength >= this.max) && this.showData();
                } else if (next >= min) {
                    if (this.cursor + this.focusCursor === this.dataLength - 1) {
                        this.cursor = 0;
                        this.focusCursor = 0;
                        (force || this.dataLength >= this.max) && this.showData();
                    } else {
                        this.cursor++;
                        this.showData();
                    }
                } else {
                    this.focusCursor = next;
                    if (this.cursor + this.focusCursor > this.dataLength - 1) {
                        this.cursor = 0;
                        this.focusCursor = 0;
                        (force || this.dataLength >= this.max) && this.showData();
                    }
                    force && this.showData();
                }
                this.items.eq(this.focusCursor).addClass('current');
            }
        }),
        LiveListView = ListView.extend({
            template: require('view/live/list.html'),
            ensureSelf: function (options) {
                this.render();
                this.isCycle = false;
                this.timer = Timer.get();
                this.leaveTimer = Timer.get();
                this.scrollTimer = Timer.get();
                this.isScroll = false;
                this.max = 10;
                this.mid = 1;
                this.currentMid = 1;
                this.focusIndex = this.mid;
                this.minFocusIndex = this.mid;
                this.maxFocusIndex = this.max - 4;
                this.itemClass = 'live-item-';
                this.focus = this.$('#live-item-list-focus')[0];

                this.pipTimer = Timer.get();
                this.pip = this.$('#live-pip');
                this.pipChannelName = this.$('.live-pip-name-s');
                this.pipVisible = false;

                this.group = new ListGroupView({
                    el: '#live-group-list'
                });
                this.list = this.$('#live-channel-list');
                this.isMenuFocus = true;
            },
            _startScroll: function () {
                var self = this;
                this.scrollTimer.setTimeout(function () {
                    self._scroll();
                }, 400);
            },
            _unscroll: function () {
                this.scrollTimer.clear();
                if (!this.isScroll) return;
                this.isScroll = false;
                if (this.items[this.getCurrentFocusItemIndex()].needScrollName) {
                    this.items[this.getCurrentFocusItemIndex()].name.unwrap();
                }
                if (this.items[this.getCurrentFocusItemIndex()].needScrollP) {
                    this.items[this.getCurrentFocusItemIndex()].p.unwrap();
                }
            },
            _scroll: function () {
                if (this.items[this.getCurrentFocusItemIndex()].needScrollName) {
                    this.items[this.getCurrentFocusItemIndex()].name.wrap('<marquee></marquee>');
                    this.isScroll = true;
                }
                if (this.items[this.getCurrentFocusItemIndex()].needScrollP) {
                    this.items[this.getCurrentFocusItemIndex()].p.wrap('<marquee></marquee>');
                    this.isScroll = true;
                }
            },
            _prevent: function (keyCode) {
                switch (keyCode) {
                    case jsf.Event.KEY_UP:
                    case jsf.Event.KEY_DOWN:
                        if (this._preventKey) {
                            return true;
                        } else {
                            this._preventKey = true;
                            var self = this;
                            this.timer.setTimeout(function () {
                                self._preventKey = false;
                            }, 100);//200
                        }
                        return false;
                    default:
                        return false;
                }
            },
            refreshList: function () {
                var startItem = (this.currentMid - this.mid + this.max) % this.max;
                for (var i = 0; i < this.max; i++) {
                    this.showData((startItem + i) % this.max, this.index + (i - this.mid));
                }
            },
            getCurrentFocusItemIndex: function () {
                return (this.currentMid + (this.focusIndex - this.minFocusIndex)) % this.max;
            },
            addChannelListFocus: function () {
                this.items[this.getCurrentFocusItemIndex()].box[0].classList.add('current');
                if (this.dataLength > 0) {
                    var channel = this.channels.get(this.dataIndex);
                    if (channel !== Live.getCurrentChannel()) {
                        this.hidePIP();
                        var that = this;
                        this.pipTimer.setTimeout(function () {
                            that.showPIP(channel);
                        }, 1500);
                    }
                    jsf.EPG.requestPF(channel, (!channel.isLocked() || !SysConfig.get('isLocked')) && channel === Live.getCurrentChannel());
                }
            },
            refresh: function (list, cursor) {
                this.channels = list;
                this.dataLength = this.channels.length;
                this.dataIndex = cursor || 0;
                this.index = this.dataIndex;
                this.items[this.getCurrentFocusItemIndex()].box[0].classList.remove('current');
                var pageNum = this.maxFocusIndex - this.minFocusIndex + 1;
                if (this.dataLength > pageNum) {
                    if (this.dataIndex < pageNum) {
                        this.index = 0;
                        this.focusIndex = this.minFocusIndex + this.dataIndex;
                    } else if (this.dataIndex + pageNum >= this.dataLength) {
                        this.index = this.dataLength - pageNum;
                        this.focusIndex = this.dataIndex - this.index + this.minFocusIndex;
                    } else {
                        this.index = this.dataIndex;
                        this.focusIndex = this.minFocusIndex;
                    }
                } else {
                    this.index = 0;
                    this.focusIndex = this.minFocusIndex + this.dataIndex;
                }
                this.focus.className = this.itemClass + this.focusIndex;
                this.addChannelListFocus();
                this.cursor.css('display', this.dataLength <= this.maxFocusIndex ? 'none' : 'block');
                this.dataLength >= 2 && this.cursor.css('top', 250 * this.dataIndex / (this.dataLength - 1) + 'px');
                this.refreshList();
            },
            _offset: function (offset) {
                if (this.dataLength < 2) return;
                this._unscroll();
                this.dataIndex += offset;
                if (this.dataIndex < 0) {
                    this.dataIndex = 0;
                    this.items[this.getCurrentFocusItemIndex()].box[0].classList.remove('current');
                    this.dataIndex = this.dataLength - 1;
                    this.focusIndex = this.dataLength > this.maxFocusIndex ? this.maxFocusIndex : this.dataLength;
                    this.index = this.dataIndex - (this.focusIndex - this.minFocusIndex);
                    this.addChannelListFocus();
                    this.focus.className = this.itemClass + this.focusIndex;
                    this.dataLength > this.maxFocusIndex && this.refreshList();
                } else if (this.dataIndex >= this.dataLength) {
                    this.refresh(this.channels);
                } else {
                    this.items[this.getCurrentFocusItemIndex()].box[0].classList.remove('current');
                    if (offset < 0 && this.focusIndex === this.minFocusIndex || offset > 0 && this.focusIndex === this.maxFocusIndex) {
                        this.offset(offset);
                    } else {
                        this.focusIndex = (this.focusIndex + offset + this.max) % this.max;
                        this.focus.className = this.itemClass + this.focusIndex;
                    }
                    this.addChannelListFocus();
                }
                this._startScroll();
                this.cursor.css('top', 250 * this.dataIndex / (this.dataLength - 1) + 'px');
            },
            hidePIP: function () {
                this.pipTimer.clear();
                if (this.pipVisible) {
                    if (this.pipNeedScroll) {
                        this.pipChannelName.unwrap();
                        this.pipNeedScroll = false;
                    }
                    this.pipVisible = false;
                    this.pip.css('opacity', 0);
                    Broadcast.trigger('media:stop', 'pip');
                }
            },
            showPIP: function (channel) {
                if (!this.pipVisible) {
                    this.pipVisible = true;
                    this.pip.css('opacity', 1);
                    var name = channel._name;
                    this.pipChannelName.html(name);
                    this.pipNeedScroll = this.pipChannelName.width() > 245;
                    if (this.pipNeedScroll) {
                        this.pipChannelName.wrap('<marquee></marquee>');
                    }
                    Broadcast.trigger('media:pip', channel);
                }
            },

            getItem: function (itemIndex) {
                return this.items[itemIndex].box[0];
            },
            showData: function (itemIndex, index) {
                var channel = index >= 0 && index < this.dataLength ? this.channels.get(index) : null,
                    epg = null,
                    info = this.items[itemIndex];
                if (channel) {
                    info.num.html(Transform.number(channel.logicNumber, 3));
                    info.name.html(channel.name);
                    epg = Live.getNowEpg(channel);
                    info.p.html(epg ? epg.name : '');
                    channel.isFav() ? info.fav.addClass('fav') : info.fav.removeClass('fav');
                    channel.isLocked() ? info.lock.addClass('lock') : info.lock.removeClass('lock');
                    info.needScrollName = info.name.width() > 210;
                    info.needScrollP = info.p.width() > 260;
                } else {
                    info.num.html('');
                    info.name.html('');
                    info.p.html('');
                    info.fav.removeClass('fav');
                    info.lock.removeClass('lock');
                    info.needScrollName = false;
                    info.needScrollP = false;
                }
            },
            refreshPf: function (info) {
                if (this.dataLength > 0) {
                    var channel = this.channels.get(this.dataIndex);
                    if (info.frequency === channel.frequency && info.serviceId === channel.serviceId && info.tsId === channel.tsId) {
                        var item = this.items[this.getCurrentFocusItemIndex()];
                        var epg = Live.getNowEpg(channel);
                        var preNeed = item.needScrollP;
                        item.p.html(epg ? epg.name : '');
                        if (preNeed && this.isScroll) {
                            item.p.unwrap();
                        }
                        item.needScrollP = item.p.width() > 260;
                        if (item.needScrollP && !this.isMenuFocus) {
                            this.isScroll ? item.p.wrap('<marquee></marquee>') : this._startScroll();
                        }
                    }
                }
            },
            beforeOut: function () {
                this.hidePIP();
                this.pipTimer.clear();
                this.leaveTimer.clear();
                this.checkFav();
                if (this.dataLength > 0) {
                    var channel = this.channels.get(this.dataIndex),
                        current = Live.getCurrentChannel();
                    current && channel !== current && jsf.EPG.requestPF(current, (!current.isLocked() || !SysConfig.get('isLocked')));
                }
                !this.isMenuFocus && this._unscroll();
                Broadcast.off('epg:pf');
            },
            afterOut: function () {
                if (!this.isMenuFocus) {
                    this.group.$el.addClass('focus');
                    this.list.removeClass('focus');
                    this.isMenuFocus = true;
                }
                this.dataLength > 0 && this.refresh([]);
            },
            beforeIn: function () {
                this._preventKey = false;
                this.group.refresh(Live.getGroups());
                this.showList(this.group.data[this.group.dataIndex].list, Live.getCurrentChannelIndex());
                if (this.dataLength === 0) {
                    this.number.html('');
                } else {
                    //this.number.html(Transform.number(this.channels.get(this.dataIndex).logicNumber, 3));
                    this.number.html('');
                    Broadcast.on('epg:pf', this.refreshPf, this);
                }
            },
            afterIn: function (index) {
                if (index) {
                    this.group.refresh(Live.getGroups(), index);
                    this.showList(this.group.data[this.group.dataIndex].list);
                }
                this._blueMenu();
                this._timing();
            },
            showList: function (group, cursor) {
                this.refresh(group, cursor);
                if (this.dataLength === 0) {
                    this.items[this.currentMid].name.html('没有频道列表!');
                }
            },
            render: function () {
                this.$el.html(this.template);
                this.items = [];
                var items = this.$('.live-item-list>div'),
                    item,
                    children,
                    divs;
                for (var i = 0, j = items.length; i < j; i++) {
                    item = items.eq(i);
                    children = item.find('span');
                    divs = item.find('div');
                    this.items.push({
                        box: item,
                        num: divs.eq(0),
                        name: children.eq(0),
                        p: children.eq(1),
                        fav: divs.eq(3),
                        lock: divs.eq(4)
                    });
                }
                this.cursor = this.$('.live-item-list-progress-cursor');
                this.number = this.$('.live-number');
                return this;
            },
            checkFav: function () {
                if (this.favChanged) {
                    this.favChanged = false;
                    Broadcast.trigger('sys:fav');
                }
            },
            _timing: function () {
                var self = this;
                this.leaveTimer.setTimeout(function () {
                    self.hidePIP();
                    Broadcast.trigger(Event.pageChanged, 'none');
                }, 10000);
            },
            _focusMenu: function () {
                if (!this.isMenuFocus) {
                    this.group.$el.addClass('focus');
                    this.list.removeClass('focus');
                    this._unscroll();
                    this.isMenuFocus = true;
                }
            },
            _blueMenu: function () {
                if (this.isMenuFocus && this.dataLength === 0) return;
                if (this.isMenuFocus) {
                    this.group.$el.removeClass('focus');
                    this.list.addClass('focus');
                    this._startScroll();
                    this.isMenuFocus = false;
                }
            },
            onkeydown: function (keyCode) {
                this._timing();
                if (this._prevent(keyCode)) return;
                switch (keyCode) {
                    case jsf.Event.KEY_FAV:
                        if (this.dataLength > 0) {
                            this.favChanged = true;
                            var channel = this.channels.get(this.dataIndex);
                            var currentFavValue = channel.isFav();
                            channel.setFav(!currentFavValue);
                            currentFavValue ? this.items[this.getCurrentFocusItemIndex()].fav.removeClass('fav') : this.items[this.getCurrentFocusItemIndex()].fav.addClass('fav');
                        }
                        break;
                    case jsf.Event.KEY_DOWN:
                        this.hidePIP();
                        this._offset(1);

                        break;
                    case jsf.Event.KEY_UP:
                        this.hidePIP();
                        this._offset(-1);
                        break;
                    case jsf.Event.KEY_LEFT:
                        this._focusMenu();
                        this.hidePIP();
                        if (this.isMenuFocus) {
                            this.checkFav();
                            this.group.offset(-1);
                            this.showList(this.group.data[this.group.dataIndex].list);
                        } else {
                            this._offset(-1);
                        }
                        this._blueMenu();
                        break;
                    case jsf.Event.KEY_RIGHT:
                        this._focusMenu();
                        this.hidePIP();
                        if (this.isMenuFocus) {
                            this.checkFav();
                            this.group.offset(1);
                            this.showList(this.group.data[this.group.dataIndex].list);
                        } else {
                            this._offset(1);
                        }
                        this.hidePIP();
                        this._blueMenu();
                        break;
                    case jsf.Event.KEY_BACK:
                        Broadcast.trigger(Event.pageChanged, null);
                        break;
                    case jsf.Event.KEY_ENTER:
                        if (this.dataLength === 0 || this.isMenuFocus) return;
                        var channel = this.channels.get(this.dataIndex);
                        var cursor = this.dataIndex;
                        var current = Live.getCurrentChannelIndex();
                        if (this.group.dataIndex !== 0) {
                            var channels = this.group.data[0].list;
                            for (var i = 0, j = channels.length; i < j; i++) {
                                if (channel === channels.get(i)) {
                                    cursor = i;
                                }
                            }
                        }
                        cursor !== current && Live.offsetChannel(cursor - Live.getCurrentChannelIndex());
                        Broadcast.trigger(Event.pageChanged, 'epg');
                        break;
                    default:
                        break;
                }
            }
        });
    var PfUpDateView = ListView.extend({
            ensureSelf: function (options) {
                this.isCycle = false;
                this.max = 5;
                this.mid = 3;
                this.currentMid = 3;
                this.itemClass = 'live-pf-date-item-up-';
                this.items = [];
                var items = this.$('>div'),
                    item,
                    children;
                for (var i = 0, j = items.length; i < j; i++) {
                    item = items.eq(i);
                    children = item.find('div');
                    this.items.push({
                        box: item,
                        name: children.eq(1)
                    });
                }
            },
            refresh: function (data, index) {
                this.index = index;
                this.data = data;
                this.dataLength = this.data.length;
                var startItem = (this.currentMid - this.mid + this.max) % this.max;
                for (var i = 0; i < this.max; i++) {
                    this.showData((startItem + i) % this.max, this.index + (i - this.mid));
                }
            },
            getItem: function (itemIndex) {
                return this.items[itemIndex].box[0];
            },
            showData: function (itemIndex, index) {
                var date = this.data[index];
                if (date) {
                    this.items[itemIndex].name.html(date.str);
                    this.items[itemIndex].box.css('visibility', 'visible');
                } else {
                    this.items[itemIndex].name.html('');
                    this.items[itemIndex].box.css('visibility', 'hidden');
                }
            }
        }),
        PfDownDateView = ListView.extend({
            ensureSelf: function (options) {
                this.isCycle = false;
                this.max = 3;
                this.mid = 1;
                this.currentMid = 1;
                this.itemClass = 'live-pf-date-item-down-';
                this.items = [];
                var items = this.$('>div'),
                    item,
                    children;
                for (var i = 0, j = items.length; i < j; i++) {
                    item = items.eq(i);
                    children = item.find('div');
                    this.items.push({
                        box: item,
                        name: children.eq(1)
                    });
                }
            },
            refresh: function (data, index) {
                this.index = index;
                this.data = data;
                this.dataLength = this.data.length;
                var startItem = (this.currentMid - this.mid + this.max) % this.max;
                for (var i = 0; i < this.max; i++) {
                    this.showData((startItem + i) % this.max, this.index + (i - this.mid));
                }
            },
            getItem: function (itemIndex) {
                return this.items[itemIndex].box[0];
            },
            showData: function (itemIndex, index) {
                var date = this.data[index];
                if (date) {
                    this.items[itemIndex].name.html(date.str);
                    this.items[itemIndex].box.css('display', 'block');
                } else {
                    this.items[itemIndex].name.html('');
                    this.items[itemIndex].box.css('display', 'none');
                }
            }
        }),
        EpgInfoView = BaseView.extend({
            ensureSelf: function () {
                this.isVisible = false;
                this.isScroll = false;
                this.pageNum = 0;
                this.currentPage = 0;
                this.name = this.$('.live-pf-channel-info-name>span').eq(0);
                this.date = this.$('.live-pf-channel-info-date');
                this.content = this.$('.live-pf-channel-info-content');
            },
            show: function (program) {
                this.name.html(program.name);
                if (this.name.width() > 330) {
                    this.isScroll = true;
                    this.name.wrap('<marquee></marquee>');
                }
                this.date.html(Transform.date(program.startTime, 'MM/dd hh:mm~') + Transform.date(program.endTime, 'hh:mm'));
                this.content.html(program.description);
                this.pageNum = 0;
                this.currentPage = 0;
                var height = this.content.height();
                if (height > 200) {
                    this.pageNum = Math.floor(height / 192);
                }
                this.$el.css({
                    opacity: 1,
                    display: 'block'
                });
                this.isVisible = true;
            },
            hide: function (noAnimation) {
                this.$el.css({
                    opacity: 0,
                    display: noAnimation ? 'none' : 'block'
                });
                this.isVisible = false;
                this.isScroll && this.name.unwrap();
                this.isScroll = false;
                this.name.html('');
                this.content.css('margin-top', '0');
            },
            offset: function (offset) {
                if (this.pageNum > 0) {
                    var next = this.currentPage + offset;
                    if (next >= 0 && next <= this.pageNum) {
                        this.currentPage = next;
                        this.content.css('margin-top', this.currentPage * -256 + 'px');
                    }
                }
            }
        }),
        ServiceInfoView = BaseView.extend({
            ensureSelf: function () {
                this.isVisible = false;
                this.items = this.$('.live-pf-service-information-item');
            },
            show: function (channel) {
                this.$el.css({
                    opacity: 1,
                    display: 'block'
                });
                this.isVisible = true;
                this.items.eq(0).html(jsf.SysInfo.swVer);
                this.items.eq(1).html(channel.videoPID);
                this.items.eq(2).html(jsf.CA.cardId);
                this.items.eq(3).html(channel.audioPID);
                this.items.eq(4).html(channel.modulation.toUpperCase() ? channel.modulation.toUpperCase() : '');
                this.items.eq(6).html(channel.frequency ? channel.frequency / 1000 + 'MHZ' : '');
                this.items.eq(8).html(channel.symbolRate ? channel.symbolRate + 'Kbps' : '');
            },
            hide: function () {
                this.$el.css({
                    opacity: 0
                });
                this.isVisible = false;
            }
        }),
        PfView = ListView.extend({
            template: require('view/live/pf.html'),
            ensureSelf: function (options) {
                this.state = new Backbone.Model({});
                this.render();
                this.timer = Timer.get();
                this.scrollTimer = Timer.get();
                this.leaveTimer = Timer.get();
                this.lockTimer = Timer.get();
                this.changeChannelTimer = Timer.get();
                this.midIsScroll = false;
                this.isCycle = false;
                this.max = 6;
                this.mid = 2;
                this.currentMid = 2;
                this.itemClass = 'live-pf-item-';
                this.isFocus = false;
                this.pfUpDate = new PfUpDateView({
                    el: this.$('.live-pf-date-item-list-up')
                });
                this.pfDownDate = new PfDownDateView({
                    el: this.$('.live-pf-date-item-list-down')
                });
                var self = this;
                this.el.addEventListener('webkitAnimationEnd', function (event) {
                    if (event.target === this) {
                        switch (event.animationName) {
                            case 'fadeIn':
                                break;
                            default:
                                this.classList.remove('live-pf-focus');
                                break;
                        }
                    }
                }, false);
                this.pfUpDate.items[3].box[0].addEventListener('webkitTransitionEnd', function (event) {
                    if (event.target === this && event.propertyName === 'top') {
                        self._unscroll();
                        self._changeEpgs();
                        self._startScroll();
                    }
                }, false);
                this.epgInfoView = new EpgInfoView({
                    el: this.$('.live-pf-channel-info')
                });
                this.serviceInfoView = new ServiceInfoView({
                    el: this.$('.live-pf-service-info')
                });
                this.itemList.addEventListener('webkitAnimationEnd', function (event) {
                    switch (event.animationName) {
                        case 'mid-to-side':
                            this.classList.remove('live-pf-item-list-change');
                            break;
                        default:
                            break;
                    }
                }, false);
            },
            _timing: function () {
                var self = this;
                this.leaveTimer.setTimeout(function () {
                    Broadcast.trigger(Event.pageChanged, 'none');
                }, 5000);
            },
            _check: function () {
                if (this.dataLength > 0 && this.now < this.dataLength) {
                    if (this.now === -1 && this.epgs[0].startTime.getTime() <= Date.now()) {
                        this.now = 0;
                    } else if (this.now >= 0 && this.epgs[this.now].endTime.getTime() <= Date.now()) {
                        this.now++;
                        if (this.now >= this.dataLength) {
                            this._initialize();
                            return;
                        }
                    } else {
                        return;
                    }
                    this._refreshEpgs();
                }
            },
            _startClock: function () {
                var date = this.$('.live-pf-date'),
                    time = this.$('.live-pf-time'),
                    self = this,
                    now;
                this.lockTimer.setInterval(function () {
                    now = new Date();
                    date.html(Transform.date(now, 'k,Md', null, true));
                    time.html(Transform.date(now, 'hh:mm:ss'));
                    self._check();
                }, 1000);
            },
            _initialize: function (delay) {
                if (this.dataLength > 0) {
                    this._blur();
                    this.epgInfoView.isVisible && this.epgInfoView.hide();
                    this.serviceInfoView.isVisible && this.serviceInfoView.hide();
                }
                var channel = Live.getCurrentChannel();
                this.number.html(Transform.number(channel.logicNumber, 3));
                if (delay) {
                    this.changeChannelTimer.setTimeout(function () {
                        this._refreshDateViewAndEpgs(channel);
                    }, delay, this);
                } else {
                    this._refreshDateViewAndEpgs(channel);
                    this.changeChannelTimer.clear();
                }
                this._timing();
            },
            _refreshDateViewAndEpgs: function (channel) {
                this.dates = Live.getDays();
                this.dateDataLength = this.dates.length;
                this.pfUpDate.refresh(this.dates, 0);
                this.pfDownDate.refresh(this.dates, 1);
                this._changeEpgs();
                Broadcast.trigger(Event.checkChannelStatus);
            },
            _showEpgs: function () {
                this.itemList.classList.remove('live-pf-item-list-change');
                this.itemList.offsetWidth = this.itemList.offsetWidth;
                this.itemList.classList.add('live-pf-item-list-change');
            },
            _refreshEpgs: function () {
                var startItem = (this.currentMid - this.mid + this.max) % this.max;
                for (var i = 0; i < this.max; i++) {
                    this.showData((startItem + i) % this.max, this.index + (i - this.mid));
                }
            },
            _changeEpgs: function () {
                this.epgs = Live.getEpgs(this.pfUpDate.index);
                if (this.epgs.length !== 0 || this.dataLength !== 0) {
                    this.dataLength = this.epgs.length;
                    this.index = -2;
                    if (this.dataLength > 0) {
                        this.index = 0;
                        if (this.pfUpDate.index === 0) {
                            if (this.epgs[0].startTime.getTime() > Date.now()) {
                                this.now = -1;
                            } else {
                                this.now = 0;
                            }
                            // var now = new Date();
                            // for (var i = this.epgs.length - 1; i >= 0; i--) {
                            //   if (this.epgs[i].startTime <= now) {
                            //     this.index = i;
                            //     if (this.epgs[i].endTime < now) {
                            //       this.index++;
                            //     }
                            //     this.now = this.index;
                            //     break;
                            //   }
                            // }
                        } else {
                            this.now = -2;
                        }
                    } else {
                        this.now = this.index;
                    }
                    // this._showEpgs();
                    this._refreshEpgs();
                }
            },
            _startScroll: function () {
                var self = this;
                this.scrollTimer.setTimeout(function () {
                    self._scroll();
                }, 800);
            },
            _unscroll: function () {
                this.scrollTimer.clear();
                if (this.midIsScroll) {
                    this.items[this.currentMid].name.unwrap();
                    this.midIsScroll = false;
                }
            },
            _scroll: function () {
                if (this.items[this.currentMid].name.width() > 255) {
                    this.items[this.currentMid].name.wrap('<marquee></marquee>');
                    this.midIsScroll = true;
                }
            },
            _setPrevent: function (boolean) {
                this._preventKey = boolean;
            },
            _prevent: function (keyCode) {
                if (this._preventKey) {
                    return true;
                } else {
                    this._preventKey = true;
                    var self = this;
                    this.timer.setTimeout(function () {
                        self._preventKey = false;
                    }, 200);
                    return false;
                }
            },
            offsetDate: function (offset) {
                if (this.dateDataLength > 1 && (this.pfUpDate.index > 0 && offset < 0 || this.pfDownDate.index < this.dateDataLength && offset > 0)) {
                    this._setPrevent(true);
                    this._unscroll();
                    this.pfUpDate.offset(offset);
                    this.pfDownDate.offset(offset, true);
                }
            },
            beforeOffset: function () {
                this._unscroll();
            },
            afterOffset: function () {
                this._startScroll();
            },
            getItem: function (itemIndex) {
                return this.items[itemIndex].box[0];
            },
            showData: function (itemIndex, index) {
                var epg = this.epgs[index];
                if (epg) {
                    this.items[itemIndex].type[0].className = index === this.now ? 'now' : index < this.now ? 'past' : Live.isBooking(epg, jsf.Booking.TYPE_EPG) ? 'future booking' : 'future';
                    this.items[itemIndex].name.html(epg.name);
                    this.items[itemIndex].time.html(Transform.date(epg.startTime, 'hh:mm') + '-' + Transform.date(epg.endTime, 'hh:mm'));
                    this.items[itemIndex].box.css('display', 'block');
                } else {
                    this.items[itemIndex].name.html('');
                    this.items[itemIndex].time.html('');
                    this.items[itemIndex].needScrollName = false;
                    this.items[itemIndex].box.css('display', 'none');
                }
            },
            _chooseItem: function () {
                if (this.dataLength > 0) {
                    if (this.index > this.now) {
                        // booking
                        var epg = this.epgs[this.index];
                        if (Live.isBooking(this.epgs[this.index], jsf.Booking.TYPE_EPG)) {
                            Live.removeBookingByEpgAndType(this.epgs[this.index], jsf.Booking.TYPE_EPG);
                            Broadcast.trigger('tip:global', {
                                type: 'success',
                                info: 'Cancel success !'
                            });
                            this.items[this.currentMid].type[0].classList.remove('booking');
                        } else {
                            var result = jsf.BookingManager.add(jsf.Booking.createReminder(epg)),
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
                                    var add = jsf.BookingManager.getByProgram(epg, jsf.Booking.TYPE_EPG);
                                    if (add.length > 0) {
                                        message.info = 'Booking success !';
                                        message.type = 'success';
                                        Live.addBooking(add[0]);
                                        this.items[this.currentMid].type[0].classList.add('booking');
                                    } else {
                                        message.info = 'Booking fail';
                                        message.type = 'fail';
                                    }
                                    break;
                            }
                            Broadcast.trigger('tip:global', message);
                        }
                    }
                }
            },
            _focus: function () {
                if (!this.isFocus) {
                    this.isFocus = true;
                    this.el.classList.add('live-pf-focus');
                    this._startScroll();
                }
            },
            _blur: function () {
                if (this.isFocus) {
                    this.isFocus = false;
                    this.el.classList.remove('live-pf-focus');
                    this._unscroll();
                }
            },
            epgChanged: function (info) {
                var channel = Live.getCurrentChannel();
                if (info.frequency === channel.frequency && info.serviceId === channel.serviceId && info.tsId === channel.tsId) {
                    this._changeEpgs();
                }
            },
            afterOut: function () {
                if (this.dataLength > 0) {
                    this.egps = [];
                    this.dataLength = 0;
                    this._refreshEpgs();
                    this._blur();
                    this.epgInfoView.isVisible && this.epgInfoView.hide();
                    this.serviceInfoView.isVisible && this.serviceInfoView.hide();
                }
            },
            beforeOut: function () {
                Broadcast.off('epg:schedule', this.epgChanged, this);
                this._blur();
                this.lockTimer.clear();
                this.leaveTimer.clear();
                this.changeChannelTimer.clear();
            },
            afterIn: function () {
                Broadcast.on('epg:schedule', this.epgChanged, this);
                this._initialize();
                this._startClock();
            },
            render: function () {
                this.$el.html(this.template);
                this.items = [];
                var items = this.$('.live-pf-item-list>div');
                var item;
                var children;
                for (var i = 0, j = items.length - 1; i < j; i++) {
                    item = items.eq(i);
                    children = item.find('div');
                    this.items.push({
                        box: item,
                        type: children.eq(0),
                        name: children.eq(1).find('span'),
                        progress: children.eq(2),
                        time: children.eq(3)
                    });
                }
                this.itemList = this.$('.live-pf-item-list')[0];
                this.number = this.$('.live-number');
                return this;
            },
            onkeydown: function (keyCode) {
                if (this.serviceInfoView.isVisible) {
                    switch (keyCode) {
                        case jsf.Event.KEY_BACK:
                        case jsf.Event.KEY_INFO:
                            this.epgInfoView.$el.css('display', 'block');
                            this.serviceInfoView.hide();
                            this._timing();
                            break;
                        default:
                            break;
                    }
                    return;
                }
                if (this.epgInfoView.isVisible) {
                    switch (keyCode) {
                        case jsf.Event.KEY_UP:
                            this.epgInfoView.offset(-1);
                            break;
                        case jsf.Event.KEY_DOWN:
                            this.epgInfoView.offset(1);
                            break;
                        case jsf.Event.KEY_BACK:
                            this.epgInfoView.hide();
                            this._timing();
                            break;
                        case jsf.Event.KEY_INFO:
                            this.epgInfoView.hide(true);
                            this.serviceInfoView.show(Live.getCurrentChannel());
                            break;
                        default:
                            break;
                    }
                    return;
                }
                this.leaveTimer.clear();
                if (!this.isFocus) {
                    switch (keyCode) {
                        case jsf.Event.KEY_UP:
                            if (Live.getAll().length > 0) {
                                Live.offsetChannel(1);
                                this._initialize();
                            }
                            break;
                        case jsf.Event.KEY_DOWN:
                            if (Live.getAll().length > 0) {
                                Live.offsetChannel(-1);
                                this._initialize();
                            }
                            break;
                        case jsf.Event.KEY_BACK:
                            Broadcast.trigger(Event.pageChanged, null);
                            return;
                        case jsf.Event.KEY_ENTER:
                            this._focus();
                            break;
                        case jsf.Event.KEY_INFO:
                            var epg = Live.getNowEpg(Live.getCurrentChannel());
                            if (epg) {
                                this.serviceInfoView.$el.css('display', 'none');
                                this.epgInfoView.show(epg);
                                return;
                            }
                            break;
                        default:
                            break;
                    }
                } else if (!this._prevent(keyCode)) {
                    switch (keyCode) {
                        case jsf.Event.KEY_LEFT:
                            this.offset(-1);
                            break;
                        case jsf.Event.KEY_RIGHT:
                            this.offset(1);
                            break;
                        case jsf.Event.KEY_UP:
                            this.offsetDate(1);
                            break;
                        case jsf.Event.KEY_DOWN:
                            this.offsetDate(-1);
                            break;
                        case jsf.Event.KEY_BACK:
                            this._blur();
                            break;
                        case jsf.Event.KEY_MENU:
                            Broadcast.trigger(Event.pageChanged, 'list');
                            return;
                        case jsf.Event.KEY_ENTER:
                            this._chooseItem();
                            break;
                        default:
                            break;
                    }
                }
                this._timing();
            }
        });
    var PfBarView = BaseView.extend({
        template: require('view/live/pf-bar.html'),
        ensureSelf: function (options) {
            this.render();
            this.leaveTimer = Timer.get();
            this.pfTimer = Timer.get();
            this.lockTimer = Timer.get();
            this.scrollTimer = Timer.get();
            this.liveNumber = this.$('#live-number');
            this.liveNumberShadow = this.$('#live-number-shadow');
            this.liveNumberName = this.$('#live-number-name');
            this.number = this.$('#live-pf-bar-number');
            this.name = this.$('#live-pf-bar-name');
            this.progress = this.$('#live-pf-bar-progress');
            this.pInfo = this.$('#live-pf-bar-p .live-pf-bar-info');
            this.fInfo = this.$('#live-pf-bar-f .live-pf-bar-info');
            this.epgInfoView = new EpgInfoView({
                el: this.$('.live-pf-channel-info')
            });
            this.serviceInfoView = new ServiceInfoView({
                el: this.$('.live-pf-service-info')
            });
        },
        pfChanged: function (info) {
            if (this.channel && info.frequency === this.channel.frequency && info.serviceId === this.channel.serviceId && info.tsId === this.channel.tsId) {
                this._unscroll(true);
                this._refresh();
                this._startScroll();
                !this.epgInfoView.isVisible && !this.serviceInfoView.isVisible && this._timing();
            }
        },
        afterIn: function () {
            Broadcast.on('epg:pf', this.pfChanged, this);
            this._initialize();
            this._startClock();
        },
        afterOut: function () {
            this.channel = null;
            this.p = null;
            this.epgInfoView.isVisible && this.epgInfoView.hide();
            this.serviceInfoView.isVisible && this.serviceInfoView.hide();
        },
        beforeOut: function () {
            Broadcast.off('epg:pf', this.pfChanged, this);
            this._unscroll();
            this.pfTimer.clear();
            this.leaveTimer.clear();
            this.lockTimer.clear();
        },
        render: function () {
            this.$el.html(this.template);
            return this;
        },
        _initialize: function () {
            this._unscroll();
            this.epgInfoView.isVisible && this.epgInfoView.hide();
            this.serviceInfoView.isVisible && this.serviceInfoView.hide();
            this.channel = Live.getCurrentChannel();
            this.number.html(this.channel ? Transform.number(this.channel.logicNumber, 3) : '');
            this.liveNumber.html(this.channel ? Transform.number(this.channel.logicNumber, 1) : '');
            this.liveNumber.css('display', 'block');
            this.liveNumberShadow.html(this.channel ? Transform.number(this.channel.logicNumber, 1) : '');
            this.liveNumberName.html(this.channel ? this.channel.name : '');
            this.name.html(this.channel ? this.channel.name : '');
            this.name[0].needScroll = this.channel ? this.name.width() >= 210 : false;//310
            var sounds = {
                'left': "左声道",
                'right': "右声道",
                'stereo': "立体声"
            };
            this._sound = sounds[Media.getSoundChannel()];//left right stereo
            Broadcast.trigger(Event.checkChannelStatus);
            this._refresh();
            this._startScroll();
            this._timing();
        },
        _unscroll: function (uncheckName) {
            this.scrollTimer.clear();
            !uncheckName && this._checkScroll(this.name, false);
            this._checkScroll(this.pInfo.eq(0), false);
            this._checkScroll(this.fInfo.eq(0), false);
        },
        _checkScroll: function (element, scroll) {
            if (element[0].needScroll && !element[0].isScroll === scroll) {
                scroll ? element.wrap('<marquee></marquee>') : element.unwrap();
                element[0].isScroll = scroll;
            }
        },
        _scroll: function () {
            this._checkScroll(this.name, true);
            this._checkScroll(this.pInfo.eq(0), true);
            this._checkScroll(this.fInfo.eq(0), true);
        },
        _startScroll: function () {
            var self = this;
            this.scrollTimer.setTimeout(function () {
                self._scroll();
            }, 800);
        },
        _startClock: function () {
            var time = this.$('#live-pf-bar-time'),
                self = this,
                now;
            this.lockTimer.setInterval(function () {
                now = new Date();
                time.html(Transform.date(now, 'hh:mm') + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + self._sound);
            }, 1000, true);
        },
        _transfromTime: function (epg) {
            return jsf.dateFormat(epg.startTime, 'hh:mm') + '-' + jsf.dateFormat(epg.endTime, 'hh:mm');
        },
        _refresh: function () {
            this.pfTimer.clear();
            var pf = Live.getPf(this.channel);
            var f = pf[1];
            var width;
            this.p = pf[0];
            if (this.p) {
                this.pInfo.eq(0).html(this.p.name);
                this.pInfo.eq(1).html(this._transfromTime(this.p));
                width = this.pInfo.eq(0).width();
                //this.pInfo.eq(1).css('left', Math.min(width, 500) + 5 + 'px');
            } else {
                this.pInfo.eq(0).html('');
                this.pInfo.eq(1).html('');
                width = 0;
            }
            this.pInfo.eq(0)[0].needScroll = width >= 248;//
            if (f) {
                this.fInfo.eq(0).html(f.name);
                this.fInfo.eq(1).html(this._transfromTime(f));
                width = this.fInfo.eq(0).width();
                //this.fInfo.eq(1).css('left', Math.min(width, 520) + 5 + 'px');
            } else {
                this.fInfo.eq(0).html('');
                this.fInfo.eq(1).html('');
                width = 0;
            }
            this.fInfo.eq(0)[0].needScroll = width >= 248;//520
            this.progress.css('display', this.p ? 'block' : 'none');
            if (this.p) {
                var startTime = this.p.startTime.getTime();
                var endTime = this.p.endTime.getTime();
                var duration = endTime - startTime;
                this.progress.css('width', duration > 0 ? Math.min(405 * (Date.now() - startTime) / duration, 405) + 'px' : '0px');
                if (duration > 0) {
                    var self = this;
                    this.pfTimer.setInterval(function () {
                        if (endTime <= Date.now()) {
                            self.progress.css('width', '405px');
                            self.pfTimer.clear();
                        } else {
                            self.progress.css('width', Math.min(405 * (Date.now() - startTime) / duration, 405) + 'px');
                        }
                    }, 1000);
                }
            }
        },
        _timing: function () {
            var self = this;
            this.leaveTimer.setTimeout(function () {
                Broadcast.trigger(Event.pageChanged, 'none');
            }, 5000);
        },
        onkeydown: function (keyCode) {
            if (this.serviceInfoView.isVisible) {
                switch (keyCode) {
                    case jsf.Event.KEY_BACK:
                    case jsf.Event.KEY_INFO:
                        this.epgInfoView.$el.css('display', 'block');
                        this.serviceInfoView.hide();
                        this._timing();
                        break;
                    default:
                        break;
                }
                return;
            }
            if (this.epgInfoView.isVisible) {
                switch (keyCode) {
                    case jsf.Event.KEY_UP:
                        this.epgInfoView.offset(-1);
                        break;
                    case jsf.Event.KEY_DOWN:
                        this.epgInfoView.offset(1);
                        break;
                    case jsf.Event.KEY_BACK:
                        this.epgInfoView.hide();
                        this._timing();
                        break;
                    case jsf.Event.KEY_INFO:
                        this.epgInfoView.hide(true);
                        this.serviceInfoView.show(Live.getCurrentChannel());
                        break;
                    default:
                        break;
                }
                return;
            }
            this.leaveTimer.clear();
            switch (keyCode) {
                case jsf.Event.KEY_UP:
                    if (Live.getAll().length > 0) {
                        Live.offsetChannel(1);
                        this._initialize();
                    }
                    break;
                case jsf.Event.KEY_DOWN:
                    if (Live.getAll().length > 0) {
                        Live.offsetChannel(-1);
                        this._initialize();
                    }
                    break;
                case jsf.Event.KEY_BACK:
                    Broadcast.trigger(Event.pageChanged, null);
                    return;
                case jsf.Event.KEY_INFO:
                    var epg = Live.getNowEpg(Live.getCurrentChannel());
                    if (epg) {
                        this.serviceInfoView.$el.css('display', 'none');
                        this.epgInfoView.show(epg);
                        return;
                    }
                    break;
                case jsf.Event.KEY_RIGHT:
                    Broadcast.trigger(Event.pageChanged, null);
                    Broadcast.trigger('volume:offset', 5);
                    return;
                    break;
                case jsf.Event.KEY_LEFT:
                    Broadcast.trigger(Event.pageChanged, null);
                    Broadcast.trigger('volume:offset', -5);
                    return;
                    break;
                case jsf.Event.KEY_ENTER:
                    Broadcast.trigger(Event.pageChanged, 'list');
                    return;
                    break;
                default:
                    break;
            }
            this._timing();
        }
    });
    var LiveView = BaseView.extend({
        template: require('view/live/live.html'),
        className: 'page animated live',
        ensureSelf: function (options) {
            options.parent.append(this.el);
            this.render();
            this.listView = new LiveListView({
                el: '#live-list'
            });
            this.epgView = new PfBarView({
                el: '#live-pf'
            });
            this.channelNum = $('#live-number-live');
            this.area = null;
            this.dataIndex = 0;
            this.cancalAnimation = false;
            this.timer = Timer.get();
            this.jumpNum = '';
            this._preventKey = false;
            this._preventKeyTimer = Timer.get();
        },
        render: function () {
            this.$el.html(this.template);
        },
        beforeIn: function (params, cancalAnimation) {
            Broadcast.trigger('tip:rec:show');
            Broadcast.on(Event.pageChanged, this.changeTo, this);
            Broadcast.on(Event.checkChannelStatus, this.checkChannelStatus, this);
            this.cancalAnimation = cancalAnimation;
            this.changeTo(params && params.area, true, params && params.index);
        },
        afterIn: function () {
            var element;
            switch (this.area) {
                case 'list':
                    element = this.listView;
                    this.checkChannelStatus();
                    break;
                case 'epg':
                    element = this.epgView;
                    break;
                default:
                    this.checkChannelStatus();
                    this.changeTo('epg');
                    break;
            }
            if (element) {
                element.afterIn(this.dataIndex);
            }
        },
        beforeOut: function (cancalAnimation) {
            Broadcast.off(Event.pageChanged, this.changeTo, this);
            Broadcast.off(Event.checkChannelStatus, this.checkChannelStatus, this);
            var element;
            switch (this.area) {
                case 'list':
                    element = this.listView;
                    break;
                case 'epg':
                    element = this.epgView;
                    break;
            }
            if (element) {
                element.out(cancalAnimation);
            }
            this.area = null;
            this.dataIndex = 0;
            this.timer.clear();
        },
        afterOut: function () {
            var element;
            switch (this.area) {
                case 'list':
                    element = this.listView;
                    break;
                case 'epg':
                    element = this.epgView;
                    break;
            }
            if (element) {
                element.afterOut();
            }
            if (this.jumpNum.length > 0) {
                this.listView.number.css('display', 'block');
                // this.epgView.number.css('display', 'block');
                this.channelNum.css('display', 'none');
                this.jumpNum = '';
            }
        },
        checkChannelStatus: function () {
            var channel = Live.getCurrentChannel();
            Broadcast.trigger('tip:rec:check');
            if (channel && channel.isLocked() && SysConfig.get('isLocked')) {
                Broadcast.trigger('tip:password', function () {
                    Broadcast.trigger('media:play');
                });
            } else {
                Broadcast.trigger('tip:password:hide');
            }
        },
        changeTo: function (area, unsoon, index) {
            var element, dataIndex = index;
            switch (this.area) {
                case 'list':
                    element = this.listView;
                    break;
                case 'epg':
                    element = this.epgView;
                    break;
            }
            if (element) {
                element.out(this.cancalAnimation);
                !unsoon && element.afterOut();
            }
            this.area = area || null;
            this.dataIndex = index || 0;
            switch (this.area) {
                case 'list':
                    element = this.listView;
                    break;
                case 'epg':
                    element = this.epgView;
                    break;
                default:
                    element = null;
                    break;
            }
            if (element) {
                element.in(null, this.cancalAnimation);
                !unsoon && element.afterIn(this.dataIndex);
            }
        },
        jump: function () {
            this.listView.number.css('display', 'block');
            // this.epgView.number.css('display', 'block');
            this.channelNum.css('display', 'none');
            this.jumpNum = Number(this.jumpNum);
            var channels = Live.getAll();
            var find = false;
            for (var i = 0, j = channels.length; i < j; i++) {
                if (channels.get(i).logicNumber === this.jumpNum) {
                    find = true;
                    if (Live.getCurrentChannelIndex() !== i) {
                        Live.toChannel(i);
                        if (this.area === 'epg') {
                            this.epgView._initialize();
                        } else {
                            this.changeTo('epg');
                        }
                    }
                    break;
                }
            }
            this.jumpNum = '';
            this.timer.clear();
            if (!find) {
                Broadcast.trigger('tip:global', {
                    type: 'fail',
                    info: 'Program number input error'
                }, 2000);
            }
        },
        _prevent: function (keyCode) {
            switch (keyCode) {
                case jsf.Event.KEY_UP:
                case jsf.Event.KEY_DOWN:
                    if (this._preventKey) {
                        return true;
                    } else {
                        this._preventKey = true;
                        var self = this;
                        this._preventKeyTimer.setTimeout(function () {
                            self._preventKey = false;
                        }, 400);
                    }
                    return false;
                default:
                    return false;
            }
        },
        onkeydown: function (keyCode) {
            switch (keyCode) {
                case jsf.Event.KEY_AUDIO:
                    Broadcast.trigger('sound-channel:show');
                    return;
                case jsf.Event.KEY_BLUE:
                    Broadcast.trigger('media:subtitle:toggle');
                    return;
                case jsf.Event.KEY_YELLOW:
                    Broadcast.trigger('language:show');
                    return;
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
                    if (Live.getAll().length === 0) return;
                    this.jumpNum += (keyCode - 48);
                    this.channelNum.html(this.jumpNum);
                    this.listView.number.css('display', 'none');
                    this.epgView.liveNumber.css('display', 'none');
                    this.channelNum.css('display', 'block');
                    var self = this;
                    if (this.jumpNum.length < 3) {
                        this.timer.setTimeout(function () {
                            self.jump();
                        }, 3000);
                    } else {
                        this.timer.setTimeout(function () {
                            self.jump();
                        }, 100);
                    }
                    return;
                case jsf.Event.KEY_ENTER:
                    if (this.jumpNum.length > 0) {
                        this.jump();
                        return;
                    }
                    break;
                default:
                    break;
            }
            if (this.area !== 'list') {
                switch (keyCode) {
                    case jsf.Event.KEY_RED:
                        var channel = Live.getCurrentChannel();
                        if (channel) {
                            if (channel.isLocked() && SysConfig.get('isLocked')) {
                                Broadcast.trigger('tip:global', {
                                    type: 'remind',
                                    info: 'Please unlock the channel first.'
                                });
                            } else if (Rec.isRecording(channel)) {
                                jsf.log('will stop rec');
                                qin.booking.stopBooking();
                            } else {
                                var result;
                                if ((result = Rec.checkConditional()).code !== Rec.CHECK_PASS) {
                                    Broadcast.trigger('tip:global', {
                                        type: 'remind',
                                        info: result.info
                                    }, 3000);
                                } else {
                                    Broadcast.trigger('tip:confirm', 'Do you want to turn on the instance recording?', function () {
                                        var now = Date.now();
                                        var result = jsf.BookingManager.add(jsf.Booking.createTimePvr(channel, new Date(now), new Date(now + 2 * 3600 * 1000))),
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
                                                break;
                                        }
                                        message.info && Broadcast.trigger('tip:global', message);
                                    }, this);
                                }
                            }
                        }
                        return;
                    case jsf.Event.KEY_PLAY_PAUSE:
                        Broadcast.trigger('timeshift:play');
                        return;
                }
            }
            if (this.area === 'list') {
                this.listView.onkeydown(keyCode);
                return;
            }
            if (this._prevent(keyCode)) return;
            if (this.area === 'epg') {
                this.epgView.onkeydown(keyCode);
                return;
            }
            switch (keyCode) {
                case jsf.Event.KEY_INFO:
                    if (Live.getAll().length > 0) {
                        this.changeTo('epg');
                    }
                    break;
                case jsf.Event.KEY_ENTER:
                    this.changeTo('list');
                    break;
                case jsf.Event.KEY_UP:
                    if (Live.offsetChannel(1)) {
                        Broadcast.trigger('volume:hide');
                        this.changeTo('epg');
                    }
                    break;
                case jsf.Event.KEY_DOWN:
                    if (Live.offsetChannel(-1)) {
                        Broadcast.trigger('volume:hide');
                        this.changeTo('epg');
                    }
                    break;
                case jsf.Event.KEY_LEFT:
                    Broadcast.trigger('volume:offset', -5);
                    break;
                case jsf.Event.KEY_RIGHT:
                    Broadcast.trigger('volume:offset', 5);
                    break;
                default:
                    break;
            }
        }
    });
    module.exports = {
        create: function (app) {
            if (!this._instance) {
                this._instance = new LiveView({
                    parent: app.$el,
                    state: app.state
                });
            }
            return this._instance;
        },
        refresh: function (params) {
            if (this._instance) {
                if (params.playing) {
                    this._instance.area === 'epg' ? this._instance.epgView._initialize() : this._instance.changeTo('epg');
                }
            }
        }
    };
});