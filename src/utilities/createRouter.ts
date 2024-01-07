import { DeepReadonly, reactive, readonly } from 'vue'
import { Resolved, Route, RouteMethods, Routes } from '@/types'
import { createRouteMethods, createRouterNavigation, resolveRoutes, routeMatch, getInitialUrl, resolveRoutesRegex } from '@/utilities'

type RouterOptions = {
  initialUrl?: string,
}

type RouterPush = (url: string, options?: { replace: boolean }) => Promise<void>
type RouterReplace = (url: string) => Promise<void>

export type Router<
  TRoutes extends Routes
> = {
  routes: RouteMethods<TRoutes>,
  route: DeepReadonly<Resolved<Route>>,
  push: RouterPush,
  replace: RouterReplace,
  back: () => void,
  forward: () => void,
  go: (delta: number) => void,
}

export function createRouter<T extends Routes>(routes: T, options: RouterOptions = {}): Router<T> {
  const resolved = resolveRoutes(routes)
  const resolvedWithRegex = resolveRoutesRegex(resolved)
  const navigation = createRouterNavigation({
    onLocationUpdate,
  })

  const route: Resolved<Route> = reactive(getInitialRoute())

  function getInitialRoute(): Resolved<Route> {
    const url = getInitialUrl(options.initialUrl)

    return getRoute(url)
  }

  function getRoute(url: string): Resolved<Route> {
    const route = routeMatch(resolvedWithRegex, url)

    if (!route) {
      // not found
      throw 'not implemented'
    }

    return route
  }

  async function onLocationUpdate(url: string): Promise<void> {
    const newRoute = getRoute(url)

    Object.assign(route, newRoute)
  }

  const push: RouterPush = async (url, options) => {
    await navigation.update(url, options)
  }

  const replace: RouterReplace = async (url) => {
    await navigation.update(url, { replace: true })
  }

  const router = {
    routes: createRouteMethods<T>(resolved),
    route: readonly(route),
    push,
    replace,
    forward: navigation.forward,
    back: navigation.back,
    go: navigation.go,
  }

  return router
}