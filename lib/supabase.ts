import { createClient } from '@supabase/supabase-js';

// Server-side client using the service role key — only ever imported
// in server components, server actions, or API routes. Never expose
// SUPABASE_SERVICE_ROLE_KEY to the browser.
//
// The custom fetch below forces every Supabase request to skip
// Next.js's fetch cache — without this, Next can serve stale
// (cached) query results even on a hard page reload.
export function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        fetch: (url, options = {}) => fetch(url, { ...options, cache: 'no-store' }),
      },
    }
  );
}