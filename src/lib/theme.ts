import { createServerFn } from '@tanstack/react-start'
import { getCookie, setCookie } from '@tanstack/react-start/server'

export type Theme = 'light' | 'dark' | 'system'

export const getThemeFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    const theme = getCookie('app_theme') as Theme | undefined
    return theme || 'system'
  })

export const setThemeFn = createServerFn({ method: 'POST' })
  .inputValidator((theme: unknown): Theme => {
    if (theme === 'light' || theme === 'dark' || theme === 'system') {
      return theme as Theme
    }
    return 'system'
  })
  .handler(async ({ data }) => {
    setCookie('app_theme', data, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
  })
