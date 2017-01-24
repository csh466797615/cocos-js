define(['service/Broadcast', 'service/Live', 'service/Rec', 'service/SysConfig'], function (require, exports, module) {
    var Broadcast = require('service/Broadcast'),
        Live = require('service/Live'),
        Rec = require('service/Rec'),
        SysConfig = require('service/SysConfig'),
        nowVolume = -1;

    var ca = {
        '0x1001': '无法识别卡',
        '0x1002': '智能卡过期，请更换新卡',
        '0x1003': '加扰节目，请插入智能卡',
        '0x1004': '卡中不存在节目运营商',
        '0x1005': '条件禁播',
        '0x1006': '当前时段被设定为不能观看',
        '0x1007': '节目级别高于设定的观看级别',
        '0x1008': '智能卡与本机顶盒不对应',
        '0x1009': '没有授权',
        '0x100a': '节目解密失败',
        '0x100b': '卡内金额不足',
        '0x100c': '区域不正确',
        '0x100d': '子卡需要和母卡对应，请插入母卡',
        '0x100e': '智能卡校验失败，请联系运营商',
        '0x100f': '智能卡升级中，请不要拔卡或者关机',
        '0x1010': '请升级智能卡',
        '0x1011': '请勿频繁切换频道',
        '0x1012': '智能卡暂时休眠，请5分钟后重新开机',
        '0x1013': '智能卡已冻结，请联系运营商',
        '0x1014': '智能卡已暂停，请回传收视记录给运营商',
        '0x1015': '请重启机顶盒',
        '0x1016': '机顶盒被冻结',
        '0x1017': '高级预览节目，该阶段不能免费观看',
        '0x1018': '升级测试卡测试中...',
        '0x1019': '升级测试卡测试失败，请检查机卡通讯模块',
        '0x101a': '升级测试卡测试成功',
        '0x101b': '卡中不存在移植库定制运营商',
        '0x101d': 'Program viewed overtime, please contact your cable operator'
    }, tipStyle = false;

    function broadcast_static_info(info) {
        try {
            if (!tipStyle) {
                if (info) {
                    $('#portal-tip').html(info).css('display', 'block');
                } else {
                    $('#portal-tip').css('display', 'none');
                }
            } else {
                Broadcast.trigger('tip:static', info);
                $('#portal-tip').css('display', 'none');
            }
        } catch (e) {
            Broadcast.trigger('tip:static', info);
        }
    }

    function init_volume() {
        if (nowVolume === -1) {
            nowVolume = jsf.SysInfo.get('currentVolume');
            if (nowVolume === null || nowVolume === '') {
                nowVolume = 15;
                jsf.SysInfo.get('currentVolume', nowVolume);
            } else {
                nowVolume = Number(nowVolume);
            }
            jsf.log('default volume is ' + nowVolume);
        }
    }

    function MediaPlayer(params) {
        params && params.play !== void 0 && (this.play = params.play);
        this.wx = params && params.wx !== void 0 ? Number(params.wx) : 0;
        this.wy = params && params.wy !== void 0 ? Number(params.wy) : 0;
        this.wz = params && params.wz !== void 0 ? Number(params.wz) : 0;
        this.ww = params && params.ww !== void 0 ? Number(params.ww) : 1280;
        this.wh = params && params.wh !== void 0 ? Number(params.wh) : 720;
        this.audioEnable = params && params.audioEnable !== void 0 ? params.audioEnable : true;
        this.language = null;
        this.audioPids = null;
        this.playingChannel = null;
        this.timeshiftTimer = -1;
        this.isLocked = false;
        this.isSignal = true;
        this.isOpenSubtitle = false;
    }

    MediaPlayer.prototype = {
        _getInstance: function () {
            if (!this.instance || this.handle === -1) {
                this.handle = qin.player.create(JSON.stringify({
                    'wx': this.wx,
                    'wy': this.wy,
                    'wz': this.wz,
                    'ww': this.ww,
                    'wh': this.wh,
                    'audioEnable': this.audioEnable ? 1 : 0
                }));
                var that = this;
                jsf.eventManager.addListener({
                    event: jsf.EventListener.SYSTEM,
                    eventType: jsf.EventSystem.TYPE_TUNER,
                    callback: function (event) {
                        var data = event.getEventData();
                        if (that.isPlaying && that.playingChannel && data && data.frequency === that.playingChannel.frequency) {
                            switch (event.getEventName()) {
                                case jsf.EventSystem.TUNER_LOCKED:
                                    if (!that.isSignal) {
                                        broadcast_static_info('');
                                        qin.ca.CARefresh();
                                        that.isSignal = true;
                                    }
                                    break;
                                case jsf.EventSystem.TUNER_UNLOCKED:
                                    if (that.isSignal) {
                                        broadcast_static_info('请检查信号线连接状态');
                                        that.isSignal = false;
                                        /*if (that.isPlaying) {TODO delete timeShift and rec
                                         clearTimeout(TvMedia.timeshiftTimer);
                                         Rec.stopTimeShift();
                                         }*/
                                    }
                                    break;
                            }
                        }
                    }
                });
                jsf.eventManager.addListener({
                    event: jsf.EventListener.SYSTEM,
                    eventType: jsf.EventSystem.TYPE_CA,
                    callback: function (event) {
                        if (!that.isPlaying) return;
                        switch (event.getEventName()) {
                            case jsf.EventSystem.CA_IPPV_HIDE:
                            case jsf.EventSystem.CA_BUYMESSGE_HIDE:
                                broadcast_static_info('');
                                break;
                            case jsf.EventSystem.CA_BUYMESSGE_DISPLAY:
                                var currChannel = Live.getCurrentChannel();
                                var data = event.getEventData();
                                if (currChannel && currChannel.frequency == data.frequency
                                    && currChannel.tsId == data.tsId
                                    && currChannel.serviceId == data.serviceId) {
                                    var msgType = '0x' + event.getEventData().messageType.toString(16);
                                    broadcast_static_info(ca[msgType]);
                                }
                                break;
                            case jsf.EventSystem.CA_IPPV_START:
                                switch (event.getEventData().messageType) {
                                    case 0:
                                        broadcast_static_info('IPPV free preview stage, you need to buy to complete view');
                                        break;
                                    case 1:
                                        broadcast_static_info('IPPV charging stage, you need to buy to complete view');
                                        break;
                                    case 2:
                                        broadcast_static_info('IPPT charges section, you need to buy to complete view');
                                        break;
                                }
                                break;
                        }
                    }
                });
                this.instance = jsf.MediaPlayer.create(this.handle);
                init_volume();
                this.setVolume(nowVolume);
                this.setFrameMode(true);
            }
            return this.instance;
        },
        play: function () {
        },
        stop: function (notStopTimeshift) {
            if (this.instance && this.isPlaying) {
                this.audioPids = null;
                if (!notStopTimeshift) {
                    if (this.playingChannel) {
                        Rec.stopTimeShift();
                        this.playingChannel = null;
                    }
                    clearTimeout(this.timeshiftTimer);
                }
                this.isSignal = true;
                this.isPlaying && this.instance.stop();
                this.isPlaying = false;
                this.isLocked = false;
                this.isOpenSubtitle = false;
                broadcast_static_info('');
            }
        },
        audio: function (boolean) {
            if (this.audioEnable !== boolean) {
                this.audioEnable = boolean;
                if (this.instance) {
                    qin.player.set(this.handle, {
                        'audioEnable': this.audioEnable ? 1 : 0
                    });
                }
            }
        },
        setVolume: function (volume) {
            if (volume < 0 || volume > 100) return;
            this.instance && this.instance.setVolume(volume);
        },
        setMute: function (mute) {
            this.instance && this.instance.setMute(mute);
        },
        setPosition: function (_x, _y, _z, _width, _height) {
            try {
                if (this.instance) {
                    if (_x > 0) {
                        tipStyle = false;
                    } else {
                        tipStyle = true;
                    }
                    qin.player.set(this.handle, JSON.stringify({
                        "wx": _x ? Number(_x) : 0,
                        "wy": _y ? Number(_y) : 0,
                        "wz": _z ? Number(_z) : 0,
                        "ww": _width ? Number(_width) : 0,
                        "wh": _height ? Number(_height) : 0
                    }));
                }
            } catch (e) {
            }

        },
        getPosition: function () {
            if (this.instance) {
                var _rtn = qin.player.get(this.handle, ["wx", "wy", "wz", "ww", "wh"]);
                if (_rtn != "" && _rtn != null) {
                    _rtn = JSON.parse(_rtn);
                    return {
                        x: typeof _rtn["wx"] == "undefined" ? 0 : _rtn["wx"],
                        y: typeof _rtn["wy"] == "undefined" ? 0 : _rtn["wy"],
                        z: typeof _rtn["wz"] == "undefined" ? 0 : _rtn["wz"],
                        width: typeof _rtn["ww"] == "undefined" ? 0 : _rtn["ww"],
                        height: typeof _rtn["wh"] == "undefined" ? 0 : _rtn["wh"]
                    }
                }
            } else {
                return null;
            }
        },
        setFrameMode: function (tag) {
            this.instance && this.instance.setFrameMode(tag);
        },
        release: function () {
            this.stop();
            if (this.instance) {
                this.instance.release();
                this.instance = null;
            }
        },
        getPids: function () {
            return this.playingChannel && this.isPlaying ? this.playingChannel.getAudioPids() : null;
        },
        toggleSubtitle: function () {
            if (this.playingChannel && this.isPlaying) {
                if (this.isOpenSubtitle) {
                    qin.subtitle.stop();
                    this.isOpenSubtitle = false;
                } else {
                    var result = qin.subtitle.start(this.playingChannel.frequency, this.playingChannel.serviceId);
                    this.isOpenSubtitle = result === 0 ? true : false;
                }
            }
        }
    };

    var TvMedia = new MediaPlayer({
        wx: 795,
        wy: 272,
        wz: 0,
        ww: 427,
        wh: 325,
        audioEnable: true,
        play: function (obj1, obj2, obj3) {
            if (obj1) {
                if (this.isLocked) {
                    this.isLocked = false;
                    broadcast_static_info('');
                }
                if (this.playingChannel && this.playingChannel !== obj1) {
                    Rec.stopTimeShift();
                }
                clearTimeout(this.timeshiftTimer);
                if (obj1.isLocked() && SysConfig.get('isLocked')) {
                    this.stop();
                    this.isLocked = true;
                    //broadcast_static_info('Channel is locked');
                } else {
                    this.isPlaying = true;
                    this.isOpenSubtitle = false;
                    this._getInstance().play(obj1, obj2, obj3);
                    /*this.timeshiftTimer = setTimeout(function () {
                     Broadcast.trigger('timeshift:start');
                     }, 3000);*/
                }
                jsf.ChannelManager.setShutdownChannel(obj1);
                this.playingChannel = obj1;
                jsf.EPG.requestSchedule(obj1, this.isPlaying);
                jsf.EPG.requestPF(obj1, this.isPlaying);
            } else if (this.isPlaying) {
                this.stop();
            }
        }
    });

    var PipMedia = new MediaPlayer({
        wx: 468,
        wy: 159,
        wz: 1,
        ww: 295,
        wh: 166,
        audioEnable: false,
        play: function (obj) {
            if (obj) {
                this.isPlaying = true;
                this._getInstance().play(obj)
            } else if (this.isPlaying) {
                this.stop();
            }
        }
    });

    function getSoundChannel() {
        var soundChannel = jsf.SysInfo.get('currentAudio') || 'stereo';
        if (TvMedia.instance && TvMedia.handle !== -1) {
            soundChannel = TvMedia.instance.getSoundTrack() || 'stereo';
        }
        return soundChannel;
    }

    function setSoundChannel(soundChannel) {
        if (soundChannel !== 'stereo' && soundChannel !== 'left' && soundChannel !== 'right') {
            soundChannel = 'stereo';
        }
        jsf.SysInfo.set('currentAudio', soundChannel);
        if (!TvMedia.instance || TvMedia.handle === -1) {
            return;
        }
        TvMedia.instance.setSoundTrack(soundChannel);
    }

    Broadcast.on('media:position', function (wx, wy, wz, ww, wh) {
        TvMedia.setPosition(wx, wy, wz, ww, wh);
    });
    Broadcast.on('media:play', function (type, obj1, obj2, obj3) {
        if (!obj1) {
            var channels = Live.getAll();
            var cursor = Live.getCurrentChannelIndex();
            var length = channels.length;
            if (length > 0) {
                obj1 = channels.get(cursor);
                obj2 = null;
                obj3 = null;
                if (length >= 3) {
                    obj2 = channels.get((cursor - 1 + length) % length);
                    obj3 = channels.get((cursor + 1) % length);
                } else if (length === 2) {
                    obj2 = channels.get((cursor + 1) % length);
                }
            } else {
                TvMedia.stop();
                return;
            }
        }
        TvMedia.play(obj1, obj2, obj3);
        Broadcast.trigger('tip:static:show');
    });
    Broadcast.on('media:pip', function (obj) {
        var channel = null;
        if (!obj) {
            var channels = Live.getAll();
            var cursor = Live.getCurrentChannelIndex();
            var length = channels.length;
            if (length > 0) {
                channel = channels.get(cursor);
            } else {
                PipMedia.stop();
                return;
            }
        } else {
            channel = obj;
        }
        PipMedia.play(channel);
    });
    Broadcast.on('media:stop:prevent', function () {
        TvMedia.stop(true);
        Broadcast.trigger('tip:static:hide');
        $('#portal-tip').css('display', 'none');
    });
    Broadcast.on('media:stop', function (type) {
        switch (type) {
            case 'pip':
                PipMedia.stop();
                break;
            default:
                TvMedia.stop();
                Broadcast.trigger('tip:static:hide');
                $('#portal-tip').css('display', 'none');
                break;
        }
    });
    Broadcast.on('media:audio', function (boolean) {
        TvMedia.audio(boolean);
    });
    Broadcast.on('media:release', function () {
        TvMedia.release();
    });
    Broadcast.on('media:volume', function (volume) {
        nowVolume = volume;
        TvMedia.setVolume(nowVolume);
    });
    Broadcast.on('media:subtitle:toggle', function (volume) {
        if (!TvMedia.instance || TvMedia.handle === -1 || !TvMedia.isPlaying) {
            return;
        }
        TvMedia.toggleSubtitle();
    });
    Broadcast.on('sound-channel:show', function (hideCallback) {
        var sound = getSoundChannel();
        var soundIndex = -1;
        if (sound === 'left') {
            soundIndex = 1;
        } else if (sound === 'right') {
            soundIndex = 2;
        } else {
            soundIndex = 0;
        }
        Broadcast.trigger('tip:setter:show', 'Audio', function (data, cursor) {
            hideCallback && hideCallback();
            setSoundChannel(data.value);
        }, soundIndex, [{
            name: 'Stereo',
            value: 'stereo'
        }, {
            name: 'Left',
            value: 'left'
        }, {
            name: 'Right',
            value: 'right'
        }]);
    });
    Broadcast.on('language:show', function (hideCallback, errorCallback) {
        if (!TvMedia.instance || TvMedia.handle === -1 || !TvMedia.isPlaying) {
            errorCallback && errorCallback();
            return;
        }
        if (TvMedia.playingChannel) {
            var pids = TvMedia.getPids();
            if (pids && pids.length > 0) {
                var array = [];
                jsf.each(pids, function (value, cursor) {
                    array.push('Audio ' + cursor + '(PCM)');
                });
                Broadcast.trigger('tip:setter:show', 'Multitracker', function (data, cursor) {
                    hideCallback && hideCallback();
                    TvMedia.instance.setAudioPid(data.audioDecodeType, data.pid);
                    TvMedia.audioIndex = cursor;
                }, 0, pids, array);
            }
        }
    });
    Broadcast.on('event:usb', function (eventName) {
        switch (eventName) {
            case jsf.EventSystem.USB_PLUGIN:
                if (TvMedia.playingChannel) {
                    clearTimeout(TvMedia.timeshiftTimer);
                    TvMedia.timeshiftTimer = setTimeout(function () {
                        Broadcast.trigger('timeshift:start');
                    }, 3000);
                }
                break;
            case jsf.EventSystem.USB_PLUGOUT:
                clearTimeout(TvMedia.timeshiftTimer);
                Rec.stopTimeShift();
                break;
        }
    });

    return {
        getHandle: function () {
            if (!TvMedia.instance || TvMedia.handle === -1) {
                TvMedia._getInstance();
            }
            return TvMedia.handle;
        },
        getSoundChannel: getSoundChannel,
        setSoundChannel: setSoundChannel,
        getVolume: function () {
            init_volume();
            return nowVolume;
        },
        setResolution: function (value) {
            var handle = this.getHandle();
            if (handle !== -1) {
                qin.player.set(handle, JSON.stringify({timingMode: value}));
            }
            jsf.SysInfo.set('timingMode', value);
        },
        setAspectRatio: function (value) {
            var handle = this.getHandle();
            if (handle !== -1) {
                qin.player.set(handle, JSON.stringify({aspectRatio: value}));
            }
            jsf.SysInfo.set('aspectRatio', value);
        },
        setAspectCVRS: function (value) {
            var handle = this.getHandle();
            if (handle !== -1) {
                qin.player.set(handle, JSON.stringify({aspectCVRS: value}));
            }
            jsf.SysInfo.set('aspectCVRS', value);
        },
        setPDIF: function (value) {
            var handle = this.getHandle();
            if (handle !== -1) {
                qin.player.set(handle, JSON.stringify({dolbyMode: value}));
            }
            jsf.SysInfo.set('dolbyMode', value);
        },
        getPlayingChannel: function () {
            return TvMedia.playingChannel;
        }
    };
});