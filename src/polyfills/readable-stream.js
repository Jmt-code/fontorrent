// Polyfill for readable-stream in browsers with Buffer support
class MockBuffer extends Uint8Array {
  constructor(data) {
    if (typeof data === 'number') {
      super(data);
    } else if (typeof data === 'string') {
      const encoded = new TextEncoder().encode(data);
      super(encoded);
    } else if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
      super(data);
    } else {
      super(0);
    }
  }
  
  slice(start = 0, end = this.length) {
    return new MockBuffer(super.slice(start, end));
  }
  
  toString(encoding = 'utf8') {
    if (encoding === 'utf8' || encoding === 'utf-8') {
      return new TextDecoder().decode(this);
    }
    if (encoding === 'hex') {
      return Array.from(this).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    return new TextDecoder().decode(this);
  }
  
  static from(data, encoding = 'utf8') {
    return new MockBuffer(data);
  }
  
  static alloc(size, fill = 0) {
    const buf = new MockBuffer(size);
    buf.fill(fill);
    return buf;
  }
}

// Ensure Buffer is available globally if not already
if (typeof global !== 'undefined' && !global.Buffer) {
  global.Buffer = MockBuffer;
}
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = MockBuffer;
}

export class Readable {
  constructor(options = {}) {
    this.options = options;
    this._read = options.read || (() => {});
  }
  
  read() {
    return null;
  }
  
  pipe(destination) {
    return destination;
  }
  
  on(event, callback) {
    return this;
  }
  
  emit(event, ...args) {
    return this;
  }
  
  once(event, callback) {
    return this;
  }
}

export class Writable {
  constructor(options = {}) {
    this.options = options;
    this._write = options.write || (() => {});
  }
  
  write(chunk, encoding, callback) {
    if (typeof encoding === 'function') {
      callback = encoding;
      encoding = null;
    }
    if (callback) callback();
    return true;
  }
  
  end(chunk, encoding, callback) {
    if (typeof chunk === 'function') {
      callback = chunk;
      chunk = null;
    }
    if (typeof encoding === 'function') {
      callback = encoding;
      encoding = null;
    }
    if (callback) callback();
  }
  
  on(event, callback) {
    return this;
  }
  
  emit(event, ...args) {
    return this;
  }
  
  once(event, callback) {
    return this;
  }
}

export class Transform extends Readable {
  constructor(options = {}) {
    super(options);
    this._transform = options.transform || ((chunk, encoding, callback) => callback(null, chunk));
  }
}

export class PassThrough extends Transform {
  constructor(options = {}) {
    super(options);
  }
}

export default {
  Readable,
  Writable,
  Transform,
  PassThrough
};
