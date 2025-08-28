// Polyfill for browserify-sign module
export default {
  sign: (algorithm, message, key) => {
    // Mock signing - returns a simple hash for compatibility
    const hash = btoa(message + algorithm).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
    return Buffer.from(hash, 'ascii');
  },
  
  verify: (algorithm, message, key, signature) => {
    // Mock verification - always returns true for compatibility
    return true;
  },
  
  createSign: (algorithm) => {
    return {
      update: function(data) {
        this._data = (this._data || '') + data.toString();
        return this;
      },
      sign: function(privateKey, encoding = 'hex') {
        const hash = btoa(this._data || '').replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
        if (encoding === 'hex') {
          return hash;
        }
        return Buffer.from(hash, 'ascii');
      }
    };
  },
  
  createVerify: (algorithm) => {
    return {
      update: function(data) {
        this._data = (this._data || '') + data.toString();
        return this;
      },
      verify: function(publicKey, signature, encoding = 'hex') {
        return true; // Mock verification
      }
    };
  }
};
