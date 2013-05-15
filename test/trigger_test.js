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
    function silence(type, usejQuery) {
        var fail = function() {
            ok(false, 'There should not have been a "'+type+'" event.');
            off(type, fail, usejQuery);
        };
        on(type, fail, usejQuery);
        return fail;
    }
    function endSilence(type, fail, usejQuery) {
        off(type, fail, usejQuery);
    }
    function listenFor(expect, env) {
        if (typeof expect === "string"){ expect = {type:expect}; }
        var listener;
        on(expect.type, (listener = function(e) {
            off(expect.type, listener, env.usejQuery);
            var ret;
            for (var key in expect) {
                var val = expect[key];
                if (key === 'promise') {
                    if ($.isArray(val)) {
                        val = new TestPromise(e, val, env);// create a promise that resolves in val time
                    }
                    e.promise(val);
                    strictEqual(e.promise, val, 'e.promise(p) should replace itself with arg');
                    ok(_.stopped(e), 'e.promise() should prevent default');
                }
                else if (key === 'stop') {
                    stopSequence(e, expect, env);
                }
                else if ($.isFunction(val)) {
                    if (key === 'handler') {
                        ret = val.apply(this, arguments);
                    } else {
                        val = val.apply(this, arguments);
                    }
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
    function stopSequence(e, expect, env) {
        var next = nextEvent(e),
            listener = silence(next, env.usejQuery);
        if (!expect.handler) {
            e.preventDefault();
            ok(_.stopped(e), 'default should be prevented');
        }
        // clean up
        setTimeout(function(){
            if (e.target !== document) {
                $(e.target).remove();
            }
            endSilence(next, listener, env.usejQuery);
        }, 0);
    }
    function fire(e, env) {
        if (typeof e === "string"){ e = { events:e }; }
        if (!e.element){ e.element = env.useElement; }
        if (!e.type) { e.type = env.useType; }
        if (!e.element) {
            return trigger(e.events);
        }
        // make sure trigger is listening
        trigger.add(e.type);
        e.events = e.events.replace(/"/g, "'");
        if (typeof e.element === "string") {
            e.element = $('<'+e.element+'>').attr(e.type, e.events).appendTo('body')[0];
        }
        if (env.usejQuery) {
            $(e.element).trigger(e.type);
        } else {
            if (e.element[e.type]) {
                e.element[e.type]();
            } else {
                var evt = document.createEvent('UIEvents');
                evt.initEvent(e.type, true, true);
                e.element.dispatchEvent(evt);
            }
        }
    }
    function _test(name, input, output, env) {
        var testFn = output.promise ? asyncTest : test;
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
                if (key === 'promise') {
                    num += count(e.promise) + 4;
                } else if (key !== 'handler') {
                    num++;
                }
            }
        }
        return num;
    }
    function nextEvent(e) {
        var seq = e.sequence || [],
            i = $.inArray(e.text, seq),
            next = _.parse(seq[i+1]);
        return next ? next.type : null;
    }
    function TestPromise(e, output, env) {
        var promise = this,
            next = nextEvent(e),
            listener = silence(next, env.usejQuery);
        ok(next, e.type+' should have a next event');
        setTimeout(function() {
            start();
            endSilence(next, listener, env.usejQuery);
            for (var i=0,m=output.length; i<m; i++) {
                listenFor(output[i], env);
            }
            promise.resolve('tested!');
        }, output.time || 100);
    }
    TestPromise.prototype = {
        fn: [],
        then: function(fn) {
            ok(fn, 'then(fn) must have a function argument');
            this.fn.push(fn);
            if ('resolution' in this) {
                this.resolve(this.resolution);
            }
        },
        resolve: function(val) {
            this.resolution = val;
            var fn;
            while (fn = this.fn.pop()) {
                fn(val);
            }
        }
    };
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
        var async = 'async'+id;//Math.random();
        _test('promise', async+' after', {type:async, promise:['after']}, env);
    }
    var id = 0;
    function suite(name, env) {
        id++;
        if (!env.useType){ env.useType = 'click'; }
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
            fns = 'preventDefault promise'.split(' ');
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
        var fns = 'all parse event stopped listen find attr on manual add prop'.split(' ');
        for (i=0,m=fns.length; i<m; i++) {
            ok($.isFunction(_[fns[i]]), 'missing function "'+fns[i]+'", not backward compatible');
        }
    });

    suite('trigger(events)', {});

    suite('<button click="events">', {useElement: 'button'});

    suite('<input keypress="events">', {useType:'keypress', useElement: 'input'});

    var special = _.special;
    test('_.special.click', function(){
        //var textarea = $('<textarea>'),
        //    e = { type: 'click' };
        expect(0);// for now
    });
    test('_.special.keyup13', function(){
        expect(0);//for now
    });

    special.fake2 = function(e, el, name) {
        equal(e.type, 'fake');
        equal(e.which || e.keyCode, 2);
        ok(el, 'should have an element');
        equal(name, 'myelement');
        return e.abort ? false : 'alt';
    };
    test('_.special.fake2', function(){
        _.listen({
            type: 'fake',
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
            type: 'fake',
            keyCode: 2,
            target: {
                nodeName: 'MYELEMENT',
                getAttribute: function(type) {
                    equal(type, 'alt');
                }
            }
        });
    });

}(jQuery));
