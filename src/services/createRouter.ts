import { createPath } from '@/services/history'
import { App, computed, nextTick, reactive, ref, shallowRef } from 'vue'
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
import { isRejection, NOT_FOUND_REJECTION_TYPE, Rejection, RejectionInternal } from '@/types/rejection'
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
import { createRoutePage, createRejectionPage } from '@/services/createPage'
import { Page } from '@/types/page'
import { BeforeHookResponse } from '@/types/hooks'
import { getPageKey } from '@/compositions/usePage'
import { createPageValues, emptyPageValues, PageValues } from '@/services/createPageValues'
import { createPageStatus } from '@/services/createPageStatus'
import { createAbortPromise } from '@/utilities/promises'

type RouterUpdateOptions = {
  replace?: boolean,
  state?: any,
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

type RunAfterHooksContext = RunHooksContext & {
  enabled: boolean,
}

type PageCommit = {
  /** Resolves with the first replacement outcome, or success once all required assets are ready. */
  prepare: () => Promise<RouteValueResponse>,
  /** Commits synchronously, then waits for Vue's render update. */
  commit: () => Promise<boolean>,
}

type PageNavigationOptions = RunHooksContext & {
  page: Page,
  values?: PageValues,
  options?: RouterUpdateOptions,
  progress?: NavigationProgressTracker,
  onCommit: () => void,
}

type PageNavigationRequest = Omit<PageNavigationOptions, 'controller' | 'progress'> & {
  url?: string,
}

type PageDestination = Pick<PageNavigationOptions, 'page' | 'values' | 'onCommit'>

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
  const activity = createActivityTracker()
  const navigationProgress = createNavigationProgress()
  const { routes, getRouteByName, getRejectionByType } = getRoutesForRouter(routesOrArrayOfRoutes, plugins, options)
  const notFoundRejection = getRejectionByType('NotFound')
  const valueStore = createRouteValueStore()
  const notFoundRoute = createResolvedRoute(notFoundRejection.route)

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

  async function runBeforeHooks({ controller, to, from, progress }: RunHooksContext & { progress: NavigationProgressTracker }): Promise<BeforeHookResponse> {
    const response = await hooks.runBeforeRouteHooks({ to, from, signal: controller.signal, progress })

    if (controller.signal.aborted) {
      return { status: 'ABORT' }
    }

    return response
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

  async function set(url: string, options: RouterUpdateOptions = {}): Promise<void> {
    if (pathHasTrailingSlash(url) && shouldRemoveTrailingSlashes) {
      const cleanedUrl = removeTrailingSlashesFromPath(url)

      if (isUrlString(cleanedUrl)) {
        return replace(cleanedUrl, { ...options, redirectStatus })
      }
    }

    const to = find(url, options) ?? null
    const from = getFromRouteForHooks()

    return navigate({ ...getPageDestination(to, from), to, from, url, options })
  }

  function getPageDestination(to: ResolvedRoute | null, from: ResolvedRoute | null): PageDestination {
    if (!to) {
      return getRejectionDestination(notFoundRejection, { to, from })
    }

    if (isExternal(to.href)) {
      return {
        page: createRoutePage({ ...currentRoute }, componentsStore),
        onCommit: () => {},
      }
    }

    return {
      page: createRoutePage(to, componentsStore),
      values: createPageValues(to, valueStore),
      onCommit: () => updateRoute(to),
    }
  }

  function getRejectionDestination(rejection: Rejection & RejectionInternal, context: Pick<RunHooksContext, 'to' | 'from'>): PageDestination {
    return {
      page: createRejectionPage(rejection, currentRoute.getTitle, rejectStatus),
      onCommit: () => hooks.runRejectionHooks(rejection, context),
    }
  }

  const navigate = activity.wrap(async (request: PageNavigationRequest): Promise<void> => {
    let controller = navigations.begin()

    if (controller.signal.aborted) {
      return
    }

    let navigation = request
    const { from, options = {} } = request
    let progress = navigationProgress.begin({
      to: navigation.to,
      from,
      expected: countPageUnits(navigation),
      inert: isSSR || options.hydrating,
    })

    if (!options.hydrating) {
      const response = await runBeforeHooks({ controller, to: navigation.to, from, progress })

      switch (response.status) {
        case 'ABORT':
          controller.abort()
          progress.abort()

          return

        case 'PUSH':
        case 'REDIRECT':
          await push(...response.to)
          controller.abort()
          progress.abort()

          return

        case 'REJECT':
          const rejection = getRejectionByType(response.type)

          if (!rejection) {
            controller.abort()
            progress.abort()

            return
          }

          const destination = getRejectionDestination(rejection, { to: navigation.to, from })

          controller = navigations.begin()
          progress.abort()
          navigation = { ...navigation, ...destination, to: null, values: emptyPageValues }
          progress = navigationProgress.begin({
            to: null,
            from,
            expected: countPageUnits(navigation),
            inert: isSSR,
          })
          break

        case 'SUCCESS':
          break

        default:
          const exhaustive: never = response
          throw new Error(`Switch is not exhaustive for before hook response status: ${JSON.stringify(exhaustive)}`)
      }

      if (request.url) {
        history.update(request.url, options)
      }
    }

    const { commit } = createNavigationCommit({ ...navigation, controller, progress })

    await Promise.all([
      commit(),
      runAfterHooks({ controller, to: navigation.to, from, enabled: !isSSR }),
    ])
  })

  function createNavigationCommit({ page, values = emptyPageValues, controller, to, from, options = {}, progress, onCommit }: PageNavigationOptions): PageCommit {
    const { signal } = controller
    const status = createPageStatus()

    const dispose = (): void => {
      status.set('abandoned')
      values.dispose()
      signal.removeEventListener('abort', dispose)
    }

    signal.addEventListener('abort', dispose, { once: true })

    const prepare: PageCommit['prepare'] = async () => {
      if (signal.aborted) {
        dispose()

        return { status: 'ABANDONED' }
      }

      status.set('preparing')
      try {
        const response = await Promise.race([prepareAssets(), createAbortPromise(signal)])

        if (!response || status.isAbandoned()) {
          dispose()

          return { status: 'ABANDONED' }
        }

        if (response.status !== 'SUCCESS') {
          dispose()

          return response
        }

        status.set('prepared')

        return response
      } catch (error) {
        dispose()
        throw error
      }
    }

    async function prepareAssets(): Promise<RouteValueResponse> {
      const preparedValues = prepareValues()
      const preparedComponents = prepareComponents()
      const response = await Promise.race([preparedValues, preparedComponents])

      if (response.status !== 'SUCCESS') {
        return response
      }

      const responses = await Promise.all([preparedValues, preparedComponents])

      for (const response of responses) {
        if (response.status !== 'SUCCESS') {
          return response
        }
      }

      return { status: 'SUCCESS' }
    }

    async function prepareValues(): Promise<RouteValueResponse> {
      const valuesToPrepare = values.prepare()
      const props = getRouteValueResponse(valuesToPrepare.props, 'props', to, from, signal)
      const loaders = getRouteValueResponse(valuesToPrepare.loaders, 'loader', to, from, signal)
      const response = await Promise.race([props, loaders])

      if (response.status !== 'SUCCESS') {
        return response
      }

      const responses = await Promise.all([props, loaders])

      for (const response of responses) {
        if (response.status !== 'SUCCESS') {
          return response
        }
      }

      return { status: 'SUCCESS' }
    }

    async function prepareComponents(): Promise<RouteValueResponse> {
      await Promise.all(loadAsyncComponents(page.assets))

      return { status: 'SUCCESS' }
    }

    async function commit(): Promise<boolean> {
      if (signal.aborted || status.isPreparing() || status.isAbandoned()) {
        return false
      }

      const responses = values.commit()
      const components = loadAsyncComponents(page.assets)

      activity.add(...components)

      if (!status.isPrepared()) {
        activity.add(
          handleRouteValueResponse(responses.props, 'props', to, from, signal),
          handleRouteValueResponse(responses.loaders, 'loader', to, from, signal),
        )
      }

      progress?.track(...responses.values, ...components)
      onCommit()

      if (status.isAbandoned()) {
        return false
      }

      signal.removeEventListener('abort', dispose)
      currentPage.value = page
      progress?.close()
      started.value = true

      if (!options.hydrating) {
        updateTitle(signal)
      }

      await nextTick()

      return !signal.aborted
    }

    return { prepare, commit }
  }

  /** Counts the assets this page will actually compute or load. */
  function countPageUnits({ page, values }: PageDestination): number {
    const components = getAsyncComponents(page.assets).length

    if (!values || values === emptyPageValues) {
      return components
    }

    return components + getComputations(page.assets).length
  }

  /**
   * Props and loaders are handled the same way, and neither is awaited here: a push or a rejection from
   * either is acted on whenever it arrives, without holding up the navigation that started it.
   */
  async function handleRouteValueResponse(response: Promise<RouteValueResponse>, source: DataKind, to: ResolvedRoute | null, from: ResolvedRoute | null, signal: AbortSignal): Promise<void> {
    const result = await getRouteValueResponse(response, source, to, from, signal)

    if (signal.aborted) {
      return
    }

    switch (result.status) {
      case 'SUCCESS':
      case 'ABANDONED':
        return

      case 'PUSH':
        push(...result.to)
        return

      case 'REJECT':
        reject(result.type, { to, from })
        return

      default:
        const exhaustive: never = result
        throw new Error(`Switch is not exhaustive for route data response status: ${JSON.stringify(exhaustive)}`)
    }
  }

  async function getRouteValueResponse(response: Promise<RouteValueResponse>, source: DataKind, to: ResolvedRoute | null, from: ResolvedRoute | null, signal: AbortSignal): Promise<RouteValueResponse> {
    try {
      return await response
    } catch (error) {
      if (signal.aborted) {
        return { status: 'ABANDONED' }
      }

      try {
        hooks.runErrorHooks(error, { to, from, source })
      } catch (error) {
        if (error instanceof ContextPushError || error instanceof ContextRejectionError) {
          return error.response
        }

        throw error
      }

      return { status: 'SUCCESS' }
    }
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
      const { replace, redirectStatus, ...options }: RouterPushOptionsInternal = { ...maybeOptions }
      const params: any = { ...paramsOrOptions }
      const resolved = resolve(source, params, options)
      const state = setStateValues({ ...resolved.matched.state }, { ...resolved.state, ...options.state })

      return { url: resolved.href, options: { replace, state }, redirectStatus }
    }

    const { replace, redirectStatus, ...options }: RouterPushOptionsInternal = { ...paramsOrOptions }
    const state = setStateValues({ ...source.matched.state }, { ...source.state, ...options.state })

    const url = updateUrl(source.href, {
      query: options.query,
      hash: options.hash,
    })

    return { url, options: { replace, state }, redirectStatus }
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

  const reject: RouterRejectInternal<TOptions['rejections'] | TPlugin['rejections']> = (type: string, context: RejectContext = {}) => {
    void navigateRejection(type, context)
  }

  function navigateRejection(type: string, context: RejectContext = {}, options: RouterUpdateOptions = {}): Promise<void> {
    const rejection = getRejectionByType(type)

    if (!rejection) {
      return Promise.resolve()
    }

    const from = getFromRouteForHooks()
    const { to = null, from: sourceFrom = from } = context

    return navigate({
      ...getRejectionDestination(rejection, { to, from: sourceFrom }),
      to: null,
      from,
      options,
    })
  }

  const currentPage = shallowRef<Page | null>(null)
  const currentRejection = computed({
    get: () => currentPage.value?.rejection ?? null,
    set: (rejection: Rejection | null) => {
      if (isRejection(rejection)) {
        currentPage.value = createRejectionPage(rejection, currentRoute.getTitle, rejectStatus)

        return
      }

      const page = createRoutePage({ ...currentRoute }, componentsStore)

      if (rejection) {
        const getRouteTitle = page.getTitle

        page.rejection = reactive(rejection)
        page.status = rejection.status ?? rejectStatus
        page.getTitle = async () => await rejection.getTitle() ?? getRouteTitle()
      }

      currentPage.value = page
    },
  })
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
    return (currentPage.value?.getTitle ?? currentRoute.getTitle)()
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
      await navigateRejection(NOT_FOUND_REJECTION_TYPE, { to, from: null }, { hydrating: true })

      return
    }

    switch (payload.kind) {
      case 'reject':
        await navigateRejection(payload.rejection, { to, from: null }, { hydrating: true })

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
        status: currentPage.value?.status ?? rejectStatus,
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
    if (!started.value || currentPage.value?.rejection) {
      return null
    }

    return { ...currentRoute }
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
    app.provide(getPageKey(routerKey), currentPage)
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
