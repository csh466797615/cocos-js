/**
 * JSFChannel.js
 * @authors Casper 
 * @date    2016/07/04
 * @version 1.0.0
 */
/**
 * Used to describe a channel information.
 * @requires jsf.SysInfo, jsf.Setting
 */
(function () {
  'use strict';
  /**
   * The type of channel.
   * @constant
   * @type {Number}
   */
  var Types = {
    TYPE_ALL: 'all',
    TYPE_TV: 1,
    TYPE_SKTV: 129,
    TYPE_HDTV: 128,
    TYPE_RADIO: 2,
    TYPE_DATA_BROADCAST: 12
  };
  var BouquetIds = {
    BOUQUET_CENTRAL: 801,//中央台
    BOUQUET_FJ: 802,//福建台
    BOUQUET_FZ: 803,//福州台
    BOUQUET_LOCAL: 804,//地方卫视
    BOUQUET_SH_MEDIA: 805,//上海文广
    BOUQUET_DTV_MEDIA: 806,//中数传媒
    BOUQUET_HC_FILM_TV: 807,//华诚影视
    BOUQUET_PO_EC_NEWS: 808,//新闻政治经济
    BOUQUET_SPORT: 809,//体育竞技
    BOUQUET_ENTER_VARIETY: 810,//娱乐综艺
    BOUQUET_MOVIE_THEATER: 811,//影视剧场
    BOUQUET_SC_HU_GEO: 812,//科教人文地理
    BOUQUET_HDTV: 813,//高清电视节目
    BOUQUET_GRAPHIC: 814,//图文频道
    BOUQUET_DATA_BROADCAST: 815,//数据广播
    BOUQUET_LEISURE_LIFE: 816,//生活休闲
    BOUQUET_OLDER_CHILDREN: 817//老年少儿
  };

  /**
   * The mthods of jsf.Channel.
   * @constant
   * @type {Function}
   */
  var Methods = {
    create: create__instance
  };

  /**
   * Sets a property from  a key-vlaue data for obj.
   * @param  {Object} obj
   * @param  {*} value
   * @param  {String} key
   */
  function setter__get_info_from_data (obj, value, key) {
    obj['_' + key] = value;
  }

  /**
   * Create a jsf.Channel instance.
   * @param {Number} frequency
   * @param {Number} networkId
   * @param {Number} tsId
   * @param {Number} serviceId
   * @return {jsf.Channel|null}
   */
  function create__instance (frequency, networkId, tsId, serviceId) {
    return jsf.ChannelManage.getChannelByUnique(frequency, networkId, tsId, serviceId);
  }

  function setter__set_channel_peoperty_to_db (channel, key, value) {
    qin.data.set('program', 'update program set ' + key + '=' + (jsf.isString(value) ? '"' + value + '"': value) + ' WHERE serviceId=' + channel.serviceId + ' and networkId=' + channel.networkId + ' and tsId=' + channel.tsId);
    jsf.eventManager.dispatchCustomEvent('channel_property_changed', {
      channel: channel,
      key: key,
      value: value
    });
  }

  /**
   * Description of a channel information.
   * @class
   * @extends jsf.Class
   */
  var JSFChannel = jsf.Class.extend({
    ctor: function (data) {
      jsf.each(data, (function (value, key) {
        setter__get_info_from_data(this, value, key);
      }).bind(this));
    },
    _reset: function (data) {
      this.ctor(data);
    },
    isLocked: function () {
      return !!this._lock;
    },
    setLock: function (isLocked) {
      isLocked = !!isLocked ? 1 : 0;
      if (isLocked !== this._lock) {
        this._lock = isLocked;
        setter__set_channel_peoperty_to_db(this, 'lock', this._lock);
      }
    },
    isFav: function () {
      return !!this._favor;
    },
    setFav: function (fav) {
      fav = !!fav ? 1 : 0;
      if (fav !== this._favor) {
        this._favor = fav;
        setter__set_channel_peoperty_to_db(this, 'favor', this._favor);
      }
    },
    isHide: function () {
      return !!this.userHide;
    },
    setHide: function (hide) {
      hide = !!hide ? 1 : 0;
      if (hide !== this._userHide) {
        this._userHide = hide;
        setter__set_channel_peoperty_to_db(this, 'userHide', this._userHide);
      }
    },
    getAudioPids: function () {
      var audioPids = [];
      var sql = 'select * from program_stream where indexProgram=' + this.id + ' order by audioIndex asc';
      try {
        var data = JSON.parse(qin.data.query('program', sql));
        if (data.length > 0) {
          for (var i = 0, j = data.length; i < j; i++) {
            audioPids.push({
              id: data[i].audioIndex,
              name: data[i].language,
              pid: data[i].pid,
              audioDecodeType: data[i].streamType
            });
          }
        }
      } catch (e) {
        jsf.log.w(e + '(getAudioPids)');
      }
      return audioPids;
    }
  });
  var channelPrototype = JSFChannel.prototype;

  var __temp;
  jsf.each({
    name: {value: '', transform: function () {return this._nName ? this._nName : this._name;}},
    type: {value: 0},
    tunerType: {value: ''},
    id: {value: 0, aliase: 'indexProgram'},
    logicNumber: {value: 0, aliase: 'logicId'},
    frequency: {value: 0},
    serviceId: {value: 0},
    tsId: {value: 0},
    networkId: {value: 0},
    symbolRate: {value: 0},
    modulation: {value: ''},
    number: {value: 0},
    videoPID: {value: 0},
    audioPID: {value: 0, aliase: 'pid'},
    pcrPID: {value: 0, aliase: 'pcrPID'},
    pmtPID: {value: 0},
    videoDecodeType: {value: '', aliase: 'videoStreamType'},
    audioDecodeType: {value: '', aliase: 'streamType'},
    isFree: {value: false, aliase: 'freeca', transform: function () {return !!this._freeca;}},
    satelliteId: {value: 0},
    TPType: {value: 0},
    playUrl: {value: '', transform: function () {return 'dvbc://' + this._networkId + '.' + this._tsId + '.' + this._serviceId;}},
    isTimeShift: {value: false, transform: function () {return !!this._timeShift;}},
    status: {value: 0},
    autoHide: {value: 0},
    userHide: {value: 0},
    soundChannel: {value: ''},
    volume: {value: 0, private: true},
    lock: {value: 0, private: true},
    favor: {value: 0, private: true}
  }, function (prop, propName) {
    __temp = '_' + (prop.aliase || propName);
    jsf.defineValue(channelPrototype, __temp, prop.value);
    (!prop.private || prop.aliase) && jsf.defineGetterSetter(channelPrototype, propName, jsf.createPropAssigner(__temp, prop.transform));
  });

  jsf.defineReadOnlyProperties(JSFChannel, Types);
  jsf.defineReadOnlyProperties(JSFChannel, Methods);
  jsf.defineReadOnlyProperties(JSFChannel, BouquetIds);

  jsf.Channel = JSFChannel;
}());