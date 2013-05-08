(function($) {
    /*
    ======== A Handy Little QUnit Reference ========
    http://api.qunitjs.com/

    Test methods:
      module(name, {[setup][ ,teardown]})
      test(name, callback)
      expect(numberOfAssertions)
      stop(increment)
      start(decrement)
    Test assertions:
      ok(value, [message])
      equal(actual, expected, [message])
      notEqual(actual, expected, [message])
      deepEqual(actual, expected, [message])
      notDeepEqual(actual, expected, [message])
      strictEqual(actual, expected, [message])
      notStrictEqual(actual, expected, [message])
      throws(block, [expected], [message])
    */

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

    function expectSilence(type) {
        var fail = function() {
            ok(false, 'There should not have been a "'+type+'" event.');
            off(type, fail);
        };
        on(type, fail);
    }

    function listenFor(type, category, data, tags, fn) {
        var listener = function(e) {
            off(type, listener);
            ok(e);
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
                if (!fn.apply(this, arguments)) {
                    _.stop(e, true);
                }
            }
        };
        on(type, listener);
    }

    function create(trigger, element) {
        if (!element){ element = 'button'; }
        trigger = trigger.replace(/"/g, "'");
        var html = '<'+element+' '+_.attr+'="'+trigger+'">'+trigger+'</'+element+'>',
            $el = $(html).appendTo($(document.body));
        strictEqual($(element+'['+_.attr+'="'+trigger+'"]').length, 1, 'failed to create element');
        return $el;
    }

    function triggerElement(trigger, element) {
        var $el = create(trigger, element);
        window.trigger($el[0]);
        $el.remove();
    }

    function suite(triggerFn, fnExpects, thorough) {
        test('single event', function() {
            expect(2+fnExpects);
            listenFor('single');
            triggerFn('single');
        });
        if (thorough !== false) {
            test('two events', function() {
                expect(4+fnExpects);
                listenFor('one');
                listenFor('two');
                triggerFn('one two');
            });
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
        test('cancel event', function() {
            expect(2+fnExpects);
            listenFor('pass', null, null, null, function(){ return false; });
            expectSilence('fail');
            triggerFn('pass fail');
        });
    }
    
    module('api');
    test('user', function() {
        expect(1, 'user api changed, bump major version');
        ok(trigger, 'no trigger()');
    });
    test('developer', function() {
        expect(20, 'developer api changed, bump minor version');
        ok(_, 'no _ object');
        var props = 'version attr splitRE noClickRE noEnterRE buttonRE boxRE'.split(' ');
        for (var i=0,m=props.length; i<m; i++) {
            ok(props[i] in _, 'missing property "'+props[i]+'"');
        }
        var fns = 'all parse event stop listen find click keyup on init prop'.split(' ');
        for (i=0,m=fns.length; i<m; i++) {
            ok($.isFunction(_[fns[i]]), 'missing function "'+fns[i]+'"');
        }
    });

    module('trigger(event)');
    suite(trigger, 0);

    module('trigger(el, event)');
    suite(triggerElement, 1);

    module('data-trigger(el, event)');
    _.attr = 'data-trigger';
    suite(triggerElement, 1, false);
    _.attr = 'trigger';

    module('native trigger', {
        setup: function() {// This will run before each test in this module.
          //TODO?
        }
    });
    //suite(triggerNative, 1);

    module('jQuery trigger');

}(jQuery));
