import { DeepReadonly, reactive, readonly, App } from 'vue'
import { RouterView } from '@/components'
import { Resolved, Route, RouteMethods, Routes } from '@/types'
import { createRouteMethods, createRouterNavigation, resolveRoutes, routeMatch, getInitialUrl, resolveRoutesRegex, assembleUrl } from '@/utilities'

type RouterOptions = {
  initialUrl?: string,
}

type RouterPushOptions = { replace?: boolean }
type RouterPush<T extends Routes> = {
  (route: { name: T[number]['name'] }, params?: Record<string, unknown>, options?: RouterPushOptions): Promise<void>,
  (url: string, options?: RouterPushOptions): Promise<void>,
}
type RouterReplace = (url: string) => Promise<void>


export type Router<
  TRoutes extends Routes
> = {
  routes: RouteMethods<TRoutes>,
  route: DeepReadonly<Resolved<Route>>,
  push: RouterPush<TRoutes>,
  replace: RouterReplace,
  back: () => void,
  forward: () => void,
  go: (delta: number) => void,
  install: (app: App) => void,
}

export function createRouter<T extends Routes>(routes: T, options: RouterOptions = {}): Router<T> {
  const resolved = resolveRoutes(routes)
  const resolvedWithRegex = resolveRoutesRegex(resolved)
  const navigation = createRouterNavigation({
    onLocationUpdate,
  })

  const route: Resolved<Route> = reactive(getInitialRoute())

  function install(app: App): void {
    app.component('RouterView', RouterView)
  }

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

  async function push(url: string, options?: RouterPushOptions): Promise<void>
  async function push(route: { name: T[number]['name'] }, params?: Record<string, unknown>, options?: RouterPushOptions): Promise<void>
  async function push(urlOrRoute: { name: T[number]['name'] } | string, optionsOrParams: Record<string, any> = {}, possiblyOptions: RouterPushOptions = {}): Promise<void> {
    if (typeof urlOrRoute !== 'string') {
      const route = resolved.find(({ name }) => name === urlOrRoute.name)

      if (!route) {
        throw `No route found with name "${urlOrRoute.name}"`
      }

      const url = assembleUrl(route, optionsOrParams)

      return push(url, possiblyOptions)
    }

    await navigation.update(urlOrRoute, optionsOrParams)
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
    install,
  }

  return router
}