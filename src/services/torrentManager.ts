import WebTorrent from 'webtorrent';
import type { TorrentInfo, PeerInfo } from '../types/torrent';

export class TorrentManager {
  private client: WebTorrent.Instance;
  private onTorrentUpdate?: (torrents: TorrentInfo[]) => void;
  private onPeerUpdate?: (peers: PeerInfo[]) => void;
  private updateInterval?: number;

  // Lista blanca de trackers compatibles con navegadores (WebSocket/WebRTC)
  private static readonly WEBRTC_TRACKERS: readonly string[] = [
    'wss://tracker.openwebtorrent.com',
    'wss://tracker.webtorrent.io',
    'wss://tracker.btorrent.xyz',
    'wss://tracker.fastcast.nz'
  ];

  constructor() {
    this.client = new WebTorrent({
      // Configuración para mejor rendimiento P2P
      tracker: {
        // Usar sólo trackers WebRTC conocidos activos para el navegador
        announce: [...TorrentManager.WEBRTC_TRACKERS],
        // ICE servers para mejorar la conectividad WebRTC tras NAT/CGNAT
        rtcConfig: {
          iceServers: [
            { urls: [
              'stun:stun.l.google.com:19302',
              'stun:stun1.l.google.com:19302',
              'stun:stun2.l.google.com:19302',
              'stun:stun.cloudflare.com:3478'
            ] }
          ]
        }
      },
      dht: false, // DHT no funciona en navegadores
      webSeeds: true, // Habilitar web seeds
      utp: false // UTP no funciona en navegadores
    });
    
    this.setupEventListeners();
    this.startUpdateLoop();
  }

  private setupEventListeners() {
    this.client.on('error', (err: string | Error) => {
      console.error('WebTorrent error:', err);
    });

    this.client.on('torrent', (torrent: WebTorrent.Torrent) => {
      console.log('Torrent added:', torrent.name);
      this.setupTorrentListeners(torrent);
      this.updateTorrents();
    });
  }

  private setupTorrentListeners(torrent: WebTorrent.Torrent) {
    // Actualizar progreso cada segundo
    torrent.on('download', () => {
      this.updateTorrents();
    });

    torrent.on('upload', () => {
      this.updateTorrents();
    });

    torrent.on('done', () => {
      console.log(`✅ Torrent completado: ${torrent.name}`);
      this.updateTorrents();
      
      // Continuar como seed después de completar
      console.log(`🌱 Continuando como seed: ${torrent.name}`);
    });

    // Agregar listeners usando eventos disponibles
    (torrent as any).on('wire', (wire: any) => {
      console.log(`🔗 Nuevo peer conectado: ${wire.remoteAddress || 'WebRTC'}`);
      this.updatePeers();
      
      // Log de transferencia de datos
      try {
        wire.on('download', (bytes: number) => {
          console.log(`⬇️ Descargando ${bytes} bytes desde ${wire.remoteAddress || 'peer'}`);
        });
        
        wire.on('upload', (bytes: number) => {
          console.log(`⬆️ Subiendo ${bytes} bytes a ${wire.remoteAddress || 'peer'}`);
        });
      } catch (e) {
        // Ignorar errores de eventos no soportados
      }
    });

    (torrent as any).on('noPeers', () => {
      console.log(`❌ No hay peers para: ${torrent.name}`);
    });

    // Eventos de trackers - usando any para evitar errores de tipos
    try {
      (torrent as any).on('tracker', (announceUrl: string) => {
        console.log(`📡 Conectado al tracker: ${announceUrl}`);
      });

      // Silenciar protocolos no soportados y mejorar el mensaje de ICE
      ;(torrent as any).on('warning', (err: any) => {
        const msg = (err && (err.message || String(err))) || '';
        if (/Unsupported tracker protocol/i.test(msg)) return; // demasiado ruido y esperado en web
        if (/Failed to construct 'RTCPeerConnection'/i.test(msg)) {
          console.warn('WebRTC ICE warning:', msg);
          return;
        }
        console.warn('Torrent warning:', msg);
      });
    } catch (e) {
      // Algunos eventos pueden no estar disponibles
    }
  }

  private startUpdateLoop() {
    // Actualizar estadísticas cada 2 segundos
    this.updateInterval = window.setInterval(() => {
      this.updateTorrents();
      this.updatePeers();
    }, 2000);
  }

  private updateTorrents() {
    if (this.onTorrentUpdate) {
      const torrents = this.client.torrents.map(this.torrentToInfo.bind(this));
      this.onTorrentUpdate(torrents);
    }
  }

  private updatePeers() {
    if (this.onPeerUpdate) {
      const allPeers: PeerInfo[] = [];
      
      this.client.torrents.forEach(torrent => {
        // Peers de WebRTC (la mayoría en navegadores)
        try {
          const wires = (torrent as any).wires;
          if (wires) {
            wires.forEach((wire: any) => {
              const peerType = wire.type || (wire.remoteAddress ? 'tcp' : 'webrtc');
              allPeers.push({
                id: wire.peerId || this.generatePeerId(),
                addr: wire.remoteAddress || `webrtc-${Math.random().toString(36).substr(2, 9)}`,
                type: peerType
              });
            });
          }
        } catch (e) {
          // Ignorar errores al acceder a wires
        }
      });
      
      this.onPeerUpdate(allPeers);
    }
  }

  private generatePeerId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private torrentToInfo(torrent: WebTorrent.Torrent): TorrentInfo {
    return {
      infoHash: torrent.infoHash,
      name: torrent.name || 'Unknown',
      length: torrent.length,
      files: torrent.files.map((file: any) => ({
        name: file.name,
        length: file.length,
        downloaded: file.downloaded,
        progress: file.progress
      })),
      magnetURI: torrent.magnetURI,
      progress: torrent.progress,
      downloadSpeed: torrent.downloadSpeed,
      uploadSpeed: torrent.uploadSpeed,
      numPeers: torrent.numPeers,
      downloaded: torrent.downloaded,
      uploaded: torrent.uploaded,
      ratio: torrent.uploaded / (torrent.downloaded || 1),
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

  async addTorrent(torrentId: string | File | Buffer): Promise<TorrentInfo> {
    return new Promise((resolve, reject) => {
      console.log('🚀 Agregando torrent...', typeof torrentId === 'string' ? torrentId.substring(0, 50) + '...' : 'archivo');
      
      const torrent = this.client.add(torrentId, {
        // Configuraciones para mejor rendimiento - usando opciones válidas
        strategy: 'sequential', // Descarga secuencial para streaming
        // Forzar sólo trackers WebRTC válidos (evita UDP/HTTP warnings y anuncios inútiles)
  announce: [...TorrentManager.WEBRTC_TRACKERS]
      }, (torrent) => {
        console.log(`✅ Torrent agregado exitosamente: ${torrent.name}`);
        console.log(`📊 Tamaño: ${(torrent.length / 1024 / 1024).toFixed(2)} MB`);
        console.log(`📁 Archivos: ${torrent.files.length}`);
        
        // Asegurar sólo trackers WebRTC en la instancia del torrent
        try {
          const isWs = (u: string) => u.startsWith('wss://') || (location.protocol === 'http:' && u.startsWith('ws://'));
          const current = ((torrent as any).announce || []) as string[];
          const filtered = Array.from(new Set([
            ...TorrentManager.WEBRTC_TRACKERS,
            ...current.filter(isWs)
          ]));
          (torrent as any).announce = filtered;
        } catch (e) {
          // Ignorar si no se puede ajustar la lista de announce
        }

        resolve(this.torrentToInfo(torrent));
      });

      (torrent as any).on('error', (err: Error) => {
        console.error('❌ Error agregando torrent:', err);
        reject(err);
      });

      // Log de progreso inicial
      (torrent as any).on('metadata', () => {
        console.log(`📋 Metadatos recibidos para: ${(torrent as any).name}`);
      });

      (torrent as any).on('ready', () => {
        console.log(`🎯 Torrent listo para descargar: ${(torrent as any).name}`);
        console.log(`🔍 Buscando peers...`);
      });
    });
  }

  removeTorrent(infoHash: string) {
    const torrent = this.client.get(infoHash);
    if (torrent) {
      const torrentName = (torrent as any).name || 'Unknown';
      console.log(`🗑️ Eliminando torrent: ${torrentName}`);
      (torrent as any).destroy();
      this.updateTorrents();
    }
  }

  downloadFile(infoHash: string, fileIndex: number) {
    const torrent = this.client.get(infoHash);
    if (torrent) {
      const files = (torrent as any).files;
      if (files && files[fileIndex]) {
        const file = files[fileIndex];
        console.log(`💾 Descargando archivo: ${file.name}`);
        
        file.getBlobURL((err: Error | null, url?: string) => {
          if (err) {
            console.error('❌ Error obteniendo URL del archivo:', err);
            return;
          }
          
          if (url) {
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            a.click();
            console.log(`✅ Descarga iniciada: ${file.name}`);
          }
        });
      }
    }
  }

  createTorrent(files: FileList): Promise<ArrayBuffer> {
    return new Promise((resolve) => {
      console.log(`🔨 Creando torrent para ${files.length} archivo(s)...`);
      
      const fileArray = Array.from(files);
      
      this.client.seed(fileArray, {
  announce: [...TorrentManager.WEBRTC_TRACKERS],
        // Remover propiedades no válidas
      }, (torrent) => {
        console.log(`✅ Torrent creado: ${torrent.name}`);
        console.log(`🔗 Magnet: ${torrent.magnetURI}`);
        console.log(`🌱 Comenzando a hacer seed...`);
        
        // Convertir Buffer a ArrayBuffer de forma más segura
        const buffer = torrent.torrentFile;
        const arrayBuffer = new ArrayBuffer(buffer.length);
        const view = new Uint8Array(arrayBuffer);
        for (let i = 0; i < buffer.length; i++) {
          view[i] = buffer[i];
        }
        resolve(arrayBuffer);
      });
    });
  }

  // Método para forzar conexión a peers
  async forceAnnounce() {
    this.client.torrents.forEach(torrent => {
      console.log(`📢 Forzando anuncio para: ${torrent.name}`);
      // Forzar anuncio a trackers usando any para evitar errores de tipos
      try {
        (torrent as any).discovery?.tracker?.announce();
      } catch (e) {
        // Ignorar si no está disponible
      }
    });
  }

  // Método para obtener estadísticas detalladas
  getDetailedStats() {
    return {
      totalTorrents: this.client.torrents.length,
      totalPeers: this.client.torrents.reduce((sum, t) => sum + t.numPeers, 0),
      totalDownloadSpeed: this.client.torrents.reduce((sum, t) => sum + t.downloadSpeed, 0),
      totalUploadSpeed: this.client.torrents.reduce((sum, t) => sum + t.uploadSpeed, 0),
      totalDownloaded: this.client.torrents.reduce((sum, t) => sum + t.downloaded, 0),
      totalUploaded: this.client.torrents.reduce((sum, t) => sum + t.uploaded, 0),
    };
  }

  getTorrents(): TorrentInfo[] {
    return this.client.torrents.map(this.torrentToInfo.bind(this));
  }

  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    console.log('🛑 Cerrando cliente WebTorrent...');
    this.client.destroy();
  }
}
