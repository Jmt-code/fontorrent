// Mock _stream_transform.js - ES Module version
import Duplex from './_stream_duplex.js';

class Transform extends Duplex {
  constructor(options = {}) {
    super(options);
    this._transform = options.transform || ((chunk, encoding, callback) => callback(null, chunk));
  }
}

export default Transform;
