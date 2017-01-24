/**
 * list.js
 * @authors Casper 
 * @date    2016/07/05
 * @version 1.0.0
 */
define(['view/media/media_list.html'], function(require, exports, module) {
  var Broadcast = require('service/Broadcast'),
    Transform = require('service/Transform'),
    SysConfig = require('service/SysConfig'),
    Timer = require('service/Timer'),
    Local = require('service/Local');
  var MediaListCurrentType = '';
  var BaseView = require('component/BaseView'),
    ListView = require('component/ListView'),
    MediaItem = BaseView.extend({
      template: '<div></div><div><span></span></div><div></div><div></div>',
      ensureSelf: function(options) {
        this.$el.html(this.template);
        var items = this.$('>div');
        this.status = items.eq(0)[0];
        this.name = items.eq(1).find('span');
        this.size = items.eq(2);
        this.time = items.eq(3);
        this.el.className = options.className;
        var self = this;
        this.el.addEventListener('webkitTransitionEnd', function(event) {
          if (event.target === this && event.propertyName === 'transform') {
            self.remove();
          }
        }, false);
      },
      showData: function(data) {
        if (data) {
          if (data.type === 'DIR') {
            this.status.className = 'status-folder';
            this.size.html('');
          } else {
            this.status.className = 'status-' + MediaListCurrentType;
            var size = data.size;
            if (size < 1024) {
              this.size.html(size + 'M');
            } else {
              this.size.html((size / 1024).toFixed(1) + 'G');
            }
          }
          this.status.style.visibility = 'visible';
          this.name.html(data.name);
        } else {
          this.status.style.visibility = 'hidden';
          this.name.html('');
          this.size.html('');
          this.time.html('');
        }
      }
    }),
    MediaListView = ListView.extend({
      className: 'page animated media-main',
      template: require('view/media/media_list.html'),
      ensureSelf: function(options) {
        this.render();
        options.parent.append(this.el);
        this.cursor = this.$('.media-item-list-progress-cursor');
        this.focus = this.$('.media-item-list-focus')[0];
        this.isCycle = false;
        this.max = 10;
        this.itemClass = 'media-item-';
        this.mid = 1;
        this.currentMid = 1;
        this.focusIndex = this.mid;
        this.minFocusIndex = this.mid;
        this.maxFocusIndex = this.max - 2;
        this.timer = Timer.get();
        this.scrollTimer = Timer.get();
        this.isScroll = false;
        this.items = [];
        this.itemList = this.$('.media-item-list');
        for (var i = 0; i < this.max; i++) {
          this.items.push(new MediaItem({
            className: this.itemClass + i
          }));
          this.itemList.append(this.items[i].el);
        }
        this.items[this.currentMid].el.classList.add('current');
        this.dir = this.$('.media-list-dir>span');
        this.title = this.$('.media-list-title').eq(0);
      },
      getItem: function(itemIndex) {
        return this.items[itemIndex].el;
      },
      showData: function(itemIndex, index) {
        this.items[itemIndex].showData(this.data[index]);
      },
      _startScroll: function() {
        var self = this;
        this.scrollTimer.setTimeout(function() {
          self._scroll();
        }, 800);
      },
      _unscroll: function() {
        this.scrollTimer.clear();
        if (this.isScroll) {
          this.items[(this.currentMid + this.focusIndex - this.minFocusIndex) % this.max].name.unwrap();
          this.isScroll = false;
        }
      },
      _scroll: function() {
        var scrollItemIndex = (this.currentMid + this.focusIndex - this.minFocusIndex) % this.max;
        if (this.items[scrollItemIndex].name.width() > 470) {
          this.items[scrollItemIndex].name.wrap('<marquee></marquee>');
          this.isScroll = true;
        }
      },
      _offset: function(offset) {
        this.dataIndex += offset;
        this.items[(this.currentMid + (this.focusIndex - this.minFocusIndex)) % this.max].el.classList.remove('current');
        if (offset < 0 && this.focusIndex === this.minFocusIndex || offset > 0 && this.focusIndex === this.maxFocusIndex) {
          this.offset(offset);
        } else {
          this.focusIndex = (this.focusIndex + offset + this.max) % this.max;
          this.focus.className = this.itemClass + this.focusIndex;
        }
        this.items[(this.currentMid + (this.focusIndex - this.minFocusIndex)) % this.max].el.classList.add('current');
      },
      _prevent: function(keyCode) {
        switch (keyCode) {
          case jsf.Event.KEY_UP:
          case jsf.Event.KEY_DOWN:
            if (this._preventKey) {
              return true;
            } else {
              this._preventKey = true;
              var self = this;
              this.timer.setTimeout(function() {
                self._preventKey = false;
              }, 200);
            }
            return false;
          default:
            return false;
        }
      },
      refreshList: function() {
        var startItem = (this.currentMid - this.mid + this.max) % this.max;
        for (var i = 0; i < this.max; i++) {
          this.showData((startItem + i) % this.max, this.index + (i - this.mid));
        }
      },
      removeFile: function() {
        this._unscroll();
        Local.remove(this.device, this.data[this.dataIndex], MediaListCurrentType);
        this.data.splice(this.dataIndex, 1);
        var current = (this.currentMid + (this.focusIndex - this.minFocusIndex)) % this.max;
        this.items[current].el.classList.add('media-item-remove');
        if ((this.dataIndex === this.dataLength - 1 || this.dataIndex + (this.maxFocusIndex - this.focusIndex) >= this.dataLength - 1) && this.dataIndex - (this.focusIndex - this.minFocusIndex) > 0) {
          var start = (this.currentMid - this.mid + this.max) % this.max,
            i = 0,
            target = start;
          while (target !== current) {
            i++;
            this.items[target].el.className = this.itemClass + i;
            target = (target + 1) % this.max;
          }
          this.items.splice(start, 0, new MediaItem({
            className: this.itemClass + 0
          }));
          this.itemList.append(this.items[start].el);
          if (current < start) {
            this.items.splice(current, 1);
            start--;
            this.currentMid = (start + this.mid) % this.max;
          } else {
            this.items.splice(current + 1, 1);
          }
          this.index--;
          this.dataIndex--;
          this.showData(start, this.index - this.mid);
        } else {
          var end = (this.currentMid - this.mid + (this.max - 1)) % this.max,
            i = this.max - 1,
            target = end;
          while (target !== current) {
            i--;
            this.items[target].el.className = this.itemClass + i;
            target = (target - 1 + this.max) % this.max;
          }
          this.items.splice(end + 1, 0, new MediaItem({
            className: this.itemClass + (this.max - 1)
          }));
          this.itemList.append(this.items[end + 1].el);
          if (current < end) {
            this.items.splice(current, 1);
          } else {
            this.items.splice(current + 1, 1);
            this.currentMid = (this.currentMid + 1) % this.max;
            end++;
          }
          if (this.dataIndex === this.dataLength - 1) {
            this.dataIndex--;
            if (this.focusIndex > this.minFocusIndex) {
              this.focusIndex--;
              this.focus.className = this.itemClass + this.focusIndex;
            }
          }
          this.showData(end, this.index + (this.max - 1 - this.mid));
        }
        this.dataLength--;
        this.items[(this.currentMid + (this.focusIndex - this.minFocusIndex)) % this.max].el.classList.add('current');
        if (this.dataLength > 0) {
          this._startScroll();
        } else {
          this.focus.style.display = 'none';
        }
        if (this.dataLength > this.maxFocusIndex) {
          this.cursor.css('left', this.dataIndex / (this.dataLength - 1) * 400 + 'px');
        } else {
          this.cursor.css('display', 'none');
        }
      },
      changeDir: function (dir, cursor) {
        this.items[(this.currentMid + (this.focusIndex - this.minFocusIndex)) % this.max].el.classList.remove('current');
        this._unscroll();
        var info = Local.scanDir(this.device, dir, this.currentDir || this.device.root);
        this.dir.eq(1).html(this.currentDir = dir);
        // dir.indexOf('/') === 0 && (dir = dir.substring(1));
        // var dirs = dir.split('/');
        // if (dirs.length === 1) {
        //   this.dir.eq(0).html('');
        //   this.dir.eq(1).html(dir);  
        // } else if (dirs.length >= 2) {
        //   var length = dirs.length;
        //   this.dir.eq(1).html(dirs[length - 1]);
        //   if (this.dir.eq(1).width() >= 1040) {
        //     this.dir.eq(0).html((length > 2 ? '<<&nbsp;' : '') + '<span style="max-width: 110px">' + dirs[length - 2] + '<span>&nbsp;>&nbsp;');
        //   } else {
        //     var other = 1040 - this.dir.eq(1).width();
        //     this.dir.eq(0).html((length > 2 ? '<<&nbsp;' : '')  + dirs[length - 2] + '&nbsp;>&nbsp;');
        //     if (this.dir.eq(0).width() > other) {
        //       this.dir.eq(0).html((length > 2 ? '<<&nbsp;' : '') + '<span style="width=' + (other - 6 * 22) + '">' + dirs[length - 2] + '<span>&nbsp;>&nbsp;');
        //     } else if (length > 2) {
        //       var pre = dirs[length - 2];
        //       var preHtml = this.dir.eq(0).html();
        //       for (var i = length - 3; i >= 0; i--) {
        //         this.dir.eq(0).html((i > 0 ? '<<&nbsp;' : '') + dirs[i] + '&nbsp;>&nbsp;' + pre + '&nbsp;>&nbsp;');
        //         if (this.dir.eq(0).width() > other) {
        //           this.dir.eq(0).html(preHtml);
        //           break;
        //         } else {
        //           pre = dirs[i] + ' > ' + pre;
        //           preHtml = this.dir.eq(0).html();
        //         }
        //       }
        //     }
        //   }
        // }
        var dirMap = info.children.dir;
        var dirsMap = this.device.dir;
        this.dirs = info.children.dir.filter(function (value) {
          return !dirsMap[value.path] || dirsMap[value.path][MediaListCurrentType];
        });
        this.data = this.dirs.concat(info.children[MediaListCurrentType]);
        this.dataIndex = cursor || 0;
        this.dataLength = this.data.length;
        this.dataLength > this.maxFocusIndex && this.cursor.css('display', 'block');
        if (this.dataLength > this.maxFocusIndex) {
          if (this.dataIndex <= this.maxFocusIndex) {
            this.index = 0;
            this.focusIndex = this.minFocusIndex + this.dataIndex;
          } else if (this.dataIndex + (this.maxFocusIndex - this.minFocusIndex + 1) > this.dataLength){
            this.index = this.dataLength - 1 - (this.maxFocusIndex - this.minFocusIndex);
            this.focusIndex = this.dataIndex - this.index;
          } else {
            this.index = this.dataIndex;
            this.focusIndex = 0;
          }
        } else {
          this.index = 0;
          this.focusIndex = this.minFocusIndex + this.dataIndex;
        }
        this.focus.className = this.itemClass + this.focusIndex;
        this.focus.style.display = this.dataLength >= 1 ? 'block' : 'none';
        this.refreshList();
        this._startScroll();
        this.items[(this.currentMid + (this.focusIndex - this.minFocusIndex)) % this.max].el.classList.add('current');
      },
      beforeIn: function(options) {
        MediaListCurrentType = options.type || 'video';
        this.title.html(MediaListCurrentType === 'video' ? 'Video' : MediaListCurrentType === 'audio' ? 'Music' : 'Picture');
        this.device = options.device;
        /*if (!this.device) {
          var locals = Local.getDevices();
          if (locals.length > 0) {
            this.device = Local.scanDevice(locals[0]);
            this.changeDir(this.device.root, this.dataCursor = 0);
          }
        } else {
          this.changeDir(options.currentDir || this.device.root, this.dataCursor = options.cursor || 0);
        }*/
        this.changeDir(options.currentDir || this.device.root, this.dataCursor = options.cursor || 0);
      },
      afterIn: function() {
        if (this.device) {
          Broadcast.on('event:usb', this.diskInOrOut, this);
        } else {
          Broadcast.trigger('page:to', 'media');
        }
      },
      beforeOut: function() {
        Broadcast.off('event:usb', this.diskInOrOut, this);
        this.timer.clear();
        this._unscroll();
      },
      afterOut: function() {
        this.data = [];
        this.dirs = [];
        this.currentDir = null;
        this.device = null;
        this.index = 0;
        this.dataIndex = 0;
        this.refreshList();
        this.items[(this.currentMid + (this.focusIndex - this.minFocusIndex)) % this.max].el.classList.remove('current');
        if (this.focusIndex !== this.minFocusIndex) {
          this.focusIndex = this.minFocusIndex;
          this.focus.className = this.itemClass + this.focusIndex;
        }
        this.dir.html('');
        this.cursor.css('display', 'none');
        this.focus.style.display = 'none';
        this.cursor.css('left', '0px');
      },
      diskInOrOut: function (eventName, eventData) {
        switch (eventName) {
          case jsf.EventSystem.USB_PLUGOUT:
            Local.has(this.device, eventData) && Broadcast.trigger('page:to', 'media');
            break;
        }
      },
      render: function() {
        this.$el.html(_.template(this.template));
        return this;
      },
      onkeydown: function(keyCode) {
        if (this._prevent(keyCode)) return;
        switch (keyCode) {
          case jsf.KEY.up:
            if (this.dataLength > 1) {
              this._unscroll();
              if (this.dataIndex > 0) {
                this._offset(-1);
              } else {
                this.items[(this.currentMid + (this.focusIndex - this.minFocusIndex)) % this.max].el.classList.remove('current');
                this.dataIndex = this.dataLength - 1;
                this.focusIndex = this.dataLength > this.maxFocusIndex ? this.maxFocusIndex : this.dataLength;
                this.index = this.dataIndex - (this.focusIndex - this.minFocusIndex);
                this.items[(this.currentMid + (this.focusIndex - this.minFocusIndex)) % this.max].el.classList.add('current');
                this.focus.className = this.itemClass + this.focusIndex;
                this.dataLength > this.maxFocusIndex && this.refreshList();
              }
              this._startScroll();
              this.cursor.css('left', this.dataIndex / (this.dataLength - 1) * 400 + 'px');
            }
            break;
          case jsf.KEY.down:
            if (this.dataLength > 1) {
              this._unscroll();
              if (this.dataIndex < this.dataLength - 1) {
                this._offset(1);
              } else {
                this.items[(this.currentMid + (this.focusIndex - this.minFocusIndex)) % this.max].el.classList.remove('current');
                this.dataIndex = 0;
                this.index = 0;
                this.focusIndex = this.minFocusIndex;
                this.items[(this.currentMid + (this.focusIndex - this.minFocusIndex)) % this.max].el.classList.add('current');
                this.focus.className = this.itemClass + this.focusIndex;
                this.dataLength > this.maxFocusIndex && this.refreshList();
              }
              this._startScroll();
              this.cursor.css('left', this.dataIndex / (this.dataLength - 1) * 400 + 'px');
            }
            break;
          case jsf.KEY.backspace:
            if (this.currentDir === this.device.root) {
              Broadcast.trigger('page:to', 'media', {
                area: 2,
                device: this.device,
                type: MediaListCurrentType
              });
            } else {
              this.changeDir(this.device.dir[this.currentDir].parent);
            }
            break;
          case jsf.KEY.enter:
            if (this.dataLength > 0) {
              var data = this.data[this.dataIndex];
              if (data.type === 'DIR') {
                this.changeDir(data.path);
              } else {
                jsf.log('will to ' + MediaListCurrentType);
                jsf.log('dataIndex is ' + this.dataIndex + ', dir length is ' + this.device.dir[this.currentDir].children.dir.length);
                var page = MediaListCurrentType === 'video' ? 'media-video' : MediaListCurrentType === 'audio' ? 'media-audio' : 'media-picture';
                Broadcast.trigger('page:to', page, {
                  device: this.device,
                  dir: this.currentDir,
                  cursor: this.dataIndex - this.dirs.length
                });
              }
            }
            break;
          case jsf.KEY.r:
            if (this.dataLength > 0) {
              var data = this.data[this.dataIndex];
              if (data.type !== 'DIR' || data.path !== this.device.unique && data.parent !== this.device.unique) {
                Broadcast.trigger('tip:confirm', 'Are you sure to delete this ' + (data.type === 'DIR' ? 'dir' : 'file') + '?', this.removeFile, this);
              } else {
                Broadcast.trigger('tip:global', {
                  type: 'remind',
                  info: 'The directory can not be deleted.'
                });
              }
            }
            break;
          default:
            break;
        }
      }
    });
  module.exports = {
    create: function(app) {
      if (!this._instance) {
        this._instance = new MediaListView({
          parent: app.$el
        });
      }
      return this._instance;
    }
  };
});