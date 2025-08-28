// Browser polyfill for bittorrent-dht
// In browser environment, DHT functionality is not available

// Use a simple object instead of EventEmitter to avoid conflicts
const createMockDHT = () => {
  const mockDHT = {
    nodeId: null,
    destroyed: false,
    listening: false,
    nodes: new Map(),
    table: { nodes: [] },
    
    // EventEmitter-like methods
    _events: {},
    _maxListeners: 10,
    
    on(event, listener) {
      if (!this._events[event]) this._events[event] = [];
      this._events[event].push(listener);
      return this;
    },
    
    once(event, listener) {
      const onceWrapper = (...args) => {
        this.removeListener(event, onceWrapper);
        listener.apply(this, args);
      };
      return this.on(event, onceWrapper);
    },
    
    emit(event, ...args) {
      if (this._events[event]) {
        this._events[event].forEach(listener => {
          try {
            listener.apply(this, args);
          } catch (e) {
            console.warn('DHT mock event error:', e);
          }
        });
      }
      return this._events[event] ? this._events[event].length > 0 : false;
    },
    
    removeListener(event, listener) {
      if (this._events[event]) {
        this._events[event] = this._events[event].filter(l => l !== listener);
      }
      return this;
    },
    
    removeAllListeners(event) {
      if (event) {
        delete this._events[event];
      } else {
        this._events = {};
      }
      return this;
    },
    
    setMaxListeners(n) {
      this._maxListeners = n;
      return this;
    },
    
    getMaxListeners() {
      return this._maxListeners;
    },
    
    listeners(event) {
      return this._events[event] ? [...this._events[event]] : [];
    },
    
    listenerCount(event) {
      return this._events[event] ? this._events[event].length : 0;
    },
    
    eventNames() {
      return Object.keys(this._events);
    },
    
    listen(port, callback) {
      if (typeof port === 'function') {
        callback = port;
        port = 0;
      }
      
      setTimeout(() => {
        this.listening = true;
        if (callback) callback();
        this.emit('listening');
      }, 0);
      
      return this;
    },
    
    announce(infoHash, port, callback) {
      if (typeof port === 'function') {
        callback = port;
        port = 0;
      }
      
      // Simulate announce with no peers found
      setTimeout(() => {
        if (callback) callback(null, { peers: [] });
        this.emit('announce', infoHash, null);
      }, 0);
      
      return this;
    },
    
    lookup(infoHash, callback) {
      // Simulate lookup with no peers found
      setTimeout(() => {
        if (callback) callback(null, { peers: [] });
        this.emit('lookup', infoHash, null);
      }, 0);
      
      return this;
    },
    
    addNode(node) {
      // No-op for browser
      return this;
    },
    
    removeNode(node) {
      // No-op for browser
      return this;
    },
    
    destroy(callback) {
      if (this.destroyed) {
        if (callback) setTimeout(callback, 0);
        return this;
      }
      
      this.destroyed = true;
      this.listening = false;
      this.removeAllListeners();
      
      if (callback) setTimeout(callback, 0);
      return this;
    }
  };
  
  return mockDHT;
};

export class Client {
  constructor(opts = {}) {
    return createMockDHT();
  }
}

export { Client as default };
