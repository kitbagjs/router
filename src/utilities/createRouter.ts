import { App } from 'vue'
import { RouterLink, RouterView } from '@/components'
import { routerInjectionKey, routerRejectionKey } from '@/compositions'
import { Routes, Router, RouterOptions, RouterImplementation } from '@/types'
import { RouterRejectionError } from '@/types/errors'
import { createRouteMethods, createRouterNavigation, resolveRoutes } from '@/utilities'
import { createRouterPush } from '@/utilities/createRouterPush'
import { createRouterReject, notFoundRouteResolved } from '@/utilities/createRouterReject'
import { createRouterReplace } from '@/utilities/createRouterReplace'
import { createRouterResolve } from '@/utilities/createRouterResolve'
import { createRouterRoute } from '@/utilities/createRouterRoute'
import { getInitialUrl } from '@/utilities/getInitialUrl'
import { routeMatch } from '@/utilities/routeMatch'

export function createRouter<const T extends Routes>(routes: T, options: RouterOptions = {}): Router<T> {
  const resolved = resolveRoutes(routes)
  const resolve = createRouterResolve({ resolved })

  const onLocationUpdate = async (url: string): Promise<void> => {
    const matched = routeMatch(resolved, url)

    if (!matched) {
      await executeMiddleware(notFoundRouteResolved)
      return reject('NotFound')
    }

    try {
      await executeMiddleware(matched)
      updateRoute(matched)
      clearRejection()
    } catch (error) {
      if (error instanceof RouterRejectionError) {
        reject(error.type)
      }
    }
  }

  const navigation = createRouterNavigation({
    onLocationUpdate,
  })

  const push = createRouterPush({ navigation, resolve })
  const replace = createRouterReplace({ push })
  const methods = createRouteMethods({ resolved, push })
  const { reject, rejection, clearRejection } = createRouterReject(options)
  const { route, updateRoute, executeMiddleware } = createRouterRoute(resolve, navigation)

  const initialized = onLocationUpdate(getInitialUrl(options.initialUrl))

  function install(app: App): void {
    app.component('RouterView', RouterView)
    app.component('RouterLink', RouterLink)
    app.provide(routerInjectionKey, router as any)
    app.provide(routerRejectionKey, rejection)
  }

  const router: RouterImplementation = {
    routes: methods,
    route,
    resolve,
    push,
    replace,
    reject: reject,
    refresh: navigation.refresh,
    forward: navigation.forward,
    back: navigation.back,
    go: navigation.go,
    install,
    initialized,
  }

  return router as any
}