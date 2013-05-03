/*! trigger - v0.9.0 - 2013-05-03
* Copyright (c) 2013 Nathan Bubna; Licensed MIT, GPL */
;(function(window, document) {

    var _ = {
        version: "0.9.0",
        all: function(target, events, oe) {
            events = events.split(' ');
            for (var i=0, m=events.length, e = oe; i<m && _.allowDefault(e); i++) {
                var props = _.parse(events[i]);
                if (props) {
                    props.triggers = events;
                    props.originalEvent = oe;
                    e = _.event(target, props);
                }
            }
            return e;
        },
        parse: function(type) {
            if (!type){ return; }
            var e = { trigger: type },
                dot = type.indexOf('.'),
                pound = type.indexOf('#'),
                bracket = type.indexOf('[');
            if (pound > 0) {
                e.tags = type.substring(pound+1).split('#');
                type = type.substring(0, pound);
                for (var i=0,m=e.tags.length; i<m; i++) {
                    e[e.tags[i]] = true;
                }
            }
            if (bracket > 0) {
                e.data = JSON.parse(type.substring(bracket).replace(/\'/g,'"'));
                type = type.substring(0, bracket);
            }
            if (dot > 0) {
                e.namespace = type.substring(dot+1);
                type = type.substring(0, dot);
            }
            e.type = type;
            return e;
        },
        event: function(target, props) {
            var e = document.createEvent('HTMLEvents');
            e.initEvent(props.type, true, true);
            for (var prop in props) {
                if (props.hasOwnProperty(prop)) {
                    e[prop] = props[prop];
                }
            }
            target.dispatchEvent(e);
            return e;
        },
        allowDefault: function(e, allowed) {
            if (!e){ return true; }
            if (arguments.length === 1) {
                return !e.defaultPrevented && e.returnValue !== false;
            }
            if (!allowed) {
                if (e.preventDefault) {
                    e.preventDefault();
                } else {
                    e.returnValue = false;
                }
            }
            return allowed;
        },
        listen: function(e) {
            var el = e.target;
            if (_[e.type](e, el, el.nodeName.toLowerCase()) && (el = _.find(el))) {
                _.all(el, el.getAttribute(_.attr), null, e);
                return _.allowDefault(e, _.boxRE.test(el.type));
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
        }
    };

    // expose this to the environment
    function trigger(events) {
        return _.all(this === window ? document : this, events);
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
