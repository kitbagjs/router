import { FunctionPlugin } from 'vue'
import { RouterFind } from '@/services/createRouterFind'
import { RouterHistoryMode } from '@/services/createRouterHistory'
import { RouterRejectionComponents, RouterRejectionType } from '@/services/createRouterReject'
import { RouterResolve } from '@/services/createRouterResolve'
import { RouterRoute } from '@/services/createRouterRoute'
import { AddAfterRouteHook, AddBeforeRouteHook } from '@/types/hooks'
import { Path } from '@/types/path'
import { Query } from '@/types/query'
import { ResolvedRoute } from '@/types/resolved'
import { Route, Routes } from '@/types/route'
import { RouterPush } from '@/types/routerPush'
import { RouterReplace } from '@/types/routerReplace'

export type RouterReject = (type: RouterRejectionType) => void

/**
 * Options to initialize a {@link Router} instance.
 */
export type RouterOptions = {
  /**
   * Initial URL for the router to use. Required if using Node environment.
   *
   * @default window.location.toString()
   */
  initialUrl?: string,
  /**
   * Specifies the history mode for the router, such as 'hash', 'history', or 'abstract'.
   */
  historyMode?: RouterHistoryMode,
} & RouterRejectionComponents

export type Router<
  TRoutes extends Routes = Route<string, Path, Query, false>[]
> = {
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
  reject: RouterReject,
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
   * A promise that resolves when the router is fully initialized.
   */
  initialized: Promise<void>,
  install: FunctionPlugin,
}

/**
 * This type is the same as `RouterRoute<ResolvedRoute<TRoutes[number]>>` while remaining distributive
 */
export type RouterRoutes<TRoutes extends Routes> = {
  [K in keyof TRoutes]: RouterRoute<ResolvedRoute<TRoutes[K]>>
}[number]
