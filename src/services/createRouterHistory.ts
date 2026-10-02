import { createBrowserHistory, createHashHistory, createMemoryHistory, createPath, History, Update } from '@/services/history'
import { isBrowser } from '@/utilities/isBrowser'

type NavigationPushOptions = {
  replace?: boolean,
  state?: unknown,
  traversal?: boolean,
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

type RouterHistoryOptions = {
  listener: (event: Update) => boolean | undefined | Promise<boolean | undefined>,
  mode?: RouterHistoryMode,
}

export function createRouterHistory({ mode, listener }: RouterHistoryOptions): RouterHistory {
  const history = createHistory(mode)

  let updating = false
  let revision = 0
  let acceptedEntry = { key: history.location.key, index: history.index }
  let restoring: string | undefined

  function remember(): void {
    acceptedEntry = { key: history.location.key, index: history.index }
  }

  const update: NavigationUpdate = (url, options) => {
    revision++
    restoring = undefined

    if (options?.traversal) {
      remember()

      return
    }

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

  async function handleChange(event: Update): Promise<void> {
    if (updating) {
      return
    }

    if (event.action === 'POP' && event.location.key === restoring) {
      restoring = undefined

      return
    }

    restoring = undefined
    const currentRevision = ++revision

    const accepted = await listener(event)

    if (currentRevision !== revision || history.location.key !== event.location.key) {
      return
    }

    if (accepted === true) {
      remember()

      return
    }

    if (accepted !== false || event.action !== 'POP' || acceptedEntry.index === null || history.index === null) {
      return
    }

    const delta = acceptedEntry.index - history.index

    if (delta !== 0) {
      revision++
      restoring = acceptedEntry.key
      history.go(delta)
    }
  }

  const startListening: () => void = () => {
    removeListener?.()
    removeListener = history.listen((event) => {
      void handleChange(event)
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
