Rich, declarative custom events for your page controls!

Download: [trigger.min.js][prod]  or  [trigger.js][dev]  
[NPM][npm]: ```npm install trigger```  
Bower: ```bower install trigger```  

[prod]: https://raw.github.com/nbubna/trigger/master/dist/trigger.min.js
[dev]: https://raw.github.com/nbubna/trigger/master/dist/trigger.js
[npm]: https://npmjs.org/package/trigger


## Documentation
Rich, declarative events for the DOM! Add a ```trigger="foo"``` to an element, when the
user "pulls it" (click or Enter keyup, as appropriate), your custom event
will fire automatically.

Doing ```trigger="foo bar"``` will trigger the "foo" and "bar" events in sequence. Your list
of events can be as long as you like. To stop the sequence, catch an event in it and
call ```event.preventDefault()``` or return false to prevent the rest of the events in the
list from happening.

You can add "tags" to an event ```trigger="yell#once#loud"```,
namespaces ```trigger="yell.player"```, data ```trigger="yell['howdy!']"```,
or ugly combinations of the three ```trigger="yell.player['howdy!']#loud"```.
And yes, you must put them in namespaces, data, tags order.

## Examples
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
If you, for some strange reason, care about "valid HTML", then you can do this:  
```javascript
trigger._.attr = 'data-trigger';
```
```html
<button data-trigger="foo">Foo!</button>
```
But personally, [I don't recommend it][invalid].

[invalid]: http://wheelcode.blogspot.com/2012/07/html-validation-is-bad.html


## Release History
* 2010-04-02 v0.1 (internal release - jQuery plugin)
* 2012-09-13 v0.3 (internal release - declarative tags and data)
* 2013-05-03 v0.9.0 (public) - First GitHub release (sans jQuery integration)
