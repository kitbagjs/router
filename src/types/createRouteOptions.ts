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
  TRoute extends Route = Route
> = {
  /**
   * A Vue component, which can be either synchronous or asynchronous components.
   */
  component: TComponent,
  props?: (route: ResolvedRoute<TRoute>, context: PropsCallbackContext) => TComponent extends Component ? MaybePromise<ComponentProps<TComponent>> : {},
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

export type WithState<TState extends Record<string, Param> = Record<string, Param>> = {
  /**
   * Type params for additional data intended to be stored in history state, all keys will be optional unless a default is provided.
   */
  state: TState,
}

export function isWithState(options: CreateRouteOptions): options is CreateRouteOptions & WithState {
  return 'state' in options && Boolean(options.state)
}

export type WithoutState = {
  state?: never,
}

export type CreateRouteOptions<
  TName extends string | undefined = string | undefined,
  TPath extends string | Path | undefined = string | Path | undefined,
  TQuery extends string | Query | undefined = string | Query | undefined,
  THash extends string | Hash | undefined = string | Hash | undefined,
  TMeta extends RouteMeta = RouteMeta,
  TState extends Record<string, Param> = Record<string, Param>
> = {
  /**
   * Name for route, used to create route keys and in navigation.
   */
  name?: TName,
  /**
   * Path part of URL.
   */
  path?: TPath,
  /**
   * Query (aka search) part of URL.
   */
  query?: TQuery,
  /**
   * Hash part of URL.
   */
  hash?: THash,
  /**
   * Represents additional metadata associated with a route, customizable via declaration merging.
   */
  meta?: TMeta,
  /**
   * Determines what assets are prefetched when router-link is rendered for this route. Overrides router level prefetch.
   */
  prefetch?: PrefetchConfig,
}
& WithHooks
& (WithState<TState> | WithoutState)

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
