import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const emptyResponse = { data: null, error: null };
const createNoopHandler = () => {
  const handler: ProxyHandler<any> = {
    get(target, prop) {
      if (prop === 'then') {
        return (resolve: any) => resolve(emptyResponse);
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
  const proxy: any = new Proxy(() => proxy, handler);
  return proxy;
};

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : createNoopHandler();
