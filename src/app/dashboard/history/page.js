"use client";

import { useState } from "react";
import { History, Briefcase, Zap, CheckCircle2, Clock, AlertCircle, Search, Filter, ArrowUpRight, ExternalLink } from "lucide-react";

const ACTIVITY_LIST = [
  { id: "1", type: "application", title: "Senior React Developer", company: "Google", platform: "LinkedIn", status: "applied", date: "Oct 24, 2:30 PM", score: 92 },
  { id: "2", type: "search", title: "Frontend Engineer Search", company: "Many", platform: "Indeed, Naukri", status: "completed", date: "Oct 23, 11:15 AM", count: 24 },
  { id: "3", type: "tailor", title: "Resume Tailoring", company: "Meta", platform: "Custom", status: "completed", date: "Oct 22, 09:45 AM" },
  { id: "4", type: "application", title: "Full Stack Developer", company: "Zomato", platform: "Naukri", status: "failed", date: "Oct 20, 04:20 PM", error: "Site Timeout" },
  { id: "5", type: "application", title: "SDE-2", company: "Swiggy", platform: "LinkedIn", status: "processing", date: "Oct 19, 01:10 PM", progress: 65 },
];

export default function HistoryPage() {
  const [activeFilter, setActiveFilter] = useState("all");

  const getStatusStyle = (status) => {
    switch (status) {
      case 'applied': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'completed': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'failed': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'processing': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'application': return <Briefcase className="w-5 h-5" />;
      case 'search': return <Search className="w-5 h-5" />;
      case 'tailor': return <Zap className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-white">Activity History</h1>
          <p className="text-slate-500 mt-2">Track your job applications and AI operations in real-time.</p>
        </div>
        <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10">
          {['all', 'applications', 'searches', 'tailoring'].map(f => (
            <button 
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeFilter === f ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </header>

      <div className="space-y-4">
        {ACTIVITY_LIST.map(item => (
          <div key={item.id} className="p-6 rounded-[32px] bg-white/5 border border-white/10 flex items-center justify-between group hover:border-blue-500/30 transition-all hover:bg-white/[0.07]">
            <div className="flex items-center gap-6">
              <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border transition-all ${item.status === 'failed' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-slate-900 border-white/10 text-slate-400 group-hover:text-blue-400'}`}>
                {getIcon(item.type)}
              </div>
              
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-lg text-white">{item.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${getStatusStyle(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                  <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> {item.company}</span>
                  <span>•</span>
                  <span>{item.platform}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {item.date}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8">
              {item.score && (
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Match Score</div>
                  <div className="text-xl font-black text-blue-400">{item.score}%</div>
                </div>
              )}
              
              {item.status === 'processing' && (
                <div className="w-32">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-2 uppercase">
                    <span>Progress</span>
                    <span>{item.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: `${item.progress}%` }} />
                  </div>
                </div>
              )}

              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all">
                  <ArrowUpRight className="w-5 h-5" />
                </button>
                <button className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all">
                  <ExternalLink className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Load More */}
        <button className="w-full py-6 mt-4 rounded-[32px] border-2 border-dashed border-white/10 text-slate-500 font-bold hover:border-blue-500/30 hover:text-blue-400 transition-all flex items-center justify-center gap-3">
          <History className="w-5 h-5" /> Load Older Activity
        </button>
      </div>
    </div>
  );
}
