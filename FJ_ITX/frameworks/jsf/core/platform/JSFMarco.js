/**
 * JSFMarco.js
 * @authors Casper 
 * @date    2016/06/30
 * @version 1.0.0
 */
/**
 * Searches for the first occurance of object and removes it. If object is not found the function has no effect.
 * @function
 * @param {Array} arr Source Array
 * @param {*} delObj  remove object
 */
jsf.arrayRemoveObject = function(arr, delObj) {
  for (var i = 0, l = arr.length; i < l; i++) {
    if (arr[i] === delObj) {
      arr.splice(i, 1);
      break;
    }
  }
};

/**
 * Removes from arr all values in minusArr. For each Value in minusArr, the first matching instance in arr will be removed.
 * @function
 * @param {Array} arr Source Array
 * @param {Array} minusArr minus Array
 */
jsf.arrayRemoveArray = function(arr, minusArr) {
  for (var i = 0, l = minusArr.length; i < l; i++) {
    cc.arrayRemoveObject(arr, minusArr[i]);
  }
};

/**
 * Copy an array's item to a new array (its performance is better than Array.slice)
 * @param {Array} arr
 * @return {Array}
 */
jsf.copyArray = function(arr){
  var i, len = arr.length, arr_clone = new Array(len);
  for (i = 0; i < len; i += 1)
    arr_clone[i] = arr[i];
  return arr_clone;
};