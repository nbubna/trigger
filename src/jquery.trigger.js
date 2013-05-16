/**
 * Copyright (c) 2013, ESHA Research
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */
;(function($, trigger, _) {
    _.fn = $.fn.trigger;
    _.triggerRE = / |\#|\[|\:/;
    $.fn.trigger = function(type) {
        return !type || typeof type !== "string" || _.triggerRE.test(type) ?
            this.each(function(){ trigger(this, type || this.getAttribute(_.attr)); }) :
            _.fn.apply(this, arguments);
    };
})(jQuery, trigger, trigger._);
