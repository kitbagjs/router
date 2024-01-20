import { reactive, readonly, App, InjectionKey } from 'vue'
import { RouterLink, RouterView } from '@/components'
import { Resolved, Route, Routes, Router, RouterOptions, RegisteredRouter, RouterReplaceOptions } from '@/types'
import { createRouteMethods, createRouterNavigation, resolveRoutes, routeMatch, getInitialUrl, resolveRoutesRegex } from '@/utilities'
import { createRouterPush } from '@/utilities/createRouterPush'

export const routerInjectionKey: InjectionKey<RegisteredRouter> = Symbol()

export function createRouter<T extends Routes>(routes: T, options: RouterOptions = {}): Router<T> {
  const resolved = resolveRoutes(routes)
  const resolvedWithRegex = resolveRoutesRegex(resolved)
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
    const route = routeMatch(resolvedWithRegex, url)

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

  async function replace(url: string, options: RouterReplaceOptions = {}): Promise<void> {
    await navigation.update(url, { ...options, replace: true })
  }

  const push = createRouterPush<T>({ navigation, resolved })

  const router = {
    routes: createRouteMethods<T>({ resolved, push }),
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