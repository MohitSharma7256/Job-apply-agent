"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { authFetch, getAuthToken } from "@/lib/apiClient";
import {
  Search, Loader2, Rocket, Brain, History, BarChart3, Sparkles, MapPin, Briefcase, ArrowRight, Play, Zap, CheckCircle2, Clock, AlertCircle
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Job Search</h1>
          <p className="text-sm text-slate-400 mt-0.5">Find and apply to jobs across platforms</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/history" className="p-2 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-all">
            <History className="w-4 h-4" />
          </Link>
          <Link href="/dashboard/analytics" className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all">
            <BarChart3 className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Search Panel */}
        <div className="xl:col-span-4 space-y-6">
          <div className="p-5 rounded-xl bg-[#141414] border border-white/5">
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block px-1">Keywords</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    className="w-full bg-white/5 border border-white/5 rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-blue-500/50 transition-all text-white text-sm"
                    placeholder="e.g., Frontend Developer"
                    value={searchParams.keywords}
                    onChange={e => setSearchParams({...searchParams, keywords: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block px-1">Platforms</label>
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
                        "flex items-center gap-2 p-2.5 rounded-lg border transition-all text-xs font-medium",
                        searchParams.platforms.includes(p.id)
                          ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                          : "bg-white/5 border-white/5 text-slate-400 hover:border-white/10"
                      )}
                    >
                      <span className="text-sm">{p.icon}</span> {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 font-medium text-white transition-all flex items-center justify-center gap-2 group disabled:opacity-50 text-sm"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
                {isSearching ? "Searching..." : "Search Jobs"}
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="p-5 rounded-xl bg-[#141414] border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Quick Stats</p>
              <Sparkles className="w-4 h-4 text-blue-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-white/5">
                <p className="text-2xl font-bold text-white">{jobs.length}</p>
                <p className="text-xs text-slate-400 mt-0.5">Total Jobs</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <p className="text-2xl font-bold text-green-400">{jobs.filter(j => j.status === 'applied').length}</p>
                <p className="text-xs text-slate-400 mt-0.5">Applied</p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="xl:col-span-8 space-y-6">
          {activeJobId && (
            <JobProgressTracker jobId={activeJobId} onComplete={handleJobComplete} />
          )}

          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Recommendations</h2>
            <span className="text-[10px] font-medium text-slate-500 bg-white/5 px-2 py-1 rounded-full border border-white/5">
              {jobs.length} Results
            </span>
          </div>

          <div className="space-y-3">
            {jobs.length === 0 && !isSearching && (
              <div className="flex flex-col items-center justify-center py-16 bg-[#141414] rounded-xl border border-dashed border-white/10">
                <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                  <Search className="w-6 h-6 text-slate-600" />
                </div>
                <h3 className="text-sm font-medium text-white">No Jobs Found</h3>
                <p className="text-slate-500 text-xs mt-1">Start a new search to see results here.</p>
              </div>
            )}

            {jobs.map(job => (
              <div key={job.id} className="p-5 rounded-xl bg-[#141414] border border-white/5 hover:border-blue-500/20 transition-all group">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="h-12 w-12 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-2xl shrink-0">
                    {job.platform === 'linkedin' ? '💼' : job.platform === 'glassdoor' ? '💎' : '📋'}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{job.title}</h3>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0",
                        job.matchScore >= 80 ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                        job.matchScore >= 60 ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                        "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                      )}>
                        {job.matchScore}% Match
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-slate-600" /> {job.company}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-600" /> {job.location}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {job.skills?.slice(0, 4).map(s => (
                        <span key={s} className="px-2 py-0.5 rounded bg-white/5 text-[10px] font-medium text-slate-500 border border-white/5">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2 justify-end shrink-0">
                    <button className="p-2.5 rounded-lg bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10 transition-all">
                      <Brain className="w-4 h-4" />
                    </button>
                    <button className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 font-medium text-xs text-white transition-all">
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
