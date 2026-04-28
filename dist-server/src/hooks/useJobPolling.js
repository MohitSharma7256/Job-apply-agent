"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useJobPolling = useJobPolling;
const react_1 = require("react");
function useJobPolling({ enabled, intervalMs = 30000, onNewJobs }) {
    const [isPolling, setIsPolling] = (0, react_1.useState)(false);
    const [lastUpdated, setLastUpdated] = (0, react_1.useState)(null);
    const [newJobCount, setNewJobCount] = (0, react_1.useState)(0);
    const intervalRef = (0, react_1.useRef)(null);
    const knownJobIds = (0, react_1.useRef)(new Set());
    const poll = (0, react_1.useCallback)(async () => {
        try {
            setIsPolling(true);
            const res = await fetch('/api/jobs/status');
            if (!res.ok)
                return;
            const data = await res.json();
            const jobs = data.jobs || [];
            const newJobs = jobs.filter(j => !knownJobIds.current.has(j.id));
            if (newJobs.length > 0) {
                newJobs.forEach(j => knownJobIds.current.add(j.id));
                setNewJobCount(prev => prev + newJobs.length);
                setLastUpdated(new Date());
                onNewJobs?.(newJobs);
            }
        }
        catch (e) {
            // Silent fail - polling is best-effort
        }
        finally {
            setIsPolling(false);
        }
    }, [onNewJobs]);
    const seedKnownJobs = (0, react_1.useCallback)((jobs) => {
        jobs.forEach(j => knownJobIds.current.add(j.id));
    }, []);
    const clearNewJobCount = (0, react_1.useCallback)(() => setNewJobCount(0), []);
    (0, react_1.useEffect)(() => {
        if (!enabled) {
            if (intervalRef.current)
                clearInterval(intervalRef.current);
            return;
        }
        intervalRef.current = setInterval(poll, intervalMs);
        return () => {
            if (intervalRef.current)
                clearInterval(intervalRef.current);
        };
    }, [enabled, intervalMs, poll]);
    return { isPolling, lastUpdated, newJobCount, clearNewJobCount, seedKnownJobs };
}
