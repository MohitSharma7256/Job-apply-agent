import React from 'react';
import { GlassCard } from './ui/GlassCard';
import { cn, getPlatformIcon } from '@/utils';
import { Activity, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

interface PlatformStatus {
  id: string;
  name: string;
  status: 'ok' | 'degraded' | 'down';
  count: number;
  successRate: number;
  lastActive: string;
}

interface Props {
  platforms: PlatformStatus[];
}

export const PlatformGrid: React.FC<Props> = ({ platforms }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {platforms.map((p) => (
        <GlassCard key={p.id} className="p-5 border-white/5 hover:border-white/10 transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                {getPlatformIcon(p.id as any)}
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">{p.name}</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    p.status === 'ok' ? "bg-emerald-500" : p.status === 'degraded' ? "bg-amber-500" : "bg-red-500"
                  )} />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                    {p.status === 'ok' ? 'Operational' : p.status === 'degraded' ? 'Degraded' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
            <Activity className="w-4 h-4 text-slate-600" />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-auto">
            <div className="p-2 rounded-lg bg-white/2 border border-white/5">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Today</p>
              <p className="text-sm font-bold text-white mt-0.5">{p.count}</p>
            </div>
            <div className="p-2 rounded-lg bg-white/2 border border-white/5">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Success</p>
              <p className="text-sm font-bold text-emerald-400 mt-0.5">{p.successRate}%</p>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
};