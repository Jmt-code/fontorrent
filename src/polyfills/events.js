// EventEmitter polyfill for browsers
class EventEmitter {
  constructor() {
    this._events = {};
    this._maxListeners = 10;
  }
  
  setMaxListeners(n) {
    this._maxListeners = n;
    return this;
  }
  
  getMaxListeners() {
    return this._maxListeners;
  }
  
  on(event, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function');
    }
    
    if (!this._events[event]) {
      this._events[event] = [];
    }
    
    this._events[event].push(listener);
    
    // Check for memory leak warning
    if (this._events[event].length > this._maxListeners) {
      console.warn(`MaxListenersExceededWarning: Possible EventEmitter memory leak detected. ${this._events[event].length} ${event} listeners added.`);
    }
    
    return this;
  }
  
  addListener(event, listener) {
    return this.on(event, listener);
  }
  
  once(event, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function');
    }
    
    const onceWrapper = (...args) => {
      listener.apply(this, args);
      this.removeListener(event, onceWrapper);
    };
    
    onceWrapper.listener = listener;
    this.on(event, onceWrapper);
    return this;
  }
  
  removeListener(event, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function');
    }
    
    if (!this._events[event]) {
      return this;
    }
    
    const listeners = this._events[event];
    for (let i = listeners.length - 1; i >= 0; i--) {
      if (listeners[i] === listener || listeners[i].listener === listener) {
        listeners.splice(i, 1);
        break;
      }
    }
    
    if (listeners.length === 0) {
      delete this._events[event];
    }
    
    return this;
  }
  
  off(event, listener) {
    return this.removeListener(event, listener);
  }
  
  removeAllListeners(event) {
    if (event) {
      delete this._events[event];
    } else {
      this._events = {};
    }
    return this;
  }
  
  listeners(event) {
    return this._events[event] ? [...this._events[event]] : [];
  }
  
  listenerCount(event) {
    return this._events[event] ? this._events[event].length : 0;
  }
  
  eventNames() {
    return Object.keys(this._events);
  }
  
  emit(event, ...args) {
    if (!this._events[event]) {
      return false;
    }
    
    const listeners = [...this._events[event]];
    
    for (const listener of listeners) {
      try {
        listener.apply(this, args);
      } catch (error) {
        // In Node.js, this would emit an 'error' event, but for simplicity we'll just log
        console.error('EventEmitter error:', error);
      }
    }
    
    return true;
  }
  
  prependListener(event, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function');
    }
    
    if (!this._events[event]) {
      this._events[event] = [];
    }
    
    this._events[event].unshift(listener);
    return this;
  }
  
  prependOnceListener(event, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function');
    }
    
    const onceWrapper = (...args) => {
      listener.apply(this, args);
      this.removeListener(event, onceWrapper);
    };
    
    onceWrapper.listener = listener;
    this.prependListener(event, onceWrapper);
    return this;
  }
}

export default EventEmitter;
export { EventEmitter };
