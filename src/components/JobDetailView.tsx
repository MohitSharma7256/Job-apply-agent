import React from 'react';
import { Job, UserProfile } from '@/types';
import { GlassCard } from './ui/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Briefcase, MapPin, DollarSign, ExternalLink, Wand2 } from 'lucide-react';
import { cn } from '@/utils';

interface JobDetailViewProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onApply: (job: Job) => void;
  isApplying: boolean;
}

export const JobDetailView: React.FC<JobDetailViewProps> = ({
  job,
  isOpen,
  onClose,
  onApply,
  isApplying
}) => {
  const [activeTab, setActiveTab] = React.useState<'insights' | 'cover-letter'>('insights');
  if (!job) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Side Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-2xl bg-slate-900/95 shadow-2xl backdrop-blur-xl border-l border-white/10 overflow-y-auto"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="flex gap-4">
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Original
                  </a>
                  <button
                    onClick={() => onApply(job)}
                    disabled={job.applied || isApplying}
                    className={cn(
                      "flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all",
                      job.applied
                        ? "bg-emerald-500/20 text-emerald-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
                    )}
                  >
                    {isApplying ? "Applying..." : job.applied ? "Applied ✓" : "Quick Apply"}
                  </button>
                </div>
              </div>

              <div className="space-y-8">
                {/* Header */}
                <section>
                  <div className="flex items-center gap-4 mb-2">
                    <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20 uppercase tracking-wider">
                      {job.platform}
                    </span>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold border",
                      (job.matchScore || 0) >= 8 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    )}>
                      {(job.matchScore || 0).toFixed(1)}/10 MATCH
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold text-white mb-2">{job.title}</h1>
                  <div className="flex flex-wrap gap-4 text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4" />
                      {job.company}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {job.location}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4" />
                      {job.salary || 'Not disclosed'}
                    </div>
                  </div>
                </section>

                <hr className="border-white/5" />

                {/* Tabs */}
                <div className="flex gap-6 border-b border-white/5">
                  <button 
                    onClick={() => setActiveTab('insights')}
                    className={cn(
                      "pb-4 text-sm font-bold uppercase tracking-widest transition-all relative",
                      activeTab === 'insights' ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    AI Insights
                    {activeTab === 'insights' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />}
                  </button>
                  <button 
                    onClick={() => setActiveTab('cover-letter')}
                    className={cn(
                      "pb-4 text-sm font-bold uppercase tracking-widest transition-all relative",
                      activeTab === 'cover-letter' ? "text-purple-400" : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    Cover Letter
                    {activeTab === 'cover-letter' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400" />}
                  </button>
                </div>

                {activeTab === 'insights' ? (
                  <>
                    {/* AI Insights */}
                    <section className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white font-semibold text-lg">
                          <Wand2 className="w-5 h-5 text-purple-400" />
                          Analysis & Reasoning
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">ATS Ready</span>
                          <span className="text-sm font-bold text-blue-400">85%</span>
                        </div>
                      </div>
                      <GlassCard className="bg-white/2 border-white/5">
                        <p className="text-slate-300 leading-relaxed italic">
                          {job.aiAnalysis?.reasoning || "Analyzing job fit based on your profile..."}
                        </p>
                      </GlassCard>
                    </section>

                    {/* Skill Gap Analysis */}
                    <section className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-5 h-5" />
                          Matched Skills
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {job.skills.map((skill, i) => (
                            <span key={i} className="px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-sm border border-emerald-500/10">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-amber-400 font-semibold">
                          <AlertCircle className="w-5 h-5" />
                          Missing/Recommended
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(job.aiAnalysis?.skillGapAnalysis?.critical || []).length > 0 ? (
                            <>
                              {job.aiAnalysis?.skillGapAnalysis.critical.map((s, i) => (
                                <span key={i} className="px-3 py-1 rounded-md bg-red-500/10 text-red-400 text-sm border border-red-500/10">
                                  {s} (Critical)
                                </span>
                              ))}
                              {job.aiAnalysis?.skillGapAnalysis.suggested.map((s, i) => (
                                <span key={i} className="px-3 py-1 rounded-md bg-amber-500/10 text-amber-400 text-sm border border-amber-500/10">
                                  {s}
                                </span>
                              ))}
                            </>
                          ) : (
                            <span className="text-slate-500 text-sm italic">No significant gaps detected.</span>
                          )}
                        </div>
                      </div>
                    </section>
                  </>
                ) : (
                  /* Cover Letter Section */
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white font-semibold text-lg">
                        <Send className="w-5 h-5 text-blue-400" />
                        Tailored Cover Letter
                      </div>
                      <button 
                        className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                        onClick={() => {
                          navigator.clipboard.writeText(job.aiAnalysis?.coverLetter || '');
                        }}
                      >
                        Copy to Clipboard
                      </button>
                    </div>
                    <div className="p-6 rounded-xl bg-black/40 border border-white/5 font-serif text-sm text-slate-300 leading-relaxed whitespace-pre-wrap min-h-[400px]">
                      {job.aiAnalysis?.coverLetter || "Generating a personalized cover letter for you..."}
                    </div>
                  </section>
                )}

                {/* Job Description */}
                <section className="space-y-4">
                  <h3 className="text-white font-semibold text-lg">Job Description</h3>
                  <div className="text-slate-400 space-y-4 text-sm leading-relaxed whitespace-pre-wrap">
                    {job.description || "No detailed description available."}
                  </div>
                </section>

                {/* Resume Tailoring Preview (Placeholder) */}
                <section className="space-y-4 pb-12">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold text-lg">Tailored Resume Preview</h3>
                    <button className="text-xs text-blue-400 hover:underline">Download PDF</button>
                  </div>
                  <div className="p-6 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-slate-500 h-64 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent z-10" />
                    <p># John Doe</p>
                    <p>## Professional Summary</p>
                    <p>Highly skilled software engineer with deep expertise in React and Next.js...</p>
                    <p>## Experience</p>
                    <p>...</p>
                  </div>
                </section>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
