/**
 * JSFChannelManager.js
 * @authors Casper
 * @date    2016/07/04
 * @version 1.0.0
 */
/**
 * jsf.ChannelManager is a global object.
 * @requires jsf.Channel, jsf.ChannelList, jsf.SysInfo, jsf.Setting
 */
(function () {
    'use strict';
    /**
     * The filter information.
     * @type {String}
     */
    var Filters = {
        FILTER_KEY_CHANNELTYPE: 'channel_type',
        FILTER_KEY_CHANNEL_B: 'channel_b',
        FILTER_KEY_FAV: 'fav',
        FILTER_KEY_BAT: 'bat',
        FILTER_KEY_FTA: 'fbat',
        FILTER_KEY_HIDE: 'hide',
        FILTER_KEY_NAME: 'name',
        FILTER_KEY_LOCK: 'lock',
        FILTER_KEY_TIMESHIFT: 'timeshift'
    };
    /**
     * The relation of filters.
     * @type {Number}
     */
    var FilterRelations = {
        FILTER_RELATION_OR: 0,
        FILTER_RELATION_AND: 1
    };
    /**
     * Configuration keys.
     * @type {String}
     */
    var Configs = {
        CONFIG_DB: 'db',
        CONFIG_SORT_KEY: 'SORT_KEY',
        CONFIG_SORT_TYPE: 'SORT_TYPE'
    };
    /**
     * Print information.
     * @type {String}
     */
    var LogInfos = {
        error__sql_query: 'Query error.(jsf.ChannelManager)'
    };
    /**
     * The mthods of jsf.ChannelManager.
     * @type {Function}
     */
    var Methods = {
        config: config,
        getChannelList: getter__get_channels_by_opts,
        getChannelByUnique: getter__get_channel_by_unique,
        listener: addListener,
        removeListener: removeListener,
        save: save,
        clearAll: clear,
        deleteAll: remove__remove_all,
        getShutdownChannel: getter__get_shutdown_channel,
        setShutdownChannel: setter__set_shutdown_channel,
        swap: setter__swap_places
    };

    var configs = {};
    configs[Configs.CONFIG_DB] = 'program';
    configs[Configs.CONFIG_SORT_KEY] = jsf.ChannelList.SORTKEY_NUMBER;
    configs[Configs.CONFIG_SORT_TYPE] = jsf.SORT_ASC;
    /**
     * Configure.
     * @param {JSON} cfg
     */
    function config(cfg) {
        if (cfg) {
            jsf.each(cfg, function (value, key) {
                configs[key] = value;
            });
        }
        return configs;
    }

    /**
     * Query database.
     * @param  {String} sql
     * @return {Array}
     */
    function query(sql) {
        try {
            jsf.log(sql);
            return JSON.parse(qin.data.query(configs[Configs.CONFIG_DB], sql));
        } catch (e) {
            jsf.error(LogInfos.error__sql_query + e);
            return [];
        }
    }

    /**
     * Update the data in database
     * @param  {String} sql
     */
    function update(sql) {
        jsf.log(sql);
        qin.data.set(configs[Configs.CONFIG_DB], sql);
    }

    function transform__transform_condition(filterKey, filterValue) {
        switch (filterKey) {
            case Filters.FILTER_KEY_CHANNELTYPE:
                if (filterValue === jsf.Channel.TYPE_ALL) {
                    return false;
                }
                return function (channel) {
                    return channel.type === filterValue;
                };
            case Filters.FILTER_KEY_CHANNEL_B:
                return function (channel) {
                    qin.evt.debug('Colin bouquetId=' +'filterValue='+filterValue+'***'+ channel.bouquetId.indexOf(filterValue));
                    return channel.bouquetId.indexOf(filterValue) >= 0;
                };
            case Filters.FILTER_KEY_FAV:
                return function (channel) {
                    return channel.isFav();
                };
            case Filters.FILTER_KEY_BAT:
                return function (channel) {
                    return !!channel._bat;
                };
            case Filters.FILTER_KEY_FTA:
                return function (channel) {
                    return channel.isFree;
                };
            case Filters.FILTER_KEY_HIDE:
                return function (channel) {
                    return channel.isHide();
                };
            case Filters.FILTER_KEY_LOCK:
                return function (channel) {
                    return channel.isLocked();
                };
            case Filters.FILTER_KEY_TIMESHIFT:
                return function (channel) {
                    return channel.isTimeShift;
                };
            case Filters.FILTER_KEY_NAME:
                return function (channel) {
                    return channel.name.replace(/\s+/g, '').indexOf(filterValue.replace(/\s+/g, '')) >= 0;
                };
            default:
                return null;
        }
    }

    var cache = null;

    function getter__get_cache() {
        if (cache === null) {
            cache = {
                db: {},
                sortInfo: {
                    sortKey: configs[Configs.CONFIG_SORT_KEY],
                    sortType: configs[Configs.CONFIG_SORT_TYPE]
                },
                list:[]
            };
            //var sql = 'select x.*, y.pid, y.streamType, case when ifnull(z.servicename,"")="" then x.name else z.serviceName end nName from program x left outer join program_stream y on x.indexprogram=y.indexprogram and x.audioIndex=y.audioIndex left outer join serviceName_table z on z.language="' + jsf.SysInfo.get('menuLanguage') + '" and x.indexprogram=z.indexprogram ORDER BY x.' + configs[Configs.CONFIG_SORT_KEY] + ' ' + configs[Configs.CONFIG_SORT_TYPE];
           // select program.*,Bouquet_table.bouquetId,program_stream.pid,program_stream.streamType from program  left outer join Bouquet_table on Bouquet_table.indexBAT=Bouquet_service.indexBAT left outer join Bouquet_service on program.serviceID=Bouquet_service.serviceID and  program.tsID=Bouquet_service.tsID and program.networkID=Bouquet_service.networkID  inner join program_stream on program_stream.indexProgram=program.indexProgram and program_stream.audioIndex=program.audioIndex ORDER BY program.logicId
            var sql = 'select program.*,program_stream.pid,program_stream.streamType,tmp.bouquetId from program left join (Select Bouquet_table.bouquetId,Bouquet_service.serviceID,Bouquet_service.tsID from Bouquet_table inner join Bouquet_service on Bouquet_table.indexBAT=Bouquet_service.indexBAT) as tmp on program.serviceID=tmp.serviceID and  program.tsID=tmp.tsID inner join program_stream on program_stream.indexProgram=program.indexProgram and program_stream.audioIndex=program.audioIndex ORDER BY program.logicId';
            var unique;
            var channel;
            var channels = query(sql);
            var value;
            for (var i = 0, j = channels.length; i < j; i++) {
                value = channels[i];
                if (!cache.db[[value.frequency, value.networkId, value.tsId, value.serviceId].join('-')]) {
                    channel = new jsf.Channel(value);
                    channel.bouquetId = [];
                    cache.db[[value.frequency, value.networkId, value.tsId, value.serviceId].join('-')] = [value, channel];
                    cache.list.push(channel);
                } else {
                    channel = cache.db[[value.frequency, value.networkId, value.tsId, value.serviceId].join('-')][1];
                }
                channel.bouquetId.push(value.bouquetId);
            }
            /*cache.list.map(function (value) {
                if (!cache.db[[value.frequency, value.networkId, value.tsId, value.serviceId].join('-')]) {
                    channel = new jsf.Channel(value);
                    channel.bouquetId = [];
                    cache.db[[value.frequency, value.networkId, value.tsId, value.serviceId].join('-')] = [value, channel];
                } else {
                    channel = cache.db[[value.frequency, value.networkId, value.tsId, value.serviceId].join('-')][1];
                }
                channel.bouquetId.push(value.bouquetIds);
                return channel;
            });*/
        }
        return cache;
    }

    function getter__get_channel_by_cache(frequency, networkId, tsId, serviceId) {
        return getter__get_cache().db[[frequency, networkId, tsId, serviceId].join('-')];
    }

    /**
     * Gets according to the specified conditions.
     * @param {Array} keyArray
     * @param {Array} valueArray
     * @param {Number} rule  0 will be used 'or' processed, 1 will be used 'and' processed, defualt is 0.
     * @return {Array<jsf.Channel>}
     */
    function getter__get_channels_by_opts(keyArray, valueArray, rule) {
        var and = !!rule ? true : false;
        var filterChannels = [];
        var filters = [];
        var length = filters.length;
        var result = true;
        var n;
        var filter;
        if (keyArray && valueArray && keyArray.length === valueArray.length) {
            for (var i = 0, keyLength = keyArray.length; i < keyLength; i++) {
                filter = transform__transform_condition(keyArray[i], valueArray[i]);
                filter && filters.push(filter);
            }
        }
        jsf.each(getter__get_cache().list, function (channel) {
            for (n = 0; n < filters.length; n++) {
                result = filters[n](channel);
                if (result && !and) break;
                if (!result && and) return;
            }
            result && filterChannels.push(channel);
        });
        return new jsf.ChannelList(filterChannels, cache.sortInfo);
    }

    /**
     * Gets a channel by unique info.
     * @param {Number} frequency
     * @param {Number} networkId
     * @param {Number} tsId
     * @param {Number} serviceId
     * @return {jsf.Channel|null}
     */
    function getter__get_channel_by_unique(frequency, networkId, tsId, serviceId) {
        var channel = getter__get_channel_by_cache(frequency, networkId, tsId, serviceId);
        return channel ? channel[1] : null;
    }

    var shutdown_channel = void 0;
    var SHUTDOWN_KEY = 'JSF_SHUTDOWN_CHANNEL_INFO';

    /**
     * Gets the shutdown channel.
     * @return {jsf.Channel}
     */
    function getter__get_shutdown_channel() {
        if (shutdown_channel === void 0) {
            shutdown_channel = null;
            var channels = getter__get_cache().list;
            if (channels.length !== 0) {
                var channelInfo = jsf.SAVE_SHUTDOWN_CHANNEL ? jsf.Setting.getLocalStorage(SHUTDOWN_KEY) : jsf.Setting.getEnv(SHUTDOWN_KEY);
                if (channelInfo !== '') {
                    try {
                        channelInfo = JSON.parse(channelInfo);
                        var channels = getter__get_cache().list;
                        var channel;
                        for (var i = 0, j = channels.length; i < j; i++) {
                            channel = channels[i];
                            if (channel.networkId === channelInfo.networkId && channel.tsId === channelInfo.tsId && channel.serviceId === channelInfo.serviceId) {
                                shutdown_channel = channel;
                                break;
                            }
                        }
                    } catch (e) {
                        jsf.error(e + '(getter__get_shutdown_channel)');
                    }
                }
            }
        }
        return shutdown_channel;
    }

    /**
     * Sets the shutdown channel.
     * @params {jsf.Channel}
     */
    function setter__set_shutdown_channel(channel) {
        if (jsf.isInstanceof(channel, jsf.Channel)) {
            var channelInfo = JSON.stringify({
                frequency: channel.frequency,
                networkId: channel.networkId,
                tsId: channel.tsId,
                serviceId: channel.serviceId
            });
            jsf.SAVE_SHUTDOWN_CHANNEL ? jsf.Setting.setLocalStorage(SHUTDOWN_KEY, channelInfo) : jsf.Setting.setEnv(SHUTDOWN_KEY, channelInfo);
        }
    }

    /**
     * Swap two channel's places.
     * Only useful when sorting by number.
     * @param  {jsf.Channel} channelA
     * @param  {jsf.Channel} channelB
     */
    function setter__swap_places(channelA, channelB) {
        var placeA = channelA.number;
        var placeB = channelB.number;
        update('update program set number=' + placeB + ' WHERE serviceId=' + channelA.serviceId + ' and networkId=' + channelA.networkId + ' and tsId=' + channelA.tsId);
        update('update program set number=' + placeA + ' WHERE serviceId=' + channelB.serviceId + ' and networkId=' + channelB.networkId + ' and tsId=' + channelB.tsId);
    }

    function change__change_channel_property(channel, property) {
        if (channel) {
            var sql = 'select x.name, case when ifnull(z.servicename,"")="" then x.name else z.serviceName end nName from program x left outer join serviceName_table z on z.language="' + jsf.SysInfo.get('menuLanguage') + '" and x.indexprogram=z.indexprogram where x.frequency=' + channel.frequency + ' and x.tsId=' + channel.tsId + ' and x.serviceId= ' + channel.serviceId + ' limit 1';
            var channels = query(sql);
            if (channels.length > 0) {
                channel = channels[0];
                var channelMap = getter__get_channel_by_unique(channel.frequency, channel.networkId, channel.tsId, channel.serviceId);
                if (channelMap) {
                    channelMap[0] = channel;
                    switch (property) {
                        case 'name':
                            channelMap[1]._reset({
                                name: channel.name,
                                nName: channel.nName,
                            });
                            break;
                        case 'pid':
                            channelMap[1]._reset(channel);
                            break;
                    }
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Clear current cache.
     */
    function clear_cache() {
        cache = null;
        shutdown_channel = void 0;
    }

    var operationSqls = [];

    /**
     * Remove all channels.
     */
    function remove__remove_all() {
        operationSqls.push({
            sql: 'delete * from program',
            operate: clear_cache
        });
    }

    function clear() {
        jsf.eventManager.dispatchEvent(new jsf.EventSystem(jsf.EventSystem.TYPE_CHANNEL, jsf.EventSystem.CHANNEL_LIST_CHANGE));
    }

    function save() {
        for (var i = 0, j = operationSqls.length; i < j; i++) {
            query(operationSqls[i].sql);
            operationSqls[i].operate && operationSqls[i].operate();
        }
        operationSqls.length = 0;
    }

    var listeners = [];
    jsf.eventManager.addListener({
        event: jsf.EventListener.SYSTEM,
        eventType: jsf.EventSystem.TYPE_CHANNEL,
        callback: function (event) {
            var isStop = false;
            switch (event.getEventName()) {
                case jsf.EventSystem.CHANNEL_NAME_CHANGED:
                    isStop = !!change__change_channel_property(event.getEventData(), 'name');
                    break;
                case jsf.EventSystem.CHANNEL_PMTPID_CHANGED:
                    isStop = !!change__change_channel_property(event.getEventData(), 'pid');
                    break;
                case jsf.EventSystem.CHANNEL_LIST_CHANGE:
                case jsf.EventSystem.CHANNEL_GROUP_CHANGE:
                    clear_cache();
                    break;
            }
            isStop ? event.stopPropagation() : jsf.each(listeners, function (listener) {
                listener.callback.call(listener.context, event.getEventName(), event.getEventData());
            });
        }
    }, new jsf.Class());
    jsf.eventManager.addListener({
        event: jsf.EventListener.CUSTOM,
        eventName: 'channel_property_changed',
        callback: function (event) {
            var data = event.getUserData();
            var channel = data && data.channel;
            if (channel) {
                var db_cache = cache.db[[channel.frequency, channel.networkId, channel.tsId, channel.serviceId].join('-')];
                if (db_cache) {
                    db_cache[0][data.key] = data.value;
                }
            }
        }
    }, new jsf.Class());

    /**
     * Add a listener.
     * @param {Function} listener
     * @param {Object} *context
     */
    function addListener(listener, context) {
        listeners.push({
            callback: listener,
            context: context
        });
    }

    /**
     * Remove the previous listener.
     * @param {Function} *listener
     */
    function removeListener(listener) {
        if (listener) {
            for (var i = 0, j = listeners.length; i < j; i++) {
                if (listeners[i].callback === listener) {
                    listeners.splice(i, 1);
                    break;
                }
            }
        } else {
            listeners.length = 0;
        }
    }

    var ChannelManager = {};
    jsf.defineReadOnlyProperties(ChannelManager, Configs);
    jsf.defineReadOnlyProperties(ChannelManager, Filters);
    jsf.defineReadOnlyProperties(ChannelManager, FilterRelations);
    jsf.defineReadOnlyProperties(ChannelManager, Methods);

    jsf.ChannelManage = ChannelManager; // For old
    jsf.ChannelManager = ChannelManager;
}());