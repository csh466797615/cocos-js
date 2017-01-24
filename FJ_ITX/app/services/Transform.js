/**
 * Transform.js
 * @authors Casper ()
 * @date    2015/07/06
 * @version 1.0.0
 */
define(function(require, exports, module) {
  var ch_week = ["日", "一", "二", "三", "四", "五", "六"],
    default_week = ["Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat"],
    default_month = ["Jan.", "Feb.", "Mar.", "Apr.", "May.", "June.", "July.", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."];
  return {
    date: function(date, format, week, useEngMonth) {
      var o = {
        "d+": date.getDate(), //日
        "h+": date.getHours(), //小时
        "m+": date.getMinutes(), //分
        "s+": date.getSeconds(), //秒
        "q+": Math.floor((date.getMonth() + 3) / 3), //季度
        "S": date.getMilliseconds(), //毫秒
        "M+": useEngMonth ? default_month[date.getMonth()] : date.getMonth() + 1, //月份
        "k": (week || default_week)[date.getDay()] //星期
      };
      if (/(y+)/.test(format)) format = format.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
      for (var k in o)
        if (new RegExp("(" + k + ")").test(format)) format = format.replace(RegExp.$1, (RegExp.$1.length === 1 || k === "M+" && useEngMonth) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
      return format;
    },
    number: function(number, digit, isSerial) {
      isSerial && number++;
      var result = number + '';
      if (result.length < digit) {
        var offset = digit - result.length;
        while (offset > 0) {
          result = '0' + result;
          offset--;
        }
      }
      return result;
    },
    size: function(size) {
      // if (size >= 1024) {
      // size = size / 1024;
      // if (size >= 1024) {
      // size = size / 1024;
      if (size >= 1024) {
        return (size / 1024).toFixed(2) + 'G';
      } else {
        return size /*.toFixed(2)*/ + 'M';
      }
      // } else {
      //     return size.toFixed(2) + 'KB';
      // }
      // } else {
      //     return size + 'B';
      // }
    }
  };
});