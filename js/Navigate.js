/** @author Michael Pellegrini */
$(document).ready(function () {
    'use strict';

    /** @const */
    var KEYCODES = {
        UP:     38,
        DOWN:   40,
        LEFT:   37,
        RIGHT:  39,
        ENTER:  13
    };

    /** @const */
    var EVENTS = {
        UP:     'arrowKeyUp',
        DOWN:   'arrowKeyDown',
        LEFT:   'arrowKeyLeft',
        RIGHT:  'arrowKeyRight',
        ENTER:  'enterKey'
    };

    /**
     * @description Navigate jQuery plugin - Used to navigate menus with arrow keys
     * @param $ {object} The jQuery object
     */
    (function ($) {

        /** @type {string} */
        var name = 'navigate-plugin';

        /**
         * @type {object}
         * @description Will be used to hold default navigation settings specified for the DOM element calling .navigate()
         */
        var settings = {};

        /**
         * @constructor
         * @param el - DOM element to navigate
         */
        var Navigate = function Navigate (el) {
            this.$el = $(el);
            this.options = $.extend({}, $.fn.navigate.defaults, settings);
            this.scrollTop = 0;
            this.init();
            this.listen();
        };

        Navigate.prototype = {
            constructor: Navigate,

            init: function () {
                this.$columns = this.$el.find('ul');
                this.multicolumn = (this.$columns.length > 1);
                this.containerHeight = this.$el.outerHeight();
                var totalHeight = 0;
                var items, itemHeight;

                if (this.options.scrollable) {
                    this.$el.css({overflowY: 'scrollable'});
                    for (var i = 0; i < this.$columns.length; i++) {
                        items = $(this.$columns[i]).find('li');
                        for (var x = 0; x < items.length; x++) {
                            itemHeight = $(items[x]).outerHeight();
                            $(items[x]).data('itemHeight', itemHeight);
                            $(items[x]).data('itemTopPosition', totalHeight);
                            totalHeight += itemHeight;
                        }
                        totalHeight = 0;
                    }
                    this.$el.scrollTop(0); // Set the scroll bar at the top of the menu container
                }

                if (this.options.active) {
                    /**
                     * @description Listen for up, down, left, right, or enter keyboard events and publish custom events when they occur
                     * @param e - Default browser event
                     */
                    this.$el.on('keydown', function (e) {
                        switch (e.keyCode) {
                            case KEYCODES.UP:
                                $.publish(EVENTS.UP);
                                break;
                            case KEYCODES.DOWN:
                                $.publish(EVENTS.DOWN);
                                break;
                            case KEYCODES.LEFT:
                                $.publish(EVENTS.LEFT);
                                break;
                            case KEYCODES.RIGHT:
                                $.publish(EVENTS.RIGHT);
                                break;
                            case KEYCODES.ENTER:
                                $.publish(EVENTS.ENTER);
                                break;
                        }
                    });
                    this.$el.focus().css({outline: 'none'}); // focus on this.$el and remove default styling
                }
            },

            up: function () {
                var currentItem = this.$el.find('li.current');
                var currentColumn = currentItem.parent();
                var currentColumnIndex = this.$columns.index(currentColumn);
                var currentColumnItems = currentColumn.find('li');
                var items = currentColumn.find('li');
                var index = items.index(currentItem);
                var itemTop, itemHeight;

                if (index === 0) { // First item
                    if (currentColumnIndex > 0) { // If there is another column to jump to
                        currentColumnItems.removeClass('current');
                        currentColumn = currentColumn.prev('ul');
                        currentColumnItems = currentColumn.find('li');
                        currentItem = currentColumnItems.get(currentColumnItems.length - 1);
                        $(currentItem).addClass('current');

                        if (this.options.scrollable) {
                            itemTop = $(currentItem).data("itemTopPosition");
                            itemHeight = $(currentItem).data("itemHeight");
                            this.scrollTop = itemHeight + itemTop - this.containerHeight;
                            this.$el.scrollTop(this.scrollTop);
                        }
                    }
                } else {
                    items.removeClass('current');
                    currentItem = items.get(index - 1);
                    $(currentItem).addClass('current');

                    if (this.options.scrollable) {
                        itemTop = $(currentItem).data("itemTopPosition");
                        itemHeight = $(currentItem).data("itemHeight");
                        if (itemTop < this.scrollTop) {
                            this.scrollTop = itemTop;
                            this.$el.scrollTop(this.scrollTop);
                        }
                    }
                }
            },

            down: function () {
                var currentItem = this.$el.find('li.current');
                var currentColumn = currentItem.parent();
                var currentColumnIndex = this.$columns.index(currentColumn);
                var currentColumnItems = currentColumn.find('li');
                var items = currentColumn.find('li');
                var index = items.index(currentItem);
                var itemTop, itemHeight;

                if (index === items.length - 1) { // Last item
                    if (this.multicolumn && currentColumnIndex < this.$columns.length - 1) { // If there is another column to jump to
                        currentColumnItems.removeClass('current');
                        currentColumn = currentColumn.next('ul');
                        currentColumnItems = currentColumn.find('li');
                        currentItem = currentColumnItems.get(0);
                        $(currentItem).addClass('current');
                        this.scrollTop = 0;
                        this.$el.scrollTop(this.scrollTop);
                    }
                } else {
                    if (items.length - 1 > index) { // Assure we have more items
                        items.removeClass('current');
                        currentItem = items.get(index + 1);
                        $(currentItem).addClass('current');

                        if (this.options.scrollable) {
                            itemHeight = $(currentItem).data('itemHeight');
                            itemTop = $(currentItem).data('itemTopPosition');
                            if ((itemHeight + itemTop) > (this.containerHeight + this.scrollTop)) {
                                this.scrollTop = itemHeight + itemTop - this.containerHeight;
                                this.$el.scrollTop(this.scrollTop);
                            }
                        }
                    }
                }
            },

            left: function () {
                var currentItem = this.$el.find('li.current');
                var currentColumn = currentItem.parent();
                var currentColumnIndex = this.$columns.index(currentColumn);
                var currentColumnItems = currentColumn.find('li');
                var currentItemIndex = currentColumnItems.index(currentItem);

                if (currentColumnIndex > 0) {
                    currentColumnItems.removeClass('current');
                    currentColumn = currentColumn.prev('ul');
                    currentColumnItems = currentColumn.find('li');
                    currentItem = currentColumnItems.get(currentItemIndex);
                    $(currentItem).addClass('current');
                }
            },

            right: function () {
                if (this.multicolumn) {
                    var currentItem = this.$el.find('li.current');
                    var currentColumn = currentItem.parent();
                    var currentColumnIndex = this.$columns.index(currentColumn);
                    var currentColumnItems = currentColumn.find('li');
                    var currentItemIndex = currentColumnItems.index(currentItem);

                    if (currentColumnIndex < this.$columns.length - 1) {
                        currentColumnItems.removeClass('current');
                        currentColumn = currentColumn.next('ul');
                        currentColumnItems = currentColumn.find('li');
                        currentItemIndex = (currentItemIndex > currentColumnItems.length - 1) ? currentColumnItems.length - 1 : currentItemIndex;
                        currentItem = currentColumnItems.get(currentItemIndex);
                        $(currentItem).addClass('current');
                    }
                }
            },

            /** @description Listen for custom events and handle them */
            listen: function () {
                var $this = this;

                /** @description Subscribe to custom UP event */
                $.subscribe(EVENTS.UP, function () {
                    if ($this.options.active) {
                        $this.up();
                    }
                });

                /** @description Subscribe to custom DOWN event */
                $.subscribe(EVENTS.DOWN, function () {
                    if ($this.options.active) {
                        $this.down();
                    }
                });

                /** @description Subscribe to custom LEFT event */
                $.subscribe(EVENTS.LEFT, function () {
                    if ($this.options.active) {
                        $this.left();
                    }
                });

                /** @description Subscribe to custom RIGHT event */
                $.subscribe(EVENTS.RIGHT, function () {
                    if ($this.options.active) {
                        $this.right();
                    }
                });

                /** @description Subscribe to custom ENTER event */
                $.subscribe(EVENTS.ENTER, function () {
                    if ($this.options.active) {
                        var currentItemData = this.$el.find('li.current').data(this.options.listItemDataName);
                        this.$el.trigger('menuItemSelected', [currentItemData]);
                    }
                });
            },

            /**
             * @description Allows you to unsubscribe your DOM element from this plugin without destroying the DOM element.
             * @example $('#my-element').data('navigate-plugin').unsubscribe();
             */
            unsubscribe: function () {
                this.$el.off('.' + name); // remove event handler
                this.$el.find('*').off('.' + name); // remove event handler
                this.$el.removeData(name);
                this.$el = null;
            }
        };

        /**
         * @description Attach the .navigate() method to the jQuery namespace
         * @param opts {object}
         */
        $.fn.navigate = function (opts) {
            settings = opts;

            /**
             * @description Allow .navigate() to be chainable with other jQuery methods
             */
            return this.each(function () {
                new Navigate(this);
            });
        };

        $.fn.navigate.defaults = {
            active : true,
            scrollable: false,
            listItemDataName: 'menu'
        };

        $.fn.navigate.Constructor = Navigate;
        window.navigate = {
            NAME: name
        };

    })(jQuery);
});