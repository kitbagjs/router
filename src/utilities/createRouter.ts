import { App, readonly } from 'vue'
import { RouterLink, RouterView } from '@/components'
import { routerInjectionKey, routerRejectionKey } from '@/compositions'
import { NavigationAbortError } from '@/errors/navigationAbortError'
import { Routes, Router, RouterOptions, RouterImplementation } from '@/types'
import { RouterPushError, RouterRejectionError } from '@/types/errors'
import { createCurrentRoute } from '@/utilities/createCurrentRoute'
import { createRouteMethods } from '@/utilities/createRouteMethods'
import { createRouterFind } from '@/utilities/createRouterFind'
import { createRouterHistory } from '@/utilities/createRouterHistory'
import { addRouteHookInjectionKey, createRouterHooks } from '@/utilities/createRouterHooks'
import { RouterPushImplementation } from '@/utilities/createRouterPush'
import { createRouterReject } from '@/utilities/createRouterReject'
import { RouterReplaceImplementation } from '@/utilities/createRouterReplace'
import { createRouterResolve } from '@/utilities/createRouterResolve'
import { createRouterRoutes } from '@/utilities/createRouterRoutes'
import { getInitialUrl } from '@/utilities/getInitialUrl'
import { getResolvedRouteForUrl } from '@/utilities/getResolvedRouteForUrl'
import { getRouteHooks } from '@/utilities/getRouteHooks'
import { OnRouteHookError, executeRouteHooks } from '@/utilities/hooks'

type RouterUpdateOptions = {
  replace?: boolean,
}

export function createRouter<const T extends Routes>(routes: T, options: RouterOptions = {}): Router<T> {
  const routerRoutes = createRouterRoutes(routes)
  const resolve = createRouterResolve(routerRoutes)
  const history = createRouterHistory({ mode: options.historyMode })

  const {
    onBeforeRouteEnter,
    onBeforeRouteLeave,
    onBeforeRouteUpdate,
    addRouteHook,
    hooks,
  } = createRouterHooks()

  async function update(url: string, { replace }: RouterUpdateOptions = {}): Promise<void> {
    const to = getResolvedRouteForUrl(routerRoutes, url) ?? getRejectionRoute('NotFound')
    const from = isRejectionRoute(route) ? null : route

    try {
      await executeRouteHooks({
        hooks: [
          ...hooks.before,
          ...getRouteHooks(to, from, 'before'),
        ],
        to,
        from,
        onRouteHookError,
      })

      history.update(url, { replace })

      if (isRejectionRoute(to)) {
        reject('NotFound')
      } else {
        clearRejection()
      }

      updateRoute(to)

      // if (!shouldRunOnAfterLocationUpdate) {
      //   return
      // }

      // await executeRouteHooks({
      //   hooks: [
      //     ...hooks.after,
      //     ...getRouteHooks(to, from, 'after'),
      //   ],
      //   to,
      //   from,
      //   onRouteHookError,
      // })

    } catch (error) {
      if (error instanceof NavigationAbortError) {
        return
      }

      throw error
    }
  }

  const onRouteHookError: OnRouteHookError = (error) => {
    if (error instanceof RouterRejectionError) {
      reject(error.type)
    }

    if (error instanceof RouterPushError) {
      const [source, options] = error.to
      const url = resolve(source)

      history.update(url, options)
      return
    }

    if (!(error instanceof RouterRejectionError)) {
      throw error
    }
  }

  const push: RouterPushImplementation = (source, options) => {
    const url = resolve(source, options)

    return update(url, { replace: options?.replace })
  }

  const replace: RouterReplaceImplementation = (source, options) => {
    return push(source, { ...options, replace: true })
  }

  const methods = createRouteMethods({ routes: routerRoutes, push })
  const find = createRouterFind({ routes: routerRoutes, resolve })
  const { reject, rejection, getRejectionRoute, isRejectionRoute, clearRejection } = createRouterReject(options)
  const notFoundRoute = getRejectionRoute('NotFound')
  const { route, updateRoute } = createCurrentRoute(notFoundRoute)

  const initialUrl = getInitialUrl(options.initialUrl)
  const initialized = update(initialUrl, { replace: true })

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
    refresh: history.refresh,
    forward: history.forward,
    back: history.back,
    go: history.go,
    install,
    onBeforeRouteEnter,
    onBeforeRouteLeave,
    onBeforeRouteUpdate,
    initialized,
  }

  return router as any
}