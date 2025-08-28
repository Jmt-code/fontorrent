import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Polyfills completos para evitar conflictos
      include: ['buffer', 'process', 'events', 'path', 'crypto', 'util', 'os', 'fs', 'stream'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    })
  ],
  base: '/fontorrent/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  optimizeDeps: {
    // Don't prebundle webtorrent so we can alias to the UMD browser build
    exclude: ['webtorrent', 'bittorrent-dht', 'torrent-discovery', 'browserify-sign', 'crypto-browserify']
  },
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  // Buffer global lo aporta el polyfill/plugin; evitar claves inválidas en define
  // (no usar 'typeof Buffer' en esbuild define)
  },
  resolve: {
    alias: {
      'bittorrent-dht': path.resolve(__dirname, 'src/polyfills/bittorrent-dht.js'),
  'torrent-discovery': path.resolve(__dirname, 'src/polyfills/torrent-discovery.js'),
  // Use WebTorrent browser UMD build to avoid Node-specific requires
  'webtorrent': 'webtorrent/dist/webtorrent.min.js',
  // Force ES module polyfills for readable-stream to avoid CommonJS `require`
  'readable-stream': path.resolve(__dirname, 'src/polyfills/readable-stream-lib/index.js'),
  'readable-stream/readable.js': path.resolve(__dirname, 'src/polyfills/readable-stream-lib/lib/_stream_readable.js'),
  'readable-stream/writable.js': path.resolve(__dirname, 'src/polyfills/readable-stream-lib/lib/_stream_writable.js'),
  'readable-stream/duplex.js': path.resolve(__dirname, 'src/polyfills/readable-stream-lib/lib/_stream_duplex.js'),
  'readable-stream/transform.js': path.resolve(__dirname, 'src/polyfills/readable-stream-lib/lib/_stream_transform.js'),
  'readable-stream/passthrough.js': path.resolve(__dirname, 'src/polyfills/readable-stream-lib/lib/_stream_passthrough.js'),
  'readable-stream/readable-browser.js': path.resolve(__dirname, 'src/polyfills/readable-stream-lib/readable-browser.js'),
  // Force our ESM polyfills for Node core modules to avoid CJS shims that call `require`
  stream: path.resolve(__dirname, 'src/polyfills/stream-browserify.js'),
  events: path.resolve(__dirname, 'src/polyfills/events.js'),
  path: path.resolve(__dirname, 'src/polyfills/path.js'),
  util: path.resolve(__dirname, 'src/polyfills/util.js'),
  crypto: path.resolve(__dirname, 'src/polyfills/crypto.js'),
  'browserify-sign': path.resolve(__dirname, 'src/polyfills/browserify-sign.js'),
  'crypto-browserify': path.resolve(__dirname, 'src/polyfills/crypto-browserify.js'),
    }
  }
})
