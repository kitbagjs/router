import { isBrowser } from '@/utilities/isBrowser'
import { updateBrowserUrl } from '@/utilities/updateBrowserUrl'

type RouterNavigation = {
  forward: () => void,
  back: () => void,
  go: (delta: number) => void,
  update: (url: string) => void,
}

export function createRouterNavigation(): RouterNavigation {
  return isBrowser() ? createWebNavigation() : createMemoryNavigation()
}

function createWebNavigation(): RouterNavigation {
  return {
    go: window.history.go,
    back: window.history.back,
    forward: window.history.forward,
    update: updateBrowserUrl,
  }
}

function createMemoryNavigation(): RouterNavigation {
  return {
    go: () => {},
    back: () => {},
    forward: () => {},
    update: updateBrowserUrl,
  }
}