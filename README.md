### Rich, custom, declarative events!

Download: [trigger.min.js][prod]  or  [trigger.js][dev]  
[NPM][npm]: ```npm install trigger```  
Bower: ```bower install trigger```  

[prod]: https://raw.github.com/nbubna/trigger/master/dist/trigger.min.js
[dev]: https://raw.github.com/nbubna/trigger/master/dist/trigger.js
[npm]: https://npmjs.org/package/trigger

### Problem: Meaningless Events
You may have noticed that events like 'click' and 'keyup' are meaningless in regards
to your application's code, but i bet you still register listeners for them.
What application code actually needs to know is when a particular event means
(e.g. 'save', 'delete', 'doNext', etc). Cluttering your javascript with browser
implementation terms like 'click' only make your code less readable and harder
to test.  Your javascript should ideally only be registering listeners for 
events that are meaningful (i.e. custom) to your application.

### Solution: Declarative Application Events
Add a ```click="foo"``` attribute to any element,
when the user "clicks" it (click or Enter keyup, as appropriate),
trigger.js will automatically fire your custom event.
Your javascript never needs to listen for a click event again.

If translating "click" events is not enough for you,
you can tell trigger.js to translate other native events as well:  
 ```javascript
 trigger.translate('mouseenter');
 ```
 ```html
 <div mouseenter="activate">...</div>
 ```

### Problem: Dependent Events
Sometimes a single "click" should trigger a sequence of events. This can be handled
by registering multiple event listeners in careful order and using tricks like
jQuery's ```e.stopImmediatePropogation();``` or simply triggering the next event at
the completion of the previous one. But this can be a fragile, complicated process
and is far from declarative and readable.

### Solution: Declarative Event Sequences
Doing ```click="validate save"``` will trigger the "validate" and "save" events in sequence.
Your list of events can be as long as you like. To stop the sequence, catch an event in it
and call ```event.preventDefault()``` to cancel the rest of the sequence.

### Problem: Simplistic Events
Once you've achieved app-specific events, you may realize that your code is only declaring
events as disconnected verbs or nouns, or maybe awkward verbNouns. Your listeners have to
glean information from the context or target element to decipher the full meaning of the event.
Sometimes that simplicity is good, but sometimes it is a real problem.

### Solution: Rich Events
trigger.js provides a declarative syntax for grammatically rich events, 
for better self-documentation in your javascript and HTML,
as well as simpler event listeners.

#### event.category
When you need to distinguish your player's "move" event from that of a different feature,
prefix your event with a category (subject/noun): ```click="player:move"```.
Any app-wide 'move' listener can read it from the ```event.category``` property.

#### event.data
To include contextual data (object/noun) for your event, do: ```click="view['start']"```
The data gets the JSON.parse() treatment (after some quote massaging) and is set at ```event.data```
(always in an array, thus the brackets);

#### event.tags
Finally, you can add simple tags (adjectives/adverbs) to your events, each prefixed by '#':
```click="move#up#left"``` and listen for these at ```event.tags``` and each ```event[tag]```
(the individual tags are always given a value of ```true```).

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

### Solution: ```event.promise(promise)```
It's easy, get yourself a [promise][] in that ```validate``` event handler and set it
on the event: ```event.promise(my_jqxhr);```. This automatically cancels the event
sequence and restarts it at the next event once the promise is fulfilled. Now you
can have your straightforward ```click="validate save"``` button back! Very cool.

NOTE: Events will only listen to a single promise. To enforce this and provide
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
