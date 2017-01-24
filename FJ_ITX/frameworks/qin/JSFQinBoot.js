/**
 * JSFQinoot.js
 * @authors Casper 
 * @date    2015/09/17
 * @version 1.0.0
 */
/**
 * setEventCallback
 */
function jsfSystemEventCallback(eventType, eventCode, useless, eventData) {
  jsf.log(eventType + '-' + eventCode + '-' + eventData);
  if (!jsf.isUndefined(eventData)) {
    try {
      eventData && (eventData = JSON.parse(eventData));
    } catch (e) {
      eventData = null;
      jsf.error("Could not resolve the JSON.");
    }
  }
  jsf.eventManager.dispatchEvent(new jsf.EventSystem(jsf.__getEventSystemType(eventType, eventCode), eventCode, eventData));
}

jsf._setupExtension(function(resolve) {
  qin.evt.setEventCallback("jsfSystemEventCallback");
});