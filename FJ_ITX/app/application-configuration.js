var Priority = {
    GLOBAL_KEYBOARD: -10,
    CONFIRM_KEYBOARD: -3,
    SETTER_KEYBOARD: -2,
    PASSWORD_KEYBOARD: -1,
    KEYBOARD: 0
};
// scripts uglify
seajs.config({
    base: '.',
    paths: {
        'component': 'app/components',
        'view': 'app/views',
        'service': 'app/services',
        'module': 'app/scripts'
    },
    preload: []
}).use(['service/Boot'], function (boot) {
    boot.start(function () {
        boot.end();
    });
});