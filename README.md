### Rich, custom, declarative events!

Download: [trigger.min.js][prod]  or  [trigger.js][dev]  
[NPM][npm]: ```npm install trigger```  
Bower: ```bower install trigger```  

[prod]: https://raw.github.com/nbubna/trigger/master/dist/trigger.min.js
[dev]: https://raw.github.com/nbubna/trigger/master/dist/trigger.js
[npm]: https://npmjs.org/package/trigger

### Bad: Meaningless Events
You may have noticed that events like 'click' and 'keyup' are meaningless in regards
to your application's logic, but i bet you still register listeners for them in your
application's code.
What application code actually needs to know is when a particular event means
(e.g. 'save', 'delete', 'next', etc). Cluttering your javascript with browser
implementation terms like 'click' only make your code less readable and harder
to test.  Your javascript should ideally only be registering listeners for 
events that are meaningful (i.e. custom) to your application.

### Good: Declarative Application Events
Add trigger.js to your page, then simply declare what 'click' means
right there on your element:
```html
<button click="save">Save</button>
```
When the user "clicks" it (or hits 'Enter' while focused), a 'save'
event is automatically created triggered on the element.
Your javascript never needs to listen for a click event again.

If translating "click" events is not enough for you,
you can tell trigger.js to translate other native events as well:  
```javascript
trigger.translate('dblclick');
```
```html
<div class="folder" dblclick="open">...</div>
```

NOTE: If you want trigger.js to translate events that do not natively bubble,
just include jQuery (at least the event support) in your page and all shall be well.


### Hard: Dependent Events
Sometimes a single "click" should trigger a sequence of events. This can be handled
by registering multiple event listeners in careful order and using tricks like
jQuery's or triggering the next event at the completion of the previous one.
But this can be a fragile, complicated process and is far from declarative and readable.
It's no fun when you ```e.stopImmediatePropogation();``` and end up cancelling listeners
you didn't mean to cancel.

### Easy: Declarative Event Sequences
```html
<input type="submit" click="validate save">
```
This will trigger the "validate" and "save" events in sequence.
Your list of events can be as long as you like. To stop the sequence, catch an event in it
and call ```event.preventDefault()``` to cancel only the rest of the specific, declared sequence.


### Mediocre: Simplistic Events
Once you've achieved app-specific events, you may realize that your code is only declaring
events as disconnected verbs or nouns, or maybe awkward verbNouns. Your listeners have to
glean information from the context or target element to decipher the full meaning of the event.
Sometimes that simplicity is good, but sometimes it is a real problem.

### Awesome: Rich Events
trigger.js provides a declarative syntax for grammatically rich events, 
for better self-documentation in your javascript and HTML,
as well as simpler event listeners.

#### click="category:type" -> event.category
When you need to distinguish your player's "move" event from that of a different feature,
prefix your event with a category (subject/noun): ```click="player:move"```.
Any app-wide 'move' listener can read it from the ```event.category``` property.

#### click="type[data]" -> event.data
To include contextual data (object/noun) for your event, do: ```click="view['start']"```
The data gets the JSON.parse() treatment (after some quote massaging) and is set at ```event.data```
(always in an array, thus the brackets);

#### click="type#tag" -> event.tags
Finally, you can add simple tags (adjectives/adverbs) to your events, each prefixed by '#':
```click="move#up#left"``` and listen for these at ```event.tags``` and each ```event[tag]```
(the individual tags are always given a value of ```true```).

NOTE: If you have a reason to use combinations of all three (probably rare),
then you ***must*** put them in this order: ```category:type[data]#tags```
(e.g. ```click="player:move[{'speed':2}]#west"```).
Think of it as subject, verb, object, adjectives and you probably won't forget how it goes.


### Fail: Asynchronous Handler in an Event Sequence
Once you are used to chaining events into nice declarative sequences,
you will likely come upon a situation where one of the handlers needs to do something
asynchronous (e.g. validate something on the server) before the subsequent events are
triggered. To keep things event-y, you do a manual ```trigger('save');``` call at
the end of the success callback for your async business.  But this means your nice
declarative ```<button click="validate save">Save</button>``` element becomes a
confusing ```<button click="validate">Save</button>```.

### Win: ```event.promise(promise)```
It's easy, get yourself a [promise][] in that ```validate``` event handler and set it
on the event: ```event.promise(my_jqxhr);```. This automatically cancels the event
sequence and restarts it at the next event once the promise is fulfilled. Now you
can have your straightforward ```click="validate save"``` button back!

NOTE: Events will only listen to a single promise. To enforce this and provide
access to the promise, the ```event.promise()``` function replaces itself with the
promise you give it.

[promise]: http://wiki.commonjs.org/wiki/Promises/A


### Irritation: HTML Validation
You, of course, understand why [HTML validation is considered harmful][invalid],
but your pointy-haired boss believes it is a sign of good web design.

### Workaround: data- prefix
```javascript
trigger._.prefix = 'data-';
```
```html
<button data-click="lame">"validate this"</button>
```

[invalid]: http://wheelcode.blogspot.com/2012/07/html-validation-is-bad.html


### Another Example
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


### Advanced Details
#### 'click'-ish secrets
 * Clicks are ignored if their target was a user-editable field (e.g. textarea) that did not
have a click attribute itself, but was a child of an element that did have one.
 * Enter keyups (keyCode:13) are treated as clicks if their target lacks a "native response"
to such events (e.g. in a textarea, it adds a new line, or on a link, it causes a click).
The exception being if such an element has a keyup attribute declared on it.
 * When a click is translated by trigger.js, it will automatically prevent the original event's
default behavior, except in the case of radio buttons and checkboxes. The assumption is
that the default behavior is replaced by the declared event sequence.

#### trigger._.special
This extension hook provides you the opportunity to change event types, with some particular
aid for tweaking events that have a 'which' or 'keyCode' important to you. Here's an example:

```html
<div tabIndex="0" key-del="delete" click="edit">
  <span>Nathan Bubna</span>
  <input type="text" key-esc="cancel" key-enter="save">
</div>
```
```javascript
$.extend(trigger._.special, {
    keyup27: function(e){ return 'key-esc'; },
    keyup46: function(e){ return 'key-del'; }
});
```
Notice that ```key-enter``` is already supported, and, because trigger.js already listens
for ```keyup``` and ```click``` events, we didn't have to call ```trigger.translate('keyup');```.



## Release History
* 2010-04-02 v0.1 (internal release - jQuery plugin)
* 2012-09-13 v0.3 (internal release - declarative tags and data)
* 2013-05-09 v1.0.0 (public - promises, translate, native, and more)
