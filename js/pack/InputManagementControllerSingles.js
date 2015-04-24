fcpack.controller.InputManagementController = (function() {

    var inputManagementController = null;

    /*  When the delay action is invoked, it waits long enough to
     *  determine that it was a human doing a keypress and not a scanner.
     */

    var executeDelayedAction = function() {
        var that = this;
        setTimeout( function() {
            if( that.buffer.length === 1 ) {
                var hotkey = that.buffer.toLowerCase();
                if( that.keyboard.isKeyboardCodePressed( hotkey ) === true  ) {
                    that.buffer = "";
                    that.notifications.trigger(screenController.getCurrentScreenName(), that.keyboard.createHotkeyMessageForBufferInput( hotkey ));
                }
            }
        }, fcpack.controller.constants.WORKER_WAIT_TIME);
    };

    var clearBufferIfKeypressTimeout = function() {
        var currentTime = new Date().getTime();
        if( isUndefinedOrNull(this.lastKeypress) === true ) {
            this.lastKeypress = currentTime;
        }

        if( currentTime - this.lastKeypress > fcpack.controller.constants.MAXIMUM_MILLISECONDS_BETWEEN_KEYPRESS ) {
            this.buffer = "";
        }
        this.lastKeypress = currentTime;
    };

    var getEventMessage = function() {
        // If the user simply presses enter with an empty buffer, then treat the input as a hotkey rather than a scan.
        var bufferContents = this.buffer.trim();

        if( bufferContents.length === 0 ) {
            return fcpack.model.EventMessage.create( fcpack.controller.constants.INPUT_TYPES.HOTKEY, fcpack.controller.constants.HOTKEYS.CONTINUE, "keyboard(scan): " + bufferContents );
        }

        if( bufferContents.length === 1 && isAlpha(bufferContents.charCodeAt(0)) && _.has(fcpack.model.Keyboard.MAPPINGS, bufferContents) ) {
            return fcpack.model.EventMessage.create( fcpack.controller.constants.INPUT_TYPES.HOTKEY, fcpack.model.Keyboard.MAPPINGS[bufferContents], "keyboard(scan): " + bufferContents );
        }

        return fcpack.model.EventMessage.create( fcpack.controller.constants.INPUT_TYPES.SCAN, bufferContents, "keyboard(scan): " + bufferContents );
    };

    // constructor
    var InputManagementController = function(notifications) {
        this.buffer = "";
        this.notifications = notifications;
        this.keypad = fcpack.model.KeypadInput.create();
        this.keyboard = fcpack.model.Keyboard.create();
    };

    // public methods - opened for testing
    InputManagementController.prototype = {
        keypress: function(e) {
            clearBufferIfKeypressTimeout.call(this);

            var code = ( e.which ? e.which : e.keyCode );
            if( this.keypad.isKeypadPressed( code ) === true ) {
                this.notifications.trigger(screenController.getCurrentScreenName(), this.keypad.createHotKeyMessageForKeyCode( code ));
                $.publish(fcpack.model.KeypadInput.MAPPINGS[code]); // For multilist.js
            } else if( this.keyboard.isKeyboardCodePressed( code ) === true ) {
                this.notifications.trigger(screenController.getCurrentScreenName(), this.keyboard.createHotKeyMessageForKeyCode( code ));
                $.publish(fcpack.model.Keyboard.MAPPINGS[code]); // For multilist.js
            } else if( isAlphaNumeric( code ) || code === fcpack.controller.constants.KEYPRESS_SPACE || code === fcpack.controller.constants.KEYPRESS_HYPHEN || code === fcpack.controller.constants.KEYPRESS_UNDERSCORE ) { 
                this.buffer = this.buffer + String.fromCharCode(code);
                if( this.buffer.length === 1 ) {
                    executeDelayedAction.call(this);
                }
            } else if( code === fcpack.controller.constants.KEYPRESS_ENTER || code === fcpack.controller.constants.KEYPRESS_ENTER_FOR_MAC ) {
                this.notifications.trigger(screenController.getCurrentScreenName(), getEventMessage.call(this) );
                this.buffer = "";
            }
        },
        keydown: function(e) {
            // Suppress the forward-slash key that invokes Firefox's quick search
            if (e.keyCode === fcpack.controller.constants.KEYDOWN_FORWARD_SLASH) {
                e.preventDefault();
                this.keypress(e);
            }
        },
        _testNullifyInputManagementController: function() {
            inputManagementController = null;
        }
    };

    return {
        create: function(_screenController, notifications) {
            /*  Because we only want a single instance of this class for listening
             *  to events, we follow the SingleTon pattern to initialize only once
             */
            if( isUndefinedOrNull( inputManagementController ) ) {
                screenController = _screenController;
                inputManagementController = new InputManagementController(notifications);
            }
            return inputManagementController;
        }
    };

}());
