### Get rich, declarative custom events!

Download: [trigger.min.js][prod]  or  [trigger.js][dev]  
[NPM][npm]: ```npm install trigger```  
Bower: ```bower install trigger```  

[prod]: https://raw.github.com/nbubna/trigger/master/dist/trigger.min.js
[dev]: https://raw.github.com/nbubna/trigger/master/dist/trigger.js
[npm]: https://npmjs.org/package/trigger

### Problem: Meaningless Events
You may not realize it yet, but events like 'click' and 'keyup' are meaningless for webapp developers!
Yes, they have important meaning for browsers and UI libraries,
but what application code actually needs to know is when a particular event means
(e.g. 'save', 'delete', 'doNext', etc).  They don't usually even care whether
the event was a click or if the user pressed 'Enter'.
Browser are insightful enough to translate some Enter presses into click events,
but even so, typing ```$('#save').on('click', fn)``` is
cluttering your javascript with browser implementation details and making it
harder to test as well.

### Solution: Declarative Application Events
Add a ```click="foo"``` attribute to any element,
when the user "clicks" it (click or Enter keyup, as appropriate),
trigger.js will ensure that your custom event will fire automatically.

Doing ```click="validate save"``` will trigger the "validate" and "save" events in sequence.
Your list of events can be as long as you like. To stop the sequence, catch an event in it
and call ```event.preventDefault()``` to cancel the rest of the sequence.

If "click" (or click-like) events are not enough for you, you can tell trigger.js to translate
other native events as well:  
 ```<div mouseenter="activate">...</div>``` ```trigger.translate('mouseenter');```

Now your app can use events that are meaningfully descriptive or instructive,
and not waste energy handling browser implementation events.

### Problem: Simplistic Events
Once your events are meaningful, you may realize that your code is only declaring
events as disconnected verbs or nouns, or maybe awkward verbNouns. Your listeners have to
glean information from the context or target element to decipher the full meaning of the event.
Sometimes that simplicity is good, but sometimes it is a real problem.

### Solution: Rich Events
trigger.js provides a declarative syntax for grammatically rich events, not merely
custom event types (usually verbs).
This keeps your event listeners simpler and your HTML self-documenting.

When you need to distinguish your player's "move" event from that of a different feature,
prefix your event with a category (subject/noun): ```click="player:move"```.
Any app-wide 'move' listener can read it from the ```event.category``` property.

To include contextual data (object/noun) for your event, do: ```click="view['start']"```
The data gets the JSON.parse() treatment (after some quote massaging) and is set at ```event.data```
(always in an array, thus the brackets);

Finally, you can add simple tags (adjectives/adverbs) to your events, each prefixed by '#':
```click="move#up#left"``` and listen for these at ```event.tags``` and each ```event[tag]```
(always true when not undefined).

NOTE: should you have cause to use combinations of all three (probably rare),
then you ***must*** put them in this order:
```click="player:move[{'speed':2}]#west"``` (category, type, data, tags).
Think of it as subject, verb, object, adjectives and you probably won't forget how it goes.

### Problem: Asynchronous Handlers + Event Sequence = Fail
Once you are used to chaining events into nice declarative sequences,
you will likely come upon a situation where one of the handlers needs to do something
asynchronous (e.g. validate something on the server) before the subsequent events are
triggered. To keep things event-y, you do a manual ```trigger('save');``` call at
the end of the success callback for your async business.  But this means your nice
declarative ```<button click="validate save">Save</button>``` element becomes a
confusing ```<button click="validate">Save</button>```. Not so cool.

### Solution: Promise-Friendly Event Sequences
It's easy, get yourself a [promise][] in that ```validate``` event handler and set it
on the event: ```event.promise(my_jqxhr);```. This automatically cancels the event
sequence and restarts it at the next event once the promise is fulfilled. Now you
can have your straightforward ```click="validate save"``` button back! Very cool.

NOTE: Only events with subsequent events are given this ability.
Also, such events will only listen to a single promise. To enforce this and provide
access to the promise, the ```event.promise()``` function replaces itself with the
promise you give it.

[promise]: http://wiki.commonjs.org/wiki/Promises/A

### Problem: HTML Validation
You, of course, understand why [HTML validation is considered harmful][invalid],
but your pointy-haired boss believes it is a sign of good web design.

### Solution: data- prefix
```javascript
trigger._.prefix = 'data-';
```
```html
<button data-click="lame">"validate this"</button>
```

[invalid]: http://wheelcode.blogspot.com/2012/07/html-validation-is-bad.html

### Example(s)
```html
<div id="#chutesAndLadders">
 <input type="dice" name="roll">
 <button click="move#up nextPlayer">Climb</button>  
 <button click="move#down nextPlayer">Slide</button>
</div>
```
```javascript
var game = document.querySelector('#chutesAndLadders');
game.addEventListener('nextPlayer', function() {
    player = player.next;
});
game.addEventListener('move', function(e) {
   var distance = game.querySelector('[name=roll]').value;
   if (e.up) player.climb(distance);
   if (e.down) player.slide(distance);
   if (player.hasWon()) e.preventDefault();//blocks nextPlayer event
});
```

## Release History
* 2010-04-02 v0.1 (internal release - jQuery plugin)
* 2012-09-13 v0.3 (internal release - declarative tags and data)
* 2013-05-08 v1.0.0 (public) - First GitHub release
