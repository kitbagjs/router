import { NavigationAbortError } from '@/errors/navigationAbortError'
import { isBrowser } from '@/utilities/isBrowser'
import { updateBrowserUrl } from '@/utilities/updateBrowserUrl'

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

export function createRouterNavigation(options: RouterNavigationOptions): RouterNavigation {
  if (isBrowser()) {
    return createBrowserNavigation(options)
  }

  return createNodeNavigation(options)
}

function createBrowserNavigation({ onBeforeLocationUpdate, onAfterLocationUpdate }: RouterNavigationOptions): RouterNavigation {

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

    await updateBrowserUrl(url, options)

    if (shouldRunOnAfterLocationUpdate && onAfterLocationUpdate) {
      await onAfterLocationUpdate(url)
    }
  }

  const refresh: NavigationRefresh = async () => {
    const url = window.location.toString()

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

  const cleanup: NavigationCleanup = () => {
    removeEventListener('popstate', refresh)
  }

  addEventListener('popstate', refresh)

  return {
    forward: history.forward,
    back: history.back,
    go: history.go,
    refresh,
    update,
    cleanup,
  }
}

function createNodeNavigation({ onBeforeLocationUpdate, onAfterLocationUpdate }: RouterNavigationOptions): RouterNavigation {

  const notSupported = (): any => {
    throw new Error('Browser like navigation is not supported outside of a browser context')
  }

  const update: NavigationUpdate = async (url) => {
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
      return await onAfterLocationUpdate(url)
    }
  }

  const cleanup: NavigationCleanup = () => {}

  return {
    forward: notSupported,
    back: notSupported,
    go: notSupported,
    refresh: notSupported,
    cleanup,
    update,
  }
}

function navigationAbort(): void {
  throw new NavigationAbortError()
}