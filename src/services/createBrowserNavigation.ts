import { PreparedNavigation, NavigationPrepare, NavigationPushOptions, RouterHistory } from '@/types/routerHistory'
import { ignoreNavigationAbort } from '@/utilities/ignoreNavigationAbort'
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
        prepared = await prepareNavigation(event, precommit)
      },
      handler: async () => {
        event.signal.throwIfAborted()

        if (prepared) {
          await prepared.commit({ waitForRender: true })
        }
      },
    })
  }

  async function prepareNavigation(event: NavigateEvent, precommit: NavigationPrecommitController): Promise<PreparedNavigation | undefined> {
    const destination = new URL(event.destination.url)
    let url = `${destination.pathname}${destination.search}${destination.hash}`
    let options: NavigationPushOptions = { state: event.destination.getState() }

    for (;;) {
      const prepared = await prepare(url, options, { signal: event.signal })

      event.signal.throwIfAborted()

      if (!prepared) {
        return undefined
      }

      if (!('redirect' in prepared)) {
        prepared.signal.throwIfAborted()
        return prepared
      }

      url = prepared.redirect
      options = prepared.options

      // Precommit redirects only support same-origin push/replace. Other redirects start a new
      // navigation, which cancels this event before it can commit its original destination.
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
    }
  }

  async function finish(result: NavigationResult): Promise<void> {
    // Both promises reject when canceled. Observe committed even though callers await finished,
    // which also includes rendering and native scrolling.
    result.committed?.catch(() => {})
    await ignoreNavigationAbort(Promise.resolve(result.finished))
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

  async function initialize(url: string, options: NavigationPushOptions = {}): Promise<void> {
    startListening()

    if (!isSameUrl(url, window.location.href)) {
      await push(url, { ...options, replace: true })
      return
    }

    // Adopting the initial document does not initiate navigation or reset its scroll and focus.
    await ignoreNavigationAbort(commitInitialRoute(url, options))
  }

  async function commitInitialRoute(url: string, options: NavigationPushOptions): Promise<void> {
    const prepared = await prepare(url, options, {})

    if (!prepared) {
      return
    }

    if ('redirect' in prepared) {
      await push(prepared.redirect, prepared.options)
      return
    }

    prepared.signal.throwIfAborted()
    await prepared.commit()
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
