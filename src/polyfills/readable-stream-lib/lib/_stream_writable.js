// Mock _stream_writable.js with proper Buffer handling - ES Module version
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
}

class Writable extends EventEmitter {
  constructor(options = {}) {
    super();
    this.writable = true;
    this._write = options.write || (() => {});
    this._writableState = {
      objectMode: false,
      highWaterMark: 16 * 1024,
      buffer: [],
      length: 0,
      writing: false,
      corked: 0,
      sync: true,
      bufferProcessing: false,
      needDrain: false,
      ending: false,
      ended: false,
      finished: false,
      destroyed: false,
      decodeStrings: true,
      defaultEncoding: 'utf8',
      bufferedRequest: null,
      bufferedRequestCount: 0,
      pending: false,
      bufferedIndex: 0,
      pendingcb: 0,
      constructed: true,
      writev: null
    };
  }
  
  write(chunk, encoding, callback) {
    // Ensure chunk has proper methods
    if (chunk && typeof chunk.slice !== 'function' && chunk.constructor && chunk.constructor.name === 'Uint8Array') {
      // Add slice method if missing
      chunk.slice = function(start = 0, end = this.length) {
        return new this.constructor(Array.prototype.slice.call(this, start, end));
      };
    }
    
    if (typeof encoding === 'function') {
      callback = encoding;
      encoding = null;
    }
    if (callback) setTimeout(callback, 0);
    return true;
  }
  
  end(chunk, encoding, callback) {
    if (typeof chunk === 'function') {
      callback = chunk;
      chunk = null;
    } else if (typeof encoding === 'function') {
      callback = encoding;
      encoding = null;
    }
    if (callback) setTimeout(callback, 0);
    return this;
  }
  
  destroy() {
    return this;
  }
  
  cork() {
    this._writableState.corked++;
  }
  
  uncork() {
    if (this._writableState.corked > 0) {
      this._writableState.corked--;
    }
  }
}

export default Writable;
