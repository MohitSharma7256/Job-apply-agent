'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, Briefcase, Calendar, Award } from 'lucide-react';
import { cn } from '@/utils/helpers';

interface StatsData {
  today: number;
  week: number;
  month: number;
  avgMatchScore: number;
  platformStats: Record<string, number>;
  successRate: number;
}

interface ChartData {
  date: string;
  count: number;
}

export function StatsDashboard() {
  const [stats, setStats] = useState<StatsData>({
    today: 12,
    week: 47,
    month: 183,
    avgMatchScore: 78,
    platformStats: { linkedin: 89, indeed: 52, naukri: 42 },
    successRate: 94,
  });

  const [chartData, setChartData] = useState<ChartData[]>([
    { date: 'Mon', count: 8 },
    { date: 'Tue', count: 12 },
    { date: 'Wed', count: 7 },
    { date: 'Thu', count: 15 },
    { date: 'Fri', count: 5 },
    { date: 'Sat', count: 3 },
    { date: 'Sun', count: 0 },
  ]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics/summary?userId=current');
      const data = await res.json();
      if (data.success && data.summary) {
        setStats(data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
    setLoading(false);
  };

  const maxCount = Math.max(...chartData.map(d => d.count));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Today</p>
              <p className="text-3xl font-bold text-white mt-1">{loading ? '-' : stats.today}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/20">
              <Calendar className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3 text-sm">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-green-400">+3</span>
            <span className="text-slate-500">from yesterday</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-5 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">This Week</p>
              <p className="text-3xl font-bold text-white mt-1">{loading ? '-' : stats.week}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/20">
              <Briefcase className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3 text-sm">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-green-400">+15</span>
            <span className="text-slate-500">from last week</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-5 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">This Month</p>
              <p className="text-3xl font-bold text-white mt-1">{loading ? '-' : stats.month}</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-500/20">
              <Award className="w-6 h-6 text-orange-400" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3 text-sm">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-green-400">+42</span>
            <span className="text-slate-500">from last month</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-5 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Avg Match Score</p>
              <p className="text-3xl font-bold text-white mt-1">{loading ? '-' : stats.avgMatchScore}%</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/20">
              <Target className="w-6 h-6 text-green-400" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3 text-sm">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <span className="text-red-400">-2%</span>
            <span className="text-slate-500">from last week</span>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-xl bg-white/5 border border-white/10"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Weekly Applications</h3>
          <div className="h-48 flex items-end justify-between gap-3">
            {chartData.map((day, i) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: maxCount > 0 ? `${(day.count / maxCount) * 100}%` : '0%' }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className={cn(
                      "w-full rounded-t-lg",
                      day.count > 0 ? "bg-gradient-to-t from-blue-500 to-blue-400" : "bg-slate-700"
                    )}
                  />
                </div>
                <span className="text-xs text-slate-400">{day.date}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-6 rounded-xl bg-white/5 border border-white/10"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Platform Distribution</h3>
          <div className="space-y-4">
            {Object.entries(stats.platformStats).map(([platform, count]) => {
              const percentage = stats.month > 0 ? Math.round((count / stats.month) * 100) : 0;
              return (
                <div key={platform}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white capitalize">{platform}</span>
                    <span className="text-sm text-slate-400">{count} ({percentage}%)</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5 }}
                      className={cn(
                        "h-full rounded-full",
                        platform === 'linkedin' ? "bg-blue-500" :
                        platform === 'indeed' ? "bg-purple-500" : "bg-orange-500"
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="p-6 rounded-xl bg-white/5 border border-white/10"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Match Score Distribution</h3>
        <div className="flex items-center gap-3">
          {[
            { range: '90-100%', count: 12, color: 'bg-green-500' },
            { range: '80-89%', count: 45, color: 'bg-blue-500' },
            { range: '70-79%', count: 78, color: 'bg-yellow-500' },
            { range: '60-69%', count: 34, color: 'bg-orange-500' },
            { range: '50-59%', count: 14, color: 'bg-red-500' },
          ].map((bucket) => {
            const maxBucket = 78;
            const width = (bucket.count / maxBucket) * 100;
            return (
              <div key={bucket.range} className="flex-1 text-center">
                <div className="h-24 flex items-end justify-center mb-2">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${width}%` }}
                    transition={{ duration: 0.5 }}
                    className={cn("w-10 rounded-t-lg", bucket.color)}
                  />
                </div>
                <span className="text-xs text-slate-400">{bucket.range}</span>
                <p className="text-sm font-medium text-white mt-1">{bucket.count}</p>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}