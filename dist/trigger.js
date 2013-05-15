/*! trigger - v1.0.0 - 2013-05-15
* Copyright (c) 2013 Nathan Bubna; Licensed MIT, GPL */
;(function(window, document, $) {

    function trigger(){ return _.manual.apply(this, arguments); }
    trigger.add = function(){ return _.add.apply(this, arguments); };

    var _ = trigger._ = {
        version: "1.0.0",
        prefix: '',
        splitRE: / (?![^\[\]]*\])+/g,
        noClickRE: /^(select|textarea)$/,
        noEnterRE: /^(textarea|button)$/,
        buttonRE: /^(submit|button|reset)$/,
        boxRE: /^(checkbox|radio)$/,
        // custom event stuff
        all: function(target, sequence, te, e, pe) {//trigger event, current event, promised event
            sequence = sequence.split(_.splitRE);
            for (var i=0, m=sequence.length; i<m && (pe||!_.stopped(e||te)); i++) {
                var props = _.parse(sequence[i]);
                if (props) {
                    props.sequence = sequence;
                    if (e||pe){ props.previousEvent = e||pe; }
                    if (te){ props.trigger = te; }
                    props.promise = _.promise(target, sequence, i);
                    e = _.event(target, props);
                }
            }
            return e;
        },
        promise: function(target, sequence, i) {
            return function(promise) {
                var e = this;
                e.preventDefault();// cancel subsequent events
                e.promise = promise;// replace self
                promise.then(function() {// restart subsequent on resolution
                    _.all(target, sequence.slice(i+1).join(' '), e.trigger, null, e);
                });
            };
        },
        parse: function(type) {
            if (!type){ return; }
            var e = { text: type },
                colon, pound, bracket;
            if ((pound = type.indexOf('#', type.indexOf(']'))) > 0) {
                e.tags = type.substring(pound+1).split('#');
                type = type.substring(0, pound);
                for (var i=0,m=e.tags.length; i<m; i++) {
                    e[e.tags[i]] = true;
                }
            }
            if ((bracket = type.indexOf('[')) > 0) {
                e.constants = JSON.parse(type.substring(bracket).replace(/'/g,'"'));
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
            for (var key in props) {// copy props w/ext hook
                e[_.prop(key)] = props[key];
            }
            target.dispatchEvent(e);
            return e;
        },
        stopped: function(e) {
            e = e || this;
            return (e.isDefaultPrevented && e.isDefaultPrevented()) || e.defaultPrevented;
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
                if (type === 'click' && !_.boxRE.test(el.type)) {
                    e.preventDefault();
                }
            }
        },
        on: function(type, fn) {
            if (_.on[type]){ return; } else { _.on[type] = 1; }// no dupes!
            // support jQuery for fake triggers, but must consume originalEvent when present!
            if ($ && $.event){ $(document).on(type, function(e){ fn(e.originalEvent||e); }); }
            else { document.addEventListener(type, fn); }
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
                       (_.attr(el, e.type) && e.type) ||// return keyup type for keyup attr
                       (!el.isContentEditable && !_.noEnterRE.test(name) &&
                        !(name === 'a' && el.getAttribute('href')) && _.buttonRE.test(el.type)) &&
                       'click';// convert to a click
            }
        },
        // extension hooks
        manual: function(el, sequence) {
            if (typeof el === "string"){ sequence = el; el = document; }
            return _.all(el, sequence || _.attr(el, 'click') || '');
        },
        add: function() {
            for (var i=0,m=arguments.length; i<m; i++){ _.on(arguments[i], _.listen); }
        },
        prop: function(prop) {// add custom properties to jQuery's event system
            if ($ && $.event && !_.prop[prop]) {
                _.prop[prop] = true;
                $.event.props.push(prop);
            }
            return prop;
        }
    };
    // all jquery for old browsers
    if (!document.createEvent) {
        _.event = function(target, props) {
            var e = $.Event(props.type, props);
            $(target).trigger(e);
            return e;
        };
    }
    // connect to the outside world
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = trigger;
    } else {
        window.trigger = trigger;
    }
    trigger.add('click', 'keyup');
})(window, document, window.jQuery);
