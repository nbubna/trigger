Use rich, declarative custom events!

Download: [trigger.min.js][prod]  or  [trigger.js][dev]  
[NPM][npm]: ```npm install trigger```  
Bower: ```bower install trigger```  

[prod]: https://raw.github.com/nbubna/trigger/master/dist/trigger.min.js
[dev]: https://raw.github.com/nbubna/trigger/master/dist/trigger.js
[npm]: https://npmjs.org/package/trigger

### Problem: Meaningless Events
You may not realize it yet, but 'click' and 'keyup' are meaningless for webapp developers!
Yes, they have important meaning for browsers and UI libraries,
but what applications really want to know is when a particular click or key event means
(e.g. 'save', 'delete', 'doNext', etc).  They don't usually even care whether
the event was a click or if the user pressed 'Enter'.
Browser are insightful enough to translate certain Enter presses into click events,
but even so, every time you type ```$('#save').on('click', fn)```, you are
cluttering your app's code with browser implementation details.

### Solution: Declarative Custom Events
Add a ```trigger="foo""``` attribute to any element,
when the user "pulls it" (click or Enter keyup, as appropriate),
your custom event will fire automatically.

Doing ```trigger="validate save"``` will trigger the "validate" and "save" events in sequence.
Your list of events can be as long as you like. To stop the sequence, catch an event in it
and call ```event.preventDefault()``` or ```e.returnValue = false;``` 
and the rest of the sequence will be skipped.

### Problem: Simplistic Events
If you think of events as descriptive, you soon realize that your code is speaking in
mere verbs and nouns around, or maybe awkward verbNouns. Then your listeners have to
search the context to figure out what your events are talking about.
Sometimes that is unavoidable or even preferable, but there are plenty of situations
where the type of the event just isn't enough (thus the verbNouns and friends).

### Solution: Rich Event Grammer
trigger.js provides a declarative syntax for grammatically rich events, not merely
custom event types (usually verbs).
This keeps your event listeners simpler and, again, boosts the readability of your HTML.

When you need to distinguish your player's "move" event from that of the enemy,
prefix your event with a category (subject/noun): ```trigger="player:move"```.
Your app-wide action observer can read it from the ```event.category``` property.

To include contextual data (object/noun) for your event, do: ```trigger="view['start']"```
The data gets the JSON.parse() treatment (after some quote massaging) and is set at ```event.data```
(always in an array, thus the brackets);

Finally, you can add simple tags (adjectives/adverbs) to your events, each prefixed by '#':
```trigger="move#up#left"``` and listen for these at ```event.tags``` and each ```event[tag]```
(always true when not undefined).

Be warned, if you have legitimate cause (probably rare) to use combinations of all three:
```trigger="player:move[{'speed':2}]#west"```, then you ***must*** put them in that order:
category, type, data, tags.  Think of it as subject, verb, object, adjectives and you probably won't forget how it goes.

### Problem: Asynchronous Event Sequences
Once you are used to chaining events into nice declarative sequences,
you will likely come upon a situation where one of the handlers needs to do something
asynchronous (e.g. validate something on the server) before the subsequent events are
triggered. To keep things event-y, you do a manual ```trigger('save');``` call at
the end of the success callback for your async business.  But this means your nice
declarative ```<button trigger="validate save">Save</button>``` element becomes a
confusing ```<button trigger="validate">Save</button>```. Not so cool.

### Solution: Promise-Friendly Event Sequences
It's easy, get yourself a [promise][] in that ```validate``` event handler and set it
on the event: ```event.promise(my_jqxhr);```. This automatically cancels the event
sequence and restarts at the next event once the promise is fulfilled.

[promise]: http://wiki.commonjs.org/wiki/Promises/A

### Problem: HTML Validation
You, of course, understand why [HTML validation is considered harmful][invalid],
but your pointy-haired boss believes it is a sign of good web design.

### Solution: data-trigger
```javascript
trigger._.attr = 'data-trigger';
```
```html
<button data-trigger="boss:fail">"validate this"</button>
```

[invalid]: http://wheelcode.blogspot.com/2012/07/html-validation-is-bad.html

### Example(s)
```html
<div id="#chutesAndLadders">
 <input type="dice" name="roll">
 <button trigger="move#up nextPlayer">Climb</button>  
 <button trigger="move#down nextPlayer">Slide</button>
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
