import { readonly } from 'vue'
import { Resolved, Route, RouteMethods, Routes } from '@/types'
import { createRouteMethods, resolveRoutes } from '@/utilities'
import { resolveRoutesRegex } from '@/utilities/resolveRoutesRegex'
import { routeMatch } from '@/utilities/routeMatch'

type RouterPush = (url: string, options?: { replace: boolean }) => Promise<void>
type RouterReplace = (url: string) => Promise<void>
type RouterNavigation = (number: number) => Promise<void>

export type Router<
  TRoutes extends Routes
> = {
  routes: RouteMethods<TRoutes>,
  route: Readonly<Resolved<Route>>,
  push: RouterPush,
  replace: RouterReplace,
  back: RouterNavigation,
  forward: RouterNavigation,
  go: RouterNavigation,
}

export function createRouter<T extends Routes>(routes: T): Router<T> {
  const resolved = resolveRoutes(routes)
  const resolvedWithRegex = resolveRoutesRegex(resolved)

  // todo: implement this
  const route: Router<T>['route'] = readonly({} as any)

  const push: RouterPush = async (url, options) => {
    const match = routeMatch(resolvedWithRegex, url)

    if (!match) {
      const method = options?.replace ? window.location.replace : window.location.assign
      method(url)
      return
    }

    throw 'not implemented'
  }

  const replace: Router<T>['replace'] = (url) => {
    return push(url, { replace: true })
  }

  const forward: Router<T>['forward'] = (number = 1) => {
    return go(number)
  }

  const back: Router<T>['forward'] = (number = -1) => {
    return go(number)
  }

  const go: Router<T>['go'] = (_number) => {
    throw 'not implemented'
  }

  const router = {
    routes: createRouteMethods<T>(resolved),
    route,
    push,
    replace,
    forward,
    back,
    go,
  }

  return router
}