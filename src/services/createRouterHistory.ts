import { createHashHistory, createMemoryHistory, createPath, Location } from '@/services/history'
import { createBrowserNavigation } from '@/services/createBrowserNavigation'
import { isBrowser } from '@/utilities/isBrowser'

export type NavigationPushOptions = {
  replace?: boolean,
  state?: unknown,
}

/**
 * A destination approved by the router. History checks its signal before writing the entry, then
 * commits the route. Native interception also waits for rendering before releasing scroll/focus.
 */
export type PreparedNavigation = {
  signal: AbortSignal,
  commit: (options?: { waitForRender?: boolean }) => Promise<void>,
}

/**
 * Operations supplied by the history implementation, so the router does not need to know how a
 * pending destination is redirected or which browser event owns it.
 */
export type NavigationContext = {
  signal?: AbortSignal,
  redirect: (url: string, options?: NavigationPushOptions) => Promise<PreparedNavigation | undefined>,
}

export type NavigationPrepare = (url: string, options: NavigationPushOptions, context: NavigationContext) => Promise<PreparedNavigation | undefined>

export type RouterHistory = {
  readonly location: Location,
  push: (url: string, options?: NavigationPushOptions) => Promise<void>,
  initialize: (url: string, options?: NavigationPushOptions) => Promise<void>,
  adopt: (url: string, options?: NavigationPushOptions) => void,
  refresh: () => void,
  back: () => void,
  forward: () => void,
  go: (delta: number) => void,
  startListening: () => void,
  stopListening: () => void,
}

export type RouterHistoryMode = 'auto' | 'browser' | 'memory' | 'hash'

type RouterHistoryOptions = {
  prepare: NavigationPrepare,
  mode?: RouterHistoryMode,
}

export function createRouterHistory({ mode = 'auto', prepare }: RouterHistoryOptions): RouterHistory {
  if (mode === 'auto') {
    return createRouterHistory({ mode: isBrowser() ? 'browser' : 'memory', prepare })
  }

  if (mode === 'browser') {
    return createBrowserNavigation({ prepare })
  }

  const history = mode === 'hash' ? createHashHistory() : createMemoryHistory()
  let updating = false
  let stopped = false
  let removeListener: (() => void) | undefined

  function adopt(url: string, options: NavigationPushOptions = {}): void {
    updating = true

    try {
      if (options.replace) {
        history.replace(url, options.state)
      } else {
        history.push(url, options.state)
      }
    } finally {
      updating = false
    }
  }

  const context: NavigationContext = {
    redirect: async (url, options) => {
      await push(url, options)
      return undefined
    },
  }

  async function push(url: string, options: NavigationPushOptions = {}): Promise<void> {
    if (stopped) {
      return
    }

    try {
      const prepared = await prepare(url, options, context)

      if (!prepared) {
        return
      }

      prepared.signal.throwIfAborted()
      adopt(url, options)
      await prepared.commit()
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }

      throw error
    }
  }

  function startListening(): void {
    if (stopped) {
      return
    }

    removeListener?.()
    removeListener = history.listen(({ location }) => {
      if (updating) {
        return
      }

      // A memory/hash traversal has already moved its entry. Prepare and render without writing
      // another entry. These modes retain their existing traversal cancellation behavior.
      void prepare(createPath(location), { state: location.state }, context)
        .then((prepared) => prepared?.commit())
        .catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === 'AbortError')) {
            throw error
          }
        })
    })
  }

  function stopListening(): void {
    stopped = true
    removeListener?.()
  }

  return {
    get location(): Location {
      return history.location
    },
    push,
    initialize: (url, options) => push(url, { ...options, replace: true }),
    adopt,
    refresh: () => {
      void push(createPath(history.location), { replace: true, state: history.location.state })
    },
    back: history.back,
    forward: history.forward,
    go: history.go,
    startListening,
    stopListening,
  }
}
