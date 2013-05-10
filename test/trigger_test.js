(function($) {

    var trigger = window.trigger,
        _ = trigger._,
        usejQuery = false,
        useElement = null,
        useType = 'click';

    function on(type, listener) {
        if (usejQuery){ $(document).on(type, listener); }
        else if (document.addEventListener){ document.addEventListener(type, listener); }
        else { document.attachEvent('on'+type, function(){ listener(window.event); }); }
    }
    function off(type, listener) {
        if (usejQuery){ $(document).off(type, listener); }
        else if (document.removeEventListener){ document.removeEventListener(type, listener); }
        else { document.detachEvent('on'+type, listener); }
    }
    function silence(type) {
        var fail = function() {
            ok(false, 'There should not have been a "'+type+'" event.');
            off(type, fail);
        };
        on(type, fail);
        return fail;
    }
    function endSilence(type, fail) {
        off(type, fail);
    }
    function listenFor(expect, listener) {
        if (typeof expect === "string"){ expect = {type:expect}; }
        on(expect.type, (listener = function(e) {
            off(expect.type, listener);
            var ret;
            for (var key in expect) {
                var val = expect[key];
                if (key === 'promise') {
                    if ($.isArray(val)) {
                        val = new TestPromise(e, val);// create a promise that resolves in val time
                    }
                    e.promise(val);
                    strictEqual(e.promise, val, 'e.promise(p) should replace itself with arg');
                    ok(_.preventDefault(e), 'e.promise() should prevent default');
                }
                else if (key === 'cancel') {
                    cancel(e);
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
            if (!e.triggers || $.inArray(e.trigger, e.triggers) === e.triggers.length-1) {
                $(e.target).remove();
            }
            return ret;
        }));
    }
    function cancel(e) {
        var next = nextEvent(e),
            listener = silence(next);
        if (!e.handler) {
            e.preventDefault();
        }
        // clean up
        setTimeout(function(){
            if (e.target !== document) {
                $(e.target).remove();
            }
            endSilence(next, listener);
        }, 0);
    }
    function fire(e) {
        if (typeof e === "string"){ e = { events:e }; }
        if (!e.element){ e.element = useElement; }
        if (!e.type){ e.type = useType; }
        if (!e.element) {
            return trigger(e.events);
        }
        e.events = e.events.replace(/"/g, "'");
        if (typeof e.element === "string") {
            e.element = $('<'+e.element+'>').attr(e.type, e.events).appendTo('body')[0];
        }
        if (usejQuery) {
            $(e.element).trigger(e.type);
        }
        else if (e.element[e.type]) {
            e.element[e.type]();
        }
        else {
            trigger(e.element, e.events);
        }
    }
    function doTest(name, input, output) {
        var testFn = output.promise ? asyncTest : test;
        if ($.isPlainObject(name)) {
            output = input; input = name;
            name = input.type ? input.type+'='+input.events : input.events;
        }
        testFn(name, count(output), function() {
            if (!$.isArray(output)) {
                listenFor(output);
            } else {
                for (var i=0,m=output.length; i<m; i++) {
                    listenFor(output[i]);
                }
            }
            fire(input);
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
                } else if (key !== 'cancel' && key !== 'handler') {
                    num++;
                }
            }
        }
        return num;
    }
    function nextEvent(e) {
        var seq = e.triggers || [],
            i = $.inArray(e.trigger, seq),
            next = _.parse(seq[i+1]);
        return next ? next.type : null;
    }
    function TestPromise(e, output) {
        var promise = this,
            next = nextEvent(e),
            listener = silence(next);
        ok(next, e.type+' should have a next event');
        setTimeout(function() {
            start();
            endSilence(next, listener);
            for (var i=0,m=output.length; i<m; i++) {
                listenFor(output[i]);
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

    function basic() {
        doTest('event', 'single', { type:'single', trigger:'single' });
    }
    function properties() {
        doTest('category', 'category:categorized', {type:'categorized', category:'category'});
        doTest('data', 'data[1,true,"a",'+"'b.c',"+'{"d":"#"},[[{}]]]',
              {type:'data', data:[1,true,'a','b.c',{d:'#'},[[{}]]] });
        doTest('tags', 'tagged#tag1#tag2', {type:'tagged', tags:'tag1 tag2'.split(' ')});
        doTest('everything', "category:everything['data']#tag",
               { type:'everything', category:'category', data:['data'], tags:['tag']});
    }
    function sequences() {
        doTest('sequence', 'one two', ['one','two']);
        doTest('cancel', 'pass fail',
               {type:'pass', cancel:true, handler:function(e){e.preventDefault();} });
        var async = 'async'+Math.random();
        doTest('promise', async+' after', {type:async, promise:['after']});
    }
    function suite(name) {
        module(name+' standard');
        basic();
        properties();
        sequences();

        module(name+' with prefix');
        _.prefix = 'data-';
        basic();
        _.prefix = '';

        if (!usejQuery) {
            usejQuery = true;
            suite('jQuery: '+name);
            usejQuery = false;
        }
    }
    
    module('api');
    test('user', function() {
        ok(trigger, 'no trigger(), not backward compatible');
        //TODO: test event api
    });
    test('developer', function() {
        ok(_, 'no _ object');
        var props = 'version prefix splitRE noClickRE noEnterRE buttonRE boxRE special'.split(' ');
        for (var i=0,m=props.length; i<m; i++) {
            ok(props[i] in _, 'missing property "'+props[i]+'", not backward compatible');
        }
        var fns = 'all parse event preventDefault listen find attr on manual translate prop'.split(' ');
        for (i=0,m=fns.length; i<m; i++) {
            ok($.isFunction(_[fns[i]]), 'missing function "'+fns[i]+'", not backward compatible');
        }
    });

    suite('trigger(events)');

    useElement = 'button';
    suite('<button click="events">');

    useType = 'change';
    useElement = 'input';
    suite('<input change="events">');

    //TODO: test special click and keyup handling

}(jQuery));
