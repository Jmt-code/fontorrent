export interface TorrentFile {
  name: string;
  length: number;
  downloaded: number;
  progress: number;
}

export interface TorrentInfo {
  infoHash: string;
  name: string;
  length: number;
  files: TorrentFile[];
  magnetURI: string;
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  numPeers: number;
  downloaded: number;
  uploaded: number;
  ratio: number;
  timeRemaining: number;
  done: boolean;
}

export interface PeerInfo {
  id: string;
  addr: string;
  type: string;
}
