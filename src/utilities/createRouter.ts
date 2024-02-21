import { App, readonly } from 'vue'
import { RouterLink, RouterView } from '@/components'
import { routerInjectionKey, routerRejectionKey } from '@/compositions'
import { Routes, Router, RouterOptions, RouterImplementation } from '@/types'
import { RouterPushError, RouterRejectionError, RouterReplaceError } from '@/types/errors'
import { createCurrentRoute } from '@/utilities/createCurrentRoute'
import { createRouteMethods } from '@/utilities/createRouteMethods'
import { createRouterFind } from '@/utilities/createRouterFind'
import { addRouteHookInjectionKey, createRouterHooks } from '@/utilities/createRouterHooks'
import { createRouterPush } from '@/utilities/createRouterPush'
import { createRouterReject } from '@/utilities/createRouterReject'
import { createRouterReplace } from '@/utilities/createRouterReplace'
import { createRouterResolve } from '@/utilities/createRouterResolve'
import { createRouterRoutes } from '@/utilities/createRouterRoutes'
import { getInitialUrl } from '@/utilities/getInitialUrl'
import { getResolvedRouteForUrl } from '@/utilities/getResolvedRouteForUrl'
import { OnRouteHookError, executeRouteHooks } from '@/utilities/hooks'
import { createRouterNavigation } from '@/utilities/routerNavigation'
import { getRouteHooks } from '@/utilities/routes'

export function createRouter<const T extends Routes>(routes: T, options: RouterOptions = {}): Router<T> {
  const routerRoutes = createRouterRoutes(routes)
  const resolve = createRouterResolve(routerRoutes)

  const {
    onBeforeRouteEnter,
    onBeforeRouteLeave,
    onBeforeRouteUpdate,
    addRouteHook,
    hooks,
  } = createRouterHooks()

  const onRouteHookError: OnRouteHookError = (error) => {
    if (error instanceof RouterRejectionError) {
      reject(error.type)
    }

    if (error instanceof RouterPushError) {
      const [source, options] = error.to
      const url = resolve(source)

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

  const onLocationUpdate = async (url: string): Promise<void> => {
    const to = getResolvedRouteForUrl(routerRoutes, url)
    const from = isRejectionRoute(route) ? null : route

    if (!to) {
      return reject('NotFound')
    }

    const success = await executeRouteHooks({
      hooks: [
        ...hooks.before,
        ...getRouteHooks(to, 'before'),
      ],
      to,
      from,
      onRouteHookError,
    })

    if (!success) {
      return
    }

    updateRoute(to)
    clearRejection()
  }

  const navigation = createRouterNavigation({
    onLocationUpdate,
  })

  const push = createRouterPush({ navigation, resolve })
  const replace = createRouterReplace({ push })
  const methods = createRouteMethods({ routes: routerRoutes, push })
  const find = createRouterFind({ routes: routerRoutes, resolve })
  const { reject, rejection, getRejectionRoute, isRejectionRoute, clearRejection } = createRouterReject(options)
  const notFoundRoute = getRejectionRoute('NotFound')
  const { route, updateRoute } = createCurrentRoute(notFoundRoute)

  const initialized = onLocationUpdate(getInitialUrl(options.initialUrl))

  function install(app: App): void {
    app.component('RouterView', RouterView)
    app.component('RouterLink', RouterLink)
    app.provide(routerInjectionKey, router as any)
    app.provide(routerRejectionKey, rejection)
    app.provide(addRouteHookInjectionKey, addRouteHook)
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
    onBeforeRouteEnter,
    onBeforeRouteLeave,
    onBeforeRouteUpdate,
    initialized,
  }

  return router as any
}