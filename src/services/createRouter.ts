import { createPath } from '@/services/history'
import { App, ref } from 'vue'
import { createCurrentRoute } from '@/services/createCurrentRoute'
import { createIsExternal } from '@/services/createIsExternal'
import { createActivityTracker } from '@/services/createActivityTracker'
import { SsrOptionRequiredError } from '@/errors/ssrOptionRequiredError'
import { parseUrl, updateUrl } from '@/services/urlParser'
import { createRouteValueStore, RouteValueResponse } from '@/services/createRouteValueStore'
import { DataKind } from '@/services/createNavigationStores'
import { createRouterHistory } from '@/services/createRouterHistory'
import { createServerRedirect } from '@/services/createServerRedirect'
import { createRouterHooks, getRouterHooksKey } from '@/services/createRouterHooks'
import { getInitialUrl } from '@/services/getInitialUrl'
import { decodePayloadValues, encodePayloadValues, getHydratingPayload, payloadToScript, RouterPayload } from '@/services/payload'
import { setStateValues } from '@/services/state'
import { Routes } from '@/types/route'
import { NOT_FOUND_REJECTION_TYPE } from '@/types/rejection'
import { Router, RouterOptions, ServerRenderResponse } from '@/types/router'
import { RouterPush, RouterPushOptions } from '@/types/routerPush'
import { RouterReplace, RouterReplaceOptions } from '@/types/routerReplace'
import { RoutesName } from '@/types/routesMap'
import { UrlString, isUrlString } from '@/types/urlString'
import { isFirstUniqueSequenceId } from '@/services/createUniqueIdSequence'
import { createNavigationIds } from '@/services/createNavigationIds'
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
import { ContextPushError } from '@/errors/contextPushError'
import { ContextRejectionError } from '@/errors/contextRejectionError'
import { setupRouterDevtools } from '@/devtools/createRouterDevtools'
import { getMatchForUrl } from './getMatchesForUrl'
import { pathHasTrailingSlash, removeTrailingSlashesFromPath } from '@/utilities/trailingSlashes'
import { setDocumentTitle } from '@/utilities/setDocumentTitle'
import { createCurrentRejection } from '@/services/createCurrentRejection'

type RouterUpdateOptions = {
  replace?: boolean,
  state?: any,
  /**
   * A hydrating navigation adopts an outcome the server already rendered, so before hooks are not
   * consulted and the title the markup carries is kept.
   */
  hydrating?: boolean,
}

type RunAfterHooksContext = {
  navigationId: string,
  to: ResolvedRoute | null,
  from: ResolvedRoute | null,
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
  const { routes, getRouteByName, getRejectionByType } = getRoutesForRouter(routesOrArrayOfRoutes, plugins, options)
  const notFoundRejection = getRejectionByType('NotFound')
  const valueStore = createRouteValueStore()
  const notFoundRoute = createResolvedRoute(notFoundRejection.route)

  const hooks = createRouterHooks()

  hooks.addGlobalRouteHooks(getGlobalHooksForRouter(plugins))

  const { getNavigationId, isCurrentNavigationId, stopNavigationIds } = createNavigationIds()
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
  async function runBeforeHooks(navigationId: string, to: ResolvedRoute | null, from: ResolvedRoute | null, url: string, options: RouterUpdateOptions): Promise<boolean> {
    const response = await hooks.runBeforeRouteHooks({ to, from })

    if (!isCurrentNavigationId(navigationId)) {
      return false
    }

    switch (response.status) {
      case 'ABORT':
        return false

      case 'PUSH':
        if (isSSR) {
          const navigation = getPushNavigation(...response.to)

          setServerRedirect(302, navigation.url)

          return false
        }

        await push(...response.to)

        return false

      case 'REDIRECT':
        if (isSSR) {
          const status = response.redirectStatus ?? redirectStatus
          const navigation = getPushNavigation(...response.to)

          setServerRedirect(status, navigation.url)

          return false
        }

        await push(...response.to)

        return false

      case 'REJECT':
        history.update(url, options)
        reject(response.type, { to, from })

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
  async function runAfterHooks({ navigationId, to, from }: RunAfterHooksContext): Promise<void> {
    const response = await hooks.runAfterRouteHooks({ to, from })

    if (!isCurrentNavigationId(navigationId)) {
      return
    }

    switch (response.status) {
      case 'PUSH':
        await push(...response.to)
        break

      case 'REJECT':
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
        if (isSSR) {
          setServerRedirect(redirectStatus, cleanedUrl)

          return
        }

        return replace(cleanedUrl, options)
      }
    }

    const navigationId = getNavigationId()

    const to = find(url, options) ?? null
    const from = getFromRouteForHooks(navigationId)

    function commitNavigation(): void {
      if (!to) {
        reject(NOT_FOUND_REJECTION_TYPE, { to, from })

        return
      }

      clearRejection()

      if (!isExternal(url)) {
        setRouteValuesAndUpdateRoute(to, from)
      }

      if (!options.hydrating) {
        updateTitle()
      }
    }

    if (!options.hydrating) {
      const shouldCommit = await runBeforeHooks(navigationId, to, from, url, options)

      if (!shouldCommit) {
        return
      }
    }

    commitNavigation()

    if (!isSSR) {
      await runAfterHooks({ navigationId, to, from })
    }
  })

  function setRouteValuesAndUpdateRoute(to: ResolvedRoute, from: ResolvedRoute | null): void {
    const { props, loaders } = valueStore.setRouteValues(to)

    activity.add(
      handleRouteValueResponse(props, 'props', to, from),
      handleRouteValueResponse(loaders, 'loader', to, from),
    )

    updateRoute(to)
  }

  /**
   * Props and loaders are handled the same way, and neither is awaited here: a push or a rejection from
   * either is acted on whenever it arrives, without holding up the navigation that started it.
   */
  function handleRouteValueResponse(response: Promise<RouteValueResponse>, source: DataKind, to: ResolvedRoute, from: ResolvedRoute | null): Promise<void> {
    return response
      .then((response) => {
        switch (response.status) {
          case 'SUCCESS':
          case 'ABANDONED':
            break

          case 'PUSH':
            if (isSSR) {
              const navigation = getPushNavigation(...response.to)

              setServerRedirect(302, navigation.url)

              break
            }

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
    paramsOrOptions?: Record<string, unknown> | RouterPushOptions,
    maybeOptions?: RouterPushOptions,
  ): { url: string, options: RouterUpdateOptions } {
    if (isUrlString(source)) {
      const options: RouterPushOptions = { ...paramsOrOptions }
      const url = updateUrl(source, {
        query: options.query,
        hash: options.hash,
      })

      return { url, options }
    }

    if (typeof source === 'string') {
      const { replace, ...options }: RouterPushOptions = { ...maybeOptions }
      const params: any = { ...paramsOrOptions }
      const resolved = resolve(source, params, options)
      const state = setStateValues({ ...resolved.matched.state }, { ...resolved.state, ...options.state })

      return { url: resolved.href, options: { replace, state } }
    }

    const { replace, ...options }: RouterPushOptions = { ...paramsOrOptions }
    const state = setStateValues({ ...source.matched.state }, { ...source.state, ...options.state })

    const url = updateUrl(source.href, {
      query: options.query,
      hash: options.hash,
    })

    return { url, options: { replace, state } }
  }

  const push: RouterPush<TRoutes | TPlugin['routes']> = (
    source: UrlString | RoutesName<TRoutes | TPlugin['routes']> | ResolvedRoute,
    paramsOrOptions?: Record<string, unknown> | RouterPushOptions,
    maybeOptions?: RouterPushOptions,
  ) => {
    const { url, options } = getPushNavigation(source, paramsOrOptions, maybeOptions)

    return set(url, options)
  }

  const replace: RouterReplace<TRoutes | TPlugin['routes']> = (
    source: UrlString | RoutesName<TRoutes | TPlugin['routes']> | ResolvedRoute,
    paramsOrOptions?: Record<string, unknown> | RouterReplaceOptions,
    maybeOptions?: RouterReplaceOptions,
  ) => {
    if (isUrlString(source)) {
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

  const reject: RouterRejectInternal<TOptions['rejections'] | TPlugin['rejections']> = (type: string, { to = null, from = null }: RejectContext = {}) => {
    const rejection = getRejectionByType(type)

    if (!rejection) {
      return
    }

    hooks.runRejectionHooks(rejection, { to, from })

    updateRejection(rejection)
    updateTitle()
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
  async function updateTitle(): Promise<void> {
    const title = await getTitle()

    setDocumentTitle(title)
  }

  const initialUrl = getInitialUrl(options?.initialUrl)
  const initialState = history.location.state
  const { host } = parseUrl(initialUrl)
  const isExternal = createIsExternal(host)

  let starting = false
  const { setServerRedirect, getServerRedirect } = createServerRedirect()
  const started = ref(false)

  // eslint is just incorrect here
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  const { promise: initialize, resolve: initialized } = Promise.withResolvers<void>()

  /**
   * Adopts the outcome the server rendered for the initial url, committed synchronously so the first
   * paint matches the markup already in the dom.
   */
  async function hydrate(payload: RouterPayload): Promise<void> {
    const to = find(initialUrl) ?? null

    if (!to) {
      reject(NOT_FOUND_REJECTION_TYPE, { to, from: null })
      started.value = true

      return
    }

    switch (payload.kind) {
      case 'reject':
        reject(payload.rejection, { to, from: null })
        started.value = true

        return

      case 'success': {
        const values = decodePayloadValues(to, payload.values, options?.transformer)

        valueStore.prefill(to, values)

        const navigation = set(initialUrl, { replace: true, state: initialState, hydrating: true })

        started.value = true

        await navigation

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
    stopNavigationIds()
    history.stopListening()
  }

  function getFromRouteForHooks(navigationId: string): ResolvedRoute | null {
    return isFirstUniqueSequenceId(navigationId) ? null : { ...currentRoute }
  }

  function install(app: App): void {
    hooks.setVueApp(app)
    valueStore.setVueApp(app)

    const routerView = createRouterView(routerKey)
    const routerLink = createRouterLink(routerKey)

    app.component('RouterView', routerView)
    app.component('RouterLink', routerLink)
    app.provide(getRouterRejectionInjectionKey(routerKey), currentRejection)
    app.provide(getRouterHooksKey(routerKey), hooks)
    app.provide(getRouteValueStoreInjectionKey(routerKey), valueStore)
    app.provide(getComponentsStoreKey(routerKey), componentsStore)
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
