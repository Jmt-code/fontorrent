import WebTorrent from 'webtorrent';
import type { TorrentInfo, PeerInfo } from '../types/torrent';

// Define interfaces for better type safety
interface TorrentWire {
  peerId?: string;
  remoteAddress?: string;
  type?: string;
}

interface ExtendedTorrent {
  wires?: TorrentWire[];
  destroy?: () => void;
  files?: TorrentFileExt[];
  [key: string]: unknown;
}

interface TorrentFileExt {
  name: string;
  length: number;
  downloaded: number;
  progress: number;
  getBlobURL: (callback: (err: Error | null, url: string | null) => void) => void;
}

export class TorrentManager {
  private client: WebTorrent.Instance;
  private onTorrentUpdate?: (torrents: TorrentInfo[]) => void;
  private onPeerUpdate?: (peers: PeerInfo[]) => void;

  constructor() {
    this.client = new WebTorrent();
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.client.on('error', (err: string | Error) => {
      console.error('WebTorrent error:', err);
    });

    this.client.on('torrent', (torrent: WebTorrent.Torrent) => {
      console.log('Torrent added:', torrent.name);
      this.updateTorrents();
      this.setupTorrentListeners(torrent);
    });
  }

  private setupTorrentListeners(torrent: WebTorrent.Torrent) {
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

    torrent.on('wire', (wire: unknown) => {
      console.log('New peer connected:', (wire as TorrentWire).remoteAddress);
      this.updatePeers();
    });

    // Note: error event may not be available in all versions
    if ('on' in torrent && typeof torrent.on === 'function') {
      try {
        (torrent as unknown as { on: (event: string, callback: (err: unknown) => void) => void }).on('error', (err: unknown) => {
          console.error('Torrent error:', err);
        });
      } catch {
        // Error event not supported
      }
    }
  }

  private updateTorrents() {
    if (this.onTorrentUpdate) {
      const torrents = this.client.torrents.map(this.torrentToInfo);
      this.onTorrentUpdate(torrents);
    }
  }

  private updatePeers() {
    if (this.onPeerUpdate) {
      const allPeers: PeerInfo[] = [];
      this.client.torrents.forEach((torrent: unknown) => {
        const extTorrent = torrent as ExtendedTorrent;
        // Note: wires property may not be available in all WebTorrent versions
        if (extTorrent.wires && Array.isArray(extTorrent.wires)) {
          extTorrent.wires.forEach((wire: TorrentWire) => {
            allPeers.push({
              id: wire.peerId || 'unknown',
              addr: wire.remoteAddress || 'unknown',
              type: wire.type || 'unknown'
            });
          });
        }
      });
      this.onPeerUpdate(allPeers);
    }
  }

  private torrentToInfo(torrent: WebTorrent.Torrent): TorrentInfo {
    return {
      infoHash: torrent.infoHash,
      name: torrent.name || 'Unknown',
      length: torrent.length,
      files: torrent.files.map((file: unknown) => {
        const f = file as TorrentFileExt;
        return {
          name: f.name,
          length: f.length,
          downloaded: f.downloaded,
          progress: f.progress
        };
      }),
      magnetURI: torrent.magnetURI,
      progress: torrent.progress,
      downloadSpeed: torrent.downloadSpeed,
      uploadSpeed: torrent.uploadSpeed,
      numPeers: torrent.numPeers,
      downloaded: torrent.downloaded,
      uploaded: torrent.uploaded,
      ratio: torrent.uploaded / torrent.downloaded || 0,
      timeRemaining: torrent.timeRemaining,
      done: torrent.done
    };
  }

  setOnTorrentUpdate(callback: (torrents: TorrentInfo[]) => void) {
    this.onTorrentUpdate = callback;
  }

  setOnPeerUpdate(callback: (peers: PeerInfo[]) => void) {
    this.onPeerUpdate = callback;
  }

  addTorrent(torrentId: string | File | Buffer): Promise<TorrentInfo> {
    return new Promise((resolve, reject) => {
      const torrent = this.client.add(torrentId, (torrent) => {
        resolve(this.torrentToInfo(torrent));
      });

      torrent.on('error', reject);
    });
  }

  removeTorrent(infoHash: string) {
    const torrent = this.client.get(infoHash);
    if (torrent && typeof torrent === 'object') {
      const extTorrent = torrent as unknown as ExtendedTorrent;
      if (extTorrent.destroy) {
        extTorrent.destroy();
        this.updateTorrents();
      }
    }
  }

  downloadFile(infoHash: string, fileIndex: number) {
    const torrent = this.client.get(infoHash);
    if (torrent && typeof torrent === 'object') {
      const extTorrent = torrent as unknown as ExtendedTorrent;
      if (extTorrent.files && extTorrent.files[fileIndex]) {
        const file = extTorrent.files[fileIndex];
        file.getBlobURL((err: Error | null, url: string | null) => {
          if (err) {
            console.error('Error getting blob URL:', err);
            return;
          }
          
          if (url) {
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            a.click();
          }
        });
      }
    }
  }

  createTorrent(files: FileList): Promise<Buffer> {
    return new Promise((resolve) => {
      this.client.seed(files, (torrent) => {
        resolve(torrent.torrentFile);
      });
    });
  }

  getTorrents(): TorrentInfo[] {
    return this.client.torrents.map(this.torrentToInfo);
  }

  destroy() {
    this.client.destroy();
  }
}
