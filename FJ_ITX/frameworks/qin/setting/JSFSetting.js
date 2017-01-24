/**
 * JSFSetting.js
 * @authors Casper 
 * @date    2016/07/12
 * @version 1.0.0
 */
/**
 * jsf.Setting is a global object.
 */
(function() {
  'use strict';
  /**
   * The key of page address.
   * @constant
   * @type {String}
   */
  var Pages = {
    PAGE_PORTAL: 'menu',
    PAGE_TV: 'tv',
    PAGE_VOD: 'vodplayer'
  };
  /**
   * The mthods of jsf.Setting.
   * @type {Function}
   */
  var Methods = {
    setPanelText: function (text) {qin.settings.setFrontPanel(text);},
    openPanelLight: function () {}, // No use
    closePanelLight: function () {}, // No use
    setEnv: setter__set_to_session_storage,
    getEnv: getter__get_from_session_storage,
    deleteEnv: delete__delete_in_session_storage,
    setLocalStorage: setter__set_to_local_storage,
    getLocalStorage: getter__get_from_local_storage,
    deleteLocalStorage: delete__delete_in_local_storage,
    enableBrowserFocus: function () {qin.wm.showCursor();},
    disableBrowserFocus: function () {qin.wm.hideCursor();},
    getBrowserFocusStatus: getter__get_browser_focus_status,
    enableHomeKey: function () {qin.wm.disableHomeKey();},
    disableHomeKey: function () {qin.wm.enableHomeKey();},
    getHomeKeyStatus: getter__get_home_key_status,
    wmRestart: function () {qin.wm.restart();},
    getPortalPath: function () {qin.wm.getAppRootPath();},
    enter: setter__set_browser_url,
    restoreDefault: function () {qin.data.resume('fully');},
    reboot: function () {qin.settings.reboot();},
    standby: function () {} // No use
  };

  /**
   * Save a non persistent data.
   * @param  {String} key
   * @param  {Object} value
   */
  function setter__set_to_session_storage (key, value) {
    jsf.isString(key) && qin.data.setStorage(key, value === void 0 ? '' : value);
  }

  /**
   * Save a persistent data.
   * @param  {String} key
   * @param  {Object} value
   */
  function setter__set_to_local_storage (key, value) {
    jsf.isString(key) && qin.data.setSystem(key, value === void 0 ? '' : value);
  }

  /**
   * Sets the browser url.
   * @param  {String} type
   * @param  {String} *params
   */
  function setter__set_browser_url (type, params) {
    if (jsf.isString(type)) {
      if (params === void 0 || params === null) {
        params = '';
      } else if (!jsf.isString(params)) {
        params = '' + params;
      }
      params !== '' && params.charAt(0) !== '?' && (params = '?' + params);
      qin.wm.gotoSTB(type, params);
    }
  }

  /**
   * Gets a non persistent data.
   * @param  {String} key
   * @return {String}
   */
  function getter__get_from_session_storage (key) {
    return jsf.isString(key) ? qin.data.getStorage(key) : '';
  }

  /**
   * Gets a persistent data.
   * @param  {String} key
   * @return {String}
   */
  function getter__get_from_local_storage (key) {
    return jsf.isString(key) ? qin.data.getSystem(key) : '';
  }

  /**
  * Detects whether the browser focus is processed by default.
  * @return {Boolean}
  */
  function getter__get_browser_focus_status () {
    return qin.wm.getCursorStatus() === 0 ? true : false;
  }

  /**
   * Detects whether the home key is processed by default.
   * @return {[type]} [description]
   */
  function getter__get_home_key_status () {
    return !qin.wm.getHomeKeyStatus();
  }

  /**
   * Clear a non persistent data.
   * @param  {String} key
   */
  function delete__delete_in_session_storage (key) {
    setter__set_to_session_storage(key, '');
  }

  /**
   * Clear a persistent data.
   * @param  {String} key
   */
  function delete__delete_in_local_storage (key) {
    setter__set_to_local_storage(key, '');
  }

  var JSFSetting = {};
  jsf.defineReadOnlyProperties(JSFSetting, Pages);
  jsf.defineReadOnlyProperties(JSFSetting, Methods);

  jsf.Setting = JSFSetting;
}());