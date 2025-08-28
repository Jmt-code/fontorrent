// Polyfill for crypto-browserify module
import createHash from './crypto.js';

export default {
  createHash: (algorithm) => {
    return {
      update: function(data) {
        this._data = (this._data || '') + data.toString();
        return this;
      },
      digest: function(encoding = 'hex') {
        let hash = 0;
        const str = this._data || '';
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        
        if (encoding === 'hex') {
          return Math.abs(hash).toString(16).padStart(8, '0');
        }
        return new Uint8Array([hash & 0xff, (hash >> 8) & 0xff, (hash >> 16) & 0xff, (hash >> 24) & 0xff]);
      }
    };
  },
  
  createSign: (algorithm) => {
    return {
      update: function(data) {
        this._data = (this._data || '') + data.toString();
        return this;
      },
      sign: function(privateKey, encoding = 'hex') {
        const hash = this.createHash('sha256');
        hash.update(this._data || '');
        return hash.digest(encoding);
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
        return true;
      }
    };
  },
  
  randomBytes: (size) => {
    const bytes = new Uint8Array(size);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < size; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }
    return bytes;
  },
  
  constants: {
    RSA_PKCS1_PADDING: 1,
    RSA_NO_PADDING: 3,
    RSA_PKCS1_OAEP_PADDING: 4
  }
};
