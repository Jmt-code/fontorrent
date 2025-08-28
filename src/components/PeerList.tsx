import React from 'react';
import { Users, Globe } from 'lucide-react';
import type { PeerInfo } from '../types/torrent';

interface PeerListProps {
  peers: PeerInfo[];
}

export const PeerList: React.FC<PeerListProps> = ({ peers }) => {
  const uniquePeers = peers.filter((peer, index, self) => 
    index === self.findIndex(p => p.id === peer.id)
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-purple-500" />
        <h2 className="text-lg font-semibold text-gray-800">
          Peers Conectados ({uniquePeers.length})
        </h2>
      </div>

      {uniquePeers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Globe className="mx-auto h-8 w-8 text-gray-300 mb-2" />
          <p>No hay peers conectados</p>
          <p className="text-sm">Los peers aparecerán aquí cuando se conecten</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {uniquePeers.map((peer, index) => (
            <div
              key={`${peer.id}-${index}`}
              className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {peer.addr}
                  </p>
                  <p className="text-xs text-gray-500">
                    ID: {peer.id.substring(0, 8)}...
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                  {peer.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
