/**
 * Created by zhangzhijiang on 2015/2/10.
 */
JSFMediaPlayer = JSFClass.extend({
    handle: null,
    duration: 0,
    playStatus: "stop",//
    /**
     * create the mediaplayer's instance
     */
    create: function () {

    },

    /**
     * release the mediaplayer's instance
     */
    release: function () {
    },
    /**
     * play
     * @param _url
     */
    play: function (_url) {
    },
    /**
     *
     */
    stop: function () {
    },
    /**
     *
     */
    pause: function () {
        qin.player.pause()
    },
    /**
     *
     */
    resume: function () {
    },
    /**
     *
     * @param _speed
     */
    forward: function (_speed) {
    },
    /**
     *
     * @param _speed
     */
    backward: function (_speed) {
    },
    /**
     *
     * @param _seconds
     */
    seek: function (_seconds) {
    },
    /**
     *
     */
    clearFrame: function () {
    },
    getCurrentPlayTime: function () {
    },
    /**
     *
     */
    getMute: function () {
    },
    /**
     *
     */
    setMute: function (_isMute) {
    },
    /**
     *
     */
    getSoundTrack: function () {
    },
    /**
     *
     */
    setSoundTrack: function (_track) {
    },
    /**
     *
     */
    getAudioType: function () {
    },
    /**
     *
     * @param _type
     */
    setAudioType: function (_type) {
    },
    /**
     *
     */
    getVolume: function () {
    },
    /**
     *
     * @param _volume
     */
    setVolume: function (_volume) {

    },
    /**
     *
     */
    getSubtitle: function () {
    },
    /**
     *
     * @param _isEnable
     */
    setSubtitle: function (_isEnable) {
    },
    /**
     *
     */
    getPosition: function () {
    },
    /**
     *
     * @param _x
     * @param _y
     * @param _z
     * @param _width
     * @param _height
     */
    setPosition: function (_x, _y, _z, _width, _height) {
    },
    /**
     *
     */
    getFullScreen: function () {
    },
    /**
     *
     */
    setFullScreen: function () {
    },
    /**
     *
     */
    getFrameMode: function () {
    },
    /**
     *
     */
    setFrameMode: function (_isKeep) {
    },
    /**
     *
     */
    getAspectRatio: function () {
    },
    /**
     *
     */
    setAspectRatio: function (_mode) {
    },
    /**
     *
     */
    getAspectMatch: function () {
    },
    /**
     *
     */
    setAspectMatch: function (_mode) {
    },
    /**
     *
     */
    getAudioPid: function () {
    },
    /**
     *
     */
    setAudioPid: function (_pid) {
    },
    /**
     * 设置视频的开启或关闭
     * @param _isEnable  true/false
     */
    setVideoEnable: function (_isEnable) {
    },
    /**
     *
     */
    listener: function (_callback) {
    },
    /**
     * 获取静音状态
     */
    getMuteStatus: function () {

    }

});