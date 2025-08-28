// Buffer polyfill to ensure it's available globally

// Create a proper Buffer implementation
class BufferPolyfill extends Uint8Array {
  constructor(data, encoding = 'utf8') {
    if (typeof data === 'number') {
      super(data);
    } else if (typeof data === 'string') {
      if (encoding === 'hex') {
        const bytes = [];
        for (let i = 0; i < data.length; i += 2) {
          bytes.push(parseInt(data.substr(i, 2), 16));
        }
        super(bytes);
      } else if (encoding === 'base64') {
        const decoded = atob(data);
        const bytes = new Uint8Array(decoded.length);
        for (let i = 0; i < decoded.length; i++) {
          bytes[i] = decoded.charCodeAt(i);
        }
        super(bytes);
      } else {
        // Default to UTF-8
        const encoded = new TextEncoder().encode(data);
        super(encoded);
      }
    } else if (data instanceof ArrayBuffer || data instanceof Uint8Array || Array.isArray(data)) {
      super(data);
    } else {
      super(0);
    }
  }
  
  slice(start = 0, end = this.length) {
    const sliced = Uint8Array.prototype.slice.call(this, start, end);
    return new BufferPolyfill(sliced);
  }
  
  toString(encoding = 'utf8') {
    if (encoding === 'utf8' || encoding === 'utf-8') {
      return new TextDecoder().decode(this);
    }
    if (encoding === 'hex') {
      return Array.from(this).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    if (encoding === 'base64') {
      const chars = String.fromCharCode(...this);
      return btoa(chars);
    }
    return new TextDecoder().decode(this);
  }
  
  static from(data, encoding = 'utf8') {
    return new BufferPolyfill(data, encoding);
  }
  
  static alloc(size, fill = 0) {
    const buf = new BufferPolyfill(size);
    buf.fill(fill);
    return buf;
  }
  
  static allocUnsafe(size) {
    return new BufferPolyfill(size);
  }
  
  static isBuffer(obj) {
    return obj instanceof BufferPolyfill || obj instanceof Uint8Array;
  }
  
  static concat(list, totalLength) {
    if (!Array.isArray(list)) return new BufferPolyfill(0);
    
    const length = totalLength !== undefined ? totalLength : list.reduce((acc, buf) => acc + buf.length, 0);
    const result = new BufferPolyfill(length);
    let offset = 0;
    
    for (const buf of list) {
      if (offset >= length) break;
      result.set(buf.slice(0, length - offset), offset);
      offset += buf.length;
    }
    
    return result;
  }
}

// Make Buffer available globally in all contexts
const makeGlobal = (target, name = 'Buffer') => {
  if (target && !target[name]) {
    target[name] = BufferPolyfill;
  }
};

// Set Buffer in all possible global contexts
makeGlobal(globalThis);
makeGlobal(global);

if (typeof window !== 'undefined') {
  makeGlobal(window);
}

if (typeof self !== 'undefined') {
  makeGlobal(self);
}

// ES module export
export default BufferPolyfill;
export { BufferPolyfill as Buffer };
