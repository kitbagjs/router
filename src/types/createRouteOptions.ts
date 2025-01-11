import { Component } from 'vue'
import { combineHash } from '@/services/combineHash'
import { combineMeta } from '@/services/combineMeta'
import { combinePath } from '@/services/combinePath'
import { combineQuery } from '@/services/combineQuery'
import { combineState } from '@/services/combineState'
import { ComponentProps } from '@/services/component'
import { Hash } from '@/types/hash'
import { Host } from '@/types/host'
import { Param } from '@/types/paramTypes'
import { Path } from '@/types/path'
import { PrefetchConfig } from '@/types/prefetch'
import { Query } from '@/types/query'
import { RouteMeta } from '@/types/register'
import { Route } from '@/types/route'
import { MaybePromise } from '@/types/utilities'
import { PropsCallbackContext } from '@/types/props'
import { WithHooks } from '@/types/hooks'

export type WithHost<THost extends string | Host = string | Host> = {
  /**
   * Host part of URL.
   */
  host: THost,
}

export function isWithHost(options: CreateRouteOptions): options is CreateRouteOptions & WithHost {
  return 'host' in options && Boolean(options.host)
}

export type WithoutHost = {
  host?: never,
}

export type WithParent<TParent extends Route = Route> = {
  parent: TParent,
}

export function isWithParent<T extends Record<string, unknown>>(options: T): options is T & WithParent {
  return 'parent' in options && Boolean(options.parent)
}

export type WithoutParent = {
  parent?: never,
}

export type ComponentContext<
  TRoute extends CreateRouteOptions = CreateRouteOptions,
  TComponent extends Component = Component
> = {
  /**
   * A Vue component, which can be either synchronous or asynchronous components.
   */
  component: TComponent,
  props?: (route: TRoute, context: PropsCallbackContext) => MaybePromise<ComponentProps<TComponent>>,
}

export type CreateRouteOptions = {
  /**
   * Name for route, used to create route keys and in navigation.
   */
  name?: string | undefined,
  /**
   * Path part of URL.
   */
  path?: string | Path | undefined,
  /**
   * Query (aka search) part of URL.
   */
  query?: string | Query | undefined,
  /**
   * Hash part of URL.
   */
  hash?: string | Hash | undefined,
  /**
   * Represents additional metadata associated with a route, customizable via declaration merging.
   */
  meta?: RouteMeta,
  /**
   * Determines what assets are prefetched when router-link is rendered for this route. Overrides router level prefetch.
   */
  prefetch?: PrefetchConfig,
  /**
   * Type params for additional data intended to be stored in history state, all keys will be optional unless a default is provided.
   */
  state?: Record<string, Param>,
  /**
   * This property is moved to the `ComponentContext` (2nd argument of `createRoute`).
   */
  component?: never,
  /**
   * This property is moved to the `ComponentContext` (2nd argument of `createRoute`).
   */
  components?: never,
}
& WithHooks

export function combineRoutes(parent: Route, child: Route): Route {
  return {
    ...child,
    path: combinePath(parent.path, child.path),
    query: combineQuery(parent.query, child.query),
    meta: combineMeta(parent.meta, child.meta),
    state: combineState(parent.state, child.state),
    hash: combineHash(parent.hash, child.hash),
    matches: [...parent.matches, child.matched],
    host: parent.host,
    depth: parent.depth + 1,
  }
}
