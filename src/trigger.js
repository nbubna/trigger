/**
 * Copyright (c) 2013, ESHA Research
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */
;(function(window, document, $) {

    function trigger(){ return _.manual.apply(this, arguments); }
    trigger.add = function(){ return _.add.apply(this, arguments); };

    var _ = trigger._ = {
        version: "<%= pkg.version %>",
        prefix: 'data-',// will change to '' if !<html data-trigger="true" ...>
        splitRE: / (?![^\[\]]*\])+/g,
        noClickRE: /^(select|textarea)$/,
        noEnterRE: /^(textarea|button)$/,
        buttonRE: /^(submit|button|reset)$/,
        boxRE: /^(checkbox|radio)$/,
        // custom event stuff
        all: function(target, sequence, t) {//t==trigger (usually a 'click'ish event)
            sequence = sequence.split(_.splitRE);
            for (var i=0, e, props; i<sequence.length && (!e||!e.isSequenceStopped()); i++) {
                props = _.parse(sequence[i]);
                if (props) {
                    props.sequence = sequence;
                    if (e){ props.previousEvent = e; }
                    if (t){ props.trigger = t; }
                    _.controls(props, target, sequence, i);
                    e = _.event(target, props);
                }
            }
            return e;
        },
        controls: function(props, target, sequence, i, stopped) {
            props.resumeSequence = function(t) {
                if (stopped) {
                    stopped = false;
                    _.all(target, sequence.slice(i+1).join(' '), t||props.trigger);
                }
            };
            props.stopSequence = function(promise) {
                if (stopped !== false) {// after resume, can't stop again
                    stopped = true;
                    return promise && promise.then(this.resumeSequence);
                }
            };
            props.isSequenceStopped = function(){ return !!stopped; };
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
        // native DOM and event stuff
        listen: function(e) {
            var el = e.target, attr,
                type = e.type,
                key = type.indexOf('key') === 0 ? e.which || e.keyCode || '' : '',
                special = _.special[type+key];
            if (el && special) {
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
            if (!_.on[type]) {// no dupes!
                _.on[type] = fn;
                if ($ && $.event){ $(document).on(type, fn); }// allows non-native triggers
                else { document.addEventListener(type, fn); }
            }
        },
        attr: function(el, type) {
            return (el && el.getAttribute && el.getAttribute(_.prefix+type))||'';
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
            return _.all(el, sequence || _.attr(el, 'click'));
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
        },
        init: function() {
            _.add('click','keyup');
            var el = document.documentElement;
            if (_.attr(el, 'trigger') !== 'true'){ _.prefix = ''; }
            _.add.apply(_, _.attr(el, 'trigger-add').split(' '));
        }
    };
    // connect to the outside world
    _.init();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = trigger;
    } else {
        window.trigger = trigger;
    }
})(window, document, window.jQuery);
