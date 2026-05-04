"use client";

import { useState, useEffect } from "react";
import { BarChart3, PieChart, TrendingUp, Activity, Users, Target, Award, Calendar, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    total: 0,
    today: 0,
    interviews: 0,
    platforms: {}
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics/summary');
        const result = await response.json();
        if (result.success) {
          setData(result.summary);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const stats = [
    { title: "Total Applications", value: data.total.toString(), trend: data.today > 0 ? `+${data.today} today` : "Stable", icon: Activity, color: "text-blue-400" },
    { title: "Interviews", value: data.interviews.toString(), trend: "+0%", icon: Users, color: "text-purple-400" },
    { title: "Response Rate", value: data.total > 0 ? `${((data.interviews / data.total) * 100).toFixed(1)}%` : "0%", trend: "+0%", icon: TrendingUp, color: "text-green-400" },
    { title: "Jobs Today", value: data.today.toString(), trend: "Active", icon: Target, color: "text-orange-400" },
  ];

  const platforms = Object.entries(data.platforms).map(([name, count]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    count,
    color: name === 'linkedin' ? 'bg-blue-600' : 'bg-blue-500'
  }));

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-white">Analytics</h1>
          <p className="text-slate-500 mt-2">Visualize your job application performance and trends.</p>
        </div>
        <div className="relative">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/10 transition-all">
            Last 30 Days <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl group hover:border-blue-500/30 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center", stat.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={cn("text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded-md bg-white/5", stat.trend.includes("+") ? "text-green-400" : "text-slate-500")}>
                  {stat.trend}
                </span>
              </div>
              <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.title}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Funnel */}
        <div className="col-span-2 p-8 rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-xl">
          <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-green-400" /> Conversion Funnel
          </h2>
          <div className="space-y-6">
            {[
              { label: "Jobs Discovered", value: 450, color: "bg-blue-600", width: "100%" },
              { label: "AI Tailored", value: 320, color: "bg-purple-600", width: "71%" },
              { label: "Applications Sent", value: 142, color: "bg-indigo-600", width: "31%" },
              { label: "Recruiter Responses", value: 24, color: "bg-green-600", width: "5%" },
              { label: "Interviews Scheduled", value: 8, color: "bg-emerald-600", width: "1.7%" },
            ].map((step, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase text-slate-500 tracking-widest">
                  <span>{step.label}</span>
                  <span className="text-white">{step.value}</span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all duration-1000", step.color)} style={{ width: step.width }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Breakdown */}
        <div className="p-8 rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-xl">
          <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
            <PieChart className="w-5 h-5 text-blue-400" /> Platforms
          </h2>
          <div className="space-y-6">
            {platforms.map((p, i) => (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className={cn("h-3 w-3 rounded-full", p.color)} />
                  <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{p.name}</span>
                </div>
                <span className="text-sm font-black text-white">{p.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-8 border-t border-white/5">
            <div className="text-center">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Most Successful</div>
              <div className="text-lg font-black text-blue-400">LinkedIn</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
