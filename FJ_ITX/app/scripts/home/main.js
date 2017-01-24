define(['view/home/home.html', 'module/home/Menu', 'module/home/List'], function (require, exports, module) {
    var MenuData = require('module/home/Menu'),
        cssArr = ['menu_00', 'menu_01', 'menu_02', 'menu_03', 'menu_04', 'menu_05', 'menu_06'],
        currMain = 3,
        MenuDataIndex = 3,
        Event = {
            offset: 'index-changed',
            click: 'click'
        },
        menuLen = MenuData.length,
        currSub = 0,
        _mList = require('module/home/List'),
        that = this,
        Broadcast = require('service/Broadcast');

    HomeView = require('component/BaseView').extend({
        className: 'page animated home-main',
        template: require('view/home/home.html'),
        dataList: null,
        keyTimer: -1,
        ensureSelf: function (options) {
            this.render();
            this.state = new Backbone.Model({});
            this.timer = require('service/Timer').get();
            this.menuTimer = require('service/Timer').get();
            this.listTimer = require('service/Timer').get();
            this.dataLength = MenuData.length;
            options.parent.append(this.el);
            this.initMenu();
        },
        _timing: function () {
            this.timer.setTimeout(function () {
                Broadcast.trigger('media:stop', 'portal');
                Broadcast.trigger('media:position', 0, 0, 0, 1280, 720);
                Broadcast.trigger('media:play');
                Broadcast.trigger('page:to', 'live-live');
            }, 5000);
        },
        beforeOut: function () {
            this.timer.clear();
            Broadcast.trigger('extral:hide');
        },
        beforeIn: function () {
            Broadcast.trigger('extral:show', {
                net: true,
                usb: true
            });
        },
        afterIn: function () {
            this._timing();
        },
        render: function () {
            this.$el.html(_.template(this.template));
            return this;
        },
        /**
         * 初始化菜单
         */
        initMenu: function () {
            var start = (MenuDataIndex - 3 + menuLen) % menuLen;
            for (var i = start, j = 0; j < 7; i++, j++) {
                var id = i % menuLen;
                if (MenuDataIndex == id) {
                    $('#main_' + j).css('background', 'url(' + MenuData[id].pic[1] + ')');
                } else {
                    $('#main_' + j).css('background', 'url(' + MenuData[id].pic[0] + ')');
                }
            }
            this._initList();
        },
        /**
         * 初始化选项列表
         * @private
         */
        _initList: function () {
            this.dataList = new _mList(5, this.subShow, this.subFocusMove, this.subFocus, this.subBlur, "", "focus", 251, 70);
            this.dataList.bindData(MenuData[MenuDataIndex].sub, currSub);
            this.dataList.setFocus();
            that = this;
        },
        /**
         * 列表内容初始化
         * @param _item
         * @param _index
         * @param _focusIndex
         */
        subShow: function (_item, _index, _focusIndex) {
            if (_item != null) {
                $('#sub_' + _focusIndex).html(_item.name);
            } else {
                $('#sub_' + _focusIndex).html('');
            }
        },
        /**
         * 焦点移动
         * @param _oldFocusIndex
         * @param _newFocusIndex
         */
        subFocusMove: function (_oldFocusIndex, _newFocusIndex) {
            $('#sub_' + _oldFocusIndex).removeClass('list_on');
            $('#sub_' + _newFocusIndex).addClass('list_on');
            currSub = that.dataList.currIndex;
        },
        /**
         * 焦点获焦
         * @param _focusIndex
         */
        subFocus: function (_focusIndex) {
            $('#sub_' + _focusIndex).addClass("list_on");
            $('#focus').css('top', (251 + _focusIndex * 70) + "px");
        },
        /**
         * 焦点失焦
         * @param _focusIndex
         */
        subBlur: function (_focusIndex) {
            $('#sub_' + _focusIndex).removeClass('list_on');
        },
        /**
         * 菜单切换
         * @param _pos 位置-1or1
         */
        leftRight: function (_pos) {
            if (this.keyTimer == -1) {
                this.menuTimer.setTimeout(function () {
                    that.keyTimer = -1;
                }, 110)
            } else {
                return;
            }
            $('#main_' + MenuDataIndex).css('background', 'url(' + MenuData[MenuDataIndex].pic[0] + ')');
            var divStart = (MenuDataIndex + 4) % this.dataLength;
            var divEnd = (MenuDataIndex + 3) % this.dataLength;
            if (_pos > 0) {
                $('#main_' + divStart).css('webkitTransition', "left 0.03s linear");
                $('#main_' + divEnd).css('background', 'url(' + MenuData[(MenuDataIndex + 3) % menuLen].pic[0] + ')');
            } else {
                $('#main_' + divEnd).css('webkitTransition', "left 0.03s linear");
                $('#main_' + divStart).css('background', 'url(' + MenuData[(MenuDataIndex - 3 + menuLen) % menuLen].pic[0] + ')');
            }
            MenuDataIndex = (MenuDataIndex + _pos + this.dataLength) % this.dataLength;
            var newDivStart = (divStart + _pos + this.dataLength) % this.dataLength;
            for (var x = 0; x < this.dataLength; x++) {
                document.getElementById('main_' + (newDivStart + x) % this.dataLength).className = cssArr[x];
            }
            currMain = (currMain + _pos + menuLen) % menuLen;
            $('#main_' + MenuDataIndex).css('background', 'url(' + MenuData[currMain].pic[1] + ')');
            if (_pos > 0) {
                $('#main_' + divStart).css('webkitTransition', "left 0.03s linear");
            } else {
                $('#main_' + divEnd).css('webkitTransition', "left 0.03s linear");
            }
            this.listTimer.clear();
            this.listTimer.setTimeout(function () {
                that.dataList.setBlur();
                currSub = 0;
                that.dataList.bindData(MenuData[MenuDataIndex].sub, currSub);
                that.dataList.setFocus();
            }, 300);
            this.keyTimer = 1;
        },
        onkeydown: function (keyCode) {
            this._timing();
            switch (keyCode) {
                case jsf.Event.KEY_UP:
                    this.dataList.up();
                    this.state.trigger(Event.offset, -1, false);
                    break;
                case jsf.Event.KEY_DOWN:
                    this.dataList.down();
                    this.state.trigger(Event.offset, -1, false);
                    break;
                case jsf.Event.KEY_LEFT:
                    this.leftRight(-1);
                    this.state.trigger(Event.offset, -1, false);
                    break;
                case jsf.Event.KEY_RIGHT:
                    this.leftRight(1);
                    this.state.trigger(Event.offset, 1, false);
                    break;
                case jsf.Event.KEY_BACK:
                    Broadcast.trigger('media:stop', 'portal');
                    Broadcast.trigger('media:position', 0, 0, 0, 1280, 720);
                    Broadcast.trigger('media:play');
                    Broadcast.trigger('page:to', 'live-live');
                    break;
                case jsf.Event.KEY_ENTER:
                    if (MenuData[currMain].sub[currSub].url) {
                        Broadcast.trigger('media:stop', 'portal');
                        if (MenuData[currMain].sub[currSub].url === 'live-live') {
                            Broadcast.trigger('media:position', 0, 0, 0, 1280, 720);
                            Broadcast.trigger('media:play');
                            if(MenuData[currMain].sub[currSub].name ==='节目列表'){
                                Broadcast.trigger('page:to', MenuData[currMain].sub[currSub].url,{area:'list',index:0});
                            }else if(MenuData[currMain].sub[currSub].name ==='节目收藏'){
                                Broadcast.trigger('page:to', MenuData[currMain].sub[currSub].url,{area:'list',index:1});
                            }else if(MenuData[currMain].sub[currSub].name ==='音频广播'){
                                Broadcast.trigger('page:to', MenuData[currMain].sub[currSub].url,{area:'list',index:19});
                            }else if(MenuData[currMain].sub[currSub].name ==='高清直播'){
                                Broadcast.trigger('page:to', MenuData[currMain].sub[currSub].url,{area:'list',index:18});
                            }
                        }
                        Broadcast.trigger('page:to', MenuData[currMain].sub[currSub].url,MenuData[currMain].sub[currSub].options);
                    } else {
                        Broadcast.trigger('tip:static:show');
                        Broadcast.trigger('tip:static', '此业务暂不支持');
                        window.setTimeout(function(){
                            Broadcast.trigger('tip:static:hide');
                        },1000);
                    }
                    break;
                case jsf.Event.KEY_NUMBER_2:
                    Broadcast.trigger('media:stop', 'portal');
                    Broadcast.trigger('media:position', 0, 0, 0, 1280, 720);
                    Broadcast.trigger('media:play');
                    Broadcast.trigger('page:to', 'live-live');
                default:
                    break;
            }
        }
    });
    module.exports = {
        create: function (app) {
            if (!this._instance) {
                this._instance = new HomeView({
                    parent: app.$el,
                    state: app.state
                });
            }
            return this._instance;
        }
    };
})
;