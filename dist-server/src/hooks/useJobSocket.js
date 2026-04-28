"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useJobSocket = useJobSocket;
const react_1 = require("react");
const socket_io_client_1 = require("socket.io-client");
const auth_helpers_react_1 = require("@supabase/auth-helpers-react");
function useJobSocket() {
    const [socket, setSocket] = (0, react_1.useState)(null);
    const [isConnected, setIsConnected] = (0, react_1.useState)(false);
    const [events, setEvents] = (0, react_1.useState)([]);
    const supabase = (0, auth_helpers_react_1.useSupabaseClient)();
    (0, react_1.useEffect)(() => {
        let s;
        async function initSocket() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session)
                return;
            s = (0, socket_io_client_1.io)(process.env.NEXT_PUBLIC_SITE_URL || '', {
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
                            type: type,
                            payload,
                            timestamp: new Date().toISOString()
                        }, ...prev].slice(0, 200));
                });
            });
            setSocket(s);
        }
        initSocket();
        return () => {
            if (s)
                s.disconnect();
        };
    }, [supabase]);
    const emit = (0, react_1.useCallback)((event, data) => {
        if (socket)
            socket.emit(event, data);
    }, [socket]);
    return { events, isConnected, emit };
}
