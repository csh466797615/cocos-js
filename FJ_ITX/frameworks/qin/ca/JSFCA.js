/**
 * JSFCA.js
 * @authors Casper 
 * @date    2016/07/06
 * @version 1.0.0
 */
/**
 * jsf.CA is a global single object.
 * @requires jsf.WorkTime, jsf.Operator, jsf.Wallet, jsf.Entitle, jsf.Detitle, jsf.Feed, jsf.CurrentIPP, jsf.Mail, jsf.MailList
 */
(function () {
  'use strict';
  /**
   * The mthods of jsf.CA.
   * @constant
   * @type {Function}
   */
  var Methods = {
    fetch: getter__get_card_info,
    getAClistInfo: function (operatorId) {return JSON.parse(qin.ca.getAClistInfo(operatorId));},
    getUpgradeInfo: function () {return JSON.parse(qin.ca.getCAInfoRepertory(['getScUpgradeInfo'])).getScUpgradeInfo;},
    getCardStatus: function () {return qin.ca.cardStatus();},
    getPairedStatus: function () {return JSON.parse(qin.ca.getPairedStatus());},
    checkPin: check__check_pin,
    setPaired: setter__set_paired,
    getRating: function () {return qin.ca.getRating();},
    setRating: setter__set_rating,
    changePin: setter__set_pin,
    getWorkTime: getter__get_work_time,
    setWorkTime: setter__set_work_time,
    getOperators: getter__get_operators,
    getWallets: getter__get_wallets,
    getEntitles: getter__get_entitles,
    getDetitles: getter__get_detitles,
    deleteDetitle: delete__delete_detitle,
    getCustomized: function () {return JSON.parse(qin.ca.cardCustomizedInfo())},
    getFeeds: getter__get_feeds,
    getMailList: function () {return new jsf.MailList();},
    setParentPair: setter__set_parent_pair,
    getIPPs: getter__get_ipps,
    bookCurrentIPP: add__add_ipp,
    cancleCurrentIPP: cancel__cancel_ipp,
    getPlayingInfo: function () {return JSON.parse(qin.ca.caPlayingInfo());},
    addListener: addListener,
    removeListener: removeListener
  };
  var CATypes = {
    TYPE_NORMAL: 'normal',
    TYPE_IRDETO: 'irdeto',
    TYPE_TF: 'tongfang',
    TYPE_CTI: 'cti'
  };
  var CAType = jsf.boot.CONFIG.ca || CATypes.TYPE_NORMAL;
  var Values = {};

  /**
   * An internal function for creating assigner functions.
   * Used to return the value of private property.
   * @param  {String}   propName  The private attribute name of the obj
   * @return {Function}
   */
  function createPropAssigner (propName) {
    return function () {
      return (propName in Values) ? Values[propName] : '';
    };
  }

  function transform__transform_work_time_by_ca (info, workTime) {
    if (CAType === CATypes.cti) {
      info.setEnabled = workTime.setEnabled;
      info.startChannel = workTime.startChannel;
      info.endChannel = workTime.endChannel;
      info.controlStatus = workTime.controlStatus;
    }
    return info;
  }

  function check__check_pin (pinCode) {
    if (pinCode) {
      var result = qin.ca.checkPin(JSON.stringify({
        pin: pinCode
      }));
      return !result ? 1 : result;
    } else {
      return -2;
    }
  }

  function getter__get_card_info () {
    Values = {};
    try {
      var caInfo = qin.ca.getCAInfoRepertory(['caName', 'cardID', 'version', 'caSystemID', 'provider', 'chipID', 'cardExpireDate', 'cardNationality', 'cardCustomizedInfo'].toString());
      if (caInfo) {
        var caJson = JSON.parse(caInfo);
        Values.name = caJson.caName.caName;
        Values.innerCardId = caJson.cardID.innerCardID;
        Values.cardId = caJson.cardID.cardID;
        Values.caLibVersion = caJson.version.caLibVersion;
        Values.scSWVersion = caJson.version.scSWVersion;
        Values.scHWVersion = caJson.version.scHWVersion;
        Values.systemId = caJson.caSystemID;
        Values.provider = caJson.provider.provider;
        Values.chipInfo = caJson.chipID.chipID;
        Values.expireDate = new Date(caJson.cardExpireDate.cardExpireDate.replace(/-/g, '/'));
        Values.cardNationality = caJson.cardNationality.cardNationality;
        Values.areaCode = caJson.cardCustomizedInfo.areaCode;
        Values.reginCode = caJson.cardCustomizedInfo.reginCode;
        Values.groupId = caJson.cardCustomizedInfo.groupID;
        Values.casn = caJson.cardCustomizedInfo.casn;
        Values.chipsetType = caJson.cardCustomizedInfo.chipsetType;
        Values.cscMaxIndex = caJson.cardCustomizedInfo.cscMaxIndex;
        Values.projectInfo = caJson.cardCustomizedInfo.projectInfo;
        Values.bouquetID = caJson.cardCustomizedInfo.bouquetID;
        Values.stbID = caJson.cardCustomizedInfo.stbID;
        Values.ACInfo = caJson.cardCustomizedInfo.ACInfo;
      }
    } catch (e) {
      jsf.log(e + '(jsf.CA getter__get_card_info)');
    }
  }

  function getter__get_work_time () {
    var workTime = null;
    try {
      workTime = new jsf.WorkTime(JSON.parse(qin.ca.getWorkTime()));
    } catch (e) {
      jsf.log(e + '(jsf.CA getter__get_work_time)');
    }
    return workTime;
  }

  function getter__get_operators () {
    var operators = [];
    var jsonOperator = qin.ca.getOperators();
    if (jsonOperator) {
      var operatorList = JSON.parse(jsonOperator);
      for (var i = 0, j = operatorList.length; i < j; i++) {
        operators.push(new jsf.Operator(operatorList[i]));
      }
    }
    return operators;
  }

  function getter__get_wallets (operatorId) {
    var walletList = [],
      wallets = [],
      walletJson = operatorId ? qin.ca.getWallets(operatorId) : qin.ca.getWallets();
    walletJson && (walletList = JSON.parse(walletJson));
    for (var i = 0, j = walletList.length; i < j; i++) {
      wallets.push(new jsf.Wallet(walletList[i]));
    }
    return wallets;
  }

  function getter__get_entitles (operatorId) {
    var entitleList = [], entitles = [];
    if (operatorId === void 0) {
      entitleList = JSON.parse(qin.ca.getEntitles());
    } else {
      var operator = qin.ca.getEntitles(operatorId);
      if (operator) {
        entitleList = JSON.parse(operator);
      }
    }
    for (var i = 0, j = entitleList.length; i < j; i++) {
      entitles.push(new jsf.Entitle(entitleList[i]));
    }
    return entitles;
  }

  function getter__get_detitles (operatorId) {
    var detitleInfo = {detitleInfos: []}, detitles = [];
    if (operatorId) {
      detitleInfo = JSON.parse(qin.ca.getDetitleInfo(operatorId));
    }
    for (var i = 0, j = detitleInfo.detitleInfos.length; i < j; i++) {
      detitles.push(new jsf.Detitle(detitleInfo.isRead, detitleInfo.detitleInfos[i]));
    }
    return detitles;
  }

  function getter__get_feeds () {
    var feeds = [];
    if (operatorId) {
      var feedData = qin.ca.getFeedDataInfo(operatorId);
      feedData = feedData ? JSON.parse(feedData) : null;
      feedData && feeds.push(new jsf.Feed(feedData));
    }
    return feeds;
  }

  function getter__get_ipps () {
    var ipps = [],
      ippList = JSON.parse(qin.ca.getInquireIPP());
    for (var i = 0, j = ippList.length; i < j; i++) {
      ipps.push(new jsf.CurrentIPP(ippList[i]));
    }
    return ippList;
  }

  function setter__set_paired (pinCode) {
    var result = check__check_pin(pinCode);
    if (result === 1) {
      result = qin.ca.setPaired(JSON.stringify({
        pin: pinCode
      }));
    }
    return !result ? 1 : result;
  }

  function setter__set_rating (pinCode, rating) {
    var result = check__check_pin(pinCode);
    if (result === 1) {
      result = qin.ca.setRating(JSON.stringify({
        pincode: pinCode,
        rating: rating || 0
      }));
    }
    return !result ? 1 : result;
  }

  function setter__set_pin (oldPin, newPin) {
    var result = qin.ca.changePin(JSON.stringify({
      oldPin: oldPin,
      newPin: newPin
    }));
    return !result ? 1 : 0;
  }

  function setter__set_work_time (pinCode, workTime) {
    var result = check__check_pin(pinCode);
    if (result === 1) {
      var info = {
        pin: pinCode,
        startTime: jsf.dateFormat(workTime.startTime, 'hh:mm:ss'),
        endTime: jsf.dateFormat(workTime.endTime, 'hh:mm:ss')
      };
      transform__transform_work_time_by_ca(info, workTime);
      result = qin.ca.setWorkTime(JSON.stringify(info)) >= 0 ? 1 : 0;
    }
    return result;
  }

  function setter__set_parent_pair (operatorId) {
    var result = 1;
    if (operatorId) {
      result = qin.ca.readFeedDataInfo(operatorId);
      if (!result) {
        result = qin.ca.writeFeedDataInfo(operatorId);
      }
    }
    return result === 1 ? 0 : 1;
  }

  function add__add_ipp (pinCode, ipp) {
    var result = check__check_pin(pinCode);
    if (result === 1) {
      result = !qin.ca.book(JSON.stringify({
        pin: pinCode,
        tsID: ipp.tsId,
        networkID: ipp.networkId,
        serviceID: ipp.serviceId,
        playHandle: ipp.playHandle,
        priceType: ipp.type,
        productID: ipp.productId,
        ecmPid: ipp.ecmPid
      })) ? 1 : 0;
    }
    return result;
  }

  function delete__delete_detitle (operatorId, detitleId) {
    return (detitleId === void 0 ? qin.ca.delDetitle(operatorId) : qin.ca.delDetitle(operatorId, detitleId)) === 1 ? 0 : 1;
  }

  function cancel__cancel_ipp (ipp) {
    var result = 0;
    if (ipp) {
      result = !qin.ca.cancelIPP(JSON.stringify({
        tsID: ipp.tsId,
        networkID: ipp.networkId,
        serviceID: ipp.serviceId,
        playHandle: ipp.playHandle,
        ecmPid: ipp.ecmPid
      })) ? 1 : 0;
    }
    return result;
  }

  var listeners = [];
  jsf.eventManager.addListener({
    event: jsf.EventListener.SYSTEM,
    eventType: jsf.EventSystem.TYPE_CA,
    callback: function (event) {
      switch (event.getEventName()){
        case jsf.EventSystem.CA_CARD_PLUGOUT:
          Values = {};
          break;
        case jsf.EventSystem.CA_ENTITLE_RECEIVED:
          getter__get_card_info();
          break;
      }
      jsf.each(listeners, function (listener) {
        listener(event.getEventName(), event.getEventData());
      });
    }
  }, new jsf.Class());
  
  /**
   * Add a listener.
   * @param {Function} listener
   */
  function addListener (listener) {
    listeners.push(listener);
  }

  /**
   * Remove the previous listener.
   * @param {Function} *listener
   */
  function removeListener (listener) {
    if (listener) {
      var index = listeners.indexOf(listener);
      index >= 0 && listeners.splice(index, 1);
    } else {
      listeners.length = 0;
    }
  }

  var CA = {};
  jsf.each({
    name: {value: ''},
    innerCardId: {value: ''},
    cardId: {value: ''},
    areaCode: {value: ''},
    reginCode: {value: ''},
    groupId: {value: ''},
    caLibVersion: {value: ''},
    scSWVersion: {value: ''}, // software version
    scHWVersion: {value: ''}, // hardware version
    systemId: {value: ''},
    provider: {value: ''},
    chipInfo: {value: ''},
    expireDate: {value: ''},
    cardNationality: {value: ''},
    casn: {value: ''},
    chipsetType: {value: ''},
    chipsetRevision: {value: ''},
    cscMaxIndex: {value: ''},
    projectInfo: {value: ''},
    bouquetID: {value: ''},
    stbID: {value: ''},
    ACInfo: {value: ''},
  }, function (prop, propName) {
    jsf.defineGetterSetter(CA, propName, createPropAssigner(propName));
  });

  jsf.defineReadOnlyValue(CA, 'type', CAType);
  jsf.defineReadOnlyProperties(CA, Methods);
  jsf.defineReadOnlyProperties(CA, CATypes);

  jsf.CA = CA;

  jsf.info('current ca is ' + CAType);
  getter__get_card_info();
}());