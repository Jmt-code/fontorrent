import { useState, useEffect, useRef } from 'react';
import { TorrentDropzone } from './components/TorrentDropzone';
import { TorrentList } from './components/TorrentList';
import { PeerList } from './components/PeerList';
import { TorrentManager } from './services/torrentManager';
import type { TorrentInfo, PeerInfo } from './types/torrent';
import { Download } from 'lucide-react';
import { TrackersSettings } from './components/TrackersSettings';

function App() {
  const [torrents, setTorrents] = useState<TorrentInfo[]>([]);
  const [peers, setPeers] = useState<PeerInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const torrentManagerRef = useRef<TorrentManager | null>(null);
  const [trackers, setTrackers] = useState<string[]>([]);
  const [saving, setSaving] = useState<{ active: boolean; percent: number; file?: string; } | null>(null);

  useEffect(() => {
    // Initialize TorrentManager
  torrentManagerRef.current = new TorrentManager();
    
    torrentManagerRef.current.setOnTorrentUpdate(setTorrents);
    torrentManagerRef.current.setOnPeerUpdate(setPeers);
  setTrackers(torrentManagerRef.current.getTrackers());

    return () => {
      if (torrentManagerRef.current) {
        torrentManagerRef.current.destroy();
      }
    };
  }, []);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleTorrentFile = async (file: File) => {
    if (!torrentManagerRef.current) return;
    
    setIsLoading(true);
    try {
      await torrentManagerRef.current.addTorrent(file);
      showNotification(`Torrent "${file.name}" agregado exitosamente`);
    } catch (error) {
      console.error('Error adding torrent:', error);
      showNotification('Error al agregar el torrent');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagnetLink = async (magnetUri: string) => {
    if (!torrentManagerRef.current) return;
    
    setIsLoading(true);
    try {
  await torrentManagerRef.current.addTorrent(magnetUri);
  showNotification('Torrent agregado desde enlace magnet/URL');
    } catch (error) {
      console.error('Error adding magnet link:', error);
  showNotification('Error al agregar el enlace');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTorrent = async (files: FileList) => {
    if (!torrentManagerRef.current) return;
    
    setIsLoading(true);
    try {
      const torrentBuffer = await torrentManagerRef.current.createTorrent(files);
      
      // Download the .torrent file
      const blob = new Blob([torrentBuffer], { type: 'application/x-bittorrent' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${files[0].name}.torrent`;
      a.click();
      URL.revokeObjectURL(url);
      
      showNotification(`Torrent creado para ${files.length} archivo(s)`);
    } catch (error) {
      console.error('Error creating torrent:', error);
      showNotification('Error al crear el torrent');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTorrent = (infoHash: string) => {
    if (!torrentManagerRef.current) return;
    
    torrentManagerRef.current.removeTorrent(infoHash);
    showNotification('Torrent eliminado');
  };

  const handleDownloadFile = (infoHash: string, fileIndex: number) => {
    if (!torrentManagerRef.current) return;
    
    torrentManagerRef.current.downloadFile(infoHash, fileIndex);
  };

  const handleSaveTorrent = async (infoHash: string) => {
    if (!torrentManagerRef.current) return;
    setSaving({ active: true, percent: 0 });
    showNotification('Guardando archivos...');
    const ok = await torrentManagerRef.current.saveTorrentToFolder(infoHash, ({ percent, file }) => {
      setSaving({ active: true, percent, file });
    });
    setSaving({ active: false, percent: 100 });
    if (ok) {
      showNotification('Guardado completado');
    } else {
      showNotification('No se pudo guardar. Inténtalo de nuevo cuando el torrent esté listo.');
    }
  };

  const handleSaveTrackers = (list: string[]) => {
    if (!torrentManagerRef.current) return;
    torrentManagerRef.current.setCustomTrackers(list);
    setTrackers(torrentManagerRef.current.getTrackers());
    showNotification('Trackers actualizados');
  };

  const handleForceAnnounce = () => {
    if (!torrentManagerRef.current) return;
    torrentManagerRef.current.forceAnnounce();
    showNotification('Anuncio forzado a trackers');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <Download className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">FontTorrent</h1>
            <span className="text-sm text-gray-500">Cliente BitTorrent P2P Web</span>
          </div>
        </div>
      </header>

      {/* Notification */}
      {notification && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
            {notification}
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            Procesando...
          </div>
        </div>
      )}

      {/* Saving Progress */}
      {saving?.active && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 px-4 py-3 rounded">
            <div className="flex justify-between text-sm mb-1">
              <span>Guardando en carpeta...</span>
              <span>{saving.percent}%</span>
            </div>
            <div className="w-full bg-indigo-100 rounded h-2">
              <div className="h-2 bg-indigo-500 rounded" style={{ width: `${saving.percent}%` }} />
            </div>
            {saving.file && (
              <div className="text-xs mt-1 truncate">{saving.file}</div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Torrent Management */}
          <div className="lg:col-span-2 space-y-8">
            {/* Dropzone */}
            <div className="bg-white rounded-lg shadow-md p-6 border">
              <h2 className="text-lg font-semibold text-gray-800 mb-6">
                Agregar Torrents
              </h2>
              <TorrentDropzone
                onTorrentFile={handleTorrentFile}
                onMagnetLink={handleMagnetLink}
                onCreateTorrent={handleCreateTorrent}
              />
            </div>

            {/* Torrent List */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Torrents Activos ({torrents.length})
              </h2>
              <TorrentList
                torrents={torrents}
                onRemoveTorrent={handleRemoveTorrent}
                onDownloadFile={handleDownloadFile}
                onSaveTorrent={handleSaveTorrent}
              />
            </div>
          </div>

          {/* Right Column - Peers */}
          <div className="space-y-8">
            <PeerList peers={peers} />
            
            <TrackersSettings
              trackers={trackers}
              onSave={handleSaveTrackers}
              onForceAnnounce={handleForceAnnounce}
            />

            {/* Stats */}
            <div className="bg-white rounded-lg shadow-md p-6 border">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Estadísticas
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Torrents activos:</span>
                  <span className="font-medium">{torrents.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Peers conectados:</span>
                  <span className="font-medium">{peers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completados:</span>
                  <span className="font-medium">
                    {torrents.filter(t => t.done).length}
                  </span>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">
                Acerca de FontTorrent
              </h3>
              <p className="text-sm text-blue-700 leading-relaxed">
                Cliente BitTorrent P2P que funciona completamente en el navegador.
                Descarga y comparte archivos directamente con otros usuarios sin 
                necesidad de instalar software adicional.
              </p>
              <div className="mt-4 text-xs text-blue-600">
                <p>• Conexiones P2P directas via WebRTC</p>
                <p>• Compatible con torrents estándar</p>
                <p>• Funciona en GitHub Pages</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>FontTorrent - Cliente BitTorrent P2P Web</p>
            <p className="mt-1">
              Desarrollado para funcionar en GitHub Pages
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
