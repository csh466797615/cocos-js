/**
 * JSFNetworkManager.js
 * @authors Casper 
 * @date    2016/08/04
 * @version 1.0.0
 */
/**
 * jsf.NetworkManager is a global object.
 * @requires jsf.Network
 */
(function () {
  'use strict';
  /**
   * The mthods of jsf.NetworkManager.
   * @constant
   * @type {Function}
   */
  var Methods = {
    getEthernet: getter__get_ethernet_devices,
    getWlan: getter__get_wlan_device,
    listener: addListener,
    removeListener: removeListener
  };

  var network_devices = {};

  /**
   * Gets all network devices and place them in the cache.
   * If the same type of device already exists in the cache, update the device.
   */
  function getter__get_network_devices () {
    var devices = JSON.parse(qin.network.getDevice());
    var cache = network_devices;
    var device;
    network_devices = {};
    for (var i = 0, j = devices.length; i < j; i++) {
      device = devices[i];
      if (network_devices[device.type]) continue;
      if (cache[device.type]) {
        network_devices[device.type] = (cache[device.type]._unique = device.name, cache[device.type]); 
      } else if (!network_devices[device.type]) {
        network_devices[device.type] = jsf.Network.__ceate(device);
      }
    }
  }

  /**
   * Gets the ehternet device.
   * @return {jsf.Network|Null}
   */
  function getter__get_ethernet_devices () {
    getter__get_network_devices();
    return network_devices[jsf.Network.TYPE_ETHERNET] || null;
  }

  /**
   * Gets the wlan device.
   * @return {jsf.Network|Null}
   */
  function getter__get_wlan_device () {
    getter__get_network_devices();
    return network_devices[jsf.Network.TYPE_WLAN] || null;
  }

  var listeners = [];
  jsf.eventManager.addListener({
    event: jsf.EventListener.SYSTEM,
    eventType: jsf.EventSystem.TYPE_NETWORK,
    callback: function(event) {
      jsf.each(listeners, function(listener) {
        listener.callback.call(listener.context, event.getEventName(), event.getEventData());
      });
    }
  }, new jsf.Class());

  /**
   * Add a listener.
   * @param {Function} listener
   * @param {Object} *context
   */
  function addListener(listener, context) {
    listeners.push({
      callback: listener,
      context: context
    });
  }

  /**
   * Remove the previous listener.
   * @param {Function} *listener
   */
  function removeListener(listener) {
    if (listener) {
      for (var i = 0, j = listeners.length; i < j; i++) {
        if (listeners[i].callback === listener) {
          listeners.splice(i, 1);
          break;
        }
      }
    } else {
      listeners.length = 0;
    }
  }

  var JSFNetworkManager = {};

  jsf.defineReadOnlyProperties(JSFNetworkManager, Methods);

  jsf.NetworkManager = JSFNetworkManager;
}());
