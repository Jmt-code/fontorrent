// Simple stream polyfill for browsers
class EventEmitter {
  constructor() {
    this._events = {};
  }
  
  on(event, listener) {
    if (!this._events[event]) {
      this._events[event] = [];
    }
    this._events[event].push(listener);
    return this;
  }
  
  emit(event, ...args) {
    if (this._events[event]) {
      this._events[event].forEach(listener => listener(...args));
    }
    return this;
  }
  
  once(event, listener) {
    const onceWrapper = (...args) => {
      listener(...args);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
    return this;
  }
  
  off(event, listener) {
    if (this._events[event]) {
      this._events[event] = this._events[event].filter(l => l !== listener);
    }
    return this;
  }
  
  removeListener(event, listener) {
    return this.off(event, listener);
  }
  
  addListener(event, listener) {
    return this.on(event, listener);
  }
}

class Stream extends EventEmitter {
  constructor() {
    super();
    this.readable = false;
    this.writable = false;
  }
  
  pipe(dest) {
    return dest;
  }
  
  unpipe() {
    return this;
  }
  
  on() {
    return this;
  }
  
  emit() {
    return this;
  }
  
  once() {
    return this;
  }
}

class Readable extends Stream {
  constructor(options = {}) {
    super();
    this.readable = true;
    this._read = options.read || (() => {});
  }
  
  read() {
    return null;
  }
  
  push(chunk) {
    return true;
  }
  
  unshift(chunk) {
    return true;
  }
  
  setEncoding() {
    return this;
  }
  
  pause() {
    return this;
  }
  
  resume() {
    return this;
  }
  
  wrap() {
    return this;
  }
}

class Writable extends Stream {
  constructor(options = {}) {
    super();
    this.writable = true;
    this._write = options.write || (() => {});
  }
  
  write(chunk, encoding, callback) {
    if (typeof encoding === 'function') {
      callback = encoding;
    }
    if (callback) setTimeout(callback, 0);
    return true;
  }
  
  end(chunk, encoding, callback) {
    if (typeof chunk === 'function') {
      callback = chunk;
    } else if (typeof encoding === 'function') {
      callback = encoding;
    }
    if (callback) setTimeout(callback, 0);
    return this;
  }
  
  destroy() {
    return this;
  }
  
  destroySoon() {
    return this;
  }
}

class Duplex extends Readable {
  constructor(options = {}) {
    super(options);
    this.writable = true;
  }
  
  write(chunk, encoding, callback) {
    if (typeof encoding === 'function') {
      callback = encoding;
    }
    if (callback) setTimeout(callback, 0);
    return true;
  }
  
  end(chunk, encoding, callback) {
    if (typeof chunk === 'function') {
      callback = chunk;
    } else if (typeof encoding === 'function') {
      callback = encoding;
    }
    if (callback) setTimeout(callback, 0);
    return this;
  }
}

class Transform extends Duplex {
  constructor(options = {}) {
    super(options);
    this._transform = options.transform || ((chunk, encoding, callback) => callback(null, chunk));
  }
}

class PassThrough extends Transform {
  constructor(options = {}) {
    super(options);
  }
}

// Mock pipeline and finished functions
const pipeline = (...args) => {
  const callback = args[args.length - 1];
  if (typeof callback === 'function') {
    setTimeout(() => callback(null), 0);
  }
  return args[args.length - 2] || args[0];
};

const finished = (stream, callback) => {
  if (callback) setTimeout(() => callback(null), 0);
  return stream;
};

export default Stream;
export { 
  Stream, 
  Readable, 
  Writable, 
  Duplex, 
  Transform, 
  PassThrough, 
  pipeline, 
  finished 
};

// Assign properties to default export for compatibility
Object.assign(Stream, {
  Readable,
  Writable,
  Duplex,
  Transform,
  PassThrough,
  pipeline,
  finished
});
