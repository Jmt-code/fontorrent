// Mock _stream_readable.js - ES Module version
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
}

class Readable extends EventEmitter {
  constructor(options = {}) {
    super();
    this.readable = true;
    this._read = options.read || (() => {});
    this._readableState = {
      objectMode: false,
      highWaterMark: 16 * 1024,
      buffer: [],
      length: 0,
      pipes: null,
      pipesCount: 0,
      flowing: null,
      ended: false,
      endEmitted: false,
      reading: false,
      sync: true,
      needReadable: false,
      emittedReadable: false,
      readableListening: false,
      resumeScheduled: false,
      defaultEncoding: 'utf8',
      ranOut: false,
      awaitDrain: 0,
      readingMore: false,
      decoder: null,
      encoding: null
    };
  }
  
  read() {
    return null;
  }
  
  pipe(destination) {
    return destination;
  }
  
  push(chunk) {
    return true;
  }
  
  unshift(chunk) {
    return true;
  }
  
  setEncoding(encoding) {
    return this;
  }
  
  pause() {
    return this;
  }
  
  resume() {
    return this;
  }
  
  wrap(stream) {
    return this;
  }
}

export default Readable;
