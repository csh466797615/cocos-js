/**
 * Created by zhangzhijiang on 2015/2/10.
 */
jsf.MediaPlayer = JSFMediaPlayer.extend({
    handle: null,
    /*play：正在播放
     stop：已停止播放
     pause：暂停播放
     forward：正在快进
     backward：正在快退
     */
    playStatus: "stop",
    _cb: null,
    _success: 1,
    _fail: 0,
    _playerSpeed: 0,
    _instance: false,
    init: function () {
        this.handle = null;
        this.playStatus = "stop";
        this._cb = null;
        this._playerSpeed = 0;
        this._instance = false;
    },
    release: function () {
        if (this._instance) {
            var _rtn = qin.player.destroy(this.handle);
            if (_rtn == 0) {
                this.init();
                return this._success;
            }
        }
        return this._fail;
    },
    /**
     *
     * @param arguments[0]
     */
    play: function () {
        if (this._instance) {
            var _playUrl = null, _rtn = -1;
            if (typeof arguments[0] == "string") {
                if (arguments[0].indexOf("dvb://") > -1) { //eg.dvb://OriginalNetworkId.TS_Id.ServiceId
                    //TODO
                    _playUrl = {"url": arguments[0]};
                } else if (arguments[0].indexOf("deliver://") > -1) {//eg.deliver://Frequency.SymbolRate.Modulation.ServiceId
                    //TODO
                    _playUrl = {"url": arguments[0]};
                } else if (arguments[0].indexOf("http://") > -1) {//eg.http://ip:port/xx.wma
                    _playUrl = {"type": "http", "url": arguments[0].replace("http://", "")};
                } else if (arguments[0].indexOf("https://") > -1) {//eg.https://ip:port/xx.wma
                    _playUrl = {"type": "https", "url": arguments[0].replace("https://", "")};
                } else if (arguments[0].indexOf("file:///") > -1) {//eg.file:///mnt/sda1/xx.mp3
                    _playUrl = {"type": "file", "url": arguments[0].replace("file://", "")};
                } else if (arguments[0].indexOf("/") > -1) {//eg./mnt/sda1/xx.mp3
                    _playUrl = {"type": "file", "url": arguments[0]};
                    if (arguments[1]) {
                        for (var key in arguments[1]) {
                            _playUrl[key] = arguments[1][key];
                        }
                    }
                } else if (arguments[0].indexOf("rtsp://") > -1) {//eg.rtsp://192.168.2.1/xxx.ts
                    //TODO
                    _playUrl = {"url": arguments[0]};
                }
            } else if (jsf.Channel && arguments[0] instanceof jsf.Channel) {
                var _urlArr = [];
                for (var i = 0; i < 3 && i < arguments.length; i++) {
                    if (arguments[i] instanceof jsf.Channel) {
                        _urlArr.push({
                            "frequency": arguments[i].frequency,
                            "symbolRate": arguments[i].symbolRate,
                            "modulation": arguments[i].modulation,
                            "serviceId": arguments[i].serviceId,
                            "tsId": arguments[i].tsId,
                            "audioPID": arguments[i].audioPID,
                            "videoPID": arguments[i].videoPID,
                            "videoDecodeType": arguments[i].videoDecodeType,
                            "audioDecodeType": arguments[i].audioDecodeType,
                            "pcrPID": arguments[i].pcrPID,
                            "programType": arguments[i].type
                        });
                    }
                }
                _playUrl = {
                    "type": arguments[0].tunerType,
                    "url": _urlArr
                    /*,
                     "soundChannel": "left",
                     "volume": 15*/
                };
            }
            if (_playUrl != null) {
                _playUrl.soundChannel = jsf.SysInfo.get('currentAudio') || 'stereo';
                _rtn = qin.player.start(this.handle, JSON.stringify(_playUrl));
                if (_rtn == 0) {
                    jsf.log.i("[MediaPlayer]Play Success!! Handle: " + this.handle + ",Url:" + JSON.stringify(_playUrl));
                    this.playStatus = "play";
                    return this._success;
                }
            } else {
                jsf.log.e("[MediaPlayer]play url is null!");
            }
        }
        jsf.log.e("[MediaPlayer]Play Failed!! Handle: " + this.handle);
        return this._fail;
    },
    stop: function () {
        if (this._instance) {// && this.playStatus === "play" //the playStatus can't be used in 'bind' status.
            jsf.log.d("[MediaPlayer]play stop");
            var _rtn = qin.player.stop(this.handle);
            if (_rtn == 0) {
                this.playStatus = "stop";
                return this._success;
            }
        }
        return this._fail;
    },
    pause: function () {
        if (this._instance && this.playStatus === "play") {
            var _rtn = qin.player.pause(this.handle);
            if (_rtn == 0) {
                this.playStatus = "pause";
                return this._success;
            }
        }
        return this._fail;
    },
    resume: function () {
        if (this._instance && (this.playStatus === "pause" || this.playStatus === "forward" || this.playStatus === "backward")) {
            var _rtn = qin.player.resume(this.handle);
            if (_rtn == 0) {
                this.playStatus = "play";
                return this._success;
            }
        }
        return this._fail;
    },
    _forwardBackward: function (_speed) {
        if (this._instance && (this.playStatus === "play" || this.playStatus === "forward" || this.playStatus === "backward")) {
            var _rtn = -1; //, _tempSpeed = this._playerSpeed + _speed;
            _speed = Number(_speed);
            if (_speed > 0) {
                _rtn = qin.player.forward(this.handle, _speed);
                this.playStatus = "forward";
                this._playerSpeed = _speed;
            } else if (_speed < 0) {
                _rtn = qin.player.backward(this.handle, _speed);
                this.playStatus = "backward";
                this._playerSpeed = _speed;
            } else if (_speed == 1 && (this.playStatus === "forward" || this.playStatus === "backward")) {
                _rtn = this.resume();
                if (_rtn == this._success) {
                    this.playStatus = "play";
                    this._playerSpeed = 1;

                }
                return _rtn;
            }
            if (_rtn == 0) {
                //this.playStatus = "resume";
                //this._playerSpeed = _tempSpeed;
                return this._success;
            }
        }
        return this._fail;
    },
    forward: function (_speed) {
        return this._forwardBackward(_speed);
    },
    backward: function (_speed) {
        return this._forwardBackward(_speed);
    },
    seek: function (_seconds) {
        if (!this._instance || isNaN(_seconds) || _seconds < 0)
            return this._fail;
        if (this.playStatus === "play") {
            var _rtn = qin.player.seek(this.handle, Number(_seconds));
            if (_rtn == 0) {
                //this.playStatus = "pause";
                return this._success;
            }
        }
        return this._fail;
    },
    clearFrame: function () {
        if (this._instance) {
            var _rtn = qin.player.set(this.handle, JSON.stringify({"clearLastFrame": true}));
            if (_rtn == 0) {
                return this._success;
            }
        }
        return this._fail;
    },
    getCurrentPlayTime: function () {
        if (this._instance) {
            var _rtn = qin.player.get(this.handle, ["position"]);
            if (_rtn != "" && _rtn != null) {
                _rtn = JSON.parse(_rtn);
                if (_rtn && typeof _rtn["position"] != "undefined") {
                    return _rtn["position"];
                }
            }
        }
        return 0;
    },
    getMute: function () {
        if(this._instance){
            var _rtn=jsf.Setting.getEnv("JSF_GLOBAL_MUTE");
            if(_rtn !=""&&_rtn!=null){
                return _rtn;
            }
        }
        return 0;
    },
    setMute: function (_isMute) {
        if (this._instance) {
            var _rtn = 0;
            if (_isMute && _isMute != "false") {
                _rtn = qin.player.mute(this.handle);
            } else {
                _rtn = qin.player.unmute(this.handle);
            }
            if (_rtn == 0) {
                return this._success;
            }
        }
        return this._fail;
    },
    getSoundTrack: function () {
        if (this._instance) {
            var _rtn = qin.player.get(this.handle, ["soundChannel"]);
            if (_rtn != "" && _rtn != null) {
                _rtn = JSON.parse(_rtn);
                if (_rtn && typeof _rtn["soundChannel"] != "undefined") {
                    return _rtn["soundChannel"];
                }
            }
        }
        return null;
    },
    setSoundTrack: function (_track) {
        if (this._instance && _track) {
            var _trackArr = [jsf.MediaPlayer.SOUNDTRACK_STEREO, jsf.MediaPlayer.SOUNDTRACK_LEFT, jsf.MediaPlayer.SOUNDTRACK_RIGHT, jsf.MediaPlayer.SOUNDTRACK_MIX];
            var _rtn = -1;
            for (var i = 0, j = _trackArr.length; i < j; i++) {
                if (_track === _trackArr[i]) {
                    _rtn = qin.player.set(this.handle, JSON.stringify({"soundChannel": _track}));
                    return this._success;
                }
            }
            jsf.log.e("[MediaPlayer]The arguments is invalid, when setting the SoundTrack!");
        }
        return this._fail;
    },
    getAudioType: function () {//{"audioStreamType":{"audioStreamType":"","pid":58256}}
        if (this._instance) {
            var _rtn = qin.player.get(this.handle, ["soundTrack"]);
            if (_rtn != "" && _rtn != null) {
                _rtn = JSON.parse(_rtn);
                if (_rtn && typeof _rtn["audioStreamType"] != "undefined" && typeof _rtn["audioStreamType"]["audioStreamType"] != "undefined") {
                    return _rtn["audioStreamType"]["audioStreamType"];
                }
            }
        }
        return null;
    },
    setAudioType: function (_type) {
        if (this._instance && _type) {
            //TODO qin.player.set (1,{”soundTrack”:{ ”audioStreamType”:”mpeg1”, ”pid”:34}});
            var _rtn = qin.player.set(this.handle, JSON.stringify({"audioStreamType": {"audioStreamType": _type}}));
            if (_rtn == 0) {
                return this._success;
            }
        }
        return this._fail;
    },
    getVolume: function () {
        if (this._instance) {
            var _rtn = qin.player.get(this.handle, ["volume"]);
            if (_rtn != "" && _rtn != null) {
                _rtn = JSON.parse(_rtn);
                if (_rtn && typeof _rtn["volume"] != "undefined") {
                    return _rtn["volume"];
                }
            }
        }
        return null;
    },
    setVolume: function (_volume) {
        jsf.log.d("[MediaPlayer]setVolume=" + _volume);
        if (this._instance && !isNaN(_volume)) {
            var _rtn = qin.player.set(this.handle, JSON.stringify({"volume": Number(_volume)}));
            if (_rtn == 0) {
                return this._success;
            }
        }
        return this._fail;
    },
    getSubtitle: function () {
        if (this._instance) {
            return qin.subtitle.getSubtitleStatus(this.handle) == 1 ? true : false;
        }
        return null;
    },
    setSubtitle: function (_isEnable) {
        if (this._instance) {
            var _subittleStatus = this.getSubtitle(), _rtn = -1;
            if (_isEnable && !_subittleStatus) {
                _rtn = qin.subtitle.enableSubtitle(this.handle);
            } else if (!_isEnable && _subittleStatus) {
                _rtn = qin.subtitle.disableSubtitle(this.handle);
            }
            if (_rtn == 0) {
                return this._success;
            }
        }
        return this._fail;
    },
    getPosition: function () {
        if (this._instance) {
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
        }
        return null;
    },
    setPosition: function (_x, _y, _z, _width, _height) {
        jsf.log.d("[MediaPlayer]setPosition:" + JSON.stringify({
            "wx": _x ? Number(_x) : 0,
            "wy": _y ? Number(_y) : 0,
            "wz": _z ? Number(_z) : 0,
            "ww": _width ? Number(_width) : 0,
            "wh": _height ? Number(_height) : 0
        }));
        if (this._instance) {
            var _rtn = qin.player.set(this.handle, JSON.stringify({
                "wx": _x ? Number(_x) : 0,
                "wy": _y ? Number(_y) : 0,
                "wz": _z ? Number(_z) : 0,
                "ww": _width ? Number(_width) : 0,
                "wh": _height ? Number(_height) : 0
            }));
            if (_rtn == 0) {
                return this._success;
            }
        }
        return this._fail;
    },
    getFullScreen: function () {
        //TODO
    },
    setFullScreen: function () {
        //TODO
    },
    getFrameMode: function () {
        if (this._instance) {
            var _rtn = qin.player.get(this.handle, ["lastFrame"]);
            if (_rtn != "" && _rtn != null) {
                _rtn = JSON.parse(_rtn);
                if (_rtn && typeof _rtn["lastFrame"] != "undefined") {
                    return _rtn["lastFrame"];
                }
            }
        }
        return null;
    },
    setFrameMode: function (_isKeep) {
        if (this._instance) {
            //todo 由于porting与中间件没实现getFrameMode，所以暂修改为不作判断
            var _frameStatus = "black", _rtn = -1;//, _frameMode = this.getFrameMode();
            if (_isKeep) {
                _frameStatus = "static";
            }
            //if (_frameMode != _frameStatus) {
            _rtn = qin.player.set(this.handle, JSON.stringify({"lastFrame": _frameStatus}));
            /*} else {
             jsf.log.i("[MediaPlayer]The frameMode is the same!");
             _rtn = 0;
             }*/
            if (_rtn == 0) {
                return this._success;
            }
        }
        return this._fail;
    },
    getAspectRatio: function () {
        if (this._instance) {
            var _rtn = qin.player.get(this.handle, ["aspectRatio"]);
            if (_rtn != "" && _rtn != null) {
                _rtn = JSON.parse(_rtn);
                if (_rtn && typeof _rtn["aspectRatio"] != "undefined") {
                    return _rtn["aspectRatio"];
                }
            }
        }
        return null;
    },
    setAspectRatio: function (_mode) {
        if (this._instance && _mode) {
            var _rtn = -1, _aspectRatio = this.getAspectRatio();
            var _valueArr = [jsf.MediaPlayer.ASPECTRATIO_4_3, jsf.MediaPlayer.ASPECTRATIO_16_9, jsf.MediaPlayer.ASPECTRATIO_221_1, jsf.MediaPlayer.ASPECTRATIO_AUTO, jsf.MediaPlayer.ASPECTRATIO_SQUARE];
            if (_valueArr.contains(_mode)) {
                if (_mode != _aspectRatio) {
                    _rtn = qin.player.set(this.handle, JSON.stringify({"aspectRatio": _mode}));
                } else {
                    jsf.log.i("[MediaPlayer]The AspectRatio is the same!");
                    _rtn = 0;
                }
            } else {
                jsf.log.e("[MediaPlayer]The arguments is invalid, when setting the AspectRatio!");
            }
            if (_rtn == 0) {
                return this._success;
            }
        }
        return this._fail;
    },
    getAspectMatch: function () {
        if (this._instance) {
            var _rtn = qin.player.get(this.handle, ["aspectCVRS"]);
            if (_rtn != "" && _rtn != null) {
                _rtn = JSON.parse(_rtn);
                if (_rtn && typeof _rtn["aspectCVRS"] != "undefined") {
                    return _rtn["aspectCVRS"];
                }
            }
        }
        return null;
    },
    setAspectMatch: function (_mode) {
        if (this._instance && _mode) {
            var _rtn = -1, _aspectMatch = this.getAspectMatch();
            var _valueArr = [jsf.MediaPlayer.ASPECTMATCH_AUTO, jsf.MediaPlayer.ASPECTMATCH_LETTERBOX, jsf.MediaPlayer.ASPECTMATCH_PANSCAN, jsf.MediaPlayer.ASPECTMATCH_COMBINED];
            if (_valueArr.contains(_mode)) {
                if (_mode != _aspectMatch) {
                    _rtn = qin.player.set(this.handle, JSON.stringify({"aspectCVRS": _mode}));
                } else {
                    jsf.log.i("[MediaPlayer]The AspectMatch is the same!");
                    _rtn = 0;
                }
            } else {
                jsf.log.e("[MediaPlayer]The arguments is invalid, when setting the AspectMatch!");
            }
            if (_rtn == 0) {
                return this._success;
            }
        }
        return this._fail;
    },
    getAudioPid: function () {//{"audioStreamType":{"audioStreamType":"","pid":58256}}
        if (this._instance) {
            var _rtn = qin.player.get(this.handle, ["soundTrack"]);
            if (_rtn != "" && _rtn != null) {
                _rtn = JSON.parse(_rtn);
                if (_rtn && typeof _rtn["audioStreamType"] != "undefined" && typeof _rtn["audioStreamType"]["pid"] != "undefined") {
                    return _rtn["audioStreamType"]["pid"];
                }
            }
        }
        return null;
    },
    setAudioPid: function (_audioDecodeType, _pid) {
        if (this._instance && arguments.length == 2) {
            //TODO qin.player.set (1,{”soundTrack”:{ ”audioStreamType”:”mpeg1”, ”pid”:34}});
            var _rtn = qin.player.set(this.handle, JSON.stringify({
                "soundTrack": {
                    "audioStreamType": _audioDecodeType,
                    "pid": _pid
                }
            }));
            jsf.log.d("[MediaPlayer]setAudioPid is:" + JSON.stringify({
                "soundTrack": {
                    "audioStreamType": _audioDecodeType,
                    "pid": _pid
                }
            }));
            if (_rtn == 0) {
                return this._success;
            }
        }
        return this._fail;
    },
    /**
     * 设置视频的开启或关闭
     * @param _isEnable
     * @returns {number}
     */
    setVideoEnable: function (_isEnable) {
        if (this._instance) {
            var _rtn = qin.player.set(this.handle, JSON.stringify({"videoEnable": _isEnable ? 1 : 0}));
            jsf.log.d("[MediaPlayer]setVideoEnable is:" + _isEnable + ",and the return value is:" + _rtn);
            if (_rtn == 0) {
                return this._success;
            }
        }
        return this._fail;
    },
    /**
     * 获取静音状态
    */
    getMuteStatus:function(){
        if (this._instance) {
            var _rtn = qin.player.get(this.handle, ["muteStatus"]);
            if (_rtn != "" && _rtn != null) {
                jsf.log.d("[MUTE TEST]******** muteStatus _rtn=" + _rtn);
                _rtn = JSON.parse(_rtn);
                if (_rtn && typeof _rtn["muteStatus"] != "undefined") {
                    jsf.log.d("[MUTE TEST]******** muteStatus not undefined");
                    return _rtn["muteStatus"];
                }
            }
        }
        return null;
    },
    listener: function (_callback) {
        this._cb = _callback;
        this._listener && this.removeListener();
        this._listener = jsf.Event.addEventListener(jsf.Event.TYPE_MEDIAPLAYER, _callback, this);
    },
    removeListener: function () {
        this._listener && jsf.eventManager.removeListener(this._listener);
        this._listener = null;
    }
});

Object.defineProperty(jsf.MediaPlayer.prototype,'duration',{
    get:function(){
        if (this._instance) {
            var _rtn = qin.player.get(this.handle, ["duration"]);
            if (_rtn != "" && _rtn != null) {
                _rtn = JSON.parse(_rtn);
                if (_rtn && typeof _rtn["duration"] != "undefined") {
                    return _rtn["duration"];
                }
            }
        }
        return 0;
    }
});

//create 的具体实现
jsf.MediaPlayer.create = function (_handle) {
    var _mpTemp = null;
    if (typeof _handle != "undefined") {
        _mpTemp = new jsf.MediaPlayer();
        _mpTemp._instance = true;
        _mpTemp.handle = _handle;
    } else {
        var _paramJson = {'wx': 0, 'wy': 0, 'wz': 0, 'ww': 1280, 'wh': 720, 'audioEnable': 1};
        var _handleTmp = qin.player.create(JSON.stringify(_paramJson));
        if (_handleTmp != -1) {
            _mpTemp = new jsf.MediaPlayer();
            _mpTemp._instance = true;
            _mpTemp.handle = _handleTmp;
        }
    }
    return _mpTemp;
};
/**
 * @param _handle
 */
jsf.MediaPlayer.bind = function (_handle) {
    if (typeof _handle != "undefined" && null != _handle && "" != _handle) {
        return jsf.MediaPlayer.create(_handle);
    } else {
        jsf.log.e("[MediaPlayer]Invalid arguments, when binding the handle!");
        return null;
    }
},
/**
 *
 * @type {string}
 */
    jsf.MediaPlayer.SOUNDTRACK_STEREO = "stereo";
jsf.MediaPlayer.SOUNDTRACK_LEFT = "left";
jsf.MediaPlayer.SOUNDTRACK_RIGHT = "right";
jsf.MediaPlayer.SOUNDTRACK_MIX = "mix";

jsf.MediaPlayer.ASPECTRATIO_4_3 = "4/3";
jsf.MediaPlayer.ASPECTRATIO_16_9 = "16/9";
jsf.MediaPlayer.ASPECTRATIO_221_1 = "221/1";
jsf.MediaPlayer.ASPECTRATIO_AUTO = "auto";
jsf.MediaPlayer.ASPECTRATIO_SQUARE = "square";

jsf.MediaPlayer.ASPECTMATCH_AUTO = "auto";
jsf.MediaPlayer.ASPECTMATCH_LETTERBOX = "letterbox";
jsf.MediaPlayer.ASPECTMATCH_PANSCAN = "panscan";
jsf.MediaPlayer.ASPECTMATCH_COMBINED = "combined";

//Event
jsf.Event.MEDIAPLAYER_START_OK = "PLAYER_START_OK";
jsf.Event.MEDIAPLAYER_START_ERROR = "PLAYER_START_ERROR";
jsf.Event.MEDIAPLAYER_FINISH = "PLAYER_FINISH";
jsf.Event.MEDIAPLAYER_ERROR = "PLAYER_ERROR";
jsf.Event.MEDIAPLAYER_BUFFERING_START = "PLAYER_BUFFERING_START";
jsf.Event.MEDIAPLAYER_BUFFERING_PROGRESS = "PLAYER_BUFFERING_PROGRESS";
jsf.Event.MEDIAPLAYER_BUFFERING_END = "PLAYER_BUFFERING_END";
jsf.Event.MEDIAPLAYER_PLAYER_STREAM_END = "PLAYER_STREAM_END";
jsf.Event.MEDIAPLAYER_PLAYER_TIMESHIFT_HEAD = "PLAYER_TIMESHIFT_HEAD";
jsf.Event.MEDIAPLAYER_PLAYER_TIMESHIFT_TAIL = "PLAYER_TIMESHIFT_TAIL";