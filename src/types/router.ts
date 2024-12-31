import { App, Component } from 'vue'
import { RouterHistoryMode } from '@/services/createRouterHistory'
import { RouterRoute } from '@/services/createRouterRoute'
import { AddAfterRouteHook, AddBeforeRouteHook } from '@/types/hooks'
import { PrefetchConfig } from '@/types/prefetch'
import { ResolvedRoute } from '@/types/resolved'
import { Routes } from '@/types/route'
import { RouterPush } from '@/types/routerPush'
import { RouterReplace } from '@/types/routerReplace'
import { RouterResolve, RouterResolveOptions } from '@/types/RouterResolve'
import { RouterReject } from './routerReject'
import { RouterPlugin } from './routerPlugin'
import { KeysOfUnion } from './utilities'

/**
 * Options to initialize a {@link Router} instance.
 */
export type RouterOptions = {
  /**
   * Initial URL for the router to use. Required if using Node environment. Defaults to window.location when using browser.
   *
   * @default window.location.toString()
   */
  initialUrl?: string,
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
  rejections?: Partial<Record<string, Component>>,
}

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
  route: RouterRoutes<TRoutes> | RouterRoutes<TPlugin['routes']>,
  /**
   * Creates a ResolvedRoute record for a given route name and params.
   */
  resolve: RouterResolve<TRoutes | TPlugin['routes']>,
  /**
   * Creates a ResolvedRoute record for a given URL.
   */
  find: (url: string, options?: RouterResolveOptions) => ResolvedRoute | undefined,
  /**
   * Navigates to a specified path or route object in the history stack, adding a new entry.
   */
  push: RouterPush<TRoutes | TPlugin['routes']>,
  /**
   * Replaces the current entry in the history stack with a new one.
   */
  replace: RouterReplace<TRoutes | TPlugin['routes']>,
  /**
   * Handles route rejection based on a specified rejection type.
   */
  reject: RouterReject<keyof TOptions['rejections'] | KeysOfUnion<TPlugin['rejections']>>,
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
  onBeforeRouteEnter: AddBeforeRouteHook,
  /**
   * Registers a hook to be called before a route is left.
   */
  onBeforeRouteLeave: AddBeforeRouteHook,
  /**
   * Registers a hook to be called before a route is updated.
   */
  onBeforeRouteUpdate: AddBeforeRouteHook,
  /**
   * Registers a hook to be called after a route is entered.
   */
  onAfterRouteEnter: AddAfterRouteHook,
  /**
   * Registers a hook to be called after a route is left.
   */
  onAfterRouteLeave: AddAfterRouteHook,
  /**
   * Registers a hook to be called after a route is updated.
   */
  onAfterRouteUpdate: AddAfterRouteHook,
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
   * Stops the router and teardown any listeners.
   */
  stop: () => void,
}

/**
 * This type is the same as `RouterRoute<ResolvedRoute<TRoutes[number]>>` while remaining distributive
 */
export type RouterRoutes<TRoutes extends Routes> = {
  [K in keyof TRoutes]: RouterRoute<ResolvedRoute<TRoutes[K]>>
}[number]
