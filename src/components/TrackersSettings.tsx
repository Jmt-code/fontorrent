/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

interface TrackersSettingsProps {
  trackers: string[];
  onSave: (trackers: string[]) => void;
  onForceAnnounce: () => void;
}

export const TrackersSettings: React.FC<TrackersSettingsProps> = ({ trackers, onSave, onForceAnnounce }) => {
  const [value, setValue] = React.useState(trackers.join('\n'));

  React.useEffect(() => {
    setValue(trackers.join('\n'));
  }, [trackers]);

  const handleSave = () => {
    const list = value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    onSave(list);
  };

  const fsSupported = typeof (window as any).showDirectoryPicker === 'function';

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Trackers WebRTC</h3>
        <button
          onClick={onForceAnnounce}
          className="px-3 py-1 text-xs border rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
          title="Forzar announce a los trackers"
        >
          Forzar announce
        </button>
      </div>
      <p className="text-sm text-gray-600">Uno por línea. Sólo ws:// o wss:// son válidos en navegador.</p>
      <textarea
        className="w-full h-32 border rounded p-2 font-mono text-xs"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="wss://tracker.openwebtorrent.com\nwss://tracker.webtorrent.io"
      />
      <div className="flex items-center justify-between">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Guardar trackers
        </button>
        <span className="text-xs text-gray-500">
          Guardado en localStorage • {fsSupported ? 'Guardar en carpeta disponible' : 'Guardar en carpeta no soportado'}
        </span>
      </div>
    </div>
  );
};
