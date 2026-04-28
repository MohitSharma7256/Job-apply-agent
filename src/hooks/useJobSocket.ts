import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

export interface JobEvent {
  type: 'job:found' | 'job:applying' | 'job:applied' | 'job:failed' | 'job:skipped' | 'captcha:detected';
  payload: any;
  timestamp: string;
}

export function useJobSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<JobEvent[]>([]);
  const supabase = useSupabaseClient();

  useEffect(() => {
    let s: Socket;

    async function initSocket() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      s = io(process.env.NEXT_PUBLIC_SITE_URL || '', {
        auth: {
          token: session.access_token
        }
      });

      s.on('connect', () => setIsConnected(true));
      s.on('disconnect', () => setIsConnected(false));

    // Catch-all for events
      const eventTypes = ['job:found', 'job:applying', 'job:applied', 'job:failed', 'job:skipped', 'captcha:detected'];
      
      eventTypes.forEach(type => {
        s.on(type, (payload) => {
          setEvents(prev => [{
            type: type as any,
            payload,
            timestamp: new Date().toISOString()
          }, ...prev].slice(0, 200));
        });
      });

      setSocket(s);
    }

    initSocket();

    return () => {
      if (s) s.disconnect();
    };
  }, [supabase]);

  const emit = useCallback((event: string, data: any) => {
    if (socket) socket.emit(event, data);
  }, [socket]);

  return { events, isConnected, emit };
}
