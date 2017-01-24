/**
 * JSFNetwork.js
 * @authors Casper 
 * @date    2016/08/04
 * @version 1.0.0
 */
/**
 * Used to describe a network equipment.
 * @requires jsf.IP
 */
(function () {
  'use strict';
  /**
   * The type of network.
   * @constant
   * @type {String}
   */
  var Types = {
    TYPE_ETHERNET: 'eth',
    TYPE_WLAN: 'wlan'
  };
  /**
   * The connect type of network.
   * @constant
   * @type {String}
   */
  var ConnectTypes = {
    CONNECTTYPE_UNKOWN: 'unset',
    CONNECTTYPE_STATIC: 'static',
    CONNECTTYPE_DHCP: 'dhcp',
    CONNECTTYPE_DHCPPLUS: 'dhcp+',
    CONNECTTYPE_PPPOE: 'pppoe',
    CONNECTTYPE_PPPOECA: 'pppoeCA'
  };
  /**
   * The status of network link status.
   * @constant
   * @type {String}
   */
  var Status = {
    STATUS_CONNECTED: 'connected',
    STATUS_DISCONNECT: 'disconnect'
  };
  /**
   * The wifi mode of network.
   * Only used for wlan.
   * @constant
   * @type {String}
   */
  var WifiMode = {
    WIFIMODE_AP: 'ap',
    WIFIMODE_STA: 'sta',
    WIFIMODE_DISABLE: 'disable'
  };
  /**
   * The link statue of ap.
   * @constant
   * @type {String}
   */
  var APStatus = {
    AP_STATUS_ON: 'on',
    AP_STATUS_OFF: 'off',
  };
  /**
   * The encryption.
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
   * The methods of jsf.Network
   */
  var Methods = {
    __ceate: create__create_network_device
  };

  function create__create_network_device (device) {
    switch (device.type) {
      case Types.TYPE_ETHERNET:
        return new JSFEthernet(device.name);
      case Types.TYPE_WLAN:
        return new JSFWlan(device.name);
      default:
        return null;
    }
  }

  function create__create_setter_getter_assigner_for_device (func) {
    if (!func) return null;
    return function () {
      return func.apply(this, [this._unique].concat(Array.prototype.slice.call(arguments)));
    };
  }

  function vaild (obj, info) {
    var pass = true;
    jsf.each(obj, function (value, key) {
      if (!value || jsf.isUndefined(info[key])) return (jsf.error('jsf.Network vaild: ' + key + ' must have value'), pass = false);
      obj[key] = info[key];
    });
    return pass;
  }

  /**
   * Sets the specified connect type for the specified device.
   * @param  {String} unique  Device name
   * @param  {String} type    re.ConnectTypes
   */
  function setter__set_connect_type (unique, type) {
    switch(type){
      case ConnectTypes.CONNECTTYPE_UNKOWN:
      case ConnectTypes.CONNECTTYPE_STATIC:
      case ConnectTypes.CONNECTTYPE_DHCP:
      case ConnectTypes.CONNECTTYPE_DHCPPLUS:
      case ConnectTypes.CONNECTTYPE_PPPOE:
      case ConnectTypes.CONNECTTYPE_PPPOECA:
        qin.network.setNetType(unique, type);
        break;
      default:
        jsf.error('jsf.Network connect type: unable to identify the type. ' + type);
        break;
    }
  }

  /**
   * Gets the connect type of the specified device.
   * @param  {String} unique  Device name
   * @return {String}  re.ConnectTypes
   */
  function getter__get_connect_type (unique) {
    return qin.network.getNetType(unique);
  }

  /**
   * Sets the specified IP for the specified device.
   * Sets ip will make connect type to static.
   * @param  {String} unique  Device name
   * @param  {jsf.IP like} ip
   */
  function setter__set_ip (unique, ip) {
    qin.network.setStaticInfo(unique, JSON.stringify(jsf.isInstanceof(ip, jsf.IP) ? ip._toJSON() : ip));
  }

  /**
   * Gets the IP of the specified device.
   * @param  {String} unique  Device name
   * @return {jsf.IP}
   */
  function getter__get_ip (unique) {
    return new jsf.IP(JSON.parse(qin.network.getNetInfo(unique)));
  }

  /**
   * Sets the pppoe paramters for the specified device.
   * Paramters must include userName and password, and the value is a non empty string, otherwise invalid.
   * @param  {String} unique  Device name
   * @param  {Object} parameters
   */
  function setter__set_pppoe (unique, parameters) {
    if (!parameters) return;
    if (!jsf.isString(parameters.userName) || parameters.userName === '') return;
    if (!jsf.isString(parameters.password) || parameters.password === '') return;
    qin.network.setPPPOEInfo(unique, JSON.stringify(parameters));
  }

  /**
   * Gets the pppoe paramters of the specified device.
   * @param  {String} unique  Device name
   * @return {Object}
   */
  function getter__get_pppoe (unique) {
    return JSON.parse(qin.network.getPPPOEInfo(unique));
  }

  /**
   * Gets the mac address of the specified device.
   * @param  {String} unique  Device name
   * @return {String}
   */
  function getter__get_mac (unique) {
    return qin.network.getMAC(unique);;
  }

  /**
   * Gets the cable link status of the specified device.
   * @param  {String} unique  device name
   * @return {String}  re.Status
   */
  function getter__get_cable_status (unique) {
    return qin.network.getPhyStatus(unique);
  }

  /**
   * Gets the net link status of the specified device.
   * @param  {String} unique  Device name
   * @return {String}  re.Status
   */
  function getter__get_net_status (unique) {
    return qin.network.getNetStatus(unique);
  }

  /**
   * Sets the specified wifi mode for the specified device.
   * Only use for wlan.
   * @param  {String} unique    Device name
   * @param  {String} wifiMode  re.WifiMode
   */
  function setter__set_wifi_mode (unique, wifiMode) {
    switch (wifiMode) {
      case WifiMode.WIFIMODE_AP:
      case WifiMode.WIFIMODE_STA:
      case WifiMode.WIFIMODE_DISABLE:
        qin.network.setWiFiMode (unique, wifiMode);
        break;
      default:
        jsf.error('jsf.Network wifi mode: unable to identify the mode. ' + wifiMode);
        break;
    }
  }

  /**
   * Gets the wifi mode of the specified device.
   * Only use for wlan.
   * @param  {String} unique  Device name
   * @return {String}  re.WifiMode
   */
  function getter__get_wifi_mode (unique) {
    return qin.network.getWiFiMode (unique);
  }

  /**
   * Sets the specified sta mode info for the specified device.
   * Only use for wlan.
   * @param  {String} unique  Device name
   * @param  {Object} staInfo
   *   -ssid: String  service set identifier
   *   -password: String
   *   -encryptType: String  the encryption
   */
  function setter__set_sta_info (unique, staInfo) {
    if (!staInfo) return;
    var info;
    if (!vaild(info = {
      ssid: false,
      password: false,
      encryptType: false
    }, staInfo)) return;
    qin.network.setWiFiInfo(unique, JSON.stringify(info));
  }

  /**
   * Gets the sta mode info of the specified device.
   * Only use for wlan.
   * @param  {String} unique  Device name
   * @return {Object}
   *   -ssid: String  service set identifier
   *   -password: String
   *   -encryptType: String  the encryption
   *   -signalStrength: Number  signal intensity
   */
  function getter__get_sta_info (unique) {
    return JSON.parse(qin.network.getWiFiInfo(unique));
  }

  /**
   * Sets the specified ap mode info for the specified device.
   * Only use for wlan.
   * @param  {String} unique  Device name
   * @param  {Number} index   Hot spot serial number
   * @param  {Object} apInfo
   *   -ssid: String  service set identifier
   *   -password: String
   *   -encryptType: String  the encryption
   *   -status: String  switch state for device, re.APStatus
   *   -broadcast: String  switch state for broadcast mode, re.APStatus
   *   -*netType: String  re.ConnectTypes
   */
  function setter__set_ap_info (unique, index, apInfo) {
    if (!apInfo) return;
    var info;
    if (!vaild(info = {
      ssid: false,
      password: false,
      encryptType: false,
      status: false,
      broadcast: false
    }, apInfo)) return;
    apInfo.netType && (info.nettype = apInfo.netType);
    info.device = unique;
    qin.network.setSoftAPInfo(unique, JSON.stringify(info));
  }

  /**
   * Gets the ap mode info of the specified device.
   * Only use for wlan.
   * @param  {String} unique  Device name
   * @param  {Number} index   Hot spot serial number
   * @return {Object}
   *   -ssid: String  service set identifier
   *   -password: String
   *   -encryptType: String  the encryption
   *   -status: String  switch state for device, re.APStatus
   *   -broadcast: String  switch state for broadcast mode, re.APStatus
   */
  function getter__get_ap_info (unique, index) {
    return JSON.parse(qin.network.getSoftAPInfo(index, unique));
  }

  /**
   * Gets the information of all the devices linking to the soft AP, including name, connectTime, mac, ip.
   * Only use for wlan and wifi mode is ap.
   * @param  {String} unique  Device name
   * @return {Array<Object>}
   *   -name: String  Device name
   *   -connectTime: Date
   *   -ip: String
   *   -mac: String
   */
  function getter__get_linking_device_info (unique, index) {
    return JSON.stringify(qin.network.getSoftAPLinkingInfo(index, unique));
  }

  /**
   * Network device.
   * @class
   * @extends jsf.Class
   */
  var JSFNetwork = jsf.Class.extend({
    ctor: function (unique) {
      this._unique = unique;
    },
    connect: function () {return !qin.network.connect(this._unique);},
    disconnect: function () {return !qin.network.disconnect(this._unique);},
    ping: function (url) {qin.network.ping(this._unique, url);}
  });
  var networkPrototype = JSFNetwork.prototype;
  /**
   * Ethernet device.
   * @class
   * @extends jsf.Network
   */
  var JSFEthernet = JSFNetwork.extend({
    ctor: function (unique) {
      this._super(unique);
      this._type = Types.TYPE_ETHERNET;
    },
    /**
     * Connect to the network the device attached.
     * Only when connect type is pppoe or pppoeca available.
     * @return {Boolean}  Indicates whether the interface call is successful
     */
    connect: function () {
      var connectType = this.connectType;
      if (connectType !== ConnectTypes.PPPOE && connectType !== ConnectTypes.CONNECTTYPE_PPPOECA) {
        jsf.error('JSFEthernet connect: current connect type is ' + connectType + ', can not support connect.');
        return false;
      }
      return this._super();
    },
    disconnect: function () {
      var connectType = this.connectType;
      if (connectType !== ConnectTypes.PPPOE && connectType !== ConnectTypes.CONNECTTYPE_PPPOECA) {
        jsf.error('JSFEthernet disconnect: current connect type is ' + connectType + ', can not support disconnect.');
        return false;
      }
      return this._super();
    }
  });
  /**
   * Wlan device.
   * @class
   * @extends jsf.Network
   */
  var JSFWlan = JSFNetwork.extend({
    ctor: function (unique) {
      this._super(unique);
      this._type = Types.TYPE_WLAN;
    },
    /**
     * Links to a specifeid ap.
     * If the ap is not passed only when wifi mode is sta available, otherwise will set wifi mode to sta.
     * @param  {Object} *ap
     * @return {Boolean}  Indicates whether the interface call is successful
     */
    connect: function (ap) {
      var mode = this.wifiMode;
      if (mode !== WifiMode.WIFIMODE_STA) {
        if (!ap) {
          jsf.error('JSFEthernet connect: wifi mode is ' + mode + ', can not support connect.');
          return false;
        }
        this.wifiMode = WifiMode.WIFIMODE_STA;
      }
      ap && (this.staInfo = ap);
      return this._super();
    },
    disconnect: function () {
      var mode = this.wifiMode;
      if (mode !== WifiMode.WIFIMODE_STA) {
        jsf.error('JSFEthernet disconnect: wifi mode is ' + mode + ', can not support disconnect.');
        return false;
      }
      return this._super();
    },
    /**
     * Scan all access points.
     * @param {Boolean} force  Whether to force the search, if true will set wifi mode to sta.
     */
    scan: function (force) {
      var mode = this.wifiMode;
      if (mode !== WifiMode.WIFIMODE_STA) {
        if (!force) {
          jsf.error('JSFEthernet scan: wifi mode is ' + mode + ', can not support scan.');
          return false;
        }
        this.wifiMode = WifiMode.WIFIMODE_STA;
      }
      qin.network.scanAP(this._unique);
    },
    setAPInfo: function (index, apInfo) {
      setter__set_ap_info(this._unique, index, apInfo);
    },
    getAPInfo: function (index) {
      return getter__get_ap_info(this._unique, index);
    },
    getAPLinks: function (index) {
      return getter__get_linking_device_info(this._unique, index);
    }
  });
  var wlanPrototype = JSFWlan.prototype;

  var __temp;
  jsf.each({
    type: {getter: function () {return this._type;}},
    connectType: {setter: setter__set_connect_type, getter: getter__get_connect_type},
    ip: {setter: setter__set_ip, getter: getter__get_ip},
    pppoe: {setter: setter__set_pppoe, getter: getter__get_pppoe},
    mac: {getter: getter__get_mac},
    cableStatus: {getter: getter__get_cable_status},
    netStatus: {getter: getter__get_net_status}
  }, function (prop, propName) {
    __temp = '_' + propName;
    jsf.defineGetterSetter(networkPrototype, propName, create__create_setter_getter_assigner_for_device(prop.getter), create__create_setter_getter_assigner_for_device(prop.setter));
  });

  jsf.defineReadOnlyProperties(JSFNetwork, Types);
  jsf.defineReadOnlyProperties(JSFNetwork, ConnectTypes);
  jsf.defineReadOnlyProperties(JSFNetwork, Status);
  jsf.defineReadOnlyProperties(JSFNetwork, APStatus);
  jsf.defineReadOnlyProperties(JSFNetwork, Encryption);
  jsf.defineReadOnlyProperties(JSFNetwork, Methods);

  jsf.each({
    wifiMode: {setter: setter__set_wifi_mode, getter: getter__get_wifi_mode},
    staInfo: {setter: setter__set_sta_info, getter: getter__get_sta_info},
    linkingInfo: {gettter: getter__get_linking_device_info}
  }, function (prop, propName) {
    __temp = '_' + propName;
    jsf.defineGetterSetter(wlanPrototype, propName, create__create_setter_getter_assigner_for_device(prop.getter), create__create_setter_getter_assigner_for_device(prop.setter));
  });

  jsf.Network = JSFNetwork;

  // console.log(qin.network.getDevice());
  // console.log(qin.network.getNetInfo('eth0'));
  // console.log(qin.network.getNetType('eth0'));
  // console.log(qin.network.getPPPOEInfo('eth0'));
  // console.log(qin.network.getPPPOEInfo('eth0'));
  // qin.network.setPPPOEInfo('eth0', JSON.stringify({
  //   'userName':2222,password:111111
  // }));
  // console.log(qin.network.getPPPOEInfo('eth0'));
  // console.log(qin.network.getNetType('eth0'));
  // console.log(qin.network.getNetInfo('eth0'));
  // qin.network.setStaticInfo('eth0', JSON.stringify({
  //   ip: '10.8.9.18',
  //   mask: '10.8.9.255',
  //   gateway: '255.255.255.0'
  // }));
  // console.log(qin.network.getNetType('eth0'));
  // console.log(qin.network.getNetInfo('eth0'));
  // console.log(qin.network.connect('eth0'));
  // console.log(qin.network.getNetType('eth0'));
  // console.log(qin.network.getWiFiInfo('eth0'));
  // console.log(qin.network.getSoftAPInfo(0, 'eth0'));
  // console.log(qin.network.setSoftAPInfo(0, JSON.stringify({device: 'eth0', "ssid":"123","password":"321","encryptType":"none","broadcast":"on","status":"off"})));
  // console.log(qin.network.getSoftAPInfo(0, 'eth0'));
  // console.log(qin.network.getWiFiMode('eth0'));
}());