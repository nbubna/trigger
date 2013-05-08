/*! trigger - v1.0.0 - 2013-05-07
* Copyright (c) 2013 Nathan Bubna; Licensed MIT, GPL */
;(function(window, document) {

    var _ = {
        version: "1.0.0",
        all: function(target, events, oe) {
            events = events.split(_.splitRE);
            for (var i=0, m=events.length, e = oe; i<m && !_.stop(e); i++) {
                var props = _.parse(events[i]);
                if (props) {
                    if (m > 1) {
                        props.triggers = events;
                        props.promise = _.promise(target, events, i, e);
                    }
                    if (i > 0) {
                        props.previousEvent = e;
                    }
                    props.originalEvent = oe;
                    e = _.event(target, props);
                }
            }
            return e;
        },
        promise: function(target, events, i, e) {
            return function(promise) {
                _.stop(e, true);
                promise.then(function() {
                    _.all(target, events.slice(i+1).join(' '), e.originalEvent);
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
                e.data = JSON.parse(type.substring(bracket).replace(/\'/g,'"'));
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
            for (var prop in props) {
                _.prop(prop);// allow jQuery or others to learn of custom properties
                e[prop] = props[prop];
            }
            target.dispatchEvent(e);
            return e;
        },
        stop: function(e, stop) {
            if (e && stop) {
                if (e.preventDefault) {
                    e.preventDefault();
                } else {
                    e.returnValue = false;
                }
            }
            return e && (e.defaultPrevented || e.returnValue === false);
        },
        listen: function(e) {
            var el = e.target;
            if (_[e.type](e, el, el.nodeName.toLowerCase()) && (el = _.find(el))) {
                _.all(el, el.getAttribute(_.attr), e);
                return !_.stop(e, !_.boxRE.test(el.type));
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
