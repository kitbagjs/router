import { createPath } from '@/services/history'
import { App, nextTick, ref } from 'vue'
import { createCurrentPage, getCurrentPageKey } from '@/services/createCurrentPage'
import { createRoutePage, createRejectionPage } from '@/services/createPage'
import { getPageResponse } from '@/services/getPageResponse'
import { getPageRoute, Page, PageNavigation } from '@/types/page'
import { createIsExternal } from '@/services/createIsExternal'
import { createActivityTracker } from '@/services/createActivityTracker'
import { SsrOptionRequiredError } from '@/errors/ssrOptionRequiredError'
import { parseUrl, updateUrl } from '@/services/urlParser'
import { createRouteValueStore, RouteValueResponse } from '@/services/createRouteValueStore'
import { createNavigationProgress, NavigationProgressTracker } from '@/services/createNavigationProgress'
import { getNavigationProgressKey } from '@/compositions/useNavigation'
import { DataKind } from '@/services/createNavigationStores'
import { createRouterHistory } from '@/services/createRouterHistory'
import { createServerRedirect } from '@/services/createServerRedirect'
import { createRouterHooks, getRouterHooksKey } from '@/services/createRouterHooks'
import { getInitialUrl } from '@/services/getInitialUrl'
import { decodePayloadValues, getHydratingPayload, RouterPayload } from '@/services/payload'
import { setStateValues } from '@/services/state'
import { Routes } from '@/types/route'
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

type Navigation = PageNavigation & {
  controller: AbortController,
  progress: NavigationProgressTracker,
}

type RouterUpdateOptions = {
  replace?: boolean,
  state?: any,
  /**
   * A hydrating navigation adopts an outcome the server already rendered, so before hooks are not
   * consulted and the title the markup carries is kept.
   */
  hydrating?: boolean,
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
  const activity = createActivityTracker()
  const navigationProgress = createNavigationProgress()
  const { routes, getRouteByName, getRejectionByType } = getRoutesForRouter(routesOrArrayOfRoutes, plugins, options)
  const notFoundRejection = getRejectionByType('NotFound')
  const valueStore = createRouteValueStore()
  const notFoundRoute = createResolvedRoute(notFoundRejection.route)

  const hooks = createRouterHooks({ redirectStatus, ssr: isSSR })

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

  function toPage(route: ResolvedRoute): Page {
    return createRoutePage(route, { components: componentsStore, values: valueStore, redirectStatus, ssr: isSSR })
  }

  function rejectionPage(type: string, context: RejectContext = {}): Page | undefined {
    const rejection = getRejectionByType(type)

    if (rejection) {
      return createRejectionPage(rejection, context, rejectStatus)
    }
  }

  async function set(url: string, options: RouterUpdateOptions = {}): Promise<void> {
    if (pathHasTrailingSlash(url) && shouldRemoveTrailingSlashes) {
      const cleanedUrl = removeTrailingSlashesFromPath(url)

      if (isUrlString(cleanedUrl)) {
        return replace(cleanedUrl, { ...options, redirectStatus })
      }
    }

    const route = find(url, options)
    const page = route ? toPage(route) : createRejectionPage(notFoundRejection, { from: getPageRoute(currentPage.value) }, rejectStatus)

    return navigate(page, url, options)
  }

  function beginNavigation(page: Page, url: string, options: RouterUpdateOptions): Navigation {
    const controller = navigations.begin()
    const { signal } = controller
    const from = currentPage.value
    const progress = navigationProgress.begin({
      to: getPageRoute(page),
      from: getPageRoute(from),
      expected: countPageUnits(page, url),
      inert: isSSR || !!options.hydrating || signal.aborted,
    })

    signal.addEventListener('abort', progress.abort, { once: true })

    return { to: page, from, signal, controller, progress }
  }

  const navigate = activity.wrap(async (page: Page, url: string, options: RouterUpdateOptions = {}): Promise<void> => {
    let navigation = beginNavigation(page, url, options)

    if (navigation.signal.aborted) {
      return
    }

    if (!options.hydrating) {
      const response = await hooks.runBeforeHooks(navigation)

      switch (response.status) {
        case 'ABORT':
          navigation.controller.abort()
          return
        case 'PUSH':
        case 'REDIRECT':
          navigation.controller.abort()
          await push(...response.to)
          return
        case 'REJECT': {
          const rejected = rejectionPage(response.type, { to: getPageRoute(page), from: getPageRoute(navigation.from) })

          if (!rejected) {
            navigation.controller.abort()
            return
          }

          // A before hook chooses the outcome of this attempt. It does not start the same hooks again.
          navigation = beginNavigation(rejected, url, options)
          break
        }
        case 'SUCCESS':
          break
        default:
          response satisfies never
      }
    }

    if (navigation.signal.aborted) {
      return
    }

    history.update(url, options)

    const { signal, progress } = navigation

    if (!isExternal(url)) {
      const { props, loaders, values } = valueStore.commit(navigation.to.computations)
      const to = getPageRoute(navigation.to)
      const from = getPageRoute(navigation.from)

      activity.add(
        handleRouteValueResponse(props, 'props', to, from, signal),
        handleRouteValueResponse(loaders, 'loader', to, from, signal),
      )
      progress.track(...values, ...navigation.to.asyncComponents.map((component) => component.__asyncLoader()))
      updatePage(navigation.to)
    }

    progress.close()
    started.value = true

    if (!options.hydrating) {
      updateTitle(signal)
    }

    await Promise.all([nextTick(), runAfterHooks(navigation)])
  })

  async function runAfterHooks(navigation: Navigation): Promise<void> {
    const response = await hooks.runAfterHooks(navigation)

    if (navigation.signal.aborted) {
      return
    }

    switch (response.status) {
      case 'PUSH':
      case 'REDIRECT':
        navigation.controller.abort()
        await push(...response.to)
        return
      case 'REJECT':
        navigation.controller.abort()
        await reject(response.type, { to: getPageRoute(navigation.to), from: getPageRoute(navigation.from) })
        return
      case 'ABORT':
        navigation.controller.abort()
        return
      case 'SUCCESS':
        return
      default:
        response satisfies never
    }
  }

  function countPageUnits(page: Page, url: string): number {
    if (isExternal(url)) {
      return 0
    }

    return page.computations.length + page.asyncComponents.length
  }

  /**
   * Props and loaders are handled the same way, and neither is awaited here: a push or a rejection from
   * either is acted on whenever it arrives, without holding up the navigation that started it. Once that
   * navigation is superseded, its outcomes can no longer change the page or run error hooks.
   */
  function handleRouteValueResponse(response: Promise<RouteValueResponse>, source: DataKind, to: ResolvedRoute | null, from: ResolvedRoute | null, signal: AbortSignal): Promise<void> {
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

  const reject: RouterRejectInternal<TOptions['rejections'] | TPlugin['rejections']> = async (type: string, context: RejectContext = {}) => {
    const page = rejectionPage(type, context)

    if (page) {
      await navigate(page, createPath(history.location), { replace: true, state: history.location.state })
    }
  }

  const pages = createCurrentPage<TRoutes | TPlugin['routes']>({
    routerKey,
    fallbackRoute: notFoundRoute,
    push,
    values: valueStore,
    reject,
  })
  const { currentPage, routerRoute, currentRejection, updatePage, getTitle } = pages

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

    switch (payload.kind) {
      case 'reject': {
        const context = { to, from: null }
        const page = rejectionPage(payload.rejection, context) ?? createRejectionPage(notFoundRejection, context, rejectStatus)

        await navigate(page, initialUrl, { replace: true, state: initialState, hydrating: true })
        return
      }

      case 'success': {
        if (!to) {
          await navigate(createRejectionPage(notFoundRejection, {}, rejectStatus), initialUrl, { replace: true, state: initialState, hydrating: true })
          return
        }

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

    const page = currentPage.value

    if (!page) {
      throw new Error('Cannot render before a page has committed')
    }

    return getPageResponse(page, { url: initialUrl, title: await getTitle(), values: valueStore, transformer: options?.transformer })
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
    app.provide(getCurrentPageKey(routerKey), currentPage)
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
