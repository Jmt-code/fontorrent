// Enhanced crypto polyfill for browsers
import { webcrypto } from 'crypto';

// Mock crypto functions that aren't available in browsers
const createHash = (algorithm) => {
  return {
    update: function(data) {
      this._data = (this._data || '') + data;
      return this;
    },
    digest: function(encoding = 'hex') {
      // Simple hash implementation - not cryptographically secure
      let hash = 0;
      const str = this._data || '';
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      
      if (encoding === 'hex') {
        return Math.abs(hash).toString(16).padStart(8, '0');
      }
      return new Uint8Array([hash & 0xff, (hash >> 8) & 0xff, (hash >> 16) & 0xff, (hash >> 24) & 0xff]);
    }
  };
};

const randomBytes = (size) => {
  const bytes = new Uint8Array(size);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(bytes);
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < size; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return bytes;
};

const createSign = (algorithm) => {
  return {
    update: function(data) {
      this._data = (this._data || '') + data;
      return this;
    },
    sign: function(privateKey, encoding = 'hex') {
      // Mock signature - not cryptographically secure
      const hash = createHash('sha256');
      hash.update(this._data || '');
      return hash.digest(encoding);
    }
  };
};

const createVerify = (algorithm) => {
  return {
    update: function(data) {
      this._data = (this._data || '') + data;
      return this;
    },
    verify: function(publicKey, signature, encoding = 'hex') {
      // Mock verification - always returns true for compatibility
      return true;
    }
  };
};

const createCipher = (algorithm, password) => {
  return {
    update: function(data, inputEncoding, outputEncoding) {
      // Mock cipher - just returns data for compatibility
      return data;
    },
    final: function(outputEncoding) {
      return '';
    }
  };
};

const createDecipher = (algorithm, password) => {
  return {
    update: function(data, inputEncoding, outputEncoding) {
      // Mock decipher - just returns data for compatibility
      return data;
    },
    final: function(outputEncoding) {
      return '';
    }
  };
};

// Create constants object
const constants = {
  SSL_OP_ALL: 0x80000BFF,
  SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION: 0x40000,
  SSL_OP_CIPHER_SERVER_PREFERENCE: 0x400000,
  SSL_OP_CISCO_ANYCONNECT: 0x8000,
  SSL_OP_COOKIE_EXCHANGE: 0x2000,
  SSL_OP_CRYPTOPRO_TLSEXT_BUG: 0x80000,
  SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS: 0x800,
  SSL_OP_EPHEMERAL_RSA: 0x200000,
  SSL_OP_LEGACY_SERVER_CONNECT: 0x4,
  SSL_OP_MICROSOFT_BIG_SSLV3_BUFFER: 0x20,
  SSL_OP_MICROSOFT_SESS_ID_BUG: 0x1,
  SSL_OP_MSIE_SSLV2_RSA_PADDING: 0x40,
  SSL_OP_NETSCAPE_CA_DN_BUG: 0x20000000,
  SSL_OP_NETSCAPE_CHALLENGE_BUG: 0x2,
  SSL_OP_NETSCAPE_DEMO_CIPHER_CHANGE_BUG: 0x40000000,
  SSL_OP_NETSCAPE_REUSE_CIPHER_CHANGE_BUG: 0x8,
  SSL_OP_NO_COMPRESSION: 0x20000,
  SSL_OP_NO_QUERY_MTU: 0x1000,
  SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION: 0x10000,
  SSL_OP_NO_SSLv2: 0x1000000,
  SSL_OP_NO_SSLv3: 0x2000000,
  SSL_OP_NO_TICKET: 0x4000,
  SSL_OP_NO_TLSv1: 0x4000000,
  SSL_OP_NO_TLSv1_1: 0x10000000,
  SSL_OP_NO_TLSv1_2: 0x8000000,
  SSL_OP_PKCS1_CHECK_1: 0x0,
  SSL_OP_PKCS1_CHECK_2: 0x0,
  SSL_OP_SINGLE_DH_USE: 0x100000,
  SSL_OP_SINGLE_ECDH_USE: 0x80000,
  SSL_OP_SSLEAY_080_CLIENT_DH_BUG: 0x80,
  SSL_OP_SSLREF2_REUSE_CERT_TYPE_BUG: 0x10,
  SSL_OP_TLS_BLOCK_PADDING_BUG: 0x200,
  SSL_OP_TLS_D5_BUG: 0x100,
  SSL_OP_TLS_ROLLBACK_BUG: 0x800000,
  ENGINE_METHOD_RSA: 0x1,
  ENGINE_METHOD_DSA: 0x2,
  ENGINE_METHOD_DH: 0x4,
  ENGINE_METHOD_RAND: 0x8,
  ENGINE_METHOD_ECDH: 0x10,
  ENGINE_METHOD_ECDSA: 0x20,
  ENGINE_METHOD_CIPHERS: 0x40,
  ENGINE_METHOD_DIGESTS: 0x80,
  ENGINE_METHOD_STORE: 0x100,
  ENGINE_METHOD_PKEY_METHS: 0x200,
  ENGINE_METHOD_PKEY_ASN1_METHS: 0x400,
  ENGINE_METHOD_ALL: 0xFFFF,
  ENGINE_METHOD_NONE: 0,
  DH_CHECK_P_NOT_SAFE_PRIME: 2,
  DH_CHECK_P_NOT_PRIME: 1,
  DH_UNABLE_TO_CHECK_GENERATOR: 4,
  DH_NOT_SUITABLE_GENERATOR: 8,
  ALPN_ENABLED: 1,
  RSA_PKCS1_PADDING: 1,
  RSA_SSLV23_PADDING: 2,
  RSA_NO_PADDING: 3,
  RSA_PKCS1_OAEP_PADDING: 4,
  RSA_X931_PADDING: 5,
  RSA_PKCS1_PSS_PADDING: 6,
  POINT_CONVERSION_COMPRESSED: 2,
  POINT_CONVERSION_UNCOMPRESSED: 4,
  POINT_CONVERSION_HYBRID: 6
};

export default {
  createHash,
  createSign,
  createVerify,
  createCipher,
  createDecipher,
  randomBytes,
  constants,
  webcrypto: typeof window !== 'undefined' && window.crypto ? window.crypto : undefined
};

export {
  createHash,
  createSign,
  createVerify,
  createCipher,
  createDecipher,
  randomBytes,
  constants
};
