// Browser polyfill for torrent-discovery

const createMockDiscovery = (opts = {}) => {
  const mockDiscovery = {
    destroyed: false,
    peerId: opts.peerId || null,
    port: opts.port || 0,
    dht: null,
    tracker: null,
    
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
            console.warn('Discovery mock event error:', e);
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
    
    updatePort(port) {
      this.port = port;
      return this;
    },
    
    announce(infoHash, port, opts = {}) {
      if (typeof port === 'object') {
        opts = port;
        port = this.port;
      }
      
      // Simulate announce - in browser, this would be handled by WebRTC trackers
      setTimeout(() => {
        this.emit('peer', {
          id: null,
          addr: '127.0.0.1:' + (port || this.port),
          from: 'tracker'
        });
      }, 0);
      
      return this;
    },
    
    stop(infoHash) {
      // No-op for browser
      return this;
    },
    
    destroy(callback) {
      if (this.destroyed) {
        if (callback) setTimeout(callback, 0);
        return this;
      }
      
      this.destroyed = true;
      this.removeAllListeners();
      
      if (callback) setTimeout(callback, 0);
      return this;
    }
  };
  
  return mockDiscovery;
};

export default class TorrentDiscovery {
  constructor(opts = {}) {
    return createMockDiscovery(opts);
  }
}
