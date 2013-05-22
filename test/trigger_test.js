(function($) {

    var trigger = window.trigger,
        _ = trigger._;

    function on(type, listener, usejQuery) {
        if (usejQuery){ $(document).on(type, listener); }
        else if (document.addEventListener){ document.addEventListener(type, listener); }
        else { on(type, listener, true); }
    }
    function off(type, listener, usejQuery) {
        if (usejQuery){ $(document).off(type, listener); }
        else if (document.removeEventListener){ document.removeEventListener(type, listener); }
        else { off(type, listener, true); }
    }
    function listenFor(expect, env) {
        if (typeof expect === "string"){ expect = {type:expect}; }
        var listener;
        on(expect.type, (listener = function(e) {
            off(expect.type, listener, env.usejQuery);
            var ret;
            for (var key in expect) {
                var val = expect[key];
                if (key === 'stop') {
                    stopSequence(e, env, val);
                }
                else if ($.isArray(val) || $.isPlainObject(val)) {
                    deepEqual(e[key], expect[key], key+' mismatch');
                    if (key === 'tags') {
                        for (var i in expect.tags) {
                            ok(e[expect.tags[i]], 'event should have '+expect.tags[i]);
                        }
                    }
                } else {
                    strictEqual(e[key], expect[key], key+' mismatch');
                }
            }
            // clean up time
            if (!e.sequence || $.inArray(e.text, e.sequence) === e.sequence.length-1) {
                $(e.target).remove();
            }
            return ret;
        }), env.usejQuery);
    }
    function silence(type, usejQuery) {
        var fail = function() {
            ok(false, 'There should not have been a "'+type+'" event.');
            off(type, fail, usejQuery);
        };
        on(type, fail, usejQuery);
        return fail;
    }
    function nextEvent(e) {
        var seq = e.sequence || [],
            i = $.inArray(e.text, seq),
            next = _.parse(seq[i+1]);
        return next ? next.type : null;
    }
    function stopSequence(e, env, output) {
        var next = nextEvent(e),
            listener = silence(next, env.usejQuery),
            promise = false,
            clean = function(){return e.target!==document && $(e.target).remove();};
        if ($.isArray(output)) {
            promise = new Thennable(next, listener, output, env);
            promise.then(clean);
        }
        ok(next, e.type+' should have a next event, when testing stopSequence');
        e.stopSequence(promise);
        if (!promise) {
            setTimeout(function(){
                clean();
                off(next, listener, env.usejQuery);
            }, 0);
        }
    }
    function Thennable(next, listener, output, env) {
        var promise = this;
        setTimeout(function() {
            start();
            off(next, listener, env.usejQuery);
            for (var i=0,m=output.length; i<m; i++) {
                listenFor(output[i], env);
            }
            promise.resolve('tested!');
        }, 100);
    }
    Thennable.prototype = {
        fn: [],
        then: function(fn) {
            this.fn.push(fn);
            if ('resolution' in this) {
                this.resolve(this.resolution);
            }
            return this;
        },
        resolve: function(val) {
            this.resolution = val;
            var fn;
            while (fn = this.fn.pop()) {
                fn(val);
            }
        }
    };
    function fire(e, env) {
        if (typeof e === "string"){ e = { events:e }; }
        if (!e.element){ e.element = env.element; }
        if (!e.type) { e.type = env.trigger || 'click'; }
        if (!e.element) {
            return trigger(e.events);
        }
        // make sure trigger is listening
        trigger.add(e.type);
        e.events = e.events.replace(/"/g, "'");
        e.element = create(e.element, env.trigger || e.type, e.events, env.parent);
        var jq = env.usejQuery;
        if (!jq) {
            if ($.isFunction(e.element[e.type])) {
                e.element[e.type]();
            } else if (document.createEvent) {
                var evt = document.createEvent('UIEvents');
                evt.initEvent(e.type, true, true);
                e.element.dispatchEvent(evt);
            } else {
                jq = true;
            }
        }
        if (jq) {
            $(e.element).trigger($.Event(e.type, { which: env.which }));
        }
        return e.element;
    }
    function create(element, type, events, parent) {
        if (typeof element === "string") {
            if (element.charAt(0) !== '<') {
                element = '<'+element+'>';
            }
        }
        element = $(element);
        if (parent) {
            parent = create(parent, type, events);
            $(parent).append(element);
        } else {
            element.attr(type, events).appendTo('body');
        }
        return element[0];
    }
    function _test(name, input, output, env) {
        var testFn = $.isArray(output.stop) ? asyncTest : test;
        if ($.isPlainObject(name)) {
            env = output; output = input; input = name;
            name = input.type ? input.type+'='+input.events : input.events;
        }
        testFn(name+(env.usejQuery ? ' (using jquery)' : ''), count(output), function() {
            if (!$.isArray(output)){ output = [output]; }
            for (var i=0,m=output.length; i<m; i++) {
                listenFor(output[i], env);
            }
            fire(input, env);
        });
    }
    function count(e) {
        var num;
        if (typeof e === "string") {
            num = 1;
        } else if ($.isArray(e)) {
            num = 0;
            for (var i=0,m=e.length; i<m; i++) {
                num += count(e[i]);
            }
        } else {
            num = e.tags ? e.tags.length : 0;
            for (var key in e) {
                if (key === 'stop') {
                    num += 1;
                    if ($.isArray(e[key])) {// async output for Thennable
                        num += count(e[key]) - 1;
                    }
                } else {
                    num += 1;
                }
            }
        }
        return num;
    }
    // end util fns

    function basic(id, env) {
        var event = 'single'+id;
        _test('event'+id, event, { type:event, text:event, sequence:[event] }, env);
    }
    function properties(id, env) {
        _test('category'+id, 'category:categorized'+id, {type:'categorized'+id, category:'category'}, env);
        _test('constants'+id, 'constants'+id+'[1,true,"a",'+"'b.c',"+'{"d":"#"},[[{}]]]',
              {type:'constants'+id, constants:[1,true,'a','b.c',{d:'#'},[[{}]]] }, env);
        _test('tags'+id, 'tagged'+id+'#tag1#tag2', {type:'tagged'+id, tags:'tag1 tag2'.split(' ')}, env);
        _test('everything'+id, "category:everything"+id+"['constants']#tag",
              { type:'everything'+id, category:'category', constants:['constants'], tags:['tag']}, env);
    }
    function sequences(id, env) {
        _test('sequence'+id, 'one'+id+' two'+id, ['one'+id,'two'+id], env);
        _test('stop'+id, 'pass'+id+' fail'+id, {type:'pass'+id, stop:true }, env);
        _test('async'+id, 'async'+id+' after', {type:'async'+id, stop:['after'+id]}, env);
    }
    var id = 0;
    function suite(name, env) {
        id++;
        module(name+' standard');
        basic(id, env);
        properties(id, env);
        sequences(id, env);

        module(name+' data- prefix');
        _.prefix = 'data-';
        basic(id+'b', env);
        _.prefix = '';

        if (!('usejQuery' in env)) {
            suite(name, $.extend({usejQuery:true}, env));
        }
    }
    
    module('api');
    test('user', function() {
        ok($.isFunction(trigger), 'require trigger()to be backward compatible');
        ok($.isFunction(trigger.add), 'require trigger.add() for compatibility');
        var e = _.all(document.body, 'a b:c["d"]#e', {type:'fakeTrigger'}),
            props = 'type target sequence text previousEvent trigger tags constants category'.split(' '),
            fns = 'stopSequence resumeSequence isSequenceStopped'.split(' ');
        for (var i=0,m=props.length; i<m; i++) {
            ok(props[i] in e, 'event should have property "'+props[i]+'"');
        }
        for (i=0,m=fns.length; i<m; i++) {
            ok($.isFunction(e[fns[i]]), 'event should have function "'+fns[i]+'"');
        }
    });
    test('developer', function() {
        ok(_, 'no _ object');
        var props = 'version prefix splitRE noClickRE noEnterRE buttonRE boxRE special'.split(' ');
        for (var i=0,m=props.length; i<m; i++) {
            ok(props[i] in _, 'missing property "'+props[i]+'", not backward compatible');
        }
        var fns = 'all parse event controls listen find attr on manual add prop'.split(' ');
        for (i=0,m=fns.length; i<m; i++) {
            ok($.isFunction(_[fns[i]]), 'missing function "'+fns[i]+'", not backward compatible');
        }
    });

    suite('trigger(events)', {});

    suite('<button click="events">', {element: 'button'});

    suite('<input keypress="events">', {trigger:'keypress', element: 'input'});

    suite('<div click="events"><span>target</span></div>', {element:'<span>target</span>', parent: 'div'});

    module('_.special');
    var special = _.special,
        contenteditable = 'isContentEditable' in $('<div contenteditable="true">')[0];
    test('click: children to ignore', function(){
        expect(0);
        var type = 'ignoreClick',
            listener = silence(type),
            $els = $();
        $els.push(fire(type, {element:'textarea', parent:'div'}),
                  fire(type, {element:'<select><option>test</option></select>', parent:'span'}),
                  fire(type, {element:'<input type="date">', parent:'form'}));
        if (contenteditable) {
            $els.push(fire(type, {element:'<div contenteditable="true"/>', parent:'header'}));
        }
        $els.remove();
        off(type, listener);
    });
    test('click: allow due to attr', function() {
        listenFor('allowTextarea', {});
        fire('allowTextarea', {element:'textarea'});
        listenFor('allowInputText', {});
        fire('allowInputText', {element:'<input type="text">', usejQuery:true });
    });
    test('keyup13: children to ignore', function(){
        expect(0);
        var type = 'ignoreEnter',
            listener = silence(type, true),
            base = { which: 13, trigger: 'keyup', parent:'div', usejQuery: true },
            $els = $();
        $els.push(fire(type, $.extend({element:'<a href="http://example.com">'}, base)),
                  fire(type, $.extend({element:'textarea'}, base)),
                  fire(type, $.extend({element:'button'}, base)),
                  fire(type, $.extend({element:'<input type="submit">'}, base)));
        if (contenteditable) {
            $els.push(fire(type, $.extend({element:'<span contenteditable="true">'}, base)));
        }
        $els.remove();
        off(type, listener, true);
    });
    test('keyup13: allow due to attr', function() {
        var doit = function(element, trigger, usejQuery) {
                listenFor('allow_'+element, { usejQuery: usejQuery });
                fire({ events: 'allow_'+element, type: 'keyup' },
                     { element: element, which: 13, trigger: trigger, usejQuery: usejQuery });
            };
        doit('textarea', 'keyup');
        doit('input', 'key-enter', true);
    });

    special.keyfake2 = function(e, el, name) {
        equal(e.type, 'keyfake');
        equal(e.which || e.keyCode, 2);
        ok(el, 'should have an element');
        equal(name, 'myelement');
        return e.abort ? false : 'alt';
    };
    test('"keyfake2" extension', function(){
        _.listen({
            type: 'keyfake',
            which: 2,
            abort: true,
            target: {
                nodeName: 'MyElement',
                getAttribute: function() {
                    ok(false, '_.listen should abort when special.fake2 does not return a type');
                }
            }
        });
        _.listen({
            type: 'keyfake',
            keyCode: 2,
            target: {
                nodeName: 'MYELEMENT',
                getAttribute: function(type) {
                    equal(type, 'alt');
                }
            }
        });
    });

    //TODO: test that clicks on !_.boxRE(el.type) have e.preventDefault() called

    module('trigger-add');
    test('<html trigger-add="foo dblclick">', function() {
        listenFor('triggerWasFoo', { usejQuery: true });
        $('<span foo="triggerWasFoo">').appendTo('body').trigger('foo');
        if (document.createEvent) {
            listenFor('triggerWasDblClick', {});
            var e = document.createEvent('UIEvents');
            e.initEvent('dblclick', true, true);
            $('<div dblclick="triggerWasDblClick">').appendTo('body')[0].dispatchEvent(e);
        }
    });
    test('trigger.add("bar")', function() {
        listenFor('triggerWasBar', { usejQuery: true });
        $('<button bar="triggerWasBar">').appendTo('body').trigger('bar');
    });

}(jQuery));
