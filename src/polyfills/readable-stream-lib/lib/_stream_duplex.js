// Mock _stream_duplex.js - ES Module version
import Readable from './_stream_readable.js';

class Duplex extends Readable {
  constructor(options = {}) {
    super(options);
    this.writable = true;
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
      finished: false
    };
  }
  
  write(chunk, encoding, callback) {
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
    } else if (typeof encoding === 'function') {
      callback = encoding;
    }
    if (callback) setTimeout(callback, 0);
    return this;
  }
}

export default Duplex;
