/**
 * Live.js
 * @authors Casper
 * @date    2016/07/04
 * @version 1.0.0
 */
define(['service/Transform', 'service/Broadcast'], function(require, exports, module) {
  var Transform = require('service/Transform'),
    Broadcast = require('service/Broadcast');

  var channelGroups = [];

  function getGroups() {
    if (channelGroups.length === 0) {
      channelGroups = [{
          name: '电视节目',
          list: jsf.ChannelManager.getChannelList([jsf.ChannelManager.FILTER_KEY_CHANNELTYPE], [jsf.Channel.TYPE_TV])
        }, {
          name: '喜爱节目',
          list: jsf.ChannelManager.getChannelList([jsf.ChannelManager.FILTER_KEY_FAV], [true])
        }, {
          name: '图文频道',
          list: jsf.ChannelManager.getChannelList([jsf.ChannelManager.FILTER_KEY_CHANNEL_B], [jsf.Channel.BOUQUET_GRAPHIC])
        }, {
          name: '数据广播',
          list: jsf.ChannelManager.getChannelList([jsf.ChannelManager.FILTER_KEY_CHANNEL_B], [jsf.Channel.BOUQUET_DATA_BROADCAST])
        },{
          name: '中央台',
          list: jsf.ChannelManager.getChannelList([jsf.ChannelManager.FILTER_KEY_CHANNEL_B], [jsf.Channel.BOUQUET_CENTRAL])
        }, {
          name: '福建台',
          list: jsf.ChannelManager.getChannelList([jsf.ChannelManager.FILTER_KEY_CHANNEL_B], [jsf.Channel.BOUQUET_FJ])
        }, {
          name: '福州台',
          list: jsf.ChannelManager.getChannelList([jsf.ChannelManager.FILTER_KEY_CHANNEL_B], [jsf.Channel.BOUQUET_FZ])
        }, {
          name: '地方卫视',
          list: jsf.ChannelManager.getChannelList([jsf.ChannelManager.FILTER_KEY_CHANNEL_B], [jsf.Channel.BOUQUET_LOCAL])
        }, {
          name: '上海文广',
          list: jsf.ChannelManager.getChannelList([jsf.ChannelManager.FILTER_KEY_CHANNEL_B], [jsf.Channel.BOUQUET_SH_MEDIA])
        }, {
          name: '中数传媒',
          list: jsf.ChannelManager.getChannelList([jsf.ChannelManager.FILTER_KEY_CHANNEL_B], [jsf.Channel.BOUQUET_DTV_MEDIA])
        }, {
          name: '华诚影视',
          list: jsf.ChannelManager.getChannelList([jsf.ChannelManager.FILTER_KEY_CHANNEL_B], [jsf.Channel.BOUQUET_HC_FILM_TV])
        }, {
          name: '新闻政治经济',
          list: jsf.ChannelManager.getChannelList([jsf.ChannelManager.FILTER_KEY_CHANNEL_B], [jsf.Channel.BOUQUET_PO_EC_NEWS])
        },{
          name: '体育竞技',
          list: jsf.ChannelManager.getChannelList([jsf.ChannelManager.FILTER_KEY_CHANNEL_B], [jsf.Channel.BOUQUET_SPORT])
        }, {
          name: '娱乐综艺',
          list: jsf.ChannelManager.getChannelList([jsf.ChannelManager.FILTER_KEY_CHANNEL_B], [jsf.Channel.BOUQUET_ENTER_VARIETY])
        },{
          name: '影视剧场',
          list: jsf.ChannelManager.getChannelList([jsf.ChannelManager.FILTER_KEY_CHANNEL_B], [jsf.Channel.BOUQUET_MOVIE_THEATER])
        },  {
          name: '生活休闲',
          list: jsf.ChannelManager.getChannelList([jsf.ChannelManager.FILTER_KEY_CHANNEL_B], [jsf.Channel.BOUQUET_LEISURE_LIFE])
        }, {
          name: '老年少儿',
          list: jsf.ChannelManager.getChannelList([jsf.ChannelManager.FILTER_KEY_CHANNEL_B], [jsf.Channel.BOUQUET_OLDER_CHILDREN])
        },{
          name: '科教人文地理',
          list: jsf.ChannelManager.getChannelList([jsf.ChannelManager.FILTER_KEY_CHANNEL_B], [jsf.Channel.BOUQUET_SC_HU_GEO])
        },{
          name: '高清电视节目',
          list: jsf.ChannelManager.getChannelList([jsf.ChannelManager.FILTER_KEY_CHANNEL_B], [jsf.Channel.BOUQUET_HDTV])
        },{
          name: '广播节目',
          list: jsf.ChannelManager.getChannelList([jsf.ChannelManager.FILTER_KEY_CHANNELTYPE], [jsf.Channel.TYPE_RADIO])
        }
      ];
    }
    return channelGroups;
  }

    Broadcast.on('sys:fav', function () {
        getGroups()[1].list = jsf.ChannelManager.getChannelList([jsf.ChannelManager.FILTER_KEY_FAV], [true]);
    });

    var changeTime = -1;
    var ChannelManager = {
        cursor: 0,
        setCursor: function (cursor) {
            this.offset(cursor - this.cursor);
        },
        offset: function (offset, list, cursor, delay) {
            var useDefault = false;
            if (!list) {
                list = getGroups()[0].list;
                cursor = this.cursor;
                useDefault = true;
            }
            var length = list.length;
            if (length === 0) return false;
            var next = (cursor + offset + length) % length;
            if (useDefault && next === this.cursor || !useDefault && next === cursor) return true;
            var willPlay = list.get(next);
            if (!useDefault) {
                list = getGroups()[0].list;
                for (var i = 0, j = list.length; i < j; i++) {
                    if (willPlay.logicNumber === list.get(i).logicNumber) {
                        this.cursor = i;
                        break;
                    }
                }
            } else {
                this.cursor = next;
            }
            length = list.length;
            clearTimeout(changeTime);
            var channel1 = list.get(this.cursor);
            var channel2 = null;
            var channel3 = null;
            if (length >= 3) {
                channel2 = list.get((this.cursor - 1 + length) % length);
                channel3 = list.get((this.cursor + 1) % length);
            } else if (length === 2) {
                channel2 = list.get((this.cursor + 1) % length);
            }
            if (delay && delay > 0) {
                changeTime = setTimeout(function () {
                    Broadcast.trigger('media:play', 'live', channel1, channel2, channel3);
                }, delay);
            } else {
                Broadcast.trigger('media:play', 'live', channel1, channel2, channel3);
            }
            return true;
        }
    };

    var Time = {
        _todayCompareKey: null,
        _dayOffset: 24 * 3600 * 1000,
        isDayChange: function () {
            return !this._todayCompareKey || this._todayCompareKey !== Transform.date(new Date(), 'yyyy-MM-dd');
        },
        refresh: function () {
            var now = new Date(),
                offset = this._dayOffset,
                nowDate = Date.now(),
                date,
                d;
            this.days = [];
            this._todayCompareKey = Transform.date(now, 'yyyy-MM-dd');
            this.today = now;
            for (var i = 0; i < 7; i++) {
                date = new Date(nowDate + i * offset);
                d = date.getDate();
                this.days.push({
                    date: date,
                    offset: 0,
                    day: Transform.date(date, 'yyyy-MM-dd'),
                    str: Transform.date(date, 'k,Md', null, true) + (d > 3 ? 'th' : d > 2 ? 'rd' : d > 1 ? 'nd' : 'st')
                });
            }
        },
        getDays: function () {
            this.isDayChange() && this.refresh();
            return this.days;
        }
    };

    var booking_cache = {};
    var db_has_pf = {};
    var db_has_schedule = {};

    function initialize() {
        booking_cache = {};
        booking_cache[jsf.Booking.TYPE_EPG] = {};
        booking_cache[jsf.Booking.TYPE_PVR] = {};
        booking_cache.data = {};
        booking_cache.data[jsf.Booking.TYPE_EPG] = [];
        booking_cache.data[jsf.Booking.TYPE_PVR] = [];
        var now = new Date(),
            bookings = jsf.BookingManager.getByType([jsf.Booking.TYPE_EPG, jsf.Booking.TYPE_PVR]),
            booking;
        jsf.log.i('the total number of bookings is ' + bookings.length);
        for (var i = 0, j = bookings.length; i < j; i++) {
            booking = bookings[i];
            switch (booking.type) {
                case jsf.Booking.TYPE_EPG:
                case jsf.Booking.TYPE_PVR:
                    if (booking.type === jsf.Booking.TYPE_EPG && booking.startTime < now || booking.type === jsf.Booking.TYPE_PVR && booking.endTime <= now) {
                        jsf.log.i('the booking whose id is ' + booking._id + ' and type is ' + booking.type + ' and startTime is ' + jsf.dateFormat(booking.startTime, 'yyyy/MM/dd hh:mm:ss') + ' has expired');
                        jsf.BookingManager.delete(booking);
                    } else {
                        addBooking(booking);
                    }
                    break;
            }
        }
        requestShutdownChannel();
        Broadcast.on('epg:pf', function (info) {
            jsf.log('find pf: ' + info.frequency + '-' + info.serviceId + '-' + info.tsId);
            db_has_pf[info.frequency + '-' + info.serviceId + '-' + info.tsId] = true;
        });
        Broadcast.on('epg:schedule', function (info) {
            jsf.log('find schedule: ' + info.frequency + '-' + info.serviceId + '-' + info.tsId);
            db_has_schedule[info.frequency + '-' + info.serviceId + '-' + info.tsId] = true;
        });
    }

    function requestShutdownChannel() {
        ChannelManager.cursor = 0;
        var channel = jsf.ChannelManager.getShutdownChannel();
        var channels = getGroups()[0].list;
        for (var i = 0; i < channels.length; i++) {
            if (channel && channel === channels.get(i)) {
                ChannelManager.cursor = i;
            }
            if (channels.get(i).serviceId === 65200) {
                ChannelManager.cursor = i;
                break;
            }
        }
    }

    function addBooking(booking) {
        var unique = booking.serviceId + '-' + booking.tsId + '-' + jsf.dateFormat(booking.startTime, 'yyyy/MM/dd/hh/mm/ss');
        booking_cache[booking.type][unique] = booking;
        booking_cache.data[booking.type].push(booking);
        jsf.log.i('the booking whose id is ' + booking._id + ' and type is ' + booking.type + ' and unique is ' + unique + ' has add');
    }

    function removeBookingByUnique(type, unique) {
        if (unique in booking_cache[type]) {
            var booking = booking_cache[type][unique];
            jsf.BookingManager.delete(booking);
            delete booking_cache[type][unique];
            var index = booking_cache.data[type].indexOf(booking);
            index >= 0 && booking_cache.data[type].splice(index, 1);
        }
    }

    initialize();

    return {
        requestShutdownChannel: requestShutdownChannel,
        getAll: function () {
            return getGroups()[0].list;
        },
        getGroups: getGroups,
        getCurrentChannelIndex: function () {
            return ChannelManager.cursor;
        },
        getCurrentChannel: function () {
            return getGroups()[0].list.get(ChannelManager.cursor);
        },
        toChannel: function (cursor) {
            return ChannelManager.setCursor(cursor);
        },
        offsetChannel: function (offset, delay) {
            return ChannelManager.offset(offset, null, null, delay);
        },
        getNowEpg: function (channel) {
            return jsf.EPG.getPF(channel)[0];
            //return channel && db_has_pf[channel.frequency + '-' + channel.serviceId + '-' + channel.tsId] ? jsf.EPG.getPF(channel)[0] : null;
        },
        getPf: function (channel) {
            jsf.log('get pf: ' + channel.frequency + '-' + channel.serviceId + '-' + channel.tsId);
            return jsf.EPG.getPF(channel);
            //return channel && db_has_pf[channel.frequency + '-' + channel.serviceId + '-' + channel.tsId] ? jsf.EPG.getPF(channel) : [];
        },
        getDays: function () {
            return Time.getDays();
        },
        getEpgs: function () {
            var epgs;
            try {
                var channel;
                switch (arguments.length) {
                    case 1:
                        channel = this.getCurrentChannel();
                        // jsf.EPG.requestSchedule(channel);
                        jsf.log('get schedule: ' + channel.frequency + '-' + channel.serviceId + '-' + channel.tsId);
                        epgs = channel && db_has_schedule[channel.frequency + '-' + channel.serviceId + '-' + channel.tsId] ? jsf.EPG.getSchedule(channel, arguments[0]) : [];
                        break;
                    case 2:
                        channel = arguments[0];
                        var currentChannel = this.getCurrentChannel();
                        // jsf.EPG.requestSchedule(channel, channel === currentChannel);
                        jsf.log('get schedule: ' + channel.frequency + '-' + channel.serviceId + '-' + channel.tsId);
                        epgs = channel && db_has_schedule[channel.frequency + '-' + channel.serviceId + '-' + channel.tsId] ? jsf.EPG.getSchedule(channel, arguments[1]) : [];
                        break;
                    default:
                        epgs = [];
                        break;
                }
            } catch (e) {
                jsf.log.e('[Live] getEpgs:' + e);
                epgs = [];
            }
            return epgs || [];
        },
        isBooking: function (epg, type) {
            var booking = booking_cache[type][epg.serviceId + '-' + epg.tsId + '-' + jsf.dateFormat(epg.startTime, 'yyyy/MM/dd/hh/mm/ss')];
            if (booking && type === jsf.Booking.TYPE_EPG && booking.startTime.getTime() <= Date.now()) {
                this.removeBooking(booking);
                booking = null;
            }
            return !!booking;
        },
        getBookingByType: function (type) {
            return booking_cache.data[type];
        },
        addBooking: function (booking) {
            switch (booking.type) {
                case jsf.Booking.TYPE_EPG:
                case jsf.Booking.TYPE_PVR:
                    addBooking(booking);
                    break;
            }
        },
        removePVRBookingById: function (id) {
            var bookings = booking_cache.data[jsf.Booking.TYPE_PVR];
            var booking;
            for (var i = 0, j = bookings.length; i < j; i++) {
                booking = bookings[i];
                if (booking._id === id) {
                    bookings.splice(i, 1);
                    delete booking_cache[jsf.Booking.TYPE_PVR][booking.serviceId + '-' + booking.tsId + '-' + jsf.dateFormat(booking.startTime, 'yyyy/MM/dd/hh/mm/ss')];
                    break;
                }
            }
        },
        removeBooking: function (booking) {
            switch (booking.type) {
                case jsf.Booking.TYPE_EPG:
                case jsf.Booking.TYPE_PVR:
                    removeBookingByUnique(booking.type, booking.serviceId + '-' + booking.tsId + '-' + jsf.dateFormat(booking.startTime, 'yyyy/MM/dd/hh/mm/ss'));
                    break;
            }
        },
        removeBookingByEpgAndType: function (epg, type) {
            switch (type) {
                case jsf.Booking.TYPE_EPG:
                case jsf.Booking.TYPE_PVR:
                    removeBookingByUnique(type, epg.serviceId + '-' + epg.tsId + '-' + Transform.date(epg.startTime, 'yyyy/MM/dd/hh/mm/ss'));
                    break;
            }
        }
    };
});