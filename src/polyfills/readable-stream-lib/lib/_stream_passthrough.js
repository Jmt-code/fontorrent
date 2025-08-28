// Mock _stream_passthrough.js - ES Module version
import Transform from './_stream_transform.js';

class PassThrough extends Transform {
  constructor(options = {}) {
    super(options);
  }
}

export default PassThrough;
