"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const emptyResponse = { data: null, error: null };
const createNoopHandler = () => {
    const handler = {
        get(target, prop) {
            if (prop === 'then') {
                return (resolve) => resolve(emptyResponse);
            }
            if (prop === 'catch') {
                return () => target;
            }
            if (prop === 'from' || prop === 'select' || prop === 'eq' || prop === 'order' || prop === 'limit' || prop === 'single' || prop === 'gte' || prop === 'lte' || prop === 'gt' || prop === 'lt' || prop === 'or' || prop === 'match' || prop === 'insert' || prop === 'update' || prop === 'delete' || prop === 'upsert' || prop === 'upsert' || prop === 'storage' || prop === 'auth' || prop === 'from') {
                return () => proxy;
            }
            if (prop === 'getUser') {
                return async () => ({ data: { user: null }, error: null });
            }
            if (prop === 'upload' || prop === 'getPublicUrl') {
                return () => ({ data: { publicUrl: '' }, error: null });
            }
            return proxy;
        },
        apply(target, thisArg, args) {
            return proxy;
        },
    };
    const proxy = new Proxy(() => proxy, handler);
    return proxy;
};
exports.supabase = supabaseUrl && supabaseKey
    ? (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey)
    : createNoopHandler();
