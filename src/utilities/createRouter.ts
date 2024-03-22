import { App, readonly } from 'vue'
import { RouterLink, RouterView } from '@/components'
import { routerInjectionKey, routerRejectionKey } from '@/compositions'
import { Routes, Router, RouterOptions, RouterImplementation, RouterReject } from '@/types'
import { RouterPushImplementation } from '@/types/routerPush'
import { RouterReplaceImplementation } from '@/types/routerReplace'
import { createCurrentRoute } from '@/utilities/createCurrentRoute'
import { createRouteMethods } from '@/utilities/createRouteMethods'
import { createRouterFind } from '@/utilities/createRouterFind'
import { createRouterHistory } from '@/utilities/createRouterHistory'
import { routeHookStoreKey, createRouterHooks } from '@/utilities/createRouterHooks'
import { createRouterReject } from '@/utilities/createRouterReject'
import { createRouterResolve } from '@/utilities/createRouterResolve'
import { createRouterRoutes } from '@/utilities/createRouterRoutes'
import { getInitialUrl } from '@/utilities/getInitialUrl'
import { getResolvedRouteForUrl } from '@/utilities/getResolvedRouteForUrl'
import { runAfterRouteHooks, runBeforeRouteHooks } from '@/utilities/hooks'

type RouterUpdateOptions = {
  replace?: boolean,
}

export function createRouter<const T extends Routes>(routes: T, options: RouterOptions = {}): Router<T> {
  const routerRoutes = createRouterRoutes(routes)
  const resolve = createRouterResolve(routerRoutes)
  const history = createRouterHistory({ mode: options.historyMode })
  const { hooks, ...routeHookMethods } = createRouterHooks()

  async function update(url: string, { replace }: RouterUpdateOptions = {}): Promise<void> {
    const to = getResolvedRouteForUrl(routerRoutes, url) ?? getRejectionRoute('NotFound')
    const from = route

    const beforeResponse = await runBeforeRouteHooks({ to, from, hooks })

    const setHistory = (): void => history.update(url, { replace })
    const setRoute = (): void => updateRoute(to)

    switch (beforeResponse.status) {
      // On abort do nothing
      case 'ABORT':
        return

      // On push update the history, and push new route, and return
      case 'PUSH':
        setHistory()
        push(...beforeResponse.to)
        return

      // On reject update the history, the route, and set the rejection type
      case 'REJECT':
        setHistory()
        setRoute()
        setRejection(beforeResponse.type)
        break

      // On success update history, set the route, and clear the rejection
      case 'SUCCESS':
        setHistory()
        setRoute()
        setRejection(null)
        break

      default:
        throw new Error(`Switch is not exhaustive for before hook response status: ${JSON.stringify(beforeResponse satisfies never)}`)
    }

    const afterResponse = await runAfterRouteHooks({ to, from, hooks })

    switch (afterResponse.status) {
      case 'PUSH':
        push(...afterResponse.to)
        break

      case 'REJECT':
        setRejection(afterResponse.type)
        break

      case 'SUCCESS':
        break

      default:
        const exhaustive: never = afterResponse
        throw new Error(`Switch is not exhaustive for after hook response status: ${JSON.stringify(exhaustive)}`)
    }
  }

  const push: RouterPushImplementation = (source, options) => {
    const url = resolve(source, options)

    return update(url, { replace: options?.replace })
  }

  const replace: RouterReplaceImplementation = (source, options) => {
    return push(source, { ...options, replace: true })
  }

  const reject: RouterReject = (type) => {
    return setRejection(type)
  }

  const methods = createRouteMethods({ routes: routerRoutes, push })
  const find = createRouterFind({ routes: routerRoutes, resolve })
  const { setRejection, rejection, getRejectionRoute } = createRouterReject(options)
  const notFoundRoute = getRejectionRoute('NotFound')
  const { route, updateRoute } = createCurrentRoute(notFoundRoute)

  const initialUrl = getInitialUrl(options.initialUrl)
  const initialized = update(initialUrl, { replace: true })

  function install(app: App): void {
    app.component('RouterView', RouterView)
    app.component('RouterLink', RouterLink)
    app.provide(routerInjectionKey, router as any)
    app.provide(routerRejectionKey, rejection)
    app.provide(routeHookStoreKey, hooks)
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
    initialized,
    ...routeHookMethods,
  }

  return router as any
}