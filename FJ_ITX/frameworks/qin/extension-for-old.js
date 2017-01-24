/**
 * extension-for-old.js
 * @authors Casper 
 * @date    2016/07/04
 * @version 1.0.0
 */
var JSFClass = jsf.Class.extend({
  ctor: function (data) {
    this.init && this.init(data);
  }
});

jsf.log.i = jsf.info;
jsf.log.w = jsf.warn;
jsf.log.d = jsf.log;
jsf.log.e = jsf.error;

/**
 * Constant of EventType
 */
jsf.Event.TYPE_KEYBOARD = "TYPE_KEYBOARD";
jsf.Event.TYPE_EPG = "TYPE_EPG";
jsf.Event.TYPE_SCAN = "TYPE_SCAN";
jsf.Event.TYPE_MEDIAPLAYER = "TYPE_MEDIAPLAYER";
jsf.Event.TYPE_CHANNEL = "TYPE_CHANNEL";
jsf.Event.TYPE_OC = "TYPE_OC";
jsf.Event.TYPE_PVR = "TYPE_PVR";
jsf.Event.TYPE_CA = "TYPE_CA";
jsf.Event.TYPE_NVOD = "TYPE_NVOD";
jsf.Event.TYPE_AD = "TYPE_AD";
jsf.Event.TYPE_USB = "TYPE_USB";
jsf.Event.TYPE_APP = "TYPE_APP";
jsf.Event.TYPE_NETWORK = "TYPE_NETWORK";
jsf.Event.TYPE_WIDGET = "TYPE_WIDGET";
jsf.Event.TYPE_UNKNOW = "TYPE_UNKNOW";
jsf.Event.TYPE_TUNER = "TYPE_TUNER";
jsf.Event.TYPE_OTA = "TYPE_OTA";
jsf.Event.TYPE_BOOKING = "TYPE_BOOKING";
jsf.Event.TYPE_APP_STORE = "TYPE_APP_STORE";

jsf.Event.addEventListener = function (type, callback, context) {
  return jsf.eventManager.addListener({
    event: jsf.EventListener.SYSTEM,
    eventType: type,
    callback: function (event) {
      callback && callback.call(context, event.getEventName(), event.getEventData());
    }
  });
};

/**
 * simulator for pc browser
 */
//   jsf.Event.KEY_POWER = 1;
//   jsf.Event.KEY_AUDIO = 24;
//   jsf.Event.KEY_NUMBER_1 = 0;
//   jsf.Event.KEY_NUMBER_2 = 7;
//   jsf.Event.KEY_NUMBER_3 = 6;
//   jsf.Event.KEY_NUMBER_4 = 4;
//   jsf.Event.KEY_NUMBER_5 = 11;
//   jsf.Event.KEY_NUMBER_6 = 10;
//   jsf.Event.KEY_NUMBER_7 = 8;
//   jsf.Event.KEY_NUMBER_8 = 15;
//   jsf.Event.KEY_NUMBER_9 = 14;
//   jsf.Event.KEY_FAV = 67;
//   jsf.Event.KEY_NUMBER_0 = 19;
//   jsf.Event.KEY_INFO = 9;
//   jsf.Event.KEY_BACK = 91;
//   jsf.Event.KEY_MENU = 90;
//   jsf.Event.KEY_GUIDE = 78;
//   jsf.Event.KEY_EXIT = 22;
//   jsf.Event.KEY_UP = 23;
//   jsf.Event.KEY_LEFT = 66;
//   jsf.Event.KEY_ENTER = 21;
//   jsf.Event.KEY_RIGHT = 65;
//   jsf.Event.KEY_DOWN = 26;
//   jsf.Event.KEY_CHANNEL_UP = 13;
//   jsf.Event.KEY_CHANNEL_DOWN = 20;
//   jsf.Event.KEY_VOLUME_UP = 64;
//   jsf.Event.KEY_VOLUME_DOWN = 30;
//   jsf.Event.KEY_PLAY_PAUSE = 81;
//   jsf.Event.KEY_RW = 82;
//   jsf.Event.KEY_FF = 83;
//   jsf.Event.KEY_STOP = 84;
//   jsf.Event.KEY_RED = 85;
//   jsf.Event.KEY_YELLOW = 86;
//   jsf.Event.KEY_BLUE = 87;
//   jsf.Event.KEY_GREEN = 16;
//   jsf.Event.F1 = 3;
//   jsf.Event.F2 = 28;
//   jsf.Event.F3 = 12;
//   jsf.Event.F4 = 31;
//   jsf.Event.F5 = 68;
//   jsf.Event.F6 = 69;
//   jsf.Event.F7 = 70;
//   jsf.Event.F8 = 71;
jsf.Event.KEY_LEFT = 37;
jsf.Event.KEY_RIGHT = 39;
jsf.Event.KEY_UP = 38;
jsf.Event.KEY_DOWN = 40;
jsf.Event.KEY_ENTER = 13;
jsf.Event.KEY_BACK = 8;
jsf.Event.KEY_NUMBER_0 = 48;
jsf.Event.KEY_NUMBER_1 = 49;
jsf.Event.KEY_NUMBER_2 = 50;
jsf.Event.KEY_NUMBER_3 = 51;
jsf.Event.KEY_NUMBER_4 = 52;
jsf.Event.KEY_NUMBER_5 = 53;
jsf.Event.KEY_NUMBER_6 = 54;
jsf.Event.KEY_NUMBER_7 = 55;
jsf.Event.KEY_NUMBER_8 = 56;
jsf.Event.KEY_NUMBER_9 = 57;
jsf.Event.KEY_RED = 120;
jsf.Event.KEY_YELLOW = 121;
jsf.Event.KEY_BLUE = 122;
jsf.Event.KEY_GREEN = 123;
jsf.Event.KEY_HOME = 36;
jsf.Event.KEY_CHANNEL_UP = 33;
jsf.Event.KEY_CHANNEL_DOWN = 34;
jsf.Event.KEY_EXIT = 27;
jsf.Event.KEY_INFO = 73;
jsf.Event.KEY_VOLUME_UP = 187;
jsf.Event.KEY_VOLUME_DOWN = 189;
jsf.Event.KEY_MUTE = 77;
jsf.Event.KEY_AUDIO = 65;
jsf.Event.KEY_FAV = 86;
jsf.Event.KEY_PLAY_PAUSE = 85;
jsf.Event.KEY_STOP = 83;
jsf.Event.KEY_RW = 82;
jsf.Event.KEY_FF = 70;
jsf.Event.KEY_MENU = 18;
if (!jsf.sys.isSTB) {
  jsf.Event.KEY_RED = jsf.KEY.r;
  jsf.Event.KEY_GREEN = jsf.KEY.g;
  jsf.Event.KEY_YELLOW = jsf.KEY.y;
  jsf.Event.KEY_BLUE = jsf.KEY.b;
  jsf.Event.KEY_EPG = jsf.KEY.e;
  jsf.Event.KEY_INFO = jsf.KEY.i;
  jsf.Event.KEY_VOLUME_UP = jsf.KEY.period;
  jsf.Event.KEY_VOLUME_DOWN = jsf.KEY.comma;
  jsf.Event.KEY_AUDIO = jsf.KEY.a;
  jsf.Event.KEY_TV = jsf.KEY.t;
  jsf.Event.KEY_MUTE = jsf.KEY.m;
  jsf.Event.KEY_FAV = jsf.KEY.f;
  jsf.Event.KEY_LANGUAGE = jsf.KEY.l;
  jsf.Event.KEY_SIGNAL = jsf.KEY.s;
  jsf.Event.KEY_PLAY_PAUSE = jsf.KEY.p;
  jsf.Event.KEY_STOP = jsf.KEY.semicolon;
  jsf.Event.KEY_CHANNEL_UP = jsf.KEY.equal;
  jsf.Event.KEY_CHANNEL_DOWN = jsf.KEY.dash;
  jsf.Event.KEY_REC = jsf.KEY.r;
  jsf.Event.KEY_PVR = jsf.KEY.v;
  jsf.Event.KEY_RW = jsf.KEY.z;
  jsf.Event.KEY_FF = jsf.KEY.x;
  jsf.Event.KEY_POWER = jsf.KEY.q;
} else {
  jsf.KEY.left = jsf.Event.KEY_LEFT;
  jsf.KEY.right = jsf.Event.KEY_RIGHT;
  jsf.KEY.up = jsf.Event.KEY_UP;
  jsf.KEY.down = jsf.Event.KEY_DOWN;
  jsf.KEY.enter = jsf.Event.KEY_ENTER;
  jsf.KEY.menu = jsf.Event.KEY_MENU;
  jsf.KEY.backspace = jsf.Event.KEY_BACK;
  jsf.KEY.r = jsf.Event.KEY_RED;
  jsf.KEY.g = jsf.Event.KEY_GREEN;
  jsf.KEY.y = jsf.Event.KEY_YELLOW;
  jsf.KEY.b = jsf.Event.KEY_BLUE;
}
