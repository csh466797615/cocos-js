/**
 * Created by ChenShihai on 2017/1/23.
 */
define(function (require, exports, module) {
  var FactoryReset = [
    {
      name: '恢复出厂设置',
      canBeFocused: true,
      view:  null,
      beforeIn: function (options) {
        this.view = $('#setting-right-area1');
        this.view.addClass('setting-right-content-show');
      },
      beforeOut: function () {
        this.view.removeClass('setting-right-content-show');
      },
      focus: function () {
        //this.searchBtn.addClass('s-auto-search-btn-f');
      },
      blur: function () {
        //this.searchBtn.removeClass('s-auto-search-btn-f');
      },
      onKeyDown: function (keyCode) {
        switch (keyCode) {
          case jsf.Event.KEY_BACK:
          case jsf.Event.KEY_LEFT:
            this.blur();
            return false;
            break;
        }
        return true;
      }
    }
  ];
  module.exports = FactoryReset;
});