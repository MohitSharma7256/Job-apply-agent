import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Filter, TrendingUp, Users, Clock, CheckCircle, 
  AlertTriangle, Star, Shield, BarChart3, Target,
  RefreshCw, Settings, Download, Eye, EyeOff,
  ChevronDown, ChevronUp, Plus, X
} from 'lucide-react';
import MatchScoreCard from './MatchScoreCard.js';

const SmartJobDashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    keywords: '',
    locations: ['Remote'],
    platforms: ['linkedin', 'naukri'],
    minScore: 0,
    maxScore: 100
  });
  const [filters, setFilters] = useState({
    showDisqualified: false,
    showRiskFlags: false,
    minConfidence: 'low',
    sortBy: 'score',
    sortOrder: 'desc'
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [batchScoring, setBatchScoring] = useState(false);
  const [scoringWeights, setScoringWeights] = useState(null);

  // Fetch user profile on mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Filter jobs when search params or filters change
  useEffect(() => {
    filterJobs();
  }, [jobs, searchParams, filters]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchParams.keywords.trim()) {
      alert('Please enter keywords to search');
      return;
    }

    setLoading(true);
    setBatchScoring(true);
    
    try {
      // First, search for jobs
      const searchResponse = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          keywords: searchParams.keywords,
          locations: searchParams.locations,
          platforms: searchParams.platforms,
          maxResults: 50,
          profile: userProfile
        })
      });

      if (!searchResponse.ok) {
        throw new Error('Search failed');
      }

      const searchResult = await searchResponse.json();
      const foundJobs = searchResult.data.jobs || [];

      // Then, batch score all jobs
      if (foundJobs.length > 0 && userProfile) {
        const batchResponse = await fetch('/api/intelligence/batch-score', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            userProfile,
            jobPostings: foundJobs,
            weights: scoringWeights
          })
        });

        if (!batchResponse.ok) {
          throw new Error('Batch scoring failed');
        }

        const batchResult = await batchResponse.json();
        
        // Combine job data with scores
        const scoredJobs = foundJobs.map(job => {
          const scoreData = batchResult.data.jobs.find(s => s.jobId === job.id);
          return {
            ...job,
            matchScore: scoreData?.score || 0,
            confidence: scoreData?.confidence || 'low',
            riskFlags: scoreData?.riskFlags || [],
            disqualified: scoreData?.disqualified || false,
            disqualifiedReason: scoreData?.reason
          };
        });

        setJobs(scoredJobs);
      } else {
        setJobs([]);
      }
    } catch (error) {
      console.error('Search failed:', error);
      alert('Search failed. Please try again.');
    } finally {
      setLoading(false);
      setBatchScoring(false);
    }
  };

  const filterJobs = useCallback(() => {
    let filtered = [...jobs];

    // Apply score range filter
    filtered = filtered.filter(job => 
      job.matchScore >= searchParams.minScore && job.matchScore <= searchParams.maxScore
    );

    // Apply disqualified filter
    if (!filters.showDisqualified) {
      filtered = filtered.filter(job => !job.disqualified);
    }

    // Apply risk flag filter
    if (!filters.showRiskFlags) {
      filtered = filtered.filter(job => job.riskFlags.length === 0);
    }

    // Apply confidence filter
    const confidenceLevels = { low: 0, medium: 1, high: 2 };
    const minConfidenceLevel = confidenceLevels[filters.minConfidence] || 0;
    filtered = filtered.filter(job => {
      const jobConfidenceLevel = confidenceLevels[job.confidence] || 0;
      return jobConfidenceLevel >= minConfidenceLevel;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'score':
          aValue = a.matchScore;
          bValue = b.matchScore;
          break;
        case 'confidence':
          aValue = confidenceLevels[a.confidence] || 0;
          bValue = confidenceLevels[b.confidence] || 0;
          break;
        case 'risk':
          aValue = a.riskFlags.length;
          bValue = b.riskFlags.length;
          break;
        case 'date':
          aValue = new Date(a.postedDate).getTime();
          bValue = new Date(b.postedDate).getTime();
          break;
        default:
          aValue = a.matchScore;
          bValue = b.matchScore;
      }

      return filters.sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

    setFilteredJobs(filtered);
  }, [jobs, searchParams, filters]);

  const getScoreDistribution = () => {
    const distribution = {
      high: filteredJobs.filter(job => job.matchScore >= 80).length,
      medium: filteredJobs.filter(job => job.matchScore >= 60 && job.matchScore < 80).length,
      low: filteredJobs.filter(job => job.matchScore >= 40 && job.matchScore < 60).length,
      poor: filteredJobs.filter(job => job.matchScore < 40).length
    };
    
    return distribution;
  };

  const getAverageScore = () => {
    if (filteredJobs.length === 0) return 0;
    const sum = filteredJobs.reduce((acc, job) => acc + job.matchScore, 0);
    return (sum / filteredJobs.length).toFixed(1);
  };

  const getTopPlatforms = () => {
    const platformCounts = {};
    filteredJobs.forEach(job => {
      platformCounts[job.platform] = (platformCounts[job.platform] || 0) + 1;
    });
    
    return Object.entries(platformCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([platform, count]) => ({ platform, count }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Smart Job Matching
          </h1>
          <p className="text-slate-500 mt-2">
            AI-powered job relevance scoring with personalized recommendations
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowStats(!showStats)}
            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            title="Toggle Statistics"
          >
            <BarChart3 className="w-5 h-5 text-slate-400" />
          </button>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            title="Advanced Filters"
          >
            <Settings className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Statistics Panel */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Total Jobs</span>
              <Target className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">{filteredJobs.length}</div>
            <div className="text-xs text-slate-500">Matched positions</div>
          </div>
          
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Avg Score</span>
              <Star className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-white">{getAverageScore()}</div>
            <div className="text-xs text-slate-500">Match quality</div>
          </div>
          
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">High Quality</span>
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white">{getScoreDistribution().high}</div>
            <div className="text-xs text-slate-500">80+ score</div>
          </div>
          
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Low Risk</span>
              <Shield className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {filteredJobs.filter(job => job.riskFlags.length === 0).length}
            </div>
            <div className="text-xs text-slate-500">No risk flags</div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {/* Search Panel */}
        <div className="lg:col-span-1">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Search className="w-5 h-5 text-blue-400 mr-2" />
              Smart Search
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
                  Locations
                </label>
                <div className="space-y-2">
                  {['Remote', 'San Francisco', 'New York', 'Bangalore', 'London'].map(location => (
                    <label key={location} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={searchParams.locations.includes(location)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSearchParams(prev => ({ ...prev, locations: [...prev.locations, location] }));
                          } else {
                            setSearchParams(prev => ({ ...prev, locations: prev.locations.filter(l => l !== location) }));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{location}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                  Platforms
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['linkedin', 'naukri', 'indeed', 'glassdoor'].map(platform => (
                    <label key={platform} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={searchParams.platforms.includes(platform)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSearchParams(prev => ({ ...prev, platforms: [...prev.platforms, platform] }));
                          } else {
                            setSearchParams(prev => ({ ...prev, platforms: prev.platforms.filter(p => p !== platform) }));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm capitalize">{platform}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                  Score Range: {searchParams.minScore} - {searchParams.maxScore}
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={searchParams.maxScore}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, maxScore: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>0</span>
                    <span>{searchParams.maxScore}</span>
                    <span>100</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSearch}
                disabled={loading || !userProfile || batchScoring}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                {loading ? 'Scoring...' : 'Smart Search'}
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="lg:col-span-3">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <Filter className="w-5 h-5 text-blue-400 mr-2" />
                Advanced Filters
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2">Show Disqualified</label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.showDisqualified}
                      onChange={(e) => setFilters(prev => ({ ...prev, showDisqualified: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-slate-400">Include disqualified jobs</span>
                  </label>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2">Show Risk Flags</label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.showRiskFlags}
                      onChange={(e) => setFilters(prev => ({ ...prev, showRiskFlags: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-slate-400">Include jobs with risk flags</span>
                  </label>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2">Min Confidence</label>
                  <select
                    value={filters.minConfidence}
                    onChange={(e) => setFilters(prev => ({ ...prev, minConfidence: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2">Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="score">Match Score</option>
                    <option value="confidence">Confidence</option>
                    <option value="risk">Risk Level</option>
                    <option value="date">Posted Date</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2">Sort Order</label>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="desc">Highest First</option>
                    <option value="asc">Lowest First</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results List */}
        <div className="lg:col-span-3">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {filteredJobs.length} Recommended Jobs
            </h2>
            <div className="flex items-center space-x-2 text-sm text-slate-400">
              <span>Avg Score: {getAverageScore()}</span>
              <span>•</span>
              <span>High Quality: {getScoreDistribution().high}</span>
            </div>
          </div>

          <div className="space-y-4">
            {filteredJobs.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No jobs found</h3>
                <p className="text-slate-400 mb-4">
                  Try adjusting your search criteria or filters
                </p>
                <button
                  onClick={() => {
                    setSearchParams(prev => ({ ...prev, minScore: 0, maxScore: 100 }));
                    setFilters(prev => ({ ...prev, showDisqualified: true, showRiskFlags: true }));
                  }}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold transition-all"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              filteredJobs.map((job, index) => (
                <div key={job.id} className="relative">
                  <MatchScoreCard
                    job={job}
                    userProfile={userProfile}
                    showDetails={true}
                    customWeights={scoringWeights}
                  />
                  {index === 0 && (
                    <div className="absolute -top-2 -right-2 px-3 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full">
                      BEST MATCH
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartJobDashboard;
