import { createPath } from '@/services/history'
import { App, computed, nextTick, ref } from 'vue'
import { createCurrentRoute } from '@/services/createCurrentRoute'
import { createIsExternal } from '@/services/createIsExternal'
import { createActivityTracker } from '@/services/createActivityTracker'
import { SsrOptionRequiredError } from '@/errors/ssrOptionRequiredError'
import { parseUrl, updateUrl } from '@/services/urlParser'
import { createRouteValueStore, RouteValueResponse } from '@/services/createRouteValueStore'
import { createNavigationProgress, NavigationProgressTracker } from '@/services/createNavigationProgress'
import { getComputations } from '@/services/getComputations'
import { getAsyncComponents, loadAsyncComponents } from '@/utilities/components'
import { getNavigationProgressKey } from '@/compositions/useNavigation'
import { DataKind } from '@/services/createNavigationStores'
import { createRouterHistory } from '@/services/createRouterHistory'
import { createServerRedirect } from '@/services/createServerRedirect'
import { createRouterHooks, getRouterHooksKey } from '@/services/createRouterHooks'
import { getInitialUrl } from '@/services/getInitialUrl'
import { decodePayloadValues, encodePayloadValues, getHydratingPayload, payloadToScript, RouterPayload } from '@/services/payload'
import { setStateValues } from '@/services/state'
import { Routes } from '@/types/route'
import { isRejection } from '@/types/rejection'
import { Router, RouterOptions, ServerRenderResponse, RedirectStatus } from '@/types/router'
import { RouterPushInternal, RouterPushOptionsInternal, RouterReplaceInternal, RouterReplaceOptionsInternal } from '@/types/routerNavigationInternal'
import { RoutesName } from '@/types/routesMap'
import { isUrlString, asUrlString } from '@/types/urlString'
import { createNavigationSignals } from '@/services/createNavigationSignals'
import { createVisibilityObserver } from './createVisibilityObserver'
import { visibilityObserverKey } from '@/compositions/useVisibilityObserver'
import { RouterResolve, RouterResolveOptions } from '@/types/routerResolve'
import { RouteNotFoundError } from '@/errors/routeNotFoundError'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { isRejectedRoute, ResolvedRoute } from '@/types/resolved'
import { EmptyRouterPlugin, RouterPlugin } from '@/types/routerPlugin'
import { getRoutesForRouter } from './getRoutesForRouter'
import { getGlobalHooksForRouter } from './getGlobalHooksForRouter'
import { createComponentsStore } from './createComponentsStore'
import { getComponentsStoreKey } from '@/compositions/useComponentsStore'
import { getRouteValueStoreInjectionKey } from '@/compositions/useRouteValueStore'
import { getRouterRejectionInjectionKey } from '@/compositions/useRejection'
import { routerInjectionKey } from '@/keys'
import { createRouterView } from '@/components/routerView'
import { createRouterLink } from '@/components/routerLink'
import { createRouterProgress } from '@/components/routerProgress'
import { ContextPushError } from '@/errors/contextPushError'
import { ContextRejectionError } from '@/errors/contextRejectionError'
import { setupRouterDevtools } from '@/devtools/createRouterDevtools'
import { getMatchForUrl } from './getMatchesForUrl'
import { pathHasTrailingSlash, removeTrailingSlashesFromPath } from '@/utilities/trailingSlashes'
import { setDocumentTitle } from '@/utilities/setDocumentTitle'
import { createAbortPromise } from '@/utilities/promises'

type RouteCommitOptions = {
  route: ResolvedRoute,
  signal: AbortSignal,
  update: () => void,
}

type RouteCommit = {
  /** Call before committing when assets must be ready. */
  prepare: () => Promise<boolean>,
  /** Call inside the view transition callback, or directly for ordinary navigation. */
  commit: () => Promise<boolean>,
}

type RouterUpdateOptions = {
  replace?: boolean,
  state?: any,
  /**
   * A hydrating navigation adopts an outcome the server already rendered, so before hooks are not
   * consulted and the title the markup carries is kept.
   */
  hydrating?: boolean,
  url?: string,
}

type RunHooksContext = {
  controller: AbortController,
  to: ResolvedRoute,
  from: ResolvedRoute | null,
}

type RunBeforeHooksContext = RunHooksContext & {
  options: RouterUpdateOptions,
  progress: NavigationProgressTracker,
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
  const TOptions extends RouterOptions = {},
  const TPlugin extends RouterPlugin = EmptyRouterPlugin
>(routes: TRoutes, options?: TOptions, plugins?: TPlugin[]): Router<TRoutes, TOptions, TPlugin>

export function createRouter<
  const TRoutes extends Routes,
  const TOptions extends RouterOptions = {},
  const TPlugin extends RouterPlugin = EmptyRouterPlugin
>(routes: TRoutes[], options?: TOptions, plugins?: TPlugin[]): Router<TRoutes, TOptions, TPlugin>

export function createRouter(routesOrArrayOfRoutes: Routes | Routes[], options?: RouterOptions, plugins: RouterPlugin[] = []): Router {
  const isGlobalRouter = options?.isGlobalRouter ?? true
  const routerKey = isGlobalRouter ? routerInjectionKey : Symbol()
  const shouldRemoveTrailingSlashes = options?.removeTrailingSlashes ?? true
  const redirectStatus = options?.redirectStatus ?? 302
  const isSSR = options?.ssr ?? false
  const activity = createActivityTracker()
  const navigationProgress = createNavigationProgress()
  const { routes, getRouteByName, getRejectionByType } = getRoutesForRouter(routesOrArrayOfRoutes, plugins, options)
  const notFoundRejection = getRejectionByType('NotFound')
  const valueStore = createRouteValueStore()
  const initialUrl = getInitialUrl(options?.initialUrl, options?.historyMode)
  const notFoundRoute = createResolvedRoute(notFoundRejection, {}, { url: asUrlString(initialUrl) })

  const hooks = createRouterHooks({ redirectStatus })

  hooks.addGlobalRouteHooks(getGlobalHooksForRouter(plugins))

  const navigations = createNavigationSignals()
  const componentsStore = createComponentsStore(routerKey)
  const visibilityObserver = createVisibilityObserver()
  const history = createRouterHistory({
    mode: options?.historyMode,
    listener: ({ location }) => {
      const url = createPath(location)

      set(url, { state: location.state, replace: true })
    },
  })

  function find(url: string, resolveOptions: RouterResolveOptions = {}): ResolvedRoute | undefined {
    const urlIsRelative = !isExternal(url)
    const filteredRoutes = routes.filter((route) => route.isRelative === urlIsRelative)
    const parseOptions = { removeTrailingSlashes: shouldRemoveTrailingSlashes }

    return getMatchForUrl(filteredRoutes, url, { ...resolveOptions, ...parseOptions })
  }

  /**
   * Runs the before hooks for a navigation and reacts to their response. Reports whether the
   * navigation should continue.
   */
  async function runBeforeHooks({ controller, to, from, options, progress }: RunBeforeHooksContext): Promise<boolean> {
    const response = await hooks.runBeforeRouteHooks({ to, from, signal: controller.signal, progress })

    if (controller.signal.aborted) {
      return false
    }

    switch (response.status) {
      case 'ABORT':
        return false

      case 'PUSH':
      case 'REDIRECT':
        await push(...response.to)
        return false

      case 'REJECT':
        await reject(response.type, options)
        return false

      case 'SUCCESS':
        return true

      default:
        const exhaustive: never = response
        throw new Error(`Switch is not exhaustive for before hook response status: ${JSON.stringify(exhaustive)}`)
    }
  }

  /**
   * Runs the after hooks for a navigation and reacts to their response.
   */
  async function runAfterHooks({ controller, to, from }: RunHooksContext): Promise<void> {
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
        await reject(response.type)
        break

      case 'SUCCESS':
        break

      default:
        const exhaustive: never = response
        throw new Error(`Switch is not exhaustive for after hook response status: ${JSON.stringify(exhaustive)}`)
    }
  }

  async function set(url: string, options: RouterUpdateOptions = {}): Promise<void> {
    if (pathHasTrailingSlash(url) && shouldRemoveTrailingSlashes) {
      const cleanedUrl = removeTrailingSlashesFromPath(url)

      if (isUrlString(cleanedUrl)) {
        return replace(cleanedUrl, { ...options, redirectStatus })
      }
    }

    const to = find(url, options) ?? createResolvedRoute(notFoundRejection, {}, { url: asUrlString(url) })

    return navigate(to, { ...options, url })
  }

  const navigate = activity.wrap(async (to: ResolvedRoute, options: RouterUpdateOptions = {}): Promise<void> => {
    const controller = navigations.begin()
    const isAborted = (): boolean => controller.signal.aborted

    if (isAborted()) {
      return
    }

    const from = started.value ? { ...currentRoute } : null
    const progress = navigationProgress.begin({
      to,
      from,
      expected: countNavigationUnits(to),
      inert: isSSR || options.hydrating,
    })

    controller.signal.addEventListener('abort', progress.abort, { once: true })

    if (!options.hydrating) {
      const proceed = await runBeforeHooks({ controller, to, from, options, progress })

      if (!proceed || isAborted()) {
        controller.abort()

        return
      }
    }

    if (options.url && !options.hydrating) {
      history.update(options.url, options)
    }

    const { commit } = createRouteCommit({
      route: to,
      signal: controller.signal,
      update: () => {
        if (!isExternal(to.href)) {
          commitDestination(to, from, progress, controller.signal)
          started.value = true

          if (!options.hydrating) {
            updateTitle(controller.signal)
          }
        }

        progress.close()
      },
    })

    await Promise.all([
      commit(),
      runAfterHooks({ controller, to, from }),
    ])
  })

  function createRouteCommit({ route, signal, update }: RouteCommitOptions): RouteCommit {
    const isAborted = (): boolean => signal.aborted

    const prepare: RouteCommit['prepare'] = async () => {
      if (isAborted()) {
        return false
      }

      const values = valueStore.staged().compute(route)
      const work = Promise.allSettled([
        values.props,
        values.loaders,
        ...loadAsyncComponents(route),
      ])
      await Promise.race([
        work,
        createAbortPromise(signal),
      ])

      return !isAborted()
    }

    const commit: RouteCommit['commit'] = () => {
      if (signal.aborted) {
        return Promise.resolve(false)
      }

      update()

      return nextTick().then(() => !signal.aborted)
    }

    return { prepare, commit }
  }

  /**
   * The units a route needs before it has everything it renders with, known before anything runs so the
   * total never grows once the before hooks are under way.
   */
  function countNavigationUnits(to: ResolvedRoute): number {
    if (isExternal(to.href)) {
      return 0
    }

    return getComputations(to).length + getAsyncComponents(to).length
  }

  function commitDestination(to: ResolvedRoute, from: ResolvedRoute | null, progress: NavigationProgressTracker, signal: AbortSignal): void {
    const { props, loaders, values } = valueStore.commit(to)

    activity.add(
      handleRouteValueResponse(props, 'props', to, from, signal),
      handleRouteValueResponse(loaders, 'loader', to, from, signal),
    )

    progress.track(...values)
    updateRoute(to)

    const components = loadAsyncComponents(to)

    activity.add(...components)
    progress.track(...components)
  }

  /**
   * Props and loaders are handled the same way, and neither is awaited here: a push or a rejection from
   * either is acted on whenever it arrives, without holding up the navigation that started it. Once that
   * navigation is superseded, its outcomes can no longer change the page or run error hooks.
   */
  function handleRouteValueResponse(response: Promise<RouteValueResponse>, source: DataKind, to: ResolvedRoute, from: ResolvedRoute | null, signal: AbortSignal): Promise<void> {
    return response
      .then((response) => {
        if (signal.aborted) {
          return
        }

        switch (response.status) {
          case 'SUCCESS':
          case 'ABANDONED':
            break

          case 'PUSH':
            push(...response.to)
            break

          case 'REJECT':
            reject(response.type)
            break

          default:
            const exhaustive: never = response
            throw new Error(`Switch is not exhaustive for route data response status: ${JSON.stringify(exhaustive)}`)
        }
      })
      .catch((error: unknown) => {
        if (signal.aborted) {
          return
        }

        try {
          hooks.runErrorHooks(error, { to, from, source })
        } catch (error) {
          if (error instanceof ContextPushError) {
            push(...error.response.to)
            return
          }

          if (error instanceof ContextRejectionError) {
            reject(error.response.type)
            return
          }

          throw error
        }
      })
  }

  const resolve: RouterResolve<Routes> = (
    source: RoutesName<Routes>,
    params: Record<string, unknown> = {},
    options: RouterResolveOptions = {},
  ) => {
    const match = getRouteByName(source)

    if (!match) {
      throw new RouteNotFoundError(source)
    }

    if (isRejection(match)) {
      return createResolvedRoute(match, params, { url: asUrlString(currentRoute.href), ...options })
    }

    return createResolvedRoute(match, params, options)
  }

  function getPushNavigation(
    source: string | ResolvedRoute,
    paramsOrOptions?: Record<string, unknown> | RouterPushOptionsInternal,
    maybeOptions?: RouterPushOptionsInternal,
  ): { url: string, options: RouterUpdateOptions, redirectStatus: RedirectStatus | undefined, destination?: ResolvedRoute } {
    if (isUrlString(source)) {
      const { redirectStatus, ...options }: RouterPushOptionsInternal = { ...paramsOrOptions }
      const url = updateUrl(source, {
        query: options.query,
        hash: options.hash,
      })

      return { url, options, redirectStatus }
    }

    if (typeof source === 'string') {
      const { replace, redirectStatus, ...options }: RouterPushOptionsInternal = { ...maybeOptions }
      const params: any = { ...paramsOrOptions }
      const resolved = resolve(source, params, options)
      const state = setStateValues({ ...resolved.matched.state }, { ...resolved.state, ...options.state })

      return { url: resolved.href, options: { replace, state }, redirectStatus, destination: resolved }
    }

    const { replace, redirectStatus, ...options }: RouterPushOptionsInternal = { ...paramsOrOptions }
    const state = setStateValues({ ...source.matched.state }, { ...source.state, ...options.state })

    const url = updateUrl(source.href, {
      query: options.query,
      hash: options.hash,
    })

    return { url, options: { replace, state }, redirectStatus, destination: source }
  }

  const push: RouterPushInternal<Routes> = async (
    source: string | ResolvedRoute,
    paramsOrOptions?: Record<string, unknown> | RouterPushOptionsInternal,
    maybeOptions?: RouterPushOptionsInternal,
  ) => {
    const { url, options, redirectStatus, destination } = getPushNavigation(source, paramsOrOptions, maybeOptions)

    if (destination && isRejectedRoute(destination)) {
      const rejection = getRejectionByType(destination.name)

      if (!rejection) {
        throw new RouteNotFoundError(destination.name)
      }

      const to = createResolvedRoute(rejection, destination.params, { ...options, url: asUrlString(url) })

      return navigate(to, { ...options, url })
    }

    if (isSSR) {
      setServerRedirect(redirectStatus ?? 302, url)

      return
    }

    return set(url, options)
  }

  const replace: RouterReplaceInternal<Routes> = (
    source: string | ResolvedRoute,
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

  function reject(type: string, options: RouterUpdateOptions = {}): Promise<void> {
    const rejection = getRejectionByType(type)

    if (!rejection) {
      return Promise.resolve()
    }

    const url = asUrlString(options.url ?? currentRoute.href)
    const to = createResolvedRoute(rejection, {}, { ...options, url })

    return navigate(to, options)
  }

  const { currentRoute, routerRoute, updateRoute } = createCurrentRoute<Routes>({
    routerKey,
    fallbackRoute: notFoundRoute,
    push,
    getData: valueStore.getData,
  })

  const currentRejection = computed(() => {
    if (!started.value || !isRejectedRoute(currentRoute)) {
      return null
    }

    return getRejectionByType(currentRoute.name) ?? null
  })

  /**
   * Sets the document title to the title that should currently be rendered.
   */
  async function updateTitle(signal: AbortSignal): Promise<void> {
    const title = await currentRoute.getTitle()

    if (signal.aborted) {
      return
    }

    setDocumentTitle(title)
  }

  const initialState = history.location.state
  const { host } = parseUrl(initialUrl)
  const isExternal = createIsExternal(host)

  let starting = false
  const { setServerRedirect, getServerRedirect } = createServerRedirect()
  /**
   * Whether a route or rejection has been committed. Until then there is nothing to render, and nothing
   * for a navigation to leave from.
   */
  const started = ref(false)

  const { promise: initialize, resolve: initialized } = Promise.withResolvers<void>()

  /**
   * Adopts the outcome the server rendered for the initial url, committed synchronously so the first
   * paint matches the markup already in the dom.
   */
  async function hydrate(payload: RouterPayload): Promise<void> {
    let to = find(initialUrl) ?? createResolvedRoute(notFoundRejection, {}, { url: asUrlString(initialUrl) })

    if (payload.kind === 'reject') {
      const rejection = getRejectionByType(payload.rejection)

      if (rejection) {
        to = createResolvedRoute(rejection, {}, { url: asUrlString(initialUrl) })
      }
    }

    const values = decodePayloadValues(to, payload.values, options?.transformer)
    const store = valueStore.createDetachedStore()

    store.fill(to, values)
    store.stage()

    await navigate(to, { url: initialUrl, replace: true, state: initialState, hydrating: true })
  }

  async function start(): Promise<void> {
    if (starting) {
      return initialize
    }

    starting = true

    const payload = getHydratingPayload()

    if (payload) {
      await hydrate(payload)
    } else {
      await set(initialUrl, { replace: true, state: initialState })
    }

    history.startListening()

    initialized()
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

    const title = await currentRoute.getTitle()
    const { values, failures } = encodePayloadValues(currentRoute, valueStore.getValues(currentRoute), options?.transformer)
    const status = currentRoute.status
    const rejection = currentRejection.value

    if (rejection) {
      return {
        kind: 'reject',
        status,
        rejection: rejection.name,
        title,
        failures,
        payload: payloadToScript({ kind: 'reject', url: initialUrl, rejection: rejection.name, values }),
      }
    }

    return {
      kind: 'success',
      status,
      title,
      failures,
      payload: payloadToScript({ kind: 'success', url: initialUrl, values }),
    }
  }

  function stop(): void {
    navigations.stop()
    navigationProgress.stop()
    history.stopListening()
  }

  function install(app: App): void {
    hooks.setVueApp(app)
    valueStore.setVueApp(app)

    const routerView = createRouterView(routerKey)
    const routerLink = createRouterLink(routerKey)
    const routerProgress = createRouterProgress(routerKey)

    app.component('RouterView', routerView)
    app.component('RouterLink', routerLink)
    app.component('RouterProgress', routerProgress)
    app.provide(getRouterRejectionInjectionKey(routerKey), currentRejection)
    app.provide(getRouterHooksKey(routerKey), hooks)
    app.provide(getRouteValueStoreInjectionKey(routerKey), valueStore)
    app.provide(getComponentsStoreKey(routerKey), componentsStore)
    app.provide(getNavigationProgressKey(routerKey), navigationProgress)
    app.provide(visibilityObserverKey, visibilityObserver)

    app.provide(routerKey, router)

    // Setup DevTools integration
    setupRouterDevtools({ router, app, routes })

    start()
  }

  const router: Router = {
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
    onError: hooks.onError,
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
