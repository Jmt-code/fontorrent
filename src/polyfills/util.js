// Polyfill for util module in browsers
const format = (f, ...args) => {
  if (typeof f !== 'string') {
    return args.map(arg => inspect(arg)).join(' ');
  }
  
  let i = 1;
  const str = String(f).replace(/(%[sdj%])/g, (x) => {
    if (x === '%%') return x;
    if (i >= args.length) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  
  for (let x = args[i]; i < args.length; x = args[++i]) {
    if (x === null || (typeof x !== 'object' && typeof x !== 'function')) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  
  return str;
};

const inspect = (obj, options = {}) => {
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';
  if (typeof obj === 'string') return `'${obj}'`;
  if (typeof obj === 'number') return obj.toString();
  if (typeof obj === 'boolean') return obj.toString();
  if (typeof obj === 'function') return `[Function: ${obj.name || 'anonymous'}]`;
  if (obj instanceof Date) return obj.toISOString();
  if (obj instanceof Error) return obj.stack || obj.toString();
  if (Array.isArray(obj)) return `[${obj.map(x => inspect(x)).join(', ')}]`;
  
  try {
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return '[Object]';
  }
};

const inherits = (ctor, superCtor) => {
  if (ctor === undefined || ctor === null) {
    throw new TypeError('The constructor to "inherits" must not be null or undefined');
  }
  
  if (superCtor === undefined || superCtor === null) {
    throw new TypeError('The super constructor to "inherits" must not be null or undefined');
  }
  
  if (superCtor.prototype === undefined) {
    throw new TypeError('The super constructor to "inherits" must have a prototype');
  }
  
  ctor.super_ = superCtor;
  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
};

const deprecate = (fn, msg) => {
  let warned = false;
  return function deprecated(...args) {
    if (!warned) {
      console.warn(msg);
      warned = true;
    }
    return fn.apply(this, args);
  };
};

const promisify = (original) => {
  return function(...args) {
    return new Promise((resolve, reject) => {
      args.push((err, ...values) => {
        if (err) {
          reject(err);
        } else {
          resolve(values.length === 1 ? values[0] : values);
        }
      });
      original.apply(this, args);
    });
  };
};

const callbackify = (original) => {
  return function(...args) {
    const callback = args.pop();
    Promise.resolve().then(() => original.apply(this, args))
      .then(result => callback(null, result))
      .catch(err => callback(err));
  };
};

const isArray = Array.isArray;

const isDate = (d) => d instanceof Date;

const isError = (e) => e instanceof Error;

const isFunction = (f) => typeof f === 'function';

const isNull = (n) => n === null;

const isNullOrUndefined = (n) => n === null || n === undefined;

const isNumber = (n) => typeof n === 'number';

const isObject = (o) => typeof o === 'object' && o !== null;

const isPrimitive = (p) => {
  return p === null || 
         p === undefined || 
         typeof p === 'boolean' || 
         typeof p === 'number' || 
         typeof p === 'string' || 
         typeof p === 'symbol';
};

const isRegExp = (r) => r instanceof RegExp;

const isString = (s) => typeof s === 'string';

const isSymbol = (s) => typeof s === 'symbol';

const isUndefined = (u) => u === undefined;

export default {
  format,
  inspect,
  inherits,
  deprecate,
  promisify,
  callbackify,
  isArray,
  isDate,
  isError,
  isFunction,
  isNull,
  isNullOrUndefined,
  isNumber,
  isObject,
  isPrimitive,
  isRegExp,
  isString,
  isSymbol,
  isUndefined
};

export {
  format,
  inspect,
  inherits,
  deprecate,
  promisify,
  callbackify,
  isArray,
  isDate,
  isError,
  isFunction,
  isNull,
  isNullOrUndefined,
  isNumber,
  isObject,
  isPrimitive,
  isRegExp,
  isString,
  isSymbol,
  isUndefined
};
