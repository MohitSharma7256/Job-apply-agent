import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, BarChart3, PieChart, LineChart,
  Calendar, Target, Users, Briefcase, Award, Clock,
  Filter, Download, RefreshCw, Eye, Info, Zap,
  ArrowUpRight, ArrowDownRight, Minus, Activity,
  Mail, Phone, Video, FileText, Star, AlertTriangle
} from 'lucide-react';

const ApplicationAnalytics = ({ userId, applications = [], stats = null }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('conversion');
  const [expandedSections, setExpandedSections] = useState(new Set());

  useEffect(() => {
    if (applications.length > 0) {
      generateAnalytics();
    }
  }, [applications, timeRange]);

  const generateAnalytics = () => {
    setLoading(true);
    
    try {
      const analyticsData = {
        overview: calculateOverview(),
        conversion: calculateConversionMetrics(),
        performance: calculatePerformanceMetrics(),
        trends: calculateTrends(),
        insights: generateInsights(),
        recommendations: generateRecommendations()
      };
      
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to generate analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateOverview = () => {
    const totalApplications = applications.length;
    const submittedApplications = applications.filter(app => app.status !== 'draft').length;
    const activeApplications = applications.filter(app => 
      ['submitted', 'under_review', 'interview_scheduled', 'interview_completed'].includes(app.status)
    ).length;
    const successfulApplications = applications.filter(app => 
      ['offer_received', 'offer_accepted'].includes(app.status)
    ).length;

    return {
      total: totalApplications,
      submitted: submittedApplications,
      active: activeApplications,
      successful: successfulApplications,
      submissionRate: totalApplications > 0 ? Math.round((submittedApplications / totalApplications) * 100) : 0,
      successRate: submittedApplications > 0 ? Math.round((successfulApplications / submittedApplications) * 100) : 0
    };
  };

  const calculateConversionMetrics = () => {
    const submitted = applications.filter(app => app.status !== 'draft');
    const underReview = applications.filter(app => app.status === 'under_review');
    const interviews = applications.filter(app => 
      ['interview_scheduled', 'interview_completed'].includes(app.status)
    );
    const offers = applications.filter(app => 
      ['offer_received', 'offer_accepted'].includes(app.status)
    );

    const submittedCount = submitted.length;
    
    return {
      submitted: submittedCount,
      underReview: underReview.length,
      interviews: interviews.length,
      offers: offers.length,
      reviewRate: submittedCount > 0 ? Math.round((underReview.length / submittedCount) * 100) : 0,
      interviewRate: submittedCount > 0 ? Math.round((interviews.length / submittedCount) * 100) : 0,
      offerRate: submittedCount > 0 ? Math.round((offers.length / submittedCount) * 100) : 0
    };
  };

  const calculatePerformanceMetrics = () => {
    const platformPerformance = {};
    const statusPerformance = {};
    const scorePerformance = {
      match: { total: 0, count: 0 },
      ats: { total: 0, count: 0 }
    };

    applications.forEach(app => {
      // Platform performance
      if (!platformPerformance[app.platform]) {
        platformPerformance[app.platform] = {
          total: 0,
          successful: 0,
          submitted: 0
        };
      }
      platformPerformance[app.platform].total++;
      
      if (['offer_received', 'offer_accepted'].includes(app.status)) {
        platformPerformance[app.platform].successful++;
      }
      
      if (app.status !== 'draft') {
        platformPerformance[app.platform].submitted++;
      }

      // Status performance
      if (!statusPerformance[app.status]) {
        statusPerformance[app.status] = 0;
      }
      statusPerformance[app.status]++;

      // Score performance
      if (app.applicationData) {
        scorePerformance.match.total += app.applicationData.matchScore;
        scorePerformance.match.count++;
        
        if (app.applicationData.atsScore) {
          scorePerformance.ats.total += app.applicationData.atsScore;
          scorePerformance.ats.count++;
        }
      }
    });

    // Calculate success rates by platform
    Object.keys(platformPerformance).forEach(platform => {
      const data = platformPerformance[platform];
      data.successRate = data.submitted > 0 ? Math.round((data.successful / data.submitted) * 100) : 0;
    });

    return {
      platforms: platformPerformance,
      statuses: statusPerformance,
      scores: {
        averageMatch: scorePerformance.match.count > 0 ? Math.round(scorePerformance.match.total / scorePerformance.match.count) : 0,
        averageAts: scorePerformance.ats.count > 0 ? Math.round(scorePerformance.ats.total / scorePerformance.ats.count) : 0
      }
    };
  };

  const calculateTrends = () => {
    const now = new Date();
    const timeRanges = {
      '7d': 7,
      '30d': 30,
      '90d': 90
    };

    const days = timeRanges[timeRange] || 30;
    const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

    const dailyData = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
      const dateStr = date.toISOString().split('T')[0];
      
      const dayApplications = applications.filter(app => {
        const appDate = new Date(app.createdAt).toISOString().split('T')[0];
        return appDate === dateStr;
      });

      dailyData.push({
        date: dateStr,
        applications: dayApplications.length,
        submitted: dayApplications.filter(app => app.status !== 'draft').length,
        interviews: dayApplications.filter(app => 
          ['interview_scheduled', 'interview_completed'].includes(app.status)
        ).length,
        offers: dayApplications.filter(app => 
          ['offer_received', 'offer_accepted'].includes(app.status)
        ).length
      });
    }

    return dailyData;
  };

  const generateInsights = () => {
    const insights = [];

    // Best performing platform
    const platformPerf = calculatePerformanceMetrics().platforms;
    const bestPlatform = Object.entries(platformPerf)
      .sort(([,a], [,b]) => b.successRate - a.successRate)[0];

    if (bestPlatform) {
      insights.push({
        type: 'success',
        title: 'Best Platform',
        description: `${bestPlatform[0]} has your highest success rate (${bestPlatform[1].successRate}%)`,
        icon: TrendingUp,
        color: 'text-green-400'
      });
    }

    // Response time insight
    const avgResponseTime = calculateAverageResponseTime();
    if (avgResponseTime) {
      const responseQuality = avgResponseTime < 72 ? 'excellent' : avgResponseTime < 168 ? 'good' : 'needs_improvement';
      insights.push({
        type: responseQuality === 'excellent' ? 'success' : responseQuality === 'good' ? 'info' : 'warning',
        title: 'Response Time',
        description: `Average response time: ${Math.round(avgResponseTime)} hours`,
        icon: Clock,
        color: responseQuality === 'excellent' ? 'text-green-400' : responseQuality === 'good' ? 'text-blue-400' : 'text-yellow-400'
      });
    }

    // Score correlation
    const scoreCorrelation = calculateScoreCorrelation();
    if (scoreCorrelation > 0.7) {
      insights.push({
        type: 'success',
        title: 'Score Quality',
        description: 'High match scores strongly correlate with success',
        icon: Target,
        color: 'text-green-400'
      });
    }

    // Application frequency
    const applicationFrequency = calculateApplicationFrequency();
    if (applicationFrequency < 3) {
      insights.push({
        type: 'warning',
        title: 'Application Frequency',
        description: 'Consider increasing application rate for better results',
        icon: AlertTriangle,
        color: 'text-yellow-400'
      });
    }

    return insights;
  };

  const generateRecommendations = () => {
    const recommendations = [];

    // Based on performance metrics
    const perf = calculatePerformanceMetrics();
    
    // Platform recommendations
    const lowPerformingPlatforms = Object.entries(perf.platforms)
      .filter(([,data]) => data.successRate < 10)
      .map(([platform]) => platform);

    if (lowPerformingPlatforms.length > 0) {
      recommendations.push({
        type: 'platform',
        priority: 'medium',
        title: 'Optimize Platform Strategy',
        description: `Consider focusing less on: ${lowPerformingPlatforms.join(', ')}`,
        action: 'Adjust platform preferences'
      });
    }

    // Score recommendations
    if (perf.scores.averageMatch < 70) {
      recommendations.push({
        type: 'profile',
        priority: 'high',
        title: 'Improve Profile Quality',
        description: 'Average match score is below optimal',
        action: 'Update skills and experience'
      });
    }

    if (perf.scores.averageAts < 80) {
      recommendations.push({
        type: 'resume',
        priority: 'high',
        title: 'Optimize Resume for ATS',
        description: 'ATS compliance could be improved',
        action: 'Use resume tailoring features'
      });
    }

    // Application timing recommendations
    const timingInsight = getTimingRecommendation();
    if (timingInsight) {
      recommendations.push(timingInsight);
    }

    return recommendations;
  };

  const calculateAverageResponseTime = () => {
    const respondedApplications = applications.filter(app => 
      app.interactions && app.interactions.length > 0 && app.status !== 'draft'
    );

    if (respondedApplications.length === 0) return null;

    const responseTimes = respondedApplications.map(app => {
      const submittedTime = new Date(app.submissionData?.submittedAt || app.createdAt).getTime();
      const firstInteraction = app.interactions
        .map(interaction => new Date(interaction.timestamp).getTime())
        .sort((a, b) => a - b)[0];
      
      return (firstInteraction - submittedTime) / (1000 * 60 * 60); // Convert to hours
    });

    return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  };

  const calculateScoreCorrelation = () => {
    const submittedApps = applications.filter(app => 
      app.status !== 'draft' && app.applicationData
    );

    if (submittedApps.length < 5) return 0;

    const successfulScores = submittedApps
      .filter(app => ['offer_received', 'offer_accepted'].includes(app.status))
      .map(app => app.applicationData.matchScore);

    const allScores = submittedApps.map(app => app.applicationData.matchScore);

    if (successfulScores.length === 0) return 0;

    const avgSuccessfulScore = successfulScores.reduce((sum, score) => sum + score, 0) / successfulScores.length;
    const avgAllScore = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;

    return avgSuccessfulScore / avgAllScore;
  };

  const calculateApplicationFrequency = () => {
    const last30Days = applications.filter(app => {
      const appDate = new Date(app.createdAt);
      const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
      return appDate >= thirtyDaysAgo;
    });

    return last30Days.length / 30; // Applications per day
  };

  const getTimingRecommendation = () => {
    const applicationsByHour = {};
    
    applications.forEach(app => {
      const hour = new Date(app.createdAt).getHours();
      applicationsByHour[hour] = (applicationsByHour[hour] || 0) + 1;
    });

    const bestHour = Object.entries(applicationsByHour)
      .sort(([,a], [,b]) => b - a)[0];

    if (bestHour && bestHour[1] > 2) {
      return {
        type: 'timing',
        priority: 'low',
        title: 'Optimal Application Time',
        description: `Most successful applications submitted around ${bestHour[0]}:00`,
        action: 'Schedule applications during peak hours'
      };
    }

    return null;
  };

  const toggleSection = (section) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getTrendIcon = (current, previous) => {
    if (current > previous) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (current < previous) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getTrendColor = (current, previous) => {
    if (current > previous) return 'text-green-400';
    if (current < previous) return 'text-red-400';
    return 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-400 mr-2" />
        <span className="text-gray-400">Generating analytics...</span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center p-8">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">No Data Available</h3>
        <p className="text-gray-400">Start applying to jobs to see analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Application Analytics</h2>
          <p className="text-gray-400 mt-1">Insights and recommendations for your job search</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-black/40 border border-white/10 rounded-lg outline-none focus:border-blue-500/50 text-white"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          
          <button
            onClick={generateAnalytics}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-2">
            <Briefcase className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold text-white">{analytics.overview.total}</span>
          </div>
          <p className="text-gray-400 text-sm">Total Applications</p>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-gray-400">Submitted:</span>
            <span className="ml-2 text-green-400">{analytics.overview.submitted}</span>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-8 h-8 text-purple-400" />
            <span className="text-2xl font-bold text-white">{analytics.conversion.interviewRate}%</span>
          </div>
          <p className="text-gray-400 text-sm">Interview Rate</p>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-gray-400">Interviews:</span>
            <span className="ml-2 text-purple-400">{analytics.conversion.interviews}</span>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-8 h-8 text-emerald-400" />
            <span className="text-2xl font-bold text-white">{analytics.conversion.offerRate}%</span>
          </div>
          <p className="text-gray-400 text-sm">Offer Rate</p>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-gray-400">Offers:</span>
            <span className="ml-2 text-emerald-400">{analytics.conversion.offers}</span>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-2">
            <Zap className="w-8 h-8 text-yellow-400" />
            <span className="text-2xl font-bold text-white">{analytics.performance.scores.averageMatch}</span>
          </div>
          <p className="text-gray-400 text-sm">Avg Match Score</p>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-gray-400">ATS Score:</span>
            <span className="ml-2 text-blue-400">{analytics.performance.scores.averageAts}</span>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Info className="w-5 h-5 mr-2" />
            Key Insights
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analytics.insights.map((insight, index) => {
            const Icon = insight.icon;
            return (
              <div key={index} className="flex items-start space-x-3 p-4 rounded-lg bg-black/40 border border-white/10">
                <Icon className={`w-5 h-5 mt-1 ${insight.color}`} />
                <div>
                  <h4 className="font-semibold text-white mb-1">{insight.title}</h4>
                  <p className="text-sm text-gray-400">{insight.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Performance */}
        <div className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Platform Performance
          </h3>
          
          <div className="space-y-3">
            {Object.entries(analytics.performance.platforms)
              .sort(([,a], [,b]) => b.successRate - a.successRate)
              .map(([platform, data], index) => (
                <div key={platform} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 capitalize">{platform}</span>
                    <span className="text-white font-medium">{data.successRate}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" 
                      style={{ width: `${data.successRate}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{data.submitted} submitted</span>
                    <span>{data.successful} successful</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <PieChart className="w-5 h-5 mr-2" />
            Conversion Funnel
          </h3>
          
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Applied</span>
                <span className="text-white font-medium">{analytics.conversion.submitted}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Under Review</span>
                <span className="text-white font-medium">{analytics.conversion.underReview}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${analytics.conversion.reviewRate}%` }}></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Interviews</span>
                <span className="text-white font-medium">{analytics.conversion.interviews}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${analytics.conversion.interviewRate}%` }}></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Offers</span>
                <span className="text-white font-medium">{analytics.conversion.offers}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${analytics.conversion.offerRate}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Recommendations
          </h3>
        </div>
        
        <div className="space-y-4">
          {analytics.recommendations.map((rec, index) => (
            <div key={index} className="flex items-start space-x-3 p-4 rounded-lg bg-black/40 border border-white/10">
              <div className={`w-2 h-2 rounded-full mt-2 ${
                rec.priority === 'high' ? 'bg-red-400' :
                rec.priority === 'medium' ? 'bg-yellow-400' :
                'bg-green-400'
              }`} />
              
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-1">{rec.title}</h4>
                <p className="text-sm text-gray-400 mb-2">{rec.description}</p>
                <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                  {rec.action}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ApplicationAnalytics;
