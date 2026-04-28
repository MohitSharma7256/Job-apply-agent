import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { JobEvent } from '@/hooks/useJobSocket';
import { cn, getPlatformIcon } from '@/utils/helpers';
import { CheckCircle2, XCircle, Loader2, Search, Zap } from 'lucide-react';

interface Props {
  events: JobEvent[];
}

export const ActivityFeed: React.FC<Props> = ({ events }) => {
  return (
    <div className="flex flex-col h-[500px] bg-black/20 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl">
      <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Live Agent Feed</h3>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-bold text-emerald-400">LIVE</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        <AnimatePresence initial={false}>
          {events.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600">
              <Zap className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-xs">Waiting for agent activity...</p>
            </div>
          ) : (
            events.map((event, i) => (
              <motion.div
                key={`${event.timestamp}-${i}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "p-3 rounded-xl border flex items-center gap-4 transition-all",
                  event.type === 'job:applied' ? "bg-emerald-500/5 border-emerald-500/20" :
                  event.type === 'job:failed' ? "bg-red-500/5 border-red-500/20" :
                  event.type === 'job:found' ? "bg-blue-500/5 border-blue-500/20" :
                  "bg-white/2 border-white/5"
                )}
              >
                <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center text-xl">
                  {getPlatformIcon(event.payload.platform || 'naukri')}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white truncate">
                      {event.type === 'job:found' ? 'Job Discovered' : 
                       event.type === 'job:applying' ? 'Applying...' :
                       event.type === 'job:applied' ? 'Application Sent' : 'Failed'}
                    </p>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {event.payload.title || event.payload.reason || 'Processing...'}
                  </p>
                </div>

                <div className="flex-shrink-0">
                  {event.type === 'job:applied' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  {event.type === 'job:failed' && <XCircle className="w-4 h-4 text-red-500" />}
                  {event.type === 'job:applying' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                  {event.type === 'job:found' && <Search className="w-4 h-4 text-blue-400" />}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};