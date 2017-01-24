/**
 * JSFEventExtension.js
 * @authors Casper 
 * @date    2015/09/15
 * @version 1.0.0
 */
/**
 * The type code of System event.
 * @constant
 * @type {number}
 */
jsf.Event.SYSTEM = 5;

/**
 * The system event
 * @class
 * @extends jsf.Event
 */
jsf.EventSystem = jsf.Event.extend( /** @lends jsf.EventSystem# */ {
  _eventType: 0,
  _eventName: false,
  _eventData: null,
  ctor: function(eventType, eventName, eventData) {
    jsf.Event.prototype.ctor.call(this, jsf.Event.SYSTEM);
    this._eventType = eventType;
    this._eventName = eventName;
    this._eventData = eventData;
  },

  /**
   * Gets system event type
   * @returns {*}
   */
  getEventType: function() {
    return this._eventType;
  },

  /**
   * Gets system event name
   * @returns {*}
   */
  getEventName: function() {
    return this._eventName;
  },

  /**
   * Gets system event data
   * @returns {*}
   */
  getEventData: function() {
    return this._eventData;
  },

  /**
   * Gets listener id
   * @returns {*}
   */
  _getListenerID: function() {
    return jsf.EventListenerSystem.LISTENER_ID;
  }
});

/**
 * The type code of custom event listener.
 * @constant
 * @type {number}
 */
jsf.EventListener.SYSTEM = 6;

jsf.EventListenerSystem = jsf.EventListener.extend({
  _onSystemEvent: null,
  ctor: function(eventType, callback) {
    this._eventType = eventType || null;
    this._onSystemEvent = callback;
    var selfPointer = this;
    var listener = function(event) {
      if (selfPointer._onSystemEvent === null || this._eventType !== event.getEventType()) return;
      selfPointer._onSystemEvent(event);
    };

    jsf.EventListener.prototype.ctor.call(this, jsf.EventListener.SYSTEM, jsf.EventListenerSystem.LISTENER_ID, listener);
  },

  checkAvailable: function() {
    return (jsf.EventListener.prototype.checkAvailable.call(this) && this._onSystemEvent !== null && this._eventType !== null);
  }
});

jsf.EventListenerSystem.LISTENER_ID = '__jsf_system';

jsf.EventListener.inject(jsf.EventListener.SYSTEM, function(argObj) {
  var listener = new jsf.EventListenerSystem(argObj.eventType, argObj.callback);
  delete argObj.eventType;
  delete argObj.eventName;
  delete argObj.callback;
  return listener;
}, jsf.EventListenerSystem.LISTENER_ID, function (description) {
  return description ? function (listener) {
    var eventType = description.eventType;
    if (!eventType || eventType === listener._eventType) return true;
    return false;
  } : null;
});

// Event
jsf.EventSystem.TYPE_UNKNOW = 'TYPE_UNKNOW';
// event type 1
jsf.EventSystem.TYPE_TUNER     = 'TYPE_TUNER';
jsf.EventSystem.TUNER_LOST     = 'DVB_TUNER_LOST';
jsf.EventSystem.TUNER_LOCKED   = 'DVB_TUNER_LOCKED';
jsf.EventSystem.TUNER_UNLOCKED = 'DVB_TUNER_UNLOCK';

jsf.EventSystem.TYPE_SCAN           = 'TYPE_SCAN';
jsf.EventSystem.SCAN_NIT_SUCCESS    = 'DVB_SCAN_NIT_SUCCESS';
jsf.EventSystem.SCAN_CURRENT        = 'DVB_SCAN_CURRENT';
jsf.EventSystem.SCAN_NIT_FAIL       = 'DVB_SCAN_NIT_FAIL';
jsf.EventSystem.SCAN_BAT_SUCCESS    = 'DVB_SCAN_BAT_SUCCESS';
jsf.EventSystem.SCAN_BAT_FAIL       = 'DVB_SCAN_BAT_FAIL';
jsf.EventSystem.SCAN_MOSAIC_SUCCESS = 'DVB_SCAN_MOSAIC_SUCCESS';
jsf.EventSystem.SCAN_MOSAIC_FAIL    = 'DVB_SCAN_MOSAIC_FAIL';
jsf.EventSystem.SCAN_SUCCESS        = 'DVB_SCAN_SUCCESS';
jsf.EventSystem.SCAN_FAIL           = 'DVB_SCAN_FAIL';
jsf.EventSystem.SCAN_PERCENT        = 'DVB_SCAN_PERCENT';
jsf.EventSystem.SCAN_FINISH         = 'DVB_SCAN_FINISH';
jsf.EventSystem.SCAN_PAT_CHANGE     = 'DVB_SCAN_PAT_CHANGE';

jsf.EventSystem.TYPE_TABLE       = 'TYPE_TABLE';
jsf.EventSystem.TABLE_NIT_CHANGE = 'DVB_NIT_CHANGE';
jsf.EventSystem.TABLE_BAT_CHANGE = 'DVB_BAT_CHANGE';

jsf.EventSystem.TYPE_CHANNEL           = 'TYPE_CHANNEL';
jsf.EventSystem.CHANNEL_NAME_CHANGED   = 'DVB_PROG_NAME_CHANGE';
jsf.EventSystem.CHANNEL_GROUP_CHANGE   = 'DVB_PROG_GROUP_CHANGE';
jsf.EventSystem.CHANNEL_PMTPID_CHANGED = 'DVB_PMTPID_CHANGE';
jsf.EventSystem.CHANNEL_LIST_CHANGE    = 'CHANNEL_LIST_CHANGE';

jsf.EventSystem.TYPE_EPG               = 'TYPE_EPG';
jsf.EventSystem.EPG_PF_ARRIVAL         = 'DVB_EPG_PF_ARRIVE';
jsf.EventSystem.EPG_PF_ARRIVAL_PRESENT = 'DVB_EPG_PF_ARRIVAL_PRESENT';
jsf.EventSystem.EPG_PF_ARRIVAL_FOLLOW  = 'DVB_EPG_PF_ARRIVAL_FOLLOW';
jsf.EventSystem.EPG_PF_CACHE           = 'DVB_EPG_PF_CACHE';
jsf.EventSystem.EPG_PF_FINISH          = 'DVB_EPG_PF_FINISH';
jsf.EventSystem.EPG_PF_FAIL            = 'DVB_EPG_PF_FAIL';
jsf.EventSystem.EPG_ARRIVAL            = 'DVB_EPG_ARRIVE';
jsf.EventSystem.EPG_FINISH             = 'DVB_EPG_FINISH';
jsf.EventSystem.EPG_CACHE              = 'DVB_EPG_CACHE';
jsf.EventSystem.EPG_FAIL               = 'DVB_EPG_FAIL';

jsf.EventSystem.TYPE_BOOKING         = 'TYPE_BOOKING';
jsf.EventSystem.BOOKING_PLAY_ARRIVE  = 'BOOKING_PLAY_ARRIVE';
jsf.EventSystem.BOOKING_POWER_ARRIVE = 'BOOKING_POWER_ARRIVE';
jsf.EventSystem.BOOKING_PVR_ARRIVE   = 'BOOKING_PVR_ARRIVE';
jsf.EventSystem.BOOKING_PVR_LEAVE    = 'BOOKING_PVR_LEAVE';
// event type 2
jsf.EventSystem.TYPE_MEDIAPLAYER                  = 'TYPE_MEDIAPLAYER';
jsf.EventSystem.MEDIAPLAYER_START_OK              = 'PLAYER_START_OK';
jsf.EventSystem.MEDIAPLAYER_START_ERROR           = 'PLAYER_START_ERROR';
jsf.EventSystem.MEDIAPLAYER_FINISH                = 'PLAYER_FINISH';
jsf.EventSystem.MEDIAPLAYER_ERROR                 = 'PLAYER_ERROR';
jsf.EventSystem.MEDIAPLAYER_BUFFERING_START       = 'PLAYER_BUFFERING_START';
jsf.EventSystem.MEDIAPLAYER_BUFFERING_PROGRESS    = 'PLAYER_BUFFERING_PROGRESS';
jsf.EventSystem.MEDIAPLAYER_BUFFERING_END         = 'PLAYER_BUFFERING_END';
jsf.EventSystem.MEDIAPLAYER_PLAYER_STREAM_END     = 'PLAYER_STREAM_END';
jsf.EventSystem.MEDIAPLAYER_PLAYER_TIMESHIFT_HEAD = 'PLAYER_TIMESHIFT_HEAD';
jsf.EventSystem.MEDIAPLAYER_PLAYER_TIMESHIFT_TAIL = 'PLAYER_TIMESHIFT_TAIL';
// event type 3
jsf.EventSystem.TYPE_OC    = 'TYPE_OC';
jsf.EventSystem.OC_PERCENT = 'OC_PERCENT';
jsf.EventSystem.OC_SUCCESS = 'OC_SUCCESS';
jsf.EventSystem.OC_FAIL    = 'OC_FAIL';

jsf.EventSystem.TYPE_APP           = 'TYPE_APP';
jsf.EventSystem.APP_DOWNLOAD_OK    = 'APP_DOWNLOAD_OK';
jsf.EventSystem.APP_DOWNLOAD_FAIL  = 'APP_DOWNLOAD_FAIL';
jsf.EventSystem.APP_UNINSTALL_OK   = 'APP_UNINSTALL_OK';
jsf.EventSystem.APP_UNINSTALL_FAIL = 'APP_UNINSTALL_FAIL';
jsf.EventSystem.APP_RUN_HTML       = 'APP_RUN_HTML';
jsf.EventSystem.APP_RUN_ENTER      = 'APP_RUN_ENTER';
jsf.EventSystem.APP_RUN_EXIT       = 'APP_RUN_EXIT';
// event type 4
jsf.EventSystem.TYPE_USB = 'TYPE_USB';
jsf.EventSystem.USB_PLUGIN         = 'LOCAL_USB_PLUGIN';
jsf.EventSystem.USB_PLUGOUT        = 'LOCAL_USB_PLUGOUT';
jsf.EventSystem.USB_FORMAT_SUCCESS = 'LOCAL_USB_FORMAT_SUCCESS';
jsf.EventSystem.USB_FORMAT_FAIL    = 'LOCAL_USB_FORMAT_FAIL';
jsf.EventSystem.USB_FORMAT_PREPARE = 'LOCAL_USB_FORMAT_PREPARE';
jsf.EventSystem.USB_PLUGIN_FIRST   = 'LOCAL_USB_PLUGINFIRST';
// event type 5
jsf.EventSystem.TYPE_PVR = 'TYPE_PVR';
jsf.EventSystem.PVR_REC_START_OK    = 'PVR_REC_START_OK';
jsf.EventSystem.PVR_REC_START_ERROR = 'PVR_REC_START_ERROR';
jsf.EventSystem.PVR_PREREC_ERROR    = 'PVR_PREREC_ERROR';
jsf.EventSystem.PVR_REC_ERROR       = 'PVR_REC_ERROR';
jsf.EventSystem.PVR_REC_DISKFULL    = 'PVR_REC_DISKFULL';
jsf.EventSystem.PVR_REC_OVER_FIX    = 'PVR_REC_OVER_FIX';
jsf.EventSystem.PVR_REC_REACH_PLAY  = 'PVR_REC_REACH_PLAY';
jsf.EventSystem.PVR_REC_STOP_ERROR  = 'PVR_REC_STOP_ERROR';
jsf.EventSystem.PVR_REC_STOP_OK     = 'PVR_REC_STOP_OK';
jsf.EventSystem.PVR_TIMESHFIT_READY = 'PVR_TIMESHFIT_READY';
jsf.EventSystem.PVR_PLAY_REACH_REC  = 'PVR_PLAY_REACH_REC';
jsf.EventSystem.PVR_REC_RESV        = 'PVR_REC_RESV';
jsf.EventSystem.PVR_BUY_SPACE_FULL  = 'PVR_BUY_SPACE_FULL';
// event type 6
jsf.EventSystem.TYPE_CA = 'TYPE_CA';
jsf.EventSystem.CA_CARD_PLUGOUT       = 'CA_CARD_PLUGOUT';
jsf.EventSystem.CA_CARD_PLUGIN        = 'CA_CARD_PLUGIN';
jsf.EventSystem.CA_BUYMESSGE_DISPLAY  = 'CA_BUYMESSGE_DISPLAY';
jsf.EventSystem.CA_BUYMESSGE_HIDE     = 'CA_BUYMESSGE_HIDE';
jsf.EventSystem.CA_FINGER_DISPLAY     = 'CA_FINGER_DISPLAY';
jsf.EventSystem.CA_FINGER_HIDE        = 'CA_FINGER_HIDE';
jsf.EventSystem.CA_ENTITLE_CHANGED    = 'CA_ENTITLE_CHANGED';
jsf.EventSystem.CA_ENTITLE_RECEIVED   = 'CA_ENTITLE_RECEIVED';
jsf.EventSystem.CA_SERVICE_LOCK       = 'CA_SERVICE_LOCK';
jsf.EventSystem.CA_SERVICE_UNLOCK     = 'CA_SERVICE_UNLOCK';
jsf.EventSystem.CA_ACTIONREQ          = 'CA_ACTIONREQ';
jsf.EventSystem.CA_SHOWPROGRESS       = 'CA_SHOWPROGRESS';
jsf.EventSystem.CA_IPPV_START         = 'CA_IPPV_START';
jsf.EventSystem.CA_IPPV_HIDE          = 'CA_IPPV_HIDE';
jsf.EventSystem.CA_FEEDING_REQ        = 'CA_FEEDING_REQ';
jsf.EventSystem.CA_OSD_DISPLAY        = 'CA_OSD_DISPLAY';
jsf.EventSystem.CA_OSD_HIDE           = 'CA_OSD_HIDE';
jsf.EventSystem.CA_EMAIL_HIDE         = 'CA_EMAIL_HIDE';
jsf.EventSystem.CA_EMAIL_NEW          = 'CA_EMAIL_NEW';
jsf.EventSystem.CA_EMAIL_EXHAUST      = 'CA_EMAIL_EXHAUST';
jsf.EventSystem.CA_CURTAIN_PROGRAM    = 'CA_CURTAIN_PROGRAM';
jsf.EventSystem.CA_FORMAT_HDD_PREPARE = 'CA_FORMAT_HDD_PREPARE';
// event type 8
jsf.EventSystem.TYPE_NVOD = 'TYPE_NVOD';
jsf.EventSystem.NVOD_NIT_FAIL     = 'NVOD_NIT_FAIL';
jsf.EventSystem.NVOD_FREQ_SUCCESS = 'NVOD_FREQ_SUCCESS';
jsf.EventSystem.NVOD_FREQ_FAIL    = 'NVOD_FREQ_FAIL';
jsf.EventSystem.NVOD_SUCCESS      = 'NVOD_SUCCESS';
jsf.EventSystem.NVOD_FAIL         = 'NVOD_FAIL';
// event type 9
jsf.EventSystem.TYPE_NETWORK = 'TYPE_NETWORK';
jsf.EventSystem.NETWORK_CONNECT_SUCCESS = 'NETWORK_CONNECT_SUCCESS';
jsf.EventSystem.NETWORK_CONNECT_FAIL = 'NETWORK_CONNECT_FAIL';
jsf.EventSystem.NETWORK_CONNECT_PLUGIN = 'NETWORK_CONNECT_PLUGIN';
jsf.EventSystem.NETWORK_CONNECT_PLUGOUT = 'NETWORK_CONNECT_PLUGOUT';
jsf.EventSystem.NETWORK_PING_SUCCESS = 'NETWORK_PING_SUCCESS';
jsf.EventSystem.NETWORK_PING_FAIL = 'NETWORK_PING_FAIL';
jsf.EventSystem.NETWORK_SCAN_AP_SUCCESS = 'NETWORK_SCAN_AP_SUCCESS';
jsf.EventSystem.NETWORK_SCAN_AP_FAIL = 'NETWORK_SCAN_AP_FAIL';
jsf.EventSystem.NETWORK_AP_OEPN_SUCCESS = 'AP_START_SUCCESS';
jsf.EventSystem.NETWORK_AP_OPEN_FAIL = 'AP_START_FAIL';
jsf.EventSystem.NETWORK_AP_CLOSE_SUCCESS = 'AP_STOP_SUCCESS';
jsf.EventSystem.NETWORK_AP_CLOSE_FAIL = 'AP_STOP_FAIL';
jsf.EventSystem.NETWORK_DHCP_SUCCESS = 'NETWORK_DHCP_SUCCESS';
jsf.EventSystem.NETWORK_DHCP_FAIL = 'NETWORK_DHCP_FAIL';
jsf.EventSystem.NETWORK_DATA_LINK_INVALID = 'NETWORK_DATA_LINK_INVALID';
// event type 10
jsf.EventSystem.TYPE_AD = 'TYPE_AD';
jsf.EventSystem.AD_FLYTEXT_ARRIVE    = 'AD_FLYTEXT_ARRIVE';
jsf.EventSystem.AD_FLYTEXT_REFRESH   = 'AD_FLYTEXT_REFRESH';
jsf.EventSystem.AD_PIC_REFRESH       = 'AD_PIC_REFRESH';
jsf.EventSystem.AD_UI_DELETE_ID      = 'AD_UI_DELETE_ID';
jsf.EventSystem.AD_CNSTICKER_DISPLAY = 'AD_CNSTICKER_DISPLAY';
jsf.EventSystem.AD_CNSADV_UPDATE     = 'AD_CNSADV_UPDATE';
// event type 11
jsf.EventSystem.TYPE_WIDGET = 'TYPE_WIDGET';
// event type 12
jsf.EventSystem.TYPE_OTA = 'TYPE_OTA';
jsf.EventSystem.OTA_UPGRADE = 'OTA_UPGRADE';
// event type 13
jsf.EventSystem.TYPE_APP_STORE = 'TYPE_APP_STORE';
jsf.EventSystem.CNS_APPS_TORE_UPDATE = 'CNS_APPSTORE_UPDATE';
// event type 14
jsf.EventSystem.TYPE_KEYBOARD = 'TYPE_KEYBOARD';

jsf._EventSystemBranchType = {
  1: function(type) {
    switch (type) {
      case jsf.EventSystem.TUNER_LOST:
      case jsf.EventSystem.TUNER_LOCKED:
      case jsf.EventSystem.TUNER_UNLOCKED:
        return jsf.EventSystem.TYPE_TUNER;
      case jsf.EventSystem.SCAN_NIT_SUCCESS:
      case jsf.EventSystem.SCAN_CURRENT:
      case jsf.EventSystem.SCAN_NIT_FAIL:
      case jsf.EventSystem.SCAN_BAT_SUCCESS:
      case jsf.EventSystem.SCAN_BAT_FAIL:
      case jsf.EventSystem.SCAN_MOSAIC_SUCCESS:
      case jsf.EventSystem.SCAN_MOSAIC_FAIL:
      case jsf.EventSystem.SCAN_SUCCESS:
      case jsf.EventSystem.SCAN_FAIL:
      case jsf.EventSystem.SCAN_PERCENT:
      case jsf.EventSystem.SCAN_FINISH:
      case jsf.EventSystem.SCAN_PAT_CHANGE:
        return jsf.EventSystem.TYPE_SCAN;
      case jsf.EventSystem.TABLE_NIT_CHANGE:
      case jsf.EventSystem.TABLE_BAT_CHANGE:
        return jsf.EventSystem.TYPE_TABLE;
      case jsf.EventSystem.CHANNEL_NAME_CHANGED:
      case jsf.EventSystem.CHANNEL_GROUP_CHANGE:
      case jsf.EventSystem.CHANNEL_PMTPID_CHANGED:
      case jsf.EventSystem.CHANNEL_LIST_CHANGE:
        return jsf.EventSystem.TYPE_CHANNEL;
      case jsf.EventSystem.EPG_PF_ARRIVAL:
      case jsf.EventSystem.EPG_PF_ARRIVAL_PRESENT:
      case jsf.EventSystem.EPG_PF_ARRIVAL_FOLLOW:
      case jsf.EventSystem.EPG_PF_CACHE:
      case jsf.EventSystem.EPG_PF_FINISH:
      case jsf.EventSystem.EPG_PF_FAIL:
      case jsf.EventSystem.EPG_ARRIVAL:
      case jsf.EventSystem.EPG_FINISH:
      case jsf.EventSystem.EPG_CACHE:
      case jsf.EventSystem.EPG_FAIL:
        return jsf.EventSystem.TYPE_EPG;
      case jsf.EventSystem.BOOKING_PLAY_ARRIVE:
      case jsf.EventSystem.BOOKING_POWER_ARRIVE:
      case jsf.EventSystem.BOOKING_PVR_ARRIVE:
      case jsf.EventSystem.BOOKING_PVR_LEAVE:
        return jsf.EventSystem.TYPE_BOOKING;
      default:
        return jsf.EventSystem.TYPE_UNKNOW;
    }
  },
  3: function(type) {
    switch (type) {
      case jsf.EventSystem.OC_PERCENT:
      case jsf.EventSystem.OC_SUCCESS:
      case jsf.EventSystem.OC_FAIL:
        return jsf.EventSystem.TYPE_OC;
      case jsf.EventSystem.APP_DOWNLOAD_OK:
      case jsf.EventSystem.APP_DOWNLOAD_FAIL:
      case jsf.EventSystem.APP_UNINSTALL_OK:
      case jsf.EventSystem.APP_UNINSTALL_FAIL:
      case jsf.EventSystem.APP_RUN_HTML:
      case jsf.EventSystem.APP_RUN_ENTER:
      case jsf.EventSystem.APP_RUN_EXIT:
        return jsf.EventSystem.TYPE_APP;
      default:
        return jsf.EventSystem.TYPE_UNKNOW;
    }
  }
};

jsf._EventSystemUniqueType = {
  2: jsf.EventSystem.TYPE_MEDIAPLAYER,
  4: jsf.EventSystem.TYPE_USB,
  5: jsf.EventSystem.TYPE_PVR,
  6: jsf.EventSystem.TYPE_CA,
  8: jsf.EventSystem.TYPE_NVOD,
  9: jsf.EventSystem.TYPE_NETWORK,
  10: jsf.EventSystem.TYPE_AD,
  11: jsf.EventSystem.TYPE_WIDGET,
  12: jsf.EventSystem.TYPE_OTA,
  13: jsf.EventSystem.TYPE_APP_STORE,
  14: jsf.EventSystem.TYPE_KEYBOARD
};

jsf.__getEventSystemType = function(eventType, eventName) {
  var type = jsf._EventSystemUniqueType[eventType];
  if (type) return type;
  var func = jsf._EventSystemBranchType[eventType];
  if (func) return func(eventName);
  return jsf.EventSystem.TYPE_UNKNOW;
};