import { reactive, readonly, App, InjectionKey } from 'vue'
import { RouterLink, RouterView } from '@/components'
import { Resolved, Route, Routes } from '@/types'
import { Router, RouterOptions, RouterPush, RouterReplace } from '@/types/router'
import { createRouteMethods, createRouterNavigation, resolveRoutes, routeMatch, getInitialUrl, resolveRoutesRegex } from '@/utilities'


export const routerInjectionKey: InjectionKey<Router> = Symbol()

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
    app.provide(routerInjectionKey, router)
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

  const push: RouterPush = async (url, options) => {
    await navigation.update(url, options)
  }

  const replace: RouterReplace = async (url) => {
    await navigation.update(url, { replace: true })
  }

  const router = {
    routes: createRouteMethods<T>(resolved, push),
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