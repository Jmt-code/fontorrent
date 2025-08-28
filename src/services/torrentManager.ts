/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import WebTorrent from 'webtorrent';
import type { TorrentInfo, PeerInfo } from '../types/torrent';

export class TorrentManager {
  private client: WebTorrent.Instance;
  private onTorrentUpdate?: (torrents: TorrentInfo[]) => void;
  private onPeerUpdate?: (peers: PeerInfo[]) => void;
  private updateInterval?: number;
  private trackers: string[];
  private torrentsByHash: Map<string, WebTorrent.Torrent> = new Map();

  // Lista blanca de trackers compatibles con navegadores (WebSocket/WebRTC)
  private static readonly WEBRTC_TRACKERS: readonly string[] = [
    'wss://tracker.openwebtorrent.com',
    'wss://tracker.webtorrent.io',
    'wss://tracker.btorrent.xyz',
    'wss://tracker.fastcast.nz'
  ];
  private static readonly TRACKERS_STORAGE_KEY = 'fontorrent.trackers';

  constructor() {
    // Inicializar lista de trackers desde localStorage (si existe) o por defecto
    this.trackers = this.loadTrackers();

    this.client = new WebTorrent({
      // Configuración para mejor rendimiento P2P
      tracker: {
        // Usar sólo trackers WebRTC conocidos activos para el navegador
        announce: [...this.trackers],
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

  // Cargar trackers desde localStorage y filtrar por ws/wss
  private loadTrackers(): string[] {
    try {
      const raw = localStorage.getItem(TorrentManager.TRACKERS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return this.sanitizeTrackers(parsed);
        }
      }
    } catch {
      // ignore storage read/parse errors
    }
    return [...TorrentManager.WEBRTC_TRACKERS];
  }

  // Guardar trackers en localStorage
  private persistTrackers(list: string[]) {
    try {
      localStorage.setItem(TorrentManager.TRACKERS_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore storage write errors
    }
  }

  // Asegura wss/ws y formato válido, únicos
  private sanitizeTrackers(list: string[]): string[] {
    const isWs = (u: string) => typeof u === 'string' && (u.startsWith('wss://') || u.startsWith('ws://'));
    const cleaned = list.map(s => s.trim()).filter(isWs);
    return Array.from(new Set(cleaned));
  }

  private setupEventListeners() {
    this.client.on('error', (err: string | Error) => {
      console.error('WebTorrent error:', err);
    });

    this.client.on('torrent', (torrent: WebTorrent.Torrent) => {
      console.log('Torrent added:', torrent.name);
      // Guardar referencia por infoHash cuando esté disponible
      if ((torrent as any).infoHash) {
        this.torrentsByHash.set((torrent as any).infoHash, torrent);
      } else {
        try { (torrent as any).once?.('metadata', () => {
          if ((torrent as any).infoHash) this.torrentsByHash.set((torrent as any).infoHash, torrent);
  }); } catch { /* ignore */ }
      }
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
  announce: [...this.trackers]
  }, (torrent) => {
        console.log(`✅ Torrent agregado exitosamente: ${torrent.name}`);
        // Registrar en el mapa por infoHash (si aún no, esperar metadata)
        if ((torrent as any).infoHash) {
          this.torrentsByHash.set((torrent as any).infoHash, torrent);
        } else {
          try { (torrent as any).once?.('metadata', () => {
            if ((torrent as any).infoHash) this.torrentsByHash.set((torrent as any).infoHash, torrent);
          }); } catch { /* ignore */ }
        }
        console.log(`📊 Tamaño: ${(torrent.length / 1024 / 1024).toFixed(2)} MB`);
        console.log(`📁 Archivos: ${torrent.files.length}`);
        
        // Asegurar sólo trackers WebRTC en la instancia del torrent
        try {
          const current = ((torrent as any).announce || []) as string[];
          const filtered = this.sanitizeTrackers([...this.trackers, ...current]);
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
    if (!torrent) return;

    const torrentName = (torrent as any).name || 'Unknown';
    console.log(`🗑️ Eliminando torrent: ${torrentName}`);

    try {
      // Preferir API de cliente para asegurar limpieza interna
      (this.client as any).remove?.(infoHash, (err: unknown) => {
        if (err) {
          console.warn('Fallo al remover vía client.remove, usando destroy():', err);
          try { (torrent as any).destroy?.(); } catch { /* ignore destroy errors */ }
        }
        this.updateTorrents();
        this.updatePeers();
      });
    } catch (e) {
      // Fallback por si client.remove no existe en el tipo
      try { (torrent as any).destroy?.(); } catch { /* ignore destroy errors */ }
      this.updateTorrents();
      this.updatePeers();
    }
  // Limpiar mapa
  try { this.torrentsByHash.delete(infoHash); } catch { /* ignore */ }
  }

  downloadFile(infoHash: string, fileIndex: number) {
    const torrent = this.client.get(infoHash);
    if (torrent) {
      const files = (torrent as any).files;
      if (files && files[fileIndex]) {
        const file = files[fileIndex];
        console.log(`💾 Descargando archivo: ${file.name}`);
        // Usar Blob directo para mejorar compatibilidad con descargas
        file.getBlob((err: Error | null, blob?: Blob) => {
          if (err || !blob) {
            console.error('❌ Error obteniendo Blob del archivo:', err);
            return;
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 0);
          console.log(`✅ Descarga iniciada: ${file.name}`);
        });
      }
    }
  }

  // Guardar todos los archivos de un torrent en una carpeta elegida por el usuario (File System Access API)
  async saveTorrentToFolder(
    infoHash: string,
    onProgress?: (u: { percent: number; file?: string }) => void
  ): Promise<boolean> {
    // Diagnóstico: estado del cliente/torrrents
    try {
      console.debug('saveTorrentToFolder: estado cliente', {
        requested: infoHash,
        totalTorrents: this.client.torrents.length,
        list: this.client.torrents.map(t => ({ ih: (t as any).infoHash, name: (t as any).name, filesLen: (t as any).files ? (t as any).files.length : 'n/a' }))
      });
  } catch { /* ignore debug log errors */ }

    const torrent = this.torrentsByHash.get(infoHash)
      || this.client.get(infoHash)
      || this.client.torrents.find(t => (t.infoHash || '').toLowerCase() === infoHash.toLowerCase())
      || this.client.torrents.find(t => Array.isArray((t as any).files) && (t as any).files.length > 0)
      || (this.client.torrents.length > 0 ? this.client.torrents[0] : undefined);

    if (!torrent) return false;

    console.debug('saveTorrentToFolder: usando torrent', {
      requested: infoHash,
      chosen: (torrent as any).infoHash,
      name: (torrent as any).name,
      filesLen: (torrent as any).files ? (torrent as any).files.length : 'n/a'
    });
    if (!(torrent as any).infoHash || !(torrent as any).name) {
      console.debug('saveTorrentToFolder: torrent seleccionado sin metadatos básicos');
    }

    // Comprobar disponibilidad de la API
    const canPickDir = typeof (window as any).showDirectoryPicker === 'function';
    if (!canPickDir) {
      console.warn('File System Access API no disponible en este navegador/entorno.');
      return false;
    }

    try {
  const dirHandle = await (window as any).showDirectoryPicker();

      // Asegurar que la lista de archivos esté disponible (esperar metadatos/ready si hace falta)
  const getFiles = async (): Promise<any[]> => {
        const direct = (torrent as any).files as any[] | undefined;
        if (direct && typeof (direct as any).length === 'number' && direct.length > 0) return direct;

        await new Promise<void>((resolve) => {
          let resolved = false;
          const finish = () => { if (!resolved) { resolved = true; resolve(); } };
          try { (torrent as any).once?.('ready', finish); } catch { /* ignore */ }
          try { (torrent as any).once?.('metadata', finish); } catch { /* ignore */ }
          // Poll cada 500ms hasta 30s o files.length > 0
          let checks = 0;
          const iv = setInterval(() => {
            const f = (torrent as any).files as any[] | undefined;
            const hasFiles = !!(f && typeof (f as any).length === 'number' && f.length > 0);
            const isReady = (torrent as any).ready === true || (torrent as any).done === true;
            if (hasFiles || isReady || checks++ > 60) {
              clearInterval(iv);
              finish();
            }
          }, 500);
          setTimeout(() => { if (!resolved) finish(); }, 31000);
        });

        const finalFiles = (torrent as any).files as any[] | undefined;
        if (!finalFiles || finalFiles.length === 0) {
          console.debug('saveTorrentToFolder: aún sin files tras espera', {
            ready: (torrent as any).ready,
            done: (torrent as any).done,
            length: (torrent as any).length,
            name: (torrent as any).name
          });
          return [];
        }
        return finalFiles;
      };

      const filesList = await getFiles();
      if (!filesList.length) {
        const state = {
          ready: (torrent as any).ready,
          done: (torrent as any).done,
          length: (torrent as any).length,
          name: (torrent as any).name,
          filesLen: (torrent as any).files ? (torrent as any).files.length : 0
        };
        console.warn('No hay archivos disponibles para guardar (metadatos no cargados o torrent vacío)', state);
        return false;
      }

      // Calcular tamaño total para progreso global
      const totalBytes: number = filesList.reduce((acc, f) => acc + (Number((f as any).length) || 0), 0);
      let writtenTotal = 0;
      const emit = (file?: string) => {
        if (!onProgress) return;
        const percent = totalBytes > 0 ? Math.min(100, Math.round((writtenTotal / totalBytes) * 100)) : 0;
        onProgress({ percent, file });
      };
      emit();

      // Helper para crear subcarpetas según la ruta del archivo dentro del torrent
      const ensurePath = async (base: any, pathStr: string) => {
        const parts = pathStr.split('/').filter(Boolean);
        let parent = base;
        while (parts.length > 1) {
          const dirName = parts.shift()!;
          parent = await parent.getDirectoryHandle(dirName, { create: true });
        }
        const fileName = parts.length ? parts[0] : pathStr;
        const handle = await parent.getFileHandle(fileName, { create: true });
        return handle;
      };

  for (const f of filesList as any[]) {
        const rawPath: string = (f as any).path || (f as any).name;
        const fullPath = rawPath.replace(/\\/g, '/');
        const fileHandle = await ensurePath(dirHandle, fullPath);
        const writable = await (fileHandle as any).createWritable();

        try {
          // Estrategia segura: escribir el Blob completo
          const fileObj: any = f;
          if (typeof fileObj.getBlob === 'function') {
            const blob: Blob = await new Promise((res, rej) => fileObj.getBlob((err: Error | null, b?: Blob) => err ? rej(err) : res(b!)));
            await (writable as any).write(blob);
            await (writable as any).close();
            writtenTotal += blob.size;
            emit(fullPath);
          } else if (typeof fileObj.stream === 'function') {
            // Fallback: stream si no hay getBlob
            const readable: any = fileObj.stream();
            if (readable && typeof readable.getReader === 'function') {
              const reader = readable.getReader();
              while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                if (value) {
                  await (writable as any).write(value);
                  writtenTotal += value.byteLength;
                  emit(fullPath);
                }
              }
              await (writable as any).close();
            } else {
              throw new Error('No se pudo obtener Blob ni un ReadableStream válido');
            }
          } else {
            throw new Error('No se pudo obtener stream ni blob del archivo');
          }
          console.log(`💾 Guardado: ${fullPath}`);
        } catch (err) {
          try { await (writable as any).close(); } catch { /* ignore close errors */ }
          console.warn(`No se pudo guardar ${fullPath}:`, err);
        }
      }
  // 100% al finalizar
  emit();
  return true;
    } catch (error) {
      console.warn('Guardado cancelado o fallido:', error);
  return false;
    }
  }

  createTorrent(files: FileList): Promise<ArrayBuffer> {
    return new Promise((resolve) => {
      console.log(`🔨 Creando torrent para ${files.length} archivo(s)...`);
      
      const fileArray = Array.from(files);
      
      this.client.seed(fileArray, {
  announce: [...this.trackers],
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

  // Obtener/Actualizar lista de trackers (persistente)
  getTrackers(): string[] {
    return [...this.trackers];
  }

  setCustomTrackers(list: string[]) {
    const cleaned = this.sanitizeTrackers(list);
    if (cleaned.length === 0) return;
    this.trackers = cleaned;
    this.persistTrackers(cleaned);

    // Actualizar announce de torrents existentes y reanunciar
    this.client.torrents.forEach(t => {
      try {
        const current = ((t as any).announce || []) as string[];
        (t as any).announce = this.sanitizeTrackers([...cleaned, ...current]);
        (t as any).discovery?.tracker?.announce?.();
  } catch { /* ignore per-torrent tracker update errors */ }
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
