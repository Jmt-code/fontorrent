// Main index.js for readable-stream polyfill - ES Module version
export { default as Readable } from './lib/_stream_readable.js';
export { default as Writable } from './lib/_stream_writable.js';
export { default as Duplex } from './lib/_stream_duplex.js';
export { default as Transform } from './lib/_stream_transform.js';
export { default as PassThrough } from './lib/_stream_passthrough.js';

import Readable from './lib/_stream_readable.js';
import Writable from './lib/_stream_writable.js';
import Duplex from './lib/_stream_duplex.js';
import Transform from './lib/_stream_transform.js';
import PassThrough from './lib/_stream_passthrough.js';

export default {
  Readable,
  Writable,
  Duplex,
  Transform,
  PassThrough
};
