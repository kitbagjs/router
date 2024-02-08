import { App } from 'vue'
import { RouterLink, RouterView } from '@/components'
import { routerInjectionKey, routerRejectionKey } from '@/compositions'
import { Routes, Router, RouterOptions, RouterImplementation } from '@/types'
import { createRouteMethods, createRouterNavigation, resolveRoutes } from '@/utilities'
import { createRouterPush } from '@/utilities/createRouterPush'
import { createRouterReject } from '@/utilities/createRouterReject'
import { createRouterReplace } from '@/utilities/createRouterReplace'
import { createRouterResolve } from '@/utilities/createRouterResolve'
import { createRouterRoute } from '@/utilities/createRouterRoute'

export function createRouter<const T extends Routes>(routes: T, options: RouterOptions = {}): Router<T> {
  const resolved = resolveRoutes(routes)
  const resolve = createRouterResolve({ resolved })

  const navigation = createRouterNavigation({
    onLocationUpdate: (url) => updateRoute(url),
  })

  const push = createRouterPush({ navigation, resolve })
  const replace = createRouterReplace({ push })
  const methods = createRouteMethods({ resolved, push })
  const routerReject = createRouterReject(options)
  const { route, updateRoute, initialized } = createRouterRoute({ resolve, resolved, navigation, routerReject, initialUrl: options.initialUrl })

  function install(app: App): void {
    app.component('RouterView', RouterView)
    app.component('RouterLink', RouterLink)
    app.provide(routerInjectionKey, router as any)
    app.provide(routerRejectionKey, routerReject.rejection)
  }

  const router: RouterImplementation = {
    routes: methods,
    route,
    resolve,
    push,
    replace,
    reject: routerReject.reject,
    refresh: navigation.refresh,
    forward: navigation.forward,
    back: navigation.back,
    go: navigation.go,
    install,
    initialized,
  }

  return router as any
}