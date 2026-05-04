import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

// Socket context for managing connection state
const SocketContext = React.createContext(null);

// Socket provider component
export function SocketProvider({ children, token }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [jobUpdates, setJobUpdates] = useState({});
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeout = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (!token) {
      console.warn('[Socket] No token provided, skipping connection');
      return;
    }

    const newSocket = io(process.env.NODE_ENV === 'production' 
      ? window.location.origin 
      : 'http://localhost:3000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('[Socket] Connected to server');
      setIsConnected(true);
      setConnectionError(null);
      reconnectAttempts.current = 0;
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect automatically
        newSocket.connect();
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
      setConnectionError(error.message);
      
      reconnectAttempts.current++;
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.error('[Socket] Max reconnection attempts reached');
        setConnectionError('Unable to connect to server. Please refresh the page.');
      }
    });

    // Initial data handlers
    newSocket.on('initial:jobs', (data) => {
      console.log('[Socket] Received initial jobs:', data.jobs.length);
      // Store initial jobs state
      setJobUpdates(prev => ({ ...prev, initialJobs: data.jobs }));
    });

    newSocket.on('initial:applications', (data) => {
      console.log('[Socket] Received initial applications:', data.applications.length);
      // Store initial applications state
      setJobUpdates(prev => ({ ...prev, initialApplications: data.applications }));
    });

    newSocket.on('initial:profile', (data) => {
      console.log('[Socket] Received initial profile');
      // Store initial profile state
      setJobUpdates(prev => ({ ...prev, initialProfile: data.profile }));
    });

    // Job update handlers
    newSocket.on('job:queued', (event) => {
      console.log('[Socket] Job queued:', event);
      setJobUpdates(prev => ({
        ...prev,
        [event.jobId]: { status: 'queued', ...event.data, timestamp: event.timestamp }
      }));
    });

    newSocket.on('job:started', (event) => {
      console.log('[Socket] Job started:', event);
      setJobUpdates(prev => ({
        ...prev,
        [event.jobId]: { status: 'processing', ...event.data, timestamp: event.timestamp }
      }));
    });

    newSocket.on('job:progress', (event) => {
      console.log('[Socket] Job progress:', event);
      setJobUpdates(prev => ({
        ...prev,
        [event.jobId]: { 
          ...prev[event.jobId], 
          status: 'processing',
          progress: event.data.progress,
          step: event.data.step,
          message: event.data.message,
          timestamp: event.timestamp
        }
      }));
    });

    newSocket.on('job:completed', (event) => {
      console.log('[Socket] Job completed:', event);
      setJobUpdates(prev => ({
        ...prev,
        [event.jobId]: { status: 'completed', ...event.data, timestamp: event.timestamp }
      }));
    });

    newSocket.on('job:failed', (event) => {
      console.log('[Socket] Job failed:', event);
      setJobUpdates(prev => ({
        ...prev,
        [event.jobId]: { status: 'failed', error: event.data.error, timestamp: event.timestamp }
      }));
    });

    newSocket.on('job:cancelled', (event) => {
      console.log('[Socket] Job cancelled:', event);
      setJobUpdates(prev => ({
        ...prev,
        [event.jobId]: { status: 'cancelled', timestamp: event.timestamp }
      }));
    });

    // Notification handler
    newSocket.on('notification', (notification) => {
      console.log('[Socket] Notification received:', notification);
      setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50
    });

    // Error handler
    newSocket.on('error', (error) => {
      console.error('[Socket] Server error:', error);
      setConnectionError(error.message);
    });

    // Ping/Pong for connection health
    newSocket.on('pong', (data) => {
      console.log('[Socket] Pong received:', data.timestamp);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log('[Socket] Cleaning up connection');
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      newSocket.disconnect();
    };
  }, [token]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    if (socket && !isConnected) {
      console.log('[Socket] Attempting manual reconnect');
      reconnectAttempts.current = 0;
      socket.connect();
    }
  }, [socket, isConnected]);

  // Send ping for connection health
  const ping = useCallback(() => {
    if (socket && isConnected) {
      socket.emit('ping');
    }
  }, [socket, isConnected]);

  // Subscribe to job updates
  const subscribeToJob = useCallback((jobId) => {
    if (socket && isConnected) {
      console.log('[Socket] Subscribing to job:', jobId);
      socket.emit('job:subscribe', { jobId });
    }
  }, [socket, isConnected]);

  // Unsubscribe from job updates
  const unsubscribeFromJob = useCallback((jobId) => {
    if (socket && isConnected) {
      console.log('[Socket] Unsubscribing from job:', jobId);
      socket.emit('job:unsubscribe', { jobId });
    }
  }, [socket, isConnected]);

  // Get job status
  const getJobStatus = useCallback(async (jobId) => {
    if (socket && isConnected) {
      console.log('[Socket] Requesting job status:', jobId);
      socket.emit('job:status', { jobId });
    }
  }, [socket, isConnected]);

  // Cancel job
  const cancelJob = useCallback(async (jobId) => {
    if (socket && isConnected) {
      console.log('[Socket] Cancelling job:', jobId);
      socket.emit('job:cancel', { jobId });
    }
  }, [socket, isConnected]);

  // Retry job
  const retryJob = useCallback(async (jobId) => {
    if (socket && isConnected) {
      console.log('[Socket] Retrying job:', jobId);
      socket.emit('job:retry', { jobId });
    }
  }, [socket, isConnected]);

  // Clear notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Mark notification as read
  const markNotificationRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  }, []);

  // Get job update by ID
  const getJobUpdate = useCallback((jobId) => {
    return jobUpdates[jobId] || null;
  }, [jobUpdates]);

  // Get unread notifications count
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const value = {
    socket,
    isConnected,
    connectionError,
    reconnect,
    ping,
    subscribeToJob,
    unsubscribeFromJob,
    getJobStatus,
    cancelJob,
    retryJob,
    getJobUpdate,
    notifications,
    clearNotifications,
    markNotificationRead,
    unreadNotificationsCount,
    jobUpdates
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

// Hook to use socket context
export function useSocket() {
  const context = React.useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

// Hook for job-specific updates
export function useJobUpdates(jobId) {
  const { getJobUpdate, subscribeToJob, unsubscribeFromJob } = useSocket();
  const [jobUpdate, setJobUpdate] = useState(null);

  useEffect(() => {
    if (jobId) {
      subscribeToJob(jobId);
      setJobUpdate(getJobUpdate(jobId));

      return () => {
        unsubscribeFromJob(jobId);
      };
    }
  }, [jobId, subscribeToJob, unsubscribeFromJob, getJobUpdate]);

  return jobUpdate;
}

// Hook for notifications
export function useNotifications() {
  const { notifications, clearNotifications, markNotificationRead, unreadNotificationsCount } = useSocket();
  
  return {
    notifications,
    clearNotifications,
    markNotificationRead,
    unreadNotificationsCount
  };
}
