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
import { ResolvedRoute } from '@/types/resolved'
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

export type WithComponent<
  TComponent extends Component = Component,
  TProps extends (route: ResolvedRoute, context: PropsCallbackContext) => MaybePromise<ComponentProps<TComponent>> = (route: ResolvedRoute, context: PropsCallbackContext) => MaybePromise<ComponentProps<TComponent>>
> = {
  /**
   * A Vue component, which can be either synchronous or asynchronous components.
   */
  component: TComponent,
  props?: TProps,
}

export function isWithComponent(options: CreateRouteOptions): options is CreateRouteOptions & WithComponent {
  return 'component' in options && Boolean(options.component)
}

export type WithComponents<
  TComponents extends Record<string, Component> = Record<string, Component>,
  TRoute extends Route = Route
> = {
  /**
   * Multiple components for named views, which can be either synchronous or asynchronous components.
   */
  components: TComponents,
  props?: {
    [TKey in keyof TComponents]?: (route: ResolvedRoute<TRoute>, context: PropsCallbackContext) => TComponents[TKey] extends Component ? MaybePromise<ComponentProps<TComponents[TKey]>> : {}
  },
}

export type WithoutComponents = {
  component?: never,
  components?: never,
  props?: never,
}

export function isWithComponents(options: CreateRouteOptions): options is CreateRouteOptions & WithComponents {
  return 'components' in options && Boolean(options.components)
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
