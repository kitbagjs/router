import { createBrowserHistory, createHashHistory, createMemoryHistory, createPath, History, Update } from '@/services/history'
import { isBrowser } from '@/utilities/isBrowser'

type NavigationPushOptions = {
  replace?: boolean,
  state?: unknown,
}

type NavigationUpdate = (url: string, options?: NavigationPushOptions) => void
type NavigationRefresh = () => void

type RouterHistory = History & {
  update: NavigationUpdate,
  refresh: NavigationRefresh,
  startListening: () => void,
  stopListening: () => void,
}

export type RouterHistoryMode = 'auto' | 'browser' | 'memory' | 'hash'

export type RouterHistoryTraversal = {
  commit: () => void,
  restore: () => void,
}

type RouterHistoryUpdate = Update & {
  traversal?: RouterHistoryTraversal,
}

type RouterHistoryOptions = {
  listener: (event: RouterHistoryUpdate) => void,
  mode?: RouterHistoryMode,
}

export function createRouterHistory({ mode, listener }: RouterHistoryOptions): RouterHistory {
  const history = createHistory(mode)

  let updating = false
  let revision = 0
  let committed = { key: history.location.key, index: history.index }
  let restoring: string | undefined

  function remember(): void {
    committed = { key: history.location.key, index: history.index }
  }

  const update: NavigationUpdate = (url, options) => {
    revision++
    restoring = undefined
    updating = true

    try {
      if (options?.replace) {
        history.replace(url, options.state)
        return
      }

      history.push(url, options?.state)
    } finally {
      remember()
      updating = false
    }
  }

  const refresh: NavigationRefresh = () => {
    const url = createPath(history.location)

    history.replace(url)
  }

  let removeListener: (() => void) | undefined

  const startListening: () => void = () => {
    removeListener?.()
    removeListener = history.listen((event) => {
      if (updating) {
        return
      }

      if (event.action === 'POP' && event.location.key === restoring) {
        restoring = undefined

        return
      }

      restoring = undefined
      const currentRevision = ++revision

      if (event.action !== 'POP') {
        listener(event)

        return
      }

      const isCurrent = (): boolean => currentRevision === revision && history.location.key === event.location.key
      const traversal: RouterHistoryTraversal = {
        commit: () => {
          if (isCurrent()) {
            remember()
          }
        },
        restore: () => {
          if (!isCurrent() || committed.index === null || history.index === null || committed.key === history.location.key) {
            return
          }

          const delta = committed.index - history.index

          if (delta === 0) {
            return
          }

          revision++
          restoring = committed.key
          history.go(delta)
        },
      }

      listener({ ...event, traversal })
    })
  }

  const stopListening: () => void = () => {
    revision++
    restoring = undefined
    removeListener?.()
  }

  return {
    ...history,
    get index() {
      return history.index
    },
    get action() {
      return history.action
    },
    get location() {
      return history.location
    },
    update,
    refresh,
    startListening,
    stopListening,
  }
}

function createHistory(mode: RouterHistoryMode = 'auto'): History {
  switch (mode) {
    case 'auto':
      return isBrowser() ? createBrowserHistory() : createMemoryHistory()
    case 'browser':
      return createBrowserHistory()
    case 'memory':
      return createMemoryHistory()
    case 'hash':
      return createHashHistory()
    default:
      const exhaustive: never = mode
      throw new Error(`Switch is not exhaustive for mode: ${exhaustive}`)
  }
}
