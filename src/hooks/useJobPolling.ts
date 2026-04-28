import { useState, useEffect, useCallback, useRef } from 'react';
import { Job } from '../types';

interface UseJobPollingOptions {
  enabled: boolean;
  intervalMs?: number;
  onNewJobs?: (jobs: Job[]) => void;
}

export function useJobPolling({ enabled, intervalMs = 30000, onNewJobs }: UseJobPollingOptions) {
  const [isPolling, setIsPolling] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [newJobCount, setNewJobCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const knownJobIds = useRef<Set<string>>(new Set());

  const poll = useCallback(async () => {
    try {
      setIsPolling(true);
      const res = await fetch('/api/jobs/status');
      if (!res.ok) return;

      const data = await res.json();
      const jobs: Job[] = data.jobs || [];

      const newJobs = jobs.filter(j => !knownJobIds.current.has(j.id));
      
      if (newJobs.length > 0) {
        newJobs.forEach(j => knownJobIds.current.add(j.id));
        setNewJobCount(prev => prev + newJobs.length);
        setLastUpdated(new Date());
        onNewJobs?.(newJobs);
      }
    } catch (e) {
    // Silent fail - polling is best-effort
    } finally {
      setIsPolling(false);
    }
  }, [onNewJobs]);

  const seedKnownJobs = useCallback((jobs: Job[]) => {
    jobs.forEach(j => knownJobIds.current.add(j.id));
  }, []);

  const clearNewJobCount = useCallback(() => setNewJobCount(0), []);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(poll, intervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, intervalMs, poll]);

  return { isPolling, lastUpdated, newJobCount, clearNewJobCount, seedKnownJobs };
}
