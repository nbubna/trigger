/**
 * Copyright (c) 2013, ESHA Research
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */
;(function(window, document) {
    // user api
    function trigger(){ return _.manual.apply(this, arguments); }
    trigger.translate = function(){ return _.translate.apply(this, arguments); };
    // developer api
    var _ = trigger._ = {
        version: "1.0.0",
        prefix: '',
        splitRE: / (?![^\[\]]*\])+/g,
        noClickRE: /^(select|textarea)$/,
        noEnterRE: /^(textarea|button)$/,
        buttonRE: /^(submit|button|reset)$/,
        boxRE: /^(checkbox|radio)$/,
        // custom event stuff
        all: function(target, events, oe, e) {
            events = events.split(_.splitRE);
            for (var i=0, m=events.length; i<m && !_.preventDefault(e || oe); i++) {
                var props = _.parse(events[i]);
                if (props) {
                    if (m > 1){ props.triggers = events; }
                    if (e){ props.previousEvent = e; }
                    if (oe){ props.originalEvent = oe; }
                    props.promise = _.promise(target, events, i, oe, e);
                    e = _.event(target, props);
                }
            }
            return e;
        },
        promise: function(target, events, i, oe, e) {
            return function(promise) {
                this.preventDefault();// cancel subsequent events
                this.promise = promise;// replace self
                promise.then(function() {// restart subsequent on resolution
                    _.all(target, events.slice(i+1).join(' '), oe, e);
                });
            };
        },
        parse: function(type) {
            if (!type){ return; }
            var e = { trigger: type },
                colon, pound, bracket;
            if ((pound = type.indexOf('#', type.indexOf(']'))) > 0) {
                e.tags = type.substring(pound+1).split('#');
                type = type.substring(0, pound);
                for (var i=0,m=e.tags.length; i<m; i++) {
                    e[e.tags[i]] = true;
                }
            }
            if ((bracket = type.indexOf('[')) > 0) {
                e.data = JSON.parse(type.substring(bracket).replace(/'/g,'"'));
                type = type.substring(0, bracket);
            }
            if ((colon = type.indexOf(':')) > 0) {
                e.category = type.substring(0, colon);
                type = type.substring(colon+1);
            }
            e.type = type;
            return e;
        },
        event: function(target, props) {
            var e = document.createEvent('HTMLEvents');
            e.initEvent(props.type, true, true);
            if (!e.preventDefault) {// spare users returnValue hassle
                e.preventDefault = _.preventDefault;
            }
            for (var prop in props) {
                _.prop(prop);// allow jQuery or others to learn of custom properties
                e[prop] = props[prop];
            }
            target.dispatchEvent(e);
            return e;
        },
        preventDefault: function(e, prevent) {
            if (e && !prevent) {// just query
                return e.defaultPrevented || e.returnValue === false;
            } else if (e && e.preventDefault) {// set on modern native
                e.preventDefault();
            }
            (e || this).returnValue = false;// set on old IE native
        },
        // native DOM and event stuff
        listen: function(e) {
            var el = e.target, attr,
                type = e.type,
                special = _.special[type+(e.which || e.keyCode || '')];
            if (special) {
                type = special(e, el, el.nodeName.toLowerCase());
                if (!type){ return; }// special said to ignore it!
            }
            el = _.find(el, type),
            attr = _.attr(el, type);
            if (attr) {
                _.all(el, attr, e);
                if (type === 'click') {// almost always prevent default for clicks
                    _.preventDefault(e, !_.boxRE.test(el.type));
                }
            }
        },
        on: function(type, fn) {
            if (jQuery && jQuery.event){ jQuery(document).on(type, fn); }// use it if you've got it
            else if (document.addEventListener){ document.addEventListener(type, fn); }
            else { document.attachEvent('on'+type, function(){ fn(window.event); }); }
        },
        attr: function(el, type) {
            return el && el.getAttribute && el.getAttribute(_.prefix+type);
        },
        find: function(el, type) {
            return !el || _.attr(el, type) ? el : _.find(el.parentNode, type);
        },
        // special event handlers
        special: {
            click: function(e, el, name) {// if click attr or not editable (i.e. not focusing click)
                return (_.attr(el, e.type) || 
                        (!el.isContentEditable && !_.noClickRE.test(name) &&
                         (name !== 'input' || _.buttonRE.test(el.type)))) &&
                       'click';
            },
            keyup13: function(e, el, name) {// if fitting attr or not already accessible (i.e. enter !== click)
                return (_.attr(el, 'key-enter') && 'key-enter') ||// enter sometimes fits better than click
                       (_.attr(el, e.type) && e.type) ||// return keyup type
                       (!el.isContentEditable && !_.noEnterRE.test(name) &&
                        !(name === 'a' && el.getAttribute('href')) && _.buttonRE.test(el.type)) &&
                       'click';// convert to a click
            }
        },
        // extension hooks
        manual: function(el, events) {
            if (typeof el === "string"){ events = el; el = document; }
            return _.all(el, events || _.attr(el, 'click') || '');
        },
        translate: function() {
            for (var i=0,m=arguments.length; i<m; i++){ _.on(arguments[i], _.listen); }
        },
        prop: function(prop) {// by default support jQuery's event system
            if (jQuery && jQuery.event && !_.prop[prop]) {
                _.prop[prop] = true;
                jQuery.event.props.push(prop);
            }
        }
    };
    // connect to the outside world
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = trigger;
    } else {
        window.trigger = trigger;
    }
    trigger.translate('click', 'keyup');
})(window, document);
