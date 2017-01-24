/**
 * app.js
 * @authors Casper
 * @date    2015/07/03
 * @version 1.0.0
 */
define([], function (require, exports, module) {
    var Live = require('service/Live'),
        Rec = require('service/Rec'),
        Broadcast = require('service/Broadcast'),
        SysConfig = require('service/SysConfig');
    var BodyView = Backbone.View.extend({
            el: '#main',
            initialize: function (options) {
                this.state = new Backbone.Model({});
                this.currentModeName = null;
                this.preventKey = false;
                this.doOutAnimate = false;
            },
            toggleTo: function (name, params, options) {
                options = jsf.inject(jsf.clone(page_options), options);
                if (this.currentModeName !== name) {
                    this.currentModeName = name;
                    if (this.doOutAnimate) {
                        return;
                    }
                    this.preventKey = true;
                    if (this.current) {
                        var targetElement = this.current.create(app);
                        this.doOutAnimate = true;
                        // targetElement.out(options.cancalAnimation);
                        if (options.cancalAnimation) {
                            targetElement.beforeOut();
                            // targetElement.afterOut();
                            // this.current._instance.$el.remove();
                            this.current.release && this.current.release();
                            this.current._instance = null;
                            this.doOutAnimate = false;
                            this.changeTo(this.currentModeName, params, options);
                        } else {
                            targetElement.out();
                            var self = this;
                            targetElement.el.addEventListener('webkitAnimationEnd', function (event) {
                                if (event.target === this && event.animationName === targetElement.outClass) {
                                    this.removeEventListener('webkitAnimationEnd', arguments.callee);
                                    targetElement.afterOut();
                                    self.current.release && this.current.release();
                                    self.doOutAnimate = false;
                                    self.changeTo(self.currentModeName, params, options);
                                }
                            });
                        }
                    } else {
                        this.changeTo(this.currentModeName, params, options);
                    }
                } else {
                    options.callbackForBeforeChange && options.callbackForBeforeChange();
                    this.current.refresh && this.current.refresh(params);
                    options.callback && options.callback();
                }
            },
            changeTo: function (name, params, options) {
                Broadcast.trigger('page:change');
                factory.get(this.currentModeName, function (module) {
                    this.current = module;
                    var targetElement = this.current ? this.current.create(appOptions) : null;
                    if (targetElement) {
                        if (!options.cancalAnimation) {
                            var self = this;
                            targetElement.el.addEventListener('webkitAnimationEnd', function (event) {
                                if (event.target === this && event.animationName === self.current.inClass) {
                                    this.removeEventListener('webkitAnimationEnd', arguments.callee);
                                    self.preventKey = false;
                                    self.current.afterIn(params);
                                    options.callback && options.callback();
                                }
                            });
                        }
                        options.callbackForBeforeChange && options.callbackForBeforeChange();
                        targetElement.in(params, options.cancalAnimation);
                        if (options.cancalAnimation) {
                            this.preventKey = false;
                            targetElement.afterIn(params);
                            options.callback && options.callback();
                        }
                    }
                }, this);
            },
            onkeydown: function (keyCode) {
                jsf.log.d('[app] get a key down event, keyCode is ' + keyCode + ', preventKey is ' + this.preventKey);
                !this.preventKey && this.current && this.current.create(app).onkeydown(keyCode);
            }
        }),
        app = new BodyView(),
        factory = {
            get: function (name, callback, context) {
                jsf.log.d('page:' + name);
                if (name === 'none') {
                    callback.call(context, null);
                } else {
                    var params = name.split('-'),
                        moduleName = 'module/',
                        module;
                    if (params.length === 1) {
                        moduleName += params[0] + '/main';
                    } else {
                        moduleName += params.join('/');
                    }
                    require.async(moduleName, function (module) {
                        callback.call(context, module ? module : null);
                    });
                }
            }
        };
    var appOptions = {
        $el: {
            append: function (html) {
                app.$el.html(html);
            }
        },
        state: app.state
    };

    var page_options = {
        cancalAnimation: true,
        callback: null,
        callbackForBeforeChange: null
    };
    Broadcast.on('page:to', function (page, params, options) {
        page && this.toggleTo(page, params, options);
    }, app);
    Broadcast.on('key:press', function (keyCode) {
        this.onkeydown(keyCode);
    }, app);
    module.exports = app;
});