/**
 * JSFNetworkRelated.js
 * @authors Casper 
 * @date    2016/08/04
 * @version 1.0.0
 */
/**
 * Contains all the objects the network device needs.
 */
(function () {
  'use strict';
  /**
   * Sets a property from  a key-vlaue data for obj.
   * @param  {Object} obj
   * @param  {*} value
   * @param  {String} key
   */
  function setter__get_info_from_data (obj, value, key) {
    obj[key] = value;
  }

  /**
   * Description of a network address information.
   * @class
   * @extends jsf.Class
   */
  var JSFIP = jsf.Class.extend({
    ctor: function (info) {
      jsf.each(info, (function (value, key) {
        setter__get_info_from_data(this, value, key);
      }).bind(this));
    },
    _toJSON: function () {
      var json = {};
      this.ip && (json.ip = this.ip);
      this.mask && (json.mask = this.mask);
      this.gateway && (json.gateway = this.gateway);
      this.dns1 && (json.dns1 = this.dns1);
      this.dns2 && (json.dns2 = this.dns2);
      return json;
    }
  });
  var ipPrototype = JSFIP.prototype;
  jsf.each({
    ip: {value: ''},
    mask: {value: ''},
    gateway: {value: ''},
    dnsArray: {value: null, getter: function () {return [this.dns1, this.dns2].filter(function (value) {return value;});}, setter: function (dns) {
      if (jsf.isArray(dns)) {
        dns[0] && (this.dns1 = dns[0]);
        dns[1] && (this.dns2 = dns[0]);
      }
    }},
  }, function (prop, propName) {
    prop.getter ? jsf.defineGetterSetter(ipPrototype, propName, prop.getter, prop.setter) : jsf.defineValue(ipPrototype, propName, prop.value);
  });

  /**
   * The link statue of ap.
   * @constant
   * @type {String}
   */
  var Status = {
    STATUS_ON: 'on',
    STATUS_OFF: 'off',
  };
  /**
   * The encryption of ap.
   * @constant
   * @type {String}
   */
  var Encryption = {
    ENCRPTION_NONE: 'none',
    ENCRPTION_WEP: 'wep',
    ENCRPTION_WPA: 'wpa',
    ENCRPTION_WPA2: 'wpa2',
    ENCRPTION_WPA_WPA2: 'wpa/wpa2'
  };

  /**
   * Description of an access point information.
   * @class
   * @extends jsf.Class
   */
  var JSFAP = jsf.Class.extend({
    ctor: function (info) {
      jsf.each(info, (function (value, key) {
        setter__get_info_from_data(this, value, key);
      }).bind(this));
    },
    _toJSON: function () {
      return {
        ssid: this.ssid,
        password: this.password,
        encrptType: this.encrpType,
        status: this.status,
        broadcast: this.broadcast
      };
    }
  });
  var apPrototype = JSFAP.prototype;
  jsf.each({
    ssid: {value: ''},
    password: {value: ''},
    encrptType: {value: Encryption.ENCRPTION_NONE},
    status: {value: Status.STATUS_OFF},
    broadcast: {value: Status.STATUS_OFF},
    isOpen: {value: false, transform: function () {return this.status === Status.STATUS_ON;}},
    isOpenBroadcast: {value: false, transform: function () {return this.broadcast === Status.STATUS_ON;}}
  }, function (prop, propName) {
    prop.getter ? jsf.defineGetterSetter(ipPrototype, propName, prop.getter, prop.setter) : jsf.defineValue(ipPrototype, propName, prop.value);
  });
  jsf.defineReadOnlyProperties(JSFAP, Status);
  jsf.defineReadOnlyProperties(JSFAP, Encryption);

  jsf.IP = JSFIP;
  jsf.AP = JSFAP;
}());