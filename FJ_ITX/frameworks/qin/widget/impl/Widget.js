/**
 * Created by zhangzhijiang on 2015/3/10.
 */

jsf.Widget = JSFWidget.extend({
    handle: null,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    zOrder: 0,
    opacity: 0,
    /*private params*/
    _instance: false,
    _eventCallback: null,
    init: function (_handle) {
        if (typeof _handle == "undefined") {
            throw "It must use 'jsf.Widget.crate' or 'jsf.Widget.bind' to create the instance of widget!";
        }
        this._instance = true;
        this.handle = _handle;
        jsf.log.d("this.handle=" + this.handle);
        //init prop
        var _prop = qin.wm.get(this.handle, ["wx", "wy", "wz", "ww", "wh"]);
        if (_prop != "" && _prop != null) {
            _prop = JSON.parse(_prop);
            this.x = typeof _prop["wx"] == "undefined" ? 0 : _prop["wx"];
            this.y = typeof _prop["wy"] == "undefined" ? 0 : _prop["wy"];
            this.zOrder = typeof _prop["wz"] == "undefined" ? 0 : _prop["wz"];
            this.width = typeof _prop["ww"] == "undefined" ? 0 : _prop["ww"];
            this.height = typeof _prop["wh"] == "undefined" ? 0 : _prop["wh"];
        }
    },
    /**
     * release the instance of widget
     */
    release: function () {
        if (this._instance) {
            jsf.log.d("release the widget's instance");
            this._instance = false;
            qin.wm.destroy(this.handle);
            return jsf.JSF_SUCCESS;
        } else {
            throw "The instance of widget had been released!";
        }
        return jsf.JSF_FAIL;
    },
    /**
     * show widget
     * @event WM_SHOW_WINDOW
     */
    show: function () {
        if (this._instance) {
            qin.wm.show(this.handle);
            return jsf.JSF_SUCCESS;
        } else {
            throw "The instance of widget had been released!";
        }
        return jsf.JSF_FAIL;
    },
    /**
     * hide widget
     * @event WM_HIDE_WINDOW
     */
    hide: function () {
        if (this._instance) {
            qin.wm.hide(this.handle);
            return jsf.JSF_SUCCESS;
        } else {
            throw "The instance of widget had been released!";
        }
        return jsf.JSF_FAIL;
    },
    /**
     * let widget get focus
     * @event WM_FOCUS_WINDOW
     */
    focus: function () {
        if (this._instance) {
            qin.wm.focus(this.handle);
            return jsf.JSF_SUCCESS;
        } else {
            throw "The instance of widget had been released!";
        }
        return jsf.JSF_FAIL;
    },
    /**
     * let widget get lose focus
     * @event WM_BLUR_WINDOW
     */
    blur: function () {
        if (this._instance) {
            qin.wm.blur(this.handle);
            return jsf.JSF_SUCCESS;
        } else {
            throw "The instance of widget had been released!";
        }
        return jsf.JSF_FAIL;
    },
    /**
     * set the position of widget
     * @param _x
     * @param _y
     * @param _width
     * @param _height
     * @param _zOrder
     */
    setPosition: function (_x, _y, _zOrder, _width, _height) {
        if (this._instance) {
            if (isNaN(_x) || isNaN(_y) || isNaN(_width) || isNaN(_height) || isNaN(_zOrder)) {
                throw "The arguments is invalid, when setting position!";
            }
            jsf.log.d(JSON.stringify({
                "wx": _x,
                "wy": _y,
                "wz": _zOrder,
                "ww": _width,
                "wh": _height
            }));
            var _rtn = qin.wm.set(this.handle, JSON.stringify({
                "wx": _x,
                "wy": _y,
                "wz": _zOrder,
                "ww": _width,
                "wh": _height
            }));
            jsf.log.d("setPosition _rtn=" + _rtn)
            if (_rtn == 0) {
                this.x = _x;
                this.y = _y;
                this.width = _width;
                this.height = _height;
                this.zOrder = _zOrder;
                return jsf.JSF_SUCCESS;
            }
        } else {
            throw "The instance of widget had been released!";
        }
        return jsf.JSF_FAIL;
    },
    /**
     * set the opacity of widget
     * @param _opacity
     */
    setOpacity: function (_opacity) {
        if (this._instance) {
            if (isNaN(_opacity) || _opacity < 0 || _opacity > 1) throw "The arguments is invalid, when setting opacity!";
            var _json = {"opacity": _opacity};
            var _rtn = qin.wm.set(this.handle, JSON.stringify(_json));
            jsf.log.d("setOpacity rtn = " + _rtn);
            if (_rtn == 0)
                return jsf.JSF_SUCCESS;
        } else {
            throw "The instance of widget had been released!";
        }
        return jsf.JSF_FAIL;
    },
    /**
     * get the opacity of widget
     */
    getOpacity: function () {
        if (this._instance) {
            var _rtn = qin.wm.get(this.handle, ["opacity"]);
            if (_rtn != "" && _rtn != null) {
                _rtn = JSON.parse(_rtn);
                if (_rtn && typeof _rtn["opacity"] != "undefined") {
                    return _rtn["opacity"];
                }
            }
        } else {
            throw "The instance of widget had been released!";
        }
        return null;
    },
    /**
     * send broadcast to other widget
     * @param _message
     * @event WM_BROADCAST
     */
    broadcast: function (_message) {
        if (this._instance) {
            if (typeof  _message == "undefined") throw "The arguments is invalid, when executing broadcast!";
            qin.wm.broadcast(this.handle, _message);
            return jsf.JSF_SUCCESS;
        } else {
            throw "The instance of widget had been released!";
        }
        return jsf.JSF_FAIL;
    },
    /**
     * the event's listener of the widget
     * @param _callback
     */
    listener: function (_callback) {
        if (this._instance) {
            this._eventCallback = _callback;
            jsf.Event.addEventListener(jsf.Event.TYPE_WIDGET, this._eventListener, this);
            return jsf.JSF_SUCCESS;
        } else {
            throw "The instance of widget had been released!";
        }
        return jsf.JSF_FAIL;
    },
    _eventListener: function (_event, _msg) {
        /*var _jsfEvent, _eventArray = [jsf.Event.WIDGET_BROADCAST, jsf.Event.WIDGET_SHOW, jsf.Event.WIDGET_HIDE, jsf.Event.WIDGET_FOCUS, jsf.Event.WIDGET_BLUR];
         if (_eventArray.contains(_event)) {
         _jsfEvent = _event;
         } else {
         _jsfEvent = "unknow";
         }*/
        this._eventCallback(_event, _msg);
    }

});
/**
 * create the instance of widget
 * @param _url
 */
jsf.Widget.create = function (_url) {
    if (typeof _url == "undefined" || _url == "" || _url == null) {
        throw "The page's url of widget can not be null!";
    }
    var _rtnHandle = qin.wm.create(_url);
    if (_rtnHandle != -1) { //success
        var _instanceObject = new jsf.Widget(_rtnHandle);
        jsf.log.i("The widget of '" + _url + "' has been create");
        return _instanceObject;
    } else {
        jsf.log.e("create the widget fail");
    }
    return null;
};

/**
 * bind the instance of widget width handle
 * @param _handle
 */
jsf.Widget.bind = function (_handle) {
    if (typeof _handle != "undefined") {
        var _instanceObject = new jsf.Widget(_handle);
        return _instanceObject;
    } else {
        throw "The handle of widget can not be null!";
    }
    return null;
};


/**
 * Event Map
 * */
jsf.Event.WIDGET_BROADCAST = "WM_BROADCAST";
jsf.Event.WIDGET_SHOW = "WM_SHOW_WINDOW";
jsf.Event.WIDGET_HIDE = "WM_HIDE_WINDOW";
jsf.Event.WIDGET_FOCUS = "WM_FOCUS_WINDOW";
jsf.Event.WIDGET_BLUR = "WM_BLUR_WINDOW";