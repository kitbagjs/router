import { createPath, History, Location } from '@/services/history'
import { NavigationPrepare, NavigationPushOptions, RouterHistory } from '@/types/routerHistory'
import { ignoreNavigationAbort } from '@/utilities/ignoreNavigationAbort'

type HistoryNavigationOptions = {
  history: History,
  prepare: NavigationPrepare,
}

/** Coordinates guard decisions and route commits for memory and hash history. */
export function createHistoryNavigation({ history, prepare }: HistoryNavigationOptions): RouterHistory {
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

  async function push(url: string, options: NavigationPushOptions = {}): Promise<void> {
    if (stopped) {
      return
    }

    await ignoreNavigationAbort(navigate(url, options, { writeEntry: true }))
  }

  async function navigate(url: string, options: NavigationPushOptions, { writeEntry }: { writeEntry: boolean }): Promise<void> {
    const prepared = await prepare(url, options, {})

    if (!prepared) {
      return
    }

    if ('redirect' in prepared) {
      await push(prepared.redirect, prepared.options)
      return
    }

    prepared.signal.throwIfAborted()

    if (writeEntry) {
      adopt(url, options)
    }

    await prepared.commit()
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
      void ignoreNavigationAbort(navigate(createPath(location), { state: location.state }, { writeEntry: false }))
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
