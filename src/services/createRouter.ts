import { createPath } from 'history'
import { App } from 'vue'
import { RouterLink, RouterView } from '@/components'
import { routerRejectionKey } from '@/compositions/useRejection'
import { routerInjectionKey } from '@/compositions/useRouter'
import { createCurrentRoute } from '@/services/createCurrentRoute'
import { createIsExternal } from '@/services/createIsExternal'
import { parseUrl } from '@/services/urlParser'
import { createPropStore, propStoreKey } from '@/services/createPropStore'
import { createRouterHistory } from '@/services/createRouterHistory'
import { routeHookStoreKey, createRouterHooks } from '@/services/createRouterHooks'
import { createRouterReject } from '@/services/createRouterReject'
import { createRouterResolve } from '@/services/createRouterResolve'
import { getInitialUrl } from '@/services/getInitialUrl'
import { getResolvedRouteForUrl } from '@/services/getResolvedRouteForUrl'
import { createRouteHookRunners } from '@/services/hooks'
import { insertBaseRoute } from '@/services/insertBaseRoute'
import { setStateValues } from '@/services/state'
import { ResolvedRoute } from '@/types/resolved'
import { Route, Routes } from '@/types/route'
import { Router, RouterOptions, RouterReject } from '@/types/router'
import { RouterPush, RouterPushOptions } from '@/types/routerPush'
import { RouterReplace, RouterReplaceOptions } from '@/types/routerReplace'
import { RoutesName } from '@/types/routesMap'
import { Url, isUrl } from '@/types/url'
import { checkDuplicateNames } from '@/utilities/checkDuplicateNames'
import { isNestedArray } from '@/utilities/guards'
import { CallbackResponse } from './createCallbackContext'

type RouterUpdateOptions = {
  replace?: boolean,
  state?: unknown,
}

/**
 * Creates a router instance for a Vue application, equipped with methods for route handling, lifecycle hooks, and state management.
 *
 * @param routes - {@link Routes} An array of route definitions specifying the configuration of routes in the application.
 * Use createRoute method to create the route definitions.
 * @param options - {@link RouterOptions} for the router, including history mode and initial URL settings.
 * @returns Router instance
 *
 * @example
 * ```ts
 * import { createRoute, createRouter } from '@kitbag/router'
 *
 * const Home = { template: '<div>Home</div>' }
 * const About = { template: '<div>About</div>' }
 *
 * export const routes = [
 *   createRoute({ name: 'home', path: '/', component: Home }),
 *   createRoute({ name: 'path', path: '/about', component: About }),
 * ]
 *
 * const router = createRouter(routes)
 * ```
 */
export function createRouter<const TRoutes extends Routes, const TOptions extends RouterOptions>(routes: TRoutes, options?: TOptions): Router<TRoutes, TOptions>
export function createRouter<const TRoutes extends Routes, const TOptions extends RouterOptions>(arrayOfRoutes: TRoutes[], options?: TOptions): Router<TRoutes, TOptions>
export function createRouter<const TRoutes extends Routes, const TOptions extends RouterOptions>(routesOrArrayOfRoutes: TRoutes | TRoutes[], options?: TOptions): Router<TRoutes, TOptions> {
  const flattenedRoutes = isNestedArray(routesOrArrayOfRoutes) ? routesOrArrayOfRoutes.flat() : routesOrArrayOfRoutes
  const routes = insertBaseRoute(flattenedRoutes, options?.base)

  checkDuplicateNames(routes)

  const propStore = createPropStore()
  const resolve = createRouterResolve(routes)
  const history = createRouterHistory({
    mode: options?.historyMode,
    listener: ({ location }) => {
      const url = createPath(location)

      set(url, { state: location.state })
    },
  })

  const { runBeforeRouteHooks, runAfterRouteHooks } = createRouteHookRunners()
  const {
    hooks,
    onBeforeRouteEnter,
    onAfterRouteUpdate,
    onBeforeRouteLeave,
    onAfterRouteEnter,
    onBeforeRouteUpdate,
    onAfterRouteLeave,
  } = createRouterHooks()

  async function set(url: string, options: RouterUpdateOptions = {}): Promise<void> {
    history.stopListening()

    if (isExternal(url)) {
      history.update(url, options)
      return
    }

    const to = getResolvedRouteForUrl(routes, url, options.state) ?? getRejectionRoute('NotFound')
    const from = { ...currentRoute }

    const beforeResponse = await runBeforeRouteHooks({ to, from, hooks })

    switch (beforeResponse.status) {
      case 'ABORT':
        return

      case 'PUSH':
      case 'REJECT':
        history.update(url, options)
        break

      case 'SUCCESS':
        setRejection(null)
        break
    }
    
    handleCallbackResponse(beforeResponse)

    propStore.setProps(to)

    updateRoute(to)

    const afterResponse = await runAfterRouteHooks({ to, from, hooks })

    handleCallbackResponse(afterResponse)

    history.startListening()
  }

  const push: RouterPush<TRoutes> = (source: Url | RoutesName<TRoutes>, paramsOrOptions?: Record<string, unknown> | RouterPushOptions, maybeOptions?: RouterPushOptions) => {
    if (isUrl(source)) {
      const options: RouterPushOptions = { ...paramsOrOptions }
      const url = resolve(source, options)

      return set(url, options)
    }

    const options: RouterPushOptions = { ...maybeOptions }
    const params: any = paramsOrOptions ?? {}
    const url = resolve(source, params, options)
    const route = getRoute(source)
    const state = setStateValues(route?.state ?? {}, options.state)

    return set(url, { ...options, state })
  }

  const replace: RouterReplace<TRoutes> = (source: Url | RoutesName<TRoutes>, paramsOrOptions?: Record<string, unknown> | RouterReplaceOptions, maybeOptions?: RouterReplaceOptions) => {
    if (isUrl(source)) {
      const options: RouterPushOptions = { ...paramsOrOptions, replace: true }
      const url = resolve(source, options)

      return set(url, options)
    }

    const options: RouterPushOptions = { ...maybeOptions, replace: true }
    const params: any = paramsOrOptions ?? {}
    const url = resolve(source, params, options)
    const route = getRoute(source)
    const state = setStateValues(route?.state ?? {}, options.state)

    return set(url, { ...options, state })
  }

  const reject: RouterReject = (type) => {
    setRejection(type)
  }

  const find = (
    source: Url | RoutesName<TRoutes>,
    params: Record<PropertyKey, unknown> = {},
  ): ResolvedRoute | undefined => {
    if (!isUrl(source)) {
      const url = resolve(source, params as any)

      return getResolvedRouteForUrl(routes, url)
    }

    if (isExternal(source)) {
      return undefined
    }

    return getResolvedRouteForUrl(routes, source)
  }

  const { setRejection, rejection, getRejectionRoute } = createRouterReject(options ?? {})
  const notFoundRoute = getRejectionRoute('NotFound')
  const { currentRoute, routerRoute, updateRoute } = createCurrentRoute<TRoutes>(notFoundRoute, push)

  history.startListening()

  const initialUrl = getInitialUrl(options?.initialUrl)
  const initialState = history.location.state
  const { host } = parseUrl(initialUrl)
  const isExternal = createIsExternal(host)

  let initialized = false

  async function start(): Promise<void> {
    if (initialized) {
      return
    }

    await set(initialUrl, { replace: true, state: initialState })

    initialized = true
  }

  function getRoute(name: string): Route | undefined {
    return routes.find((route) => route.name === name)
  }

  function handleCallbackResponse(response: CallbackResponse): void {
    switch (response.status) {
      case 'ABORT':
        case 'SUCCESS':
        return

      case 'PUSH':
        push(...response.to)
        return

      case 'REJECT':
        setRejection(response.type)
        break

      default:
        throw new Error(`Switch is not exhaustive callback response status: ${JSON.stringify(response satisfies never)}`)
    }
  }

  function install(app: App): void {
    app.component('RouterView', RouterView)
    app.component('RouterLink', RouterLink)
    app.provide(routerRejectionKey, rejection)
    app.provide(routeHookStoreKey, hooks)
    app.provide(propStoreKey, propStore)

    // We cant technically guarantee that the user registered the same router that they installed
    // So we're making an assumption here that when installing a router its the same as the RegisteredRouter
    app.provide(routerInjectionKey, router as any)

    start()
  }

  const router: Router<TRoutes> = {
    route: routerRoute,
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
    isExternal,
    onBeforeRouteEnter,
    onAfterRouteUpdate,
    onBeforeRouteLeave,
    onAfterRouteEnter,
    onBeforeRouteUpdate,
    onAfterRouteLeave,
    prefetch: options?.prefetch,
    start,
  }

  return router
}
