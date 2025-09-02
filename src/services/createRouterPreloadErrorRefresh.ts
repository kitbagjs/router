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
      window.location.reload()
    })
  }

  return {
    initialize,
  }
}
