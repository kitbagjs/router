import { reactive, readonly, App, InjectionKey } from 'vue'
import { RouterLink, RouterView } from '@/components'
import { Resolved, Route, Routes, Router, RouterOptions, RegisteredRouter, RouterReplaceOptions, RouterImplementation } from '@/types'
import { createRouteMethods, createRouterNavigation, resolveRoutes, routeMatch, getInitialUrl } from '@/utilities'
import { createRouterPush } from '@/utilities/createRouterPush'
import { createRouterReject } from '@/utilities/createRouterReject'
import { createRouterResolve } from '@/utilities/createRouterResolve'

export const routerInjectionKey: InjectionKey<RegisteredRouter> = Symbol()

export function createRouter<T extends Routes>(routes: T, options: RouterOptions = {}): Router<T> {
  const resolved = resolveRoutes(routes)
  const navigation = createRouterNavigation({
    onLocationUpdate,
  })

  const route: Resolved<Route> = reactive(getInitialRoute())

  function install(app: App): void {
    app.component('RouterView', RouterView)
    app.component('RouterLink', RouterLink)
    app.provide(routerInjectionKey, router as any)
  }

  function getInitialRoute(): Resolved<Route> {
    const url = getInitialUrl(options.initialUrl)

    return getRoute(url)
  }

  function getRoute(url: string): Resolved<Route> {
    const route = routeMatch(resolved, url)

    if (!route) {
      // not found
      throw 'not implemented'
    }

    return { ...route }
  }

  async function onLocationUpdate(url: string): Promise<void> {
    const newRoute = getRoute(url)

    Object.assign(route, newRoute)
  }


  function replace(url: string, options: RouterReplaceOptions = {}): Promise<void> {
    return push(url, { ...options, replace: true })
  }

  const resolve = createRouterResolve({ resolved })
  const push = createRouterPush({ navigation, resolve })
  const methods = createRouteMethods({ resolved, push })
  const reject = createRouterReject()

  const router: RouterImplementation = {
    routes: methods,
    route: readonly(route),
    resolve,
    push,
    replace,
    reject,
    forward: navigation.forward,
    back: navigation.back,
    go: navigation.go,
    install,
  }

  return router as any
}