import React from 'react';
import { Users, Mic, Volume2, Radio } from 'lucide-react';

export const MultiplayerHUD: React.FC = () => {
  const activePeers = [
    { name: 'Elena R.', role: 'Architect', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', color: '#00F0FF' },
    { name: 'Marcus V.', role: 'Senior Engineer', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', color: '#7000FF' },
    { name: 'Sarah C.', role: 'SRE Lead', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80', color: '#00FF66' },
  ];

  return (
    <div className="absolute bottom-8 right-6 glass-panel px-4 py-2.5 rounded-2xl border border-border z-30 flex items-center gap-4 shadow-2xl">
      {/* Spatial Voice Channel Status */}
      <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
        <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
          <Mic className="w-3.5 h-3.5" />
        </div>
        <div>
          <div className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
            Spatial Voice Connected
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <span className="text-[9px] text-slate-400 font-mono">Architecture Session #402</span>
        </div>
      </div>

      {/* Peer Avatars & Spatial Cursors */}
      <div className="flex items-center gap-2">
        <Users className="w-3.5 h-3.5 text-slate-400" />
        <div className="flex -space-x-2">
          {activePeers.map((peer, idx) => (
            <img
              key={idx}
              src={peer.avatar}
              alt={peer.name}
              title={`${peer.name} (${peer.role})`}
              className="w-7 h-7 rounded-full border-2 border-surface object-cover cursor-pointer hover:scale-110 transition"
              style={{ borderColor: peer.color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
