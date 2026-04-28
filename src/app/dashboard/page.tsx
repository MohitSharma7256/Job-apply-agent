"use client";

import { useState, useEffect, useCallback } from "react";
import { Job, UserProfile, ApplicationRecord, Platform } from "../../types";
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

const PLATFORMS: { id: Platform; name: string; icon: string }[] = [
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

const defaultProfile: UserProfile = {
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
  keywords: [] as string[],
  locations: ["India"] as string[],
  platforms: ["naukri", "apna", "linkedin", "indeed"] as Platform[],
  maxResults: 30,
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"search" | "profile" | "applications" | "stats">("search");
  const [isSearching, setIsSearching] = useState(false);
  const [isApplying, setIsApplying] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [searchParams, setSearchParams] = useState(defaultSearch);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [filterScore, setFilterScore] = useState(0);
  const [sortBy, setSortBy] = useState<"score" | "date" | "company">("score");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [batchSelecting, setBatchSelecting] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [batchProgress, setBatchProgress] = useState<{
    isOpen: boolean;
    total: number;
    results: { jobId: string; success: boolean; message: string; jobTitle: string }[];
  }>({ isOpen: false, total: 0, results: [] });
  
  // Input states
  const [newSkill, setNewSkill] = useState("");
  const [newKeyword, setNewKeyword] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [targetRoleInput, setTargetRoleInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedResume, setUploadedResume] = useState<{ name: string; url: string } | null>(null);

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

  const showToast = useCallback((message: string, type: "success" | "error" | "info") => {
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

  const handleApply = async (job: Job) => {
    setIsApplying(job.id);
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job, profile }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Applied to ${job.title}!`, "success");
        loadApplications();
        setJobs(prev => prev.map(j => j.id === job.id ? { ...j, applied: true } : j));
        if (selectedJob?.id === job.id) setSelectedJob(prev => prev ? { ...prev, applied: true } : null);
      } else {
        showToast(data.error || "Application failed", "error");
      }
    } catch (error) {
      console.error("Apply error:", error);
      showToast("Application failed. Please try again.", "error");
    }
    setIsApplying(null);
  };

  const handleBatchApply = async () => {
    const idsToApply = Array.from(selectedJobIds);
    if (idsToApply.length === 0) return;

    const jobsToApply = jobs.filter(j => idsToApply.includes(j.id));
    
    setBatchProgress({
      isOpen: true,
      total: jobsToApply.length,
      results: []
    });
    setBatchSelecting(false);
    setSelectedJobIds(new Set());

    try {
      const res = await fetch("/api/jobs/batch-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobs: jobsToApply, profile }),
      });

      const data = await res.json();
      if (data.success) {
        // Since the API takes time, we should ideally stream results.
        // For now, we'll just update the results from the final response.
        const mappedResults = data.results.map((r: any) => ({
          ...r,
          jobTitle: jobsToApply.find(j => j.id === r.jobId)?.title || "Unknown Job"
        }));
        
        setBatchProgress(prev => ({ ...prev, results: mappedResults }));
        showToast(`Batch complete: ${data.appliedCount} applied`, "success");
        loadApplications();
        
        // Update jobs list
        const appliedIds = data.results.filter((r: any) => r.success).map((r: any) => r.jobId);
        setJobs(prev => prev.map(j => appliedIds.includes(j.id) ? { ...j, applied: true } : j));
      } else {
        showToast(data.error || "Batch apply failed", "error");
        setBatchProgress(prev => ({ ...prev, isOpen: false }));
      }
    } catch (error) {
      console.error("Batch apply error:", error);
      showToast("Batch application failed. Please try again.", "error");
      setBatchProgress(prev => ({ ...prev, isOpen: false }));
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      showToast("Please upload a PDF resume", "error");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", "default-user");

    try {
      const res = await fetch("/api/profile/resume", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setProfile({ ...profile, resumeUrl: data.url, resumeText: data.text || "" });
        setUploadedResume({ name: file.name, url: data.url });
        showToast("Resume uploaded successfully!", "success");
      } else {
        showToast(data.error || "Upload failed", "error");
      }
    } catch (error) {
      console.error("Upload error:", error);
      showToast("Upload failed. Please try again.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const toggleJobSelection = (id: string) => {
    const newSelection = new Set(selectedJobIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedJobIds(newSelection);
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
            {(["search", "profile", "applications", "stats"] as const).map((tab) => (
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
              {activeTab === "search" && jobs.length > 0 && (
                <button 
                  onClick={() => {
                    setBatchSelecting(!batchSelecting);
                    if (batchSelecting) setSelectedJobIds(new Set());
                  }}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2",
                    batchSelecting 
                      ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                      : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10"
                  )}
                >
                  {batchSelecting ? "Cancel Batch" : "Batch Apply"}
                </button>
              )}
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
                                onChange={(e) => setSortBy(e.target.value as any)}
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
                    
                    {batchSelecting && selectedJobIds.size > 0 && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={handleBatchApply}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Apply to {selectedJobIds.size} Jobs
                      </motion.button>
                    )}
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
                            batchSelecting && selectedJobIds.has(job.id)
                              ? "bg-blue-500/10 border-blue-500/40 shadow-lg shadow-blue-500/5"
                              : "bg-white/2 border-white/5 hover:bg-white/5 hover:border-white/10",
                            job.applied && "opacity-60"
                          )}
                          onClick={() => batchSelecting ? toggleJobSelection(job.id) : setSelectedJob(job)}
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
                            {batchSelecting ? (
                              <div className={cn(
                                "h-6 w-6 rounded-full border-2 transition-all flex items-center justify-center",
                                selectedJobIds.has(job.id) 
                                  ? "bg-blue-500 border-blue-500" 
                                  : "border-white/10 bg-white/5"
                              )}>
                                {selectedJobIds.has(job.id) && <CheckCircle2 className="w-4 h-4 text-white" />}
                              </div>
                            ) : (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApply(job);
                                }}
                                disabled={job.applied || isApplying === job.id}
                                className={cn(
                                  "px-5 py-2.5 rounded-xl font-bold text-sm transition-all",
                                  job.applied 
                                    ? "bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed"
                                    : "bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-blue-500/50"
                                )}
                              >
                                {isApplying === job.id ? <Loader2 className="w-4 h-4 animate-spin" /> : job.applied ? "Done" : "Apply"}
                              </button>
                            )}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === "profile" && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="grid md:grid-cols-3 gap-8">
                    <GlassCard className="md:col-span-1 p-8 flex flex-col items-center text-center">
                      <div className="h-32 w-32 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 p-1 mb-6">
                        <div className="h-full w-full rounded-[22px] bg-slate-900 flex items-center justify-center overflow-hidden">
                          <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile.name || 'User'}`} alt="avatar" className="h-full w-full object-cover" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-1">{profile.name || "Your Name"}</h3>
                      <p className="text-slate-400 text-sm mb-6">{profile.targetRoles[0] || "Target Role"}</p>
                      
                      <div className="w-full space-y-3">
                        <div className="flex items-center gap-3 text-sm text-slate-400 px-4 py-3 rounded-xl bg-white/2 border border-white/5">
                          <BarChart3 className="w-4 h-4" />
                          {profile.experience} years exp
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-400 px-4 py-3 rounded-xl bg-white/2 border border-white/5">
                          <MapPin className="w-4 h-4" />
                          {profile.location || "Location"}
                        </div>
                      </div>
                    </GlassCard>

                    <div className="md:col-span-2 space-y-6">
                      <GlassCard className="p-8">
                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Core Information</h4>
                        <div className="grid sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 ml-1">Full Name</label>
                            <input 
                              type="text" 
                              value={profile.name} 
                              onChange={(e) => setProfile({ ...profile, name: e.target.value })} 
                              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 ml-1">Email Address</label>
                            <input 
                              type="email" 
                              value={profile.email} 
                              onChange={(e) => setProfile({ ...profile, email: e.target.value })} 
                              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none"
                            />
                          </div>
                        </div>
                      </GlassCard>

                      <GlassCard className="p-8">
                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Resume / CV</h4>
                        <div className={cn(
                          "relative border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center text-center",
                          isUploading ? "border-blue-500/50 bg-blue-500/5" : "border-white/10 hover:border-white/20 bg-white/2"
                        )}>
                          {isUploading ? (
                            <div className="space-y-3">
                              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
                              <p className="text-sm text-slate-400 font-medium">Analyzing your resume...</p>
                            </div>
                          ) : profile.resumeUrl ? (
                            <div className="space-y-4">
                              <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto border border-emerald-500/20">
                                <FileText className="w-8 h-8 text-emerald-400" />
                              </div>
                              <div>
                                <p className="font-bold text-white">Resume Attached</p>
                                <p className="text-xs text-slate-500 mt-1">Ready for automatic applications</p>
                              </div>
                              <div className="flex gap-3 justify-center">
                                <a href={profile.resumeUrl} target="_blank" className="text-xs font-bold text-blue-400 hover:underline">View</a>
                                <button 
                                  onClick={() => setProfile({ ...profile, resumeUrl: "", resumeText: "" })}
                                  className="text-xs font-bold text-red-400 hover:underline"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/5">
                                <Upload className="w-8 h-8 text-slate-500" />
                              </div>
                              <p className="text-white font-bold mb-1">Upload your resume</p>
                              <p className="text-xs text-slate-500 mb-6">PDF format only (Max 5MB)</p>
                              <label className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold cursor-pointer shadow-lg shadow-blue-600/20 transition-all">
                                Select File
                                <input type="file" className="hidden" accept=".pdf" onChange={handleResumeUpload} />
                              </label>
                            </>
                          )}
                        </div>
                      </GlassCard>

                      <GlassCard className="p-8">
                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Skills & Expertise</h4>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {profile.skills.map((skill, i) => (
                            <span key={i} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 text-sm">
                              {skill}
                              <button onClick={() => setProfile({ ...profile, skills: profile.skills.filter(s => s !== skill) })}>
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={newSkill} 
                            onChange={(e) => setNewSkill(e.target.value)} 
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                            placeholder="Add skill (e.g. Next.js, Docker)"
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none"
                          />
                        </div>
                      </GlassCard>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "applications" && (
                <motion.div
                  key="applications"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <GlassCard className="p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/5 bg-white/2">
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Job Details</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Platform</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Applied Date</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {applications.slice().reverse().map((app, i) => (
                            <tr key={i} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                              <td className="px-6 py-4">
                                <p className="font-bold text-white">{app.jobTitle}</p>
                                <p className="text-xs text-slate-500">{app.company}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className="flex items-center gap-2 text-sm text-slate-400">
                                  {getPlatformIcon(app.platform)}
                                  {app.platform}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm text-slate-400">{new Date(app.appliedAt).toLocaleDateString()}</p>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className={cn(
                                  "inline-block px-3 py-1 rounded-lg text-xs font-bold border",
                                  getStatusColor(app.status)
                                )}>
                                  {app.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {applications.length === 0 && (
                      <div className="text-center py-24">
                        <Briefcase className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                        <p className="text-slate-500">Your application journey starts here</p>
                      </div>
                    )}
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Job Detail Modal */}
      <JobDetailView 
        job={selectedJob}
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        onApply={handleApply}
        isApplying={isApplying === selectedJob?.id}
      />
      {/* Batch Apply Progress Modal */}
      <ApplyProgress
        isOpen={batchProgress.isOpen}
        totalJobs={batchProgress.total}
        currentJobIndex={batchProgress.results.length}
        results={batchProgress.results}
        onClose={() => setBatchProgress(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );

  // Helper functions
  function addSkill() {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile({ ...profile, skills: [...profile.skills, newSkill.trim()] });
      setNewSkill("");
    }
  }

  function addKeyword() {
    if (newKeyword.trim() && !searchParams.keywords.includes(newKeyword.trim())) {
      setSearchParams({ ...searchParams, keywords: [...searchParams.keywords, newKeyword.trim()] });
      setNewKeyword("");
    }
  }

  function addLocation() {
    if (newLocation.trim() && !searchParams.locations.includes(newLocation.trim())) {
      setSearchParams({ ...searchParams, locations: [...searchParams.locations, newLocation.trim()] });
      setNewLocation("");
    }
  }

  function togglePlatform(platform: Platform) {
    const current = searchParams.platforms;
    if (current.includes(platform)) {
      if (current.length > 1) {
        setSearchParams({ ...searchParams, platforms: current.filter(p => p !== platform) });
      }
    } else {
      setSearchParams({ ...searchParams, platforms: [...current, platform] });
    }
  }
}
