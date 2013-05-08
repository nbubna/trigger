(function($) {

    var trigger = window.trigger,
        _ = trigger._;

    function on(type, listener) {
        _.on(type, listener);
    }
    function off(type, listener) {
        if (document.removeEventListener) {
            document.removeEventListener(type, listener);
        } else {
            document.detachEvent('on'+type, listener);
        }
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
    function listenFor(type, category, data, tags, fn) {
        var listener = function(e) {
            off(type, listener);
            ok(e && e.type, "missing event or typeless event");
            strictEqual(e.type, type, 'should be '+type);
            if (category) {
                strictEqual(e.category, category, 'should be '+category);
            }
            if (data) {
                deepEqual(e.data, data, 'data mismatch');
            }
            if (tags) {
                tags = tags.split(' ');
                for (var tag in tags) {
                    ok(e[tags[tag]], 'event should have '+tags[tag]);
                }
                deepEqual(e.tags, tags, 'should have same tags');
            }
            if (fn) {
                return fn.apply(this, arguments);
            }
        };
        on(type, listener);
    }
    function Promise(){}
    Promise.prototype = {
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
    function create(trigger, element, type) {
        if (!element){ element = 'button'; }
        trigger = trigger.replace(/"/g, "'");
        var html = '<'+element+' '+_.prefix+type+'="'+trigger+'">'+trigger+'</'+element+'>',
            $el = $(html).appendTo($(document.body));
        strictEqual($(element+'['+_.prefix+type+'="'+trigger+'"]').length, 1, 'failed to create element');
        return $el;
    }
    function triggerElement(trigger, element, type, save) {
        if (!type){ type = 'click'; }
        var $el = create(trigger, element, type);
        window.trigger($el[0], _.attr($el[0], type));
        return save ? $el : $el.remove();
    }

    function basics(triggerFn, fnExpects) {
        test('event', function() {
            expect(2+fnExpects);
            listenFor('single');
            triggerFn('single');
        });
        test('sequence', function() {
            expect(4+fnExpects);
            listenFor('one');
            listenFor('two');
            triggerFn('one two');
        });
    }
    function properties(triggerFn, fnExpects) {
        test('categorized event', function() {
            expect(3+fnExpects);
            listenFor('categorized', 'category');
            triggerFn('category:categorized');
        });
        test('event with data', function() {
            expect(3+fnExpects);
            listenFor('data', null, [1,true,'a','b.c',{d:'#'}, [[{}]]]);
            triggerFn('data[1,true,"a",'+"'b.c',"+'{"d":"#"},[[{}]]]');
        });
        test('tagged event', function() {
            expect(5+fnExpects);
            listenFor('tagged', null, null, 'tag1 tag2');
            triggerFn('tagged#tag1#tag2');
        });
        test('everything', function() {
            expect(6+fnExpects);
            listenFor('everything', 'category', ['data'], 'tag');
            triggerFn("category:everything['data']#tag");
        });
    }
    function controls(triggerFn, fnExpects, key) {
        test('cancel event', function() {
            expect(2+fnExpects);
            listenFor('pass', null, null, null, function(e){ e.preventDefault(); });
            var listener = silence('fail');
            triggerFn('pass fail');
            endSilence('fail', listener);
        });
        asyncTest('event.promise()', function() {
            expect(6+fnExpects);
            var resolved = false,
                after = 'after'+(key || Math.random()),
                listener = silence('after');
            listenFor('async', null, null, null, function(e) {
                var promise = new Promise();
                e.promise(promise);
                ok(_.preventDefault(e), 'e.promise() should prevent default');
                setTimeout(function() {
                    start();
                    resolved = true;
                    endSilence(after, listener);
                    listenFor(after, null, null, null, function() {
                        if ($el.remove) {
                            $el.remove();
                        }
                    });
                    promise.resolve();
                }, 100);
            });
            var $el = triggerFn('async '+after, null, null, true);// extra params for triggerElement
        });
    }
    function suite(moduleName, triggerFn, fnExpects, thorough) {
        module(moduleName);
        basics(triggerFn, fnExpects);
        if (thorough === false) {
            properties(triggerFn, fnExpects);
            controls(triggerFn, fnExpects, moduleName.replace(/ /g, '_'));
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

    suite('trigger(event)', trigger, 0);

    suite('trigger(el,event)', triggerElement, 1);

    _.prefix = 'data-';
    suite('data-trigger(el,event)', triggerElement, 1, false);
    _.prefix = '';

    //suite('native trigger', triggerNative, 1);

    //suite('jQuery trigger', triggerjQuery, 1);

}(jQuery));
