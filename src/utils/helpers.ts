import { Job } from '@/types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function getScoreColor(score: number): string {
  if (score >= 8) return 'text-green-600';
  if (score >= 6) return 'text-yellow-600';
  return 'text-gray-600';
}

export function getScoreBgColor(score: number): string {
  if (score >= 8) return 'bg-green-100';
  if (score >= 6) return 'bg-yellow-100';
  return 'bg-gray-100';
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePhone(phone: string): boolean {
  const re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  return re.test(phone);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    naukri: '📋',
    apna: '🚀',
    linkedin: '💼',
    indeed: '✅',
    internshala: '🎓',
    greenhouse: '🏢',
  };
  return icons[platform] || '🌐';
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    applied: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    interview: 'bg-blue-100 text-blue-700',
    offer: 'bg-purple-100 text-purple-700',
    pending: 'bg-yellow-100 text-yellow-700',
    new: 'bg-gray-100 text-gray-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

export function filterJobs(
  jobs: Job[],
  filters: {
    minScore?: number;
    platforms?: string[];
    jobTypes?: string[];
    locations?: string[];
  }
): Job[] {
  return jobs.filter((job) => {
    if (filters.minScore && (job.matchScore || 0) < filters.minScore) {
      return false;
    }
    if (filters.platforms && !filters.platforms.includes(job.platform)) {
      return false;
    }
    if (filters.jobTypes && !filters.jobTypes.includes(job.jobType)) {
      return false;
    }
    if (filters.locations && !filters.locations.some((l) => 
      job.location.toLowerCase().includes(l.toLowerCase())
    )) {
      return false;
    }
    return true;
  });
}

export function sortJobs(
  jobs: Job[],
  sortBy: 'score' | 'date' | 'company' | 'salary'
): Job[] {
  const sorted = [...jobs];
  
  switch (sortBy) {
    case 'score':
      return sorted.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    case 'date':
      return sorted.sort((a, b) => 
        new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
      );
    case 'company':
      return sorted.sort((a, b) => a.company.localeCompare(b.company));
    case 'salary':
      return sorted.sort((a, b) => {
        const aSalary = parseSalary(a.salary);
        const bSalary = parseSalary(b.salary);
        return bSalary - aSalary;
      });
    default:
      return sorted;
  }
}

function parseSalary(salary?: string): number {
  if (!salary) return 0;
  const match = salary.match(/[\d,]+/);
  if (match) {
    return parseInt(match[0].replace(/,/g, ''), 10);
  }
  return 0;
}

export function calculateSuccessRate(applied: number, responses: number): number {
  if (applied === 0) return 0;
  return Math.round((responses / applied) * 100);
}

export function exportToCSV(applications: any[]): string {
  const headers = [
    'Date',
    'Time',
    'Job Title',
    'Company',
    'Location',
    'Salary',
    'Platform',
    'Status',
  ];
  
  const rows = applications.map((app) => [
    new Date(app.appliedAt).toLocaleDateString(),
    new Date(app.appliedAt).toLocaleTimeString(),
    app.jobTitle,
    app.company,
    app.location,
    app.salary || 'N/A',
    app.platform,
    app.status,
  ]);
  
  return [headers, ...rows].map((row) => row.join(',')).join('\n');
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}