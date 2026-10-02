import { vi } from 'vitest'
import { withAbortSignal } from '@/utilities/withAbortSignal'

type Entry = {
  key: string,
  index: number,
  url: string,
  getState: () => unknown,
}

/**
 * Happy DOM has no Navigation API. This test double models its two commit phases; native scroll,
 * focus and actual browser traversal policy are checked separately in Chrome.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- Preserve the inferred spies and entries for tests.
export function mockNavigation(state?: unknown) {
  const events = new EventTarget()
  let entries: Entry[] = [entry(window.location.href, state, 0)]
  let currentEntry = entries[0]
  let pending: AbortController | undefined

  function entry(url: string, state: unknown, index: number): Entry {
    return { key: crypto.randomUUID(), index, url, getState: () => state }
  }

  function navigate(url: string, options: NavigationNavigateOptions = {}, destinationEntry?: Entry, reload = false): NavigationResult {
    pending?.abort(new DOMException('Superseded navigation', 'AbortError'))
    const controller = new AbortController()

    pending = controller
    let destinationUrl = new URL(url, window.location.href).href
    let destinationState: unknown = options.state
    let history = options.history ?? 'push'
    let interception: NavigationInterceptOptions | undefined
    const navigationType = destinationEntry ? 'traverse' : reload ? 'reload' : history
    const event = Object.assign(new Event('navigate', { cancelable: true }), {
      canIntercept: true,
      downloadRequest: null,
      formData: null,
      navigationType,
      signal: controller.signal,
      destination: {
        get url() {
          return destinationUrl
        },
        getState: () => destinationEntry?.getState() ?? destinationState,
      },
      intercept: (options: NavigationInterceptOptions) => {
        interception = options
      },
    })
    const precommit: NavigationPrecommitController = {
      redirect: (url, options = {}) => {
        if (destinationEntry || reload) {
          throw new DOMException('Cannot redirect a traversal or reload', 'InvalidStateError')
        }

        destinationUrl = new URL(url, window.location.href).href
        destinationState = options.state
        history = options.history ?? history
      },
      addHandler: () => {
        throw new Error('Not used by the router')
      },
    }
    const committed = Promise.withResolvers<NavigationHistoryEntry>()

    events.dispatchEvent(event)

    const finished = (async () => {
      try {
        await interception?.precommitHandler?.(precommit)
        controller.signal.throwIfAborted()

        if (destinationEntry) {
          currentEntry = destinationEntry
          window.history.replaceState(currentEntry.getState(), '', currentEntry.url)
        } else if (!reload) {
          const index = history === 'replace' ? currentEntry.index : currentEntry.index + 1

          currentEntry = entry(destinationUrl, destinationState, index)
          entries = history === 'replace'
            ? entries.map((entry) => {
                return entry.index === index ? currentEntry : entry
              })
            : [...entries.slice(0, index), currentEntry]

          if (history === 'replace') {
            window.history.replaceState(destinationState, '', destinationUrl)
          } else {
            window.history.pushState(destinationState, '', destinationUrl)
          }
        }

        const accepted = currentEntry as NavigationHistoryEntry

        committed.resolve(accepted)
        await interception?.handler?.()
        controller.signal.throwIfAborted()

        return accepted
      } catch (error) {
        committed.reject(error)
        throw error
      }
    })()
    const result = { committed: committed.promise, finished: withAbortSignal(finished, controller.signal) }

    // A native link has no imperative caller consuming the result promises.
    result.committed.catch(() => {})
    result.finished.catch(() => {})

    return result
  }

  const navigation = {
    get currentEntry() {
      return currentEntry
    },
    get canGoBack() {
      return currentEntry.index > 0
    },
    get canGoForward() {
      return currentEntry.index < entries.length - 1
    },
    navigate: vi.fn(navigate),
    reload: vi.fn(() => navigate(currentEntry.url, { state: currentEntry.getState() }, undefined, true)),
    entries: () => entries,
    back: () => navigate(entries[currentEntry.index - 1].url, {}, entries[currentEntry.index - 1]),
    forward: () => navigate(entries[currentEntry.index + 1].url, {}, entries[currentEntry.index + 1]),
    traverseTo: (key: string) => {
      const destination = entries.find((entry) => entry.key === key)

      if (!destination) {
        throw new Error(`Unknown entry: ${key}`)
      }

      return navigate(destination.url, {}, destination)
    },
    dispatchEvent: events.dispatchEvent.bind(events),
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
  }

  vi.stubGlobal('navigation', navigation)
  vi.stubGlobal('NavigationPrecommitController', function NavigationPrecommitController() {})

  return navigation
}
