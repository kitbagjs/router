import { App, readonly } from 'vue'
import { RouterLink, RouterView } from '@/components'
import { routerInjectionKey, routerRejectionKey } from '@/compositions'
import { Router, RouterOptions, RouterReject } from '@/types/router'
import { RouterPush } from '@/types/routerPush'
import { RouterReplace } from '@/types/routerReplace'
import { RouterRoutes } from '@/types/routerRoute'
import { isUrl } from '@/types/url'
import { createCurrentRoute } from '@/utilities/createCurrentRoute'
import { createRouterFind } from '@/utilities/createRouterFind'
import { createRouterHistory } from '@/utilities/createRouterHistory'
import { routeHookStoreKey, createRouterHooks } from '@/utilities/createRouterHooks'
import { createRouterReject } from '@/utilities/createRouterReject'
import { createRouterResolve, resolve } from '@/utilities/createRouterResolve'
import { getInitialUrl } from '@/utilities/getInitialUrl'
import { getResolvedRouteForUrl } from '@/utilities/getResolvedRouteForUrl'
import { runAfterRouteHooks, runBeforeRouteHooks } from '@/utilities/hooks'

type RouterUpdateOptions = {
  replace?: boolean,
}

export function createRouter<const T extends RouterRoutes>(routes: T, options: RouterOptions = {}): Router<T> {
  const history = createRouterHistory({ mode: options.historyMode })
  const {
    hooks,
    onBeforeRouteEnter,
    onAfterRouteUpdate,
    onBeforeRouteLeave,
    onAfterRouteEnter,
    onBeforeRouteUpdate,
    onAfterRouteLeave,
  } = createRouterHooks()

  async function update(url: string, { replace }: RouterUpdateOptions = {}): Promise<void> {
    const to = getResolvedRouteForUrl(routes, url) ?? getRejectionRoute('NotFound')
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

  const push: RouterPush<T> = (source: string, ...args: any[]): Promise<void> => {
    if (isUrl(source)) {
      const [options] = args
      const url = resolve(routes, source, ...args)

      return update(url, { replace: options?.replace })
    }

    const [params, options] = args
    const url = resolve(routes, source, params, ...args)

    return update(url, { replace: options?.replace })
  }

  const replace: RouterReplace<T> = (source: string, ...args: any[]): Promise<void> => {
    const url = resolve(routes, source, ...args)

    return update(url, { replace: true })
  }

  const reject: RouterReject = (type) => {
    return setRejection(type)
  }

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

  const router = {
    route: readonly(route),
    routes,
    resolve: createRouterResolve(routes),
    find: createRouterFind(routes),
    push,
    replace,
    reject,
    refresh: history.refresh,
    forward: history.forward,
    back: history.back,
    go: history.go,
    install,
    initialized,
    onBeforeRouteEnter,
    onAfterRouteUpdate,
    onBeforeRouteLeave,
    onAfterRouteEnter,
    onBeforeRouteUpdate,
    onAfterRouteLeave,
  }

  return router
}