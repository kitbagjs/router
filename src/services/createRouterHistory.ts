import { createBrowserHistory, createHashHistory, createMemoryHistory, createPath, History, Listener } from 'history'
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

type RouterHistoryOptions = {
  listener: Listener,
  mode?: RouterHistoryMode,
}

export function createRouterHistory({ mode, listener }: RouterHistoryOptions): RouterHistory {
  const history = createHistory(mode)

  const update: NavigationUpdate = (url, options) => {
    if (options?.replace) {
      history.replace(url, options.state)
      return
    }

    history.push(url, options?.state)
  }

  const refresh: NavigationRefresh = () => {
    const url = createPath(history.location)

    history.replace(url)
  }

  let removeListener: (() => void) | undefined

  const startListening: () => void = () => {
    removeListener?.()
    removeListener = history.listen(listener)
  }

  const stopListening: () => void = () => {
    removeListener?.()
  }

  return {
    ...history,
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
