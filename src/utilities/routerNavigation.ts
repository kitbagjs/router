import { isBrowser } from '@/utilities/isBrowser'
import { updateBrowserUrl } from '@/utilities/updateBrowserUrl'

type RouterNavigationOptions = {
  onBeforeLocationUpdate?: (url: string) => Promise<void>,
  onAfterLocationUpdate?: (url: string) => Promise<void>,
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
    if (onBeforeLocationUpdate) {
      await onBeforeLocationUpdate(url)
    }

    await updateBrowserUrl(url, options)

    if (onAfterLocationUpdate) {
      return await onAfterLocationUpdate(url)
    }
  }

  const refresh: NavigationRefresh = async () => {
    const url = window.location.toString()

    if (onBeforeLocationUpdate) {
      await onBeforeLocationUpdate(url)
    }

    if (onAfterLocationUpdate) {
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
    if (onBeforeLocationUpdate) {
      await onBeforeLocationUpdate(url)
    }

    if (onAfterLocationUpdate) {
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
