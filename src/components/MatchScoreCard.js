import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, 
  Info, X, Star, Shield, Clock, MapPin, DollarSign,
  Briefcase, GraduationCap, User, Filter, ChevronDown,
  ChevronUp, Settings, RefreshCw
} from 'lucide-react';

const MatchScoreCard = ({ 
  job, 
  userProfile, 
  onScoreUpdate, 
  showDetails = true,
  customWeights = null 
}) => {
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showExplanations, setShowExplanations] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [weights, setWeights] = useState(customWeights);

  // Calculate match score when component mounts or props change
  useEffect(() => {
    if (job && userProfile) {
      calculateMatchScore();
    }
  }, [job, userProfile, weights]);

  const calculateMatchScore = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/intelligence/match-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userProfile,
          jobPosting: job,
          weights: weights
        })
      });

      if (!response.ok) {
        throw new Error('Failed to calculate match score');
      }

      const data = await response.json();
      setMatchData(data.data);
      
      // Notify parent of score update
      if (onScoreUpdate) {
        onScoreUpdate(job.id, data.data.match.score);
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-500/10 border-green-500/20';
    if (score >= 60) return 'bg-yellow-500/10 border-yellow-500/20';
    if (score >= 40) return 'bg-orange-500/10 border-orange-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  const getConfidenceIcon = (confidence) => {
    switch (confidence) {
      case 'high': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'medium': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'low': return <X className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRiskFlagIcon = (flag) => {
    const icons = {
      'low_skill_match': <Briefcase className="w-3 h-3" />,
      'seniority_mismatch': <User className="w-3 h-3" />,
      'location_mismatch': <MapPin className="w-3 h-3" />,
      'salary_below_expectation': <DollarSign className="w-3 h-3" />,
      'work_authorization_issue': <Shield className="w-3 h-3" />,
      'old_job_posting': <Clock className="w-3 h-3" />,
      'high_competition': <TrendingUp className="w-3 h-3" />
    };
    return icons[flag] || <AlertTriangle className="w-3 h-3" />;
  };

  const getRiskFlagLabel = (flag) => {
    const labels = {
      'low_skill_match': 'Low skill match',
      'seniority_mismatch': 'Seniority mismatch',
      'location_mismatch': 'Location mismatch',
      'salary_below_expectation': 'Salary below expectation',
      'work_authorization_issue': 'Work authorization issue',
      'old_job_posting': 'Old job posting',
      'high_competition': 'High competition'
    };
    return labels[flag] || flag;
  };

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
          <span className="ml-2 text-gray-400">Calculating match score...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 backdrop-blur-xl">
        <div className="flex items-center text-red-400">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <span>Failed to calculate match score: {error}</span>
        </div>
        <button
          onClick={calculateMatchScore}
          className="mt-4 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!matchData) {
    return (
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
        <div className="text-center text-gray-400">
          <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No match score available</p>
        </div>
      </div>
    );
  }

  const { match, factors, explanations, disqualified, disqualifiedReason } = matchData;

  if (disqualified) {
    return (
      <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-red-400">
            <X className="w-5 h-5 mr-2" />
            <span className="font-semibold">Not Recommended</span>
          </div>
        </div>
        <p className="text-red-300 mb-4">{disqualifiedReason}</p>
        <div className="text-sm text-red-400">
          This job doesn't match your preferences or requirements
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
      {/* Header with Score */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className={`px-4 py-2 rounded-xl border ${getScoreBgColor(match.score)}`}>
            <div className="flex items-center">
              <Star className={`w-5 h-5 mr-2 ${getScoreColor(match.score)}`} />
              <span className={`text-2xl font-bold ${getScoreColor(match.score)}`}>
                {match.score}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <div className="flex items-center text-sm">
              {getConfidenceIcon(match.confidence)}
              <span className="ml-1 text-gray-400 capitalize">{match.confidence} confidence</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {showDetails && (
            <>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                title="Scoring Preferences"
              >
                <Settings className="w-4 h-4 text-gray-400" />
              </button>
              <button
                onClick={calculateMatchScore}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                title="Refresh Score"
              >
                <RefreshCw className="w-4 h-4 text-gray-400" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Risk Flags */}
      {match.riskFlags.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {match.riskFlags.map((flag, index) => (
              <div
                key={index}
                className="flex items-center px-3 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm"
              >
                {getRiskFlagIcon(flag)}
                <span className="ml-1">{getRiskFlagLabel(flag)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Explanations */}
      {showDetails && explanations && explanations.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setShowExplanations(!showExplanations)}
            className="flex items-center text-sm text-gray-400 hover:text-white transition-colors mb-2"
          >
            {showExplanations ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
            Why this job is recommended
          </button>
          
          {showExplanations && (
            <div className="space-y-2">
              {explanations.map((explanation, index) => (
                <div key={index} className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-white">{explanation.factor}</span>
                    <span className="text-sm text-gray-400">{explanation.score}%</span>
                  </div>
                  <p className="text-sm text-gray-300">{explanation.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Factor Breakdown */}
      {showDetails && factors && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-400">Score Breakdown</h4>
          {Object.entries(factors).map(([factor, score]) => (
            <div key={factor} className="flex items-center justify-between">
              <span className="text-sm text-gray-300 capitalize">
                {factor.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <div className="flex items-center">
                <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden mr-2">
                  <div 
                    className={`h-full ${getScoreColor(score * 100)}`}
                    style={{ width: `${score * 100}%` }}
                  />
                </div>
                <span className="text-sm text-gray-400 w-10 text-right">
                  {Math.round(score * 100)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Weight Settings */}
      {showDetails && showFilters && (
        <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10">
          <h4 className="text-sm font-semibold text-gray-400 mb-3">Scoring Preferences</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Skill Match</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={weights?.skillOverlap || 0.3}
                onChange={(e) => setWeights({ ...weights, skillOverlap: parseFloat(e.target.value) })}
                className="w-24"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Experience Level</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={weights?.seniorityFit || 0.2}
                onChange={(e) => setWeights({ ...weights, seniorityFit: parseFloat(e.target.value) })}
                className="w-24"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Location</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={weights?.locationFit || 0.15}
                onChange={(e) => setWeights({ ...weights, locationFit: parseFloat(e.target.value) })}
                className="w-24"
              />
            </div>
          </div>
          <button
            onClick={calculateMatchScore}
            className="mt-3 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
          >
            Apply Preferences
          </button>
        </div>
      )}
    </div>
  );
};

export default MatchScoreCard;
