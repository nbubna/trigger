/**
 * Copyright (c) 2013, ESHA Research
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */
;(function(window, document) {

    var _ = {
        version: "1.0.0",
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
        listen: function(e) {
            var el = e.target;
            if (_[e.type](e, el, el.nodeName.toLowerCase()) && (el = _.find(el))) {
                _.all(el, el.getAttribute(_.attr), e);
                _.preventDefault(e, !_.boxRE.test(el.type));
            }
        },
        find: function(el) {
            return !el || el.getAttribute(_.attr) ? el : _.find(el.parentNode);
        },
        click: function(e, el, name) {// ignore clicks on editable fields (focusing clicks)
            return !el.isContentEditable && !_.noClickRE.test(name) &&
                   (name !== 'input' || _.buttonRE.test(el.type));
        },
        keyup: function(e, el, name) {// ignore Enters that already have meaning (button, link, textarea)
            return 13 === (e.keyCode || e.which) &&
                   !el.isContentEditable && !_.noEnterRE.test(name) &&
                   !(name === 'a' && el.getAttribute('href')) &&
                   !(_.buttonRE.test(el.type));
        },
        attr: 'trigger',
        splitRE: / (?![^\[\]]*\])+/g,
        noClickRE: /^(select|textarea)$/,
        noEnterRE: /^(textarea|button)$/,
        buttonRE: /^(submit|button|reset)$/,
        boxRE: /^(checkbox|radio)$/,

        on: function(type, fn) {
            if (document.addEventListener) {
                document.addEventListener(type, fn);
            } else {
                document.attachEvent('on'+type, function(){ fn(window.event); });
            }
        },
        init: function() {
            _.on('click', _.listen);
            _.on('keyup', _.listen);
        },
        prop: function(prop) {// by default support jQuery's event system
            if (jQuery && !_.prop[prop]) {
                _.prop[prop] = true;
                jQuery.event.props.push(prop);
            }
        }
    };

    // expose API for extension, testing, and other direct use
    function trigger(el, events) {
        if (!el || typeof el === "string") {
            events = el;
            el = this === window ? document : this;
        } else if (!events) {
            el = _.find(el);
            events = el.getAttribute(_.attr);
        }
        return _.all(el, events);
    }
    trigger._ = _;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = trigger;
    } else {
        window.trigger = trigger;
    }
    // wait to init, in case an extension wishes to modify it
    window.onload = function(){ _.init(); };

})(window, document);
