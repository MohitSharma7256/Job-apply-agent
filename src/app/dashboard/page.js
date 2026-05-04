"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Search, Loader2, Rocket, Brain, User, FileText, History, BarChart3, ArrowRight, Table, Sparkles
} from "lucide-react";
import { JobProgressTracker } from "@/components/JobProgressTracker";

const PLATFORMS = [
  { id: "naukri", name: "Naukri.com", icon: "📋", color: "from-blue-500 to-blue-600" },
  { id: "linkedin", name: "LinkedIn", icon: "💼", color: "from-blue-600 to-blue-700" },
  { id: "indeed", name: "Indeed", icon: "✅", color: "from-green-500 to-green-600" },
  { id: "glassdoor", name: "Glassdoor", icon: "💎", color: "from-teal-500 to-teal-600" },
];

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeJobId, setActiveJobId] = useState(null);
  const [searchParams, setSearchParams] = useState({
    keywords: "",
    locations: [],
    platforms: ["linkedin", "naukri"]
  });
  const [toast, setToast] = useState(null);

  const dashboardModules = [
    { id: "profile", title: "Profile", description: "Manage personal details and target roles", href: "/dashboard/profile", icon: User },
    { id: "resume", title: "Resume", description: "Base resume first, optional cover letters", href: "/dashboard/resume", icon: FileText },
    { id: "apply-log", title: "Apply log", description: "Excel-style row per apply (resume / CL / salary / mode)", href: "/dashboard/applications", icon: Table },
    { id: "activity", title: "Activity", description: "Searches, tailoring, automation timeline", href: "/dashboard/history", icon: History },
    { id: "analytics", title: "Analytics", description: "Views conversion-style summaries", href: "/dashboard/analytics", icon: BarChart3 },
  ];

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSearch = async () => {
    if (!searchParams.keywords) {
      showToast("Please enter keywords", "error");
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...searchParams,
          maxResults: 10
        })
      });

      if (response.ok) {
        const data = await response.json();
        setActiveJobId(data.data.jobId);
        showToast("Job search queued successfully", "success");
      } else {
        throw new Error('Search failed');
      }
    } catch (error) {
      console.error('Search failed:', error);
      showToast("Failed to start search", "error");
      setIsSearching(false);
    }
  };

  const handleJobComplete = (results) => {
    if (results?.jobs) {
      setJobs(results.jobs);
    }
    setIsSearching(false);
    setActiveJobId(null);
    showToast(`Found ${results?.jobs?.length || 0} matching jobs`, "success");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
      {/* Content Header */}
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-black text-white">Dashboard</h1>
          <p className="text-slate-500 mt-2">Welcome back! Here&apos;s what&apos;s happening with your applications.</p>
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
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 transition-all text-white"
                  placeholder="React, Node, Remote..."
                  value={searchParams.keywords}
                  onChange={e => setSearchParams({...searchParams, keywords: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Platforms</label>
                <div className="grid grid-cols-2 gap-2">
                  {PLATFORMS.map(p => (
                    <button 
                      key={p.id} 
                      onClick={() => {
                        const newPlatforms = searchParams.platforms.includes(p.id)
                          ? searchParams.platforms.filter(id => id !== p.id)
                          : [...searchParams.platforms, p.id];
                        setSearchParams({...searchParams, platforms: newPlatforms});
                      }}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-xl border transition-all text-xs font-medium",
                        searchParams.platforms.includes(p.id) 
                          ? "bg-blue-500/10 border-blue-500/30 text-blue-400" 
                          : "bg-white/5 border-white/5 text-slate-400"
                      )}
                    >
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
          {activeJobId && (
            <div className="mb-8">
              <JobProgressTracker 
                jobId={activeJobId} 
                onComplete={handleJobComplete}
              />
            </div>
          )}
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

      {/* Feature Modules */}
      <section className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Explore all features</h2>
          <p className="text-xs uppercase tracking-widest text-slate-500">Everything in one dashboard</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {dashboardModules.map((module) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.id}
                href={module.href}
                className="group rounded-3xl border border-white/10 bg-white/5 p-5 hover:border-blue-500/40 hover:bg-white/[0.07] transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="h-11 w-11 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="font-bold text-white mb-2">{module.title}</h3>
                <p className="text-sm text-slate-400">{module.description}</p>
              </Link>
            );
          })}
        </div>
      </section>

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
