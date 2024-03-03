import { Action, createBrowserHistory, createMemoryHistory, createPath } from 'history'
import { NavigationAbortError } from '@/errors/navigationAbortError'
import { isBrowser } from '@/utilities/isBrowser'

type BeforeLocationUpdateContext = {
  abort: () => void,
}

export type BeforeLocationUpdate = (url: string, context: BeforeLocationUpdateContext) => Promise<boolean>
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

export function createRouterNavigation({ onBeforeLocationUpdate, onAfterLocationUpdate }: RouterNavigationOptions): RouterNavigation {
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

  const update: NavigationUpdate = async (url, options) => {
    let shouldRunOnAfterLocationUpdate = true

    if (onBeforeLocationUpdate) {
      try {
        shouldRunOnAfterLocationUpdate = await onBeforeLocationUpdate(url, {
          abort: navigationAbort,
        })
      } catch (error) {
        if (error instanceof NavigationAbortError) {
          return
        }

        throw error
      }
    }

    updateUrl(url, options)

    if (shouldRunOnAfterLocationUpdate && onAfterLocationUpdate) {
      await onAfterLocationUpdate(url)
    }
  }

  const refresh: NavigationRefresh = async () => {
    const url = createPath(history.location)

    let shouldRunOnAfterLocationUpdate = true

    if (onBeforeLocationUpdate) {
      try {
        shouldRunOnAfterLocationUpdate = await onBeforeLocationUpdate(url, {
          abort: navigationAbort,
        })
      } catch (error) {
        if (error instanceof NavigationAbortError) {
          return
        }

        throw error
      }
    }

    if (shouldRunOnAfterLocationUpdate && onAfterLocationUpdate) {
      await onAfterLocationUpdate(url)
    }
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

function navigationAbort(): void {
  throw new NavigationAbortError()
}