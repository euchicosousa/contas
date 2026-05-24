import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { env } from '#/env.ts'
import type { Database } from './database.types.ts'
import { getCookies, setCookie } from '@tanstack/react-start/server'

/**
 * Supabase client for use on the server (loaders, server functions).
 * Reads/writes session cookies using TanStack Start's server utilities.
 *
 * Usage in a TanStack Start beforeLoad or server function:
 *   const supabase = createServerClient()
 */
export function createServerClient() {
  return createSupabaseServerClient<Database>(
    env.VITE_SUPABASE_URL,
    env.VITE_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          const cookies = getCookies()
          return Object.entries(cookies).map(([name, value]) => ({ name, value }))
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            setCookie(name, value, {
              ...options,
              // Map Supabase cookie options to TanStack cookie options if necessary
              // maxAge might be provided
            })
          }
        },
      },
    },
  )
}
