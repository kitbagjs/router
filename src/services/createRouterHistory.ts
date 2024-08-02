import { createBrowserHistory, createHashHistory, createMemoryHistory, createPath, History, Listener } from 'history'
import { isBrowser } from '@/utilities/isBrowser'

type NavigationPushOptions = {
  replace?: boolean,
}

type NavigationUpdate = (url: string, state: unknown, options?: NavigationPushOptions) => void
type NavigationRefresh = () => void

export type RouterHistory = History & {
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

  const update: NavigationUpdate = (url, state, options) => {
    if (options?.replace) {
      return history.replace(url, state)
    }

    history.push(url, state)
  }

  const refresh: NavigationRefresh = () => {
    // todo: should state be cleared by refresh?
    const url = createPath(history.location)

    return history.replace(url)
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