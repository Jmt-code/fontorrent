import React from 'react';
import { Download, Upload, Users, Trash2, FileDown } from 'lucide-react';
import prettyBytes from 'pretty-bytes';
import type { TorrentInfo } from '../types/torrent';

interface TorrentListProps {
  torrents: TorrentInfo[];
  onRemoveTorrent: (infoHash: string) => void;
  onDownloadFile: (infoHash: string, fileIndex: number) => void;
}

export const TorrentList: React.FC<TorrentListProps> = ({
  torrents,
  onRemoveTorrent,
  onDownloadFile
}) => {
  const formatTime = (seconds: number) => {
    if (seconds === Infinity || seconds < 0) return '∞';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (torrents.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Download className="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <p className="text-lg">No hay torrents activos</p>
        <p className="text-sm">Agrega un archivo .torrent o enlace magnet para comenzar</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {torrents.map((torrent) => (
        <div key={torrent.infoHash} className="bg-white rounded-lg shadow-md p-6 border">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {torrent.name}
              </h3>
              <p className="text-sm text-gray-600">
                {prettyBytes(torrent.length)} • {torrent.files.length} archivo(s)
              </p>
            </div>
            <button
              onClick={() => onRemoveTorrent(torrent.infoHash)}
              className="text-red-500 hover:text-red-700 p-2"
              title="Eliminar torrent"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progreso: {(torrent.progress * 100).toFixed(1)}%</span>
              <span>
                {torrent.done ? 'Completado' : `${prettyBytes(torrent.downloaded)} / ${prettyBytes(torrent.length)}`}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  torrent.done ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${torrent.progress * 100}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-blue-500" />
              <span>{prettyBytes(torrent.downloadSpeed)}/s</span>
            </div>
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-green-500" />
              <span>{prettyBytes(torrent.uploadSpeed)}/s</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              <span>{torrent.numPeers} peers</span>
            </div>
            <div className="text-gray-600">
              <span>ETA: {formatTime(torrent.timeRemaining)}</span>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="flex justify-between text-xs text-gray-500 mb-4">
            <span>Descargado: {prettyBytes(torrent.downloaded)}</span>
            <span>Subido: {prettyBytes(torrent.uploaded)}</span>
            <span>Ratio: {torrent.ratio.toFixed(2)}</span>
          </div>

          {/* Files List */}
          {torrent.files.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Archivos:</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {torrent.files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 rounded p-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {prettyBytes(file.length)} • {(file.progress * 100).toFixed(1)}%
                      </p>
                    </div>
                    {file.progress === 1 && (
                      <button
                        onClick={() => onDownloadFile(torrent.infoHash, index)}
                        className="ml-2 text-blue-500 hover:text-blue-700 p-1"
                        title="Descargar archivo"
                      >
                        <FileDown className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Magnet Link */}
          <div className="border-t pt-4 mt-4">
            <p className="text-xs text-gray-500 mb-1">Enlace magnet:</p>
            <div className="flex">
              <input
                type="text"
                value={torrent.magnetURI}
                readOnly
                className="flex-1 text-xs bg-gray-50 border border-gray-300 rounded-l px-2 py-1 font-mono"
              />
              <button
                onClick={() => navigator.clipboard.writeText(torrent.magnetURI)}
                className="px-3 py-1 bg-gray-200 border border-l-0 border-gray-300 rounded-r text-xs hover:bg-gray-300"
              >
                Copiar
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
