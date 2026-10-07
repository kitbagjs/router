import { App, InjectionKey, Ref } from 'vue'
import { RouterHistoryMode } from '@/services/createRouterHistory'
import { TransformerOptions } from '@/services/payload'
import { RouterRoute } from '@/types/routerRoute'
import { AddBeforeEnterHook, AddBeforeUpdateHook, AddBeforeLeaveHook, AddAfterEnterHook, AddAfterUpdateHook, AddAfterLeaveHook, AddErrorHook } from '@/types/hooks'
import { PrefetchConfig } from '@/types/prefetch'
import { ResolvedRoute } from '@/types/resolved'
import { Route, Routes } from '@/types/route'
import { RouterPush } from '@/types/routerPush'
import { RouterReplace } from '@/types/routerReplace'
import { RouterResolve, RouterResolveOptions } from '@/types/routerResolve'
import { RouterReject } from '@/types/routerReject'
import { RouterPlugin } from '@/types/routerPlugin'
import { RoutesName } from '@/types/routesMap'
import { ExtractRejections, Rejection, Rejections, ExtractRouteRejections } from '@/types/rejection'
import { PayloadValueError } from '@/errors/payloadValueError'

/**
 * Options to initialize a {@link Router} instance.
 */
export type RouterOptions = TransformerOptions & {
  /**
   * Initial URL for the router to use. Required if using Node environment. Defaults to window.location when using browser.
   *
   * @default window.location.toString()
   */
  initialUrl?: string,

  /**
   * Marks the router as rendering on a server, so every navigation is part of the server render from
   * the moment the router is created. Required to call `render`.
   */
  ssr?: boolean,

  /**
   * Specifies the history mode for the router, such as "browser", "memory", or "hash".
   *
   * @default "auto"
   */
  historyMode?: RouterHistoryMode,

  /**
   * Base path to be prepended to any URL. Can be used for Vue applications that run in nested folder for domain.
   * For example having `base` of `/foo` would assume all routes should start with `your.domain.com/foo`.
   */
  base?: string,

  /**
   * Determines what assets are prefetched when router-link is rendered for a specific route
   */
  prefetch?: PrefetchConfig,

  /**
   * Components assigned to each type of rejection your router supports.
   */
  rejections?: Rejections,

  /**
   * Removes trailing slashes from the URL before matching routes. The browser's url is updated to reflect using `router.replace`.
   *
   * @default true
   */
  removeTrailingSlashes?: boolean,

  /**
   * The status `render` responds with for a normalized url or a route redirect that does not declare
   * its own.
   *
   * @default 302
   */
  redirectStatus?: RedirectStatus,

  /**
   * When false, createRouterAssets must be used for component and hooks. Assets exported by the library
   * will not work with the created router instance.
   *
   * @default true
   */
  isGlobalRouter?: boolean,
}

/**
 * What a server should respond with for what the router rendered. `location` exists only on a redirect,
 * so narrowing on it is what proves a `Location` header is available.
 */
export type ServerRenderResponse = RenderSuccess | RenderReject | RenderRedirect

export type RenderSuccess = {
  kind: 'success',
  /**
   * Suggested http status.
   */
  status: number,
  /**
   * A script tag to embed in the document sent to the client, so it adopts what this render settled on
   * rather than working it out again.
   */
  payload: string,
  /**
   * The title of the route that rendered, for the document sent to the client.
   */
  title: string | undefined,
  /**
   * Values that could not be encoded into the payload. Each was left out, so the client computes it
   * again, which can cause a hydration mismatch. Returned so a server can log or inspect them.
   */
  failures: PayloadValueError[],
}

export type RenderReject = {
  kind: 'reject',
  /**
   * Suggested http status.
   */
  status: number,
  /**
   * The type of rejection in effect.
   */
  rejection: string,
  failures: PayloadValueError[],
  /**
   * A script tag to embed in the document sent to the client, so it adopts this rejection rather than
   * working it out again.
   */
  payload: string,
  /**
   * The title of the rejection that rendered, for the document sent to the client.
   */
  title: string | undefined,
}

export type RenderRedirect = {
  kind: 'redirect',
  /**
   * Suggested http status.
   */
  status: RedirectStatus,
  /**
   * Value for the `Location` header.
   */
  location: string,
}

/**
 * The statuses the router reports for a redirect.
 */
export type RedirectStatus = 301 | 302

/** Context definitions are registered at runtime alongside their owning route. */
type ContextRoutes<TRoute extends Route> = Route extends TRoute
  ? Route
  : TRoute extends Route
    ? Extract<TRoute['context'][number], Route> | ContextRoutes<Extract<TRoute['context'][number], Route>>
    : never

type WithRouteContext<TRoutes extends Routes> = TRoutes | readonly ContextRoutes<TRoutes[number]>[]

type WithBuiltInRejections<TRoutes extends Routes> = 'NotFound' extends RoutesName<TRoutes>
  ? TRoutes
  : TRoutes | [Rejection<'NotFound'>]

export type RouterDefinitions<TRoutes extends Routes, TOptions extends RouterOptions, TPlugin extends RouterPlugin> = WithBuiltInRejections<WithRouteContext<TRoutes | TPlugin['routes'] | ExtractRejections<TOptions> | ExtractRejections<TPlugin>>>

export type RouterRejectionDefinitions<TRoutes extends Routes, TOptions extends RouterOptions, TPlugin extends RouterPlugin> = ExtractRouteRejections<RouterDefinitions<TRoutes, TOptions, TPlugin>>

export type Router<
  TRoutes extends Routes = any,
  TOptions extends RouterOptions = any,
  TPlugin extends RouterPlugin = any
> = {
  /**
   * Installs the router into a Vue application instance.
   * @param app The Vue application instance to install the router into
   */
  install: (app: App) => void,
  /**
   * Manages the current route state.
  */
  route: RouterRouteUnion<RouterDefinitions<TRoutes, TOptions, TPlugin>>,
  /**
   * Creates a ResolvedRoute record for a given route name and params.
   */
  resolve: RouterResolve<RouterDefinitions<TRoutes, TOptions, TPlugin>>,
  /**
   * Creates a ResolvedRoute record for a given URL.
   */
  find: (url: string, options?: RouterResolveOptions) => ResolvedRoute | undefined,
  /**
   * Navigates to a specified path or route object in the history stack, adding a new entry.
   */
  push: RouterPush<RouterDefinitions<TRoutes, TOptions, TPlugin>>,
  /**
   * Replaces the current entry in the history stack with a new one.
   */
  replace: RouterReplace<RouterDefinitions<TRoutes, TOptions, TPlugin>>,
  /**
   * Navigates to a rejection and returns a promise for the navigation.
   */
  reject: RouterReject<RouterRejectionDefinitions<TRoutes, TOptions, TPlugin>>,
  /**
   * Forces the router to re-evaluate the current route.
   */
  refresh: () => void,
  /**
   * Navigates to the previous entry in the browser's history stack.
   */
  back: () => void,
  /**
   * Navigates to the next entry in the browser's history stack.
   */
  forward: () => void,
  /**
   * Moves the current history entry to a specific point in the history stack.
   */
  go: (delta: number) => void,
  /**
   * Registers a hook to be called before a route is entered.
   */
  onBeforeRouteEnter: AddBeforeEnterHook<RouterDefinitions<TRoutes, TOptions, TPlugin>, RouterRejectionDefinitions<TRoutes, TOptions, TPlugin>>,
  /**
   * Registers a hook to be called before a route is left.
   */
  onBeforeRouteLeave: AddBeforeLeaveHook<RouterDefinitions<TRoutes, TOptions, TPlugin>, RouterRejectionDefinitions<TRoutes, TOptions, TPlugin>>,
  /**
   * Registers a hook to be called before a route is updated.
   */
  onBeforeRouteUpdate: AddBeforeUpdateHook<RouterDefinitions<TRoutes, TOptions, TPlugin>, RouterRejectionDefinitions<TRoutes, TOptions, TPlugin>>,
  /**
   * Registers a hook to be called after a route is entered.
   */
  onAfterRouteEnter: AddAfterEnterHook<RouterDefinitions<TRoutes, TOptions, TPlugin>, RouterRejectionDefinitions<TRoutes, TOptions, TPlugin>>,
  /**
   * Registers a hook to be called after a route is left.
   */
  onAfterRouteLeave: AddAfterLeaveHook<RouterDefinitions<TRoutes, TOptions, TPlugin>, RouterRejectionDefinitions<TRoutes, TOptions, TPlugin>>,
  /**
   * Registers a hook to be called after a route is updated.
   */
  onAfterRouteUpdate: AddAfterUpdateHook<RouterDefinitions<TRoutes, TOptions, TPlugin>, RouterRejectionDefinitions<TRoutes, TOptions, TPlugin>>,
  /**
   * Registers a hook to be called when an error occurs.
   * If the hook returns true, the error is considered handled and the other hooks are not run. If all hooks return false the error is rethrown
   */
  onError: AddErrorHook<RouterDefinitions<TRoutes, TOptions, TPlugin>, RouterRejectionDefinitions<TRoutes, TOptions, TPlugin>>,
  /**
  * Given a URL, returns true if host does not match host stored on router instance
  */
  isExternal: (url: string) => boolean,
  /**
   * Determines what assets are prefetched.
   */
  prefetch?: PrefetchConfig,
  /**
   * Initializes the router based on the initial route. Automatically called when the router is installed. Calling this more than once has no effect.
   */
  start: () => Promise<void>,
  /**
   * Returns true if the router has been started.
   */
  started: Ref<boolean>,
  /**
   * Resolves once the router has nothing left to render: every prop and loader has settled, following
   * any navigation one of them caused, so this waits for the next *full* render rather than for one
   * navigation. Resolves with what a server should respond with.
   *
   * Awaiting `push` only waits for the route to commit; this also waits for its data.
   *
   * Requires the router to be created with the `ssr` option, and throws `SsrOptionRequiredError`
   * without it.
   */
  render: () => Promise<ServerRenderResponse>,
  /**
   * Stops the router. Tears down the history listener and ignores any navigation still in flight or started afterwards.
   */
  stop: () => void,
  /**
   * Returns the key of the router.
   *
   * @private
   */
  key: InjectionKey<Router<TRoutes, TOptions, TPlugin>>,
  /**
   * Returns true if the router's devtools plugin has been installed
   * @private
   */
  hasDevtools: boolean,
}

/**
 * This type is the same as `RouterRoute<ResolvedRoute<TRoutes[number]>>` while remaining distributive.
 * Routes without a name (empty string) are excluded so that router.route.name is never ''.
 */
export type RouterRouteUnion<TRoutes extends Routes> = {
  [K in keyof TRoutes]: TRoutes[K]['name'] extends '' ? never : RouterRoute<ResolvedRoute<TRoutes[K]>>
}[number]

export type RouterRoutes<TRouter extends Router> = TRouter extends Router<infer TRoutes extends Routes, infer TOptions extends RouterOptions, infer TPlugin extends RouterPlugin>
  ? RouterDefinitions<TRoutes, TOptions, TPlugin>
  : Routes

export type RouterRejections<TRouter extends Router> = TRouter extends Router<infer TRoutes extends Routes, infer TOptions extends RouterOptions, infer TPlugins extends RouterPlugin>
  ? RouterRejectionDefinitions<TRoutes, TOptions, TPlugins>
  : []

export type RouterRouteName<TRouter extends Router> = RoutesName<RouterRoutes<TRouter>>
