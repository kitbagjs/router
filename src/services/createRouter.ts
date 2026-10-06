import { createPath } from '@/services/history'
import { App, nextTick, ref } from 'vue'
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
import { isRejection, NOT_FOUND_REJECTION_TYPE } from '@/types/rejection'
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
import { getRouteValueStoreInjectionKey } from '@/compositions/useRouteValueStore'
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
import { hasViewTransition, ViewTransitionConfig, ViewTransitionTarget } from '@/types/viewTransition'
import { createViewTransitions } from '@/services/createViewTransitions'
import { getViewTransitionTypes, isViewTransitionEnabled, supportsViewTransitions } from '@/utilities/viewTransition'
import { createAbortPromise } from '@/utilities/promises'
import { NavigationBehavior } from '@/types/navigation'
import { getNavigationOption, getRouteNavigationOption } from '@/utilities/navigation'

type RouteCommitOptions = {
  route: ResolvedRoute | null,
  from: ResolvedRoute | null,
  signal: AbortSignal,
  update: () => void,
}

type RouteCommit = {
  /** Call before committing when assets must be ready. */
  prepare: () => Promise<RouteValueResponse>,
  /** Call inside the view transition callback, or directly for ordinary navigation. */
  commit: () => Promise<boolean>,
}

type RouterUpdateOptions = {
  navigation?: NavigationBehavior,
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

type NavigationCommitOptions = {
  to: ViewTransitionTarget,
  from: ResolvedRoute | null,
  route: ResolvedRoute | null,
  controller: AbortController,
  url: string,
  options: RouterUpdateOptions,
  update: (prepared: boolean) => void,
  afterCommit?: () => Promise<void>,
}

type RejectionNavigationOptions = RejectContext & {
  type: string,
  url?: string,
  options?: RouterUpdateOptions,
  update?: () => void,
  afterCommit?: () => Promise<void>,
}

type RouteValueResponseOptions = {
  response: Promise<RouteValueResponse>,
  source: DataKind,
  to: ResolvedRoute,
  from: ResolvedRoute | null,
  options?: RouterUpdateOptions,
}

type RouteValueCommitOptions = {
  to: ResolvedRoute,
  from: ResolvedRoute | null,
  progress: NavigationProgressTracker,
  options: RouterUpdateOptions,
  prepared: boolean,
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
  const { routes, getRouteByName, getRejectionByType } = getRoutesForRouter(routesOrArrayOfRoutes, plugins, options)
  const notFoundRejection = getRejectionByType('NotFound')
  const valueStore = createRouteValueStore()
  const notFoundRoute = createResolvedRoute(notFoundRejection.route)

  const hooks = createRouterHooks({ redirectStatus })

  hooks.addGlobalRouteHooks(getGlobalHooksForRouter(plugins))

  const navigations = createNavigationSignals()
  const viewTransitions = createViewTransitions()
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
  async function runBeforeHooks({ controller, to, from, url, options, progress }: RunBeforeHooksContext): Promise<boolean> {
    const response = await hooks.runBeforeRouteHooks({ to, from, signal: controller.signal, progress })

    if (controller.signal.aborted) {
      return false
    }

    switch (response.status) {
      case 'ABORT':
        progress.abort()

        return false

      case 'PUSH':
      case 'REDIRECT':
        await push(...response.to)

        return false

      case 'REJECT':
        history.update(url, options)
        await rejectNavigation({ type: response.type, to, from, url, options })
        progress.abort()

        return false

      case 'SUCCESS':
        history.update(url, options)

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
        await rejectNavigation({ type: response.type, to, from })
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

    if (!options.hydrating) {
      const shouldCommit = await runBeforeHooks({ controller, to, from, url, options, progress })

      if (!shouldCommit) {
        controller.abort()

        return
      }
    }

    if (!to) {
      await rejectNavigation({
        type: NOT_FOUND_REJECTION_TYPE,
        to,
        from,
        url,
        options,
        afterCommit: () => runAfterHooks({ controller, to, from, enabled: !isSSR }),
      })
      progress.abort()

      return
    }

    await commitNavigation({
      to,
      from,
      route: to,
      controller,
      url,
      options,
      update: (prepared) => {
        clearRejection()

        if (!isExternal(url)) {
          setRouteValuesAndUpdateRoute({ to, from, progress, options, prepared })
        }

        progress.close()
        started.value = true

        if (!options.hydrating) {
          updateTitle(controller.signal)
        }
      },
      afterCommit: () => runAfterHooks({ controller, to, from, enabled: !isSSR }),
    })
  })

  async function commitNavigation({ to, from, route, controller, url, options, update, afterCommit }: NavigationCommitOptions): Promise<void> {
    const fromView = started.value ? currentRejection.value ?? getFromRouteForHooks() : null
    const configs = {
      routerViewTransition,
      routeViewTransition: route?.matches.findLast(hasViewTransition)?.viewTransition,
      navigationViewTransition: options.viewTransition,
    }
    const canTransition = !isSSR && !options.hydrating && !isExternal(url) && fromView !== null && supportsViewTransitions()
    const transition = canTransition && isViewTransitionEnabled(configs) ? { to, from: fromView, types: [] } : false
    const { isBlockingNavigation } = getNavigationOption({
      routerNavigation,
      routeNavigation: getRouteNavigationOption(route),
      navigation: options.navigation,
    })
    const shouldPrepareNavigation = transition || isBlockingNavigation
    let prepared = false
    const routeCommit = createRouteCommit({
      route: isRejection(to) ? createResolvedRoute(to.route) : route,
      from,
      signal: controller.signal,
      update: () => update(prepared),
    })

    if (transition) {
      viewTransitions.prepare(transition)
    } else {
      viewTransitions.reset()
    }

    if (!options.hydrating && shouldPrepareNavigation) {
      const response = await routeCommit.prepare()
      prepared = true

      if (response.status !== 'SUCCESS' && transition) {
        viewTransitions.cancel(transition)
      }

      switch (response.status) {
        case 'ABANDONED':
          return

        case 'PUSH':
          await push(...response.to)
          return

        case 'REJECT':
          await rejectNavigation({ type: response.type, to: route, from, url, options, update: () => update(true) })
          return

        case 'SUCCESS':
          break
      }
    }

    if (transition) {
      const types = getViewTransitionTypes({ ...configs, to, from: transition.from })

      if (types !== false) {
        viewTransitions.prepare({ ...transition, types })
        await viewTransitions.start(routeCommit.commit)
        await afterCommit?.()

        return
      }

      viewTransitions.cancel(transition)
    }

    await Promise.all([
      routeCommit.commit(),
      afterCommit?.(),
    ])
  }

  function createRouteCommit({ route, from, signal, update }: RouteCommitOptions): RouteCommit {
    const isAborted = (): boolean => signal.aborted

    const prepare: RouteCommit['prepare'] = async () => {
      if (isAborted()) {
        return { status: 'ABANDONED' }
      }

      if (!route) {
        return { status: 'SUCCESS' }
      }

      const values = valueStore.staged().compute(route)
      const outcome = Promise.withResolvers<RouteValueResponse>()
      const waitForResponse = async (context: RouteValueResponseOptions): Promise<void> => {
        const result = await getRouteValueResponse(context)

        if (result.status !== 'SUCCESS') {
          outcome.resolve(result)
        }
      }
      const work = Promise.allSettled([
        waitForResponse({ response: values.props, source: 'props', to: route, from }),
        waitForResponse({ response: values.loaders, source: 'loader', to: route, from }),
        ...loadAsyncComponents(route),
      ])

      work.then(() => outcome.resolve({ status: 'SUCCESS' }))

      await Promise.race([
        outcome.promise,
        createAbortPromise(signal),
      ])

      return isAborted() ? { status: 'ABANDONED' } : outcome.promise
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
  function countRouteUnits(url: string, to: ResolvedRoute | null): number {
    if (!to || isExternal(url)) {
      return 0
    }

    return getComputations(to).length + getAsyncComponents(to).length
  }

  function setRouteValuesAndUpdateRoute({ to, from, progress, options, prepared }: RouteValueCommitOptions): void {
    const { props, loaders, values } = valueStore.commit(to)

    if (!prepared) {
      activity.add(
        handleRouteValueResponse({ response: props, source: 'props', to, from, options }),
        handleRouteValueResponse({ response: loaders, source: 'loader', to, from, options }),
      )
    }

    progress.track(...values, ...loadAsyncComponents(to))

    updateRoute(to)
  }

  function getRouteValueResponse({ response, source, to, from }: RouteValueResponseOptions): Promise<RouteValueResponse> {
    return response.catch((error: unknown) => {
      try {
        hooks.runErrorHooks(error, { to, from, source })
      } catch (error) {
        if (error instanceof ContextPushError || error instanceof ContextRejectionError) {
          return error.response
        }

        throw error
      }

      return { status: 'SUCCESS' }
    })
  }

  function handleRouteValueResponse({ options, ...context }: RouteValueResponseOptions): Promise<void> {
    return getRouteValueResponse(context).then((response) => {
      switch (response.status) {
        case 'SUCCESS':
        case 'ABANDONED':
          break

        case 'PUSH':
          push(...response.to)
          break

        case 'REJECT':
          activity.add(rejectNavigation({ type: response.type, to: context.to, from: context.from, options }))
          break

        default:
          const exhaustive: never = response
          throw new Error(`Switch is not exhaustive for route data response status: ${JSON.stringify(exhaustive)}`)
      }
    })
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

  function rejectNavigation({ type, to = null, from = null, url = createPath(history.location), options = {}, update, afterCommit }: RejectionNavigationOptions): Promise<void> {
    const rejection = getRejectionByType(type)

    if (!rejection) {
      return Promise.resolve()
    }

    const controller = navigations.begin()

    return commitNavigation({
      afterCommit,
      to: rejection,
      from,
      route: to,
      controller,
      url,
      options,
      update: () => {
        update?.()
        hooks.runRejectionHooks(rejection, { to, from })
        updateRejection(rejection)
        started.value = true

        if (!options.hydrating) {
          updateTitle(controller.signal)
        }
      },
    })
  }

  const reject: RouterRejectInternal<TOptions['rejections'] | TPlugin['rejections']> = (type: string, context: RejectContext = {}) => {
    activity.add(rejectNavigation({ type, ...context }))
  }

  const { currentRejection, updateRejection, clearRejection } = createCurrentRejection()
  const { currentRoute, routerRoute, updateRoute } = createCurrentRoute<TRoutes | TPlugin['routes']>({
    routerKey,
    fallbackRoute: notFoundRoute,
    push,
    getData: valueStore.getData,
  })

  /**
   * The title that should currently be rendered.
   */
  async function getTitle(): Promise<string | undefined> {
    return await currentRejection.value?.getTitle() ?? currentRoute.getTitle()
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
    const to = find(initialUrl) ?? null

    if (!to) {
      await rejectNavigation({ type: NOT_FOUND_REJECTION_TYPE, to, options: { hydrating: true } })

      return
    }

    switch (payload.kind) {
      case 'reject':
        await rejectNavigation({ type: payload.rejection, to, options: { hydrating: true } })

        return

      case 'success': {
        const values = decodePayloadValues(to, payload.values, options?.transformer)

        const store = valueStore.createDetachedStore()

        store.fill(to, values)
        store.stage()

        await set(initialUrl, { replace: true, state: initialState, hydrating: true })

        return
      }

      default:
        const exhaustive: never = payload
        throw new Error(`Switch is not exhaustive for payload kind: ${JSON.stringify(exhaustive)}`)
    }
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
    const { values, failures } = encodePayloadValues(currentRoute, valueStore.getValues(currentRoute), options?.transformer)

    return {
      kind: 'success',
      status: 200,
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

  function getFromRouteForHooks(): ResolvedRoute | null {
    return started.value ? { ...currentRoute } : null
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
    app.component('ViewTransition', ViewTransition)
    app.provide(getViewTransitionKey(routerKey), viewTransitions.viewTransition)
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
