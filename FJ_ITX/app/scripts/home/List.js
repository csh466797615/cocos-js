define(function (require, exports, module) {
    var List = function (pageSize, iterator, onFocusMove, onFocus, onBlur, onNoData, focusId, focusTop, focusStep) {
        this.pageSize = pageSize;
        this.iterator = iterator;
        this.onFocusMove = onFocusMove;
        this.onFocus = onFocus;
        this.onBlur = onBlur;
        this.onNoData = onNoData;

        this.focusId = focusId;
        this.focusTop = focusTop;
        this.focusStep = focusStep;
        this.moveFlag = Boolean(typeof(this.focusId) != 'undefined' && typeof(this.focusTop) != 'undefined' && typeof(this.focusStep) != 'undefined');
    }

    List.prototype = {
        bindData: function (data, index, type) {
            this.type = type;
            this.data = data;
            this.currIndex = index;
            this.focusIndex = this.currIndex % this.pageSize;
            this.length = data.length;
            this.totalPage = Math.ceil(this.length / this.pageSize);
            this.currPage = Math.ceil((this.currIndex + 1) / this.pageSize);
            this.showList();
            if (typeof this.onNoData != "undefined" && this.length == 0) {
                this.onNoData();
            }
        },

        showList: function () {
            this.start = (this.currPage - 1) * this.pageSize;
            this.end = this.currPage * this.pageSize;
            for (var i = 0; i < this.pageSize; i++) {
                var index = this.start + i;
                if (typeof this.type == "undefined" || this.type == null || this.type == 0) {
                    if (index < this.length) {
                        this.iterator(this.data[index], index, i);
                    } else {
                        this.iterator(null, index, i);
                    }
                } else {
                    if (index < this.length) {
                        this.iterator(this.data[index], index, i);
                    } else {
                        this.iterator(null, index, i);
                    }
                }
            }
        },

        up: function () {
            if (this.length == 0) return;
            var oldFocusIndex = this.currIndex % this.pageSize;
            var oldIndex = this.currIndex;
            this.currIndex--;
            this.pageUpdate = false;
            if (this.totalPage > 1 && oldFocusIndex == 0) {
                this.pageUpdate = true;
            }
            if (this.currIndex < 0) {
                this.currIndex = this.length - 1;
            }
            var newIndex = this.currIndex;
            var newFocusIndex = this.currIndex % this.pageSize;
            this.focusIndex = newFocusIndex;
            if (this.moveFlag) {
                slide(this.focusId, this.focusTop + (oldFocusIndex * this.focusStep), this.focusTop + (newFocusIndex * this.focusStep));
            }
            if (this.pageUpdate) {
                this.currPage = Math.ceil((this.currIndex + 1) / this.pageSize);
                this.showList();
            }
            this.onFocusMove(oldFocusIndex, newFocusIndex, oldIndex, newIndex);
        },

        down: function () {
            if (this.length == 0) return;
            var oldFocusIndex = this.currIndex % this.pageSize;
            var oldIndex = this.currIndex;
            this.currIndex++;
            this.pageUpdate = false;
            if (this.totalPage > 1 && (oldFocusIndex == this.pageSize - 1 || (this.currPage == this.totalPage && oldFocusIndex == this.length % this.pageSize - 1))) {
                this.pageUpdate = true;
            }
            if (this.currIndex > this.length - 1) {
                this.currIndex = 0;
            }
            var newIndex = this.currIndex;
            var newFocusIndex = this.currIndex % this.pageSize;
            this.focusIndex = newFocusIndex;
            if (this.moveFlag) {
                slide(this.focusId, this.focusTop + (oldFocusIndex * this.focusStep), this.focusTop + (newFocusIndex * this.focusStep));
            }
            if (this.pageUpdate) {
                this.currPage = Math.ceil((this.currIndex + 1) / this.pageSize);
                this.showList();
            }
            this.onFocusMove(oldFocusIndex, newFocusIndex, oldIndex, newIndex);
        },

        pageUp: function () {
            if (this.totalPage < 2) return;
            this.currPage--;
            if (this.currPage < 1) {
                this.currPage = this.totalPage;
            }
            this.showList();
            this.setBlur();
            this.focusIndex = 0;
            this.currIndex = (this.currPage - 1) * this.pageSize;
            this.setFocus();
        },

        pageDown: function () {
            if (this.totalPage < 2) return;
            this.currPage++;
            if (this.currPage > this.totalPage) {
                this.currPage = 1;
            }
            this.showList();
            this.setBlur();
            this.focusIndex = 0;
            this.currIndex = (this.currPage - 1) * this.pageSize;
            this.setFocus();
        },

        setFocus: function () {
            this.onFocus(this.focusIndex);
        },

        setBlur: function () {
            this.onBlur(this.focusIndex);
        }

    }
    var focusId, focusTop, preTop, slideTimer;

    function slide(_divId, _preTop, _top) {
        if (typeof(_divId) != 'undefined' && typeof(_preTop) != 'undefined' && typeof(_top) != 'undefined') {
            focusId = _divId;
            preTop = _preTop;
            focusTop = _top;
        }
        var moveStep = (focusTop - preTop) * 0.5;
        if (Math.abs(moveStep) > 1) {
            preTop += moveStep;
            $('#' + focusId).css('top', preTop + "px");
            clearTimeout(slideTimer);
            slideTimer = setTimeout(slide, 30);
        } else {
            $('#' + focusId).css('top', focusTop + "px");
        }
    }

    module.exports = List;
});

