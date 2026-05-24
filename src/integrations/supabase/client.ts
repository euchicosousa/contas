import { createBrowserClient } from '@supabase/ssr'
import { env } from '#/env.ts'
import type { Database } from './database.types.ts'

/**
 * Supabase client for use in browser (components, hooks, client-side code).
 * Session is persisted via cookies (not localStorage), compatible with SSR.
 */
export function createClient() {
  return createBrowserClient<Database>(
    env.VITE_SUPABASE_URL,
    env.VITE_SUPABASE_ANON_KEY,
  )
}
