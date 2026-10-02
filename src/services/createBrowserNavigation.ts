import { PreparedNavigation, NavigationContext, NavigationPrepare, NavigationPushOptions, RouterHistory } from '@/services/createRouterHistory'
import { Location } from '@/services/history'
import { isSameUrl } from '@/services/urlParser'

type BrowserNavigationOptions = {
  prepare: NavigationPrepare,
}

/**
 * The browser owns URL changes, history entries, scroll restoration and focus. The router approves
 * the destination before commit, then keeps the interception open until its view is ready.
 */
export function createBrowserNavigation({ prepare }: BrowserNavigationOptions): RouterHistory {
  if (typeof window === 'undefined' || typeof window.navigation === 'undefined' || typeof NavigationPrecommitController === 'undefined') {
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

    let prepared: PreparedNavigation | undefined

    event.intercept({
      precommitHandler: async (precommit) => {
        const destination = new URL(event.destination.url)
        const url = `${destination.pathname}${destination.search}${destination.hash}`

        const context: NavigationContext = {
          signal: event.signal,
          redirect: async (url, options = {}) => {
            const destination = new URL(url, window.location.href)

            if (
              destination.origin !== window.location.origin
              || event.navigationType === 'traverse'
              || event.navigationType === 'reload'
            ) {
              await push(url, options)
              return undefined
            }

            precommit.redirect(url, {
              history: options.replace ? 'replace' : 'push',
              state: options.state,
            })

            return prepare(url, options, context)
          },
        }

        prepared = await prepare(url, { state: event.destination.getState() }, context)
        prepared?.signal.throwIfAborted()
      },
      handler: async () => {
        event.signal.throwIfAborted()

        if (prepared) {
          await prepared.commit({ waitForRender: true })
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

  async function push(url: string, options: NavigationPushOptions = {}): Promise<void> {
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
  }

  const context: NavigationContext = {
    redirect: async (url, options) => {
      await push(url, options)
      return undefined
    },
  }

  async function initialize(url: string, options: NavigationPushOptions = {}): Promise<void> {
    startListening()

    if (!isSameUrl(url, window.location.href)) {
      await push(url, { ...options, replace: true })
      return
    }

    // Adopting the initial document does not initiate navigation or reset its scroll and focus.
    try {
      const prepared = await prepare(url, options, context)

      await prepared?.commit()
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        throw error
      }
    }
  }

  return {
    get location(): Location {
      const url = new URL(window.location.href)

      return {
        pathname: url.pathname,
        search: url.search,
        hash: url.hash,
        key: navigation.currentEntry?.key ?? '',
        state: navigation.currentEntry?.getState(),
      }
    },
    push,
    initialize,
    adopt: () => {},
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
