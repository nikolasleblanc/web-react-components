# Web React Components

Put your React Components into a neat Web components wrapper and render them
anywhere, not just in your React code.

## Motivation

We have lots of React code and really wanted to write Elm. Putting React inside Elm
is not trivial and not being able to use our tried-and-tested components
would have been a big reason against using Elm.
So after watching Richard Feldman's [talk](https://www.youtube.com/watch?v=ar3TakwE8o0)
we thought "what if Elm rendered just Web Components and the Web Components render
whatever they want inside(in our case React)". So how to convert all of our React
components into Web Components? Well, that is what this repo is for.

## Dependencies

This package requires the following dependencies:

Polyfills:
These polyfills are needed for this to work in all evergreen browsers(including IE11).
We use polyfills for [Web Components V1](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Custom_Elements).

- Polyfills for Web Components features, namely custom elements(CE) and shady DOM(SD)
- Adapter to transform non-native ES2015 classes into true ES2015 classes(needed for CE)
- Everything you need to provide an ES2015 environment in the browser

Libraries:
- React
- ReactDOM

If you don't want to assemble all these polyfills yourself and just want to get
started quickly, just drop these script tags into your page. They contain everything
you need to get going.

**NOTE: even if you use Chrome which supports Web Components, you will still need
the `custom-elements-es5-adapter`.**


```html
<script src="//cdn.polyfill.io/v2/polyfill.min.js?features=default,fetch,es6,Array.prototype.includes"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/webcomponentsjs/1.0.1/custom-elements-es5-adapter.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/webcomponentsjs/1.0.1/webcomponents-sd-ce.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/0.14.8/react-with-addons.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/0.14.8/react-dom.js"></script>
```

## Usage

```sh
npm install -S web-react-components
```

This module will expose functions to hook up your React component with a web component.

Then in your code, import the registering function:
```js
import React from 'react';
// import the registering function
import { register } from 'web-react-components';

const YourComponent = ({ name, isDisabled,  onButtonClick }) => (
  <button disabled={isDisabled} onClick={onButtonClick}>
    {`Hello ${name}, please click me`}
  </button>
);

// call it to register the web component
// this will transform all <your-component>-tags in the markup
// ATTENTION: all custom element tag names MUST contain a dash
// use it anywhere like this:
// <your-component name="Peter" isDisabled onClick="console.log('hello')"></your-component>
register(YourComponent, 'your-component', [
  // these attribute values will be json parsed
  'name',
  // this will define a boolean attribute
  '!!isDisabled',
  ],
  // handlers can be created here. The functions of the object can return any
  // new instance of `Event` or `CustomEvent`
  {
    onButtonClick: e => new Event('buttonclick', { bubbles: true }),
  }
);
```

## API

### Register

The `register` function takes a ReactComponent and registers it using
`customElements.define(...)`.


```
register(reactComponent, nodeName, propsList, eventMappers = {})
```
| Param | Description |
| --- | --- |
| `reactComponent` | An actual React Component Class / Stateless Function |
| `nodeName` | A tag name for the web component to be created (Must contain a dash)|
| `propsList` | An array of strings which represents the props that should be wired up to React. There are 3 ways to declare a prop. <br>- `'propName'`: with a regular name the attribute value be JSON parsed and passed to React, if that fails, then it will be passed as a String. This let you pass arbitrary data to the React component, even through DOM attributes.<br>- `'!!propName'`: With leading bangs this property will be considered a boolean and pass `true` to React or `false` if the attribute is not present on the DOM node.<br>- `'propName()'`: With trailing parens the property will be considered an event handler and set up event proxying between react and the DOM, so that it's possible to listen to React props handlers from the DOM.|
| `eventMappers` | An optional object with function values. The keys are handler property names (e.g. `onChange`) and the values are functions with the following signature `(...args) => Event\|null`. The returned event will then be dispatched on the Web Component. If null is returned nothing is dispatched. *Note: EventMappers will override any event definitions in the propertyList parameter.* |
| returns `WebComponent class` | An class which is already registered using `customElements.define(...)` |

### Convert

Convert is almost the same as `register` except you have to register the
Component yourself. Do this when you want further extend the component before
registering it.

```
// This function will return you a webcomponent instance
convert(reactComponent, propsList, eventMappers = {})
```
| Param | Description |
| --- | --- |
| `reactComponent` | An actual React Component Class / Stateless Function |
| `propsList` | An array of strings which represents the props that should be wired up to React. There are 3 ways to declare a prop. <br>- `'propName'`: with a regular name the attribute value be JSON parsed and passed to React, if that fails, then it will be passed as a String. This let you pass arbitrary data to the React component, even through DOM attributes.<br>- `'!!propName'`: With leading bangs this property will be considered a boolean and pass `true` to React or `false` if the attribute is not present on the DOM node.<br>- `'propName()'`: With trailing parens the property will be considered an event handler and set up event proxying between react and the DOM, so that it's possible to listen to React props handlers from the DOM.|
| `eventMappers` | An optional object with function values. The keys are handler property names (e.g. `onChange`) and the values are functions with the following signature `(...args) => Event\|null`. The returned event will then be dispatched on the Web Component. If null is returned nothing is dispatched. *Note: EventMappers will override any event definitions in the propertyList parameter.* |
| returns `WebComponent class` | An class which can then be used to register using `customElements.define(...)` |

You can the use it like this:
```js
import { convert } from 'web-react-components';

const MyComponent = convert(MyReactComponet, ['name', 'type'],
  {
    onChange: (e) => new Event('crazyChange', { bubbles: true }),
  });

// register it here
customElements.define('my-component', MyComponent);
```
## Examples

Then you can render the component from anywhere (even Elm, React, plain HTML, Angular if you really have to :-))

Elm:
```elm
-- In the view do this:
...
type Msg
   = ...
   | ButtonClick

{-| Define a shortcut for your component -}
yourComponent : List (Attribute msg) -> List (Html msg) -> Html msg
yourComponent = node "your-component"

view model = div [] [
  yourComponent
    [ attribute "name" "Peter"
    , property "isDisabled" (Json.Encode.bool True)
    , on "buttonclick" (Decode.succeed ButtonClick)
    ]
    [ span [style ("color", "green")] [text "Click Me"]
  ]
]
```

Plain HTML:
```html
...
<div>
  <!-- render your component like this-->
  <your-component name="Peter" isDisabled onButtonClick="console.log('you can also use `addEventListener` to attach events')">
    <span style="color: green;">Click Me</span>
  </your-component>
</div>
```

## Passing props

### Attributes and Properties
Since in HTML attribute values can only be strings, other values need to be
encoded. The created web component will try a `JSON.parse()` on each attribute, so all
JSON values are valid inside the string. If the parsing fails the value will
just be passed to React as a string.

`Example: passing '{ "name": Peter }' is fine.`

For each attribute you register, a matching property will be defined on the DOM
node. These properties will have getters and setters that automatically do JSON
parsing and updating the corresponding attribute as well.

You can also use JS to pass properties like this:
```js
document.getElementById('your-dom-id').numbers = [1, 2, 3, 4];
```

### Events

Events can be listened to in 3 different ways that you should be familiar with from
the DOM.

```js
// with `addEventListener()`. The event name will be used here, so use the type of
the returned event from the `eventMappers` parameter.
document.getElementById('#my-component').addEventListener('change', function() { ... }, false);

// with the DOM Property (notice the uppercase `C`, because the name has to be the same as
// the property in React)
document.getElementById('#my-component').onChange = function() { ... };

// with the HTML Attributes
<custom-component onChange="console.log('Hello')"></custom-component>
```
To access data from the original event from React you will have to
do something like this:

```js
document.getElementById('#my-component').addEventListener('change', function(event) {
  // data is an array of arguments that were passed to the react event handler
  const data = event.detail;
  // log the first arg of the react event handler
  console.log(data[0]);
}, false);
```

### Children
Children are passed like you would expect by simple add child nodes to the
element or programmatically changing the `innerHMTL` or `childNodes` of a
custom compoenent.

The children will be part of the shadow DOM of the custom components and are rendered
into a [`<slot>`-tag](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/slot).
That `<slot>` will be passed to the React components as `children`,
that you can render wherever you want.

```html
<custom-component onClick="console.log('Hello')">
  <span>I am a child</span> // will be passed as `children` to React
</custom-component>
```

## What about CSS?

Since the React components, which are wrapped by the Web Component, will live in the
[shadow DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Shadow_DOM),
global css will not have any effect on them(at least in browsers, which are correcly
implementing it). Thus we recommend shipping the components with inline styles, an internal stylesheet, or
or if you want to include an external stylesheet, use an `@import` declaration in
an internal style tag, like this.

```html
// inside render method of your React component
<style>
  @import url('path/to/stylesheeet.css');
</style>
```

## How does it work under the hood?

For the ultimate source of truth, the source code is pretty much all this this
[file](https://github.com/ChristophP/web-react-components/blob/master/src/index.js).

But here is a quick write-up:

The whole React component will be inserted into the Shadow DOM.
For each property that is declared with the exposed register function, a DOM
attribute is created, that is being listened to for changes through
the [`attributeChangedCallback`](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Custom_Elements).
Also, a corresponding DOM node property is set up with getters and setters, that
keeps the property and the attribute in sync. Registering a property with a
leading `!!` will declare a boolean attribute. Then the getters and setters
will work slightly different and pass a boolean value to React depending on the
existence of the attribute.

When a property is registered with a trailing `()`, a handler will be created.
A handler is attached to the wrapped React component, that will
trigger a [`CustomEvent`](https://developer.mozilla.org/de/docs/Web/API/CustomEvent)
on the actual web component DOM node and proxy data data to the web component.
This allows you to listen to react event simply by listening to DOM events.

Children of the web component somehow have to be inserted into the children
of the React components. For this, we use a `<slot>`-tag, which is standard
web component shadow DOM technology and built to handle cases like that.

## More Examples

You can see an example [here](https://github.com/ChristophP/web-react-components/blob/master/dev-assets/index.html).
You can also clone the repo and run `npm i` and `npm start`.
Open your browser at `http://localhost:8080`

There are even more examples in the
[`examples` folder](https://github.com/ChristophP/web-react-components/tree/master/examples).

## Contributing

PRs are highly welcome. If you need features or find bugs please submit an
issue.

## Credits

Made with countless hours of bouncing around ideas with `layflags`. Also intially
inspired by talks with `tkreis` and `rtfeldman`, `tomekwi` at the Elm Europe 2017.
