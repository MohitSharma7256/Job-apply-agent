import React from 'react';
import { GlassCard } from './ui/GlassCard';

export function PlatformGrid({ platforms = [] }) {
  return (
    <GlassCard className="p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Platform Status</h3>
      <div className="grid grid-cols-2 gap-4">
        {platforms.map((platform, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${
              platform.connected ? 'bg-green-400' : 'bg-red-400'
            }`} />
            <span className="text-sm text-slate-300">{platform.name}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
