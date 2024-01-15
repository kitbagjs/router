import { reactive, readonly, App, InjectionKey } from 'vue'
import { RouterLink, RouterView } from '@/components'
import { Resolved, Route, Routes, Router, RouterOptions, RouterPush, RouterReplace, RouterPushRoute, RouterPushOptions } from '@/types'
import { createRouteMethods, createRouterNavigation, resolveRoutes, routeMatch, getInitialUrl, resolveRoutesRegex, assembleUrl, flattenParentMatches } from '@/utilities'

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

  const push: RouterPush = (urlOrRoute: string | RouterPushRoute, possiblyOptions: RouterPushOptions = {}) => {
    if (typeof urlOrRoute === 'string') {
      return navigation.update(urlOrRoute, possiblyOptions)
    }

    const { name, params, replace } = urlOrRoute
    const route = resolved.find((route) => flattenParentMatches(route) === name)

    if (!route) {
      throw `No route found with name "${String(name)}"`
    }

    const url = assembleUrl(route, params)

    return navigation.update(url, { replace })
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