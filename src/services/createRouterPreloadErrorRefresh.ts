import { isBrowser } from '@/utilities/isBrowser'
import { onUnmounted } from 'vue'

type RouterPreloadErrorOptions = {
  refreshOnPreloadError?: boolean,
}

type RouterPreloadError = {
  initialize: () => void,
  onBeforePreloadErrorRefresh: (hook: RouterPreloadErrorHook) => void,
}

type RouterPreloadErrorHookParameters = {
  event: Event,
  abort: () => void,
}

export type RouterPreloadErrorHook = (parameters: RouterPreloadErrorHookParameters) => void

export function createRouterPreloadErrorRefresh({ refreshOnPreloadError = true }: RouterPreloadErrorOptions): RouterPreloadError {
  const hooks = new Set<RouterPreloadErrorHook>()

  function initialize(): void {
    if (isBrowser() && refreshOnPreloadError) {
      window.addEventListener('vite:preloadError', (event) => {
        try {
          hooks.forEach((hook) => {
            hook({ event, abort })
          })

          window.location.reload()
        } catch (error) {
          if (error instanceof RouterPreloadErrorAbort) {
            return
          }

          throw error
        }
      })
    }
  }

  function onBeforePreloadErrorRefresh(hook: RouterPreloadErrorHook): void {
    hooks.add(hook)

    onUnmounted(() => {
      hooks.delete(hook)
    })
  }

  function abort(): void {
    throw new RouterPreloadErrorAbort()
  }

  return {
    initialize,
    onBeforePreloadErrorRefresh,
  }
}

class RouterPreloadErrorAbort extends Error {
  public constructor() {
    super('Router preload error aborted')
  }
}
