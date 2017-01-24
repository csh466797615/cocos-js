/**
 * GlobalEvent.js
 * @authors Casper
 * @date    2015/07/21
 * @version 1.0.0
 */
define(['service/Broadcast', 'service/Live', 'service/Local'], function(require, exports, module) {
  var Broadcast = require('service/Broadcast');
  var Live = require('service/Live');
  var Local = require('service/Local');

  jsf.eventManager.addListener({
    event: jsf.EventListener.SYSTEM,
    eventType: jsf.EventSystem.TYPE_PVR,
    callback: function (event) {
      switch (event.getEventName()) {
        case jsf.EventSystem.PVR_REC_START_OK:
          // Broadcast.trigger('tip:global', {
          //   type: 'remind',
          //   info: 'A program start REC'
          // });
          break;
        case jsf.EventSystem.PVR_REC_STOP_OK:
          break;
        case jsf.EventSystem.PVR_REC_START_ERROR:
          Broadcast.trigger('tip:global', {
            type: 'fail',
            info: 'Device is busy, please try again later.'
          });
          break;
        case jsf.EventSystem.PVR_REC_ERROR:
          Broadcast.trigger('tip:global', {
            type: 'fail',
            info: 'Unknown causes error recording.'
          });
          break;
        case jsf.EventSystem.PVR_REC_DISKFULL:
        case jsf.EventSystem.PVR_BUY_SPACE_FULL:
          Broadcast.trigger('tip:global', {
            type: 'fail',
            info: 'Disk is full, please delete out-of-date recordings.'
          });
          break;
        default:
          return;
      }
      Broadcast.trigger('event:pvr', event.getEventName(), event.getEventData());
    }
  });

  jsf.eventManager.addListener({
    event: jsf.EventListener.SYSTEM,
    eventType: jsf.EventSystem.TYPE_EPG,
    callback: function (event) {
      switch (event.getEventName()) {
        case jsf.EventSystem.EPG_PF_CACHE:
        case jsf.EventSystem.EPG_PF_FINISH:
          Broadcast.trigger('epg:pf', event.getEventData());
          break;
        case jsf.EventSystem.EPG_CACHE:
        case jsf.EventSystem.EPG_FINISH:
          Broadcast.trigger('epg:schedule', event.getEventData());
          break;
      }
    }
  });

  jsf.eventManager.addListener({
    event: jsf.EventListener.SYSTEM,
    eventType: jsf.EventSystem.TYPE_BOOKING,
    callback: function (event) {
      switch (event.getEventName()) {
        case jsf.EventSystem.BOOKING_PLAY_ARRIVE:
          var data = event.getEventData();
          var remindTime = jsf.BookingManager.getRemindTime();
          if (remindTime <= 0) {
            remindTime = 60;
          }
          var channels = Live.getAll();
          var channel;
          var index = -1;
          for (var i = 0, j = channels.length; i < j; i++) {
            channel = channels.get(i);
            if (channel.frequency === data.frequency && channel.tsId === data.tsId && channel.networkId === data.netWorkId && channel.serviceId === data.serviceId) {
              index = i;
              break;
            }
          }
          if (index >= 0) {
            jsf.log('play arrive: find the channel which index is ' + index);
            var timer = setTimeout(function () {
              Broadcast.trigger('tip:confirm:hide', true);
            }, remindTime * 1000);
            Broadcast.trigger('tip:confirm:prevent', 'Your booking is reached!<br>ChannelName:' + channel.name, function () {
              clearTimeout(timer);
              Broadcast.trigger('page:to', 'live-live', {
                playing: true,
                area: 'epg'
              }, {
                callbackForBeforeChange: function () {
                  Live.toChannel(index);
                }
              });
            });
          } else {
            jsf.log('play arrive: not find');
          }
          break;
        case jsf.EventSystem.BOOKING_PVR_LEAVE:
          Live.removePVRBookingById(event.getEventData().id);
          break;
      }
    }
  });

  jsf.eventManager.addListener({
    event: jsf.EventListener.SYSTEM,
    eventType: jsf.EventSystem.TYPE_NETWORK,
    callback: function (event) {
      switch (event.getEventName()) {
        case jsf.EventSystem.NETWORK_CONNECT_PLUGIN:
        case jsf.EventSystem.NETWORK_CONNECT_PLUGOUT:
          Broadcast.trigger('event:net', event.getEventName(), event.getEventData());
          break;
        default:
          break;
      }
    }
  });

  jsf.eventManager.addListener({
    event: jsf.EventListener.SYSTEM,
    eventType: jsf.EventSystem.TYPE_USB,
    callback: function (event) {
      switch (event.getEventName()) {
        case jsf.EventSystem.USB_PLUGIN:
          Broadcast.trigger('tip:global', {
            type: 'remind',
            info: 'A USB is inserted'
          });
          Local.usbChanged(event.getEventName(), event.getEventData());
          break;
        case jsf.EventSystem.USB_PLUGOUT:
          Broadcast.trigger('tip:global', {
            type: 'remind',
            info: 'A USB is pulled out'
          });
          Local.usbChanged(event.getEventName(), event.getEventData());
          break;
        case jsf.EventSystem.USB_PLUGIN_FIRST:
          Local.usbChanged(event.getEventName());
          break;
      }
      Broadcast.trigger('event:usb', event.getEventName(), event.getEventData());
    }
  });
});