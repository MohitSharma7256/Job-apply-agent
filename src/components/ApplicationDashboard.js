import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Calendar, Clock, TrendingUp, Users, Target,
  Filter, Search, Download, RefreshCw, Bell, ChevronDown,
  ChevronUp, Eye, Edit2, Trash2, Plus, CheckCircle, XCircle,
  AlertCircle, Info, Star, MessageSquare, Phone, Video,
  Award, FileText, Settings, ArrowUpRight, ArrowDownRight,
  Minus, BarChart3, PieChart, Activity, Zap
} from 'lucide-react';

const ApplicationDashboard = ({ userId }) => {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    status: 'all',
    platform: 'all',
    priority: 'all',
    dateRange: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [expandedApplications, setExpandedApplications] = useState(new Set());

  useEffect(() => {
    fetchApplications();
    fetchStats();
  }, [userId, filters, sortBy, sortOrder]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/applications/user/${userId}?${new URLSearchParams({
        status: filters.status !== 'all' ? filters.status : '',
        platform: filters.platform !== 'all' ? filters.platform : '',
        priority: filters.priority !== 'all' ? filters.priority : '',
        sortBy,
        sortOrder
      })}`, {
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

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/applications/stats/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'draft': 'text-gray-400',
      'pending_approval': 'text-yellow-400',
      'approved': 'text-blue-400',
      'submitted': 'text-green-400',
      'under_review': 'text-purple-400',
      'interview_scheduled': 'text-indigo-400',
      'interview_completed': 'text-cyan-400',
      'offer_received': 'text-emerald-400',
      'offer_accepted': 'text-green-500',
      'offer_declined': 'text-orange-400',
      'rejected': 'text-red-400',
      'withdrawn': 'text-gray-500',
      'expired': 'text-red-500'
    };
    return colors[status] || 'text-gray-400';
  };

  const getStatusBgColor = (status) => {
    const colors = {
      'draft': 'bg-gray-500/10 border-gray-500/20',
      'pending_approval': 'bg-yellow-500/10 border-yellow-500/20',
      'approved': 'bg-blue-500/10 border-blue-500/20',
      'submitted': 'bg-green-500/10 border-green-500/20',
      'under_review': 'bg-purple-500/10 border-purple-500/20',
      'interview_scheduled': 'bg-indigo-500/10 border-indigo-500/20',
      'interview_completed': 'bg-cyan-500/10 border-cyan-500/20',
      'offer_received': 'bg-emerald-500/10 border-emerald-500/20',
      'offer_accepted': 'bg-green-500/10 border-green-500/20',
      'offer_declined': 'bg-orange-500/10 border-orange-500/20',
      'rejected': 'bg-red-500/10 border-red-500/20',
      'withdrawn': 'bg-gray-500/10 border-gray-500/20',
      'expired': 'bg-red-500/10 border-red-500/20'
    };
    return colors[status] || 'bg-gray-500/10 border-gray-500/20';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'urgent': 'text-red-500',
      'high': 'text-orange-500',
      'medium': 'text-yellow-500',
      'low': 'text-green-500'
    };
    return colors[priority] || 'text-gray-400';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
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

  const toggleApplicationExpansion = (applicationId) => {
    const newExpanded = new Set(expandedApplications);
    if (newExpanded.has(applicationId)) {
      newExpanded.delete(applicationId);
    } else {
      newExpanded.add(applicationId);
    }
    setExpandedApplications(newExpanded);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'applications', label: 'Applications', icon: Briefcase },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'timeline', label: 'Timeline', icon: Activity }
  ];

  const filteredApplications = applications.filter(app => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        app.jobInfo.title.toLowerCase().includes(searchLower) ||
        app.jobInfo.company.toLowerCase().includes(searchLower) ||
        app.platform.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (loading && !applications.length) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-400 mr-2" />
        <span className="text-gray-400">Loading applications...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Application Dashboard</h1>
          <p className="text-gray-400">Track and manage your job applications</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchApplications}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5 text-gray-400" />
          </button>
          
          <button
            onClick={() => {/* Export functionality */}}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            title="Export"
          >
            <Download className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-white/10">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? 'border-blue-500 text-blue-400' 
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab stats={stats} />
      )}
      
      {activeTab === 'applications' && (
        <ApplicationsTab
          applications={filteredApplications}
          stats={stats}
          loading={loading}
          filters={filters}
          setFilters={setFilters}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          expandedApplications={expandedApplications}
          toggleApplicationExpansion={toggleApplicationExpansion}
          getStatusColor={getStatusColor}
          getStatusBgColor={getStatusBgColor}
          getPriorityColor={getPriorityColor}
          getScoreColor={getScoreColor}
          formatTimeAgo={formatTimeAgo}
        />
      )}
      
      {activeTab === 'analytics' && (
        <AnalyticsTab stats={stats} applications={applications} />
      )}
      
      {activeTab === 'timeline' && (
        <TimelineTab applications={applications} />
      )}
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ stats }) => {
  if (!stats) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Applications',
      value: stats.total,
      icon: Briefcase,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Response Rate',
      value: `${stats.responseRate}%`,
      icon: MessageSquare,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Interview Rate',
      value: `${stats.interviewRate}%`,
      icon: Users,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: 'Offer Rate',
      value: `${stats.offerRate}%`,
      icon: Award,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`p-6 rounded-xl ${stat.bgColor} border border-white/10 backdrop-blur-xl`}>
              <div className="flex items-center justify-between mb-4">
                <Icon className={`w-8 h-8 ${stat.color}`} />
                <span className={`text-2xl font-bold text-white`}>{stat.value}</span>
              </div>
              <p className="text-gray-400 text-sm">{stat.title}</p>
            </div>
          );
        })}
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <h3 className="text-lg font-semibold text-white mb-4">Application Status</h3>
          <div className="space-y-3">
            {Object.entries(stats.byStatus || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-gray-400 capitalize">{status.replace('_', ' ')}</span>
                <span className="text-white font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Average Match Score</span>
              <span className="text-green-400 font-medium">{stats.averageMatchScore}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Average ATS Score</span>
              <span className="text-blue-400 font-medium">{stats.averageAtsScore}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Interactions</span>
              <span className="text-purple-400 font-medium">{stats.totalInteractions}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Applications Tab Component
const ApplicationsTab = ({
  applications,
  stats,
  loading,
  filters,
  setFilters,
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  expandedApplications,
  toggleApplicationExpansion,
  getStatusColor,
  getStatusBgColor,
  getPriorityColor,
  getScoreColor,
  formatTimeAgo
}) => {
  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4">
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
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="px-4 py-2 bg-black/40 border border-white/10 rounded-lg outline-none focus:border-blue-500/50 text-white"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="interview_scheduled">Interview</option>
            <option value="offer_received">Offer</option>
            <option value="rejected">Rejected</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-black/40 border border-white/10 rounded-lg outline-none focus:border-blue-500/50 text-white"
          >
            <option value="createdAt">Created</option>
            <option value="updatedAt">Updated</option>
            <option value="matchScore">Match Score</option>
            <option value="priority">Priority</option>
          </select>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            {sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {applications.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Applications Found</h3>
            <p className="text-gray-400">Start applying to jobs to see them here</p>
          </div>
        ) : (
          applications.map((application) => {
            const isExpanded = expandedApplications.has(application.id);
            
            return (
              <div
                key={application.id}
                className="rounded-xl border backdrop-blur-xl transition-all bg-white/5 border-white/10"
              >
                {/* Application Header */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-white">{application.jobInfo.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBgColor(application.status)} ${getStatusColor(application.status)}`}>
                          {application.status.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(application.priority)} bg-gray-500/10`}>
                          {application.priority}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-400 mb-3">
                        <span className="flex items-center">
                          <Briefcase className="w-3 h-3 mr-1" />
                          {application.jobInfo.company}
                        </span>
                        <span className="flex items-center">
                          <Target className="w-3 h-3 mr-1" />
                          {application.platform}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatTimeAgo(application.createdAt)}
                        </span>
                      </div>

                      {/* Quality Scores */}
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Target className="w-4 h-4 text-blue-400" />
                          <span className="text-sm text-gray-400">Match:</span>
                          <span className={`text-sm font-bold ${getScoreColor(application.applicationData.matchScore)}`}>
                            {application.applicationData.matchScore}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <FileText className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-gray-400">ATS:</span>
                          <span className={`text-sm font-bold ${getScoreColor(application.applicationData.atsScore)}`}>
                            {application.applicationData.atsScore}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <AlertCircle className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm text-gray-400">Risk:</span>
                          <span className={`text-sm font-bold ${getScoreColor(100 - application.applicationData.riskFlags.length * 10)}`}>
                            {application.applicationData.riskFlags.length}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => toggleApplicationExpansion(application.id)}
                      className="p-2 rounded hover:bg-white/10 transition-colors ml-4"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                      {/* Application Details */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-400 mb-3">Application Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Application ID:</span>
                            <span className="text-white">{application.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Submitted:</span>
                            <span className="text-white">
                              {application.submissionData.submittedAt 
                                ? new Date(application.submissionData.submittedAt).toLocaleDateString()
                                : 'Not submitted'
                              }
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Platform ID:</span>
                            <span className="text-white">
                              {application.submissionData.platformApplicationId || 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Confirmation:</span>
                            <span className="text-white">
                              {application.submissionData.confirmationNumber || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Job Details */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-400 mb-3">Job Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Location:</span>
                            <span className="text-white">{application.jobInfo.location}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Type:</span>
                            <span className="text-white capitalize">{application.jobInfo.jobType.replace('-', ' ')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Remote:</span>
                            <span className="text-white">{application.jobInfo.remote ? 'Yes' : 'No'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Salary:</span>
                            <span className="text-white">
                              {application.jobInfo.salary.min 
                                ? `$${application.jobInfo.salary.min.toLocaleString()}`
                                : 'Not specified'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Preview */}
                    {application.timeline && application.timeline.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-semibold text-gray-400 mb-3">Recent Activity</h4>
                        <div className="space-y-2">
                          {application.timeline.slice(-3).map((event, index) => (
                            <div key={index} className="flex items-center space-x-3 text-sm">
                              <div className={`w-2 h-2 rounded-full ${
                                event.actor === 'user' ? 'bg-blue-400' :
                                event.actor === 'system' ? 'bg-gray-400' :
                                'bg-green-400'
                              }`} />
                              <span className="text-gray-400">{formatTimeAgo(event.timestamp)}</span>
                              <span className="text-white">{event.details}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center space-x-2 mt-6">
                      <button className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm">
                        <Eye className="w-3 h-3 inline mr-1" />
                        View Details
                      </button>
                      <button className="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors text-sm">
                        <Edit2 className="w-3 h-3 inline mr-1" />
                        Add Note
                      </button>
                      <button className="px-3 py-1 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors text-sm">
                        <MessageSquare className="w-3 h-3 inline mr-1" />
                        Update Status
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// Analytics Tab Component
const AnalyticsTab = ({ stats, applications }) => {
  if (!stats) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <h3 className="text-lg font-semibold text-white mb-4">Conversion Funnel</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Applied</span>
              <span className="text-white font-medium">{stats.total}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '100%' }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Screened</span>
              <span className="text-white font-medium">{Math.round(stats.total * 0.7)}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: '70%' }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Interviewed</span>
              <span className="text-white font-medium">{Math.round(stats.total * stats.interviewRate / 100)}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${stats.interviewRate}%` }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Offered</span>
              <span className="text-white font-medium">{Math.round(stats.total * stats.offerRate / 100)}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${stats.offerRate}%` }}></div>
            </div>
          </div>
        </div>

        {/* Platform Performance */}
        <div className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <h3 className="text-lg font-semibold text-white mb-4">Platform Performance</h3>
          <div className="space-y-3">
            {Object.entries(stats.byPlatform || {}).map(([platform, count]) => (
              <div key={platform} className="flex items-center justify-between">
                <span className="text-gray-400 capitalize">{platform}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-medium">{count}</span>
                  <div className="w-20 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(count / stats.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
        <h3 className="text-lg font-semibold text-white mb-4">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">{stats.responseRate}%</div>
            <p className="text-gray-400 text-sm">Response Rate</p>
            <p className="text-xs text-gray-500 mt-1">Above industry average</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">{stats.interviewRate}%</div>
            <p className="text-gray-400 text-sm">Interview Rate</p>
            <p className="text-xs text-gray-500 mt-1">Good conversion</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-400 mb-2">{stats.offerRate}%</div>
            <p className="text-gray-400 text-sm">Offer Rate</p>
            <p className="text-xs text-gray-500 mt-1">Excellent performance</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Timeline Tab Component
const TimelineTab = ({ applications }) => {
  const allEvents = applications
    .filter(app => app.timeline && app.timeline.length > 0)
    .flatMap(app => 
      app.timeline.map(event => ({
        ...event,
        applicationId: app.id,
        jobTitle: app.jobInfo.title,
        company: app.jobInfo.company,
        platform: app.platform
      }))
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {allEvents.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Activity Yet</h3>
            <p className="text-gray-400">Your application timeline will appear here</p>
          </div>
        ) : (
          allEvents.map((event, index) => (
            <div key={`${event.applicationId}-${index}`} className="flex items-start space-x-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className={`w-3 h-3 rounded-full mt-1 ${
                event.actor === 'user' ? 'bg-blue-400' :
                event.actor === 'system' ? 'bg-gray-400' :
                'bg-green-400'
              }`} />
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-white">{event.details}</h4>
                  <span className="text-sm text-gray-400">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span>{event.jobTitle}</span>
                  <span>•</span>
                  <span>{event.company}</span>
                  <span>•</span>
                  <span className="capitalize">{event.platform}</span>
                </div>
                
                <div className="flex items-center space-x-2 mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    event.actor === 'user' ? 'bg-blue-500/20 text-blue-400' :
                    event.actor === 'system' ? 'bg-gray-500/20 text-gray-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {event.actor}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400`}>
                    {event.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ApplicationDashboard;
