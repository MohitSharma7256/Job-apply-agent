import React, { useState, useEffect } from 'react';
import { SocketProvider, useSocket, useNotifications } from '../hooks/useSocket';
import { JobProgressTracker, JobProgressList } from './JobProgressTracker';
import { NotificationCenter } from './NotificationCenter';
import { 
  Search, Rocket, Brain, Briefcase, TrendingUp, 
  Users, Clock, CheckCircle, AlertCircle, Loader2,
  Activity, Zap, Target, Award
} from 'lucide-react';

const PLATFORMS = [
  { id: "naukri", name: "Naukri.com", icon: "📋", color: "from-blue-500 to-blue-600" },
  { id: "linkedin", name: "LinkedIn", icon: "💼", color: "from-blue-600 to-blue-700" },
  { id: "indeed", name: "Indeed", icon: "✅", color: "from-green-500 to-green-600" },
  { id: "glassdoor", name: "Glassdoor", icon: "💎", color: "from-teal-500 to-teal-600" },
];

export function RealtimeDashboard() {
  const { isConnected, connectionError, jobUpdates, notifications, subscribeToJob } = useSocket();
  const { unreadNotificationsCount } = useNotifications();
  const [activeJobs, setActiveJobs] = useState([]);
  const [searchParams, setSearchParams] = useState({
    keywords: '',
    locations: ['India'],
    platforms: ['linkedin', 'naukri']
  });
  const [isSearching, setIsSearching] = useState(false);
  const [currentJobId, setCurrentJobId] = useState(null);

  // Update active jobs when jobUpdates change
  useEffect(() => {
    const jobs = Object.entries(jobUpdates)
      .filter(([_, update]) => update.status === 'queued' || update.status === 'processing')
      .map(([jobId, update]) => ({ jobId, ...update }));
    
    setActiveJobs(jobs);
  }, [jobUpdates]);

  const handleSearch = async () => {
    if (!searchParams.keywords.trim()) {
      alert('Please enter keywords to search');
      return;
    }

    setIsSearching(true);
    
    try {
      const response = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          keywords: searchParams.keywords,
          locations: searchParams.locations,
          platforms: searchParams.platforms,
          maxResults: 10,
          profile: {
            skills: ['React', 'Node.js', 'TypeScript'],
            experience: 5
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setCurrentJobId(result.data.jobId);
        subscribeToJob(result.data.jobId);
      } else {
        alert('Search failed: ' + result.error?.message);
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleJobCancel = async (jobId) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ action: 'cancel' })
      });

      const result = await response.json();
      
      if (!result.success) {
        alert('Cancel failed: ' + result.error?.message);
      }
    } catch (error) {
      console.error('Cancel error:', error);
      alert('Cancel failed. Please try again.');
    }
  };

  const handleJobRetry = async (jobId) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ action: 'retry' })
      });

      const result = await response.json();
      
      if (!result.success) {
        alert('Retry failed: ' + result.error?.message);
      }
    } catch (error) {
      console.error('Retry error:', error);
      alert('Retry failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Rocket className="w-8 h-8 text-blue-400" />
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                  Job Apply Agent Pro
                </h1>
              </div>
              
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} ${isConnected ? 'animate-pulse' : ''}`} />
                <span className="text-xs text-slate-400">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <NotificationCenter />
            </div>
          </div>
        </div>
      </header>

      {/* Connection Error */}
      {connectionError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400">Connection Error: {connectionError}</span>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Search Panel */}
          <div className="lg:col-span-1">
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-400" />
                Job Search
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                    Keywords
                  </label>
                  <input 
                    type="text"
                    value={searchParams.keywords}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, keywords: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 transition-all text-white"
                    placeholder="React, Node, Remote..."
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                    Platforms
                  </label>
                  <div className="grid grid-cols-2 gap-2">
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
                        className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-xs font-medium ${
                          searchParams.platforms.includes(platform.id)
                            ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                            : 'bg-white/5 border-white/5 hover:border-blue-500/30'
                        }`}
                      >
                        <span>{platform.icon}</span> {platform.name}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={handleSearch}
                  disabled={isSearching || !isConnected}
                  className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
                  {isSearching ? "Searching..." : "Launch Search"}
                </button>
              </div>
            </div>

            {/* Active Jobs */}
            {activeJobs.length > 0 && (
              <div className="mt-6 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  Active Jobs ({activeJobs.length})
                </h3>
                <JobProgressList jobIds={activeJobs.map(job => job.jobId)} />
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Current Job Progress */}
            {currentJobId && (
              <div className="mb-6">
                <JobProgressTracker 
                  jobId={currentJobId}
                  onCancel={handleJobCancel}
                  onRetry={handleJobRetry}
                />
              </div>
            )}

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <Briefcase className="w-5 h-5 text-blue-400" />
                  <span className="text-xs text-slate-500">Total</span>
                </div>
                <div className="text-2xl font-bold text-white">24</div>
                <div className="text-xs text-slate-400">Jobs Found</div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <Target className="w-5 h-5 text-green-400" />
                  <span className="text-xs text-slate-500">Success</span>
                </div>
                <div className="text-2xl font-bold text-white">18</div>
                <div className="text-xs text-slate-400">Applications</div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  <span className="text-xs text-slate-500">Match</span>
                </div>
                <div className="text-2xl font-bold text-white">92%</div>
                <div className="text-xs text-slate-400">Avg Score</div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span className="text-xs text-slate-500">Active</span>
                </div>
                <div className="text-2xl font-bold text-white">{activeJobs.length}</div>
                <div className="text-xs text-slate-400">Jobs Running</div>
              </div>
            </div>

            {/* Recent Notifications */}
            {notifications.length > 0 && (
              <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {notifications.slice(0, 5).map(notification => (
                    <div key={notification.id} className="flex items-start space-x-3 p-3 rounded-lg bg-white/5">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{notification.title}</div>
                        <div className="text-xs text-slate-400">{notification.message}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {new Date(notification.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!currentJobId && activeJobs.length === 0 && notifications.length === 0 && (
              <div className="text-center py-12">
                <Brain className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Ready to find your dream job?</h3>
                <p className="text-slate-400 mb-6">
                  Start a search to see real-time job matching and application tracking
                </p>
                <button
                  onClick={handleSearch}
                  disabled={!isConnected}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold transition-all disabled:opacity-50"
                >
                  Start Your First Search
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Dashboard Component with Socket Provider
export default function Dashboard() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Get token from localStorage or auth context
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    } else {
      // For demo purposes, create a mock token
      const mockToken = 'mock-jwt-token-for-demo';
      localStorage.setItem('token', mockToken);
      setToken(mockToken);
    }
  }, []);

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <SocketProvider token={token}>
      <RealtimeDashboard />
    </SocketProvider>
  );
}
