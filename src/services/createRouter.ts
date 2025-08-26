import { createPath } from 'history'
import { App, ref } from 'vue'
import { RouterLink, RouterView } from '@/components'
import { routerRejectionKey } from '@/compositions/useRejection'
import { routerInjectionKey } from '@/compositions/useRouter'
import { createCurrentRoute } from '@/services/createCurrentRoute'
import { createIsExternal } from '@/services/createIsExternal'
import { parseUrl } from '@/services/urlParser'
import { createPropStore, propStoreKey } from '@/services/createPropStore'
import { createRouterHistory } from '@/services/createRouterHistory'
import { routerHooksKey, createRouterHooks } from '@/services/createRouterHooks'
import { createRouterReject } from '@/services/createRouterReject'
import { getInitialUrl } from '@/services/getInitialUrl'
import { setStateValues } from '@/services/state'
import { Routes } from '@/types/route'
import { Router, RouterOptions } from '@/types/router'
import { RouterPush, RouterPushOptions } from '@/types/routerPush'
import { RouterReplace, RouterReplaceOptions } from '@/types/routerReplace'
import { RoutesName } from '@/types/routesMap'
import { Url, isUrl } from '@/types/url'
import { createUniqueIdSequence, isFirstUniqueSequenceId } from '@/services/createUniqueIdSequence'
import { createVisibilityObserver } from './createVisibilityObserver'
import { visibilityObserverKey } from '@/compositions/useVisibilityObserver'
import { RouterResolve, RouterResolveOptions } from '../types/RouterResolve'
import { RouteNotFoundError } from '@/errors/routeNotFoundError'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { ResolvedRoute } from '@/types/resolved'
import { createResolvedRouteForUrl } from '@/services/createResolvedRouteForUrl'
import { combineUrl } from '@/services/urlCombine'
import { RouterReject } from '@/types/routerReject'
import { EmptyRouterPlugin, RouterPlugin } from '@/types/routerPlugin'
import { getRoutesForRouter } from './getRoutesForRouter'
import { getGlobalHooksForRouter } from './getGlobalHooksForRouter'
import { componentsStoreKey, createComponentsStore } from './createComponentsStore'
import { initZod, zotParamsDetected } from './zod'

type RouterUpdateOptions = {
  replace?: boolean,
  state?: any,
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
 * ] as const
 *
 * const router = createRouter(routes)
 * ```
 */
export function createRouter<
  const TRoutes extends Routes,
  const TOptions extends RouterOptions,
  const TPlugin extends RouterPlugin = EmptyRouterPlugin
>(routes: TRoutes, options?: TOptions, plugins?: TPlugin[]): Router<TRoutes, TOptions, TPlugin>

export function createRouter<
  const TRoutes extends Routes,
  const TOptions extends RouterOptions,
  const TPlugin extends RouterPlugin = EmptyRouterPlugin
>(routes: TRoutes[], options?: TOptions, plugins?: TPlugin[]): Router<TRoutes, TOptions, TPlugin>

export function createRouter<
  const TRoutes extends Routes,
  const TOptions extends RouterOptions,
  const TPlugin extends RouterPlugin = EmptyRouterPlugin
>(routesOrArrayOfRoutes: TRoutes | TRoutes[], options?: TOptions, plugins: TPlugin[] = []): Router<TRoutes, TOptions, TPlugin> {
  const routes = getRoutesForRouter(routesOrArrayOfRoutes, plugins, options?.base)
  const hooks = createRouterHooks()

  hooks.addGlobalRouteHooks(getGlobalHooksForRouter(options, plugins))

  const getNavigationId = createUniqueIdSequence()
  const propStore = createPropStore()
  const componentsStore = createComponentsStore()
  const visibilityObserver = createVisibilityObserver()
  const history = createRouterHistory({
    mode: options?.historyMode,
    listener: ({ location }) => {
      const url = createPath(location)

      set(url, { state: location.state, replace: true })
    },
  })

  function find(url: string, options: RouterResolveOptions = {}): ResolvedRoute | undefined {
    return createResolvedRouteForUrl(routes, url, options.state)
  }

  async function set(url: string, options: RouterUpdateOptions = {}): Promise<void> {
    const navigationId = getNavigationId()

    history.stopListening()

    if (isExternal(url)) {
      history.update(url, options)
      return
    }

    const to = find(url, options) ?? getRejectionRoute('NotFound')
    const from = getFromRouteForHooks(navigationId)

    const beforeResponse = await hooks.runBeforeRouteHooks({ to, from })

    switch (beforeResponse.status) {
      // On abort do nothing
      case 'ABORT':
        return

      // On push update the history, and push new route, and return
      case 'PUSH':
        history.update(url, options)
        await push(...beforeResponse.to)
        return

      // On reject update the history, the route, and set the rejection type
      case 'REJECT':
        history.update(url, options)
        setRejection(beforeResponse.type)
        break

      // On success update history, set the route, and clear the rejection
      case 'SUCCESS':
        history.update(url, options)
        setRejection(null)
        break

      default:
        throw new Error(`Switch is not exhaustive for before hook response status: ${JSON.stringify(beforeResponse satisfies never)}`)
    }

    const currentNavigationId = navigationId

    propStore.setProps(to).then((response) => {
      if (currentNavigationId !== navigationId) {
        return
      }

      switch (response.status) {
        case 'SUCCESS':
          break

        case 'PUSH':
          push(...response.to)
          break

        case 'REJECT':
          setRejection(response.type)
          break

        default:
          const exhaustive: never = response
          throw new Error(`Switch is not exhaustive for prop store response status: ${JSON.stringify(exhaustive)}`)
      }
    })

    updateRoute(to)

    const afterResponse = await hooks.runAfterRouteHooks({ to, from })

    switch (afterResponse.status) {
      case 'PUSH':
        await push(...afterResponse.to)
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

    history.startListening()
  }

  const resolve: RouterResolve<TRoutes | TPlugin['routes']> = (
    source: RoutesName<TRoutes | TPlugin['routes']>,
    params: Record<string, unknown> = {},
    options: RouterResolveOptions = {},
  ) => {
    const match = routes.find((route) => route.name === source)

    if (!match) {
      throw new RouteNotFoundError(String(source))
    }

    return createResolvedRoute(match, params, options)
  }

  const push: RouterPush<TRoutes | TPlugin['routes']> = (
    source: Url | RoutesName<TRoutes | TPlugin['routes']> | ResolvedRoute,
    paramsOrOptions?: Record<string, unknown> | RouterPushOptions,
    maybeOptions?: RouterPushOptions,
  ) => {
    if (isUrl(source)) {
      const options: RouterPushOptions = { ...paramsOrOptions }
      const url = combineUrl(source, {
        searchParams: options.query,
        hash: options.hash,
      })

      return set(url, options)
    }

    if (typeof source === 'string') {
      const { replace, ...options }: RouterPushOptions = { ...maybeOptions }
      const params: any = { ...paramsOrOptions }
      const resolved = resolve(source, params, options)
      const state = setStateValues({ ...resolved.matched.state }, { ...resolved.state, ...options.state })

      return set(resolved.href, { replace, state })
    }

    const { replace, ...options }: RouterPushOptions = { ...paramsOrOptions }
    const state = setStateValues({ ...source.matched.state }, { ...source.state, ...options.state })

    const url = combineUrl(source.href, {
      searchParams: options.query,
      hash: options.hash,
    })

    return set(url, { replace, state })
  }

  const replace: RouterReplace<TRoutes | TPlugin['routes']> = (
    source: Url | RoutesName<TRoutes | TPlugin['routes']> | ResolvedRoute,
    paramsOrOptions?: Record<string, unknown> | RouterReplaceOptions,
    maybeOptions?: RouterReplaceOptions,
  ) => {
    if (isUrl(source)) {
      const options: RouterPushOptions = { ...paramsOrOptions, replace: true }

      return push(source, options)
    }

    if (typeof source === 'string') {
      const options: RouterPushOptions = { ...maybeOptions, replace: true }
      const params: any = { ...paramsOrOptions }

      return push(source, params, options)
    }

    const options: RouterPushOptions = { ...paramsOrOptions, replace: true }

    return push(source, options)
  }

  const reject: RouterReject<keyof TOptions['rejections'] | keyof TPlugin['rejections']> = (type) => {
    setRejection(type)
  }

  const { setRejection, rejection, getRejectionRoute } = createRouterReject({
    ...plugins.reduce((rejections, plugin) => ({ ...rejections, ...plugin.rejections }), {}),
    ...options?.rejections,
  })

  const notFoundRoute = getRejectionRoute('NotFound')
  const { currentRoute, routerRoute, updateRoute } = createCurrentRoute<TRoutes | TPlugin['routes']>(notFoundRoute, push)

  const initialUrl = getInitialUrl(options?.initialUrl)
  const initialState = history.location.state
  const { host } = parseUrl(initialUrl)
  const isExternal = createIsExternal(host)

  let starting = false
  const started = ref(false)

  // eslint is just incorrect here
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  const { promise: initialize, resolve: initialized } = Promise.withResolvers<void>()

  async function start(): Promise<void> {
    if (starting) {
      return initialize
    }

    starting = true

    const shouldInitZod = zotParamsDetected(routes)

    if (shouldInitZod) {
      await initZod()
    }

    await set(initialUrl, { replace: true, state: initialState })

    history.startListening()

    initialized()
    started.value = true
  }

  function stop(): void {
    history.stopListening()
  }

  function getFromRouteForHooks(navigationId: string): ResolvedRoute | null {
    return isFirstUniqueSequenceId(navigationId) ? null : { ...currentRoute }
  }

  function install(app: App): void {
    hooks.setVueApp(app)
    propStore.setVueApp(app)

    app.component('RouterView', RouterView)
    app.component('RouterLink', RouterLink)
    app.provide(routerRejectionKey, rejection)
    app.provide(routerHooksKey, hooks)
    app.provide(propStoreKey, propStore)
    app.provide(componentsStoreKey, componentsStore)
    app.provide(visibilityObserverKey, visibilityObserver)

    // We cant technically guarantee that the user registered the same router that they installed
    // So we're making an assumption here that when installing a router its the same as the RegisteredRouter
    app.provide(routerInjectionKey, router as any)

    start()
  }

  const router: Router<TRoutes, TOptions, TPlugin> = {
    route: routerRoute,
    resolve,
    find,
    push,
    replace,
    reject,
    refresh: history.refresh,
    forward: history.forward,
    back: history.back,
    go: history.go,
    install,
    isExternal,
    onBeforeRouteEnter: hooks.onBeforeRouteEnter,
    onBeforeRouteUpdate: hooks.onBeforeRouteUpdate,
    onBeforeRouteLeave: hooks.onBeforeRouteLeave,
    onAfterRouteEnter: hooks.onAfterRouteEnter,
    onAfterRouteUpdate: hooks.onAfterRouteUpdate,
    onAfterRouteLeave: hooks.onAfterRouteLeave,
    prefetch: options?.prefetch,
    start,
    started,
    stop,
  }

  return router
}
