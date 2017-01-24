/**
 * info.js
 * @authors Casper 
 * @date    2016/07/11
 * @version 1.0.0
 */
define(['view/information/info.html'], function(require, exports, module) {
  var Broadcast = require('service/Broadcast');
  var InfoView = require('component/BaseView').extend({
      className: 'page animated information',
      template: require('view/information/info.html'),
      ensureSelf: function(options) {
        this.render();
        options.parent.append(this.el);
        this.infos = this.$('.information-item');
        var data = [jsf.SysInfo.cpu, jsf.SysInfo.ramSize, jsf.SysInfo.flashSize, jsf.SysInfo.hwVer, jsf.SysInfo.swVer, jsf.SysInfo.swDate, jsf.SysInfo.kernelVer, jsf.SysInfo.mac, jsf.SysInfo.serNo, jsf.SysInfo.hdcp, jsf.SysInfo.cfeVer, jsf.SysInfo.loaderVer];
        jsf.each(data, (function (value, index) {
          this.infos.eq(index).html(value);
        }).bind(this));
      },
      render: function() {
        this.$el.html(_.template(this.template)({
          title: 'Info',
          cpu: 'CPU',
          memory: 'Memory',
          flash: 'FLASH',
          hardware: 'Hardware version',
          software: 'Software version',
          release: 'Release time',
          kernel: 'Kernel version',
          mac: 'MAC address',
          serial: 'Serial',
          dhcp: 'HDCP',
          cfe: 'CFE version',
          loader: 'Loader version'
        }));
        return this;
      },
      onkeydown: function(keyCode) {
        switch (keyCode) {
          case jsf.Event.KEY_BACK:
            Broadcast.trigger('page:to', 'home');
            break;
          default:
            break;
        }
      }
    });
  module.exports = {
    create: function(app) {
      if (!this._instance) {
        this._instance = new InfoView({
          parent: app.$el
        });
      }
      return this._instance;
    }
  };
});