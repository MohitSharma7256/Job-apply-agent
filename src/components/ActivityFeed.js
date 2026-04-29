import React from 'react';
import { GlassCard } from './ui/GlassCard';

export function ActivityFeed({ activities = [] }) {
  return (
    <GlassCard className="p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {activities.length === 0 ? (
          <p className="text-slate-400 text-sm">No recent activity</p>
        ) : (
          activities.map((activity, index) => (
            <div key={index} className="flex items-center gap-3 text-sm">
              <div className="h-2 w-2 rounded-full bg-blue-400" />
              <span className="text-slate-300">{activity}</span>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );
}
