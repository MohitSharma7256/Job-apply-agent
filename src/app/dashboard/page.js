"use client";

import { useState, useEffect, useCallback } from "react";
import { GlassCard } from "../../components/ui/GlassCard";
import { ActivityFeed } from "../../components/ActivityFeed";
import { PlatformGrid } from "../../components/PlatformGrid";
import { 
  Search, 
  User, 
  Briefcase, 
  BarChart3, 
  Plus, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ChevronRight,
  Filter,
  ArrowUpDown,
  Send,
  Zap,
  MapPin,
  Upload,
  FileText,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, getPlatformIcon, getStatusColor } from "../../utils/helpers";

const PLATFORMS = [
  { id: "naukri", name: "Naukri.com", icon: "📋" },
  { id: "apna", name: "Apna", icon: "🚀" },
  { id: "linkedin", name: "LinkedIn", icon: "💼" },
  { id: "indeed", name: "Indeed", icon: "✅" },
  { id: "internshala", name: "Internshala", icon: "🎓" },
  { id: "greenhouse", name: "Greenhouse", icon: "🏢" },
  { id: "shine", name: "Shine.com", icon: "✨" },
];

const STORAGE_KEY_PROFILE = "job_agent_profile";
const STORAGE_KEY_SEARCH = "job_agent_search";

const defaultProfile = {
  name: "",
  email: "",
  phone: "",
  location: "",
  resumeUrl: "",
  resumeText: "",
  skills: [],
  experience: 0,
  education: "",
  targetRoles: [],
  targetLocations: [],
  targetSalary: 0,
  experienceLevel: "mid",
  preferredJobTypes: ["full-time"],
};

const defaultSearch = {
  keywords: [],
  locations: ["India"],
  platforms: ["naukri", "apna", "linkedin", "indeed"],
  maxResults: 30,
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("search");
  const [isSearching, setIsSearching] = useState(false);
  const [isApplying, setIsApplying] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [profile, setProfile] = useState(defaultProfile);
  const [searchParams, setSearchParams] = useState(defaultSearch);
  const [toast, setToast] = useState(null);
  const [filterScore, setFilterScore] = useState(0);
  const [sortBy, setSortBy] = useState("score");
  const [selectedJob, setSelectedJob] = useState(null);
  const [batchSelecting, setBatchSelecting] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState(new Set());
  
  const [newSkill, setNewSkill] = useState("");
  const [newKeyword, setNewKeyword] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [targetRoleInput, setTargetRoleInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedResume, setUploadedResume] = useState(null);

  useEffect(() => {
    const savedProfile = localStorage.getItem(STORAGE_KEY_PROFILE);
    const savedSearch = localStorage.getItem(STORAGE_KEY_SEARCH);
    
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.error("Failed to parse saved profile");
      }
    }
    
    if (savedSearch) {
      try {
        setSearchParams(JSON.parse(savedSearch));
      } catch (e) {
        console.error("Failed to parse saved search");
      }
    }
    
    loadApplications();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SEARCH, JSON.stringify(searchParams));
  }, [searchParams]);

  const showToast = useCallback((message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadApplications = async () => {
    try {
      const res = await fetch("/api/sheet?filter=all");
      const data = await res.json();
      if (data.success) {
        setApplications(data.applications);
      }
    } catch (error) {
      console.error("Failed to load applications:", error);
    }
  };

  const handleSearch = async () => {
    if (searchParams.keywords.length === 0) {
      showToast("Please add at least one keyword", "error");
      return;
    }
    setIsSearching(true);
    setJobs([]);

    try {
      const res = await fetch("/api/jobs/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...searchParams,
          profile,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs);
        showToast(`Found ${data.matchedCount} matching jobs`, "info");
      } else {
        showToast(data.error || "Search failed", "error");
      }
    } catch (error) {
      console.error("Search error:", error);
      showToast("Search failed. Please try again.", "error");
    }

    setIsSearching(false);
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !searchParams.keywords.includes(newKeyword.trim())) {
      setSearchParams({ ...searchParams, keywords: [...searchParams.keywords, newKeyword.trim()] });
      setNewKeyword("");
    }
  };

  const addLocation = () => {
    if (newLocation.trim() && !searchParams.locations.includes(newLocation.trim())) {
      setSearchParams({ ...searchParams, locations: [...searchParams.locations, newLocation.trim()] });
      setNewLocation("");
    }
  };

  const togglePlatform = (platformId) => {
    setSearchParams({
      ...searchParams,
      platforms: searchParams.platforms.includes(platformId)
        ? searchParams.platforms.filter(p => p !== platformId)
        : [...searchParams.platforms, platformId]
    });
  };

  const filteredJobs = jobs
    .filter(job => (job.matchScore || 0) >= filterScore)
    .sort((a, b) => {
      if (sortBy === "score") return (b.matchScore || 0) - (a.matchScore || 0);
      if (sortBy === "date") return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
      return a.company.localeCompare(b.company);
    });

  const todayCount = applications.filter(a => new Date(a.appliedAt).toDateString() === new Date().toDateString()).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30">
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={cn(
              "fixed top-6 left-1/2 z-[100] px-6 py-3 rounded-xl shadow-2xl backdrop-blur-xl border font-medium flex items-center gap-3",
              toast.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : 
              toast.type === "error" ? "bg-red-500/10 border-red-500/20 text-red-400" : 
              "bg-blue-500/10 border-blue-500/20 text-blue-400"
            )}
          >
            {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : 
             toast.type === "error" ? <AlertCircle className="w-5 h-5" /> : 
             <Loader2 className="w-5 h-5 animate-spin" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 border-r border-white/5 bg-black/20 backdrop-blur-xl hidden lg:flex flex-col p-6">
          <div className="flex items-center gap-3 mb-12 px-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Zap className="w-6 h-6" fill="currentColor" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                Agent Pro
              </h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Sovereign Intel</p>
            </div>
          </div>

          <nav className="space-y-2 flex-1">
            {["search", "profile", "applications", "stats"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                  activeTab === tab 
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-inner shadow-blue-500/5" 
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                {tab === "search" && <Search className="w-5 h-5" />}
                {tab === "profile" && <User className="w-5 h-5" />}
                {tab === "applications" && <Briefcase className="w-5 h-5" />}
                {tab === "stats" && <BarChart3 className="w-5 h-5" />}
                <span className="capitalize font-medium">{tab}</span>
                {activeTab === tab && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
            ))}
          </nav>

          <div className="mt-auto">
            <GlassCard className="p-4 bg-blue-500/5 border-blue-500/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-slate-400">Daily Quota</span>
                <span className="text-xs font-bold text-blue-400">{todayCount}/50</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(todayCount / 50) * 100}%` }}
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                />
              </div>
            </GlassCard>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto relative">
          <header className="sticky top-0 z-40 px-8 py-6 flex items-center justify-between bg-slate-950/50 backdrop-blur-md border-b border-white/5">
            <h2 className="text-2xl font-bold capitalize">{activeTab}</h2>
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 flex items-center justify-center overflow-hidden">
                <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile.name || 'User'}`} alt="avatar" />
              </div>
            </div>
          </header>

          <div className="p-8 max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              {activeTab === "search" && (
                <motion.div
                  key="search"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  {/* Search Config */}
                  <GlassCard className="p-8">
                    <div className="grid lg:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div>
                          <label className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 block">Target Keywords</label>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {searchParams.keywords.map((kw, i) => (
                              <span key={i} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-sm">
                                {kw}
                                <button onClick={() => setSearchParams({ ...searchParams, keywords: searchParams.keywords.filter((_, idx) => idx !== i) })}>
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                          <div className="relative">
                            <input 
                              type="text" 
                              value={newKeyword} 
                              onChange={(e) => setNewKeyword(e.target.value)} 
                              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                              placeholder="e.g. Senior Frontend, React, Remote"
                              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all pr-12"
                            />
                            <button onClick={addKeyword} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-400 hover:text-blue-300">
                              <Plus className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 block">Locations</label>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {searchParams.locations.map((loc, i) => (
                              <span key={i} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm">
                                {loc}
                                <button onClick={() => setSearchParams({ ...searchParams, locations: searchParams.locations.filter((_, idx) => idx !== i) })}>
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                          <input 
                            type="text" 
                            value={newLocation} 
                            onChange={(e) => setNewLocation(e.target.value)} 
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLocation())}
                            placeholder="Add location..."
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 block">Platforms</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {PLATFORMS.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => togglePlatform(p.id)}
                                className={cn(
                                  "flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium",
                                  searchParams.platforms.includes(p.id)
                                    ? "bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-lg shadow-blue-500/10"
                                    : "bg-white/5 border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10"
                                )}
                              >
                                <span>{p.icon}</span>
                                {p.name.split('.')[0]}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2 block">Filters</label>
                            <div className="relative">
                              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                              <select 
                                value={filterScore} 
                                onChange={(e) => setFilterScore(Number(e.target.value))}
                                className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 outline-none appearance-none cursor-pointer"
                              >
                                <option value={0}>All Matches</option>
                                <option value={8}>Elite (8+)</option>
                                <option value={6}>Strong (6+)</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2 block">Sort</label>
                            <div className="relative">
                              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                              <select 
                                value={sortBy} 
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 outline-none appearance-none cursor-pointer"
                              >
                                <option value="score">By Score</option>
                                <option value="date">By Date</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleSearch}
                      disabled={isSearching}
                      className="w-full mt-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-4 font-bold text-white shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-3"
                    >
                      {isSearching ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Search className="w-5 h-5" />
                      )}
                      {isSearching ? "Searching Engines..." : "Launch Job Search"}
                    </button>
                  </GlassCard>

                  {/* Results Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                      Discovered Opportunities
                      <span className="px-2 py-0.5 rounded-md bg-white/5 text-xs text-slate-400 border border-white/5">{filteredJobs.length}</span>
                    </h3>
                  </div>

                  {/* Job Grid */}
                  <div className="grid gap-4">
                    {filteredJobs.length === 0 ? (
                      <div className="text-center py-24 border-2 border-dashed border-white/5 rounded-3xl">
                        <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                          <Search className="w-8 h-8 text-slate-600" />
                        </div>
                        <p className="text-slate-500 font-medium">Ready to discover your next role?</p>
                        <p className="text-xs text-slate-600 mt-1">Adjust filters or hit search to begin</p>
                      </div>
                    ) : (
                      filteredJobs.map((job) => (
                        <motion.div
                          layout
                          key={job.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={cn(
                            "group relative flex items-center gap-6 p-5 rounded-2xl border transition-all cursor-pointer",
                            "bg-white/2 border-white/5 hover:bg-white/5 hover:border-white/10",
                            job.applied && "opacity-60"
                          )}
                          onClick={() => setSelectedJob(job)}
                        >
                          {/* Match Score Indicator */}
                          <div className="relative h-16 w-16 flex-shrink-0">
                            <svg className="h-16 w-16 -rotate-90">
                              <circle 
                                cx="32" cy="32" r="28" 
                                className="fill-none stroke-white/5 stroke-[4px]"
                              />
                              <motion.circle 
                                initial={{ strokeDasharray: "0 200" }}
                                animate={{ strokeDasharray: `${(job.matchScore || 0) * 17.6} 200` }}
                                cx="32" cy="32" r="28" 
                                className={cn(
                                  "fill-none stroke-[4px] stroke-linecap-round transition-all",
                                  (job.matchScore || 0) >= 8 ? "stroke-emerald-500" : 
                                  (job.matchScore || 0) >= 6 ? "stroke-amber-500" : "stroke-slate-500"
                                )}
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-sm font-bold text-white">{(job.matchScore || 0).toFixed(0)}</span>
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-white truncate text-lg">{job.title}</h4>
                              {job.applied && (
                                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/20">Applied</span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-400">
                              <span className="font-semibold text-slate-300">{job.company}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-700" />
                              <span>{job.location}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-700" />
                              <span className="text-slate-500">{getPlatformIcon(job.platform)} {job.platform}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-3">
                              {job.skills.slice(0, 5).map((skill, i) => (
                                <span key={i} className="text-[10px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded bg-white/5 text-slate-500 border border-white/5">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle apply logic here
                              }}
                              disabled={job.applied}
                              className={cn(
                                "px-5 py-2.5 rounded-xl font-bold text-sm transition-all",
                                job.applied 
                                  ? "bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed"
                                  : "bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-blue-500/50"
                              )}
                            >
                              {job.applied ? "Done" : "Apply"}
                            </button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
