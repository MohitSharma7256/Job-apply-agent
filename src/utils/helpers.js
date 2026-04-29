import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getPlatformIcon(platform) {
  const icons = {
    linkedin: '💼',
    indeed: '✅',
    naukri: '📋',
    apna: '🚀',
    glassdoor: '🏢',
    internshala: '🎓',
    shine: '✨',
    greenhouse: '🏢'
  };
  return icons[platform] || '📋';
}

export function getStatusColor(status) {
  const colors = {
    applied: 'text-blue-400',
    interview: 'text-purple-400',
    offer: 'text-green-400',
    rejected: 'text-red-400'
  };
  return colors[status] || 'text-slate-400';
}
