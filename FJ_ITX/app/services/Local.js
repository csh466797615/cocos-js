/**
 * Created by Casper on 2015/5/12.
 */
define([], function(require, exports, module) {
  var Regex = {
    video: new RegExp('\\.(avi|mp4|ts)$', 'mi'),
    audio: new RegExp('\\.(mp3)$', 'mi'),
    pic: new RegExp('\\.(png|jpg|gif|jpeg)$', 'mi')
  };
  var recording = [];
  var cache = {};
  var devices = null;
  var depth = false;

  function scanDir (cache, dir, parentPath, save) {
    var files = getFileList(dir),
        info = {
          video: !depth,
          audio: !depth,
          pic: !depth,
          children: {
            dir: [],
            video: [],
            audio: [],
            pic: []
          },
          path: dir,
          parent: parentPath
        },
        dirInfo,
        file;
    for (var i = 0, j = files.length; i < j; i++) {
      file = files[i];
      file.path = dir + '/' + files[i].name;
      file.parent = dir;
      if (file.type === 'DIR') {
        if (depth) {
          dirInfo = scanDir(cache, file.path, dir);
          if (dirInfo) {
            dirInfo.video && (info.video = true);
            dirInfo.audio && (info.audio = true);
            dirInfo.pic && (info.pic = true);
            info.children.dir.push(file);
          }
        } else {
          info.children.dir.push(file);
        }
      } else {
        if (Regex.video.test(file.name)) {
          cache.video.count++;
          cache.video.size += file.size;
          info.video = true;
          info.children.video.push(file);
        } else if (Regex.audio.test(file.name)) {
          cache.audio.count++;
          cache.audio.size += file.size;
          info.audio = true;
          info.children.audio.push(file);
        } else if (Regex.pic.test(file.name)) {
          cache.pic.count++;
          cache.pic.size += file.size;
          info.pic = true;
          info.children.pic.push(file);
        }
      }
    }
    if (!save && !info.video && !info.audio && !info.pic) {
      info = null;
    } else {
      cache.dir[dir] = info;
    }
    return info;
  }

  function getDevices () {
    devices = JSON.parse(qin.local.getDevice());
  }

  function removeByFile (device, file, type) {
    device.used -= file.size;
    device[type].count--;
    device[type].size -= file.size;
    device[type].percent = device[type].size / device.total;
  }

  function bubble (device, dir, types) {
    dir = device.dir[dir];
    var old = {};
    var current = {};
    var type;
    if (types === void 0) {
      types = ['video', 'audio', 'pic'];
    }
    for (var i = 0, j = types.length; i < j; i++) {
      type = types[i];
      old[type] = dir[type];
      current[type] = dir.children[type].length > 0;
      if (old[type] && !current[type]) {
        for (var n = 0, m = dir.children.dir.length; n < m; n++) {
          if (dir.children.dir[n][type]) {
            current[type] = true;
            break;
          }
        }
      }
      if (old[type] !== current[type]) {
        dir[type] = current[type];
        dir.parent && bubble(device, dir.parent, [type]);
      }
    }
  }

  function removeDir (device, dir) {
    removeDirFile(device, dir, 'video');
    removeDirFile(device, dir, 'audio');
    removeDirFile(device, dir, 'pic');
    var children_dir = dir.children.dir;
    for (var i = 0, j = children_dir.length; i < j; i++) {
      removeDir(device, children_dir[i]);
    }
    delete device.dir[dir.path];
  }

  function removeDirFile (device, dir, type) {
    var children = dir.chidren[type];
    for (var i = 0, j = children.length; i < j; i++) {
      removeByFile(device, children[i], type);
    }
  }

  function removeFile (device, file, type) {
    if (file.type === 'FILE') {
      if (type === void 0) {
        if (Regex.video.test(file.name)) {
          type = 'video';
        } else if (Regex.audio.test(file.name)) {
          type = 'audio';
        } else if (Regex.pic.test(file.name)) {
          type = 'pic';
        }
      }
      var parentDirInfo = device.dir[file.parent];
      var index = parentDirInfo.children[type].indexOf(file);
      index >= 0 && parentDirInfo.children[type].splice(index, 1);
      if (depth && index >= 0) {
        removeByFile(device, file, type);
        device.percent = (device.used > 0 ? Math.max(1, Math.floor(device.used / device.total * 100)) : 0) + '%';
        bubble(device, file.parent, [type]);
      }
    } else if (file.type === 'DIR'){
      var parentDirInfo = device.dir[file.parent];
      var index = parentDirInfo.children.dir.indexOf(file);
      index >= 0 && parentDirInfo.children.dir.splice(index, 1);
      if (depth && index >= 0) {
        var dir = device.dir[file.path];
        var types = [];
        if (dir.video) types.push('video');
        if (dir.audio) types.push('audio');
        if (dir.pic) types.push('pic');
        if(types.length > 0) {
          bubble(device, parent.path, types);
          removeDir(device, dir);
          device.percent = (device.used > 0 ? Math.max(1, Math.floor(device.used / device.total * 100)) : 0) + '%';
        }
      }
    }
  }

  function getFileList (dir) {
    return JSON.parse(qin.local.getList(JSON.stringify({
      path: dir
    })));
  }

  module.exports = {
    usbChanged: function (code, data) {
      switch (code) {
        case jsf.EventSystem.USB_PLUGOUT:
          if (devices.length > 0 && data.length > 0) {
            var mountPoint;
            var device;
            for (var cursor = 0, length = data.length; cursor < length; cursor++) {
              mountPoint = data[cursor].mountPoint;
              for (var i = 0, j = devices.length; i < j; i++) {
                device = devices[i];
                for (var n = 0, m = device.deviceInfo.length; n < m; n++) {
                  if (device.deviceInfo[n].mountPoint === mountPoint) {
                    this.clearCache(device);
                    device = null;
                    break;
                  }
                }
                if (!device) {
                  devices.splice(i, 1);
                  break;
                }
              }
            }
          }
          break;
      }
      getDevices();
    },
    getRecording: function() {
      var reuslt = qin.pvr.getRecordingProgram();
      jsf.log('qin.pvr.getRecordingProgram:' + reuslt);
      return reuslt ? JSON.parse(reuslt) : [];
    },
    getDevices: function () {
      if (devices === null || !depth) {
        getDevices();
      }/* else {
        var pre = devices;
        getDevices();
        for (var i = 0, j = pre.length; i < j; i++) {
          var find = false;
          for (var n = 0, m = devices.length; n < m; n++) {
            if (pre[i].mainDevice === devices[n].mainDevice) {
              find = true;
              break;
            }
          }
          if (!find) {
            clearCache(pre[i]);
          }
        }
      }*/
      return devices;
    },
    clearCache: function (device) {
      if (device) {
        cache[device.mainDevice] = null;
      }
    },
    scanDevice: function (device, clearCache) {
      if (!device) return null;
      if (clearCache || !depth) {
        this.clearCache(device);
      }
      if (cache[device.mainDevice]) {
        return cache[device.mainDevice];
      }
      var deviceInfo = device.deviceInfo,
          total      = 0,
          used       = 0,
          deviceCache = {
            unique: device.mainDevice,
            root: device.mainDevice,
            video: {
              count: 0,
              size: 0
            },
            audio: {
              count: 0,
              size: 0
            },
            pic: {
              count: 0,
              size: 0
            },
            dir: {}
          };
      if (deviceInfo.length === 1) {
        deviceCache.root = deviceInfo[0].mountPoint;
        total += deviceInfo[0].totalSize;
        used += deviceInfo[0].usedSize;
        depth && scanDir(deviceCache, deviceInfo[0].mountPoint, deviceCache.root, true);
      } else {
        var info = {
          video: !depth,
          audio: !depth,
          pic: !depth,
          children: {
            dir: [],
            video: [],
            audio: [],
            pic: []
          },
          path: device.mainDevice
        }, dirInfo;
        for (var i = 0; i < deviceInfo.length; i++) {
          total += deviceInfo[i].totalSize;
          used += deviceInfo[i].usedSize;
          if (depth) {
            dirInfo = scanDir(deviceCache, deviceInfo[i].mountPoint, deviceCache.root, true);
            dirInfo.video && (info.video = true);
            dirInfo.audio && (info.audio = true);
            dirInfo.pic && (info.pic = true);
          }
          info.children.dir.push({
            type: 'DIR',
            name: deviceInfo[i].mountPoint,
            path: deviceInfo[i].mountPoint,
            parent: device.mainDevice
          });
        }
        deviceCache.dir[device.mainDevice] = info;
      }
      depth && (used = deviceCache.video.size + deviceCache.audio.size + deviceCache.pic.size);
      deviceCache.total = total;
      deviceCache.used = used;
      deviceCache.percent = used > 0 && total > 0 ? Math.min(1, used / total) : 0;
      deviceCache.video.percent = deviceCache.video.size / total;
      deviceCache.audio.percent = deviceCache.audio.size / total;
      deviceCache.pic.percent = deviceCache.pic.size / total;
      cache[device.mainDevice] = deviceCache/*{
        unique: device.mainDevice,
        total: total,
        used: used,
        percent: used > 0 && total > 0 ? Math.min(1, used / total) : 0,
        video: {
          count: deviceCache.video.count,
          size: deviceCache.video.size,
          percent: deviceCache.video.size / total
        },
        audio: {
          count: deviceCache.audio.count,
          size: deviceCache.audio.size,
          percent: deviceCache.audio.size / total
        },
        pic: {
          count: deviceCache.pic.count,
          size: deviceCache.pic.size,
          percent: deviceCache.pic.size / total
        },
        others: {
          size: Math.max(0, total - used)
        },
        list: {
          root: deviceCache.root,
          dir: deviceCache.dir
        }
      }*/;
      return cache[device.mainDevice];
    },
    scanDir: function (deviceCache, dir, parentPath) {
      if (!deviceCache.dir[dir]) {
        scanDir(deviceCache, dir, parentPath);
      }
      return deviceCache.dir[dir];
    },
    remove: function (device, file, type) {
      if (file.type !== 'DIR' || file.path !== device.unique && file.parent !== device.unique) {
        removeFile(device, file, type);
        jsf.log('will delete file, type is ' + file.type + ', path is ' + file.path);
        qin.local.remove(file.type, file.path);
      }
    },
    has: function (deviceInfo, mountPoints) {
      for (var i = 0, j = mountPoints.length; i < j; i++) {
        if (deviceInfo.root === deviceInfo.unique) {
          var dirs = deviceInfo.dir[deviceInfo.root].children.dir;
          for (var n = 0, m = dirs.length; n < m; n++) {
            if (dirs[n].path === mountPoints[i].mountPoint) {
              return true;
            }
          }
        } else if (deviceInfo.root === mountPoints[i].mountPoint) {
          return true;
        }
      }
      return false;
    },
    getMaxDeviceSize: function () {
      var devicesArray = this.getDevices(),
        max = -1,
        deviceInfo;
      for (var i = devicesArray.length - 1; i >= 0; i--) {
        deviceInfo = devicesArray[i].deviceInfo;
        for (var j = 0, m = deviceInfo.length; j < m; j++) {
          deviceInfo[j].totalSize > max && (max = deviceInfo[j].totalSize);
        }
      }
      return max;
    }
  };
});