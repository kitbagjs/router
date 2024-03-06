import { Action, createBrowserHistory, createMemoryHistory, createPath } from 'history'
import { isBrowser } from '@/utilities/isBrowser'
import { executeLocationUpdateSequence } from '@/utilities/locationUpdateSequence'

export type BeforeLocationUpdate = (url: string) => Promise<boolean>
export type AfterLocationUpdate = (url: string) => Promise<void>

type RouterNavigationOptions = {
  onBeforeLocationUpdate?: BeforeLocationUpdate,
  onAfterLocationUpdate?: AfterLocationUpdate,
}

type RouterNavigationUpdateOptions = {
  replace?: boolean,
}

type NavigationForward = () => void
type NavigationBack = () => void
type NavigationGo = (delta: number) => void
type NavigationUpdate = (url: string, options?: RouterNavigationUpdateOptions) => Promise<void>
type NavigationRefresh = () => Promise<void>
type NavigationCleanup = () => void

export type RouterNavigation = {
  forward: NavigationForward,
  back: NavigationBack,
  go: NavigationGo,
  update: NavigationUpdate,
  refresh: NavigationRefresh,
  cleanup?: () => void,
}

export function createRouterNavigation({ onBeforeLocationUpdate, onAfterLocationUpdate }: RouterNavigationOptions = {}): RouterNavigation {
  const history = isBrowser() ? createBrowserHistory() : createMemoryHistory()

  function updateUrl(url: string, options?: RouterNavigationUpdateOptions): void {
    if (options?.replace) {
      return history.replace(url)
    }

    history.push(url)
  }

  const cleanup: NavigationCleanup = history.listen((update) => {
    if (update.action === Action.Pop) {
      refresh()
    }
  })

  const update: NavigationUpdate = (url, options) => {
    return executeLocationUpdateSequence({
      onBeforeLocationUpdate: () => onBeforeLocationUpdate?.(url),
      onAfterLocationUpdate: () => onAfterLocationUpdate?.(url),
      updateLocation: () => updateUrl(url, options),
    })
  }

  const refresh: NavigationRefresh = () => {
    const url = createPath(history.location)

    return executeLocationUpdateSequence({
      onBeforeLocationUpdate: () => onBeforeLocationUpdate?.(url),
      onAfterLocationUpdate: () => onAfterLocationUpdate?.(url),
    })
  }

  return {
    forward: history.forward,
    back: history.back,
    go: history.go,
    refresh,
    update,
    cleanup,
  }
}