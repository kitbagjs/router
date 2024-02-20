import { App, readonly } from 'vue'
import { RouterLink, RouterView } from '@/components'
import { routerInjectionKey, routerRejectionKey } from '@/compositions'
import { Routes, Router, RouterOptions, RouterImplementation } from '@/types'
import { RouterPushError, RouterRejectionError, RouterReplaceError } from '@/types/errors'
import { createRouteMethods, createRouterNavigation, resolveRoutes } from '@/utilities'
import { createRouterFind } from '@/utilities/createRouterFind'
import { createRouterPush } from '@/utilities/createRouterPush'
import { createRouterReject } from '@/utilities/createRouterReject'
import { createRouterReplace } from '@/utilities/createRouterReplace'
import { createRouterResolve } from '@/utilities/createRouterResolve'
import { createRouterRoute } from '@/utilities/createRouterRoute'
import { getInitialUrl } from '@/utilities/getInitialUrl'
import { executeMiddleware } from '@/utilities/middleware'
import { getRouteMiddleware, getRouterRouteForUrl } from '@/utilities/routes'

export function createRouter<const T extends Routes>(routes: T, options: RouterOptions = {}): Router<T> {
  const resolved = resolveRoutes(routes)
  const resolve = createRouterResolve({ resolved })

  const onLocationUpdate = async (url: string): Promise<void> => {
    const to = getRouterRouteForUrl(resolved, url)
    const from = isRejectionRoute(route) ? null : route

    if (!to) {
      return reject('NotFound')
    }

    try {
      await executeMiddleware({
        middleware: getRouteMiddleware(to),
        to,
        from,
      })
    } catch (error) {
      if (error instanceof RouterRejectionError) {
        reject(error.type)
      }

      if (error instanceof RouterPushError) {
        const [source, options] = error.to
        const url = resolve(source, options)

        navigation.update(url, options)
        return
      }

      if (error instanceof RouterReplaceError) {
        const [source, options] = error.to
        const url = resolve(source, options)

        navigation.update(url, { replace: true })
        return
      }

      if (!(error instanceof RouterRejectionError)) {
        throw error
      }
    }

    updateRoute(to)
    clearRejection()
  }

  const navigation = createRouterNavigation({
    onLocationUpdate,
  })

  const push = createRouterPush({ navigation, resolve })
  const replace = createRouterReplace({ push })
  const methods = createRouteMethods({ resolved, push })
  const find = createRouterFind({ resolved, resolve })
  const { reject, rejection, getRejectionRoute, isRejectionRoute, clearRejection } = createRouterReject(options)
  const notFoundRoute = getRejectionRoute('NotFound')
  const { route, updateRoute } = createRouterRoute(notFoundRoute)

  const initialized = onLocationUpdate(getInitialUrl(options.initialUrl))

  function install(app: App): void {
    app.component('RouterView', RouterView)
    app.component('RouterLink', RouterLink)
    app.provide(routerInjectionKey, router as any)
    app.provide(routerRejectionKey, rejection)
  }

  const router: RouterImplementation = {
    routes: methods,
    route: readonly(route),
    resolve,
    push,
    replace,
    reject,
    find,
    refresh: navigation.refresh,
    forward: navigation.forward,
    back: navigation.back,
    go: navigation.go,
    install,
    initialized,
  }

  return router as any
}