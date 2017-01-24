/**
 * Created by Casper on 2015/4/10.
 */
define(function(require, exports, module){
    var Timer = function(id){
        this.timer = null;
        this.type = "";
        this.id = id;
    },
    TimerManager = function(){
        this.timers = {};
        this.id = 0;
    };
    Timer.prototype = {
        setTimeout: function(func, time, context){
            this.clear();
            this.type = "timeout";
            var that = this;
            this.timer = setTimeout(function(){
                func.call(context);
                that.timer = null;
            }, time);
        },
        setInterval: function(func, time, soon, context){
            this.clear();
            this.type = "interval";
            soon && func.call(context);
            this.timer = setInterval(context ? func.bind(context) : func, time);
        },
        clear: function(){
            if(this.timer != null){
                this.type === "timeout" ? clearTimeout(this.timer) : clearInterval(this.timer);
                this.timer = null;
            }
        }
    };
    TimerManager.prototype = {
        get: function(){
            var timer = new Timer(this.id);
            this.timers[this.id++] = timer;
            return timer;
        },
        release: function(){
            for (var key in this.timers) {
                this.timers[key].clear();
                delete this.timers[key];
            }
        }
    };
    module.exports = new TimerManager();
});