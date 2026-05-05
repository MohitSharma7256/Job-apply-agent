"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { authFetch } from "@/lib/apiClient";
import {
  Search, Loader2, Rocket, Brain, User, FileText, History, BarChart3, ArrowRight, Table, Sparkles, MapPin, Briefcase
} from "lucide-react";
import { JobProgressTracker } from "@/components/JobProgressTracker";

const PLATFORMS = [
  { id: "naukri", name: "Naukri", icon: "📋" },
  { id: "linkedin", name: "LinkedIn", icon: "💼" },
  { id: "indeed", name: "Indeed", icon: "✅" },
  { id: "glassdoor", name: "Glassdoor", icon: "💎" },
];

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeJobId, setActiveJobId] = useState(null);
  const [searchParams, setSearchParams] = useState({
    keywords: "",
    locations: [],
    platforms: ["linkedin", "naukri"],
    targetRoles: []
  });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsRes, profileRes] = await Promise.all([
          authFetch('/api/jobs/list'),
          authFetch('/api/profile')
        ]);
        
        const jobsData = await jobsRes.json();
        const profileData = await profileRes.json();

        if (jobsData.success) setJobs(jobsData.jobs);
        if (profileData.success && profileData.profile) {
          setSearchParams(prev => ({
            ...prev,
            targetRoles: profileData.profile.targetRoles || [],
            keywords: profileData.profile.targetRoles?.[0] || prev.keywords
          }));
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };
    fetchData();
  }, []);

  const handleSearch = async () => {
    if (!searchParams.keywords) return;
    setIsSearching(true);
    try {
      const response = await authFetch('/api/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...searchParams, maxResults: 10 })
      });
      if (response.ok) {
        const data = await response.json();
        setActiveJobId(data.data.jobId);
      }
    } catch (error) {
      setIsSearching(false);
    }
  };

  const handleJobComplete = (results) => {
    if (results?.jobs) setJobs(results.jobs);
    setIsSearching(false);
    setActiveJobId(null);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Job Search</h1>
          <p className="text-slate-500 mt-1">Find and apply to jobs across multiple platforms</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/history" className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all">
            <History className="w-5 h-5" />
          </Link>
          <Link href="/dashboard/analytics" className="p-2 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all">
            <BarChart3 className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Search Panel */}
        <div className="xl:col-span-4 space-y-6">
          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block px-1">Keywords</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-blue-500/50 transition-all text-white font-medium"
                    placeholder="e.g., Frontend Developer"
                    value={searchParams.keywords}
                    onChange={e => setSearchParams({...searchParams, keywords: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block px-1">Platforms</label>
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
                        "flex items-center gap-2 p-3 rounded-xl border transition-all text-xs font-bold",
                        searchParams.platforms.includes(p.id) 
                          ? "bg-blue-600/20 border-blue-600/50 text-blue-400" 
                          : "bg-white/5 border-white/5 text-slate-500 hover:border-white/10"
                      )}
                    >
                      <span className="text-lg">{p.icon}</span> {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 font-black text-white shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                {isSearching ? "Searching..." : "Search Jobs"}
              </button>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="xl:col-span-8 space-y-6">
          {activeJobId && (
            <JobProgressTracker jobId={activeJobId} onComplete={handleJobComplete} />
          )}

          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold text-white">Recommendations</h2>
            <div className="flex gap-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter bg-white/5 px-3 py-1 rounded-full border border-white/5">
                {jobs.length} Results
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {jobs.length === 0 && !isSearching && (
              <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-slate-600" />
                </div>
                <h3 className="text-lg font-bold text-white">No Jobs Found</h3>
                <p className="text-slate-500 text-sm">Start a new search to see results here.</p>
              </div>
            )}

            {jobs.map(job => (
              <div key={job.id} className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-500/40 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6">
                  <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                    <span className="text-xs font-black text-blue-400">{job.matchScore}% Match</span>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-3xl shrink-0">
                    {job.platform === 'linkedin' ? '💼' : job.platform === 'glassdoor' ? '💎' : '📋'}
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors leading-tight">{job.title}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-400 font-medium">
                      <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-slate-600" /> {job.company}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-600" /> {job.location}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {job.skills.slice(0, 4).map(s => (
                        <span key={s} className="px-2.5 py-1 rounded-lg bg-white/5 text-[10px] font-bold text-slate-500 border border-white/5">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-row md:flex-col gap-2 justify-end">
                    <button className="flex-1 md:flex-none p-4 rounded-2xl bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 transition-all">
                      <Brain className="w-5 h-5" />
                    </button>
                    <button className="flex-[2] md:flex-none px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 font-black text-sm text-white transition-all shadow-lg shadow-blue-600/10">
                      Apply Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
