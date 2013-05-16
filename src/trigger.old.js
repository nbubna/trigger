 /**
 * Copyright (c) 2013, ESHA Research
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */
;(function($, _) {
    // IE < 9 doesn't support custom events
    if (!document.createEvent) {
        _.event = function(target, props) {
            var e = $.Event(props.type, props);
            $(target).trigger(e);
            return e;
        };
    }
})(jQuery, trigger._);
