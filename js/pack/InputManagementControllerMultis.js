 /*global isUndefinedOrNull*/
$.namespace('app.controller');
(function () {
    var MAXIMUM_MILLISECONDS_BETWEEN_BUFFERED_KEYPRESS = 100;

    var KEYS = {
        LINE_FEED : 10,
        CARRIAGE_RETURN : 13,
        FORWARD_SLASH : 191
    };

    var ENTER_KEYS = _.object([
        [KEYS.LINE_FEED, true],       // Mac/Linux
        [KEYS.CARRIAGE_RETURN, true]  // Windows
    ]);

    var initialized = false;

    function keyPressHandler(e) {
        app.controller.InputManagementController.keypress(e);
    }
   
    function keyDownHandler(e) {
        app.controller.InputManagementController.keydown(e);
    }

    function checkBufferForHotkeyHandler() {
        app.controller.InputManagementController.checkBufferForHotkey();
    }

    app.controller.InputManagementController = {

        // @VisibleForTesting
        scheduleHotkeyCheck : function scheduleHotkeyCheck() {
            this.clearHotkeyCheck();
            this.hotkeyTimeoutId = setTimeout(checkBufferForHotkeyHandler, MAXIMUM_MILLISECONDS_BETWEEN_BUFFERED_KEYPRESS);
        },

        // @VisibleForTesting
        clearHotkeyCheck : function clearHotkeyCheck() {
            if (this.hotkeyTimeoutId) {
                clearTimeout(this.hotkeyTimeoutId);
                delete this.hotkeyTimeoutId;
            }
        },

        // @VisibleForTesting
        checkBufferForHotkey : function checkBufferForHotkey() {
            this.clearHotkeyCheck();
            app.model.KeyMappings.publishKey(this.buffer.toLowerCase());
            this.buffer = "";
        },

        // @VisibleForTesting
        clearBufferIfKeypressTimeout : function clearBufferIfKeypressTimeout() {
            var currentTime = new Date().getTime();
            if (this.lastKeypressTime && currentTime - this.lastKeypressTime > MAXIMUM_MILLISECONDS_BETWEEN_BUFFERED_KEYPRESS) {
                this.buffer = "";
            }
            this.lastKeypressTime = currentTime;
        },

        // @VisibleForTesting
        keypress : function (e) {
            var code = (e.which !== 0) ? e.which : e.keyCode;

            this.clearBufferIfKeypressTimeout();
            this.clearHotkeyCheck();

            if (_.has(ENTER_KEYS, code)) {
                app.model.KeyMappings.publishBuffer(this.buffer);
                this.buffer = "";
            } else {
                this.buffer += String.fromCharCode(code);
                if (this.buffer.length === 1) {
                    this.scheduleHotkeyCheck();
                }
            }
        },

        // @VisibleForTesting
        keydown : function (e) {
            // Suppress the forward-slash key that invokes Firefox's quick search
            if (e.keyCode === KEYS.FORWARD_SLASH) {
                e.preventDefault();
                this.keypress(e);
            }
        },

        initialize : function initialize() {
            this.buffer = "";
            $(window).bind("keypress", keyPressHandler);
            $(document).bind("keydown", keyDownHandler);
        },

        clearState : function clearState() {
            delete this.buffer;
            delete this.lastKeypressTime;
            if (this.hotkeyTimeoutId) {
                clearTimeout(this.hotkeyTimeoutId);
                delete this.hotkeyTimeoutId;
            }
            $(window).unbind("keypress", keyPressHandler);
            $(document).unbind("keydown", keyPressHandler);
        },

        // @VisibleForTesting
        KEYS : KEYS
    };

}());
