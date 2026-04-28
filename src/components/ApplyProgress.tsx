import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from './ui/GlassCard';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/utils';

interface ApplyProgressProps {
  isOpen: boolean;
  totalJobs: number;
  currentJobIndex: number;
  results: { jobId: string; success: boolean; message: string; jobTitle: string }[];
  onClose: () => void;
}

export const ApplyProgress: React.FC<ApplyProgressProps> = ({
  isOpen,
  totalJobs,
  currentJobIndex,
  results,
  onClose
}) => {
  const progress = (results.length / totalJobs) * 100;
  const isFinished = results.length === totalJobs;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md"
          />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg"
            >
              <GlassCard className="p-8 bg-slate-900/90 border-white/10 shadow-2xl">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {isFinished ? "Batch Complete" : "Applying to Jobs..."}
                  </h3>
                  <p className="text-slate-400 text-sm">
                    {results.length} of {totalJobs} applications processed
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="relative h-4 w-full bg-white/5 rounded-full overflow-hidden mb-8">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                  />
                </div>

                {/* Results List */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {results.map((res, i) => (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={i}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border",
                        res.success ? "bg-emerald-500/5 border-emerald-500/10" : "bg-red-500/5 border-red-500/10"
                      )}
                    >
                      {res.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-200 truncate">{res.jobTitle}</p>
                        <p className="text-[10px] text-slate-500 truncate">{res.message}</p>
                      </div>
                    </motion.div>
                  ))}
                  {!isFinished && (
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/2 animate-pulse">
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                      <p className="text-sm text-slate-400">Processing next application...</p>
                    </div>
                  )}
                </div>

                {isFinished && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={onClose}
                    className="w-full mt-8 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold border border-white/10 transition-all"
                  >
                    Close & View Results
                  </motion.button>
                )}
              </GlassCard>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
