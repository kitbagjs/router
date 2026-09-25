import { RouterHistoryMode } from '@/services/createRouterHistory'
import { isBrowser } from '@/utilities/isBrowser'

// One document router can delay the viewport's native restoration at a time.
let owner: symbol | undefined

export type ScrollTraversal = {
  signal: AbortSignal,
  finished: Promise<void>,
  scroll: () => void,
  wait: (work: Promise<void>) => Promise<void>,
  resolve: () => void,
  reject: (reason: unknown) => void,
}

type ScrollRestorationOptions = {
  enabled: boolean,
  mode?: RouterHistoryMode,
}

type ScrollRestoration = {
  start: () => void,
  take: () => ScrollTraversal | undefined,
  stop: () => void,
}

export function createScrollRestoration({ enabled, mode = 'auto' }: ScrollRestorationOptions): ScrollRestoration {
  const key = Symbol()
  let pending: ScrollTraversal | undefined
  let stopped = false
  let removeListener: (() => void) | undefined

  function start(): void {
    if (stopped || !supported() || owner) {
      return
    }

    owner = key

    const navigate = (event: NavigateEvent): void => {
      if (typeof event.intercept !== 'function' || typeof event.scroll !== 'function' || event.navigationType !== 'traverse' || event.hashChange || !event.destination.sameDocument || !event.canIntercept || event.defaultPrevented || window.history.scrollRestoration !== 'auto') {
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
      const { promise, resolve, reject } = Promise.withResolvers<void>()
      const traversal = { signal: event.signal, finished: promise, scroll: () => event.scroll(), wait: (work: Promise<void>) => Promise.race([work, promise]), resolve, reject }
      const abort = (): void => reject(event.signal.reason)

      pending?.reject(new DOMException('Traversal superseded', 'AbortError'))
      pending = traversal
      event.signal.addEventListener('abort', abort, { once: true })
      if (event.signal.aborted) abort()
      void promise.catch(() => {}).finally(() => {
        event.signal.removeEventListener('abort', abort)
        if (pending === traversal) {
          pending = undefined
        }
      })

      try {
        event.intercept({ handler: () => promise, focusReset: 'manual' })
      } catch (error) {
        pending = undefined
        reject(error)
      }
    }

    window.navigation.addEventListener('navigate', navigate)
    removeListener = () => window.navigation.removeEventListener('navigate', navigate)
  }

  function take(): ScrollTraversal | undefined {
    const traversal = pending
    pending = undefined
    return traversal?.signal.aborted ? undefined : traversal
  }

  function stop(): void {
    stopped = true
    removeListener?.()
    pending?.reject(new DOMException('Router stopped', 'AbortError'))
    pending = undefined
    if (owner === key) {
      owner = undefined
    }
  }

  function supported(): boolean {
    return enabled && isBrowser() && ['auto', 'browser'].includes(mode) && 'navigation' in window
  }

  return {
    start,
    take,
    stop,
  }
}
