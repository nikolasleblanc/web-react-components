import React from 'react';
import ReactDOM from 'react-dom';

const bool = 'bool';
const number = 'number';
const string = 'string';
const json = 'json';
const event = 'event';

const Types = { bool, number, string, json, event };

const mapAttributeToProp = (node, name) => node[name];

const mapEventToProp = (node, name) => {
  // accessing properties instead of attributes here
  // (autom. attribute parsing)
  const value = node[name];

  return (...origArgs) => {
    // dispatch DOM event
    const domEvent = new Event(name, { bubbles: true });
    domEvent.origArgs = origArgs; // store original arguments from handler
    node.dispatchEvent(domEvent);

    // call event handler if defined
    if (typeof value === 'function') {
      value.call(node, domEvent, ...origArgs);
    }
  };
};

const mapToProps = (node, mapping) =>
  Object.keys(mapping).reduce((props, name) => {
    const typeOrSerDes = mapping[name];
    const mapFunc = (typeOrSerDes === Types.event)
      ? mapEventToProp
      : mapAttributeToProp;
    const value = mapFunc(node, name);

    return { ...props, [name]: value };
  }, {});

const mapToPropertyDescriptor = (
  name,
  typeOrSerDes,
  onAfterSet = Function.prototype,
) => {
  if (typeOrSerDes === Types.event) {
    let eventHandler;

    return {
      get: function() {
        // return event handler assigned via propery if available
        if (typeof eventHandler !== 'undefined') return eventHandler;

        // return null if event handler attribute wasn't defined
        const value = this.getAttribute(name);
        if (value === null) return null;

        // try to return a function representation of the event handler attr.
        try {
          return new Function(value);
        } catch (err) {
          return null;
        };
      },
      set: function(value) {
        eventHandler = (typeof value === 'function') ? value : null;
        onAfterSet.call(this);
      }
    };
  } else if (typeOrSerDes === Types.bool) {
    return {
      get: function() {
        return this.hasAttribute(name);
      },
      set: function(value) {
        if (value) {
          this.setAttribute(name, '');
        } else {
          this.removeAttribute(name);
        }
        onAfterSet.call(this);
      }
    };
  } else {
    return {
      get: function() {
        const value = this.getAttribute(name);

        if (typeOrSerDes === Types.number) {
          return Number(value);
        } else if (typeOrSerDes === Types.json) {
          return JSON.parse(value);
        }

        return (typeof typeOrSerDes.deserialize === 'function')
          ? typeOrSerDes.deserialize(value)
          : value;
      },
      set: function(value) {
        const attributeValue = (() => {
          if (typeOrSerDes === Types.json) {
            return JSON.stringify(value);
          }

          return (typeof typeOrSerDes.serialize === 'function')
            ? typeOrSerDes.serialize(value)
            : value.toString();
        })();

        this.setAttribute(name, attributeValue);
        onAfterSet.call(this);
      }
    };
  }
};

const definePropertiesFor = (WebComponent, mapping, onAfterSet) => {
  Object.keys(mapping).forEach((name) => {
    const typeOrSerDes = mapping[name];

    Object.defineProperty(
      WebComponent.prototype,
      name,
      mapToPropertyDescriptor(name, typeOrSerDes, onAfterSet)
    );
  });
};

function register(ReactComponent, tagName, mapping = {}) {
  const attributeNames = Object.keys(mapping).map(name => name.toLowerCase());
  const render = function() {
    const props = mapToProps(this, mapping);

    ReactDOM.render(
      React.createElement(ReactComponent, props, <slot></slot>),
      this.shadowRoot
    );
  };

  class WebReactComponent extends HTMLElement {
    static get observedAttributes() {
      return attributeNames;
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      render.call(this);
    }

    attributeChangedCallback() {
      render.call(this);
    }

    disconnectedCallback() {
      ReactDOM.unmountComponentAtNode(this.shadowRoot);
    }
  }

  // dynamically create property getters and setters for attributes
  // and event handlers
  definePropertiesFor(WebReactComponent, mapping, render);

  return customElements.define(tagName, WebReactComponent);
}

// register is default export
export default register;

// additionally everything is exported as named export for convenience
export {
  register,
  Types,
  bool,
  number,
  string,
  json,
  event,
};

