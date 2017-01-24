/**
 * Created by ChenShihai on 2017/1/23.
 */
define(function (require, exports, module) {
  var
    BaseView = require("component/BaseView"),
    ListView = require('component/ListView'),
    Broadcast = require('service/Broadcast'),
    Transform = require('service/Transform'),
    Timer = require('service/Timer');
    //MediaPlayer = require('service/Media');
  var MenuDetailList = [
    require('module/setting/basic'),
    require('module/setting/advanced'),
    require('module/setting/search'),
    require('module/setting/information'),
    require('module/setting/reset'),
    require('module/setting/update')
  ];
  var MenuDetailViewList = [
    require('view/setting/basic.html'),
    require('view/setting/advanced.html'),
    require('view/setting/search.html'),
    require('view/setting/information.html'),
    require('view/setting/reset.html'),
    require('view/setting/update.html')
  ];
  var SettingView = ListView.extend({
    template: require('view/setting/main.html'),
    ensureSelf: function (options) {
      options.parent.append(this.el);
      this.render();
      this.isCycle = true;
      this.showTimer = Timer.get();
      this.max = 8;
      this.mid = 1;
      this.currentMid = 1;
      this.focusIndex = this.mid;
      this.minFocusIndex = this.mid;
      this.maxFocusIndex = 8;
      this.itemClass = 'setting-menu-item-';
      this.focus = this.$('#setting-menu-focus');
      this.dataList = [];
      this.menuDetailView = null;
      this.menuDetail = [];


      this.rightArea = this.$('#setting-right-area');
      this.list = this.$('#setting-menu');
      this.isMenuFocus = true;
    },
    refreshRightContent: function () {
      this.menuDetail[this.oldDataIndex] != undefined ? this.menuDetail[this.oldDataIndex].beforeOut() : null;
      this.menuDetail[this.dataIndex] != undefined ?this.menuDetail[this.dataIndex].beforeIn():null;
    },
    refreshList: function () {
      var startItem = (this.currentMid - this.mid + this.max) % this.max;
      for (var i = 0; i < this.max; i++) {
        this.showData((startItem + i) % this.max, this.index + (i - this.mid));
      }
    },
    getCurrentFocusItemIndex: function () {
      return (this.currentMid + (this.focusIndex - this.minFocusIndex)) % this.max;
    },
    addMenuListFocus: function () {
      this.items[this.getCurrentFocusItemIndex()].classList.add('current');
      this.refreshRightContent(this.getCurrentFocusItemIndex());
    },
    refresh: function (list, cursor) {
      this.menuItems = list;
      this.dataLength = this.menuItems.length;
      this.dataIndex = cursor || 0;
      this.index = this.dataIndex;
      this.items[this.getCurrentFocusItemIndex()].classList.remove('current');
      var pageNum = this.maxFocusIndex - this.minFocusIndex + 1;
      if (this.dataLength > pageNum) {
        if (this.dataIndex < pageNum) {
          this.index = 0;
          this.focusIndex = this.minFocusIndex + this.dataIndex;
        } else if (this.dataIndex + pageNum >= this.dataLength) {
          this.index = this.dataLength - pageNum;
          this.focusIndex = this.dataIndex - this.index + this.minFocusIndex;
        } else {
          this.index = this.dataIndex;
          this.focusIndex = this.minFocusIndex;
        }
      } else {
        this.index = 0;
        this.focusIndex = this.minFocusIndex + this.dataIndex;
      }
      this.focus[0].className = this.itemClass + this.focusIndex + " setting-menu-focus";
      this.addMenuListFocus();
      this.refreshList();
    },
    _offset: function (offset) {
      if (this.dataLength < 2) return;
      this.oldDataIndex = this.dataIndex;
      this.dataIndex += offset;
      if (this.dataIndex < 0) {
        this.dataIndex = 0;
        this.items[this.getCurrentFocusItemIndex()].classList.remove('current');
        this.dataIndex = this.dataLength - 1;
        this.focusIndex = this.dataLength > this.maxFocusIndex ? this.maxFocusIndex : this.dataLength;
        this.index = this.dataIndex - (this.focusIndex - this.minFocusIndex);
        this.addMenuListFocus();
        this.focus[0].className = this.itemClass + this.focusIndex + " setting-menu-focus";
        this.dataLength > this.maxFocusIndex && this.refreshList();
      } else if (this.dataIndex >= this.dataLength) {
        this.refresh(this.menuItems);
      } else {
        this.items[this.getCurrentFocusItemIndex()].classList.remove('current');
        if (offset < 0 && this.focusIndex === this.minFocusIndex || offset > 0 && this.focusIndex === this.maxFocusIndex) {
          this.offset(offset);
        } else {
          this.focusIndex = (this.focusIndex + offset + this.max) % this.max;
          this.focus[0].className = this.itemClass + this.focusIndex + " setting-menu-focus";
        }
        this.addMenuListFocus();
      }
    },

    getItem: function (itemIndex) {
      return this.items[itemIndex];
    },
    showData: function (itemIndex, index) {
      var menuItem = index >= 0 && index < this.dataLength ? this.menuItems[index] : null;
      var menuItemEl = this.items[itemIndex];
      menuItemEl.innerHTML = menuItem;
    },

    beforeOut: function () {
      if (this.dataLength > 0) {
      }
      this.showTimer.clear();
    },
    afterOut: function () {
      if (!this.isMenuFocus) {
        this.list.removeClass('focus');
        this.isMenuFocus = true;
      }
      this.dataLength > 0 && this.refresh([]);
    },
    beforeIn: function (params) {
      this.menuDetailView = MenuDetailViewList[params.index];
      this.menuDetail = MenuDetailList[params.index];
      this.maxFocusIndex = this.menuDetail.length;
      this.rightArea[0].innerHTML = this.menuDetailView;
      for (var i = 0, j = this.menuDetail.length; i < j; i++) {
        this.dataList.push(this.menuDetail[i].name);
      }
      this.showList(this.dataList, 0);
      if (this.dataLength === 0) {
      } else {
      }
      var now = new Date(),
        timerEl = this.$("#setting-timer");
      timerEl.html(Transform.date(now, 'MM月dd日  星期k  hh:mm'));
      this.showTimer.setInterval(function () {
        now = new Date();
        timerEl.html(Transform.date(now, 'MM月dd日  星期k  hh:mm'));
      }, 10000);
    },
    afterIn: function (params) {

    },
    showList: function (group, cursor) {
      this.refresh(group, cursor);
      if (this.dataLength === 0) {

      }
    },
    render: function () {
      this.$el.html(this.template);
      this.items = this.$('.setting-menu>div');
      return this;
    },
    _focusMenu: function () {
      if (!this.isMenuFocus) {
        this.rightArea.removeClass('focus');
        this.list.addClass('focus');
        this.focus.removeClass('setting-menu-unfocus');
        this.isMenuFocus = true;
      }
    },
    _blueMenu: function () {
      if (this.isMenuFocus && this.dataLength === 0) return;
      if (this.isMenuFocus) {
        this.rightArea.addClass('focus');
        this.list.removeClass('focus');
        this.focus.addClass('setting-menu-unfocus');
        this.isMenuFocus = false;
      }
    },
    onkeydown: function (keyCode) {
      if (!this.isMenuFocus) {
        if (!this.menuDetail[this.dataIndex].onKeyDown(keyCode)) {
          this.menuDetail[this.dataIndex].blur();
          this._focusMenu();
        }
        return;
      }
      switch (keyCode) {
        case jsf.Event.KEY_DOWN:
          this._offset(1);
          break;
        case jsf.Event.KEY_UP:
          this._offset(-1);
          break;
        case jsf.Event.KEY_RIGHT:
        case jsf.Event.KEY_ENTER:
          if (this.isMenuFocus) {
            if (this.menuDetail[this.dataIndex].canBeFocused) {
              this._blueMenu();
              this.menuDetail[this.dataIndex].focus();
            }
          }
          break;
        default:
          break;
      }
      /* switch (keyCode) {
       case jsf.Event.KEY_FAV:
       if (this.dataLength > 0) {
       this.favChanged = true;
       var channel = this.menuItems.get(this.dataIndex);
       var currentFavValue = channel.isFav();
       channel.setFav(!currentFavValue);
       currentFavValue ? this.items[this.getCurrentFocusItemIndex()].fav.removeClass('fav') : this.items[this.getCurrentFocusItemIndex()].fav.addClass('fav');
       }
       break;
       case jsf.Event.KEY_DOWN:
       this._offset(1);

       break;
       case jsf.Event.KEY_UP:
       this._offset(-1);
       break;
       case jsf.Event.KEY_LEFT:
       this._focusMenu();
       if (this.isMenuFocus) {
       this.checkFav();
       this.group.offset(-1);
       this.showList(this.group.data[this.group.dataIndex].list);
       } else {
       this._offset(-1);
       }
       this._blueMenu();
       break;
       case jsf.Event.KEY_RIGHT:
       this._focusMenu();
       if (this.isMenuFocus) {
       this.checkFav();
       this.group.offset(1);
       this.showList(this.group.data[this.group.dataIndex].list);
       } else {
       this._offset(1);
       }
       this._blueMenu();
       break;
       case jsf.Event.KEY_BACK:
       Broadcast.trigger(Event.pageChanged, null);
       break;
       case jsf.Event.KEY_ENTER:
       if (this.dataLength === 0 || this.isMenuFocus) return;
       var channel = this.menuItems.get(this.dataIndex);
       var cursor = this.dataIndex;
       var current = Live.getCurrentChannelIndex();
       if (this.group.dataIndex !== 0) {
       var menuItems = this.group.data[0].list;
       for (var i = 0, j = menuItems.length; i < j; i++) {
       if (channel === menuItems.get(i)) {
       cursor = i;
       }
       }
       }
       cursor !== current && Live.offsetChannel(cursor - Live.getCurrentChannelIndex());
       Broadcast.trigger(Event.pageChanged, 'epg');
       break;
       default:
       break;
       }*/
    }
  });

  module.exports = {
    create: function (app) {
      if (!this._instance) {
        this._instance = new SettingView({
          parent: app.$el,
          state: app.state
        });
      }
      return this._instance;
    }
  };
});
