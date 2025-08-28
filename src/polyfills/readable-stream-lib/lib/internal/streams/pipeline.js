// Mock pipeline.js - ES Module version
function pipeline(...args) {
  const callback = args[args.length - 1];
  if (typeof callback === 'function') {
    setTimeout(() => callback(null), 0);
  }
  return args[args.length - 2] || args[0];
}

export default pipeline;
