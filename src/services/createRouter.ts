import { createPath } from '@/services/history'
import { App, nextTick, ref } from 'vue'
import { createRouterRoute } from '@/services/createRouterRoute'
import { createIsExternal } from '@/services/createIsExternal'
import { createActivityTracker } from '@/services/createActivityTracker'
import { SsrOptionRequiredError } from '@/errors/ssrOptionRequiredError'
import { parseUrl, updateUrl } from '@/services/urlParser'
import { createRouterNavigation, RouterNavigationResponseEvent, RouterNavigationStore } from '@/services/createRouterNavigation'
import { createNavigationProgress, NavigationProgressTracker } from '@/services/createNavigationProgress'
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
import { NOT_FOUND_REJECTION_TYPE } from '@/types/rejection'
import { Router, RouterOptions, ServerRenderResponse, RedirectStatus } from '@/types/router'
import { RouterPushInternal, RouterPushOptionsInternal, RouterReplaceInternal, RouterReplaceOptionsInternal } from '@/types/routerNavigationInternal'
import { RoutesName } from '@/types/routesMap'
import { UrlString, isUrlString } from '@/types/urlString'
import { createNavigationSignals } from '@/services/createNavigationSignals'
import { createVisibilityObserver } from './createVisibilityObserver'
import { visibilityObserverKey } from '@/compositions/useVisibilityObserver'
import { RouterResolve, RouterResolveOptions } from '@/types/routerResolve'
import { RouteNotFoundError } from '@/errors/routeNotFoundError'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { ResolvedRoute } from '@/types/resolved'
import { RejectContext, RouterRejectInternal } from '@/types/routerReject'
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
import { ContextPushError } from '@/errors/contextPushError'
import { ContextRejectionError } from '@/errors/contextRejectionError'
import { setupRouterDevtools } from '@/devtools/createRouterDevtools'
import { getMatchForUrl } from './getMatchesForUrl'
import { pathHasTrailingSlash, removeTrailingSlashesFromPath } from '@/utilities/trailingSlashes'
import { setDocumentTitle } from '@/utilities/setDocumentTitle'
import { createCurrentRejection } from '@/services/createCurrentRejection'
import { hasViewTransition, ViewTransitionConfig } from '@/types/viewTransition'
import { createViewTransitions, PendingViewTransition } from '@/services/createViewTransitions'
import { getViewTransitionTypes, supportsViewTransitions } from '@/utilities/viewTransition'
import { createAbortPromise } from '@/utilities/promises'
import { NavigationBehavior } from '@/types/navigation'
import { getNavigationOption, getRouteNavigationOption } from '@/utilities/navigation'

type RouteCommitOptions = {
  route: ResolvedRoute | null,
  signal: AbortSignal,
  update: (navigation: RouterNavigationStore) => void,
}

type RouteCommit = {
  /** Call before committing when assets must be ready. */
  prepare: () => Promise<boolean>,
  /** Call inside the view transition callback, or directly for ordinary navigation. */
  commit: () => Promise<boolean>,
}

type RouterUpdateOptions = {
  navigation?: NavigationBehavior,
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

type RunHooksContext = {
  controller: AbortController,
  to: ResolvedRoute | null,
  from: ResolvedRoute | null,
}

type ViewTransitionOptions = {
  to: ResolvedRoute | null,
  from: ResolvedRoute | null,
  options: RouterUpdateOptions,
  enabled: boolean,
}

type RunBeforeHooksContext = RunHooksContext & {
  url: string,
  options: RouterUpdateOptions,
  progress: NavigationProgressTracker,
}

type RunAfterHooksContext = RunHooksContext & {
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
    stop: stopRouteContext,
  } = getRoutesForRouter(routesOrArrayOfRoutes, plugins, options)
  const notFoundRejection = getRejectionByType('NotFound')
  const navigation = createRouterNavigation({ onResponse: onNavigationResponse })
  const notFoundRoute = createResolvedRoute(notFoundRejection.route)

  const hooks = createRouterHooks({ redirectStatus, onHookAdded: addHookContext })

  hooks.addGlobalRouteHooks(getGlobalHooksForRouter(plugins))

  const navigations = createNavigationSignals()
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

  /**
   * Runs the before hooks for a navigation and reacts to their response. Reports whether the
   * navigation should continue.
   */
  async function runBeforeHooks({ controller, to, from, url, options, progress }: RunBeforeHooksContext): Promise<boolean> {
    const response = await hooks.runBeforeRouteHooks({ to, from, signal: controller.signal, progress })

    if (controller.signal.aborted) {
      return false
    }

    switch (response.status) {
      case 'ABORT':
        options.traversal?.restore()
        progress.abort()

        return false

      case 'PUSH':
      case 'REDIRECT':
        await push(...response.to)

        return false

      case 'REJECT':
        if (options.traversal) {
          options.traversal.commit()
        } else {
          history.update(url, options)
        }
        reject(response.type, { to, from })
        progress.abort()

        return false

      case 'SUCCESS':
        if (options.traversal) {
          options.traversal.commit()
        } else {
          history.update(url, options)
        }

        return true

      default:
        const exhaustive: never = response
        throw new Error(`Switch is not exhaustive for before hook response status: ${JSON.stringify(exhaustive)}`)
    }
  }

  /**
   * Runs the after hooks for a navigation and reacts to their response.
   */
  async function runAfterHooks({ controller, to, from, enabled }: RunAfterHooksContext): Promise<void> {
    if (!enabled) {
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

  const set = activity.wrap(async (url: string, options: RouterUpdateOptions = {}): Promise<void> => {
    if (pathHasTrailingSlash(url) && shouldRemoveTrailingSlashes) {
      const cleanedUrl = removeTrailingSlashesFromPath(url)

      if (isUrlString(cleanedUrl)) {
        return replace(cleanedUrl, { ...options, redirectStatus })
      }
    }

    const controller = navigations.begin()

    if (controller.signal.aborted) {
      return
    }

    const to = find(url, options) ?? null
    const from = getFromRouteForHooks()
    const progress = navigationProgress.begin({
      to,
      from,
      expected: countRouteUnits(url, to),
      inert: isSSR || options.hydrating,
    })

    function commitNavigation(pending: RouterNavigationStore): void {
      if (!to) {
        reject(NOT_FOUND_REJECTION_TYPE, { to, from })
        progress.abort()

        return
      }

      clearRejection()

      if (!isExternal(url)) {
        setRouteValuesAndUpdateRoute(pending, to, from, progress)
      }

      progress.close()
      started.value = true

      if (!options.hydrating) {
        updateTitle(controller.signal)
      }
    }

    const routeCommit = createRouteCommit({
      route: to,
      signal: controller.signal,
      update: commitNavigation,
    })

    if (!options.hydrating) {
      const shouldCommit = await runBeforeHooks({ controller, to, from, url, options, progress })

      if (!shouldCommit) {
        controller.abort()

        return
      }
    }

    const transition = getViewTransition({
      to,
      from,
      options,
      enabled: !isSSR && !isExternal(url),
    })

    const { isBlockingNavigation } = getNavigationOption({
      routerNavigation,
      routeNavigation: getRouteNavigationOption(to),
      navigation: options.navigation,
    })
    const shouldPrepareNavigation = transition || isBlockingNavigation

    if (transition) {
      viewTransitions.prepare(transition)
    } else {
      viewTransitions.reset()
    }

    if (!options.hydrating && shouldPrepareNavigation) {
      const prepared = await routeCommit.prepare()

      if (!prepared && transition) {
        viewTransitions.cancel(transition)
      }

      if (!prepared) {
        return
      }
    }

    if (transition) {
      await viewTransitions.start(routeCommit.commit)
      await runAfterHooks({ controller, to, from, enabled: !isSSR })
      return
    }

    await Promise.all([
      routeCommit.commit(),
      runAfterHooks({ controller, to, from, enabled: !isSSR }),
    ])
  })

  function createRouteCommit({ route, signal, update }: RouteCommitOptions): RouteCommit {
    const pending = navigation.stage(route)
    signal.addEventListener('abort', pending.abandon, { once: true })

    const prepare: RouteCommit['prepare'] = async () => {
      if (signal.aborted) {
        return false
      }

      if (!route) {
        return true
      }

      const values = pending.compute(route, getComputations(route))
      const work = Promise.allSettled([
        Promise.all(values),
        ...loadAsyncComponents(route),
      ])
      await Promise.race([
        work,
        createAbortPromise(signal),
      ])

      return !signal.aborted
    }

    const commit: RouteCommit['commit'] = () => {
      if (signal.aborted) {
        return Promise.resolve(false)
      }

      update(pending)

      return nextTick().then(() => !signal.aborted)
    }

    return { prepare, commit }
  }

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
    if (!to || isExternal(url)) {
      return 0
    }

    return getComputations(to).length + getAsyncComponents(to).length
  }

  function setRouteValuesAndUpdateRoute(pending: RouterNavigationStore, to: ResolvedRoute, from: ResolvedRoute | null, progress: NavigationProgressTracker): void {
    const values = pending.commit({
      to,
      from,
    })

    progress.track(...values, ...loadAsyncComponents(to))

    routerRoute.updateRoute(to)
  }

  /**
   * Props and loaders are handled the same way, and neither is awaited here: a push or a rejection from
   * either is acted on whenever it arrives, without holding up the navigation that started it. Once that
   * navigation is superseded, its outcomes can no longer change the page or run error hooks.
   */
  function onNavigationResponse({ response, source, to, from, signal }: RouterNavigationResponseEvent): void {
    const work = response
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
            reject(response.type, { to, from })
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
            reject(error.response.type, { to, from })
            return
          }

          throw error
        }
      })

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
    source: UrlString | RoutesName<TRoutes | TPlugin['routes']> | ResolvedRoute,
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
      const { replace, navigation, viewTransition, redirectStatus, ...options }: RouterPushOptionsInternal = { ...maybeOptions }
      const params: any = { ...paramsOrOptions }
      const resolved = resolve(source, params, options)
      const state = setStateValues({ ...resolved.matched.state }, { ...resolved.state, ...options.state })

      return { url: resolved.href, options: { replace, state, navigation, viewTransition }, redirectStatus }
    }

    const { replace, navigation, viewTransition, redirectStatus, ...options }: RouterPushOptionsInternal = { ...paramsOrOptions }
    const state = setStateValues({ ...source.matched.state }, { ...source.state, ...options.state })

    const url = updateUrl(source.href, {
      query: options.query,
      hash: options.hash,
    })

    return { url, options: { replace, state, navigation, viewTransition }, redirectStatus }
  }

  const push: RouterPushInternal<TRoutes | TPlugin['routes']> = async (
    source: UrlString | RoutesName<TRoutes | TPlugin['routes']> | ResolvedRoute,
    paramsOrOptions?: Record<string, unknown> | RouterPushOptionsInternal,
    maybeOptions?: RouterPushOptionsInternal,
  ) => {
    const { url, options, redirectStatus } = getPushNavigation(source, paramsOrOptions, maybeOptions)

    if (isSSR) {
      setServerRedirect(redirectStatus ?? 302, url)
      const current = navigation.current()
      current.abandon()

      return
    }

    return set(url, options)
  }

  const replace: RouterReplaceInternal<TRoutes | TPlugin['routes']> = (
    source: UrlString | RoutesName<TRoutes | TPlugin['routes']> | ResolvedRoute,
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

  const reject: RouterRejectInternal<TOptions['rejections'] | TPlugin['rejections']> = (type: string, { to = null, from = null }: RejectContext = {}) => {
    const rejection = getRejectionByType(type)

    if (!rejection) {
      return
    }

    const controller = navigations.begin()

    if (isSSR) {
      const current = navigation.current()
      current.abandon()
    }

    hooks.runRejectionHooks(rejection, { to, from })

    updateRejection(rejection)
    started.value = true
    updateTitle(controller.signal)
  }

  const { currentRejection, updateRejection, clearRejection } = createCurrentRejection()
  const routerRoute = createRouterRoute<Router<TRoutes, TOptions, TPlugin>>({
    routerKey,
    route: notFoundRoute,
    push,
    getData: navigation.getData,
  })

  /**
   * The title that should currently be rendered.
   */
  async function getTitle(): Promise<string | undefined> {
    return await currentRejection.value?.getTitle() ?? routerRoute.getResolvedRoute().getTitle()
  }

  /**
   * Sets the document title to the title that should currently be rendered.
   */
  async function updateTitle(signal: AbortSignal): Promise<void> {
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
    const to = find(initialUrl) ?? null

    if (!to) {
      reject(NOT_FOUND_REJECTION_TYPE, { to, from: null })

      return
    }

    switch (payload.kind) {
      case 'reject':
        reject(payload.rejection, { to, from: null })

        return

      case 'success': {
        const values = decodePayloadValues(to, payload.values, options?.transformer)

        const prefetch = navigation.create()

        prefetch.fill(to, values)
        prefetch.stage()

        await set(initialUrl, { replace: true, state: initialState, hydrating: true })

        return
      }

      default:
        const exhaustive: never = payload
        throw new Error(`Switch is not exhaustive for payload kind: ${JSON.stringify(exhaustive)}`)
    }
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

    if (rejection) {
      const title = await getTitle()

      return {
        kind: 'reject',
        status: rejection.status ?? rejectStatus,
        rejection: rejection.type,
        title,
        payload: payloadToScript({ kind: 'reject', url: initialUrl, rejection: rejection.type }),
      }
    }

    const title = await getTitle()
    const resolved = routerRoute.getResolvedRoute()
    const { values, failures } = encodePayloadValues(resolved, navigation.getValues(resolved), options?.transformer)

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
    navigations.stop()
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

    app.component('RouterView', routerView)
    app.component('RouterLink', routerLink)
    app.component('RouterProgress', routerProgress)
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
