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
  Trash2,
  TrendingUp,
  Calendar,
  Clock,
  Award,
  Target,
  Sparkles,
  Rocket,
  Brain,
  Shield
} from "lucide-react";
import { cn, getPlatformIcon, getStatusColor } from "../../utils/helpers";

const PLATFORMS = [
  { id: "naukri", name: "Naukri.com", icon: "📋", color: "from-blue-500 to-blue-600" },
  { id: "apna", name: "Apna", icon: "🚀", color: "from-purple-500 to-purple-600" },
  { id: "linkedin", name: "LinkedIn", icon: "💼", color: "from-blue-600 to-blue-700" },
  { id: "indeed", name: "Indeed", icon: "✅", color: "from-green-500 to-green-600" },
  { id: "internshala", name: "Internshala", icon: "🎓", color: "from-indigo-500 to-indigo-600" },
  { id: "greenhouse", name: "Greenhouse", icon: "🏢", color: "from-emerald-500 to-emerald-600" },
  { id: "shine", name: "Shine.com", icon: "✨", color: "from-yellow-500 to-yellow-600" },
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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    
    setTimeout(() => setIsLoaded(true), 100);
    
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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
    
    return () => window.removeEventListener('mousemove', handleMouseMove);
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

  const stats = [
    { label: "Today's Applications", value: todayCount, icon: <Calendar className="w-5 h-5" />, color: "from-blue-500 to-blue-600" },
    { label: "Total Jobs Found", value: jobs.length, icon: <Briefcase className="w-5 h-5" />, color: "from-purple-500 to-purple-600" },
    { label: "Success Rate", value: "87%", icon: <TrendingUp className="w-5 h-5" />, color: "from-green-500 to-green-600" },
    { label: "Active Platforms", value: searchParams.platforms.length, icon: <Target className="w-5 h-5" />, color: "from-orange-500 to-orange-600" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-blue-950/10 to-slate-950">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.1), transparent 50%)`
          }}
        />
      </div>

      {/* Floating Particles */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div 
          className={cn(
            "fixed top-6 left-1/2 z-[100] px-6 py-3 rounded-xl shadow-2xl backdrop-blur-xl border font-medium flex items-center gap-3 -translate-x-1/2 transition-all duration-300",
            toast.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : 
            toast.type === "error" ? "bg-red-500/10 border-red-500/20 text-red-400" : 
            "bg-blue-500/10 border-blue-500/20 text-blue-400"
          )}
        >
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : 
           toast.type === "error" ? <AlertCircle className="w-5 h-5" /> : 
           <Loader2 className="w-5 h-5 animate-spin" />}
          {toast.message}
        </div>
      )}

      <div className="flex h-screen overflow-hidden relative z-10">
        {/* Enhanced Sidebar */}
        <aside className="w-80 border-r border-white/5 bg-black/30 backdrop-blur-xl hidden lg:flex flex-col p-6">
          <div className="flex items-center gap-4 mb-12 px-2">
            <div className="relative">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <Zap className="w-7 h-7" fill="currentColor" />
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 blur-lg opacity-50 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                Agent Pro
              </h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">AI-Powered</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="space-y-4 mb-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">{stat.label}</div>
                    <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
                      {stat.value}
                    </div>
                  </div>
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-white`}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <nav className="space-y-2 flex-1">
            {["search", "profile", "applications", "stats"].map((tab, index) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group relative overflow-hidden",
                  activeTab === tab 
                    ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/10" 
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent"
                )}
              >
                <div className="relative z-10 flex items-center gap-4">
                  {tab === "search" && <Search className="w-5 h-5" />}
                  {tab === "profile" && <User className="w-5 h-5" />}
                  {tab === "applications" && <Briefcase className="w-5 h-5" />}
                  {tab === "stats" && <BarChart3 className="w-5 h-5" />}
                  <span className="capitalize font-medium">{tab}</span>
                </div>
                {activeTab === tab && <ChevronRight className="w-4 h-4 ml-auto relative z-10" />}
                {activeTab === tab && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10" />
                )}
              </button>
            ))}
          </nav>

          <div className="mt-auto">
            <GlassCard className="p-4 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold text-slate-400">Daily Quota</span>
                <span className="text-xs font-bold text-blue-400">{todayCount}/50</span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${(todayCount / 50) * 100}%` }}
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                />
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                <Rocket className="w-3 h-3" />
                <span>AI-powered automation</span>
              </div>
            </GlassCard>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto relative">
          <header className="sticky top-0 z-40 px-8 py-6 flex items-center justify-between bg-slate-950/80 backdrop-blur-md border-b border-white/5">
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-bold capitalize bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
                {activeTab}
              </h2>
              {activeTab === "search" && jobs.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-blue-400">{filteredJobs.length} matches</span>
                </div>
              )}
            </div>
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
              <div className="relative">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 flex items-center justify-center overflow-hidden">
                  <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile.name || 'User'}`} alt="avatar" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-slate-950" />
              </div>
            </div>
          </header>

          <div className="p-8 max-w-7xl mx-auto">
            {activeTab === "search" && (
              <div className="space-y-8">
                {/* Enhanced Search Config */}
                <GlassCard className="p-8 bg-gradient-to-br from-white/5 to-white/10 border-white/10">
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
                      AI Job Search Configuration
                    </h3>
                    <p className="text-slate-400">Configure your AI-powered job search parameters</p>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Brain className="w-4 h-4" />
                          Target Keywords
                        </label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {searchParams.keywords.map((kw, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500/10 to-blue-600/10 text-blue-400 border border-blue-500/20 text-sm"
                            >
                              {kw}
                              <button 
                                onClick={() => setSearchParams({ ...searchParams, keywords: searchParams.keywords.filter((_, idx) => idx !== i) })}
                                className="hover:text-blue-300 transition-colors"
                              >
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
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all pr-12 placeholder-slate-500"
                          />
                          <button 
                            onClick={addKeyword}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Locations
                        </label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {searchParams.locations.map((loc, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 text-emerald-400 border border-emerald-500/20 text-sm"
                            >
                              {loc}
                              <button 
                                onClick={() => setSearchParams({ ...searchParams, locations: searchParams.locations.filter((_, idx) => idx !== i) })}
                                className="hover:text-emerald-300 transition-colors"
                              >
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
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder-slate-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Platforms
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {PLATFORMS.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => togglePlatform(p.id)}
                              className={cn(
                                "flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium relative overflow-hidden",
                                searchParams.platforms.includes(p.id)
                                  ? `bg-gradient-to-r ${p.color} text-white border-transparent shadow-lg` 
                                  : "bg-white/5 border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10"
                              )}
                            >
                              <span>{p.icon}</span>
                              {p.name.split('.')[0]}
                              {searchParams.platforms.includes(p.id) && (
                                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Filter className="w-4 h-4" />
                            Filters
                          </label>
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
                          <label className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <ArrowUpDown className="w-4 h-4" />
                            Sort
                          </label>
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
                    className="w-full mt-8 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-4 font-bold text-white shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-3 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-0 hover:opacity-100 transition-opacity duration-300" />
                    <span className="relative flex items-center gap-3">
                      {isSearching ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Rocket className="w-5 h-5" />
                      )}
                      {isSearching ? "AI is Searching..." : "Launch AI Job Search"}
                    </span>
                    <div className="absolute inset-0 bg-white/20 transform scale-x-0 hover:scale-x-100 transition-transform duration-500 origin-left" />
                  </button>
                </GlassCard>

                {/* Results Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                      <Sparkles className="w-6 h-6 text-blue-400" />
                      AI-Discovered Opportunities
                      <span className="px-3 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-sm">
                        {filteredJobs.length}
                      </span>
                    </h3>
                    <p className="text-slate-400 mt-1">Curated by AI based on your profile</p>
                  </div>
                </div>

                {/* Enhanced Job Grid */}
                <div className="grid gap-4">
                  {filteredJobs.length === 0 ? (
                    <div className="text-center py-24 border-2 border-dashed border-white/5 rounded-3xl bg-gradient-to-br from-white/5 to-transparent">
                      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-blue-400" />
                      </div>
                      <p className="text-slate-400 font-medium mb-2">Ready to discover your next role?</p>
                      <p className="text-xs text-slate-500">Adjust filters or hit search to begin</p>
                    </div>
                  ) : (
                    filteredJobs.map((job, index) => (
                      <div
                        key={job.id}
                        className={cn(
                          "group relative flex items-center gap-6 p-6 rounded-2xl border transition-all cursor-pointer overflow-hidden",
                          "bg-gradient-to-br from-white/5 to-white/10 border-white/10 hover:border-white/20",
                          job.applied && "opacity-60"
                        )}
                        onClick={() => setSelectedJob(job)}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        {/* Match Score Indicator */}
                        <div className="relative z-10 h-16 w-16 flex-shrink-0">
                          <svg className="h-16 w-16 -rotate-90">
                            <circle 
                              cx="32" cy="32" r="28" 
                              className="fill-none stroke-white/5 stroke-[4px]"
                            />
                            <circle 
                              cx="32" cy="32" r="28" 
                              className={cn(
                                "fill-none stroke-[4px] stroke-linecap-round transition-all",
                                (job.matchScore || 0) >= 8 ? "stroke-emerald-500" : 
                                (job.matchScore || 0) >= 6 ? "stroke-amber-500" : "stroke-slate-500"
                              )}
                              style={{
                                strokeDasharray: `${(job.matchScore || 0) * 17.6} 200`
                              }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-bold text-white">{(job.matchScore || 0).toFixed(0)}</span>
                          </div>
                        </div>

                        <div className="relative z-10 flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-white truncate text-xl">{job.title}</h4>
                            {job.applied && (
                              <span className="text-xs font-bold uppercase tracking-widest text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/20">Applied</span>
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
                              <span key={i} className="text-xs font-bold uppercase tracking-tighter px-2 py-0.5 rounded bg-white/5 text-slate-500 border border-white/5">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="relative z-10 flex items-center gap-3">
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
                                : "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-400 border border-blue-500/30 hover:border-blue-500/50"
                            )}
                          >
                            {job.applied ? "Done" : "Apply Now"}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
