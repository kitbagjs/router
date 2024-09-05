import { Component, Plugin } from 'vue'
import { RouterHistoryMode } from '@/services/createRouterHistory'
import { RejectionType } from '@/services/createRouterReject'
import { RouterResolve } from '@/services/createRouterResolve'
import { RouterRoute } from '@/services/createRouterRoute'
import { AddAfterRouteHook, AddBeforeRouteHook } from '@/types/hooks'
import { PrefetchConfig } from '@/types/prefetch'
import { RegisteredRejectionType } from '@/types/register'
import { ResolvedRoute } from '@/types/resolved'
import { Routes } from '@/types/route'
import { RouterFind } from '@/types/routerFind'
import { RouterPush } from '@/types/routerPush'
import { RouterReplace } from '@/types/routerReplace'

export type RouterReject<TOptions extends RouterOptions = RouterOptions> = (type: RouterOptions extends TOptions ? RegisteredRejectionType : RejectionType<TOptions>) => void

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
  TOptions extends RouterOptions = any
> = Plugin & {
  /**
   * Manages the current route state.
  */
  route: RouterRoutes<TRoutes>,
  /**
   * Resolves a URL to a route object.
   */
  resolve: RouterResolve<TRoutes>,
  /**
   * Navigates to a specified path or route object in the history stack, adding a new entry.
   */
  push: RouterPush<TRoutes>,
  /**
   * Replaces the current entry in the history stack with a new one.
   */
  replace: RouterReplace<TRoutes>,
  /**
   * Finds a route object based on the provided lookup parameters.
   */
  find: RouterFind<TRoutes>,
  /**
   * Handles route rejection based on a specified rejection type.
   */
  reject: RouterReject<TOptions>,
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
  onBeforeRouteEnter: AddBeforeRouteHook<TOptions>,
  /**
   * Registers a hook to be called before a route is left.
   */
  onBeforeRouteLeave: AddBeforeRouteHook<TOptions>,
  /**
   * Registers a hook to be called before a route is updated.
   */
  onBeforeRouteUpdate: AddBeforeRouteHook<TOptions>,
  /**
   * Registers a hook to be called after a route is entered.
   */
  onAfterRouteEnter: AddAfterRouteHook<TOptions>,
  /**
   * Registers a hook to be called after a route is left.
   */
  onAfterRouteLeave: AddAfterRouteHook<TOptions>,
  /**
   * Registers a hook to be called after a route is updated.
   */
  onAfterRouteUpdate: AddAfterRouteHook<TOptions>,
  /**
   * A promise that resolves when the router is fully initialized.
   */
  initialized: Promise<void>,
  /**
  * Given a URL, returns true if host does not match host stored on router instance
  */
  isExternal: (url: string) => boolean,
  /**
   * Determines what assets are prefetched.
   */
  prefetch?: PrefetchConfig,
}

/**
 * This type is the same as `RouterRoute<ResolvedRoute<TRoutes[number]>>` while remaining distributive
 */
export type RouterRoutes<TRoutes extends Routes> = {
  [K in keyof TRoutes]: RouterRoute<ResolvedRoute<TRoutes[K]>>
}[number]