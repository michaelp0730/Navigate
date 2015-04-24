(function($) {
    var data_name = 'multilist',
        MultiList = function(element, options) {
            this.$element = $(element);
            this.options = $.extend({}, $.fn.multilist.defaults, options);
            this.$items = this.$element.find('a');
            this.callbacks = {};
            this.scrollTop = 0;
            this.init();
            this.listen();
        };

    $.fn.multilist = function(opt) {
        return this.each(function() {
            var $this = $(this),
                data = $this.data(data_name),
                options = typeof opt === 'object' && opt;

            if (!data) {
                $this.data(data_name, (data = new MultiList(this, options)));
            }

            if (typeof opt === 'string') {
                data[opt]();
            }
        });
    };

    MultiList.prototype = {
        constructor : MultiList,

        init : function() {
            var totalHeight = 0;
            var itemHeight;
            this.cols = this.$element.find('ul');
            this.$curr_col = this.$element.find('li.current').parent();
            if (this.options.scrollable === true) {
                var $container = this.$element,
                    $items = $container.find('li');

                this.containerHeight = $container.outerHeight();
                $container.css({overflowY: 'auto'});
                $items.each(function (index) {
                    itemHeight = $(this).outerHeight();
                    $(this).data('itemHeight', itemHeight);
                    $(this).data('itemTopPosition', totalHeight);
                    totalHeight += itemHeight;
                });
                $container.scrollTop(0);
            }
        },

        next : function() {
            var col_index = this.cols.index(this.$curr_col),
                items = this.$curr_col.find('li'),
                current = this.$curr_col.find('.current'),
                index = items.index(current),
                item, $item, itemTop, itemHeight;

            if (index === items.length - 1) { // Last item
                if (this.nextColumn(false)) {
                    items = this.$curr_col.find('li').removeClass('current');
                    item = items.get(0);
                    $(item).addClass('current');
                }
            } else {
                if (items.length - 1 > index) { // Assure we have more items
                    items.removeClass('current');
                    item = items.get(index + 1);
                    $(item).addClass('current');
                }
            }

            if (item) {
                $item = $(item).find('a');
                this.$element.trigger('navigate', [this.$items.index($item.get(0))]);

                if (this.options.scrollable === true) {
                    itemTop = $(item).data("itemTopPosition");
                    itemHeight = $(item).data("itemHeight");
                    if ((itemTop + itemHeight) > (this.containerHeight + this.scrollTop)) {
                        this.scrollTop = itemTop + itemHeight - this.containerHeight;
                        this.$element.scrollTop(this.scrollTop);
                    }
                }
            }
        },

        nextColumn : function(trigger) {
            var col_index = this.cols.index(this.$curr_col),
                items = this.$curr_col.find('li'),
                current = this.$curr_col.find('.current'),
                index = items.index(current),
                item;

            if (col_index < this.cols.length - 1) {
                // Remove the current selected style
                this.$curr_col.find('li.current').removeClass('current');
                this.$curr_col = this.$curr_col.next('ul');

                // Select the next column
                items = this.$curr_col.find('li');
                index = (index > items.length - 1) ? items.length - 1 : index;
                item = items.get(index);
                $(items.get(index)).addClass('current');

                if (item && trigger !== false) {
                    var $item = $(item).find('a');
                    this.$element.trigger('navigate', [this.$items.index($item.get(0))]);
                }

                return true;
            }
            return false;
        },

        prev : function() {
            var col_index = this.cols.index(this.$curr_col),
                items = this.$curr_col.find('li'),
                current = this.$curr_col.find('.current'),
                index = items.index(current),
                item, $item, itemTop, itemHeight;

            if (index === 0) {
                if (this.prevColumn(false)) {
                    items = this.$curr_col.find('li').removeClass('current');
                    item = items.get(items.length - 1);
                    $(item).addClass('current');
                }
            } else {
                items.removeClass('current');
                item = items.get(index - 1);
                $(item).addClass('current');
            }

            if (item) {
                $item = $(item).find('a');

                this.$element.trigger('navigate', [this.$items.index($item.get(0))]);

                if (this.options.scrollable === true) {
                    itemTop = $(item).data("itemTopPosition");
                    itemHeight = $(item).data("itemHeight");
                    if (itemTop < this.scrollTop) {
                        this.scrollTop = itemTop;
                        this.$element.scrollTop(this.scrollTop);
                    }
                }
            }
        },

        prevColumn : function(trigger) {
            var col_index = this.cols.index(this.$curr_col),
                items = this.$curr_col.find('li'),
                current = this.$curr_col.find('.current'),
                index = items.index(current),
                item;

            if (col_index > 0) {
                // Remove the current selected style
                this.$curr_col.find('li.current').removeClass('current');
                this.$curr_col = this.$curr_col.prev('ul');

                // Select the next column
                items = this.$curr_col.find('li');
                index = (index > items.length - 1) ? items.length - 1 : index;
                item = items.get(index);
                $(items.get(index)).addClass('current');

            if (item && trigger !== false) {
                var $item = $(item).find('a');
                this.$element.trigger('navigate', [this.$items.index($item.get(0))]);
            }

                return true;

            }
            return false;
        },

        listen : function() {
            var $this = this;
            // Set the EVENT object based on whether we're working with Singles or Multis
            var EVENT = (typeof(app) === "undefined") ? fcpack.controller.constants.HOTKEYS : app.model.KeyMappings.EVENT;

            function handleLeft() {
                if ($this.options.active) {
                    $this.prevColumn();
                }
            }

            function handleUp() {
                if ($this.options.active) {
                    $this.prev();
                }
            }

            function handleRight() {
                if ($this.options.active) {
                    $this.nextColumn();
                }
            }

            function handleDown() {
                if ($this.options.active) {
                    $this.next();
                }
            }

            $.subscribe(EVENT.LEFT, handleLeft);
            $this.callbacks[EVENT.LEFT] = handleLeft;

            $.subscribe(EVENT.UP, handleUp);
            $this.callbacks[EVENT.UP] = handleUp;

            $.subscribe(EVENT.RIGHT, handleRight);
            $this.callbacks[EVENT.RIGHT] = handleRight;

            $.subscribe(EVENT.DOWN, handleDown);
            $this.callbacks[EVENT.DOWN] = handleDown;

            $.subscribe(EVENT.CONTINUE, function () {
                if ($this.options.active) {
                    var $dest = $this.$curr_col.find('.current a');
                    if ($this.options.triggerSelect === true) {
                        $this.$element.trigger('select', [$dest]);
                    } else {
                        if ($dest && undefined !== $dest.prop('href')) {
                            window.location = $dest.prop('href');
                        }
                    }
                }
            });
        },

        unsubscribe : function () {
            $.each(this.callbacks, function (key, value) {
                $.unsubscribe(key, value);
            });
            this.callbacks = {};
            this.scrollTop = 0;
        },

        getItemByIndex : function(i) {
            return this.$items.get(i);
        },

        disable : function() {
            this.options.active = false;
        },

        enable : function() {
            this.options.active = true;
        }
    };

    $.fn.multilist.defaults = {
        trapEvent : true,
        active : true,
        triggerSelect: false,
        scrollable: false
    };

    $.fn.multilist.Constructor = MultiList;
    window.multilist = {
        NAME: 'multilist'
    };
}(jQuery));
