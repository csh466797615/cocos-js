define(['service/Broadcast'], function (require, exports, module) {
    var Broadcast = require('service/Broadcast');

    function load(moduleName, callback) {
        require.async(moduleName, function (module) {
            setTimeout(function () {
                callback();
            }, 0);
        });
    }

    var isInit = false;

    return {
        start: function (callback) {
            if (!isInit) {
                isInit = true;
                var inits = [
                    'component/BaseView',
                    'component/ListView',
                    'component/TipView',
                    'service/Transform',
                    'service/Broadcast',
                    'service/Timer',
                    'service/Local',
                    'service/Rec',
                    'service/SysConfig',
                    'service/Live',
                    'service/Media',
                    'service/PlayController',
                    'service/GlobalEvent',
                    'service/GlobalEventListener',
                    'module/app'
                ];
                var current = 0;
                var loadCallback = function () {
                    current++;
                    if (current === inits.length) {
                        setTimeout(function () {
                            callback && callback();
                        }, 0);
                    } else {
                        load(inits[current], loadCallback);
                    }
                };
                load(inits[current], loadCallback);
            }
        },
        end: function () {
            require('service/Broadcast').trigger('page:to', 'home', null, {
                callback: function () {
                    Broadcast.trigger('media:play', 'portal');
                    Broadcast.trigger('tip:rec:init');
                    Broadcast.trigger('prevent:all', false);
                }
            });
        }
    };
});