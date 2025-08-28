import type { TorrentInfo, PeerInfo } from '../types/torrent';

// Simplified WebTorrent implementation for browser compatibility
declare global {
  interface Window {
    WebTorrent: any;
  }
}

export class TorrentManager {
  private client: any;
  private onTorrentUpdate?: (torrents: TorrentInfo[]) => void;
  private onPeerUpdate?: (peers: PeerInfo[]) => void;

  constructor() {
    // Dynamic import to avoid build issues
    this.initWebTorrent();
  }

  private async initWebTorrent() {
    try {
      const WebTorrent = await import('webtorrent/dist/webtorrent.min.js');
      this.client = new (WebTorrent.default || WebTorrent)();
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to initialize WebTorrent:', error);
      // Fallback to a mock client
      this.client = this.createMockClient();
    }
  }

  private createMockClient() {
    return {
      torrents: [],
      add: (torrentId: any, callback?: any) => {
        console.warn('WebTorrent not available - using mock client');
        const mockTorrent = this.createMockTorrent(torrentId);
        if (callback) callback(mockTorrent);
        return mockTorrent;
      },
      seed: (files: any, callback?: any) => {
        console.warn('WebTorrent not available - using mock client');
        const mockTorrent = this.createMockTorrent('mock');
        if (callback) callback(mockTorrent);
        return mockTorrent;
      },
      get: () => null,
      destroy: () => {},
      on: () => {},
      emit: () => {}
    };
  }

  private createMockTorrent(id: any) {
    return {
      infoHash: typeof id === 'string' ? id.substring(0, 20) : 'mock-hash',
      name: 'Mock Torrent',
      length: 1024 * 1024,
      files: [{
        name: 'mock-file.txt',
        length: 1024,
        downloaded: 0,
        progress: 0
      }],
      magnetURI: 'magnet:?xt=urn:btih:mock',
      progress: 0,
      downloadSpeed: 0,
      uploadSpeed: 0,
      numPeers: 0,
      downloaded: 0,
      uploaded: 0,
      timeRemaining: Infinity,
      done: false,
      torrentFile: new ArrayBuffer(1024),
      on: () => {},
      emit: () => {}
    };
  }

  private setupEventListeners() {
    if (!this.client) return;

    try {
      this.client.on('error', (err: any) => {
        console.error('WebTorrent error:', err);
      });

      this.client.on('torrent', (torrent: any) => {
        console.log('Torrent added:', torrent.name);
        this.updateTorrents();
        this.setupTorrentListeners(torrent);
      });
    } catch (error) {
      console.warn('Failed to setup WebTorrent event listeners:', error);
    }
  }

  private setupTorrentListeners(torrent: any) {
    try {
      torrent.on('download', () => {
        this.updateTorrents();
      });

      torrent.on('upload', () => {
        this.updateTorrents();
      });

      torrent.on('done', () => {
        console.log('Torrent finished downloading:', torrent.name);
        this.updateTorrents();
      });

      torrent.on('wire', () => {
        this.updatePeers();
      });
    } catch (error) {
      console.warn('Failed to setup torrent listeners:', error);
    }
  }

  private updateTorrents() {
    if (this.onTorrentUpdate && this.client) {
      try {
        const torrents = this.client.torrents.map((t: any) => this.torrentToInfo(t));
        this.onTorrentUpdate(torrents);
      } catch (error) {
        console.warn('Failed to update torrents:', error);
      }
    }
  }

  private updatePeers() {
    if (this.onPeerUpdate && this.client) {
      try {
        const allPeers: PeerInfo[] = [];
        this.client.torrents.forEach((torrent: any) => {
          if (torrent.wires) {
            torrent.wires.forEach((wire: any) => {
              allPeers.push({
                id: wire.peerId || 'unknown',
                addr: wire.remoteAddress || 'unknown',
                type: wire.type || 'webrtc'
              });
            });
          }
        });
        this.onPeerUpdate(allPeers);
      } catch (error) {
        console.warn('Failed to update peers:', error);
      }
    }
  }

  private torrentToInfo(torrent: any): TorrentInfo {
    try {
      return {
        infoHash: torrent.infoHash || 'unknown',
        name: torrent.name || 'Unknown',
        length: torrent.length || 0,
        files: (torrent.files || []).map((file: any) => ({
          name: file.name || 'unknown',
          length: file.length || 0,
          downloaded: file.downloaded || 0,
          progress: file.progress || 0
        })),
        magnetURI: torrent.magnetURI || '',
        progress: torrent.progress || 0,
        downloadSpeed: torrent.downloadSpeed || 0,
        uploadSpeed: torrent.uploadSpeed || 0,
        numPeers: torrent.numPeers || 0,
        downloaded: torrent.downloaded || 0,
        uploaded: torrent.uploaded || 0,
        ratio: (torrent.uploaded || 0) / (torrent.downloaded || 1),
        timeRemaining: torrent.timeRemaining || Infinity,
        done: torrent.done || false
      };
    } catch (error) {
      console.warn('Failed to convert torrent info:', error);
      return this.createMockTorrentInfo();
    }
  }

  private createMockTorrentInfo(): TorrentInfo {
    return {
      infoHash: 'mock-hash',
      name: 'Mock Torrent',
      length: 0,
      files: [],
      magnetURI: '',
      progress: 0,
      downloadSpeed: 0,
      uploadSpeed: 0,
      numPeers: 0,
      downloaded: 0,
      uploaded: 0,
      ratio: 0,
      timeRemaining: Infinity,
      done: false
    };
  }

  setOnTorrentUpdate(callback: (torrents: TorrentInfo[]) => void) {
    this.onTorrentUpdate = callback;
  }

  setOnPeerUpdate(callback: (peers: PeerInfo[]) => void) {
    this.onPeerUpdate = callback;
  }

  async addTorrent(torrentId: string | File | Buffer): Promise<TorrentInfo> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.client) {
          resolve(this.createMockTorrentInfo());
          return;
        }

        const torrent = this.client.add(torrentId, (torrent: any) => {
          resolve(this.torrentToInfo(torrent));
        });

        if (torrent && torrent.on) {
          torrent.on('error', reject);
        }
      } catch (error) {
        console.warn('Failed to add torrent:', error);
        resolve(this.createMockTorrentInfo());
      }
    });
  }

  removeTorrent(infoHash: string) {
    try {
      if (!this.client) return;
      
      const torrent = this.client.get(infoHash);
      if (torrent && torrent.destroy) {
        torrent.destroy();
        this.updateTorrents();
      }
    } catch (error) {
      console.warn('Failed to remove torrent:', error);
    }
  }

  downloadFile(infoHash: string, fileIndex: number) {
    try {
      if (!this.client) return;
      
      const torrent = this.client.get(infoHash);
      if (torrent && torrent.files && torrent.files[fileIndex]) {
        const file = torrent.files[fileIndex];
        if (file.getBlobURL) {
          file.getBlobURL((err: any, url: string) => {
            if (err) {
              console.error('Error getting blob URL:', err);
              return;
            }
            
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            a.click();
          });
        }
      }
    } catch (error) {
      console.warn('Failed to download file:', error);
    }
  }

  async createTorrent(files: FileList): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.client) {
          resolve(new ArrayBuffer(1024));
          return;
        }

        this.client.seed(files, (torrent: any) => {
          resolve(torrent.torrentFile || new ArrayBuffer(1024));
        });
      } catch (error) {
        console.warn('Failed to create torrent:', error);
        resolve(new ArrayBuffer(1024));
      }
    });
  }

  getTorrents(): TorrentInfo[] {
    try {
      if (!this.client) return [];
      return this.client.torrents.map((t: any) => this.torrentToInfo(t));
    } catch (error) {
      console.warn('Failed to get torrents:', error);
      return [];
    }
  }

  destroy() {
    try {
      if (this.client && this.client.destroy) {
        this.client.destroy();
      }
    } catch (error) {
      console.warn('Failed to destroy client:', error);
    }
  }
}
