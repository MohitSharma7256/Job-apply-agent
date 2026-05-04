import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, XCircle, Clock, AlertTriangle, Eye, EyeOff,
  ChevronDown, ChevronUp, Search, Filter, Calendar, User,
  Building, Briefcase, Star, Shield, Zap, Target,
  CheckSquare, Square, X, RefreshCw, Download,
  Pause, Play, Trash2, Archive, MoreVertical
} from 'lucide-react';

const ApprovalQueue = ({ 
  userId, 
  onApprove, 
  onReject, 
  onSnooze,
  onBulkApprove,
  onBulkReject,
  onBulkSnooze,
  showMetadata = true,
  compact = false
}) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedApplications, setSelectedApplications] = useState(new Set());
  const [expandedApplications, setExpandedApplications] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingApp, setRejectingApp] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, [userId]);

  useEffect(() => {
    if (selectedApplications.size > 0) {
      setShowBulkActions(true);
    } else {
      setShowBulkActions(false);
    }
  }, [selectedApplications]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/orchestration/apply/pending?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setApplications(data.data.applications || []);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (applicationId) => {
    try {
      await onApprove?.(applicationId, 'Approved by user');
      setApplications(prev => prev.filter(app => app.applicationId !== applicationId));
      setSelectedApplications(prev => {
        const newSet = new Set(prev);
        newSet.delete(applicationId);
        return newSet;
      });
    } catch (error) {
      console.error('Failed to approve application:', error);
    }
  };

  const handleReject = async (applicationId, reason) => {
    try {
      await onReject?.(applicationId, reason);
      setApplications(prev => prev.filter(app => app.applicationId !== applicationId));
      setSelectedApplications(prev => {
        const newSet = new Set(prev);
        newSet.delete(applicationId);
        return newSet;
      });
      setShowRejectModal(false);
      setRejectingApp(null);
      setRejectReason('');
    } catch (error) {
      console.error('Failed to reject application:', error);
    }
  };

  const handleSnooze = async (applicationId, hours = 24) => {
    try {
      await onSnooze?.(applicationId, hours);
      setApplications(prev => prev.filter(app => app.applicationId !== applicationId));
      setSelectedApplications(prev => {
        const newSet = new Set(prev);
        newSet.delete(applicationId);
        return newSet;
      });
    } catch (error) {
      console.error('Failed to snooze application:', error);
    }
  };

  const handleBulkApprove = async () => {
    try {
      const applicationIds = Array.from(selectedApplications);
      await onBulkApprove?.(applicationIds, 'Bulk approved by user');
      setApplications(prev => prev.filter(app => !selectedApplications.has(app.applicationId)));
      setSelectedApplications(new Set());
    } catch (error) {
      console.error('Failed to bulk approve:', error);
    }
  };

  const handleBulkReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      const applicationIds = Array.from(selectedApplications);
      await onBulkReject?.(applicationIds, rejectReason);
      setApplications(prev => prev.filter(app => !selectedApplications.has(app.applicationId)));
      setSelectedApplications(new Set());
      setRejectReason('');
    } catch (error) {
      console.error('Failed to bulk reject:', error);
    }
  };

  const handleBulkSnooze = async (hours = 24) => {
    try {
      const applicationIds = Array.from(selectedApplications);
      await onBulkSnooze?.(applicationIds, hours);
      setApplications(prev => prev.filter(app => !selectedApplications.has(app.applicationId)));
      setSelectedApplications(new Set());
    } catch (error) {
      console.error('Failed to bulk snooze:', error);
    }
  };

  const toggleApplicationSelection = (applicationId) => {
    const newSelected = new Set(selectedApplications);
    if (newSelected.has(applicationId)) {
      newSelected.delete(applicationId);
    } else {
      newSelected.add(applicationId);
    }
    setSelectedApplications(newSelected);
  };

  const toggleApplicationExpansion = (applicationId) => {
    const newExpanded = new Set(expandedApplications);
    if (newExpanded.has(applicationId)) {
      newExpanded.delete(applicationId);
    } else {
      newExpanded.add(applicationId);
    }
    setExpandedApplications(newExpanded);
  };

  const selectAllApplications = () => {
    if (selectedApplications.size === filteredApplications.length) {
      setSelectedApplications(new Set());
    } else {
      setSelectedApplications(new Set(filteredApplications.map(app => app.applicationId)));
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-500/10 border-green-500/20';
    if (score >= 60) return 'bg-yellow-500/10 border-yellow-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const getTimeUntilExpiration = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours <= 0) {
      return { text: 'Expired', color: 'text-red-500' };
    } else if (diffHours <= 2) {
      return { text: `${diffHours}h left`, color: 'text-orange-500' };
    } else if (diffHours <= 24) {
      return { text: `${diffHours}h left`, color: 'text-yellow-500' };
    } else {
      return { text: `${Math.floor(diffHours / 24)}d left`, color: 'text-green-500' };
    }
  };

  // Filter and sort applications
  const filteredApplications = applications
    .filter(app => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          app.jobTitle.toLowerCase().includes(searchLower) ||
          app.company.toLowerCase().includes(searchLower) ||
          app.platform.toLowerCase().includes(searchLower)
        );
      }
      return true;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'expiresAt':
          aValue = new Date(a.expiresAt).getTime();
          bValue = new Date(b.expiresAt).getTime();
          break;
        case 'matchScore':
          aValue = a.qualityScores.match;
          bValue = b.qualityScores.match;
          break;
        case 'atsScore':
          aValue = a.qualityScores.ats;
          bValue = b.qualityScores.ats;
          break;
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
      }

      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-400 mr-2" />
        <span className="text-gray-400">Loading applications...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Today&apos;s Approvals</h2>
          <p className="text-gray-400 mt-1">
            {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''} pending review
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchApplications}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search applications..."
            className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg outline-none focus:border-blue-500/50 text-white"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-black/40 border border-white/10 rounded-lg outline-none focus:border-blue-500/50 text-white"
          >
            <option value="createdAt">Created Time</option>
            <option value="expiresAt">Expires At</option>
            <option value="matchScore">Match Score</option>
            <option value="atsScore">ATS Score</option>
          </select>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            {sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {showBulkActions && (
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-blue-400">
                {selectedApplications.size} application{selectedApplications.size !== 1 ? 's' : ''} selected
              </span>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={selectAllApplications}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  {selectedApplications.size === filteredApplications.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBulkApprove}
                className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
              >
                Approve All
              </button>
              
              <button
                onClick={() => setShowRejectModal(true)}
                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              >
                Reject All
              </button>
              
              <button
                onClick={() => handleBulkSnooze(24)}
                className="px-4 py-2 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
              >
                Snooze (24h)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">All Caught Up!</h3>
            <p className="text-gray-400">No applications pending approval</p>
          </div>
        ) : (
          filteredApplications.map((application) => {
            const isSelected = selectedApplications.has(application.applicationId);
            const isExpanded = expandedApplications.has(application.applicationId);
            const expiration = getTimeUntilExpiration(application.expiresAt);

            return (
              <div
                key={application.applicationId}
                className={`rounded-xl border backdrop-blur-xl transition-all ${
                  isSelected ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-white/10'
                }`}
              >
                {/* Application Header */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleApplicationSelection(application.applicationId)}
                        className="mt-1 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500/50"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-white">{application.jobTitle}</h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-400">
                              <Building className="w-3 h-3" />
                              <span>{application.company}</span>
                              <span>•</span>
                              <Briefcase className="w-3 h-3" />
                              <span className="capitalize">{application.platform}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm font-medium ${expiration.color}`}>
                              <Clock className="w-3 h-3 inline mr-1" />
                              {expiration.text}
                            </span>
                          </div>
                        </div>

                        {/* Quality Scores */}
                        <div className="flex items-center space-x-4 mb-3">
                          <div className="flex items-center space-x-1">
                            <Target className="w-4 h-4 text-blue-400" />
                            <span className="text-sm text-gray-400">Match:</span>
                            <span className={`text-sm font-bold ${getScoreColor(application.qualityScores.match)}`}>
                              {application.qualityScores.match}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Shield className="w-4 h-4 text-green-400" />
                            <span className="text-sm text-gray-400">ATS:</span>
                            <span className={`text-sm font-bold ${getScoreColor(application.qualityScores.ats)}`}>
                              {application.qualityScores.ats}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <AlertTriangle className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm text-gray-400">Risk:</span>
                            <span className="text-sm font-bold text-yellow-400">
                              {application.qualityScores.risk}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-400">
                            Created {formatTimeAgo(application.createdAt)}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleApprove(application.applicationId)}
                              className="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors text-sm"
                            >
                              <CheckCircle className="w-3 h-3 inline mr-1" />
                              Approve
                            </button>
                            
                            <button
                              onClick={() => {
                                setRejectingApp(application);
                                setShowRejectModal(true);
                              }}
                              className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm"
                            >
                              <XCircle className="w-3 h-3 inline mr-1" />
                              Reject
                            </button>
                            
                            <button
                              onClick={() => handleSnooze(application.applicationId, 24)}
                              className="px-3 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors text-sm"
                            >
                              <Pause className="w-3 h-3 inline mr-1" />
                              Snooze
                            </button>
                            
                            <button
                              onClick={() => toggleApplicationExpansion(application.applicationId)}
                              className="p-1 rounded hover:bg-white/10 transition-colors"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/10">
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-400 mb-2">Application Details</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Application ID:</span>
                            <span className="text-white">{application.applicationId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Created:</span>
                            <span className="text-white">{new Date(application.createdAt).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Expires:</span>
                            <span className="text-white">{new Date(application.expiresAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-semibold text-gray-400 mb-2">Quality Assessment</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Match Score:</span>
                            <div className={`px-2 py-1 rounded ${getScoreBgColor(application.qualityScores.match)}`}>
                              <span className={`text-sm font-bold ${getScoreColor(application.qualityScores.match)}`}>
                                {application.qualityScores.match}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">ATS Score:</span>
                            <div className={`px-2 py-1 rounded ${getScoreBgColor(application.qualityScores.ats)}`}>
                              <span className={`text-sm font-bold ${getScoreColor(application.qualityScores.ats)}`}>
                                {application.qualityScores.ats}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Risk Flags:</span>
                            <div className="px-2 py-1 rounded bg-yellow-500/10 border border-yellow-500/20">
                              <span className="text-sm font-bold text-yellow-400">
                                {application.qualityScores.risk}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-xl p-6 max-w-md w-full border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">
              {rejectingApp ? 'Reject Application' : 'Reject All Applications'}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Reason for rejection
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg outline-none focus:border-blue-500/50 text-white resize-none"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectingApp(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={() => {
                  if (rejectingApp) {
                    handleReject(rejectingApp.applicationId, rejectReason);
                  } else {
                    handleBulkReject();
                  }
                }}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalQueue;
