"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search, Loader2, Rocket, Brain, User, FileText, History, BarChart3, ArrowRight, Table, Sparkles, Menu, X
} from "lucide-react";

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
    platforms: ["linkedin", "naukri"],
    targetRoles: []
  });
  const [toast, setToast] = useState(null);

  // Fetch initial jobs from DB
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('/api/jobs/list');
        const data = await response.json();
        if (data.success) {
          setJobs(data.jobs);
        }
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
      }
    };

    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile');
        const data = await response.json();
        if (data.success && data.profile) {
          setSearchParams(prev => ({
            ...prev,
            targetRoles: data.profile.targetRoles || [],
            locations: data.profile.locations || []
          }));
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    };

    fetchJobs();
    fetchProfile();
  }, []);

  const handleSearch = async () => {
    if (!searchParams.keywords.trim()) {
      setToast({ type: 'error', message: 'Please enter job keywords' });
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchParams)
      });
      
      const data = await response.json();
      if (data.success) {
        setJobs(data.jobs);
        setToast({ type: 'success', message: `Found ${data.jobs.length} jobs` });
      } else {
        setToast({ type: 'error', message: data.error || 'Search failed' });
      }
    } catch (error) {
      setToast({ type: 'error', message: 'Search failed. Please try again.' });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white max-w-sm mx-4 lg:mx-0`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{toast.message}</span>
            <button 
              onClick={() => setToast(null)}
              className="ml-4 text-white hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-4 lg:px-8 py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-white mb-2">Job Search Dashboard</h1>
            <p className="text-slate-400 text-sm lg:text-base">Find and apply to jobs across multiple platforms</p>
          </div>
          <div className="flex items-center gap-2 lg:gap-4">
            <Link href="/dashboard/history">
              <button className="px-3 lg:px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-sm lg:text-base flex items-center gap-2">
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">History</span>
              </button>
            </Link>
            <Link href="/dashboard/analytics">
              <button className="px-3 lg:px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm lg:text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Analytics</span>
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="px-4 lg:px-8 pb-6 lg:pb-8">
        <div className="bg-slate-900 rounded-xl lg:rounded-2xl border border-white/10 p-4 lg:p-6">
          {/* Search Input */}
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 lg:w-5 lg:h-5" />
                <input
                  type="text"
                  placeholder="Search for jobs (e.g., 'Software Engineer', 'Product Manager')"
                  value={searchParams.keywords}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, keywords: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 text-sm lg:text-base"
                />
              </div>
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 rounded-lg transition-colors font-medium text-sm lg:text-base flex items-center justify-center gap-2 min-h-[48px]"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Search Jobs
                </>
              )}
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Platforms */}
            <div>
              <label className="block text-xs lg:text-sm font-medium text-slate-400 mb-2">Platforms</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(platform => (
                  <button
                    key={platform.id}
                    onClick={() => {
                      setSearchParams(prev => ({
                        ...prev,
                        platforms: prev.platforms.includes(platform.id)
                          ? prev.platforms.filter(p => p !== platform.id)
                          : [...prev.platforms, platform.id]
                      }));
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm transition-colors ${
                      searchParams.platforms.includes(platform.id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {platform.icon} {platform.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Locations */}
            <div>
              <label className="block text-xs lg:text-sm font-medium text-slate-400 mb-2">Locations</label>
              <input
                type="text"
                placeholder="e.g., Mumbai, Bangalore, Remote"
                value={searchParams.locations.join(', ')}
                onChange={(e) => setSearchParams(prev => ({
                  ...prev,
                  locations: e.target.value.split(',').map(loc => loc.trim()).filter(Boolean)
                }))}
                className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 text-sm lg:text-base"
              />
            </div>

            {/* Target Roles */}
            <div>
              <label className="block text-xs lg:text-sm font-medium text-slate-400 mb-2">Target Roles</label>
              <input
                type="text"
                placeholder="e.g., Frontend, Backend, Full Stack"
                value={searchParams.targetRoles.join(', ')}
                onChange={(e) => setSearchParams(prev => ({
                  ...prev,
                  targetRoles: e.target.value.split(',').map(role => role.trim()).filter(Boolean)
                }))}
                className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 text-sm lg:text-base"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="px-4 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg lg:text-xl font-bold text-white">
            {jobs.length > 0 ? `Found ${jobs.length} Jobs` : 'Recent Jobs'}
          </h2>
          {jobs.length > 0 && (
            <button className="text-blue-400 hover:text-blue-300 text-sm lg:text-base">
              Clear All
            </button>
          )}
        </div>

        {jobs.length === 0 ? (
          <div className="bg-slate-900 rounded-xl lg:rounded-2xl border border-white/10 p-8 lg:p-12 text-center">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 lg:w-10 lg:h-10 text-slate-400" />
            </div>
            <h3 className="text-lg lg:text-xl font-bold text-white mb-2">No Jobs Found</h3>
            <p className="text-slate-400 text-sm lg:text-base mb-6">
              Start by searching for jobs with keywords and filters above
            </p>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium text-sm lg:text-base inline-flex items-center gap-2"
            >
              <Rocket className="w-4 h-4" />
              Find Jobs
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {jobs.map(job => (
              <div key={job.id} className="bg-slate-900 rounded-xl lg:rounded-2xl border border-white/10 p-4 lg:p-6 hover:border-blue-500/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-sm lg:text-base mb-1">{job.title}</h3>
                    <p className="text-slate-400 text-xs lg:text-sm mb-2">{job.company}</p>
                    <div className="flex items-center gap-2 text-xs lg:text-sm text-slate-500">
                      <span>{job.location}</span>
                      <span>•</span>
                      <span>{job.type}</span>
                    </div>
                  </div>
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                    <span className="text-lg">{PLATFORMS.find(p => p.id === job.platform)?.icon}</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1 lg:gap-2 mb-4">
                  {job.skills?.slice(0, 3).map(skill => (
                    <span key={skill} className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs">
                      {skill}
                    </span>
                  ))}
                  {job.skills?.length > 3 && (
                    <span className="px-2 py-1 bg-slate-800 text-slate-500 rounded text-xs">
                      +{job.skills.length - 3}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs lg:text-sm text-slate-500">
                    {new Date(job.postedDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-xs lg:text-sm">
                      Save
                    </button>
                    <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-xs lg:text-sm">
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom padding */}
      <div className="h-8 lg:h-12"></div>
    </div>
  );
}
