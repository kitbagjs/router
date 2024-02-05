import { reactive, readonly, App } from 'vue'
import { RouterLink, RouterView } from '@/components'
import { routerInjectionKey, routerRejectionKey } from '@/compositions'
import { Resolved, Route, Routes, Router, RouterOptions, RouterReplaceOptions, RouterImplementation } from '@/types'
import { createRouteMethods, createRouterNavigation, resolveRoutes, routeMatch, getInitialUrl } from '@/utilities'
import { createRouterPush } from '@/utilities/createRouterPush'
import { createRouterReject } from '@/utilities/createRouterReject'
import { createRouterResolve } from '@/utilities/createRouterResolve'

export function createRouter<const T extends Routes>(routes: T, options: RouterOptions = {}): Router<T> {
  const { reject, rejection, clearRejection, getRejectionRoute } = createRouterReject(options)
  const resolved = resolveRoutes(routes)
  const navigation = createRouterNavigation({
    onLocationUpdate,
  })

  const route: Resolved<Route> = reactive(getInitialRoute())

  function install(app: App): void {
    app.component('RouterView', RouterView)
    app.component('RouterLink', RouterLink)
    app.provide(routerInjectionKey, router as any)
    app.provide(routerRejectionKey, rejection)
  }

  function getInitialRoute(): Resolved<Route> {
    const url = getInitialUrl(options.initialUrl)

    return getRoute(url)
  }

  function getRoute(url: string): Resolved<Route> {
    const route = routeMatch(resolved, url)

    if (!route) {
      reject('NotFound')
      return getRejectionRoute('NotFound')
    }

    clearRejection()
    return { ...route }
  }

  function onLocationUpdate(url: string): Promise<void> {
    const newRoute = getRoute(url)

    Object.assign(route, newRoute)

    return Promise.resolve()
  }

  function replace(url: string, options: RouterReplaceOptions = {}): Promise<void> {
    return push(url, { ...options, replace: true })
  }

  const resolve = createRouterResolve({ resolved })
  const push = createRouterPush({ navigation, resolve })
  const methods = createRouteMethods({ resolved, push })

  const router: RouterImplementation = {
    routes: methods,
    route: readonly(route),
    resolve,
    push,
    replace,
    reject,
    refresh: navigation.refresh,
    forward: navigation.forward,
    back: navigation.back,
    go: navigation.go,
    install,
  }

  return router as any
}