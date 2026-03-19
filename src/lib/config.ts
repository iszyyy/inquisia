declare global {
  interface Window {
    __INQUISIA_CONFIG__?: {
      NEXT_PUBLIC_APP_URL?: string
      NEXT_PUBLIC_API_URL?: string
    }
  }
}

const runtimeConfig = typeof window !== 'undefined' ? window.__INQUISIA_CONFIG__ ?? {} : {}
const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {}

function getBrowserOrigin() {
  if (typeof window === 'undefined') return undefined
  return window.location.origin
}

function getBrowserApiFallback() {
  if (typeof window === 'undefined') return undefined
  return `${window.location.protocol}//${window.location.hostname}:3000`
}

export const APP_CONFIG = {
  appUrl:
    runtimeConfig.NEXT_PUBLIC_APP_URL ??
    getBrowserOrigin() ??
    'http://localhost:5173',
  apiUrl:
    runtimeConfig.NEXT_PUBLIC_API_URL ??
    env.VITE_API_URL ??
    getBrowserApiFallback() ??
    'http://localhost:3000',
}
