// Mock end-of-stream.js - ES Module version
function finished(stream, callback) {
  if (callback) {
    setTimeout(() => callback(null), 0);
  }
  return stream;
}

export default finished;
