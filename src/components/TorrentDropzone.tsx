import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Download } from 'lucide-react';

interface TorrentDropzoneProps {
  onTorrentFile: (file: File) => void;
  onMagnetLink: (magnetUri: string) => void;
  onCreateTorrent: (files: FileList) => void;
}

export const TorrentDropzone: React.FC<TorrentDropzoneProps> = ({
  onTorrentFile,
  onMagnetLink,
  onCreateTorrent
}) => {
  const [magnetLink, setMagnetLink] = React.useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      if (file.name.endsWith('.torrent')) {
        onTorrentFile(file);
      }
    });
  }, [onTorrentFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/x-bittorrent': ['.torrent']
    }
  });

  const handleMagnetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (magnetLink.startsWith('magnet:')) {
      onMagnetLink(magnetLink);
      setMagnetLink('');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onCreateTorrent(files);
    }
  };

  return (
    <div className="space-y-6">
      {/* Torrent File Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Download className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-700 mb-2">
          {isDragActive
            ? 'Suelta el archivo .torrent aquí'
            : 'Arrastra un archivo .torrent o haz clic para seleccionar'}
        </p>
        <p className="text-sm text-gray-500">
          Soporta archivos .torrent
        </p>
      </div>

      {/* Magnet Link Input */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-700 mb-4">
          O pega un enlace magnet:
        </h3>
        <form onSubmit={handleMagnetSubmit} className="flex gap-3">
          <input
            type="text"
            value={magnetLink}
            onChange={(e) => setMagnetLink(e.target.value)}
            placeholder="magnet:?xt=urn:btih:..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!magnetLink.startsWith('magnet:')}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Añadir
          </button>
        </form>
      </div>

      {/* Create Torrent */}
      <div className="bg-green-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-700 mb-4">
          Crear nuevo torrent:
        </h3>
        <div className="flex items-center gap-3">
          <Upload className="h-5 w-5 text-green-600" />
          <label className="cursor-pointer">
            <span className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
              Seleccionar archivos para compartir
            </span>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Selecciona uno o más archivos para crear un nuevo torrent
        </p>
      </div>
    </div>
  );
};
