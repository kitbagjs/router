import { RouterPreloadErrorAbort } from '@/errors/routerPreloadErrorAbortError'
import { isBrowser } from '@/utilities/isBrowser'

type RouterPreloadErrorOptions = {
  refreshOnPreloadError?: boolean,
}

type RouterPreloadErrorRefresh = {
  initialize: () => void,
}

export function createRouterPreloadErrorRefresh({ refreshOnPreloadError = true }: RouterPreloadErrorOptions): RouterPreloadErrorRefresh {
  function initialize(): void {
    if (!isBrowser() || !refreshOnPreloadError) {
      return
    }

    window.addEventListener('vite:preloadError', () => {
      try {
        console.log('vite:preloadError REFRESHING!')
        window.location.reload()
      } catch (error) {
        if (error instanceof RouterPreloadErrorAbort) {
          return
        }

        throw error
      }
    })
  }

  return {
    initialize,
  }
}
