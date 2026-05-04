"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Search, User, Briefcase, BarChart3, Plus, X, CheckCircle2, 
  AlertCircle, Loader2, ChevronRight, Filter, ArrowUpDown, 
  Send, Zap, MapPin, Upload, FileText, Trash2, TrendingUp, 
  Calendar, Clock, Award, Target, Sparkles, Rocket, Brain, Shield
} from "lucide-react";
import { SocketProvider, useSocket } from '@/hooks/useSocket';
import { JobProgressTracker } from '@/components/JobProgressTracker';
import { NotificationCenter, NotificationContainer } from '@/components/NotificationCenter';

const PLATFORMS = [
  { id: "naukri", name: "Naukri.com", icon: "📋", color: "from-blue-500 to-blue-600" },
  { id: "linkedin", name: "LinkedIn", icon: "💼", color: "from-blue-600 to-blue-700" },
  { id: "indeed", name: "Indeed", icon: "✅", color: "from-green-500 to-green-600" },
  { id: "glassdoor", name: "Glassdoor", icon: "💎", color: "from-teal-500 to-teal-600" },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("search");
  const [jobs, setJobs] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isApplying, setIsApplying] = useState(null);
  const [profile, setProfile] = useState({ name: "", email: "", resumeText: "", skills: [] });
  const [searchParams, setSearchParams] = useState({ keywords: [], locations: ["India"], platforms: ["linkedin", "naukri"] });
  const [toast, setToast] = useState(null);

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSearch = async () => {
    setIsSearching(true);
    // AI Search Logic
    setTimeout(() => {
      setJobs([
        { id: "1", title: "Senior React Developer", company: "Google", location: "Bangalore", platform: "linkedin", matchScore: 92, skills: ["React", "Node", "AWS"], postedDate: "2h ago" },
        { id: "2", title: "Frontend Engineer", company: "Meta", location: "Remote", platform: "glassdoor", matchScore: 85, skills: ["Next.js", "Tailwind"], postedDate: "5h ago" },
      ]);
      setIsSearching(false);
      showToast("Found 24 matching jobs", "success");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Agent Pro <span className="text-xs font-bold px-2 py-1 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20 ml-2">V2.0</span>
          </h1>
          <p className="text-slate-500 mt-2">AI-Powered Career Automation</p>
        </div>
        <div className="flex gap-4">
          <button className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
            <User className="w-6 h-6 text-slate-400" />
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Search Config */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-400" /> Search Params
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Keywords</label>
                <input 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 transition-all"
                  placeholder="React, Node, Remote..."
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Platforms</label>
                <div className="grid grid-cols-2 gap-2">
                  {PLATFORMS.map(p => (
                    <button key={p.id} className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all text-xs font-medium">
                      <span>{p.icon}</span> {p.name}
                    </button>
                  ))}
                </div>
              </div>
              <button 
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
              >
                {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
                {isSearching ? "Searching..." : "Launch Search"}
              </button>
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Recommended for you</h2>
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all">Score</button>
              <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all">Newest</button>
            </div>
          </div>

          <div className="space-y-4">
            {jobs.map(job => (
              <div key={job.id} className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <div className="h-10 w-10 rounded-full border-2 border-white/5 flex items-center justify-center bg-black/40">
                    <span className="text-xs font-black text-blue-400">{job.matchScore}%</span>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-2xl">
                    {job.platform === 'linkedin' ? '💼' : job.platform === 'glassdoor' ? '💎' : '📋'}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{job.title}</h3>
                    <p className="text-slate-400 text-sm font-medium">{job.company} • {job.location}</p>
                    <div className="flex gap-2 mt-4">
                      {job.skills.map(s => (
                        <span key={s} className="px-2 py-1 rounded-md bg-white/5 text-[10px] font-bold text-slate-500 border border-white/5">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-all">
                      <Brain className="w-5 h-5" />
                    </button>
                    <button className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-sm transition-all shadow-lg shadow-blue-600/10">
                      Apply Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-sm font-bold text-white">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
