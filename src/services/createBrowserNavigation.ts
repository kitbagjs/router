import { isBrowser } from '@/utilities/isBrowser'
import { RouterHistoryMode } from '@/services/createRouterHistory'

export type NavigationCommit = () => Promise<void>

export type BrowserNavigationContext = {
  event: NavigateEvent,
  precommit: NavigationPrecommitController,
}

type BrowserNavigationOptions = {
  prepare: (url: string, state: unknown, context: BrowserNavigationContext) => Promise<NavigationCommit>,
}

export function usesBrowserNavigation(mode: RouterHistoryMode = 'auto', ssr = false): boolean {
  if (ssr) {
    return false
  }

  if (mode === 'browser') {
    return true
  }

  return mode === 'auto' && isBrowser()
}

type BrowserNavigation = {
  readonly state: unknown,
  push: (url: string, options?: { replace?: boolean, state?: unknown }) => Promise<void>,
  refresh: () => void,
  back: () => void,
  forward: () => void,
  go: (delta: number) => void,
  startListening: () => void,
  stopListening: () => void,
}

/**
 * The browser owns URL changes, history entries, scroll restoration and focus. The router approves
 * the destination before commit, then keeps the interception open until its view is ready.
 */
export function createBrowserNavigation({ prepare }: BrowserNavigationOptions): BrowserNavigation {
  if (!('navigation' in window) || !('NavigationPrecommitController' in window)) {
    throw new Error('Browser routing requires the Navigation API with precommit interception. Use memory or hash mode explicitly in unsupported browsers.')
  }

  const navigation = window.navigation
  let listener: AbortController | undefined
  let reloadingDocument = false
  let stopped = false

  function onNavigate(event: NavigateEvent): void {
    if (reloadingDocument || !event.canIntercept || event.downloadRequest !== null || event.formData) {
      return
    }

    // The browser may refuse to let a site cancel a traversal. Let the server render that entry
    // rather than running guards too late and leaving the address and rendered route out of sync.
    if (!event.cancelable) {
      event.intercept({
        handler: () => {
          reloadingDocument = true
          window.location.reload()
        },
      })

      return
    }

    let commit: NavigationCommit | undefined

    event.intercept({
      precommitHandler: async (precommit) => {
        const destination = new URL(event.destination.url)
        const url = `${destination.pathname}${destination.search}${destination.hash}`

        commit = await prepare(url, event.destination.getState(), { event, precommit })
      },
      handler: async () => {
        event.signal.throwIfAborted()

        if (commit) {
          await commit()
        }
      },
    })
  }

  async function finish(result: NavigationResult): Promise<void> {
    // Both promises reject when a navigation is canceled. Observe committed as well, even though
    // callers only wait for finished (which includes rendering and native scrolling).
    result.committed?.catch(() => {})

    try {
      await result.finished
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

    listener?.abort()
    listener = new AbortController()
    navigation.addEventListener('navigate', onNavigate, listener)
  }

  function stopListening(): void {
    stopped = true
    listener?.abort()
  }

  return {
    get state(): unknown {
      return navigation.currentEntry?.getState()
    },
    push: async (url, options = {}) => {
      if (stopped) {
        return
      }

      if (!listener) {
        startListening()
      }

      await finish(navigation.navigate(url, {
        history: options.replace ? 'replace' : 'push',
        state: options.state,
      }))
    },
    refresh: () => {
      void finish(navigation.reload())
    },
    back: () => {
      if (navigation.canGoBack) {
        void finish(navigation.back())
      }
    },
    forward: () => {
      if (navigation.canGoForward) {
        void finish(navigation.forward())
      }
    },
    go: (delta: number) => {
      if (delta === 0) {
        void finish(navigation.reload())
        return
      }

      const index = (navigation.currentEntry?.index ?? 0) + delta
      const entry = navigation.entries().find((entry) => entry.index === index)

      if (entry !== undefined) {
        void finish(navigation.traverseTo(entry.key))
      }
    },
    startListening,
    stopListening,
  }
}
