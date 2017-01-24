/**
 * JSFCARelated.js
 * @authors Casper 
 * @date    2016/07/07
 * @version 1.0.0
 */
/**
 * Contains all the objects CA needs.
 */
(function () {
  'use strict';
  /**
   * Sets a property from  a key-vlaue data for obj.
   * @param  {Object} obj
   * @param  {*} value
   * @param  {String} key
   */
  function setter__get_info_from_data (obj, value, key) {
    obj['_' + key] = value;
  }

  /**
   * Transform a string to a date object.
   * @param  {String}
   * @return {Date}
   */
  function transform__transform_string_to_date (str) {
    return new Date(str.replace(/-/g, '/'));
  }

 /**
  * Sets some properties to a prototype.
  * @param {Object} prototype
  * @param {Object} properties
  */
  function add__add_properties (prototype, properties) {
    var __temp;
    jsf.each(properties, function (prop, propName) {
      __temp = '_' + (prop.aliase || propName);
      jsf.defineValue(prototype, __temp, prop.value);
      jsf.defineGetterSetter(prototype, propName, jsf.createPropAssigner(__temp, prop.transform));
    });
  }

  /**
   * A global ca object.
   * @class
   * @extends jsf.Class
   */
  var JSFCAObject = jsf.Class.extend({
    ctor: function (info) {
      jsf.each(info, (function (value, key) {
        setter__get_info_from_data(this, value, key);
      }).bind(this));
    }
  });

  /**
   * Description of work time, include start time and end time.
   * @class
   * @extends jsf.Class
   */
  var JSFWorkTime = jsf.Class.extend({
    startTime: '',
    endTime: '',
    ctor: function (info) {
      this.startTime = new Date(info.startTime.replace(/-/g, '/'));
      this.endTime = new Date(info.endTime.replace(/-/g, '/'));
    }
  });

  /**
   * Used for CTI ca.
   * @class
   * @extends jsf.WorkTime
   */
  var JSFCTIWorkTime = JSFWorkTime.extend({
    setEnabled: true,
    startChannel: '',
    endChannel: '',
    controlStatus: 0
  });

  /**
   * Description of a operator information.
   * @class
   * @extends JSFCAObject
   */
  var JSFOperator = JSFCAObject.extend({
    ctor: function (info) {
      this._super(info);
      jsf.CA.type === jsf.CA.TYPE_TF && (this._aclistInfo = jsf.CA.getAClistInfo(this._id));
    }
  });
  add__add_properties(JSFOperator.prototype, {
    id: {value: 0, aliase: 'operatorID'},
    info: {value: '', aliase: 'operatorInfo'},
    aclistInfo: {value: {}},
  });

  /**
   * Description of a wallert information.
   * @class
   * @extends JSFCAObject
   */
  var JSFWallet = JSFCAObject.extend();
  add__add_properties(JSFWallet.prototype, {
    id: {value: 0, aliase: 'walletID'},
    credit: {value: 0, aliase: 'total'},
    balance: {value: 0, aliase: 'balance'},
    operatorId: {value: 0, aliase: 'operatorID'}
  });

  /**
   * Description of a authorization information.
   * @class
   * @extends JSFCAObject
   */
  var JSFEntitle = JSFCAObject.extend();
  add__add_properties(JSFEntitle.prototype, {
    productId: {value: 0, aliase: 'producetID'},
    productName: {value: ''},
    startTime: {value: '', transform: transform__transform_string_to_date},
    endTime: {value: '', transform: transform__transform_string_to_date},
    operatorId: {value: '', aliase: 'operatorID'},
    canTape: {value: false},
  });

  /**
   * Description of an anti authorization information.
   * @class
   * @extends JSFCAObject
   */
  var JSFDetitle = JSFCAObject.extend({
    ctor: function (isRead, info) {
      this._super(info);
      this._isRead = !isRead;
    }
  });
  add__add_properties(JSFDetitle.prototype, {
    isRead: {value: false},
    id: {value: 0, aliase: 'checkNum'}
  });

  /**
   * Description of a card information.
   * @class
   * @extends JSFCAObject
   */
  var JSFFeed = JSFCAObject.extend();
  add__add_properties(JSFFeed.prototype, {
    isChild: {value: 0, transform: function (value) {return !!value;}},
    feedPeri: {value: 0, aliase: 'feedCycle'},
    lastFeedTime: {value: '', transform: transform__transform_string_to_date},
    parentCardSN: {value: ''},
    canFeed: {value: 0, transform: function (value) {return !!value;}}
  });

  /**
   * Description of a ipp information.
   * @class
   * @extends JSFCAObject
   */
  var JSFCurrentIPP = JSFCAObject.extend();
  add__add_properties(JSFCurrentIPP.prototype, {
    type: {value: 0},
    tsId: {value: 0, aliase: 'tsID'},
    networkId: {value: 0, aliase: 'networkID'},
    serviceId: {value: 0, aliase: 'serviceID'},
    playHandle: {value: 0},
    operatorId: {value: 0, aliase: 'operatorID'},
    productId: {value: 0, aliase: 'productID'},
    productName: {value: ''},
    sendTime: {value: '', transform: transform__transform_string_to_date},
    endTime: {value: '', transform: transform__transform_string_to_date},
    price: {value: ''},
    ecmPid: {value: 0},
  });

  /**
   * Description of a mail information.
   * @class
   * @extends JSFCAObject
   */
  var JSFMail = JSFCAObject.extend();
  add__add_properties(JSFMail.prototype, {
    id: {value: 0, aliase: 'emailID'},
    isNew: {value: false, transform: function (value) {return !!value;}},
    priority: {value: 0},
    senderId: {value: '', aliase: 'senderID'},
    title: {value: ''},
    sendTime: {value: '', transform: transform__transform_string_to_date},
    content: {value: ''},
  });

  // The sort information.
  var MailSortKeys = {
    SORTKEY_CTEATETIME: 'create_time',
    SORTKEY_READ: 'read',
    SORTKEY_READTIME: 'create_time__read'
  };
  /**
   * Description of a mail collection.
   * @class
   * @extends jsf.Class
   */
  var JSFMailList = jsf.Class.extend({
    ctor: function () {
      var emailNumInfo = JSON.parse(qin.ca.getEmailNumInfo());
      this._emailSpaceNum = emailNumInfo.emailSpaceNum;
      this._emailNum = emailNumInfo.emailNum;
      this._newLength = 0;
      this._mails = [];
      var mails = JSON.parse(qin.ca.getEmails());
      for (var i = 0, j = mails.length; i < j; i++) {
        if (mails[i].isNew) {
          this._newLength++;
        }
        mails[i].content = qin.ca.getEmailContent(mails[i].emailID);
        this._mails.push(new jsf.Mail(mails[i]));
      }
    },
    get: function (cursor) {
      if (cursor >= 0 && cursor <= this.length - 1) {
        return this._mails[cursor];
      }
      return null;
    },
    delete: function (cursor) {
      var mail = this.get(cursor);
      var result = 0;
      if (mail) {
        result = !qin.ca.deleteEmail(mail.id);
        if (result === 1) {
          this._mails.splice(cursor, 1);
          this._emailNum--;
          mail.isNew && this._newLength--;
        }
      }
      return mail ? !qin.ca.deleteEmail(mail.id) ? 1 : 0 : 0;
    },
    deleteAll: function () {
      for (var i = 0, j = this.length; i < j; i++) {
        qin.ca.deleteEmail(this._mails[i].id);
      }
      this._emailSpaceNum = 0;
      this._emailNum = 0;
      this._mails.length = 0;
    },
    sort: function (sortKey, sortType) {
      // Default value of sortType is jsf.SORT_ASC.
      var less = sortType === jsf.SORT_DESC ? 1 : -1;
      var greater = sortType === jsf.SORT_DESC ? -1 : 1;
      switch (sortKey) {
        case MailSortKeys.SORTKEY_CTEATETIME:
          var tmpA, tmpB;
          this._mails.sort(function (a, b) {
            tmpA = a.sendTime.getTime();
            tmpB = a.sendTime.getTime();
            return tmpA === tmpB ? -1 : tmpA < tmpB ? less : greater;
          });
          break;
        case MailSortKeys.SORTKEY_READ:
          this._mails.sort(function (a, b) {
            return a.isNew === b.isNew ? -1 : a.isNew ? less : greater;
          });
          break;
        case MailSortKeys.SORTKEY_READTIME:
          this.sort(MailSortKeys.SORT_READ, sortType);
          var tmpA, tmpB;
          this._mails.sort(function (a, b) {
            tmpA = a.sendTime.getTime();
            tmpB = a.sendTime.getTime();
            return a.isNew === b.isNew ? tmpA === tmpB ? -1 : tmpA < tmpB ? less : greater : -1;
          });
          break;
      }
    }
  });
  add__add_properties(JSFMailList.prototype, {
    space: {value: 0, aliase: 'emailSpaceNum'},
    length: {value: 0, aliase: 'emailNum'},
    newLength: {value: 0}
  });
  jsf.defineReadOnlyProperties(JSFMailList, MailSortKeys);

  jsf.WorkTime = jsf.CA.type === jsf.CA.TYPE_CTI ? JSFCTIWorkTime : JSFWorkTime;
  jsf.Operator = JSFOperator;
  jsf.Wallet = JSFWallet;
  jsf.Entitle = JSFEntitle;
  jsf.Detitle = JSFDetitle;
  jsf.Feed = JSFFeed;
  jsf.CurrentIPP = JSFCurrentIPP;
  jsf.Mail = JSFMail;
  jsf.MailList = JSFMailList;
}());