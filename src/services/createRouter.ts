import { App, computed, ref } from 'vue'
import { RouterRoute } from '@/types/routerRoute'
import { createResolvedRejection } from '@/services/createResolvedRejection'
import { createResolvedRouteQuery } from '@/services/createResolvedRouteQuery'
import { createPath } from '@/services/history'
import { createRouterRoute } from '@/services/createRouterRoute'
import { createIsExternal } from '@/services/createIsExternal'
import { createActivityTracker } from '@/services/createActivityTracker'
import { SsrOptionRequiredError } from '@/errors/ssrOptionRequiredError'
import { parseUrl, updateUrl } from '@/services/urlParser'
import { createRouterNavigation } from '@/services/createRouterNavigation'
import { createNavigationProgress } from '@/services/createNavigationProgress'
import { getRouteData } from '@/services/getRouteData'
import { getComputations } from '@/services/getComputations'
import { getAsyncComponents, loadAsyncComponents } from '@/utilities/components'
import { getNavigationProgressKey } from '@/compositions/useNavigation'
import { createRouterHistory, RouterHistoryTraversal } from '@/services/createRouterHistory'
import { createServerRedirect } from '@/services/createServerRedirect'
import { createRouterHooks, getRouterHooksKey } from '@/services/createRouterHooks'
import { getInitialUrl } from '@/services/getInitialUrl'
import { decodePayloadValues, encodePayloadValues, getHydratingPayload, payloadToScript, RouterPayload } from '@/services/payload'
import { setStateValues } from '@/services/state'
import { Routes } from '@/types/route'
import { Router, RouterOptions, ServerRenderResponse, RedirectStatus } from '@/types/router'
import { IS_ROUTER_SYMBOL, RouterInternal } from '@/types/routerInternal'
import { RouterPushInternal, RouterPushOptionsInternal, RouterReplaceInternal, RouterReplaceOptionsInternal } from '@/types/routerNavigationInternal'
import { RoutesName } from '@/types/routesMap'
import { UrlString, isUrlString } from '@/types/urlString'
import { createVisibilityObserver } from './createVisibilityObserver'
import { visibilityObserverKey } from '@/compositions/useVisibilityObserver'
import { RouterResolve, RouterResolveOptions } from '@/types/routerResolve'
import { RouteNotFoundError } from '@/errors/routeNotFoundError'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { isResolvedRejection, ResolvedRoute } from '@/types/resolved'
import { RejectContext, RouterReject } from '@/types/routerReject'
import { EmptyRouterPlugin, RouterPlugin } from '@/types/routerPlugin'
import { getRoutesForRouter } from './getRoutesForRouter'
import { getGlobalHooksForRouter } from './getGlobalHooksForRouter'
import { createComponentsStore } from './createComponentsStore'
import { getComponentsStoreKey } from '@/compositions/useComponentsStore'
import { getRouterNavigationInjectionKey } from '@/compositions/useRouterNavigation'
import { getViewTransitionKey } from '@/compositions/useViewTransition'
import { ViewTransition } from '@/components/viewTransition'
import { getRouterRejectionInjectionKey } from '@/compositions/useRejection'
import { routerInjectionKey } from '@/keys'
import { createRouterView } from '@/components/routerView'
import { createRouterLink } from '@/components/routerLink'
import { createRouterProgress } from '@/components/routerProgress'
import { createRouterSuspense } from '@/components/routerSuspense'
import { ContextPushError } from '@/errors/contextPushError'
import { ContextRejectionError } from '@/errors/contextRejectionError'
import { setupRouterDevtools } from '@/devtools/createRouterDevtools'
import { getMatchForUrl } from './getMatchesForUrl'
import { pathHasTrailingSlash, removeTrailingSlashesFromPath } from '@/utilities/trailingSlashes'
import { setDocumentTitle } from '@/utilities/setDocumentTitle'
import { ComputationResponse, ComputationStore } from '@/services/createComputationStore'
import { hasViewTransition, ViewTransitionConfig } from '@/types/viewTransition'
import { createViewTransitions, PendingViewTransition } from '@/services/createViewTransitions'
import { getViewTransitionTypes, supportsViewTransitions } from '@/utilities/viewTransition'
import { NavigationBehavior } from '@/types/navigation'
import { getNavigationOption, getRouteNavigationOption } from '@/utilities/navigation'

type NavigationResponse = {
  to: ResolvedRoute | null,
  from: ResolvedRoute | null,
  response: ComputationResponse,
}

type RouterUpdateOptions = {
  updateHistory?: boolean,
  navigation?: NavigationBehavior,
  prefetch?: ComputationStore,
  traversal?: RouterHistoryTraversal,
  replace?: boolean,
  state?: any,
  viewTransition?: ViewTransitionConfig,
  /**
   * A hydrating navigation adopts an outcome the server already rendered, so before hooks are not
   * consulted and the title the markup carries is kept.
   */
  hydrating?: boolean,
}

type RejectOptions = RouterUpdateOptions & RejectContext & {
  url?: string,
}

type ViewTransitionOptions = {
  to: ResolvedRoute | null,
  from: ResolvedRoute | null,
  options: RouterUpdateOptions,
  enabled: boolean,
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
 *   createRoute({ name: 'home', path: '/' }).addView(Home),
 *   createRoute({ name: 'path', path: '/about' }).addView(About),
 * ] as const
 *
 * const router = createRouter(routes)
 * ```
 */
export function createRouter<
  const TRoutes extends Routes,
  const TOptions extends RouterOptions = {},
  const TPlugin extends RouterPlugin = EmptyRouterPlugin
>(routes: TRoutes, options?: TOptions, plugins?: TPlugin[]): Router<TRoutes, TOptions, TPlugin>

export function createRouter<
  const TRoutes extends Routes,
  const TOptions extends RouterOptions = {},
  const TPlugin extends RouterPlugin = EmptyRouterPlugin
>(routes: TRoutes[], options?: TOptions, plugins?: TPlugin[]): Router<TRoutes, TOptions, TPlugin>

export function createRouter<
  const TRoutes extends Routes,
  const TOptions extends RouterOptions = {},
  const TPlugin extends RouterPlugin = EmptyRouterPlugin
>(routesOrArrayOfRoutes: TRoutes | TRoutes[], options?: TOptions, plugins: TPlugin[] = []): Router<TRoutes, TOptions, TPlugin> {
  const isGlobalRouter = options?.isGlobalRouter ?? true
  const routerKey = isGlobalRouter ? routerInjectionKey : Symbol()
  const shouldRemoveTrailingSlashes = options?.removeTrailingSlashes ?? true
  const redirectStatus = options?.redirectStatus ?? 302
  const rejectStatus = options?.rejectStatus ?? 200
  const isSSR = options?.ssr ?? false
  const routerNavigation = options?.navigation
  const routerViewTransition = options?.viewTransition
  const activity = createActivityTracker()
  const navigationProgress = createNavigationProgress()
  const {
    routes,
    getRouteByName,
    getRejectionByType,
    addHookContext,
    addContext,
    stop: stopRouteContext,
  } = getRoutesForRouter(routesOrArrayOfRoutes, plugins, options)
  const notFoundRejection = getRejectionByType('NotFound')
  const navigation = createRouterNavigation()
  const notFoundRoute = createResolvedRoute(notFoundRejection.route)

  const hooks = createRouterHooks({ redirectStatus, onHookAdded: addHookContext })

  hooks.addGlobalRouteHooks(getGlobalHooksForRouter(plugins))

  const viewTransitions = createViewTransitions()
  const componentsStore = createComponentsStore(routerKey)
  const visibilityObserver = createVisibilityObserver()
  const history = createRouterHistory({
    mode: options?.historyMode,
    listener: ({ location, traversal }) => {
      const url = createPath(location)

      set(url, { state: location.state, replace: true, traversal })
    },
  })

  function find(url: string, resolveOptions: RouterResolveOptions = {}): ResolvedRoute | undefined {
    const urlIsRelative = !isExternal(url)
    const filteredRoutes = routes.filter((route) => route.isRelative === urlIsRelative)
    const parseOptions = { removeTrailingSlashes: shouldRemoveTrailingSlashes }

    return getMatchForUrl(filteredRoutes, url, { ...resolveOptions, ...parseOptions })
  }

  const set = activity.wrap(async (url: string, options: RouterUpdateOptions = {}): Promise<void> => {
    if (pathHasTrailingSlash(url) && shouldRemoveTrailingSlashes) {
      const cleanedUrl = removeTrailingSlashesFromPath(url)

      if (isUrlString(cleanedUrl)) {
        return replace(cleanedUrl, { ...options, redirectStatus })
      }
    }

    if (stopped) {
      return
    }

    const to = find(url, options) ?? null

    if (isExternal(url)) {
      return navigate(to, url, options)
    }

    if (!to) {
      return reject('NotFound', {
        updateHistory: true,
        ...options,
        to: null,
        url,
      })
    }

    return navigate(to, url, options)
  })

  const navigate = activity.wrap(async (to: ResolvedRoute | null, url: string, options: RouterUpdateOptions = {}): Promise<void> => {
    const from = getFromRouteForHooks()
    const external = isExternal(url)
    const progress = navigationProgress.begin({
      to,
      from,
      expected: countRouteUnits(url, to),
      inert: isSSR || options.hydrating,
    })
    const transition = getViewTransition({
      to,
      from,
      options,
      enabled: !isSSR && !external,
    })
    const { isBlockingNavigation } = getNavigationOption({
      routerNavigation,
      routeNavigation: getRouteNavigationOption(to),
      navigation: options.navigation,
    })

    function updateNavigationHistory(): void {
      if (options.updateHistory === false) {
        return
      }

      if (options.traversal) {
        options.traversal.commit()
      } else {
        history.update(url, options)
      }
    }

    async function beforeNavigation(controller: AbortController): Promise<void> {
      const response = await hooks.runBeforeRouteHooks({ to, from, signal: controller.signal, progress })

      if (controller.signal.aborted) {
        return
      }

      switch (response.status) {
        case 'ABORT':
          options.traversal?.restore()
          progress.abort()
          controller.abort()

          return

        case 'PUSH':
        case 'REDIRECT':
          controller.abort()
          await push(...response.to)

          return

        case 'REJECT':
          updateNavigationHistory()
          reject(response.type, { to, from })
          progress.abort()
          controller.abort()

          return

        case 'SUCCESS':
          updateNavigationHistory()
          break

        default:
          const exhaustive: never = response
          throw new Error(`Switch is not exhaustive for before hook response status: ${JSON.stringify(exhaustive)}`)
      }

      if (transition) {
        viewTransitions.prepare(transition)
      } else if (!external) {
        viewTransitions.reset()
      }
    }

    async function afterNavigation(controller: AbortController): Promise<void> {
      if (external) {
        progress.close()
      }

      if (isSSR) {
        return
      }

      const response = await hooks.runAfterRouteHooks({ to, from, signal: controller.signal })

      if (controller.signal.aborted) {
        return
      }

      switch (response.status) {
        case 'PUSH':
          await push(...response.to)
          break

        case 'REJECT':
          controller.abort()
          reject(response.type, { to, from })
          break

        case 'SUCCESS':
          break

        default:
          const exhaustive: never = response
          throw new Error(`Switch is not exhaustive for after hook response status: ${JSON.stringify(exhaustive)}`)
      }
    }

    function commitNavigation(work: Promise<unknown>[], controller: AbortController): void {
      activity.add(...work)
      progress.track(...work)
      if (to) {
        routerRoute.updateRoute(to)
        progress.close()
      }

      started.value = true

      if (!options.hydrating) {
        updateTitle(controller.signal)
      }
    }

    let before

    if (!options.hydrating) {
      before = beforeNavigation
    }

    let startTransition

    if (transition) {
      startTransition = viewTransitions.start
    }

    try {
      await navigation.run({
        route: to,
        compute: (store) => {
          if (!to) {
            return []
          }

          return [...store.compute(to, getComputations(to)), ...loadAsyncComponents(to)]
        },
        prefetch: options.prefetch,
        before,
        after: afterNavigation,
        commit: !external,
        prepare: !options.hydrating && (Boolean(transition) || isBlockingNavigation),
        transition: startTransition,
        onResponse: (response) => onNavigationResponse({ response, to, from }),
        onCommit: commitNavigation,
      })
    } finally {
      if (navigation.active.value?.route !== to && transition) {
        viewTransitions.cancel(transition)
      }
    }
  })

  /**
   * The transition a navigation makes, or false when it does not transition.
   */
  function getViewTransition({ to, from, options, enabled }: ViewTransitionOptions): PendingViewTransition | false {
    if (!enabled || !to || !from || !supportsViewTransitions()) {
      return false
    }

    const types = getViewTransitionTypes({
      routerViewTransition,
      routeViewTransition: to.matches.findLast(hasViewTransition)?.viewTransition,
      navigationViewTransition: options.viewTransition,
      to,
      from,
    })

    if (types === false) {
      return false
    }

    return { to, from, types }
  }

  /**
   * The units a route needs before it has everything it renders with, known before anything runs so the
   * total never grows once the before hooks are under way.
   */
  function countRouteUnits(url: string, to: ResolvedRoute | null): number {
    if (isExternal(url)) {
      return 0
    }

    return getComputations(to).length + getAsyncComponents(to).length
  }

  /**
   * Handles computation responses without holding up navigation. Superseded work cannot change the page
   * or run error hooks.
   */
  function onNavigationResponse({ response, to, from }: NavigationResponse): void {
    const work = (async (): Promise<void> => {
      switch (response.status) {
        case 'PUSH':
          push(...response.to)
          break

        case 'REJECT':
          reject(response.type, { to, from })
          break

        case 'ERROR':
          try {
            hooks.runErrorHooks(response.error, { to, from, source: response.source })
          } catch (error) {
            if (error instanceof ContextPushError) {
              push(...error.response.to)
              return
            }

            if (error instanceof ContextRejectionError) {
              reject(error.response.type, { to, from })
              return
            }

            throw error
          }
          break

        default:
          const exhaustive: never = response
          throw new Error(`Switch is not exhaustive for route data response status: ${JSON.stringify(exhaustive)}`)
      }
    })()

    activity.add(work)
  }

  const resolve: RouterResolve<TRoutes | TPlugin['routes']> = (
    source: RoutesName<TRoutes | TPlugin['routes']>,
    params: Record<string, unknown> = {},
    options: RouterResolveOptions = {},
  ) => {
    const match = getRouteByName(source)

    if (!match) {
      throw new RouteNotFoundError(source)
    }

    return createResolvedRoute(match, params, options)
  }

  function getPushNavigation(
    source: UrlString | RoutesName<TRoutes | TPlugin['routes']> | ResolvedRoute | RouterRoute,
    paramsOrOptions?: Record<string, unknown> | RouterPushOptionsInternal,
    maybeOptions?: RouterPushOptionsInternal,
  ): { url: string, options: RouterUpdateOptions, redirectStatus: RedirectStatus | undefined } {
    if (isUrlString(source)) {
      const { redirectStatus, ...options }: RouterPushOptionsInternal = { ...paramsOrOptions }
      const url = updateUrl(source, {
        query: options.query,
        hash: options.hash,
      })

      return { url, options, redirectStatus }
    }

    if (typeof source === 'string') {
      const { replace, navigation, prefetch, viewTransition, redirectStatus, ...options }: RouterPushOptionsInternal = { ...maybeOptions }
      const params: any = { ...paramsOrOptions }
      const resolved = resolve(source, params, options)
      const state = setStateValues({ ...resolved.matched.state }, { ...resolved.state, ...options.state })

      return { url: resolved.href, options: { replace, state, navigation, prefetch, viewTransition }, redirectStatus }
    }

    const { replace, navigation, prefetch, viewTransition, redirectStatus, ...options }: RouterPushOptionsInternal = { ...paramsOrOptions }
    const state = setStateValues({ ...source.matched.state }, { ...source.state, ...options.state })

    const url = updateUrl(source.href, {
      query: options.query,
      hash: options.hash,
    })

    return { url, options: { replace, state, navigation, prefetch, viewTransition }, redirectStatus }
  }

  const push: RouterPushInternal<TRoutes | TPlugin['routes']> = async (
    source: UrlString | RoutesName<TRoutes | TPlugin['routes']> | ResolvedRoute | RouterRoute,
    paramsOrOptions?: Record<string, unknown> | RouterPushOptionsInternal,
    maybeOptions?: RouterPushOptionsInternal,
  ) => {
    const { url, options, redirectStatus } = getPushNavigation(source, paramsOrOptions, maybeOptions)

    if (isSSR) {
      setServerRedirect(redirectStatus ?? 302, url)
      navigation.active.value?.store.abandon()

      return
    }

    return set(url, options)
  }

  const replace: RouterReplaceInternal<TRoutes | TPlugin['routes']> = (
    source: UrlString | RoutesName<TRoutes | TPlugin['routes']> | ResolvedRoute | RouterRoute,
    paramsOrOptions?: Record<string, unknown> | RouterReplaceOptionsInternal,
    maybeOptions?: RouterReplaceOptionsInternal,
  ) => {
    if (isUrlString(source)) {
      const options: RouterPushOptionsInternal = { ...paramsOrOptions, replace: true }

      return push(source, options)
    }

    if (typeof source === 'string') {
      const options: RouterPushOptionsInternal = { ...maybeOptions, replace: true }
      const params: any = { ...paramsOrOptions }

      return push(source, params, options)
    }

    const options: RouterPushOptionsInternal = { ...paramsOrOptions, replace: true }

    return push(source, options)
  }

  function reject(type: string, options: RejectOptions = {}): Promise<void> | void {
    const rejection = getRejectionByType(type)

    if (!rejection || stopped) {
      return
    }

    const current = getFromRouteForHooks()
    const {
      to = current ?? getUnmatchedRoute(initialUrl),
      from = current,
      url = to?.href ?? initialUrl,
      ...navigationOptions
    } = options
    const route = createResolvedRejection(to ?? getUnmatchedRoute(url), rejection)

    hooks.runRejectionHooks(rejection, { to, from })
    return navigate(route, url, { updateHistory: false, ...navigationOptions })
  }

  const currentRejection = computed(() => {
    const route = navigation.active.value?.route

    if (isResolvedRejection(route)) {
      return route.rejection
    }

    return null
  })

  function getUnmatchedRoute(url: string): ResolvedRoute {
    const { query, hash } = parseUrl(url)

    return {
      ...notFoundRoute,
      href: url as UrlString,
      canonical: url as UrlString,
      query: createResolvedRouteQuery(query),
      hash,
    }
  }

  const routerRoute = createRouterRoute<Router<TRoutes, TOptions, TPlugin>>({
    routerKey,
    route: notFoundRoute,
    push,
    getRouteData: (route) => {
      const active = navigation.active.value

      if (active?.route !== route) {
        return {}
      }

      return getRouteData(active.store, route)
    },
  })

  /**
   * The title that should currently be rendered.
   */
  async function getTitle(): Promise<string | undefined> {
    return navigation.active.value?.route?.getTitle()
  }

  /**
   * Sets the document title to the title that should currently be rendered.
   */
  async function updateTitle(signal: AbortSignal): Promise<void> {
    if (isSSR) {
      return
    }

    const title = await getTitle()

    if (signal.aborted) {
      return
    }

    setDocumentTitle(title)
  }

  const initialUrl = getInitialUrl(options?.initialUrl, options?.historyMode)
  const initialState = history.location.state
  const { host } = parseUrl(initialUrl)
  const isExternal = createIsExternal(host)

  let starting = false
  let stopped = false
  const { setServerRedirect, getServerRedirect } = createServerRedirect()
  /**
   * Whether a route or rejection has been committed. Until then there is nothing to render, and nothing
   * for a navigation to leave from.
   */
  const started = ref(false)

  const {
    promise: startup,
    resolve: resolveStartup,
    reject: rejectStartup,
  } = Promise.withResolvers<void>()

  /**
   * Adopts the outcome the server rendered for the initial url, committed synchronously so the first
   * paint matches the markup already in the dom.
   */
  async function hydrate(payload: RouterPayload): Promise<void> {
    const to = find(initialUrl, { state: initialState ?? undefined }) ?? null
    let route = to

    if (payload.kind === 'reject') {
      const rejection = getRejectionByType(payload.rejection)

      if (!rejection) {
        return
      }

      route = createResolvedRejection(to ?? getUnmatchedRoute(initialUrl), rejection)
      hooks.runRejectionHooks(rejection, { to, from: null })
    }

    if (!route) {
      route = createResolvedRejection(getUnmatchedRoute(initialUrl), notFoundRejection)
      hooks.runRejectionHooks(notFoundRejection, { to, from: null })
    }

    const store = navigation.createStore()
    const values = decodePayloadValues(route, payload.values, options?.transformer)
    store.setEntries(values)

    await navigate(route, initialUrl, {
      replace: true,
      state: initialState,
      hydrating: true,
      prefetch: store,
    })
  }

  function start(): Promise<void> {
    if (stopped) {
      return Promise.resolve()
    }

    if (!starting) {
      starting = true
      initialize().then(resolveStartup, rejectStartup)
    }

    return startup
  }

  async function initialize(): Promise<void> {
    const payload = getHydratingPayload()

    if (payload) {
      await hydrate(payload)
    } else {
      await set(initialUrl, { replace: true, state: initialState })
    }

    // stop() can run while navigation or hydration is awaited.
    if (stopped) {
      return
    }

    history.startListening()

    started.value = true
  }

  /**
   * Waits for the view to finish rendering and returns everything the server needs to render the page.
   *
   * Requires the router to be created with the `ssr` option, and throws
   * {@link SsrOptionRequiredError} without it.
   */
  async function render(): Promise<ServerRenderResponse> {
    if (!isSSR) {
      throw new SsrOptionRequiredError()
    }

    await start()
    await activity.idle()

    const serverRedirect = getServerRedirect()

    if (serverRedirect) {
      return serverRedirect
    }

    const rejection = currentRejection.value
    const current = navigation.active.value

    if (!current?.route) {
      throw new Error('Expected an active navigation after rendering')
    }

    const title = await getTitle()
    const { values, failures } = encodePayloadValues(current.route, current.store.getEntries(), options?.transformer)

    if (rejection) {
      return {
        kind: 'reject',
        status: rejection.status ?? rejectStatus,
        rejection: rejection.type,
        title,
        payload: payloadToScript({ kind: 'reject', url: initialUrl, rejection: rejection.type, values }),
      }
    }

    return {
      kind: 'success',
      status: 200,
      title,
      failures,
      payload: payloadToScript({ kind: 'success', url: initialUrl, values }),
    }
  }

  function stop(): void {
    stopped = true
    stopRouteContext()
    navigation.stop()
    navigationProgress.stop()
    history.stopListening()
  }

  function getFromRouteForHooks(): ResolvedRoute | null {
    return started.value ? routerRoute.getResolvedRoute() : null
  }

  function install(app: App): void {
    app.onUnmount(stop)
    hooks.setVueApp(app)
    navigation.setVueApp(app)

    const routerView = createRouterView(routerKey)
    const routerLink = createRouterLink(routerKey)
    const routerProgress = createRouterProgress(routerKey)
    const routerSuspense = createRouterSuspense(routerKey)

    app.component('RouterView', routerView)
    app.component('RouterLink', routerLink)
    app.component('RouterProgress', routerProgress)
    app.component('RouterSuspense', routerSuspense)
    app.component('ViewTransition', ViewTransition)
    app.provide(getViewTransitionKey(routerKey), viewTransitions.viewTransition)
    app.provide(getRouterRejectionInjectionKey(routerKey), currentRejection)
    app.provide(getRouterHooksKey(routerKey), hooks)
    app.provide(getRouterNavigationInjectionKey(routerKey), navigation)
    app.provide(getComponentsStoreKey(routerKey), componentsStore)
    app.provide(getNavigationProgressKey(routerKey), navigationProgress)
    app.provide(visibilityObserverKey, visibilityObserver)

    app.provide(routerKey, router)

    // Setup DevTools integration
    setupRouterDevtools({ router, app, routes })

    start()
  }

  const internal = {
    [IS_ROUTER_SYMBOL]: true,
    addContext,
  } satisfies RouterInternal

  const routerReject: RouterReject<TOptions['rejections'] | TPlugin['rejections']> = (type) => {
    void reject(type)
  }

  const router: Router<TRoutes, TOptions, TPlugin> & RouterInternal = {
    ...internal,
    route: routerRoute,
    resolve,
    find,
    push,
    replace,
    reject: routerReject,
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
    onError: hooks.onError,
    onRejection: hooks.onRejection,
    prefetch: options?.prefetch,
    start,
    started,
    render,
    stop,
    key: routerKey,
    hasDevtools: false,
  }

  return router
}
