import { useState, useEffect, useCallback, useRef } from 'react';

type EventCallback = (detail: any) => void;

const eventListeners: Map<string, Set<EventCallback>> = new Map();

export function useEventListener(eventType: string, callback: EventCallback) {
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent;
      callback(customEvent.detail);
    };

    window.addEventListener(eventType, handler);
    return () => window.removeEventListener(eventType, handler);
  }, [eventType, callback]);
}

export function useJobPolling(keywords: string[], locations: string[], platforms: string[], profile: any, options: { interval?: number; enabled?: boolean } = {}) {
  const { interval = 30000, enabled = true } = options;
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  const fetchJobs = useCallback(async () => {
    if (keywords.length === 0) return;
    
    setLoading(true);
    setError(null);
    window.dispatchEvent(new CustomEvent('jobs.fetching', { detail: { keywords, locations, platforms } }));

    try {
      const res = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords, locations, platforms, profile, maxResults: 30 })
      });
      
      const data = await res.json();
      
      if (isMounted.current) {
        if (data.success) {
          setJobs(data.jobs || []);
          setLastFetch(new Date());
          window.dispatchEvent(new CustomEvent('jobs.found', { detail: { jobs: data.jobs, count: data.matchedCount } }));
        } else {
          throw new Error(data.error);
        }
      }
    } catch (err: any) {
      if (isMounted.current) {
        setError(err.message);
        window.dispatchEvent(new CustomEvent('jobs.error', { detail: { error: err.message } }));
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [keywords.join(','), locations.join(','), platforms.join(','), JSON.stringify(profile)]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    fetchJobs();
    intervalRef.current = setInterval(fetchJobs, interval);
    window.dispatchEvent(new CustomEvent('polling.started', { detail: { interval } }));
  }, [fetchJobs, interval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    window.dispatchEvent(new CustomEvent('polling.stopped', {}));
  }, []);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; stopPolling(); };
  }, [stopPolling]);

  useEffect(() => {
    if (enabled && keywords.length > 0) {
      startPolling();
    }
    return () => stopPolling();
  }, [enabled, keywords.join(','), startPolling, stopPolling]);

  return { jobs, loading, error, lastFetch, startPolling, stopPolling, refresh: fetchJobs };
}

export function useAutoApply(jobs: any[], config: { minScore?: number; maxPerHour?: number; enabled?: boolean } = {}) {
  const { minScore = 6, maxPerHour = 10, enabled = false } = config;
  const [isAutoApplying, setIsAutoApplying] = useState(false);
  const [appliedCount, setAppliedCount] = useState(0);
  const [remaining, setRemaining] = useState(maxPerHour);
  const [lastHourReset, setLastHourReset] = useState(Date.now());

  useEffect(() => {
    const checkLimit = () => {
      const now = Date.now();
      if (now - lastHourReset > 3600000) {
        setAppliedCount(0);
        setRemaining(maxPerHour);
        setLastHourReset(now);
      }
    };

    const interval = setInterval(checkLimit, 60000);
    return () => clearInterval(interval);
  }, [lastHourReset, maxPerHour]);

  const tryAutoApply = useCallback(async (job: any) => {
    if (!enabled || isAutoApplying || remaining <= 0) return false;
    if ((job.matchScore || 0) < minScore || job.applied) return false;

    setIsAutoApplying(true);
    window.dispatchEvent(new CustomEvent('autoapply.started', { detail: { job } }));

    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job })
      });

      const data = await res.json();

      if (data.success) {
        setAppliedCount(c => c + 1);
        setRemaining(r => r - 1);
        window.dispatchEvent(new CustomEvent('autoapply.success', { detail: { job, remaining: remaining - 1 } }));
        return true;
      } else {
        window.dispatchEvent(new CustomEvent('autoapply.failed', { detail: { job, error: data.error } }));
        return false;
      }
    } catch (err) {
      window.dispatchEvent(new CustomEvent('autoapply.error', { detail: { job, error: String(err) } }));
      return false;
    } finally {
      setIsAutoApplying(false);
    }
  }, [enabled, isAutoApplying, remaining, minScore]);

  return {
    tryAutoApply,
    isAutoApplying,
    appliedCount,
    remaining,
    config: { enabled, minScore, maxPerHour }
  };
}

export function usePlatformHealth() {
  const [health, setHealth] = useState<Record<string, any>>({});

  useEventListener('platform.updated', (detail) => {
    setHealth(prev => ({ ...prev, [detail.platform]: detail.health }));
  });

  useEffect(() => {
    const loadHealth = async () => {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        if (data.health) setHealth(data.health);
      } catch (e) { console.error('Health load failed:', e); }
    };
    loadHealth();
    const interval = setInterval(loadHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return health;
}

export function useQueueStatus() {
  const [queue, setQueue] = useState<any[]>([]);
  const [stats, setStats] = useState({ queued: 0, applying: 0, failed: 0, rateLimit: 50 });
  const [isPaused, setIsPaused] = useState(false);

  useEventListener('job.queued', (detail) => {
    setQueue(prev => [...prev, detail.job]);
    setStats(prev => ({ ...prev, queued: prev.queued + 1 }));
  });

  useEventListener('job.applied', (detail) => {
    setQueue(prev => prev.filter(j => j.id !== detail.job.id));
    setStats(prev => ({ ...prev, queued: Math.max(0, prev.queued - 1), rateLimit: Math.max(0, prev.rateLimit - 1) }));
  });

  useEventListener('job.failed', (detail) => {
    setQueue(prev => prev.filter(j => j.id !== detail.job.id));
    setStats(prev => ({ ...prev, queued: Math.max(0, prev.queued - 1), failed: prev.failed + 1 }));
  });

  useEventListener('queue.paused', () => setIsPaused(true));
  useEventListener('queue.resumed', () => setIsPaused(false));
  useEventListener('queue.cleared', () => { setQueue([]); setStats(s => ({ ...s, queued: 0 })); });

  return { queue, stats, isPaused };
}

export function useSessionHealth() {
  const [sessions, setSessions] = useState<Record<string, { healthy: boolean; lastUsed: string }>({});

  useEventListener('session.updated', (detail) => {
    setSessions(prev => ({ ...prev, [detail.platform]: detail.session }));
  });

  return sessions;
}

export function useResumeVariants() {
  const [variants, setVariants] = useState<any[]>([]);

  useEventListener('resume.added', (detail) => {
    setVariants(prev => [...prev, detail.variant]);
  });

  useEffect(() => {
    const stored = localStorage.getItem('resume_variants');
    if (stored) setVariants(JSON.parse(stored));
  }, []);

  const addVariant = useCallback((variant: { name: string; content: string; type: string }) => {
    const newVariant = {
      ...variant,
      id: `resume_${Date.now()}`,
      createdAt: new Date().toISOString(),
      usageCount: 0
    };
    const updated = [...variants, newVariant];
    setVariants(updated);
    localStorage.setItem('resume_variants', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('resume.added', { detail: { variant: newVariant } }));
    return newVariant;
  }, [variants]);

  const selectBestForJob = useCallback((job: any) => {
    if (variants.length === 0) return null;
    const relevant = variants.filter(v => v.type === job.jobType || v.type === 'general');
    return relevant.sort((a, b) => b.usageCount - a.usageCount)[0] || variants[0];
  }, [variants]);

  return { variants, addVariant, selectBestForJob };
}

export function emitEvent(type: string, detail: any = {}) {
  window.dispatchEvent(new CustomEvent(type, { detail }));
}

export function useRealtimeStatus() {
  const [status, setStatus] = useState<{ phase: string; message: string; progress?: number; total?: number }>({
    phase: 'idle',
    message: 'Ready'
  });

  useEventListener('jobs.fetching', () => setStatus({ phase: 'fetching', message: 'Fetching jobs...', progress: 0 }));
  useEventListener('jobs.found', (d) => setStatus({ phase: 'success', message: `Found ${d.count} jobs`, progress: 100, total: d.count }));
  useEventListener('jobs.error', (d) => setStatus({ phase: 'error', message: d.error, progress: 0 }));
  useEventListener('job.applying', () => setStatus({ phase: 'applying', message: 'Applying to job...' }));
  useEventListener('job.applied', () => setStatus({ phase: 'success', message: 'Application successful!' }));
  useEventListener('job.failed', (d) => setStatus({ phase: 'error', message: d.error || 'Failed' }));

  const clearStatus = useCallback(() => {
    setStatus({ phase: 'idle', message: 'Ready' });
  }, []);

  return { status, clearStatus };
}
