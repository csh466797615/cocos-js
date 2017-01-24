/**
 * ListView.js
 * @authors Casper ()
 * @date    2015/07/16
 * @version 1.0.0
 */
define(function (require, exports, module) {
    module.exports = require('component/BaseView').extend({
        initialize: function(options) {
            this.outClass   = 'fadeOut';
            this.inClass    = 'fadeIn';
            this.outClassNoAnimation = 'fadeOut-cancel';
            this.inClassNoAnimation = 'fadeIn-cancel';
            this.max        = 0;
            this.itemClass  = '';
            this.mid        = 0;
            this.currentMid = 0;
            this.dataLength = 0;
            this.index      = 0;
            this.isCycle    = true;
            this.ensureSelf(options);
            this.firstItemClass = this.itemClass + '0';
            this.lastItemClass  = this.itemClass + (this.max - 1);
        },
        ensureSelf: function(options) {},
        beforeOffset: function() {},
        offset: function(offset, uncheck) {
            if (this.dataLength > 1 && (this.isCycle || uncheck || this.index > 0 && offset < 0 || this.index < this.dataLength - 1 && offset > 0)) {
                this.beforeOffset();
                this.index = this.offsetIndex(offset);
                var start = (this.currentMid - this.mid + this.max) % this.max;
                if (offset < 0) {
                    this.currentMid = (this.currentMid - 1 + this.max) % this.max;
                    this.getItem((start + this.max - 1) % this.max).className = this.firstItemClass;
                    this.showData((start + this.max - 1) % this.max, this.offsetIndex(-this.mid));
                    for (var i = 0, j = this.max - 1; i < j; i++) {
                        this.getItem((start + i) % this.max).className = this.itemClass + (i + 1);
                    }
                } else {
                    this.currentMid = (this.currentMid + 1) % this.max;
                    this.getItem(start).className = this.lastItemClass;
                    this.showData(start, this.offsetIndex(this.max - 1 - this.mid));
                    start++;
                    for (var i = 0, j = this.max - 1; i < j; i++) {
                        this.getItem((start + i) % this.max).className = this.itemClass + i;
                    }
                }
                this.afterOffset();
            }
        },
        offsetIndex: function (offset) {
            if (this.dataLength === 0) return -1;
            var index = this.index + offset;
            if (this.isCycle) {
                while(index < 0) {
                    index += this.dataLength;
                }
                index = index % this.dataLength;
            }
            return index;
        },
        showData: function (itemIndex, index) {},
        getItem: function (itemIndex) {
            return {};
        },
        afterOffset: function() {}
    });
});