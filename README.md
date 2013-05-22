##### Rich, declarative, custom events are awesome. Don't know what i'm talking about? Read on...

Download: [trigger.min.js][prod]  or  [trigger.js][dev]  
[NPM][npm]: `npm install trigger`  
Bower: `bower install trigger`  

[prod]: https://raw.github.com/nbubna/trigger/master/dist/trigger.min.js
[dev]: https://raw.github.com/nbubna/trigger/master/dist/trigger.js
[npm]: https://npmjs.org/package/trigger

#### Meaningless Events Are Lame
Events like 'click' and 'keyup' are meaningless to the models and logic of most applications,
but i bet you still register listeners for them in your application's code. This is lame.

Your application code only needs to know what a particular event means
(e.g. 'save', 'delete', 'next', etc). Your app's ideal javascript would only
register listeners for events that are meaningful to your specific application (i.e. custom events).

### Declarative Application Events Are Awesome!
Add trigger.js to your page, then simply declare what 'click' means in your markup:
```html
<button click="save">Save</button>
```
When the user "clicks" it, a 'save' event is automatically created and dispatched on the element.
Your application never needs to listen for a click event again.

Most people can get by with just declaring the meaning of clicks,
but you can easily add other native events as additional triggers:  
```html
<html trigger-add="dblclick drop">
...
<div class="folder" dblclick="open" drop="move">...</div>
```


#### Dependent Events Are Hard
Sometimes a single "click" serves as a trigger for a sequence of application actions.
The simpler apps out there just conflate the actions into one `$(form).click(saveIfValid)`.
More advanced developers might register multiple listeners for the same event and
use `event.stopImmediatePropogation();` when you need to break the sequence.
But both approaches (and most varieties of them) are fundamentally hacks to workaround
you wanting a single brower event to start a sequence of application events.
There is a better way...

### Declaring Event Sequences Is Awesome!
```html
<input type="submit" click="validate save">
```
This will trigger the "validate" and "save" events in sequence.
Your list of events can be as long as you like. Any event handler can just call
`event.stopSequence()` to stop the rest of the specific, declared sequence.
Then, if you like, you can call `event.resumeSequence()` to restart it where you left off.
And of course, check on the state of things with `event.isSequenceStopped()`.


#### What About Asynchronous Handlers?!
Once you are used to chaining events into nice declarative sequences,
you will likely come upon a situation where one of the handlers needs to do something
asynchronous (e.g. validate something on the server) before the subsequent events are
triggered. To keep things event-y, you do a manual `trigger('save');` call at
the end of the success callback for your async business.  But this means your nice
declarative `<button click="validate save">Save</button>` element becomes a
confusing `<button click="validate">Save</button>`.

### Not A Problem, Friend.
It's easy, get yourself a [promise][] in that `validate` event handler and set it
on the event (e.g. `event.stopSequence(promise);`). This stops the event sequence
and automatically resumes it again once the promise is fulfilled. Now you
can have your straightforward `click="validate save"` button back!

[promise]: http://wiki.commonjs.org/wiki/Promises/A


#### Simplistic Events Are Not Simple
Once you've earned your "Application Events" achievement, you may realize you are only declaring
events as disconnected verbs or nouns, or maybe awkward verbNouns. Your listeners have to
glean information from the context or target element to decipher the full meaning of the event.
Not to mention that this stuff can easily land you in "use comments to explain" territory.
Sometimes that simplicity is good, but sometimes it is a real problem.

### Grammatically Rich Events Are Simply Awesome!
trigger.js provides a declarative syntax for grammatically rich events.
This helps you level-up the self-documentation of your javascript and HTML
and simplify your event listeners.

##### click="category:type" -> event.category
When you need to distinguish your player's "move" event from that of a different feature,
prefix your event with a category (subject/noun): `click="player:move"`.
Any app-wide 'move' listener can read it from the `event.category` property.

##### click="type['constant']" -> event.constants
To include contextual constants (object/noun) for your event, do: `click="view['start']"`
The constant gets the JSON.parse() treatment (after some quote massaging) and
is set at `event.constants` (always in an array, thus the brackets);

##### click="type#tag" -> event.tags
Finally, you can add simple tags (adjectives/adverbs) to your events, each prefixed by '#':
`click="move#up#left"` and listen for these at `event.tags` and each `event[tag]`
(the individual tags are always given a value of `true`).

NOTE: If you have a reason to use combinations of all three (probably rare),
then you ***must*** put them in this order: `category:type['constant']#tags`
(e.g. `click="player:move[{'speed':2}]#west"`).
Think of it as subject, verb, object, adjectives and you probably won't forget how it goes.



#### But HTML Validation?!
You probably understand why [HTML validation is considered harmful][invalid],
but your pointy-haired boss still labors under the naive impression that it is a best practice.

### Ok, fine, you can have your 'data-' prefix
```html
<html data-trigger="true" data-trigger-add="dblclick">
...
<button data-click="lame">"validate this"</button>
```

[invalid]: http://wheelcode.blogspot.com/2012/07/html-validation-is-bad.html

#### But Old IE?!?
You aren't ready to abandon the poor saps still using ancient versions of IE.
Sure, Google stopped supporting them, but you aren't Google.

### Can do.
Just use jQuery (of course) and this [tiny extension][old]:
```html
<!--[if lt IE 9]>
  <script src="../src/trigger.old.js"></script>
<![endif]-->
```

[old]: https://raw.github.com/nbubna/trigger/master/src/trigger.old.js

### Another Small Extension
If you see yourself manually using trigger instead of always letting browser events
serve as triggers and also happen to be fond of jQuery, [jquery.trigger.js][jquery]
allows you to do `$('#foo').trigger('foo:squish#gooey');` instead of
`trigger($('#foo')[0], 'foo:squish#gooey');`.

[jquery]: https://raw.github.com/nbubna/trigger/master/src/jquery.trigger.js

#### Short jQuery Version - For Those Who Don't Need All The Features
```javascript
$(document).on('click', function(e) {
  var $el = $(e.target).closest('[click]'),
      events = $el.attr('click') || '';
  events.split(' ').forEach(function(event) {
    $el.trigger(event);
    if (!$(e.target).is('[type=radio],[type=checkbox]')) e.preventDefault();
  });
});
```


### Mini-Example, Just For Fun
```html
<div id="#chutesAndLadders">
  <input type="dice" name="roll">
  <button click="move#up nextPlayer">Climb</button>  
  <button click="move#down nextPlayer">Slide</button>
</div>
```
```javascript
var game = document.querySelector('#dungeonPlunge');
game.addEventListener('nextPlayer', function() {
  player = player.next;
});
game.addEventListener('move', function(e) {
  var distance = game.querySelector('[name=roll]').value;
  if (e.up) player.climb(distance);
  if (e.down) player.slide(distance);
  if (player.hasWon()) e.stopSequence();//blocks nextPlayer event
});
```
  

### Advanced Details
#### 'click'-ish secrets
 * Clicks are ignored if their target was a user-editable field (e.g. textarea) that did not
have a click attribute itself, but was a child of an element that did have one.
 * Enter keyups (keyCode:13) are treated as clicks if their target lacks a "native response"
to such events (e.g. in a textarea, it adds a new line, or on a link, it causes a click).
The exception being if such an element has a `keyup` or `key-enter` attribute declared on it.
 * When a click is used by trigger.js, it will automatically prevent the original event's
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
Note: trigger.js already listens for `keyup` and `click` events. For other special events,
like keydown or dblclick, remember to do `<html trigger-add="keydown">` or the like.

TODO: add more advanced details...


#### Release History
* 2010-04-02 v0.1 (internal)
* 2012-09-13 v0.3 (internal)
* 2013-05-03 v0.9.0 (public) - First GitHub release
* 2013-05-16 v1.0.0 (public) - tests and feature completeness
* 2013-05-21 v1.1.0 (public) - declarative configuration
