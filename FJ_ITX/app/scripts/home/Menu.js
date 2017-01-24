/**
 * Created by apple on 2017/1/9.
 */
define(function (require, exports, module) {
    var Menu = [{
        name: "信息服务",
        pic: ["./app/images/home/service_unFocus.png", "./app/images/home/service.png"],
        sub: [{
            name: "图文频道",
            url: ""
        }, {
            name: "信息广场",
            url: ""
        }]
    }, {
        name: "八闽集萃",
        pic: ["./app/images/home/radio_unFocus.png", "./app/images/home/radio.png"],
        sub: [{name: '本地新闻', url: ''}]
    }, {
        name: "回看点播",
        pic: ["./app/images/home/vod_unFocus.png", "./app/images/home/vod.png"],
        sub: [{
            name: "点播首页",
            url: ''
        }, {
            name: "电视回看",
            url: ""
        }]
    }, {
        name: "电视频道",
        pic: ["./app/images/home/tv_unFocus.png", "./app/images/home/tv.png"],
        sub: [{
            name: "电视直播",
            url: "live-live"
        }, {
            name: "节目预告",
            url: ""
        }, {
            name: "节目列表",
            url: "live-live"
        }, {
            name: "节目收藏",
            url: "live-live"
        }, {
            name: "音频广播",
            url: "live-live"
        }, {
            name: "频道管理",
            url: ""
        }]
    }, {
        name: "高清电视",
        pic: ["./app/images/home/highTv_unFocus.png", "./app/images/home/highTv.png"],
        sub: [{
            name: "高清直播",
            url: "live-live"
        }]
    }, {
        name: "电视应用",
        pic: ["./app/images/home/app_unFocus.png", "./app/images/home/app.png"],
        sub: [{
            name: "电视相册",
            url: ""
        }, {
            name: "本地播放",
            url: ""
        }, {
            name: "本地邮箱",
            url: ""
        }, {
            name: "视频通话",
            url: ""
        }]
    }, {
        name: "系统设置",
        pic: ["./app/images/home/setting_unFocus.png", "./app/images/home/setting.png"],
        sub: [{
          name: "基本设置",
          url: "setting-main",
          options: {
            index: 0
          }
        }, {
          name: "高级设置",
          url: "setting-main",
          options: {
            index: 1
          }
        }, {
          name: "节目搜索",
          url: "setting-main",
          options: {
            index: 2
          }
        }, {
          name: "系统信息",
          url: "setting-main",
          options: {
            index: 3
          }
        }, {
          name: "恢复出厂",
          url: "setting-main",
          options: {
            index: 4
          }
        }, {
          name: "软件升级",
          url: "setting-main",
          options: {
            index: 5
          }
        }]
    }];
    module.exports = Menu;
});